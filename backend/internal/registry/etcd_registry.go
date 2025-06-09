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

type etcdClient interface {
	Get(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error)
	Put(ctx context.Context, key, val string, opts ...clientv3.OpOption) (*clientv3.PutResponse, error)
	Delete(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.DeleteResponse, error)
	Grant(ctx context.Context, ttl int64) (*clientv3.LeaseGrantResponse, error)
	Txn(ctx context.Context) clientv3.Txn
	Revoke(ctx context.Context, id clientv3.LeaseID) (*clientv3.LeaseRevokeResponse, error)
	Close() error
}

type EtcdRegistry struct {
	client   etcdClient
	cfg      *config.EtcdConfig
	hostname string
	logger   zerolog.Logger
}

func NewEtcdRegistry(client etcdClient, cfg *config.EtcdConfig, hostname string, logger zerolog.Logger) *EtcdRegistry {
	return &EtcdRegistry{
		client:   client,
		cfg:      cfg,
		hostname: hostname,
		logger:   logger,
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

// Remove finds and deletes the etcd key that matches the record.
func (er *EtcdRegistry) Remove(ctx context.Context, record *dns.Record) error {
	fqdn := record.Dns.Name
	trimmed := strings.Trim(fqdn, ".")
	parts := strings.Split(trimmed, ".")
	// Reverse parts.
	for i, j := 0, len(parts)-1; i < j; i, j = i+1, j-1 {
		parts[i], parts[j] = parts[j], parts[i]
	}
	baseKey := fmt.Sprintf("%s/%s", er.cfg.PathPrefix, strings.Join(parts, "/"))
	resp, err := er.client.Get(ctx, baseKey, clientv3.WithPrefix())
	if err != nil {
		return err
	}
	for _, kv := range resp.Kvs {
		keyStr := string(kv.Key)
		var data map[string]interface{}
		if err := json.Unmarshal(kv.Value, &data); err != nil {
			er.logger.Warn().Err(err).Msgf("Could not parse key %s", keyStr)
			continue
		}
		// Match based on record fields.
		if data["host"] == record.Dns.Value &&
			data["record_type"] == record.Dns.Type &&
			data["owner_hostname"] == record.Meta.Hostname &&
			data["owner_container_name"] == record.Meta.ContainerName {
			_, err := er.client.Delete(ctx, keyStr)
			if err != nil {
				er.logger.Warn().Err(err).Msgf("Failed to delete key %s", keyStr)
				return err
			}
			er.logger.Info().Msgf("Deleted key %s", keyStr)
			return nil
		}
	}
	return nil
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

// LockTransaction provides a distributed lock using etcd transactions.
// It takes keys (as a slice of string), tries to acquire locks on all of them,
// runs the function, and finally releases all locks.
func (er *EtcdRegistry) LockTransaction(ctx context.Context, keys []string, fn func() error) error {
	// Ensure unique sorted keys.
	uniqueKeys := keys
	leases := make([]struct {
		lockKey string
		lease   clientv3.LeaseID
	}, 0)

	for _, key := range uniqueKeys {
		lockKey := fmt.Sprintf("/locks/%s", key)
		leaseResp, err := er.client.Grant(ctx, int64(er.cfg.LockTTL))
		if err != nil {
			return fmt.Errorf("failed to create lease: %w", err)
		}
		acquired := false
		start := time.Now()
		for time.Since(start) < time.Duration(er.cfg.LockTimeout)*time.Second {
			txnResp, err := er.client.Txn(ctx).
				If(clientv3.Compare(clientv3.CreateRevision(lockKey), "=", 0)).
				Then(clientv3.OpPut(lockKey, er.hostname, clientv3.WithLease(leaseResp.ID))).
				Commit()
			if err != nil {
				return err
			}
			if txnResp.Succeeded {
				acquired = true
				leases = append(leases, struct {
					lockKey string
					lease   clientv3.LeaseID
				}{lockKey, leaseResp.ID})
				break
			}
			time.Sleep(time.Duration(er.cfg.LockRetryInterval * float64(time.Second)))
		}
		if !acquired {
			return fmt.Errorf("failed to acquire lock on %s", key)
		}
	}

	// Execute the provided function with locks held.
	err := fn()

	// Release the locks in reverse order.
	for i := len(leases) - 1; i >= 0; i-- {
		l := leases[i]
		_, errDel := er.client.Delete(ctx, l.lockKey)
		if errDel != nil {
			er.logger.Warn().Err(errDel).Msgf("failed to delete lock key %s", l.lockKey)
		}
		_, errRevoke := er.client.Revoke(ctx, l.lease)
		if errRevoke != nil {
			er.logger.Warn().Err(errRevoke).Msgf("failed to revoke lease for %s", l.lockKey)
		}
	}
	return err
}

func (er *EtcdRegistry) Close() error {
	return er.client.Close()
}
