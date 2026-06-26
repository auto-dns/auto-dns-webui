// Package version exposes the application version.
package version

// Version is the application version. It defaults to "dev" for local and
// unstamped builds, and is overridden at build time via:
//
//	-ldflags "-X github.com/auto-dns/auto-dns-webui/internal/version.Version=<v>"
//
// (see the Dockerfile's VERSION build arg). Release images are stamped with the
// git tag.
var Version = "dev"
