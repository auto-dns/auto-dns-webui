package registry

import (
	"context"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

type Registry interface {
	LockTransaction(ctx context.Context, key []string, fn func() error) error
	List(ctx context.Context) ([]*dns.Record, error)
	Remove(ctx context.Context, record *dns.Record) error
	Close() error
}
