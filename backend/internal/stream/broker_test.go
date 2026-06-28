package stream

import (
	"bufio"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/rs/zerolog"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

// fakeSource is a controllable Source for broker tests.
type fakeSource struct {
	mu      sync.Mutex
	records []*dns.Record
	watchCh chan struct{}
	listed  chan struct{} // signalled after each List call (best-effort)
}

func (f *fakeSource) setRecords(recs []*dns.Record) {
	f.mu.Lock()
	f.records = recs
	f.mu.Unlock()
}

func (f *fakeSource) List(ctx context.Context) ([]*dns.Record, error) {
	f.mu.Lock()
	recs := f.records
	f.mu.Unlock()
	if f.listed != nil {
		select {
		case f.listed <- struct{}{}:
		default:
		}
	}
	return recs, nil
}

func (f *fakeSource) Watch(ctx context.Context) (<-chan struct{}, error) {
	return f.watchCh, nil
}

type fakeMetrics struct {
	mu  sync.Mutex
	cur int
}

func (m *fakeMetrics) IncStreamClients() {
	m.mu.Lock()
	m.cur++
	m.mu.Unlock()
}

func (m *fakeMetrics) DecStreamClients() {
	m.mu.Lock()
	m.cur--
	m.mu.Unlock()
}

func (m *fakeMetrics) count() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.cur
}

func rec(name string) *dns.Record {
	return &dns.Record{Dns: dns.DnsRecord{Name: name, Type: "A", Value: "10.0.0.1"}}
}

// readEvent reads one SSE frame (skipping heartbeat comments) and returns the
// event name and the data payload.
func readEvent(t *testing.T, r *bufio.Reader) (event, data string) {
	t.Helper()
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			t.Fatalf("reading stream: %v", err)
		}
		line = strings.TrimRight(line, "\n")
		switch {
		case strings.HasPrefix(line, ":"):
			continue // heartbeat comment
		case strings.HasPrefix(line, "event:"):
			event = strings.TrimSpace(strings.TrimPrefix(line, "event:"))
		case strings.HasPrefix(line, "data:"):
			data = strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		case line == "":
			if event != "" || data != "" {
				return event, data
			}
		}
	}
}

func TestBrokerServeHTTP(t *testing.T) {
	src := &fakeSource{records: []*dns.Record{rec("app.example.com")}, watchCh: make(chan struct{}, 1)}
	m := &fakeMetrics{}
	b := NewBroker(src, m, zerolog.Nop())

	// Populate the latest snapshot so a freshly connected client receives it.
	b.refresh(context.Background())

	srv := httptest.NewServer(b)
	defer srv.Close()

	resp, err := http.Get(srv.URL)
	if err != nil {
		t.Fatalf("connecting: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if ct := resp.Header.Get("Content-Type"); ct != "text/event-stream" {
		t.Fatalf("content-type = %q, want text/event-stream", ct)
	}

	r := bufio.NewReader(resp.Body)

	// Initial snapshot replay.
	event, data := readEvent(t, r)
	if event != "records" {
		t.Fatalf("event = %q, want records", event)
	}
	if !strings.Contains(data, "app.example.com") {
		t.Fatalf("initial snapshot missing record: %s", data)
	}

	// A change broadcasts a fresh snapshot.
	src.setRecords([]*dns.Record{rec("db.example.com")})
	b.refresh(context.Background())
	event, data = readEvent(t, r)
	if event != "records" || !strings.Contains(data, "db.example.com") {
		t.Fatalf("update snapshot wrong: event=%q data=%s", event, data)
	}

	// Client is counted while connected.
	if got := m.count(); got != 1 {
		t.Fatalf("stream client count = %d, want 1", got)
	}

	_ = resp.Body.Close()
	deadline := time.Now().Add(2 * time.Second)
	for m.count() != 0 {
		if time.Now().After(deadline) {
			t.Fatalf("stream client count = %d after disconnect, want 0", m.count())
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func TestBrokerRunRefreshesOnWatch(t *testing.T) {
	src := &fakeSource{
		records: []*dns.Record{rec("app.example.com")},
		watchCh: make(chan struct{}, 1),
		listed:  make(chan struct{}, 8),
	}
	b := NewBroker(src, &fakeMetrics{}, zerolog.Nop())

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go b.Run(ctx)

	// Initial refresh on watch establishment.
	waitListed(t, src.listed, "initial refresh")

	// A watch signal triggers another List.
	src.watchCh <- struct{}{}
	waitListed(t, src.listed, "refresh on change")

	cancel()
}

func waitListed(t *testing.T, listed chan struct{}, what string) {
	t.Helper()
	select {
	case <-listed:
	case <-time.After(2 * time.Second):
		t.Fatalf("timed out waiting for List (%s)", what)
	}
}
