package app

import (
	"fmt"
	"net/http"
)

type Config struct {
	DevMode bool
	Port    string
}

func NewServer(cfg Config) *http.Server {
	mux := http.NewServeMux()
	RegisterRoutes(mux, cfg)

	return &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: mux,
	}
}
