package health

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/rs/zerolog"
)

type stubPinger struct{ err error }

func (s stubPinger) Ping(ctx context.Context) error { return s.err }

func decodeStatus(t *testing.T, body []byte) statusBody {
	t.Helper()
	var s statusBody
	if err := json.Unmarshal(body, &s); err != nil {
		t.Fatalf("response is not valid JSON: %v (%s)", err, body)
	}
	return s
}

func TestHealthz_AlwaysOK(t *testing.T) {
	// Even with a failing pinger, liveness must not touch it and must return 200.
	h := New(stubPinger{err: errors.New("etcd down")}, zerolog.Nop())

	rec := httptest.NewRecorder()
	h.Healthz(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := decodeStatus(t, rec.Body.Bytes()).Status; got != "ok" {
		t.Errorf("status field = %q, want %q", got, "ok")
	}
}

func TestReadyz_Ready(t *testing.T) {
	h := New(stubPinger{err: nil}, zerolog.Nop())

	rec := httptest.NewRecorder()
	h.Readyz(rec, httptest.NewRequest(http.MethodGet, "/readyz", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := decodeStatus(t, rec.Body.Bytes()).Status; got != "ok" {
		t.Errorf("status field = %q, want %q", got, "ok")
	}
}

func TestReadyz_NotReady(t *testing.T) {
	h := New(stubPinger{err: errors.New("dial tcp: connection refused")}, zerolog.Nop())

	rec := httptest.NewRecorder()
	h.Readyz(rec, httptest.NewRequest(http.MethodGet, "/readyz", nil))

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	if got := decodeStatus(t, rec.Body.Bytes()).Status; got != "unavailable" {
		t.Errorf("status field = %q, want %q", got, "unavailable")
	}
}
