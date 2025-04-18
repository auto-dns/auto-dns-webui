package app

import (
	"context"
	"fmt"
	"net/http"

	"github.com/auto-dns/etcd-dns-webui/internal/config"
	"github.com/auto-dns/etcd-dns-webui/internal/server"
	"github.com/rs/zerolog"
)

type App struct {
	Config *config.Config
	Logger zerolog.Logger
	Server httpServer
}

func NewServer(cfg *config.ServerConfig, logger zerolog.Logger) httpServer {
	mux := http.NewServeMux()

	http := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	}

	return server.New(http, mux, cfg, logger)
}

// New creates a new App by wiring up all dependencies.
func New(cfg *config.Config, logger zerolog.Logger) (*App, error) {
	srv := NewServer(&cfg.Server, logger)

	return &App{
		Config: cfg,
		Logger: logger,
		Server: srv,
	}, nil
}

// Run starts the application by running the sync engine.
func (a *App) Run(ctx context.Context) error {
	a.Logger.Info().Msg("Application starting")
	return a.Server.Start(ctx)
}
