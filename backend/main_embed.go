//go:build !dev
// +build !dev

package main

import (
	"embed"
	"log"
	"net/http"
)

//go:embed all:dist
var staticFiles embed.FS

func main() {
	port := getPort()
	fs := http.FS(staticFiles)
	http.Handle("/", http.FileServer(fs))

	log.Printf("[PROD] Serving embedded static files on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
