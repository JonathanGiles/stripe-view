# Auto-Refresh Polling

The dashboard now automatically refreshes in the background to fetch the latest sales data.

## Configuration

Set the polling interval in `config.json`:

```json
{
  "pollingIntervalSeconds": 60,
  "projects": [...]
}
```

- **Default**: 60 seconds
- **Recommended**: 30-120 seconds (to avoid rate limiting)
- **Minimum**: 10 seconds (but may hit API rate limits)

## Features

### Silent Background Updates
- Dashboard refreshes automatically without user interaction
- No loading indicators or notifications during refresh
- Data updates seamlessly in place

### Sale Notifications
- **Sound Alert**: Pleasant chime plays when new sales are detected
- **Detection**: Compares order count between refreshes
- **Console Log**: Shows which project had new sales

### Rate Limiting
Be mindful of API rate limits:
- **Stripe**: No strict limit on restricted keys, but recommended < 1 req/sec
- **PayPal**: Classic API has looser limits, but still recommended moderation

## Technical Details

- Uses `setInterval` for background polling
- Detects changes by comparing order counts
- Generates chime sound using Web Audio API (C5, E5, G5 notes)
- No UI notifications unless new sales detected
- Continues polling even if dashboard is in background tab
