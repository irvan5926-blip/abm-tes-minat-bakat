-- =================================================================
-- ABM Tes Minat & Bakat - Schema Database (Supabase / PostgreSQL)
-- =================================================================
--
-- Cara pakai:
--   1. Buka Supabase Dashboard -> SQL Editor -> New query
--   2. Copy-paste SELURUH isi file ini.
--   3. Klik Run.
--   4. (Opsional) Jalankan supabase/seed.sql untuk admin default.
--
-- Catatan keamanan:
--   - Frontend pakai ANON key (bukan service_role).
--   - Public access dibatasi via Row Level Security (RLS).
--   - Operasi tulis siswa lewat RPC `security definer` yang validasi token.
--   - Operasi admin lewat Supabase Auth (authenticated role).
-- =================================================================

-- Bersihkan jika ada (idempoten - aman dijalankan ulang)
drop function if exists public.api_validate_token(text) cascade;
drop function if exists public.api_start_session(text) cascade;
drop function if exists public.api_start_session(text, text, text, text, text, date, text) cascade;
drop function if exists public.api_admin_create_tokens_bulk(text, int, int, uuid) cascade;
drop function if exists public.api_submit_answer(uuid, text, text, integer, text, boolean) cascade;
drop function if exists public.api_finish_bakat(uuid, jsonb, jsonb, integer, jsonb) cascade;
drop function if exists public.api_finish_minat(uuid, jsonb, jsonb, jsonb) cascade;
drop function if exists public.api_next_program(uuid, text) cascade;
drop function if exists public.api_expire_old_tokens() cascade;

drop table if exists public.audit_log cascade;
drop table if exists public.hasil cascade;
drop table if exists public.jawaban cascade;
drop table if exists public.sesi cascade;
drop table if exists public.tokens cascade;
drop table if exists public.siswa cascade;
drop table if exists public.admin_profile cascade;

-- =================================================================
-- TABLES
-- =================================================================

-- Admin profile (extends Supabase auth.users)
create table public.admin_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- Siswa
create table public.siswa (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  nis text default '',
  kelas text default '',
  sekolah text default '',
  tanggal_lahir date,
  jenis_kelamin text,
  created_at timestamptz not null default now()
);
create index idx_siswa_nis on public.siswa(nis);

-- Token siswa (8 char, expired N menit (default 5), sekali pakai)
-- Sejak v2.1: token TIDAK menyimpan siswa info. Siswa input identitas saat login.
create table public.tokens (
  token text primary key,
  jenis_tes text not null check (jenis_tes in ('minat','bakat')),
  siswa_nama text default '',     -- legacy/optional, biasanya kosong
  siswa_nis text default '',
  siswa_kelas text default '',
  siswa_sekolah text default '',
  admin_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  status text not null default 'AKTIF' check (status in ('AKTIF','TERPAKAI','EXPIRED','DIBATALKAN'))
);
create index idx_tokens_status on public.tokens(status);
create index idx_tokens_expires on public.tokens(expires_at);

