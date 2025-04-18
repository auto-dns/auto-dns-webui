package logger

import (
	"os"
	"strings"
	"time"

	"github.com/auto-dns/etcd-dns-webui/internal/config"
	"github.com/rs/zerolog"
)

func SetupLogger(cfg *config.LoggingConfig) zerolog.Logger {
	consoleWriter := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
	}

	levelStr := strings.ToLower(cfg.Level)
	level, err := zerolog.ParseLevel(levelStr)
	if err != nil {
		level = zerolog.InfoLevel
	}

	zerolog.SetGlobalLevel(level)
	zerolog.TimeFieldFormat = time.RFC3339

	logger := zerolog.New(consoleWriter).
		With().
		Timestamp().
		Caller().
		Str("service", "etcd_dns_webui").
		Logger()

	return logger
}
