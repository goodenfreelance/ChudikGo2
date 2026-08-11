#!/bin/bash
set -e

if [ ! -f /tmp/go/bin/go ]; then
  echo "Downloading and installing Go binary..."
  mkdir -p /tmp
  curl -sSL "https://go.dev/dl/go1.22.5.linux-amd64.tar.gz" | tar -xz -C /tmp
fi

mkdir -p dist
cd server-go
/tmp/go/bin/go build -o ../dist/go-server .
echo "Go server built successfully at dist/go-server"
