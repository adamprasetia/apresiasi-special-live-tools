# 🚀 Quick Start - API Server

## Cara Pakai API

### 1. Jalankan API Server
```bash
npm run api
```

Server akan jalan di: **http://localhost:3000**

### 2. Buka Dashboard
Buka `dashboard.html` di browser. Dashboard akan otomatis connect ke API server.

### 3. Test dengan Postman

#### Import Collection
1. Buka Postman
2. Import file: `Apresiasi_API.postman_collection.json`
3. Pilih request "Donation - Normal"
4. Klik **Send**

#### Atau Test dengan cURL
```bash
curl -X POST http://localhost:3000/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "amount": 50000,
    "message": "Semangat terus!"
  }'
```

### 4. Lihat Hasilnya
- ✅ Jika **Moderasi ON**: Donasi masuk ke **Antrian Donasi**
- ✅ Jika **Moderasi OFF**: Donasi langsung tayang di **Display**

---

## API Endpoints

### Health Check
```
GET http://localhost:3000/health
```

### Submit Donation
```
POST http://localhost:3000/api/donations
Content-Type: application/json

{
  "name": "Nama Donatur",
  "amount": 50000,
  "message": "Pesan dukungan (opsional)",
  "hideName": false
}
```

**Parameters:**
- `name` (required) - Nama donatur
- `amount` (required) - Jumlah dalam Rupiah
- `message` (optional) - Pesan dukungan
- `hideName` (optional) - true untuk anonim

---

## Testing Flow

### Scenario 1: Moderasi Aktif
1. Di dashboard, nyalakan toggle **"Enable Moderasi"**
2. Kirim donasi via Postman
3. Donasi masuk ke **"Antrian Donasi"**
4. Review dan approve manual

### Scenario 2: Langsung Tayang
1. Di dashboard, matikan toggle **"Enable Moderasi"**
2. Kirim donasi via Postman
3. Donasi langsung muncul di **Display**
4. Tercatat di **"Donasi Tayang"**

### Scenario 3: Donasi Anonim
```json
{
  "name": "Supporter",
  "amount": 100000,
  "message": "Tetap semangat!",
  "hideName": true
}
```
Nama akan ditampilkan sebagai **"Anonim"**

---

## Multi Server Setup

Jika perlu jalankan semua server sekaligus:

```bash
# Terminal 1: Relay Server (untuk cross-browser communication)
node relay-server.js

# Terminal 2: API Server (untuk menerima donasi via HTTP)
npm run api
```

---

## Troubleshooting

### ❌ Dashboard tidak menerima donasi
- Pastikan dashboard sudah dibuka di browser
- Cek console: harus ada "✅ Connected to API server"
- Refresh dashboard jika perlu

### ❌ Error 400 Bad Request
- Cek parameter `name` dan `amount` sudah diisi
- `amount` harus angka positif

### ❌ Connection refused
- Pastikan API server sudah jalan (`npm run api`)
- Cek port 3000 tidak dipakai aplikasi lain

---

## Full Documentation
Lihat file `API_DOCUMENTATION.md` untuk dokumentasi lengkap.
