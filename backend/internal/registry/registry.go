package registry

import (
	"context"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

type Registry interface {
	List(ctx context.Context) ([]*dns.Record, error)
	Close() error
}
