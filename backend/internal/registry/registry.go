package registry

import (
	"context"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

type Registry interface {
	List(ctx context.Context) ([]*dns.Record, error)
	// Watch returns a channel that emits whenever the record set changes,
	// allowing the record stream to push live updates. The channel is closed
	// when the underlying watch ends and should be re-established by the caller.
	Watch(ctx context.Context) (<-chan struct{}, error)
	// Ping is a cheap reachability check against the backing store, used by the
	// readiness probe.
	Ping(ctx context.Context) error
	Close() error
}
