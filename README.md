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
