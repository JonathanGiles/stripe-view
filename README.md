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
1. Download `stripe-view-win.zip` from [Releases](../../releases)
2. Extract the zip file
3. Create `config.json` next to the exe (see Configuration below)
4. Double-click `stripe-view-win.exe`
5. Browser automatically opens to `http://localhost:3000`
6. Server runs silently in the background (no console window)

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

## Managing the Server

### Stopping the Server
- **Via UI**: Click Settings ⚙️ → Stop Server button at the bottom
- **Via Browser**: Navigate to `http://localhost:3000/api/shutdown`
- **Via Task Manager** (Windows): End the `stripe-view-win.exe` process

### Upgrading
1. Stop the current server (see above)
2. Download the latest `stripe-view-win.zip` from [Releases](../../releases)
3. Extract and replace the old exe
4. Your `config.json` and `view.json` are preserved
5. Start the new version

### Version Check
- Open Settings ⚙️ to see your current version
- Compare with latest release: https://github.com/JonathanGiles/stripe-view/releases

## Release

```bash
./release.sh 0.0.4
```

Builds Windows executable via GitHub Actions and creates release automatically.
