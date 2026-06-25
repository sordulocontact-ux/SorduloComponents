// ============================================================
// Sync vault Obsidian -> Supabase (table inspirations + médias + Storage).
//
//   node scripts/sync-inspirations.mjs            (sync incrémental)
//   node scripts/sync-inspirations.mjs --force    (re-traite tout)
//
// Lit INSPIRATION/<discipline>/<slug>/<slug>.md, parse le frontmatter,
// uploade les médias du dossier dans le bucket public, puis upsert en base.
// Idempotent : ne re-traite une inspi que si sa fiche a changé (content_hash).
// Utilise la clé SECRÈTE (écriture) -> à lancer en local uniquement.
// ============================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';

// --- Config (.env du projet) ---------------------------------
process.loadEnvFile('.env');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const VAULT = process.env.VAULT_INSPIRATION_PATH;
const BUCKET = process.env.SUPABASE_BUCKET || 'inspirations';
const FORCE = process.argv.includes('--force');

for (const [k, v] of Object.entries({ VITE_SUPABASE_URL: SUPABASE_URL, SUPABASE_SECRET_KEY: SECRET_KEY, VAULT_INSPIRATION_PATH: VAULT })) {
  if (!v) { console.error(`✗ Variable manquante dans .env : ${k}`); process.exit(1); }
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });

const MEDIA_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.mov', '.webm']);
const CONTENT_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm' };
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);

// --- Utilitaires ---------------------------------------------
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Trouve toutes les fiches : un .md dont le nom == dossier parent (ex. ribbit/ribbit.md).
function findInspirations(root) {
  const found = [];
  for (const discipline of readdirSync(root)) {
    const dPath = join(root, discipline);
    if (discipline.startsWith('_') || discipline.startsWith('.') || !statSync(dPath).isDirectory()) continue;
    for (const slug of readdirSync(dPath)) {
      const sPath = join(dPath, slug);
      if (!statSync(sPath).isDirectory()) continue;
      const md = join(sPath, `${slug}.md`);
      try { statSync(md); } catch { continue; }
      found.push({ discipline: discipline.toLowerCase(), slug, dir: sPath, md });
    }
  }
  return found;
}

function extractTitle(body, fallback) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

