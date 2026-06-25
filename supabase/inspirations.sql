-- ============================================================
-- Schéma "Inspirations" — galerie alimentée par le vault Obsidian.
-- Modèle riche : 1 inspiration + N médias (images, walkthrough vidéo, composants).
-- À exécuter dans Supabase : Dashboard → SQL Editor → coller → Run.
-- Idempotent : peut être relancé sans casser l'existant.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Table principale : une fiche d'inspiration (= un dossier du vault).
-- ------------------------------------------------------------
create table if not exists public.inspirations (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,           -- ex. 'ribbit', 'alien-hominid'
  title        text not null,
  discipline   text not null,                  -- webdesign | ui-design | brand-design | graphisme | motion
  media_type   text,                           -- site | image | video
  source       text,                           -- URL du site OU attribution texte (peut être nul)
  description   text,                           -- corps de la fiche (markdown)
  mood         text[] default '{}',            -- ex. {editorial,bold,playful}
  colors       text[] default '{}',            -- palette hex ex. {#5B2EE5,#A98BF5}
  tags         text[] default '{}',
  cover_url    text,                            -- URL publique de l'image de couverture (carte)
  vault_path   text unique,                     -- chemin de la fiche dans le vault (clé de sync)
  content_hash text,                            -- hash de la fiche → ne resynchronise que si changé
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists inspirations_discipline_idx on public.inspirations (discipline);
create index if not exists inspirations_created_idx     on public.inspirations (created_at desc);

-- ------------------------------------------------------------
-- 2) Médias rattachés à une inspiration (images de pages, walkthrough, composants…).
-- ------------------------------------------------------------
create table if not exists public.inspiration_media (
  id             uuid primary key default gen_random_uuid(),
  inspiration_id uuid not null references public.inspirations (id) on delete cascade,
  category       text not null default 'page',  -- cover | page | walkthrough | composant
  storage_path   text not null,                 -- chemin dans le bucket (ex. webdesign/ribbit/home.png)
  public_url     text not null,
  caption        text,
  is_cover       boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (inspiration_id, storage_path)
);

create index if not exists inspiration_media_parent_idx on public.inspiration_media (inspiration_id, sort_order);

-- ------------------------------------------------------------
-- 3) Sécurité (RLS) : LECTURE publique seule. L'écriture se fait par le script
--    de sync avec la clé secrète (qui contourne RLS) — jamais depuis le navigateur.
-- ------------------------------------------------------------
alter table public.inspirations       enable row level security;
alter table public.inspiration_media  enable row level security;

drop policy if exists "Lecture publique des inspirations" on public.inspirations;
create policy "Lecture publique des inspirations"
  on public.inspirations for select
  to anon, authenticated
  using (true);

drop policy if exists "Lecture publique des médias" on public.inspiration_media;
create policy "Lecture publique des médias"
  on public.inspiration_media for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- 4) Storage : bucket public "inspirations" pour héberger les visuels/vidéos.
--    Public => lecture libre via URL ; l'upload se fait avec la clé secrète.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('inspirations', 'inspirations', true)
on conflict (id) do update set public = true;
