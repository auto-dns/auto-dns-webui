package frontend

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
)

// ProxyToVite returns a reverse proxy to the Vite dev server at the given
// hostname and port (dev mode only).
func ProxyToVite(hostname string, port int) (http.Handler, error) {
	target, err := url.Parse(fmt.Sprintf("http://%s:%d", hostname, port))
	if err != nil {
		return nil, fmt.Errorf("invalid Vite dev server URL: %w", err)
	}
	return httputil.NewSingleHostReverseProxy(target), nil
}
