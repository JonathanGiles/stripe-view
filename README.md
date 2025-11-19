# Stripe View Dashboard

Real-time revenue analytics for Stripe and PayPal across multiple projects. Professional, data-dense dashboard with automatic refresh and multi-currency support.

## Features

- 📊 **Real-time tracking** with auto-refresh and sound alerts
- 💰 **Multi-currency support** (USD, NZD, AUD, EUR, GBP, CAD)
- 📈 **30-day analytics** with charts and growth trends
- 🎯 **Multiple projects** in one unified view
- 🔄 **Drag-and-drop** widget reordering
- ⚡ **Compact/detailed views** optimized for data density
- 🔍 **Sort & filter** by revenue, provider, performance
- 💼 **Stripe + PayPal** combined metrics

## Quick Start

### Windows Executable (Recommended)
1. Download `stripe-view-win.exe` from [Releases](../../releases)
2. Create `config.json` next to the exe (see Configuration below)
3. Double-click `stripe-view-win.exe`
4. Browser opens to `http://localhost:3000`

### Node.js (All Platforms)
```bash
npm install
npm start
```

## Configuration

Create `config.json` next to the executable:

```json
{
  "pollingIntervalSeconds": 60,
  "projects": [
    {
      "id": "project1",
      "name": "My Store",
      "stripe": {
        "apiKey": "sk_live_YOUR_KEY",
        "enabled": true
      },
      "paypal": {
        "enabled": false,
        "classicApi": {
          "username": "api_username",
          "password": "api_password",
          "signature": "api_signature"
        }
      }
    }
  ]
}
```

**Stripe API Key:**
- Get from: https://dashboard.stripe.com/apikeys
- Use `sk_live_*` (secret key) or `rk_live_*` (restricted key with Charges/Balance read permissions)

**PayPal API (Optional):**
- **Classic API** (recommended): Get username/password/signature from https://developer.paypal.com/ → API Credentials
- **REST API** (alternative): Get clientId/secret from PayPal Dashboard → Apps & Credentials
- Note: Most PayPal accounts only support Classic API

**Settings:**
- `pollingIntervalSeconds`: Auto-refresh interval (default: 60)

## Development

```bash
npm install
npm start
```

## Release

```bash
./release.sh 0.0.4
```

Builds Windows executable via GitHub Actions and creates release automatically.
