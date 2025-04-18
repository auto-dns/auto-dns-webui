package api

import (
	"net/http"
)

func HandleRecords(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"records":[]}`))
}
