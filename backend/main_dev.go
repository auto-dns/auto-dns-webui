//go:build dev
// +build dev

package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func main() {
	vite, _ := url.Parse("http://localhost:5173")
	proxy := httputil.NewSingleHostReverseProxy(vite)

	mux := http.NewServeMux()

	// Backend API
	mux.HandleFunc("/api/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"message":"Hello from backend"}`))
	})

	// Frontend proxy
	mux.Handle("/", proxy)

	log.Println("[DEV] Listening on :8080 with frontend proxy to :5173")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
