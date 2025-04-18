package server

import (
	"context"
	"net/http"

	"github.com/auto-dns/etcd-dns-webui/internal/api"
	"github.com/auto-dns/etcd-dns-webui/internal/config"
	"github.com/auto-dns/etcd-dns-webui/internal/frontend"
	"github.com/rs/zerolog"
)

type Server struct {
	cfg    *config.ServerConfig
	logger zerolog.Logger
	mux    *http.ServeMux
	http   *http.Server
}

func New(http *http.Server, mux *http.ServeMux, cfg *config.ServerConfig, logger zerolog.Logger) *Server {
	s := &Server{
		cfg:    cfg,
		logger: logger,
		mux:    mux,
		http:   http,
	}
	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	// API routes
	s.mux.HandleFunc("/api/records", api.HandleRecords)

	// Frontend
	if s.cfg.Proxy.Enable {
		s.logger.Debug().Msg("Proxying frontend to Vite")
		s.mux.Handle("/", frontend.ProxyToVite())
	} else {
		s.logger.Debug().Msg("Serving embedded frontend")
		s.mux.Handle("/", frontend.ServeStatic())
	}
}

func (s *Server) Start(ctx context.Context) error {
	s.logger.Info().Str("addr", s.http.Addr).Msg("Starting HTTP server")
	return s.http.ListenAndServe()
}
