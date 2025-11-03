#!/bin/bash

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null
then
    echo "mkcert is not installed. Please install it first, instructions included within the ReadMe:"
    echo "  macOS: brew install mkcert"
    echo "  Linux: See https://github.com/FiloSottile/mkcert#installation"
    echo "  Windows: choco install mkcert"
    exit 1
fi

# Install local CA
echo "Installing local CA..."
mkcert -install

# Generate certificates
echo "Generating certificates for devnet.nosana.io..."
mkcert devnet.nosana.io localhost 127.0.0.1

echo "✅ SSL certificates generated successfully!"
echo "Certificates created:"
echo "  - devnet.nosana.io+2.pem"
echo "  - devnet.nosana.io+2-key.pem"