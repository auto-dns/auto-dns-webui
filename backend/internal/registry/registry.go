package registry

import (
	"context"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

type Registry interface {
	List(ctx context.Context) ([]*dns.Record, error)
	// Ping is a cheap reachability check against the backing store, used by the
	// readiness probe.
	Ping(ctx context.Context) error
	Close() error
}
