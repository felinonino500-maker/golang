# TODO — RTDB Go Monitor

## Terselesaikan

### Dashboard overview menampilkan kesehatan koneksi dan metrik firmware
- Tampilkan status online/offline/demo, endpoint RTDB aktif, dan waktu sinkronisasi terakhir.
- Tampilkan metrik uptime, versi firmware, latency, jumlah pembacaan, dan error rate.
- Gunakan indikator visual yang membedakan sehat, perhatian, dan error.

### Live Data membaca payload RTDB melalui adapter terpisah
- Ambil JSON dari Firebase RTDB path firmware dengan adapter/API yang tidak tercampur dengan UI.
- Tampilkan payload terbaru dengan timestamp, status perubahan, dan refresh manual.
- Sediakan fallback payload contoh yang diberi label Demo saat endpoint tidak dapat diakses.

### Activity Log merekam akses data
- Tampilkan event koneksi, pembacaan, error, dan reconnect dalam urutan terbaru.
- Sediakan pesan error yang dapat ditindaklanjuti dan tombol retry.

### Navigasi mobile portrait-first
- Sediakan tab Overview, Live Data, dan Activity Log untuk perpindahan cepat.
- Pertahankan target sentuh besar dan safe area pada Web/Expo/native.

### Branding aplikasi
- Gunakan identitas RTDB Go Monitor pada ikon launcher, splash, favicon, dan warna UI.
- Pertahankan bundle ID dan scheme yang dibuat starter.

### Backend Go menjadi jalur akses RTDB
- Service `cmd/rtdb-api/main.go` membaca Firebase RTDB menggunakan standard library Go.
- Sediakan endpoint `/health` dan `/api/firmware`, CORS untuk preview, timeout, validasi path, serta envelope JSON yang stabil.
- Mobile client memanggil backend Go; service account dan database admin key tidak masuk bundle mobile.

## Terbuka

### Koneksi produksi dan auth RTDB
- Verifikasi Firebase Rules untuk read access pada path firmware.
- Jika RTDB produksi memerlukan auth, tambahkan alur token/session di adapter tanpa menaruh service account di aplikasi.
