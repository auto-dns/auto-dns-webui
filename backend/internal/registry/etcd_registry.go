package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	clientv3 "go.etcd.io/etcd/client/v3"

	"github.com/auto-dns/auto-dns-webui/internal/config"
	"github.com/auto-dns/auto-dns-webui/internal/dns"
	"github.com/rs/zerolog"
)

// etcdClient is the subset of clientv3.Client this read-only app needs.
type etcdClient interface {
	Get(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error)
	Watch(ctx context.Context, key string, opts ...clientv3.OpOption) clientv3.WatchChan
	Close() error
}

type EtcdRegistry struct {
	client etcdClient
	cfg    *config.EtcdConfig
	logger zerolog.Logger
}

func NewEtcdRegistry(client etcdClient, cfg *config.EtcdConfig, logger zerolog.Logger) *EtcdRegistry {
	return &EtcdRegistry{
		client: client,
		cfg:    cfg,
		logger: logger,
	}
}

// parseEtcdValue converts an etcd key/value pair into a dns Record struct.
func (er *EtcdRegistry) parseEtcdValue(key, value string) (*dns.Record, error) {
	// Remove the configured prefix.
	path := strings.TrimPrefix(key, er.cfg.PathPrefix)
	path = strings.TrimPrefix(path, "/")
	parts := strings.Split(path, "/")
	// If the last part is an index (starts with "x"), remove it.
	if len(parts) > 0 {
		last := parts[len(parts)-1]
		if len(last) > 0 && last[0] == 'x' {
			parts = parts[:len(parts)-1]
		}
	}
	// Reconstruct FQDN by reversing parts.
	for i, j := 0, len(parts)-1; i < j; i, j = i+1, j-1 {
		parts[i], parts[j] = parts[j], parts[i]
	}
	fqdn := strings.Join(parts, ".")
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(value), &data); err != nil {
		return nil, err
	}
	recType, ok := data["record_type"].(string)
	if !ok || recType == "" {
		return nil, fmt.Errorf("missing record_type in etcd record: %v", data)
	}
	host, ok := data["host"].(string)
	if !ok || host == "" {
		return nil, fmt.Errorf("missing host in etcd record: %v", data)
	}
	ownerHostname, _ := data["owner_hostname"].(string)
	ownerContainerID, _ := data["owner_container_id"].(string)
	ownerContainerName, _ := data["owner_container_name"].(string)
	createdStr, _ := data["created"].(string)
	created, err := time.Parse(time.RFC3339, createdStr)
	if err != nil {
		return nil, err
	}
	force, _ := data["force"].(bool)

	rec := &dns.Record{
		Dns: dns.DnsRecord{
			Name:  fqdn,
			Type:  strings.ToUpper(recType),
			Value: host,
		},
		Meta: dns.RecordMetadata{
			ContainerID:   ownerContainerID,
			ContainerName: ownerContainerName,
			Created:       created,
			Hostname:      ownerHostname,
			Force:         force,
		},
	}
	return rec, nil
}

// List retrieves all records stored in etcd under the configured prefix.
func (er *EtcdRegistry) List(ctx context.Context) ([]*dns.Record, error) {
	prefix := er.cfg.PathPrefix
	resp, err := er.client.Get(ctx, prefix, clientv3.WithPrefix())
	if err != nil {
		return nil, err
	}
	var records []*dns.Record
	for _, kv := range resp.Kvs {
		keyStr := string(kv.Key)
		record, err := er.parseEtcdValue(keyStr, string(kv.Value))
		if err != nil {
			er.logger.Error().Err(err).Msgf("Failed to parse key: %s", keyStr)
			continue
		}
		records = append(records, record)
	}
	return records, nil
}

// ListHeartbeats returns the set of hostnames currently publishing a
// lease-backed liveness heartbeat. docker-coredns-sync writes one key per host
// at "{heartbeat_prefix}/{hostname}" outside the DNS-record prefix (so CoreDNS
// never serves it) and keeps it alive with a lease while the node runs; the key
// disappears automatically when the node stops renewing. A hostname present in
// the returned set is therefore considered online. The read is keys-only — the
// hostname is taken from the key suffix and the value is not needed.
func (er *EtcdRegistry) ListHeartbeats(ctx context.Context) (map[string]bool, error) {
	prefix := er.cfg.HeartbeatPrefix
	resp, err := er.client.Get(ctx, prefix, clientv3.WithPrefix(), clientv3.WithKeysOnly())
	if err != nil {
		return nil, err
	}
	trim := strings.TrimSuffix(prefix, "/") + "/"
	online := make(map[string]bool, len(resp.Kvs))
	for _, kv := range resp.Kvs {
		hostname := strings.TrimPrefix(string(kv.Key), trim)
		if hostname != "" {
			online[hostname] = true
		}
	}
	return online, nil
}

// Watch establishes an etcd watch on the configured prefix and returns a
// channel that emits a value whenever the record set under that prefix changes.
// Notifications are coalesced: the channel has a buffer of one and a pending
// notification is dropped rather than blocking, so a burst of etcd events
// surfaces as a single "something changed" signal — consumers re-List to get
// the current state. The channel is closed when the watch ends (ctx cancelled,
// or the watch is cancelled/errors by etcd), which signals the consumer to
// re-establish it.
func (er *EtcdRegistry) Watch(ctx context.Context) (<-chan struct{}, error) {
	wch := er.client.Watch(ctx, er.cfg.PathPrefix, clientv3.WithPrefix())
	out := make(chan struct{}, 1)
	go func() {
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return
			case resp, ok := <-wch:
				if !ok {
					return
				}
				if err := resp.Err(); err != nil {
					er.logger.Error().Err(err).Msg("etcd watch error")
					return
				}
				if len(resp.Events) == 0 {
					continue
				}
				select {
				case out <- struct{}{}:
				default:
				}
			}
		}
	}()
	return out, nil
}

// Ping performs a cheap reachability check against etcd. It issues a bounded,
// keys-only range read under the configured prefix (at most one key) and
// reports only whether etcd answered — the result is discarded.
func (er *EtcdRegistry) Ping(ctx context.Context) error {
	_, err := er.client.Get(ctx, er.cfg.PathPrefix, clientv3.WithPrefix(), clientv3.WithLimit(1), clientv3.WithKeysOnly())
	return err
}

func (er *EtcdRegistry) Close() error {
	return er.client.Close()
}
