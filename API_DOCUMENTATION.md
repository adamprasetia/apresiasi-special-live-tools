# Apresiasi API Documentation

API Server untuk menerima donasi dari eksternal (webhook, form, dll)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Jalankan API server:
```bash
npm run api
```

Server akan berjalan di:
- HTTP API: `http://localhost:3000`
- WebSocket: `ws://localhost:8766`

## Endpoints

### 1. Health Check
**GET** `/health`

Response:
```json
{
  "status": "ok",
  "message": "Apresiasi API Server is running",
  "connectedDashboards": 1,
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

### 2. Submit Donation
**POST** `/api/donations`

Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "name": "John Doe",
  "amount": 50000,
  "message": "Semangat terus untuk jurnalisme berkualitas!",
  "hideName": false
}
```

Parameters:
- `name` (required, string): Nama donatur
- `amount` (required, number): Jumlah donasi dalam Rupiah
- `message` (optional, string): Pesan dukungan
- `hideName` (optional, boolean): true untuk tampilkan sebagai Anonim

Success Response (201):
```json
{
  "success": true,
  "message": "Donation received successfully",
  "data": {
    "id": 1701341400000,
    "name": "John Doe",
    "amount": 50000,
    "message": "Semangat terus untuk jurnalisme berkualitas!",
    "hideName": false,
    "timestamp": "2025-11-30T10:30:00.000Z",
    "source": "api"
  }
}
```

Error Response (400):
```json
{
  "success": false,
  "error": "Name is required"
}
```

## Testing dengan Postman

### Quick Test Examples:

**Example 1: Donasi Normal**
```bash
curl -X POST http://localhost:3000/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi Santoso",
    "amount": 100000,
    "message": "Untuk jurnalisme yang lebih baik"
  }'
```

**Example 2: Donasi Anonim**
```bash
curl -X POST http://localhost:3000/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "amount": 250000,
    "message": "Tetap semangat!",
    "hideName": true
  }'
```

**Example 3: Donasi Tanpa Pesan**
```bash
curl -X POST http://localhost:3000/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Siti Aminah",
    "amount": 50000
  }'
```

## Postman Collection

Import collection ini ke Postman:

### Collection JSON:
```json
{
  "info": {
    "name": "Apresiasi API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Submit Donation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"John Doe\",\n  \"amount\": 50000,\n  \"message\": \"Semangat terus!\",\n  \"hideName\": false\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/donations",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "donations"]
        }
      }
    },
    {
      "name": "Submit Anonymous Donation",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Secret Supporter\",\n  \"amount\": 250000,\n  \"message\": \"Untuk jurnalisme berkualitas!\",\n  \"hideName\": true\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/donations",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "donations"]
        }
      }
    }
  ]
}
```

## Flow Diagram

```
External System (Postman/Webhook)
         │
         │ HTTP POST
         ▼
   API Server (port 3000)
         │
         │ WebSocket
         ▼
   Dashboard (port 8766)
         │
         ├─► Moderasi ON → Antrian Donasi
         │
         └─► Moderasi OFF → Langsung ke Display
```

## Error Handling

- **400 Bad Request**: Parameter tidak valid
- **404 Not Found**: Endpoint tidak ditemukan
- **500 Internal Server Error**: Error server

## Notes

1. Dashboard harus sudah buka dan connect ke API server (ws://localhost:8766)
2. Donasi akan masuk ke antrian jika moderasi aktif
3. Donasi langsung tayang jika moderasi tidak aktif
4. Semua donasi dari API akan tercatat dengan `source: "api"`
