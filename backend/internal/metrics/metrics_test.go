package metrics

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// scrape renders the metrics exposition for m.
func scrape(t *testing.T, m *Metrics) string {
	t.Helper()
	rec := httptest.NewRecorder()
	m.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/metrics", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("metrics handler status = %d, want 200", rec.Code)
	}
	return rec.Body.String()
}

func assertContains(t *testing.T, body, want string) {
	t.Helper()
	if !strings.Contains(body, want) {
		t.Errorf("metrics output missing %q\n--- body ---\n%s", want, body)
	}
}

func TestRecordCountAndListError(t *testing.T) {
	m := New()
	m.SetRecordCount(3)
	m.RecordEtcdListError()
	m.RecordEtcdListError()

	body := scrape(t, m)
	assertContains(t, body, "auto_dns_webui_dns_records 3")
	assertContains(t, body, "auto_dns_webui_etcd_list_errors_total 2")
}

func TestMCPToolCalls(t *testing.T) {
	m := New()
	m.RecordMCPToolCall("list_dns_records")
	m.RecordMCPToolCall("list_dns_records")
	m.RecordMCPToolCall("get_dns_record")

	body := scrape(t, m)
	assertContains(t, body, `auto_dns_webui_mcp_tool_calls_total{tool="list_dns_records"} 2`)
	assertContains(t, body, `auto_dns_webui_mcp_tool_calls_total{tool="get_dns_record"} 1`)
}

func TestInstrumentHandler(t *testing.T) {
	m := New()
	wrapped := m.InstrumentHandler("/api/records", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	}))

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/records", nil))
	if rec.Code != http.StatusTeapot {
		t.Fatalf("wrapped handler status = %d, want 418 (wrapper must pass through)", rec.Code)
	}

	body := scrape(t, m)
	assertContains(t, body, `auto_dns_webui_http_requests_total{code="418",method="GET",route="/api/records"} 1`)
	assertContains(t, body, `auto_dns_webui_http_request_duration_seconds_count{method="GET",route="/api/records"} 1`)
}

// TestInstrumentHandlerDefaultStatus verifies a handler that writes a body
// without an explicit WriteHeader is recorded as 200.
func TestInstrumentHandlerDefaultStatus(t *testing.T) {
	m := New()
	wrapped := m.InstrumentHandler("/healthz", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("ok"))
	}))

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	body := scrape(t, m)
	assertContains(t, body, `auto_dns_webui_http_requests_total{code="200",method="GET",route="/healthz"} 1`)
}
