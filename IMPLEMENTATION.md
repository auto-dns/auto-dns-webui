# Milestone 1: Backend Record Integration

📅 Estimated time: 1–2 days

**Goal:** Replace static JSON with actual etcd-backed DNS records.

**Tasks:**
* Define DNS record model (structs for A, CNAME, etc.)
* Add etcd client integration (e.g., using go.etcd.io/etcd/client/v3)
* Implement record listing logic in HandleRecords
* Return real records as JSON from /api/records
* Add logging and error handling for etcd issues

**Deliverable:** /api/records returns actual etcd DNS records.

⸻

## Milestone 2: Frontend Table View

📅 Estimated time: 1–2 days

**Goal:** Render DNS records in a styled table.

**Tasks:**
* Use Vite + React or vanilla + Tailwind (your choice) for styling
* Fetch /api/records on load
* Display records (name, type, value, created, etc.)
* Add basic loading and error UI

**Deliverable:** Root page / renders styled DNS record table from backend data.

⸻

## Milestone 4: Delete Records

📅 Estimated time: 1 day

**Goal:** Enable record removal from UI.

**Tasks:**
* Add delete button per row
* Confirm deletion with modal or prompt
* Send DELETE /api/records?name=X&type=Y
* Backend deletes key from etcd
* Refresh table

**Deliverable:** Records can be safely deleted via UI.

⸻

## Milestone 6: Authentication & Access Control

📅 Estimated time: 1–2 days

**Goal:** Protect the interface for authorized users only.

**Tasks:**
* Implement basic HTTP auth, token-based auth, or reverse proxy auth (e.g., Authentik)
* Add auth headers to frontend API requests
* Display “Unauthorized” UI if access denied

**Deliverable:** UI/API protected from public access.

⸻

## Milestone 7: Metrics + Health

📅 Estimated time: 1 day

**Goal:** Make the app observable and production-ready.

**Tasks:**
* Add /healthz and /metrics endpoints
* Expose Prometheus metrics (e.g., request counts, etcd errors)
* Track number of records, API latency

**Deliverable:** Health check and Prometheus integration in place.

⸻

## Milestone 8: Testing & Validation

📅 Estimated time: 2–3 days

**Goal:** Ensure app is reliable and works as expected.

**Tasks:**
* Unit tests for etcd client, record parsing, handlers
* End-to-end tests for UI + API flow
* Manual QA: add/edit/delete + edge cases (conflicts, bad values)

**Deliverable:** Test coverage and stability checks.

⸻

## Milestone 9: Final Polish + Deployment

📅 Estimated time: 1–2 days

**Goal:** Ship production-ready build.

**Tasks:**
* Finalize UI styles (dark mode? logo? mobile?)
* Add Dockerfile, Makefile, .env, version tagging
* Deploy behind reverse proxy (Caddy/Traefik)
* Document setup, API, dev workflow in README.md

Deliverable: Fully deployable and documented DNS Web UI.

⸻

## Optional Future Enhancements
* Live refresh / polling for DNS changes
* WebSocket-based update stream
* Smart record validation (e.g. IP regex)
* RBAC with user roles (viewer/editor)
* Audit log of changes
