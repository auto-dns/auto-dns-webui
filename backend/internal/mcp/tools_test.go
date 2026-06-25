package mcphandler

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/rs/zerolog"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

type mockDNSRegistry struct {
	records []*dns.Record
	err     error
}

func (m *mockDNSRegistry) List(ctx context.Context) ([]*dns.Record, error) {
	return m.records, m.err
}

func sampleRecords() []*dns.Record {
	created := time.Date(2024, 1, 2, 3, 4, 5, 0, time.UTC)
	return []*dns.Record{
		{Dns: dns.DnsRecord{Name: "app.example.com", Type: "A", Value: "10.0.0.1"}, Meta: dns.RecordMetadata{Hostname: "alpha", Created: created}},
		{Dns: dns.DnsRecord{Name: "db.example.com", Type: "AAAA", Value: "fd00::1"}, Meta: dns.RecordMetadata{Hostname: "beta", Created: created}},
		{Dns: dns.DnsRecord{Name: "www.example.com", Type: "CNAME", Value: "app.example.com"}, Meta: dns.RecordMetadata{Hostname: "alpha", Created: created}},
	}
}

func newReq(args map[string]any) mcp.CallToolRequest {
	var req mcp.CallToolRequest
	req.Params.Arguments = args
	return req
}

// decode parses the JSON text payload of a successful tool result.
func decode(t *testing.T, res *mcp.CallToolResult) listRecordsOut {
	t.Helper()
	if res.IsError {
		t.Fatalf("tool returned an error result: %v", res.Content)
	}
	tc, ok := res.Content[0].(mcp.TextContent)
	if !ok {
		t.Fatalf("content[0] is not TextContent: %T", res.Content[0])
	}
	var out listRecordsOut
	if err := json.Unmarshal([]byte(tc.Text), &out); err != nil {
		t.Fatalf("result text is not valid JSON: %v", err)
	}
	return out
}

func TestListDNSRecords_Filters(t *testing.T) {
	d := Deps{Registry: &mockDNSRegistry{records: sampleRecords()}, Logger: zerolog.Nop()}
	handler := makeListDNSRecords(d)

	tests := []struct {
		name string
		args map[string]any
		want int
	}{
		{"no filter returns all", map[string]any{}, 3},
		{"type filter A", map[string]any{"type": "a"}, 1},
		{"name substring", map[string]any{"name": "EXAMPLE"}, 3},
		{"name substring narrow", map[string]any{"name": "db"}, 1},
		{"hostname filter", map[string]any{"hostname": "alpha"}, 2},
		{"combined type+hostname", map[string]any{"type": "CNAME", "hostname": "alpha"}, 1},
		{"no match", map[string]any{"hostname": "ghost"}, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, err := handler(context.Background(), newReq(tt.args))
			if err != nil {
				t.Fatalf("handler error: %v", err)
			}
			out := decode(t, res)
			if out.Total != tt.want || len(out.Records) != tt.want {
				t.Errorf("total = %d (records %d), want %d", out.Total, len(out.Records), tt.want)
			}
		})
	}
}

func TestGetDNSRecord_NormalizesTrailingDot(t *testing.T) {
	d := Deps{Registry: &mockDNSRegistry{records: sampleRecords()}, Logger: zerolog.Nop()}
	handler := makeGetDNSRecord(d)

	res, err := handler(context.Background(), newReq(map[string]any{"name": "APP.example.com."}))
	if err != nil {
		t.Fatalf("handler error: %v", err)
	}
	out := decode(t, res)
	if out.Total != 1 || out.Records[0].Name != "app.example.com" {
		t.Errorf("expected exactly app.example.com, got %+v", out.Records)
	}
}

func TestGetRecordsByHost(t *testing.T) {
	d := Deps{Registry: &mockDNSRegistry{records: sampleRecords()}, Logger: zerolog.Nop()}
	handler := makeGetRecordsByHost(d)

	t.Run("returns host subset", func(t *testing.T) {
		res, err := handler(context.Background(), newReq(map[string]any{"hostname": "alpha"}))
		if err != nil {
			t.Fatalf("handler error: %v", err)
		}
		if out := decode(t, res); out.Total != 2 {
			t.Errorf("total = %d, want 2", out.Total)
		}
	})

	t.Run("missing hostname is an error", func(t *testing.T) {
		res, err := handler(context.Background(), newReq(map[string]any{}))
		if err != nil {
			t.Fatalf("handler returned transport error: %v", err)
		}
		if !res.IsError {
			t.Error("expected IsError result when hostname is empty")
		}
	})
}

func TestListDNSRecords_RegistryError(t *testing.T) {
	d := Deps{Registry: &mockDNSRegistry{err: errors.New("etcd down")}, Logger: zerolog.Nop()}
	res, err := makeListDNSRecords(d)(context.Background(), newReq(map[string]any{}))
	if err != nil {
		t.Fatalf("handler returned transport error: %v", err)
	}
	if !res.IsError {
		t.Error("expected IsError result when registry.List fails")
	}
}
