// Package stream pushes live DNS record updates to connected clients over
// Server-Sent Events (SSE).
//
// A single Broker owns one etcd watch (via the registry) and fans changes out
// to every connected client, so the cost on etcd is constant regardless of how
// many browsers are watching. On each change the broker re-lists the full
// record set and broadcasts it as a JSON snapshot identical in shape to
// GET /api/records — clients simply replace their state, which keeps the wire
// protocol and the frontend trivial.
package stream

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
	"github.com/rs/zerolog"
)

// Source supplies the current record set and a change signal. *EtcdRegistry
// satisfies it.
type Source interface {
	List(ctx context.Context) ([]*dns.Record, error)
	Watch(ctx context.Context) (<-chan struct{}, error)
}

// Metrics is the subset of *metrics.Metrics the broker reports to.
type Metrics interface {
	IncStreamClients()
	DecStreamClients()
}

const (
	// heartbeatInterval bounds how long a stream can sit idle before the broker
	// writes an SSE comment, keeping intermediary proxies from dropping it and
	// letting the server notice a dead client.
	heartbeatInterval = 25 * time.Second

	// minBackoff/maxBackoff bound the retry delay when the etcd watch ends and
	// must be re-established.
	minBackoff = 1 * time.Second
	maxBackoff = 30 * time.Second
)

// subscriber is one connected SSE client. ch carries pre-encoded snapshot
// payloads; it is buffered with capacity one and coalesced so a slow client
// only ever falls behind to the latest snapshot, never blocks the broker.
type subscriber struct {
	ch chan []byte
}

// Broker watches etcd and fans record snapshots out to SSE subscribers.
type Broker struct {
	source  Source
	metrics Metrics
	logger  zerolog.Logger

	mu     sync.Mutex
	subs   map[*subscriber]struct{}
	latest []byte // most recent snapshot, replayed to new subscribers
}

// NewBroker creates a Broker. Call Run to start watching; register the Broker
// as an http.Handler to serve the SSE endpoint.
func NewBroker(source Source, metrics Metrics, logger zerolog.Logger) *Broker {
	return &Broker{
		source:  source,
		metrics: metrics,
		logger:  logger,
		subs:    make(map[*subscriber]struct{}),
	}
}

// Run drives the watch loop until ctx is cancelled, re-establishing the etcd
// watch with capped exponential backoff whenever it ends.
func (b *Broker) Run(ctx context.Context) {
	backoff := minBackoff
	for ctx.Err() == nil {
		err := b.watchLoop(ctx)
		if ctx.Err() != nil {
			return
		}
		if err != nil {
			b.logger.Error().Err(err).Dur("retry_in", backoff).Msg("record watch ended; retrying")
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff *= 2
		if backoff > maxBackoff {
			backoff = maxBackoff
		}
	}
}

// watchLoop establishes one watch, pushes an initial snapshot, and broadcasts a
// fresh snapshot on every change until the watch ends or ctx is cancelled.
func (b *Broker) watchLoop(ctx context.Context) error {
	wch, err := b.source.Watch(ctx)
	if err != nil {
		return fmt.Errorf("establishing watch: %w", err)
	}
	// Snapshot current state so newly (re)connected clients are immediately
	// up to date without waiting for the next etcd change.
	b.refresh(ctx)
	for {
		select {
		case <-ctx.Done():
			return nil
		case _, ok := <-wch:
			if !ok {
				return errors.New("watch channel closed")
			}
			b.refresh(ctx)
		}
	}
}

// refresh lists the current records, encodes them, and broadcasts the snapshot
// to all subscribers. List/encode failures are logged and skipped — the last
// good snapshot stays in place.
func (b *Broker) refresh(ctx context.Context) {
	records, err := b.source.List(ctx)
	if err != nil {
		b.logger.Error().Err(err).Msg("failed to list records for stream update")
		return
	}
	if records == nil {
		records = []*dns.Record{}
	}
	data, err := json.Marshal(records)
	if err != nil {
		b.logger.Error().Err(err).Msg("failed to encode records for stream update")
		return
	}

	b.mu.Lock()
	b.latest = data
	for s := range b.subs {
		send(s.ch, data)
	}
	b.mu.Unlock()
}

// send delivers data to a capacity-one channel without blocking, replacing any
// stale queued snapshot so the client always converges on the newest state.
func send(ch chan []byte, data []byte) {
	for {
		select {
		case ch <- data:
			return
		default:
			select {
			case <-ch:
			default:
			}
		}
	}
}

func (b *Broker) subscribe() *subscriber {
	s := &subscriber{ch: make(chan []byte, 1)}
	b.mu.Lock()
	if b.latest != nil {
		s.ch <- b.latest // safe: buffer cap 1, freshly created and empty
	}
	b.subs[s] = struct{}{}
	b.mu.Unlock()
	b.metrics.IncStreamClients()
	return s
}

func (b *Broker) unsubscribe(s *subscriber) {
	b.mu.Lock()
	_, ok := b.subs[s]
	delete(b.subs, s)
	b.mu.Unlock()
	if ok {
		b.metrics.DecStreamClients()
	}
}

// ServeHTTP implements the SSE endpoint: it holds the connection open and
// writes a `records` event (current snapshot, then one per change) plus
// periodic `ping` heartbeat events until the client disconnects.
func (b *Broker) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	h := w.Header()
	h.Set("Content-Type", "text/event-stream")
	h.Set("Cache-Control", "no-cache")
	h.Set("Connection", "keep-alive")
	h.Set("X-Accel-Buffering", "no") // tell nginx not to buffer the stream
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	sub := b.subscribe()
	defer b.unsubscribe(sub)

	heartbeat := time.NewTicker(heartbeatInterval)
	defer heartbeat.Stop()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case data := <-sub.ch:
			// Compact JSON never contains a newline, so a single data: line is
			// a valid SSE frame.
			if _, err := fmt.Fprintf(w, "event: records\ndata: %s\n\n", data); err != nil {
				return
			}
			flusher.Flush()
		case <-heartbeat.C:
			// A named `ping` event (rather than a bare comment) keeps proxies
			// from dropping the connection *and* gives clients a visible
			// liveness signal so they can tell an idle-but-healthy stream from a
			// stalled one (EventSource does not surface comment lines to JS).
			if _, err := fmt.Fprint(w, "event: ping\ndata: {}\n\n"); err != nil {
				return
			}
			flusher.Flush()
		}
	}
}
