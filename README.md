# TABANSA — Tabungan Santri

Pencatatan setoran dan penarikan tabungan santri. Semua orang bisa MELIHAT; hanya admin yang login yang bisa MENGUBAH.

## Struktur
- `index.html` — halaman publik (ringkasan, transaksi per periode, daftar santri + saldo, riwayat)
- `admin/login.html` — login admin
- `admin/admin.html` — tambah/edit/hapus santri (NIS, nama, alamat, tgl masuk/keluar, keterangan, status), catat Setor/Tarik dari tabel atau lewat NIS, riwayat, CSV
- `config.js` — URL & key Supabase (sudah terisi), `NAMA_LEMBAGA` bisa diganti
- `supabase-setup.sql` — tabel, view saldo, trigger, RLS

## Pasang
1. Supabase → SQL Editor → jalankan `supabase-setup.sql` (aman diulang).
2. Authentication → Users → Add user (email + password admin). Matikan "Allow new users to sign up".
3. Upload semua isi folder ke GitHub → Settings → Pages → Deploy from branch (main, root).

## Input nominal cepat
Di form transaksi, ketik `5k`, `10rb`, `1,5jt`, atau `25000`, atau tap tombol +5k, +10k, +20k, +50k, +100k, +200k, +500k, +1jt (nilainya dijumlahkan). Tombol "Kosongkan" mengulang dari nol.

## Log aktivitas
Setiap tambah/ubah/hapus santri dan transaksi dicatat otomatis oleh trigger database (siapa, kapan, data lama dan baru). Log hanya bisa dibaca admin, dan tidak bisa diubah atau dihapus (ditolak oleh database). Data sebelum SQL ini dijalankan tidak punya log.


## Indikator koneksi
Di pojok kanan atas halaman publik dan admin ada status **Online** (hijau, terhubung realtime), **Menyambung** (kuning), dan **Offline** (merah). Saat offline muncul pita peringatan, penyimpanan di admin ditahan, dan data dimuat ulang otomatis ketika koneksi kembali.

## Mode offline (v2)
- **Aplikasi terbuka tanpa internet.** `service-worker.js` menyimpan halaman, skrip, gaya, pustaka Supabase, dan font setelah dibuka online sekali. Update situs otomatis terambil saat online.
- **Data tetap tampil.** Daftar santri, saldo, transaksi per periode, riwayat santri, dan log admin yang terakhir dimuat disimpan di perangkat. Saat offline atau server tidak terjangkau, data itu ditampilkan dengan keterangan kapan terakhir diperbarui. Periode tanggal atau riwayat santri yang belum pernah dibuka tidak tersedia offline.
- **Admin bisa mencatat setoran/penarikan saat offline.** Transaksi disimpan di perangkat (kartu "Menunggu sinkron"), saldo langsung ikut dihitung, lalu dikirim otomatis saat online. Setiap transaksi punya ID unik sehingga tidak tercatat dua kali. Jika server menolak (mis. saldo tidak cukup), transaksi ditandai "Ditolak" dan bisa dihapus dari daftar. Tambah/ubah/hapus santri serta hapus transaksi tetap butuh internet.
- **Sesi admin** tetap dikenali saat offline; pengiriman transaksi butuh sesi yang masih berlaku (jika habis, login ulang lalu transaksi terkirim otomatis).
- Log admin yang tersimpan di perangkat dihapus saat admin menekan Keluar.
- **Unduh CSV** bekerja di aplikasi Android (lewat `AndroidBridge`) maupun browser.
- Pustaka Supabase (`supabase.js`, v2.118.0) sudah disimpan lokal di folder ini, tidak lagi bergantung pada CDN. Untuk memperbaruinya, ganti file itu dengan versi terbaru dari jsdelivr.

## Notifikasi (aplikasi Android)
Di aplikasi Android (WebView dengan `AndroidBridge`) muncul tombol lonceng di header untuk menyalakan/mematikan notifikasi. Notifikasi sistem tampil saat aplikasi berada di latar belakang untuk: transaksi baru yang tercatat (digabung jika banyak), serta hasil sinkron transaksi offline di halaman admin (terkirim/ditolak). Notifikasi bersifat "selama aplikasi masih berjalan"; untuk notifikasi saat aplikasi benar-benar tertutup dibutuhkan push (Firebase Cloud Messaging) dan server pengirim, yang belum ada di sini. Di browser biasa tombol dan notifikasi ini tidak muncul.

