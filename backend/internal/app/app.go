package app

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/auto-dns/auto-dns-webui/internal/api"
	"github.com/auto-dns/auto-dns-webui/internal/config"
	"github.com/auto-dns/auto-dns-webui/internal/registry"
	"github.com/auto-dns/auto-dns-webui/internal/server"
	"github.com/rs/zerolog"
	clientv3 "go.etcd.io/etcd/client/v3"
)

type App struct {
	Logger zerolog.Logger
	Server httpServer
}

func NewRegistry(cfg *config.Config, logger zerolog.Logger) (registry.Registry, error) {
	etcdClient, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{fmt.Sprintf("http://%s:%d", cfg.Etcd.Host, cfg.Etcd.Port)},
		DialTimeout: 2 * time.Second,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to etcd: %w", err)
	}
	reg := registry.NewEtcdRegistry(etcdClient, &cfg.Etcd, cfg.App.Hostname, logger)
	return reg, nil
}

func NewHandler(r registry.Registry, logger zerolog.Logger) api.HandlerInterface {
	return api.NewHandler(r, logger)
}

func NewServer(cfg *config.ServerConfig, handler api.HandlerInterface, logger zerolog.Logger) httpServer {
	mux := http.NewServeMux()

	http := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	}

	return server.New(http, mux, handler, cfg, logger)
}

// New creates a new App by wiring up all dependencies.
func New(cfg *config.Config, logger zerolog.Logger) (*App, error) {
	reg, err := NewRegistry(cfg, logger)
	if err != nil {
		return nil, fmt.Errorf("failed to create etcd registry: %w", err)
	}

	handler := NewHandler(reg, logger)

	srv := NewServer(&cfg.Server, handler, logger)

	return &App{
		Logger: logger,
		Server: srv,
	}, nil
}

// Run starts the application by running the sync engine.
func (a *App) Run(ctx context.Context) error {
	a.Logger.Info().Msg("Application starting")
	return a.Server.Start(ctx)
}