-- Sesi tes (mapping pengacakan no_asli <-> no_tampil)
create table public.sesi (
  id uuid primary key default gen_random_uuid(),
  token text not null references public.tokens(token),
  siswa_id uuid not null references public.siswa(id),
  jenis_tes text not null check (jenis_tes in ('minat','bakat')),
  mapping jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index idx_sesi_token on public.sesi(token);
create index idx_sesi_siswa on public.sesi(siswa_id);

-- Jawaban per soal
create table public.jawaban (
  id bigserial primary key,
  sesi_id uuid not null references public.sesi(id) on delete cascade,
  soal_id text not null,
  no_tampil int,
  jawaban text not null,
  benar boolean,
  subtes text,
  created_at timestamptz not null default now(),
  unique (sesi_id, soal_id)
);
create index idx_jawaban_sesi on public.jawaban(sesi_id);

-- Hasil akhir
create table public.hasil (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references public.sesi(id) on delete cascade,
  siswa_id uuid not null references public.siswa(id),
  jenis_tes text not null,
  skor jsonb not null default '{}'::jsonb,
  klasifikasi jsonb not null default '{}'::jsonb,
  iq_prediksi int,
  rekomendasi jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (sesi_id)
);
create index idx_hasil_jenis on public.hasil(jenis_tes);
create index idx_hasil_siswa on public.hasil(siswa_id);

-- Audit log
create table public.audit_log (
  id bigserial primary key,
  actor text,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index idx_audit_created on public.audit_log(created_at desc);

-- =================================================================
-- ROW LEVEL SECURITY
-- =================================================================

alter table public.admin_profile enable row level security;
alter table public.siswa         enable row level security;
alter table public.tokens        enable row level security;
alter table public.sesi          enable row level security;
alter table public.jawaban       enable row level security;
alter table public.hasil         enable row level security;
alter table public.audit_log     enable row level security;

-- Authenticated (admin) bisa baca/tulis semua
create policy "admin all admin_profile" on public.admin_profile for all to authenticated using (true) with check (true);
create policy "admin all siswa"         on public.siswa         for all to authenticated using (true) with check (true);
create policy "admin all tokens"        on public.tokens        for all to authenticated using (true) with check (true);
create policy "admin all sesi"          on public.sesi          for all to authenticated using (true) with check (true);
create policy "admin all jawaban"       on public.jawaban       for all to authenticated using (true) with check (true);
create policy "admin all hasil"         on public.hasil         for all to authenticated using (true) with check (true);
create policy "admin all audit"         on public.audit_log     for all to authenticated using (true) with check (true);

-- Anon (siswa) TIDAK punya akses langsung ke table.
-- Mereka hanya bisa lewat RPC `api_*` di bawah (security definer).

-- =================================================================
-- RPC FUNCTIONS (untuk siswa - tanpa login)
-- =================================================================

-- Validasi token (tidak menandai TERPAKAI)
create or replace function public.api_validate_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  now_ts timestamptz := now();
begin
  if p_token is null or length(p_token) <> 8 then
    return jsonb_build_object('ok', false, 'error', 'Token harus 8 karakter.');
  end if;
  select * into rec from public.tokens where token = upper(p_token);
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Token tidak ditemukan.');
  end if;
  if rec.status = 'AKTIF' and rec.expires_at < now_ts then
    update public.tokens set status = 'EXPIRED' where token = rec.token;
    return jsonb_build_object('ok', false, 'error', 'Token sudah expired (>5 menit).');
  end if;
  if rec.status <> 'AKTIF' then
    return jsonb_build_object('ok', false, 'error', 'Token sudah dipakai/dibatalkan/expired.');
  end if;
  return jsonb_build_object(
    'ok', true,
    'token', rec.token,
    'jenis_tes', rec.jenis_tes,
    'siswa_nama', coalesce(rec.siswa_nama, ''),
    'siswa_nis', coalesce(rec.siswa_nis, ''),
    'siswa_kelas', coalesce(rec.siswa_kelas, ''),
    'siswa_sekolah', coalesce(rec.siswa_sekolah, ''),
    'expires_at', rec.expires_at,
    'expires_in_seconds', greatest(0, extract(epoch from (rec.expires_at - now_ts))::int)
  );
end;
$$;

-- Mulai sesi: terima identitas siswa dari client, validasi token, mark TERPAKAI, buat siswa & sesi
-- Sejak v2.1: siswa data dikirim oleh client (form identitas), bukan dari tokens table.
create or replace function public.api_start_session(
  p_token text,
  p_siswa_nama text,
  p_siswa_nis text default '',
  p_siswa_kelas text default '',
  p_siswa_sekolah text default '',
  p_tanggal_lahir date default null,
  p_jenis_kelamin text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
  rec record;
  v_siswa_id uuid;
  v_sesi_id uuid;
  v_existing record;
  v_nama text := trim(coalesce(p_siswa_nama, ''));
  v_nis  text := trim(coalesce(p_siswa_nis, ''));
  v_kls  text := trim(coalesce(p_siswa_kelas, ''));
  v_sek  text := trim(coalesce(p_siswa_sekolah, ''));
begin
  if v_nama = '' then
    return jsonb_build_object('ok', false, 'error', 'Nama siswa wajib diisi.');
  end if;

  v := public.api_validate_token(p_token);
  if (v->>'ok')::boolean = false then
    return v;
  end if;
  select * into rec from public.tokens where token = upper(p_token);

  -- Cegah double-start: kalau sudah ada sesi belum selesai untuk token ini, resume.
  select s.* into v_existing from public.sesi s where s.token = rec.token order by s.started_at desc limit 1;
  if found and v_existing.finished_at is null then
    -- Update siswa info dari form (kalau ada perubahan)
    update public.siswa
      set nama = v_nama, nis = v_nis, kelas = v_kls, sekolah = v_sek,
          tanggal_lahir = coalesce(p_tanggal_lahir, tanggal_lahir),
          jenis_kelamin = coalesce(p_jenis_kelamin, jenis_kelamin)
      where id = v_existing.siswa_id;
    return jsonb_build_object(
      'ok', true, 'resume', true,
      'sesi_id', v_existing.id, 'jenis_tes', v_existing.jenis_tes,
      'siswa', jsonb_build_object('nama', v_nama, 'nis', v_nis, 'kelas', v_kls, 'sekolah', v_sek),
      'mapping', v_existing.mapping
    );
  end if;
  if found and v_existing.finished_at is not null then
    return jsonb_build_object('ok', false, 'error', 'Sesi sudah selesai sebelumnya.');
  end if;

  -- Insert siswa baru (selalu insert, biar tiap sesi punya record sendiri)
  insert into public.siswa(nama, nis, kelas, sekolah, tanggal_lahir, jenis_kelamin)
  values (v_nama, v_nis, v_kls, v_sek, p_tanggal_lahir, p_jenis_kelamin)
  returning id into v_siswa_id;

  insert into public.sesi(token, siswa_id, jenis_tes, mapping)
  values (rec.token, v_siswa_id, rec.jenis_tes, '{}'::jsonb)
  returning id into v_sesi_id;

  update public.tokens
    set status='TERPAKAI', used_at=now(),
        siswa_nama = v_nama, siswa_nis = v_nis, siswa_kelas = v_kls, siswa_sekolah = v_sek
    where token=rec.token;

  insert into public.audit_log(actor, action, detail)
  values (v_siswa_id::text, 'START_SESSION', 'sesi=' || v_sesi_id || ' token=' || rec.token || ' nama=' || v_nama);

  return jsonb_build_object(
    'ok', true, 'resume', false,
    'sesi_id', v_sesi_id, 'jenis_tes', rec.jenis_tes,
    'siswa', jsonb_build_object('nama', v_nama, 'nis', v_nis, 'kelas', v_kls, 'sekolah', v_sek),
    'mapping', '{}'::jsonb
  );
end;
$$;

-- Generate banyak token sekaligus (admin only)
create or replace function public.api_admin_create_tokens_bulk(
  p_jenis_tes text, p_jumlah int, p_exp_minutes int default 5, p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  i int := 0;
  v_token text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_tokens jsonb := '[]'::jsonb;
  v_exp timestamptz;
begin
  if p_jenis_tes not in ('minat','bakat') then
    return jsonb_build_object('ok', false, 'error', 'Jenis tes harus minat/bakat.');
  end if;
  if p_jumlah < 1 or p_jumlah > 500 then
    return jsonb_build_object('ok', false, 'error', 'Jumlah harus 1-500.');
  end if;
  if p_exp_minutes < 1 or p_exp_minutes > 480 then
    return jsonb_build_object('ok', false, 'error', 'Lama berlaku 1-480 menit.');
  end if;
  v_exp := now() + (p_exp_minutes || ' minutes')::interval;
  while i < p_jumlah loop
    -- Generate 8-char token (A-Z minus I/O, 2-9)
    v_token := '';
    for j in 1..8 loop
      v_token := v_token || substr(v_chars, 1 + (random() * 31)::int, 1);
    end loop;
    -- Skip kalau collision (sangat jarang)
    begin
      insert into public.tokens(token, jenis_tes, admin_id, expires_at)
      values (v_token, p_jenis_tes, p_admin_id, v_exp);
      v_tokens := v_tokens || jsonb_build_object('token', v_token, 'expires_at', v_exp);
      i := i + 1;
    exception when unique_violation then
      -- retry, jangan increment
      continue;
    end;
  end loop;
  insert into public.audit_log(actor, action, detail)
  values (coalesce(p_admin_id::text, 'admin'), 'BULK_GENERATE', 'jumlah=' || p_jumlah || ' jenis=' || p_jenis_tes || ' exp_min=' || p_exp_minutes);
  return jsonb_build_object('ok', true, 'tokens', v_tokens, 'jumlah', p_jumlah, 'expires_at', v_exp);
end;
$$;

-- Simpan mapping pengacakan setelah client generate
create or replace function public.api_save_mapping(p_sesi_id uuid, p_mapping jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sesi set mapping = p_mapping where id = p_sesi_id and finished_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Sesi tidak ditemukan / sudah selesai.');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- Submit jawaban (upsert)
create or replace function public.api_submit_answer(
  p_sesi_id uuid, p_soal_id text, p_jawaban text,
  p_no_tampil int, p_subtes text, p_benar boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare s record;
begin
  select * into s from public.sesi where id = p_sesi_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Sesi tidak ditemukan.'); end if;
  if s.finished_at is not null then return jsonb_build_object('ok', false, 'error', 'Sesi sudah selesai.'); end if;
  insert into public.jawaban(sesi_id, soal_id, no_tampil, jawaban, benar, subtes)
  values (p_sesi_id, p_soal_id, p_no_tampil, p_jawaban, p_benar, p_subtes)
  on conflict (sesi_id, soal_id) do update
    set jawaban = excluded.jawaban,
        benar = excluded.benar,
        no_tampil = excluded.no_tampil,
        subtes = excluded.subtes,
        created_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- Selesaikan tes Bakat
create or replace function public.api_finish_bakat(
  p_sesi_id uuid, p_skor jsonb, p_klasifikasi jsonb,
  p_iq_prediksi int, p_rekomendasi jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare s record; v_hasil_id uuid;
begin
  select * into s from public.sesi where id = p_sesi_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Sesi tidak ditemukan.'); end if;
  if s.jenis_tes <> 'bakat' then return jsonb_build_object('ok', false, 'error', 'Bukan sesi bakat.'); end if;
  if s.finished_at is not null then return jsonb_build_object('ok', false, 'error', 'Sesi sudah selesai.'); end if;

  update public.sesi set finished_at = now() where id = p_sesi_id;
  insert into public.hasil(sesi_id, siswa_id, jenis_tes, skor, klasifikasi, iq_prediksi, rekomendasi)
  values (p_sesi_id, s.siswa_id, 'bakat', p_skor, p_klasifikasi, p_iq_prediksi, p_rekomendasi)
  returning id into v_hasil_id;

  insert into public.audit_log(actor, action, detail)
  values (s.siswa_id::text, 'FINISH_BAKAT', 'sesi=' || p_sesi_id || ' iq=' || p_iq_prediksi);

  return jsonb_build_object('ok', true, 'hasil_id', v_hasil_id);
end;
$$;

-- Selesaikan tes Minat
create or replace function public.api_finish_minat(
  p_sesi_id uuid, p_skor jsonb, p_klasifikasi jsonb, p_rekomendasi jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare s record; v_hasil_id uuid;
begin
  select * into s from public.sesi where id = p_sesi_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Sesi tidak ditemukan.'); end if;
  if s.jenis_tes <> 'minat' then return jsonb_build_object('ok', false, 'error', 'Bukan sesi minat.'); end if;
  if s.finished_at is not null then return jsonb_build_object('ok', false, 'error', 'Sesi sudah selesai.'); end if;

  update public.sesi set finished_at = now() where id = p_sesi_id;
  insert into public.hasil(sesi_id, siswa_id, jenis_tes, skor, klasifikasi, iq_prediksi, rekomendasi)
  values (p_sesi_id, s.siswa_id, 'minat', p_skor, p_klasifikasi, null, p_rekomendasi)
  returning id into v_hasil_id;

  insert into public.audit_log(actor, action, detail)
  values (s.siswa_id::text, 'FINISH_MINAT', 'sesi=' || p_sesi_id);

  return jsonb_build_object('ok', true, 'hasil_id', v_hasil_id);
end;
$$;

-- Auto-expire token (dijadwalkan via Supabase pg_cron atau dipanggil periodik dari client)
create or replace function public.api_expire_old_tokens()
returns int
language sql
security definer
set search_path = public
as $$
  with upd as (
    update public.tokens set status = 'EXPIRED'
    where status = 'AKTIF' and expires_at < now()
    returning 1
  )
  select count(*)::int from upd;
$$;

-- Grant execute pada semua RPC `api_*` ke role anon (siswa) & authenticated (admin)
grant execute on function public.api_validate_token(text) to anon, authenticated;
grant execute on function public.api_start_session(text, text, text, text, text, date, text) to anon, authenticated;
grant execute on function public.api_admin_create_tokens_bulk(text, int, int, uuid) to authenticated;
grant execute on function public.api_save_mapping(uuid, jsonb) to anon, authenticated;
grant execute on function public.api_submit_answer(uuid, text, text, int, text, boolean) to anon, authenticated;
grant execute on function public.api_finish_bakat(uuid, jsonb, jsonb, int, jsonb) to anon, authenticated;
grant execute on function public.api_finish_minat(uuid, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.api_expire_old_tokens() to anon, authenticated;

-- =================================================================
-- AUTO: Trigger untuk membuat admin_profile saat user baru di auth.users
-- =================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_profile(user_id, nama)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =================================================================
-- Schedule: auto-expire tokens setiap 1 menit (memerlukan extension pg_cron)
-- Aktifkan manual di Supabase Dashboard -> Database -> Extensions -> pg_cron
-- Lalu jalankan SELECT di bawah ini SEKALI (uncomment).
-- =================================================================
-- select cron.schedule('expire-tokens', '* * * * *', $$select public.api_expire_old_tokens();$$);
