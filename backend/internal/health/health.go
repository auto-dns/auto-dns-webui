// Package health provides liveness and readiness HTTP handlers.
//
// Liveness (/healthz) reports whether the process is up and serving. Readiness
// (/readyz) additionally verifies that the service's etcd backend is reachable,
// so an orchestrator or load balancer can avoid routing traffic to an instance
// that cannot serve records.
package health

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/rs/zerolog"
)

// Pinger is the readiness dependency: a cheap reachability check against the
// backing store (etcd). EtcdRegistry satisfies this.
type Pinger interface {
	Ping(ctx context.Context) error
}

// readyTimeout bounds the readiness probe so a hung etcd can't hang the check.
const readyTimeout = 2 * time.Second

type Handler struct {
	pinger Pinger
	logger zerolog.Logger
}

func New(pinger Pinger, logger zerolog.Logger) *Handler {
	return &Handler{pinger: pinger, logger: logger}
}

type statusBody struct {
	Status string `json:"status"`
	Detail string `json:"detail,omitempty"`
}

// Healthz reports process liveness. It is always 200 while the server is able
// to serve requests; it deliberately does not touch etcd.
func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, statusBody{Status: "ok"})
}

// Readyz reports readiness to serve records: 200 when etcd is reachable, 503
// otherwise.
func (h *Handler) Readyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), readyTimeout)
	defer cancel()

	if err := h.pinger.Ping(ctx); err != nil {
		h.logger.Warn().Err(err).Msg("Readiness check failed: etcd unreachable")
		writeJSON(w, http.StatusServiceUnavailable, statusBody{Status: "unavailable", Detail: "etcd unreachable"})
		return
	}
	writeJSON(w, http.StatusOK, statusBody{Status: "ok"})
}

func writeJSON(w http.ResponseWriter, code int, body statusBody) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}
