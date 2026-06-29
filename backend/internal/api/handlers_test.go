package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/rs/zerolog"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
	"github.com/auto-dns/auto-dns-webui/internal/metrics"
)

// mockRegistry implements registry.Registry for handler tests.
type mockRegistry struct {
	records []*dns.Record
	err     error
}

func (m *mockRegistry) List(ctx context.Context) ([]*dns.Record, error) { return m.records, m.err }
func (m *mockRegistry) Watch(ctx context.Context) (<-chan struct{}, error) {
	return nil, m.err
}
func (m *mockRegistry) Ping(ctx context.Context) error { return m.err }
func (m *mockRegistry) Close() error                   { return nil }

func TestRecords_Success(t *testing.T) {
	reg := &mockRegistry{records: []*dns.Record{
		{
			Dns:  dns.DnsRecord{Name: "app.example.com", Type: "A", Value: "10.0.0.1"},
			Meta: dns.RecordMetadata{Hostname: "h1", Created: time.Now()},
		},
	}}
	h := NewHandler(reg, metrics.New(), zerolog.Nop())

	req := httptest.NewRequest(http.MethodGet, "/api/records", nil)
	rec := httptest.NewRecorder()
	h.Records(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("content-type = %q, want application/json", ct)
	}
	var got []*dns.Record
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}
	if len(got) != 1 || got[0].Dns.Name != "app.example.com" {
		t.Errorf("unexpected body: %s", rec.Body.String())
	}
}

func TestRecords_RegistryError(t *testing.T) {
	h := NewHandler(&mockRegistry{err: errors.New("etcd down")}, metrics.New(), zerolog.Nop())

	req := httptest.NewRequest(http.MethodGet, "/api/records", nil)
	rec := httptest.NewRecorder()
	h.Records(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
}
