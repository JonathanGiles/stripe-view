# Payment Dashboard

A professional dashboard for viewing Stripe and PayPal payment analytics across multiple projects.

## Installation Options

### Option 1: Standalone Executable (Windows - No Node.js Required)

1. Download the latest release from [Releases](../../releases)
2. Extract the ZIP file containing:
   - `stripe-view-win.exe` - The application
   - `config.json` - Your API credentials (edit this)
   - `view.json` - Saved layout preferences (auto-generated)
   - `config.example.json` - Example configuration
3. Edit `config.json` with your API credentials
4. **Double-click `stripe-view-win.exe`** to start
5. Your browser will open automatically to `http://localhost:3000`

**To stop:** Close the terminal window or press Ctrl+C

**Note:** The executable looks for `config.json` and `view.json` in its own directory. No separate start/stop scripts needed!

### Option 2: Node.js Version (All Platforms)

**Requirements:**
- Node.js 14.0.0 or higher (Download from https://nodejs.org/)
- Stripe API key
- PayPal API credentials (optional)

**Quick Start:**
1. Run `npm install` (first time only)
2. Run `npm start`
3. Open browser to http://localhost:3000
4. **To stop:** Press Ctrl+C in the terminal

### Configuration

Edit `config.json` to add your projects:

```json
{
  "projects": [
    {
      "id": "project1",
      "name": "My Store",
      "stripe": {
        "apiKey": "rk_live_YOUR_KEY_HERE",
        "enabled": true
      },
      "paypal": {
        "enabled": false,
        "restApi": {
          "clientId": "YOUR_CLIENT_ID",
          "secret": "YOUR_SECRET"
        },
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

### Getting API Keys

**Stripe:**

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your API key (restricted key `rk_live_*` or secret key `sk_live_*`)
3. For restricted keys, enable "Charges: Read" and "Balance: Read" permissions

**PayPal (Two Options):**

*Option A - Classic API (Recommended - Broader Access):*

1. Go to https://developer.paypal.com/
2. Tools → API Credentials
3. Get your API Username, Password, and Signature
4. Add to `classicApi` section in config.json

*Option B - REST API (Requires Special Permissions):*

1. Go to https://developer.paypal.com/dashboard/
2. Click "Apps & Credentials" → "Live" tab
3. Copy Client ID and Secret
4. Add to `restApi` section in config.json

> **Note:** PayPal REST API requires Business account with Transaction Search API access. Most accounts don't have this - use Classic API instead.

## Features

- 📊 **Real-time data** from Stripe and PayPal APIs
- 📈 **30-day trailing analytics** with charts
- 💰 **Revenue tracking** with growth indicators
- 🎯 **Multiple projects** in one dashboard
- 🔄 **Drag & drop** to reorder widgets
- 📱 **Responsive design** for desktop and mobile
- ⚡ **Compact & detailed views**
- 🔍 **Sorting & filtering** by revenue, provider, etc.

## Troubleshooting

### "Node.js is not installed"
Install Node.js from https://nodejs.org/

### Dashboard won't load
- Check that port 3000 is available
- Run `stop.bat` (or `./stop.sh`) then `start.bat` (or `./start.sh`) again
- Check `server.log` for errors

### Stripe errors
- Verify API key is copied correctly (no extra spaces)
- For restricted keys: Enable "Charges: Read" and "Balance: Read" in Stripe Dashboard
- Or use a secret key (`sk_test_*` or `sk_live_*`)

### PayPal errors
- Most PayPal accounts don't have Transaction API access
- Set `"enabled": false` in config.json under PayPal
- Use Sandbox credentials for testing
- Contact PayPal support to enable API access

## Building Executables

To build Windows executables from macOS:

```bash
# Push a version tag to trigger GitHub Action
git tag v1.0.0
git push origin v1.0.0

# Or manually trigger the workflow in GitHub Actions
```

The GitHub Action will:

- Build `stripe-view-win.exe` for Windows
- Create a release package with:
  - `stripe-view-win.exe` - The standalone application
  - `config.json` - Empty config for user to fill in
  - `config.example.json` - Example configuration
  - `view.json` - Empty layout preferences file
  - `README.txt` - Quick start instructions
- Upload as GitHub Release artifact

To build locally (requires Node.js):

```bash
npm install
npm run build
# Output: dist/stripe-view-win.exe
```

**For your brother:** Just download the release ZIP, edit `config.json`, and double-click the `.exe` file. Everything he needs is self-contained!

## File Structure

```plaintext
Development (Node.js):
stripe-view/
├── config.json            # Your project configuration
├── view.json              # Saved layout (auto-generated)
├── package.json           # Node.js dependencies
├── src/                   # Source code
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── server.js
└── node_modules/          # Dependencies (auto-installed)

Standalone Executable (Windows):
stripe-view-win/
├── stripe-view-win.exe    # Double-click to run (everything bundled inside)
├── config.json            # Your API credentials (edit this)
├── view.json              # Saved layout preferences (auto-generated)
├── config.example.json    # Example configuration
└── README.txt             # Quick start instructions
```

## Support

For issues or questions, check the error messages in:
- The browser console (F12)
- The `server.log` file

Common issues are usually:
- Wrong or missing API keys
- PayPal account limitations (disable PayPal if not needed)
- Port 3000 already in use by another application
