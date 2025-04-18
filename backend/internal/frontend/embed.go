package frontend

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
)

//go:embed dist/*
var embeddedFiles embed.FS

func ServeStatic() http.Handler {
	content, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		log.Fatalf("Failed to load embedded frontend: %v", err)
	}
	return http.FileServer(http.FS(content))
}
