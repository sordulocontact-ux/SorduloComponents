import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase partagé pour la vitrine. Les variables sont lues depuis l'environnement
 * Vite (préfixe `VITE_`, donc exposées côté client — la clé anon est publique par design,
 * protégée par les politiques RLS côté Supabase).
 *
 * Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans un fichier `.env`
 * (voir `.env.example`).
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Message explicite en dev plutôt qu'une erreur cryptique au premier appel.
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants — créez un fichier .env (voir .env.example).',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '');

/** Une fiche d'inspiration (table `inspirations`, alimentée depuis le vault). */
export type Inspiration = {
  id: string;
  slug: string;
  title: string;
  discipline: string;
  media_type: string | null;
  source: string | null;
  description: string | null;
  mood: string[] | null;
  colors: string[] | null;
  tags: string[] | null;
  cover_url: string | null;
  created_at: string;
};

/** Un média rattaché à une inspiration (table `inspiration_media`). */
export type InspirationMedia = {
  id: string;
  inspiration_id: string;
  category: 'cover' | 'page' | 'walkthrough' | 'composant';
  storage_path: string;
  public_url: string;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
};
