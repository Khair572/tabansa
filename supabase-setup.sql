-- TABANSA: jalankan di Supabase > SQL Editor (aman dijalankan ulang)
create table if not exists public.santri (
  id uuid primary key default gen_random_uuid(),
  nis text unique not null,
  nama text not null,
  created_at timestamptz default now()
);
alter table public.santri add column if not exists alamat text;
alter table public.santri add column if not exists tanggal_masuk date;
alter table public.santri add column if not exists tanggal_keluar date;
alter table public.santri add column if not exists keterangan text;
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
create index if not exists idx_transaksi_tanggal on public.transaksi(tanggal);

drop view if exists public.saldo_santri;
create view public.saldo_santri with (security_invoker = true) as
select s.nis, s.nama, s.alamat, s.tanggal_masuk, s.tanggal_keluar, s.keterangan, s.aktif, s.created_at,
  coalesce(sum(t.jumlah) filter (where t.jenis='masuk'),0) as total_masuk,
  coalesce(sum(t.jumlah) filter (where t.jenis='keluar'),0) as total_keluar,
  coalesce(sum(case when t.jenis='masuk' then t.jumlah else -t.jumlah end),0) as saldo,
  max(t.tanggal) as terakhir
from public.santri s left join public.transaksi t on t.nis=s.nis
group by s.nis, s.nama, s.alamat, s.tanggal_masuk, s.tanggal_keluar, s.keterangan, s.aktif, s.created_at;

create or replace function public.cek_saldo() returns trigger as $$
declare sisa numeric;
begin
  if new.jenis='keluar' then
    select coalesce(sum(case when jenis='masuk' then jumlah else -jumlah end),0) into sisa from public.transaksi where nis=new.nis;
    if new.jumlah > sisa then raise exception 'Saldo tidak cukup'; end if;
  end if;
  return new;
end $$ language plpgsql;
drop trigger if exists trg_cek_saldo on public.transaksi;
create trigger trg_cek_saldo before insert on public.transaksi for each row execute function public.cek_saldo();

-- Cegah menghapus setoran yang membuat saldo menjadi minus
create or replace function public.cek_hapus() returns trigger as $$
declare sisa numeric;
begin
  if old.jenis='masuk' and exists (select 1 from public.santri where nis=old.nis) then
    select coalesce(sum(case when jenis='masuk' then jumlah else -jumlah end),0) into sisa
    from public.transaksi where nis=old.nis and id<>old.id;
    if sisa < 0 then raise exception 'Setoran ini tidak bisa dihapus karena saldo akan minus'; end if;
  end if;
  return old;
end $$ language plpgsql;
drop trigger if exists trg_cek_hapus on public.transaksi;
create trigger trg_cek_hapus before delete on public.transaksi for each row execute function public.cek_hapus();

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

-- ===== LOG AKTIVITAS (hanya bisa ditambah oleh trigger; tidak bisa diubah/dihapus) =====
create table if not exists public.log_aktivitas (
  id bigint generated always as identity primary key,
  waktu timestamptz not null default now(),
  admin_email text,
  aksi text not null,
  tabel text not null,
  kunci text,
  ringkasan text,
  data_lama jsonb,
  data_baru jsonb
);
create or replace function public.catat_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare lama jsonb; baru jsonb; r jsonb; ket text; a text;
begin
  a := case TG_OP when 'INSERT' then 'TAMBAH' when 'UPDATE' then 'UBAH' else 'HAPUS' end;
  if TG_OP in ('UPDATE','DELETE') then lama := to_jsonb(old); end if;
  if TG_OP in ('INSERT','UPDATE') then baru := to_jsonb(new); end if;
  r := coalesce(baru, lama);
  if TG_TABLE_NAME = 'santri' then
    ket := 'Santri ' || (r->>'nama') || ' (NIS ' || (r->>'nis') || ')';
  else
    ket := case r->>'jenis' when 'masuk' then 'Setoran Rp ' else 'Penarikan Rp ' end || (r->>'jumlah') || ' · NIS ' || (r->>'nis') || ' · tgl ' || (r->>'tanggal');
  end if;
  insert into public.log_aktivitas(admin_email, aksi, tabel, kunci, ringkasan, data_lama, data_baru)
  values (coalesce(auth.jwt()->>'email','sistem/database'), a, TG_TABLE_NAME, r->>'nis', ket, lama, baru);
  return null;
end $$;
drop trigger if exists trg_log_santri on public.santri;
create trigger trg_log_santri after insert or update or delete on public.santri for each row execute function public.catat_log();
drop trigger if exists trg_log_transaksi on public.transaksi;
create trigger trg_log_transaksi after insert or update or delete on public.transaksi for each row execute function public.catat_log();

create or replace function public.log_tolak() returns trigger language plpgsql as $$
begin raise exception 'Log aktivitas tidak dapat diubah atau dihapus'; end $$;
drop trigger if exists trg_log_ro on public.log_aktivitas;
create trigger trg_log_ro before update or delete on public.log_aktivitas for each row execute function public.log_tolak();
drop trigger if exists trg_log_trunc on public.log_aktivitas;
create trigger trg_log_trunc before truncate on public.log_aktivitas for each statement execute function public.log_tolak();
alter table public.log_aktivitas enable row level security;
drop policy if exists "Admin membaca log" on public.log_aktivitas;
create policy "Admin membaca log" on public.log_aktivitas for select to authenticated using (true);
revoke all on public.log_aktivitas from anon, authenticated;
grant select on public.log_aktivitas to authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.log_aktivitas; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.santri; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.transaksi; exception when duplicate_object then null; end;
end $$;
