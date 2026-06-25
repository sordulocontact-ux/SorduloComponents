import type { Inspiration } from '../lib/supabase';
import { Link } from '../router';

/**
 * Carte d'aperçu d'une inspiration. Toute la carte mène à la page détail interne
 * (`#/i/:slug`). Reprend les surfaces / rayons / typographies du design system.
 */
export default function InspirationCard({ item }: { item: Inspiration }) {
  return (
    <Link to={`/i/${item.slug}`} className="group flex flex-col gap-[11px]">
      <div className="relative flex h-[281px] w-full items-center justify-center overflow-hidden rounded-card bg-surface ring-0 ring-border transition-all group-hover:ring-1">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="text-label text-subtle">{item.discipline}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-label text-foreground">{item.title}</span>
          <span className="text-caption text-muted">{item.discipline}</span>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-label text-subtle">{item.description}</p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-surface px-2 py-0.5 text-caption text-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
