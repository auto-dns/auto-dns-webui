package app

import (
	"net/http"

	"github.com/auto-dns/etcd-dns-webui/internal/api"
	"github.com/auto-dns/etcd-dns-webui/internal/frontend"
)

func RegisterRoutes(mux *http.ServeMux, cfg Config) {
	// API
	mux.HandleFunc("/api/records", api.HandleRecords)

	// Frontend
	if cfg.DevMode {
		mux.Handle("/", frontend.ProxyToVite())
	} else {
		mux.Handle("/", frontend.ServeStatic())
	}
}
