package api

import "net/http"

type HandlerInterface interface {
	Records(w http.ResponseWriter, r *http.Request)
}
