package frontend

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"
)

// TestProxyToVite_HonorsConfiguredTarget verifies the proxy forwards to the
// configured hostname/port rather than a hardcoded one (regression test for the
// dev proxy ignoring server.proxy.hostname / server.proxy.port).
func TestProxyToVite_HonorsConfiguredTarget(t *testing.T) {
	var gotPath string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	u, err := url.Parse(upstream.URL)
	if err != nil {
		t.Fatalf("parsing upstream URL: %v", err)
	}
	port, err := strconv.Atoi(u.Port())
	if err != nil {
		t.Fatalf("parsing upstream port: %v", err)
	}

	proxy, err := ProxyToVite(u.Hostname(), port)
	if err != nil {
		t.Fatalf("ProxyToVite returned error: %v", err)
	}

	front := httptest.NewServer(proxy)
	defer front.Close()

	resp, err := http.Get(front.URL + "/index.html")
	if err != nil {
		t.Fatalf("request through proxy failed: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("status = %d, want 200 — proxy did not reach the configured target", resp.StatusCode)
	}
	if gotPath != "/index.html" {
		t.Errorf("upstream path = %q, want /index.html", gotPath)
	}
}
