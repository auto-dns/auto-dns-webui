// Package metrics exposes Prometheus instrumentation for the service.
//
// A Metrics value owns its own prometheus.Registry (rather than the global
// default) so that instances are isolated and unit tests can construct a fresh
// one without "duplicate metrics collector registration" panics.
package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics holds the application's Prometheus collectors and the registry they
// are registered with.
type Metrics struct {
	registry       *prometheus.Registry
	httpRequests   *prometheus.CounterVec
	httpDuration   *prometheus.HistogramVec
	etcdListErrors prometheus.Counter
	recordCount    prometheus.Gauge
	streamClients  prometheus.Gauge
	mcpToolCalls   *prometheus.CounterVec
}

// New creates a Metrics with all collectors registered, including the standard
// Go runtime and process collectors.
func New() *Metrics {
	reg := prometheus.NewRegistry()
	m := &Metrics{
		registry: reg,
		httpRequests: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "auto_dns_webui_http_requests_total",
			Help: "Total number of HTTP requests handled, by route, method and status code.",
		}, []string{"route", "method", "code"}),
		httpDuration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "auto_dns_webui_http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds, by route and method.",
			Buckets: prometheus.DefBuckets,
		}, []string{"route", "method"}),
		etcdListErrors: prometheus.NewCounter(prometheus.CounterOpts{
			Name: "auto_dns_webui_etcd_list_errors_total",
			Help: "Total number of errors returned while listing DNS records from etcd.",
		}),
		recordCount: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "auto_dns_webui_dns_records",
			Help: "Number of DNS records returned by the most recent successful etcd list.",
		}),
		streamClients: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "auto_dns_webui_stream_clients",
			Help: "Number of currently connected record-stream (SSE) clients.",
		}),
		mcpToolCalls: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "auto_dns_webui_mcp_tool_calls_total",
			Help: "Total number of MCP tool invocations, by tool name.",
		}, []string{"tool"}),
	}
	reg.MustRegister(
		m.httpRequests,
		m.httpDuration,
		m.etcdListErrors,
		m.recordCount,
		m.streamClients,
		m.mcpToolCalls,
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)
	return m
}

// Handler returns an http.Handler that serves the metrics in the Prometheus
// text exposition format for this instance's registry.
func (m *Metrics) Handler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{Registry: m.registry})
}

// InstrumentHandler wraps next, recording request count and latency under a
// fixed route label. The label is supplied by the caller (rather than derived
// from the request path) to keep label cardinality bounded.
func (m *Metrics) InstrumentHandler(route string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, code: http.StatusOK}
		next.ServeHTTP(rec, r)
		m.httpRequests.WithLabelValues(route, r.Method, strconv.Itoa(rec.code)).Inc()
		m.httpDuration.WithLabelValues(route, r.Method).Observe(time.Since(start).Seconds())
	})
}

// SetRecordCount records the number of DNS records read on a successful list.
func (m *Metrics) SetRecordCount(n int) { m.recordCount.Set(float64(n)) }

// RecordEtcdListError increments the etcd list-error counter.
func (m *Metrics) RecordEtcdListError() { m.etcdListErrors.Inc() }

// IncStreamClients records a newly connected record-stream client.
func (m *Metrics) IncStreamClients() { m.streamClients.Inc() }

// DecStreamClients records a disconnected record-stream client.
func (m *Metrics) DecStreamClients() { m.streamClients.Dec() }

// RecordMCPToolCall increments the call counter for the named MCP tool.
func (m *Metrics) RecordMCPToolCall(tool string) { m.mcpToolCalls.WithLabelValues(tool).Inc() }

// statusRecorder captures the response status code written by a handler so it
// can be used as a metric label.
type statusRecorder struct {
	http.ResponseWriter
	code        int
	wroteHeader bool
}

func (r *statusRecorder) WriteHeader(code int) {
	if !r.wroteHeader {
		r.code = code
		r.wroteHeader = true
	}
	r.ResponseWriter.WriteHeader(code)
}

func (r *statusRecorder) Write(b []byte) (int, error) {
	if !r.wroteHeader {
		r.WriteHeader(http.StatusOK)
	}
	return r.ResponseWriter.Write(b)
}
