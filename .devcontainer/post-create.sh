#!/usr/bin/env bash
set -e

# Install frontend dependencies
npm install --prefix frontend

# Wait for etcd to be ready and seed it with DNS records
echo "Waiting for etcd to become healthy..."
until etcdctl endpoint health; do
  sleep 1
done

echo "Seeding etcd with test DNS records..."
./scripts/seed-etcd.sh
