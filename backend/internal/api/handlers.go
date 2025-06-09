package api

import (
	"encoding/json"
	"net/http"

	"github.com/auto-dns/auto-dns-webui/internal/registry"
	"github.com/rs/zerolog"
)

type Handler struct {
	Registry registry.Registry
	Logger   zerolog.Logger
}

func NewHandler(r registry.Registry, logger zerolog.Logger) *Handler {
	return &Handler{
		Registry: r,
		Logger:   logger,
	}
}

func (h *Handler) Records(w http.ResponseWriter, r *http.Request) {
	records, err := h.Registry.List(r.Context())
	if err != nil {
		h.Logger.Error().Err(err).Msg("Failed to list records")
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(records)
}
