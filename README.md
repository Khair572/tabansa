# TABANSA — Tabungan Santri

Frontend statis (HTML/CSS/JS) + Supabase. Semua orang bisa MELIHAT data di `index.html`; hanya admin yang login (`login.html` → `admin.html`) yang bisa MENGUBAH data.

## Cara pasang
1. Supabase → SQL Editor → tempel isi `supabase/schema.sql` → Run.
2. Authentication → Users → Add user (email + password admin). Matikan pendaftaran publik: Authentication → Sign In / Providers → matikan "Allow new users to sign up".
3. `js/config.js` sudah berisi URL dan publishable key project.
4. Upload semua file ke GitHub → Settings → Pages → Deploy from branch (main, root).

Keamanan ditegakkan oleh Row Level Security di database, bukan oleh tampilan web: pengunjung hanya punya izin baca.
