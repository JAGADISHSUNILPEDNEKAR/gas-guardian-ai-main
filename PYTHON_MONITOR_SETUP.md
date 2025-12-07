# Python Gas Monitor Integration

This guide explains how to set up and run the Python gas fee monitor to provide real-time gas data to the frontend dashboard.

## Overview

The Python monitor (`gas_fee_monitor.py`) fetches real-time gas prices from MetaMask's API and writes them to a JSON file that the backend reads. The frontend automatically displays this data when available.

## Setup

### 1. Install Python Dependencies

```bash
pip install requests
```

### 2. Run the Monitor

You have two options:

#### Option A: Real-time Mode (Recommended for Dashboard)

This mode continuously fetches gas prices and writes to JSON for the backend:

```bash
python gas_fee_monitor.py --realtime
```

#### Option B: Full Monitoring Mode

This mode collects baseline data, calculates thresholds, and monitors for transaction opportunities:

```bash
python gas_fee_monitor.py
```

## How It Works

1. **Python Monitor** (`gas_fee_monitor.py`):
   - Fetches gas prices from MetaMask API every second
   - Writes current data to `gas_monitor_data.json` in the project root
   - Runs continuously in the background

2. **Backend Service** (`PythonGasMonitorService.ts`):
   - Reads `gas_monitor_data.json` every time `/api/gas/current` is called
   - Checks if data is fresh (less than 60 seconds old)
   - Falls back to blockchain gas oracle if Python data is unavailable

3. **Frontend Dashboard**:
   - Automatically polls `/api/gas/current` every 12 seconds
   - Displays the gas price from Python monitor when available
   - Shows "python_monitor" as the source in the API response

## File Locations

- **Python Script**: `gas-guardian-ai-main/gas_fee_monitor.py`
- **JSON Output**: `gas-guardian-ai-main/gas_monitor_data.json`
- **Backend Service**: `gas-guardian-ai-main/backend/src/services/PythonGasMonitorService.ts`
- **API Route**: `gas-guardian-ai-main/backend/src/api/routes/gas.ts`

## Running as a Background Service

### Windows (PowerShell)

```powershell
# Run in background
Start-Process python -ArgumentList "gas_fee_monitor.py", "--realtime" -WindowStyle Hidden

# Or run in a separate terminal window
python gas_fee_monitor.py --realtime
```

### Linux/Mac

```bash
# Run in background with nohup
nohup python gas_fee_monitor.py --realtime > gas_monitor.log 2>&1 &

# Or use screen/tmux
screen -S gasmonitor
python gas_fee_monitor.py --realtime
# Press Ctrl+A then D to detach
```

## Verification

1. **Check if JSON file is being created**:
   ```bash
   ls -la gas_monitor_data.json
   cat gas_monitor_data.json
   ```

2. **Check backend logs**:
   - Look for "Using Python monitor gas data" in console
   - If you see "Using blockchain gas data", the Python monitor isn't running

3. **Check frontend**:
   - Open browser DevTools → Network tab
   - Look for `/api/gas/current` requests
   - Check response - should have `"source": "python_monitor"` when working

## Troubleshooting

### Python monitor not detected

- **Check file path**: Ensure `gas_monitor_data.json` is in the project root
- **Check file age**: Data older than 60 seconds is considered stale
- **Check permissions**: Ensure Python script can write to the file
- **Check Python script**: Verify it's running with `--realtime` flag

### Data not updating

- **Check Python script logs**: Look at `gas_monitor.log` or console output
- **Check API connectivity**: Ensure MetaMask API is accessible
- **Check file permissions**: Ensure the file can be written to

### Fallback to blockchain

If Python monitor data is unavailable, the backend automatically falls back to the blockchain gas oracle. This is normal behavior and ensures the dashboard always shows gas prices.

## Configuration

You can modify the monitor behavior in `gas_fee_monitor.py`:

```python
CONFIG = {
    "gas_api_url": "https://gas.api.cx.metamask.io/networks/1/suggestedGasFees",
    "fetch_interval": 1,  # seconds between fetches
    "json_filename": "gas_monitor_data.json"  # output file name
}
```

## Notes

- The Python monitor fetches Ethereum mainnet gas prices (network ID 1)
- Data is updated every second when running in real-time mode
- The backend checks data freshness (60-second window)
- Frontend automatically refreshes every 12 seconds
- No frontend changes needed - it works automatically!

