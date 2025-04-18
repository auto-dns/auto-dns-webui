
# --- VARIABLES ---

FRONTEND_DIR=frontend
BACKEND_DIR=backend
OUTPUT_BIN=$(BACKEND_DIR)/etcd-dns-webui

# --- TASKS ---

.PHONY: help dev build prod run-prod clean

help:
	@echo "Common tasks:"
	@echo "  make dev         - Start Vite + Go backend in dev mode (proxy to Vite)"
	@echo "  make build       - Build Go backend (dev mode, no embed)"
	@echo "  make prod        - Build frontend and backend (with embedded static files)"
	@echo "  make run-prod    - Run the production binary locally"
	@echo "  make clean       - Remove generated build artifacts"

dev:
	@echo "Running dev mode: Vite + Go (with reverse proxy)"
	cd $(FRONTEND_DIR) && npm run dev & \
	go run -tags=dev ./$(BACKEND_DIR)

build:
	@echo "Building Go backend in dev mode..."
	go build -tags=dev -o $(OUTPUT_BIN) ./$(BACKEND_DIR)

prod:
	@echo "Building frontend..."
	npm install --prefix $(FRONTEND_DIR)
	npm run build --prefix $(FRONTEND_DIR)

	@echo "Copying frontend build into backend/ for embedding..."
	rm -rf $(BACKEND_DIR)/dist
	cp -r $(FRONTEND_DIR)/dist $(BACKEND_DIR)/dist

	@echo "Building Go backend with embedded frontend..."
	cd $(BACKEND_DIR) && go build -o etcd-dns-webui

run-prod: prod
	@echo "Running production binary..."
	./$(BACKEND_DIR)/etcd-dns-webui

clean:
	@echo "Cleaning build output..."
	rm -f $(OUTPUT_BIN)
	rm -rf $(FRONTEND_DIR)/dist
