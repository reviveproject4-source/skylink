# SkyLink — Personal Order & Landing Page Engine

Aplikasi manajemen order, checkout form instan, dan landing page studio split-screen (sejenis Scalev / OrderHero / Sisilink) khusus untuk pemakaian pribadi (*self-hosted*).

---

## 🎨 Tema Visual
- **Warna Utama**: Putih Bersih & Biru Terang (*Electric Sky Blue* - `#0284c7` & `#0ea5e9`).
- **Aksen Peringatan**: Merah Terang (*Rose Red*) untuk indikator pixel belum terpasang.
- **Aksen Sukses**: Hijau Zamrud (*Emerald*) untuk transaksi lunas & status live.

---

## 🚀 Fitur Utama

1. **Halaman Utama (Dashboard)**:
   - Grafik tren pendapatan harian selama 1 bulan (30 hari terakhir) interaktif.
   - Total nominal pendapatan kotor & bersih.
   - Ringkasan funnel (Dilihat → Masuk Keranjang → Sudah Bayar).
2. **Katalog Produk Digital**:
   - Produk jenis **Digital**.
   - Opsi pengiriman aset: **Upload File** (PDF/ZIP) ATAU **Input Link Akses** (Google Drive/Notion).
   - Harga normal (coret), harga promo, diskon otomatis (%), dan tanggal/jam batas promo (*countdown timer*).
   - **Bump Offer**: Penawaran produk tambahan di form checkout dengan harga spesial.
3. **Landing Page Studio (Split-Screen)**:
   - Sisi kiri editor kode HTML (dilengkapi pencarian kode dan tombol unggah `.html`).
   - Sisi kanan pratinjau live (*live responsive iframe*) dengan switch mode Desktop & Mobile.
   - **Pemindai Pixel Otomatis**: Jika pixel belum terpasang, muncul peringatan **tulisan warna merah**. LP tetap bisa disimpan dan di daftar diberi keterangan *Pixel Belum Terpasang*.
   - **Konfirmasi Link Live**: Muncul modal konfirmasi URL resmi halaman live setiap kali simpan revisi.
4. **Keuangan**:
   - Daftar rekening bank penampung (BCA, Mandiri, BRI, BSI, Seabank, dsb).
5. **Laporan Funnel & Leads**:
   - Pelacakan 3 tahap:
     1. Sudah Melihat (Page View)
     2. Masukkan Keranjang (Initiate Checkout)
     3. Sudah Bayar (Purchase / Selesai)
   - Berisi **Nama, Nomor WhatsApp (tombol 1-klik chat WA), dan Email**.
   - Tombol cepat **Tandai Lunas** yang otomatis memicu pengiriman produk via email.
6. **Integrasi Iklan**:
   - Meta Pixel & Server-Side Conversions API (CAPI).
   - TikTok Pixel & Events API.
   - Google Ads Conversion Tag.
7. **Halaman Checkout**:
   - Form checkout 1 langkah dengan penawaran Bump Offer kotak beranimasi (*blinking border*).
   - Pilihan rekening bank tujuan & kode unik 3 digit.
   - Memicu event checkout & purchase sesuai pilihan **Opsi A** (kecepatan konversi instan).

---

## 💻 Cara Menjalankan Aplikasi

### Opsi 1: Double-Click (Paling Mudah)
Cukup klik ganda file **`start-app.bat`** di dalam folder project ini. Browser akan otomatis terbuka di `http://localhost:3005/admin`.

### Opsi 2: Lewat Terminal PowerShell
```powershell
npm.cmd start
```
Buka browser di:
- **Dashboard Admin**: `http://localhost:3005/admin`
- **Contoh Landing Page**: `http://localhost:3005/lp/index`
- **Studio Split-Screen**: `http://localhost:3005/admin/landing-pages/studio`
