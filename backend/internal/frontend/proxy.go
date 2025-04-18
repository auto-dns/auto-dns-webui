package frontend

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func ProxyToVite() http.Handler {
	target, err := url.Parse("http://localhost:5173")
	if err != nil {
		log.Fatalf("Invalid Vite dev server URL: %v", err)
	}
	return httputil.NewSingleHostReverseProxy(target)
}
