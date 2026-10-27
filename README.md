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
