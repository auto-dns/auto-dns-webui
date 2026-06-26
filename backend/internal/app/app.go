package app

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/auto-dns/auto-dns-webui/internal/api"
	"github.com/auto-dns/auto-dns-webui/internal/config"
	"github.com/auto-dns/auto-dns-webui/internal/health"
	mcphandler "github.com/auto-dns/auto-dns-webui/internal/mcp"
	"github.com/auto-dns/auto-dns-webui/internal/metrics"
	"github.com/auto-dns/auto-dns-webui/internal/registry"
	"github.com/auto-dns/auto-dns-webui/internal/server"
	"github.com/rs/zerolog"
	clientv3 "go.etcd.io/etcd/client/v3"
)

type App struct {
	Logger    zerolog.Logger
	Server    httpServer
	MCPServer *http.Server
}

func NewRegistry(cfg *config.Config, logger zerolog.Logger) (registry.Registry, error) {
	etcdClient, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{fmt.Sprintf("http://%s:%d", cfg.Etcd.Host, cfg.Etcd.Port)},
		DialTimeout: 2 * time.Second,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to etcd: %w", err)
	}
	reg := registry.NewEtcdRegistry(etcdClient, &cfg.Etcd, logger)
	return reg, nil
}

func NewHandler(r registry.Registry, m *metrics.Metrics, logger zerolog.Logger) api.HandlerInterface {
	return api.NewHandler(r, m, logger)
}

func NewServer(cfg *config.ServerConfig, handler api.HandlerInterface, healthHandler *health.Handler, m *metrics.Metrics, logger zerolog.Logger) (httpServer, error) {
	mux := http.NewServeMux()

	http := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	}

	return server.New(http, mux, handler, healthHandler, m, cfg, logger)
}

// New creates a new App by wiring up all dependencies.
func New(cfg *config.Config, logger zerolog.Logger) (*App, error) {
	reg, err := NewRegistry(cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create etcd registry: %w", err)
	}

	m := metrics.New()
	handler := NewHandler(reg, m, logger)
	healthHandler := health.New(reg, logger)

	srv, err := NewServer(&cfg.Server, handler, healthHandler, m, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create server: %w", err)
	}

	var mcpHTTP *http.Server
	if cfg.MCP.Enabled {
		mcpHandler := mcphandler.NewHandler(mcphandler.Deps{
			Registry: reg,
			Metrics:  m,
			Logger:   logger,
		})
		// Wrap the MCP handler so the (separate) MCP server is also probeable.
		mcpMux := http.NewServeMux()
		mcpMux.HandleFunc("/healthz", healthHandler.Healthz)
		mcpMux.HandleFunc("/readyz", healthHandler.Readyz)
		mcpMux.Handle("/", mcpHandler)
		mcpHTTP = &http.Server{
			Addr:              fmt.Sprintf(":%d", cfg.MCP.Port),
			Handler:           mcpMux,
			ReadHeaderTimeout: 10 * time.Second,
			WriteTimeout:      0,
			IdleTimeout:       120 * time.Second,
		}
		logger.Info().Int("port", cfg.MCP.Port).Msg("MCP server configured")
	}

	return &App{
		Logger:    logger,
		Server:    srv,
		MCPServer: mcpHTTP,
	}, nil
}

// Run starts the application by running the sync engine.
func (a *App) Run(ctx context.Context) error {
	a.Logger.Info().Msg("Application starting")

	if a.MCPServer != nil {
		go func() {
			a.Logger.Info().Str("addr", a.MCPServer.Addr).Msg("MCP server starting")
			go a.MCPServer.ListenAndServe() //nolint:errcheck
			<-ctx.Done()
			shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := a.MCPServer.Shutdown(shutdownCtx); err != nil {
				a.Logger.Error().Err(err).Msg("MCP server shutdown error")
			}
		}()
	}

	return a.Server.Start(ctx)
}
