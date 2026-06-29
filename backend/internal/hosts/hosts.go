// Package hosts aggregates the per-host view rendered by the UI's Hosts page:
// each docker-coredns-sync node that publishes DNS records, joined with the
// liveness signalled by the producer's etcd heartbeat keys. It is read-only and
// derives everything from data this app already consumes — the DNS records and
// the heartbeat key set — so it needs no additional producer cooperation.
package hosts

import (
	"sort"
	"time"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

// Container summarizes one container's contribution to a host's records.
type Container struct {
	ID          string `json:"containerId"`
	Name        string `json:"containerName"`
	RecordCount int    `json:"recordCount"`
}

// Host is an aggregated view of a single producing node: its liveness (from the
// etcd heartbeat key) plus stats derived from the DNS records it owns.
type Host struct {
	Hostname      string         `json:"hostname"`
	Online        bool           `json:"online"`
	RecordCount   int            `json:"recordCount"`
	TypeCounts    map[string]int `json:"typeCounts"`
	Containers    []Container    `json:"containers"`
	LastPublished *time.Time     `json:"lastPublished,omitempty"`
}

type hostAcc struct {
	host       *Host
	containers map[string]*Container
}

// Summarize groups records by owning hostname and joins them with the set of
// currently-heartbeating hosts. A host is included if it owns at least one
// record or is currently heartbeating, so both an online-but-idle node and a
// node that has gone offline while it still owns records are represented.
//
// The result is sorted online-first, then by hostname, to give the UI a
// deterministic default ordering (it may re-sort client-side).
func Summarize(records []*dns.Record, online map[string]bool) []Host {
	byHost := make(map[string]*hostAcc)

	get := func(hostname string) *hostAcc {
		a, ok := byHost[hostname]
		if !ok {
			a = &hostAcc{
				host: &Host{
					Hostname:   hostname,
					Online:     online[hostname],
					TypeCounts: map[string]int{},
				},
				containers: map[string]*Container{},
			}
			byHost[hostname] = a
		}
		return a
	}

	// Seed every heartbeating host so online-but-idle nodes still appear.
	for hostname := range online {
		get(hostname)
	}

	for _, r := range records {
		if r == nil {
			continue
		}
		a := get(r.Meta.Hostname)
		h := a.host
		h.RecordCount++
		h.TypeCounts[r.Dns.Type]++

		if created := r.Meta.Created; !created.IsZero() {
			if h.LastPublished == nil || created.After(*h.LastPublished) {
				c := created
				h.LastPublished = &c
			}
		}

		// Roll up per container, keyed by ID (falling back to name when the
		// producer didn't record an ID).
		key := r.Meta.ContainerID
		if key == "" {
			key = r.Meta.ContainerName
		}
		c, ok := a.containers[key]
		if !ok {
			c = &Container{ID: r.Meta.ContainerID, Name: r.Meta.ContainerName}
			a.containers[key] = c
		}
		c.RecordCount++
	}

	out := make([]Host, 0, len(byHost))
	for _, a := range byHost {
		cs := make([]Container, 0, len(a.containers))
		for _, c := range a.containers {
			cs = append(cs, *c)
		}
		sort.Slice(cs, func(i, j int) bool {
			if cs[i].Name != cs[j].Name {
				return cs[i].Name < cs[j].Name
			}
			return cs[i].ID < cs[j].ID
		})
		a.host.Containers = cs
		out = append(out, *a.host)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Online != out[j].Online {
			return out[i].Online
		}
		return out[i].Hostname < out[j].Hostname
	})
	return out
}
