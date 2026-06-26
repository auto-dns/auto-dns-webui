package mcphandler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/rs/zerolog"

	"github.com/auto-dns/auto-dns-webui/internal/metrics"
)

// TestInstrumentRecordsToolCall verifies the instrument wrapper increments the
// per-tool call counter.
func TestInstrumentRecordsToolCall(t *testing.T) {
	m := metrics.New()
	d := Deps{Registry: &mockDNSRegistry{records: sampleRecords()}, Metrics: m, Logger: zerolog.Nop()}

	h := instrument(d, "list_dns_records", makeListDNSRecords(d))
	if _, err := h(context.Background(), newReq(nil)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	rec := httptest.NewRecorder()
	m.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if !strings.Contains(rec.Body.String(), `auto_dns_webui_mcp_tool_calls_total{tool="list_dns_records"} 1`) {
		t.Errorf("tool-call counter not recorded\n--- body ---\n%s", rec.Body.String())
	}
}

// TestInstrumentNilMetricsSafe ensures a nil Metrics (e.g. in tests) does not
// panic.
func TestInstrumentNilMetricsSafe(t *testing.T) {
	d := Deps{Registry: &mockDNSRegistry{records: sampleRecords()}, Logger: zerolog.Nop()}
	h := instrument(d, "list_dns_records", makeListDNSRecords(d))
	if _, err := h(context.Background(), newReq(nil)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
