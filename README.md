# TABANSA — Tabungan Santri

Web pencatatan setoran dan penarikan tabungan santri berdasarkan NIS. Frontend statis (HTML/CSS/JS) + Supabase (database & login).

## Cara pasang
1. Buat project di https://supabase.com
2. SQL Editor → tempel isi `supabase/schema.sql` → Run.
3. Authentication → Users → Add user (email + password admin). Matikan "Allow new users to sign up" di Authentication → Sign In / Providers agar orang lain tidak bisa mendaftar.
4. Project Settings → API → URL dan publishable key sudah terisi di `js/config.js`.
5. Upload semua file ke GitHub → Settings → Pages → Deploy from branch (main, root).
6. Buka alamat GitHub Pages, login dengan akun admin.

Catatan: anon key memang publik; data tetap aman karena Row Level Security hanya mengizinkan admin yang login.