// Construit une description propre = le paragraphe d'intro de la fiche (avant la 1re
// section ##), débarrassé du markdown (titres, images, liens, gras, blockquotes, callouts).
function cleanDescription(body) {
  let s = body.replace(/^#\s+.+$/m, ''); // retire le titre H1
  const firstSection = s.search(/^\s*##\s+/m); // coupe à la 1re section "## ..."
  if (firstSection !== -1) s = s.slice(0, firstSection);
  return s
    .replace(/!\[\[[^\]]*\]\]/g, '') // embeds ![[..]]
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images ![](..)
    .replace(/\[\[([^\]|]+)\|?[^\]]*\]\]/g, '$1') // liens wiki [[..]] -> texte
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // liens markdown [txt](url) -> txt
    .replace(/^\s*>\s?/gm, '') // blockquotes
    .replace(/\[!\w+\][-+]?\s*/g, '') // callouts [!note] / [!warning]
    .replace(/\*\*([^*]+)\*\*/g, '$1') // gras **..**
    .replace(/`([^`]+)`/g, '$1') // code inline
    .replace(/^\s*\*?\*?source\s*:.*$/gim, '') // ligne "Source: ..." (redondant avec le bouton)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function publicUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

function categorize(rel) {
  const name = basename(rel).toLowerCase();
  if (rel.includes('/composants/') || rel.includes('composants/')) return 'composant';
  if (VIDEO_EXT.has(extname(name)) || name.includes('walkthrough')) return 'walkthrough';
  return 'page';
}

// --- Sync d'une inspiration ----------------------------------
async function syncOne(insp) {
  const raw = readFileSync(insp.md, 'utf8');
  const hash = createHash('md5').update(raw).digest('hex');
  const vaultPath = relative(VAULT, insp.md);

  // Skip si inchangé.
  if (!FORCE) {
    const { data: existing } = await supabase.from('inspirations').select('id,content_hash').eq('vault_path', vaultPath).maybeSingle();
    if (existing && existing.content_hash === hash) { console.log(`= ${insp.slug} (inchangé)`); return; }
  }

  const { data: fm, content } = matter(raw);
  const title = extractTitle(content, insp.slug);
  const description = cleanDescription(content);

  // Médias du dossier.
  const files = walk(insp.dir).filter((f) => MEDIA_EXT.has(extname(f).toLowerCase()));
  const media = [];
  let coverUrl = null;
  files.sort();
  for (const file of files) {
    const rel = relative(insp.dir, file);
    const storagePath = `${insp.discipline}/${insp.slug}/${rel}`;
    const ext = extname(file).toLowerCase();
    const buf = readFileSync(file);
    let error = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      ({ error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
        contentType: CONTENT_TYPES[ext] || 'application/octet-stream',
        upsert: true,
      }));
      if (!error) break;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt)); // backoff sur 502 transitoire
    }
    if (error) { console.error(`  ✗ upload ${rel}: ${error.message}`); continue; }
    const url = publicUrl(storagePath);
    const isCover = !coverUrl && /(^|\/)home\.(png|jpg|jpeg|webp)$/i.test(rel);
    media.push({ category: categorize(rel), storage_path: storagePath, public_url: url, caption: basename(rel), is_cover: isCover, sort_order: media.length });
    if (isCover) coverUrl = url;
  }
  // Cover de secours : 1re image (hors composant/vidéo) si aucune home.*.
  if (!coverUrl) {
    const firstImg = media.find((m) => m.category === 'page');
    if (firstImg) { firstImg.is_cover = true; coverUrl = firstImg.public_url; }
  }

  // Upsert de la fiche.
  const source = typeof fm.source === 'string' ? fm.source : (fm.source ? String(fm.source) : null);
  const { data: row, error: upErr } = await supabase.from('inspirations').upsert({
    slug: insp.slug,
    title,
    discipline: insp.discipline,
    media_type: fm.media ?? null,
    source,
    description,
    mood: Array.isArray(fm.mood) ? fm.mood : [],
    colors: Array.isArray(fm.couleurs) ? fm.couleurs : [],
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    cover_url: coverUrl,
    vault_path: vaultPath,
    content_hash: hash,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'vault_path' }).select('id').single();
  if (upErr) { console.error(`✗ ${insp.slug}: ${upErr.message}`); return; }

  // Médias : on repart propre.
  await supabase.from('inspiration_media').delete().eq('inspiration_id', row.id);
  if (media.length) {
    const { error: mErr } = await supabase.from('inspiration_media').insert(media.map((m) => ({ ...m, inspiration_id: row.id })));
    if (mErr) console.error(`  ✗ médias ${insp.slug}: ${mErr.message}`);
  }
  console.log(`✓ ${insp.slug} (${media.length} média${media.length > 1 ? 's' : ''})`);
}

// --- Run -----------------------------------------------------
// S'assure que le bucket public existe (la création via SQL Editor ne passe pas toujours).
{
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) { console.error(`✗ accès Storage : ${error.message}`); process.exit(1); }
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: cErr } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (cErr) { console.error(`✗ création bucket "${BUCKET}" : ${cErr.message}`); process.exit(1); }
    console.log(`bucket "${BUCKET}" créé (public).`);
  }
}

const inspirations = findInspirations(VAULT);
console.log(`${inspirations.length} inspiration(s) trouvée(s) dans le vault.\n`);
for (const insp of inspirations) {
  try { await syncOne(insp); } catch (e) { console.error(`✗ ${insp.slug}: ${e.message}`); }
}
console.log('\nSync terminé.');
