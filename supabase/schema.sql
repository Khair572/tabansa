-- TABANSA: jalankan di Supabase > SQL Editor
create table if not exists santri (
  id uuid primary key default gen_random_uuid(),
  nis text unique not null,
  nama text not null,
  kelas text,
  created_at timestamptz default now()
);
create table if not exists transaksi (
  id uuid primary key default gen_random_uuid(),
  nis text not null references santri(nis) on delete cascade on update cascade,
  jenis text not null check (jenis in ('masuk','keluar')),
  jumlah numeric(14,0) not null check (jumlah > 0),
  keterangan text,
  tanggal date not null default current_date,
  created_at timestamptz default now()
);
create index if not exists idx_transaksi_nis on transaksi(nis);

create or replace view saldo_santri with (security_invoker = true) as
select s.nis, s.nama, s.kelas,
  coalesce(sum(t.jumlah) filter (where t.jenis='masuk'),0) as total_masuk,
  coalesce(sum(t.jumlah) filter (where t.jenis='keluar'),0) as total_keluar,
  coalesce(sum(case when t.jenis='masuk' then t.jumlah else -t.jumlah end),0) as saldo
from santri s left join transaksi t on t.nis=s.nis
group by s.nis, s.nama, s.kelas;

-- Cegah penarikan melebihi saldo
create or replace function cek_saldo() returns trigger as $$
declare sisa numeric;
begin
  if new.jenis='keluar' then
    select coalesce(sum(case when jenis='masuk' then jumlah else -jumlah end),0) into sisa
    from transaksi where nis=new.nis;
    if new.jumlah > sisa then raise exception 'Saldo tidak cukup'; end if;
  end if;
  return new;
end $$ language plpgsql;
drop trigger if exists trg_cek_saldo on transaksi;
create trigger trg_cek_saldo before insert on transaksi for each row execute function cek_saldo();

-- Keamanan: semua orang boleh MELIHAT, hanya admin (login) yang boleh MENGUBAH
alter table santri enable row level security;
alter table transaksi enable row level security;
drop policy if exists "admin santri" on santri;
drop policy if exists "admin transaksi" on transaksi;
drop policy if exists "publik baca santri" on santri;
drop policy if exists "publik baca transaksi" on transaksi;
drop policy if exists "admin tulis santri" on santri;
drop policy if exists "admin tulis transaksi" on transaksi;
create policy "publik baca santri" on santri for select to anon, authenticated using (true);
create policy "publik baca transaksi" on transaksi for select to anon, authenticated using (true);
create policy "admin tulis santri" on santri for all to authenticated using (true) with check (true);
create policy "admin tulis transaksi" on transaksi for all to authenticated using (true) with check (true);
grant select on santri, transaksi, saldo_santri to anon;
grant select, insert, update, delete on santri, transaksi to authenticated;
grant select on saldo_santri to authenticated;
