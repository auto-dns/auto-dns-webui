package registry

import (
	"context"
	"testing"

	"github.com/rs/zerolog"
	mvccpb "go.etcd.io/etcd/api/v3/mvccpb"
	clientv3 "go.etcd.io/etcd/client/v3"

	"github.com/auto-dns/auto-dns-webui/internal/config"
)

// mockEtcdClient implements the etcdClient interface with an overridable Get.
type mockEtcdClient struct {
	getFunc func(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error)
}

func (m *mockEtcdClient) Get(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error) {
	return m.getFunc(ctx, key, opts...)
}

func (m *mockEtcdClient) Close() error { return nil }

func newTestRegistry(client etcdClient) *EtcdRegistry {
	return NewEtcdRegistry(client, &config.EtcdConfig{PathPrefix: "/skydns"}, zerolog.Nop())
}

func TestParseEtcdValue(t *testing.T) {
	er := newTestRegistry(nil) // parseEtcdValue does not touch the client

	t.Run("valid A record reverses domain and strips index", func(t *testing.T) {
		rec, err := er.parseEtcdValue(
			"/skydns/com/example/app/x1",
			`{"host":"10.0.0.1","record_type":"a","owner_hostname":"h1","owner_container_id":"abc","owner_container_name":"web","created":"2024-01-02T03:04:05Z","force":true}`,
		)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if rec.Dns.Name != "app.example.com" {
			t.Errorf("name = %q, want app.example.com", rec.Dns.Name)
		}
		if rec.Dns.Type != "A" {
			t.Errorf("type = %q, want A (uppercased)", rec.Dns.Type)
		}
		if rec.Dns.Value != "10.0.0.1" {
			t.Errorf("value = %q, want 10.0.0.1", rec.Dns.Value)
		}
		if rec.Meta.Hostname != "h1" || rec.Meta.ContainerID != "abc" || rec.Meta.ContainerName != "web" || !rec.Meta.Force {
			t.Errorf("metadata not parsed correctly: %+v", rec.Meta)
		}
		if rec.Meta.Created.IsZero() {
			t.Error("created timestamp not parsed")
		}
	})

	t.Run("CNAME type", func(t *testing.T) {
		rec, err := er.parseEtcdValue("/skydns/com/example/www/x1",
			`{"host":"app.example.com","record_type":"CNAME","created":"2024-01-02T03:04:05Z"}`)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if rec.Dns.Type != "CNAME" || rec.Dns.Value != "app.example.com" {
			t.Errorf("unexpected CNAME parse: %+v", rec.Dns)
		}
	})

	errorCases := []struct {
		name  string
		key   string
		value string
	}{
		{"missing record_type", "/skydns/com/example/app/x1", `{"host":"10.0.0.1","created":"2024-01-02T03:04:05Z"}`},
		{"missing host", "/skydns/com/example/app/x1", `{"record_type":"A","created":"2024-01-02T03:04:05Z"}`},
		{"bad created", "/skydns/com/example/app/x1", `{"host":"10.0.0.1","record_type":"A","created":"not-a-time"}`},
		{"invalid json", "/skydns/com/example/app/x1", `{not json}`},
	}
	for _, tc := range errorCases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := er.parseEtcdValue(tc.key, tc.value); err == nil {
				t.Fatalf("%s: expected error, got nil", tc.name)
			}
		})
	}
}

func TestList(t *testing.T) {
	t.Run("parses valid records and skips invalid ones", func(t *testing.T) {
		client := &mockEtcdClient{
			getFunc: func(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error) {
				return &clientv3.GetResponse{Kvs: []*mvccpb.KeyValue{
					{Key: []byte("/skydns/com/example/app/x1"), Value: []byte(`{"host":"10.0.0.1","record_type":"A","created":"2024-01-02T03:04:05Z"}`)},
					{Key: []byte("/skydns/com/example/bad/x1"), Value: []byte(`{bad json}`)},
				}}, nil
			},
		}
		recs, err := newTestRegistry(client).List(context.Background())
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(recs) != 1 {
			t.Fatalf("got %d records, want 1 (the invalid one should be skipped)", len(recs))
		}
		if recs[0].Dns.Name != "app.example.com" {
			t.Errorf("name = %q, want app.example.com", recs[0].Dns.Name)
		}
	})

	t.Run("propagates get error", func(t *testing.T) {
		client := &mockEtcdClient{
			getFunc: func(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error) {
				return nil, context.DeadlineExceeded
			},
		}
		if _, err := newTestRegistry(client).List(context.Background()); err == nil {
			t.Fatal("expected error to propagate from client.Get")
		}
	})
}

func TestPing(t *testing.T) {
	t.Run("ok when etcd answers", func(t *testing.T) {
		client := &mockEtcdClient{
			getFunc: func(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error) {
				return &clientv3.GetResponse{}, nil
			},
		}
		if err := newTestRegistry(client).Ping(context.Background()); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("error when etcd unreachable", func(t *testing.T) {
		client := &mockEtcdClient{
			getFunc: func(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error) {
				return nil, context.DeadlineExceeded
			},
		}
		if err := newTestRegistry(client).Ping(context.Background()); err == nil {
			t.Fatal("expected error from Ping when client.Get fails")
		}
	})
}
