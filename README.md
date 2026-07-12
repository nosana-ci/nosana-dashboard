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

## Devnet Development

To run the dashboard against the devnet backend at `https://local.devnet.nosana.com`:

### Run

```bash
sudo npm run dev -- --dotenv .env.dev --host local.devnet.nosana.com --port 443 --https
```

The dashboard will be available at `https://local.devnet.nosana.com/`.
Your browser will show a self-signed certificate warning that you'll need to accept.
