# Rencana Implementasi — RTDB Go Monitor

## Tujuan produk
RTDB Go Monitor adalah aplikasi mobile operasional untuk operator dan developer Golang yang perlu melihat kesehatan firmware dan membaca payload dari Firebase Realtime Database tanpa menavigasi konsol web. Aplikasi memakai konfigurasi Firebase yang diberikan pengguna, tetapi adapter akses data dipisahkan dari komponen tampilan sehingga endpoint dan bentuk payload dapat diganti tanpa merombak UI.

## Pendekatan implementasi
- **Stack tetap:** Expo Router / React Native / TypeScript / NativeWind dari starter Mobile Dev. Navigasi portrait-first menggunakan tiga tab: Overview, Live Data, dan Activity Log.
- **Backend Go:** `cmd/rtdb-api/main.go` adalah service Go standar-library pada port API Mobile. Ia mengambil JSON dari Firebase RTDB, menangani CORS, health check, timeout, validasi path, dan mengembalikan envelope data yang stabil untuk UI. `lib/rtdb.ts` hanya memanggil endpoint Go; kredensial admin tidak pernah masuk bundle mobile.
- **Adapter RTDB:** `lib/rtdb.ts` memanggil `/api/firmware` pada backend Go dengan polling berkala. Hook `hooks/use-rtdb-monitor.ts` mengatur normalisasi payload fleksibel, status koneksi, metrik, dan log lokal. Polling dipilih agar konsisten di Expo Web dan perangkat native; interval dibuat mudah diganti saat adapter streaming Go ditambahkan.
- **Bentuk data:** Adapter menerima payload umum berupa `firmware`, `status`, `metrics`, `telemetry`, atau object datar. Normalizer menurunkan status online, versi, uptime, latency, read count, error rate, timestamp, dan daftar field payload dengan fallback yang aman untuk data firmware yang belum seragam.
- **Ketahanan UI:** Jika RTDB belum dapat diakses atau rules menolak baca, aplikasi menampilkan status yang jujur, log error/reconnect, tombol retry, dan payload contoh berlabel Demo agar dashboard tetap dapat dipreview tanpa mengaburkan kondisi koneksi nyata.
- **Branding:** Ikon launcher berbentuk node database + jalur sinyal berwarna teal/amber, tanpa rounded corners yang dibakar ke dalam gambar. `app.config.ts` mempertahankan bundle ID dan scheme starter.

## Struktur proyek
- `app/(tabs)/_layout.tsx`: tab bar dan label navigasi Overview, Live Data, Activity.
- `app/(tabs)/index.tsx`: ringkasan health, endpoint/path aktif, metrik firmware, dan kartu status.
- `app/(tabs)/live.tsx`: payload terbaru, refresh manual, timestamp update, dan daftar field yang berubah.
- `app/(tabs)/activity.tsx`: timeline event koneksi, pembacaan, reconnect, dan error.
- `components/rtdb-ui.tsx`: komponen visual kecil yang dipakai lintas layar seperti badge, metric card, dan section header.
- `hooks/use-rtdb-monitor.ts`: state polling, retry, normalisasi data, dan event log.
- `lib/rtdb.ts`: client adapter ke API Go yang tidak bergantung pada UI.
- `cmd/rtdb-api/main.go`: service Go untuk akses Firebase RTDB.
- `go.mod`: modul Go tanpa dependency eksternal.
- `constants/theme.ts` dan `global.css`: token visual dark control-room.
- `assets/images/*`: icon, splash, favicon, serta varian Android dengan identitas RTDB Go.
- `manus-routes.json`: daftar route Expo Web yang tersedia untuk preview.

## Desain
### Opsi gaya singkat
1. **Control-room editorial** — panel gelap, aksen teal signal dan amber warning, tipografi tegas, status selalu terlihat. Probabilitas 0,07.
2. **Soft utility** — permukaan krem, kartu ringan, aksen biru muda, fokus pada kenyamanan pembacaan. Probabilitas 0,06.
3. **Industrial telemetry** — latar grafit, garis grid, lime phosphor, dan label monospace padat. Probabilitas 0,04.

**Gaya terpilih: Control-room editorial.**

- **Design Movement:** editorial control-room modern yang memadukan panel monitoring dengan hierarki majalah teknis.
- **Core Principles:** status terbaca dalam satu sapuan; data lebih penting daripada dekorasi; warning kontras tetapi tidak panik; tindakan utama selalu dekat ibu jari.
- **Color Philosophy:** navy-black `#07131A` menjadi kanvas tenang; teal `#32D1C2` menandai aliran data sehat; amber `#F4B860` menandai perhatian; coral `#FF6B5E` khusus error. Surface `#10232B` dan border `#1D3A43` memberi kedalaman tanpa card soup.
- **Layout Paradigm:** kolom editorial vertikal dengan header ringkas, satu kartu hero health, lalu strip metrik horizontal dan section list; bukan dashboard grid simetris.
- **Signature Elements:** status-pulse dot; garis aksen teal di tepi kartu; label teknis uppercase dengan tracking longgar; JSON/payload memakai bidang monospaced.
- **Interaction Philosophy:** tap target besar, refresh manual eksplisit, perubahan data diringkas sebagai event; tidak ada gesture tersembunyi untuk aksi penting.
- **Animation:** pulse 2 detik pada status online, perubahan angka crossfade ringan, skeleton hanya saat first load; hindari animasi berulang yang mengganggu debugging.
- **Typography System:** Inter/system sans untuk headline dan body, monospace system untuk endpoint, timestamp, dan field payload. Hierarki: 30/36 hero, 18/24 section, 14/20 body, 11/14 label.
- **Brand Essence:** “lampu indikator RTDB untuk tim firmware Golang” — sigap, tenang, observasional.
- **Brand Voice:** singkat, teknis, tidak dramatis. Contoh: “Data terakhir masuk 12 detik lalu.” dan “RTDB belum merespons — periksa rules atau koneksi device.”
- **Wordmark & Logo:** wordmark `RTDB / GO` dengan slash sebagai jalur data; mark berupa tiga node yang terhubung ke panah kanan.
- **Signature Brand Color:** Signal Teal `#32D1C2`.

## Catatan keamanan dan konfigurasi
Firebase web config bukan pengganti rules keamanan. Backend Go membaca URL RTDB melalui konfigurasi service dan meneruskan payload terkontrol ke aplikasi; tidak ada service account atau database admin key yang dimasukkan ke bundle mobile. Akses produksi tetap bergantung pada Realtime Database Rules. Path default monitor adalah `firmware`; adapter memudahkan penggantian path atau pengenalan auth di tahap berikutnya.
