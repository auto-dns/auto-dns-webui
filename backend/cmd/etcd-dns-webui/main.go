package main

import (
	"log"
	"os"

	"github.com/auto-dns/etcd-dns-webui/internal/app"
)

func main() {
	cfg := app.Config{
		DevMode: os.Getenv("DEV_MODE") == "true",
		Port:    "8080",
	}

	server := app.NewServer(cfg)
	log.Fatal(server.ListenAndServe())
}
