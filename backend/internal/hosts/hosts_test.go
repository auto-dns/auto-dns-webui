package hosts

import (
	"testing"
	"time"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
)

func rec(hostname, recType, containerID, containerName string, created time.Time) *dns.Record {
	return &dns.Record{
		Dns:  dns.DnsRecord{Name: "x", Type: recType, Value: "v"},
		Meta: dns.RecordMetadata{Hostname: hostname, ContainerID: containerID, ContainerName: containerName, Created: created},
	}
}

func byName(hs []Host) map[string]Host {
	m := make(map[string]Host, len(hs))
	for _, h := range hs {
		m[h.Hostname] = h
	}
	return m
}

func TestSummarize_AggregatesRecordsAndJoinsHeartbeats(t *testing.T) {
	t0 := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	t1 := t0.Add(time.Hour)
	records := []*dns.Record{
		rec("h1", "A", "c1", "web", t0),
		rec("h1", "AAAA", "c1", "web", t1), // same container, newer
		rec("h1", "A", "c2", "api", t0),
		rec("h2", "CNAME", "c3", "db", t0),
	}
	// h1 heartbeating; h3 heartbeating but owns no records; h2 offline.
	online := map[string]bool{"h1": true, "h3": true}

	got := byName(Summarize(records, online))

	if len(got) != 3 {
		t.Fatalf("got %d hosts, want 3 (h1, h2, h3)", len(got))
	}

	h1 := got["h1"]
	if !h1.Online {
		t.Error("h1 should be online")
	}
	if h1.RecordCount != 3 {
		t.Errorf("h1 record count = %d, want 3", h1.RecordCount)
	}
	if h1.TypeCounts["A"] != 2 || h1.TypeCounts["AAAA"] != 1 {
		t.Errorf("h1 type counts = %v, want A:2 AAAA:1", h1.TypeCounts)
	}
	if len(h1.Containers) != 2 {
		t.Errorf("h1 containers = %v, want 2", h1.Containers)
	}
	if h1.LastPublished == nil || !h1.LastPublished.Equal(t1) {
		t.Errorf("h1 lastPublished = %v, want %v", h1.LastPublished, t1)
	}

	h2 := got["h2"]
	if h2.Online {
		t.Error("h2 should be offline (owns a record but no heartbeat)")
	}
	if h2.RecordCount != 1 {
		t.Errorf("h2 record count = %d, want 1", h2.RecordCount)
	}

	h3 := got["h3"]
	if !h3.Online {
		t.Error("h3 should be online")
	}
	if h3.RecordCount != 0 {
		t.Errorf("h3 record count = %d, want 0 (heartbeating but idle)", h3.RecordCount)
	}
	if h3.LastPublished != nil {
		t.Errorf("h3 lastPublished = %v, want nil", h3.LastPublished)
	}
}

func TestSummarize_SortsOnlineFirstThenByName(t *testing.T) {
	records := []*dns.Record{
		rec("zeta", "A", "c1", "z", time.Time{}),
		rec("alpha", "A", "c2", "a", time.Time{}),
	}
	online := map[string]bool{"zeta": true}

	got := Summarize(records, online)
	if got[0].Hostname != "zeta" {
		t.Errorf("first host = %q, want zeta (online sorts first)", got[0].Hostname)
	}
	if got[1].Hostname != "alpha" {
		t.Errorf("second host = %q, want alpha", got[1].Hostname)
	}
}

func TestSummarize_Empty(t *testing.T) {
	got := Summarize(nil, nil)
	if len(got) != 0 {
		t.Errorf("got %d hosts, want 0", len(got))
	}
}
