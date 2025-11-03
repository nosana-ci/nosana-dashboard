# Nosana Dashboard

Nuxt 3 site for the [Nosana Explorer](https://dashboard.nosana.com).

![Nosana Dashboard](/static/img/screenshot.jpg)

## Build Setup

Make sure to install the dependencies:

```bash
# install dependencies
npm ci

# Start the development server on `http://localhost:3000`:
npm run dev

# Or build the application for production:
npm run generate

# Preview the production build
npx http-server .output/public
```

## Local Development Setup

### 1. Install mkcert

```bash
# Windows
choco install mkcert

# macOS
brew install mkcert

# Linux
sudo apt-get update && apt-get install -y libnss3-tools wget
wget https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v*-linux-amd64
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

### 2. Generate SSL certificates

```bash
chmod +x setup-local-ssl.sh
./setup-local-ssl.sh
```

### 3. Update hosts file

Add this line to your hosts file:

- macOS/Linux: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

```
127.0.0.1    devnet.nosana.io
```

### 4. Run the dev server

```bash
sudo npm run dev:https
```

Access at: https://devnet.nosana.io
