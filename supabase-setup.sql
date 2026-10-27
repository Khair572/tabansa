-- TABANSA: jalankan di Supabase > SQL Editor (aman dijalankan ulang)
create table if not exists public.santri (
  id uuid primary key default gen_random_uuid(),
  nis text unique not null,
  nama text not null,
  created_at timestamptz default now()
);
alter table public.santri add column if not exists kelas text;
alter table public.santri add column if not exists alamat text;
alter table public.santri add column if not exists aktif boolean not null default true;

create table if not exists public.transaksi (
  id uuid primary key default gen_random_uuid(),
  nis text not null references public.santri(nis) on delete cascade on update cascade,
  jenis text not null check (jenis in ('masuk','keluar')),
  jumlah numeric(14,0) not null check (jumlah > 0),
  keterangan text,
  tanggal date not null default current_date,
  created_at timestamptz default now()
);
alter table public.transaksi add column if not exists admin_email text default (auth.jwt()->>'email');
create index if not exists idx_transaksi_nis on public.transaksi(nis);

drop view if exists public.saldo_santri;
create view public.saldo_santri with (security_invoker = true) as
select s.nis, s.nama, s.kelas, s.alamat, s.aktif, s.created_at,
  coalesce(sum(t.jumlah) filter (where t.jenis='masuk'),0) as total_masuk,
  coalesce(sum(t.jumlah) filter (where t.jenis='keluar'),0) as total_keluar,
  coalesce(sum(case when t.jenis='masuk' then t.jumlah else -t.jumlah end),0) as saldo,
  max(t.tanggal) as terakhir
from public.santri s left join public.transaksi t on t.nis=s.nis
group by s.nis, s.nama, s.kelas, s.alamat, s.aktif, s.created_at;

-- Cegah penarikan melebihi saldo
create or replace function public.cek_saldo() returns trigger as $$
declare sisa numeric;
begin
  if new.jenis='keluar' then
    select coalesce(sum(case when jenis='masuk' then jumlah else -jumlah end),0) into sisa
    from public.transaksi where nis=new.nis;
    if new.jumlah > sisa then raise exception 'Saldo tidak cukup'; end if;
  end if;
  return new;
end $$ language plpgsql;
drop trigger if exists trg_cek_saldo on public.transaksi;
create trigger trg_cek_saldo before insert on public.transaksi for each row execute function public.cek_saldo();

-- Keamanan: publik hanya MELIHAT, admin (login) yang MENGUBAH
alter table public.santri enable row level security;
alter table public.transaksi enable row level security;
do $$ declare p record; begin
  for p in select policyname, tablename from pg_policies where schemaname='public' and tablename in ('santri','transaksi')
  loop execute format('drop policy %I on public.%I', p.policyname, p.tablename); end loop;
end $$;
create policy "Publik membaca santri" on public.santri for select to anon, authenticated using (true);
create policy "Publik membaca transaksi" on public.transaksi for select to anon, authenticated using (true);
create policy "Admin menambah santri" on public.santri for insert to authenticated with check (true);
create policy "Admin mengubah santri" on public.santri for update to authenticated using (true) with check (true);
create policy "Admin menghapus santri" on public.santri for delete to authenticated using (true);
create policy "Admin menambah transaksi" on public.transaksi for insert to authenticated with check (true);
create policy "Admin mengubah transaksi" on public.transaksi for update to authenticated using (true) with check (true);
create policy "Admin menghapus transaksi" on public.transaksi for delete to authenticated using (true);
grant select on public.santri, public.transaksi, public.saldo_santri to anon, authenticated;
grant insert, update, delete on public.santri, public.transaksi to authenticated;

-- Realtime
do $$ begin
  begin alter publication supabase_realtime add table public.santri; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.transaksi; exception when duplicate_object then null; end;
end $$;
