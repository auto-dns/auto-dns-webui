package server

import (
	"context"
	"net/http"
	"time"

	"github.com/auto-dns/auto-dns-webui/internal/api"
	"github.com/auto-dns/auto-dns-webui/internal/config"
	"github.com/auto-dns/auto-dns-webui/internal/frontend"
	"github.com/auto-dns/auto-dns-webui/internal/health"
	"github.com/auto-dns/auto-dns-webui/internal/metrics"
	"github.com/rs/zerolog"
)

type Server struct {
	cfg     *config.ServerConfig
	logger  zerolog.Logger
	mux     *http.ServeMux
	http    *http.Server
	handler api.HandlerInterface
	health  *health.Handler
	metrics *metrics.Metrics
	stream  http.Handler
}

func New(http *http.Server, mux *http.ServeMux, handler api.HandlerInterface, health *health.Handler, metrics *metrics.Metrics, stream http.Handler, cfg *config.ServerConfig, logger zerolog.Logger) (*Server, error) {
	s := &Server{
		cfg:     cfg,
		logger:  logger,
		mux:     mux,
		http:    http,
		handler: handler,
		health:  health,
		metrics: metrics,
		stream:  stream,
	}
	if err := s.registerRoutes(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Server) registerRoutes() error {
	// API routes (instrumented for request/latency metrics).
	s.mux.Handle("/api/records", s.metrics.InstrumentHandler("/api/records", http.HandlerFunc(s.handler.Records)))
	s.mux.Handle("/api/hosts", s.metrics.InstrumentHandler("/api/hosts", http.HandlerFunc(s.handler.Hosts)))

	// Live record stream (SSE). Deliberately not wrapped in the latency
	// histogram: these are long-lived connections, so a request-duration
	// observation (recorded only on disconnect) would be meaningless. Connected
	// clients are tracked by the stream gauge instead.
	if s.stream != nil {
		s.mux.Handle("/api/records/stream", s.stream)
	}

	// Operational endpoints.
	s.mux.Handle("/healthz", s.metrics.InstrumentHandler("/healthz", http.HandlerFunc(s.health.Healthz)))
	s.mux.Handle("/readyz", s.metrics.InstrumentHandler("/readyz", http.HandlerFunc(s.health.Readyz)))
	s.mux.Handle("/metrics", s.metrics.Handler())

	// Frontend
	if s.cfg.Proxy.Enable {
		s.logger.Debug().Str("hostname", s.cfg.Proxy.Hostname).Int("port", s.cfg.Proxy.Port).Msg("Proxying frontend to Vite")
		proxy, err := frontend.ProxyToVite(s.cfg.Proxy.Hostname, s.cfg.Proxy.Port)
		if err != nil {
			return err
		}
		s.mux.Handle("/", proxy)
	} else {
		s.logger.Debug().Msg("Serving embedded frontend")
		s.mux.Handle("/", frontend.ServeStatic())
	}
	return nil
}

func (s *Server) Start(ctx context.Context) error {
	s.logger.Info().Str("addr", s.http.Addr).Msg("Starting HTTP server")
	go func() {
		if err := s.http.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Error().Err(err).Msg("HTTP server failed")
		}
	}()

	<-ctx.Done() // Wait for context cancellation

	s.logger.Info().Msg("Shutting down HTTP server")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := s.http.Shutdown(shutdownCtx); err != nil {
		s.logger.Error().Err(err).Msg("Graceful shutdown failed")
		return err
	}
	s.logger.Info().Msg("Server shut down cleanly")
	return nil
}
