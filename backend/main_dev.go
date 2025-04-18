//go:build dev
// +build dev

package main

import (
	"log"
	"net/http"
)

func main() {
	port := getPort()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		target := "http://localhost:5173" + r.URL.Path
		http.Redirect(w, r, target, http.StatusTemporaryRedirect)
	})

	log.Printf("[DEV] Proxying frontend to Vite dev server on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
