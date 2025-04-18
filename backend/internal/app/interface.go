package app

import "context"

type httpServer interface {
	Start(context.Context) error
}
