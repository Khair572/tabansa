# TABANSA — Tabungan Santri

Pencatatan setoran dan penarikan tabungan santri berdasarkan NIS. Semua orang bisa MELIHAT; hanya admin yang login yang bisa MENGUBAH.

- `index.html` — halaman publik (total tabungan, cari santri, riwayat bergaya buku tabungan dengan saldo berjalan)
- `admin/login.html`, `admin/admin.html` — login dan panel admin (kasir setoran/penarikan, kelola santri, CSV)
- `config.js` — URL dan publishable key Supabase (sudah terisi)
- `supabase-setup.sql` — tabel, view saldo, trigger saldo, RLS

## Pasang
1. Supabase → SQL Editor → jalankan `supabase-setup.sql`.
2. Authentication → Users → Add user (admin). Matikan "Allow new users to sign up".
3. Upload isi folder ke GitHub → Settings → Pages → Deploy from branch (main, root).
