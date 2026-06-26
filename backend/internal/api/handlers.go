package api

import (
	"encoding/json"
	"net/http"

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
