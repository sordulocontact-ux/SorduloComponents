import { useEffect, useState } from 'react';
import { supabase, type Inspiration, type InspirationMedia } from '../lib/supabase';
import { Link } from '../router';

type Data = { inspiration: Inspiration; media: InspirationMedia[] };
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'missing' }
  | { status: 'ready'; data: Data };

/** Renvoie un hostname lisible si `source` est une URL, sinon `null`. */
function asHostname(source: string | null) {
  if (!source) return null;
  try {
    return new URL(source).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default function InspirationDetail({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      const { data: insp, error } = await supabase
        .from('inspirations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (cancelled) return;
      if (error) return setState({ status: 'error', message: error.message });
      if (!insp) return setState({ status: 'missing' });

      const { data: media, error: mErr } = await supabase
        .from('inspiration_media')
        .select('*')
        .eq('inspiration_id', (insp as Inspiration).id)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (mErr) return setState({ status: 'error', message: mErr.message });

      setState({
        status: 'ready',
        data: { inspiration: insp as Inspiration, media: (media ?? []) as InspirationMedia[] },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="mx-auto w-full max-w-[var(--layout-max-width)] px-6 pb-24 pt-16 sm:px-12 sm:pt-[90px]">
      <Link to="/inspirations" className="text-label text-muted transition-colors hover:text-foreground">
        ← Inspirations
      </Link>

      {state.status === 'loading' && (
        <p className="mt-10 text-label text-subtle">Chargement…</p>
      )}
      {state.status === 'error' && (
        <p className="mt-10 text-label text-muted">Erreur : {state.message}</p>
      )}
      {state.status === 'missing' && (
        <p className="mt-10 text-label text-subtle">Inspiration introuvable.</p>
      )}

      {state.status === 'ready' && <Detail {...state.data} />}
    </main>
  );
}

function Detail({ inspiration, media }: Data) {
  const host = asHostname(inspiration.source);
  const walkthroughs = media.filter((m) => m.category === 'walkthrough');
  const pages = media.filter((m) => m.category === 'page' || m.category === 'cover');
  const composants = media.filter((m) => m.category === 'composant');

  return (
    <div className="mt-10 flex flex-col gap-12">
      {/* En-tête */}
      <div className="flex max-w-[640px] flex-col gap-3">
        <span className="text-caption text-muted">{inspiration.discipline}</span>
        <h1 className="font-display text-display text-foreground">{inspiration.title}</h1>

        {inspiration.description && (
          <p className="whitespace-pre-line text-label text-subtle">{inspiration.description}</p>
        )}

        {host && inspiration.source && (
          <a
            href={inspiration.source}
            target="_blank"
            rel="noreferrer noopener"
            className="w-fit rounded-pill bg-surface px-3 py-2 text-label text-foreground transition-colors hover:bg-surface-strong"
          >
            Voir le site — {host} ↗
          </a>
        )}

        {/* Palette de couleurs */}
        {inspiration.colors && inspiration.colors.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {inspiration.colors.map((c) => (
              <span
                key={c}
                title={c}
                className="size-6 rounded-pill border border-border"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Mood + tags */}
        {((inspiration.mood && inspiration.mood.length > 0) ||
          (inspiration.tags && inspiration.tags.length > 0)) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {[...(inspiration.mood ?? []), ...(inspiration.tags ?? [])]
              .filter((t, i, a) => a.indexOf(t) === i)
              .map((t) => (
                <span key={t} className="rounded-pill bg-surface px-2 py-0.5 text-caption text-subtle">
                  {t}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Walkthrough vidéo */}
      {walkthroughs.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-label text-foreground">Walkthrough</h2>
          {walkthroughs.map((m) => (
            <video
              key={m.id}
              src={m.public_url}
              controls
              playsInline
              className="w-full rounded-card bg-surface"
            />
          ))}
        </section>
      )}

      {/* Pages / visuels */}
      {pages.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-label text-foreground">Visuels</h2>
          <div className="flex flex-col gap-5">
            {pages.map((m) => (
              <img
                key={m.id}
                src={m.public_url}
                alt={m.caption ?? inspiration.title}
                loading="lazy"
                className="w-full rounded-card bg-surface object-contain"
              />
            ))}
          </div>
        </section>
      )}

      {/* Composants extraits */}
      {composants.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-label text-foreground">Composants</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {composants.map((m) => (
              <figure key={m.id} className="flex flex-col gap-2">
                <img
                  src={m.public_url}
                  alt={m.caption ?? ''}
                  loading="lazy"
                  className="w-full rounded-card bg-surface object-contain"
                />
                {m.caption && <figcaption className="text-caption text-muted">{m.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
