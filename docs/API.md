# GasGuard Mentor API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### POST /api/chat
AI chat interface for gas optimization recommendations.

**Request:**
```json
{
  "message": "Should I swap 1000 FLR now?",
  "walletAddress": "0x...",
  "context": {
    "conversationId": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": {
      "recommendation": "WAIT",
      "reasoning": "...",
      "currentConditions": {...},
      "prediction": {...},
      "savings": {...},
      "actions": [...]
    }
  }
}
```

### GET /api/gas/current
Get current gas price and network status.

**Response:**
```json
{
  "success": true,
  "data": {
    "gasPrice": {
      "gwei": 35,
      "wei": "35000000000"
    },
    "prices": {
      "flr": 2.362,
      "usd": 0.035
    },
    "network": {
      "congestion": 68,
      "blockNumber": 12453678,
      "blockTime": 12
    },
    "ftsoPrice": {
      "flr": 0.0148,
      "timestamp": 1701907200
    },
    "status": "MEDIUM",
    "trend": "FALLING"
  }
}
```

### GET /api/gas/predictions
Get gas price predictions for 1h, 6h, and 24h.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timeframe": "1h",
      "predictedGas": 28.5,
      "confidence": 70,
      "trend": "falling",
      "reasoning": "..."
    }
  ]
}
```

### POST /api/transactions/schedule
Schedule a GasGuard protected transaction.

**Request:**
```json
{
  "transaction": {
    "target": "0x...",
    "data": "0x...",
    "value": "0"
  },
  "safetyParams": {
    "maxGasPrice": 25,
    "minFlrPrice": 0.014,
    "maxSlippage": 100,
    "deadline": 1701928800
  }
}
```

### GET /api/transactions/:id
Get transaction status by execution ID.

### POST /api/alerts
Create a new alert.

### GET /api/alerts
Get user's active alerts.

### DELETE /api/alerts/:id
Delete an alert.

### GET /api/leaderboard
Get global savings leaderboard.

### POST /api/compare/deployment
Compare deployment costs across chains.

