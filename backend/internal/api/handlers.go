package api

import (
	"encoding/json"
	"net/http"

	"github.com/auto-dns/auto-dns-webui/internal/hosts"
	"github.com/auto-dns/auto-dns-webui/internal/metrics"
	"github.com/auto-dns/auto-dns-webui/internal/registry"
	"github.com/rs/zerolog"
)

type Handler struct {
	Registry registry.Registry
	Metrics  *metrics.Metrics
	Logger   zerolog.Logger
}

func NewHandler(r registry.Registry, m *metrics.Metrics, logger zerolog.Logger) *Handler {
	return &Handler{
		Registry: r,
		Metrics:  m,
		Logger:   logger,
	}
}

func (h *Handler) Records(w http.ResponseWriter, r *http.Request) {
	records, err := h.Registry.List(r.Context())
	if err != nil {
		h.Metrics.RecordEtcdListError()
		h.Logger.Error().Err(err).Msg("Failed to list records")
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	h.Metrics.SetRecordCount(len(records))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(records); err != nil {
		h.Logger.Error().Err(err).Msg("Failed to encode records response")
	}
}

// Hosts returns a per-host summary: every docker-coredns-sync node that
// publishes records (with derived record-count/type/container stats) joined with
// the liveness reported by the producer's etcd heartbeat keys.
func (h *Handler) Hosts(w http.ResponseWriter, r *http.Request) {
	records, err := h.Registry.List(r.Context())
	if err != nil {
		h.Metrics.RecordEtcdListError()
		h.Logger.Error().Err(err).Msg("Failed to list records")
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	h.Metrics.SetRecordCount(len(records))

	// Heartbeats are best-effort: if the liveness read fails we still return the
	// per-host record stats (with every host marked offline) rather than failing
	// the whole request — a missing heartbeat is less severe than missing data.
	online, err := h.Registry.ListHeartbeats(r.Context())
	if err != nil {
		h.Logger.Warn().Err(err).Msg("Failed to list host heartbeats; reporting hosts without liveness")
		online = nil
	}

	summary := hosts.Summarize(records, online)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(summary); err != nil {
		h.Logger.Error().Err(err).Msg("Failed to encode hosts response")
	}
}
