package mcphandler

import (
	"context"
	"net/http"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
	"github.com/auto-dns/auto-dns-webui/internal/version"
	"github.com/mark3labs/mcp-go/server"
	"github.com/rs/zerolog"
)

type dnsRegistry interface {
	List(ctx context.Context) ([]*dns.Record, error)
}

type Deps struct {
	Registry dnsRegistry
	Logger   zerolog.Logger
}

func NewHandler(d Deps) http.Handler {
	s := server.NewMCPServer("auto-dns-webui", version.Version)
	registerTools(s, d)
	return server.NewStreamableHTTPServer(s, server.WithStateLess(true))
}
