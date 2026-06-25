import { useEffect, useState } from 'react';
import InspirationCard from '../components/InspirationCard';
import { supabase, type Inspiration } from '../lib/supabase';

const PAGE_TITLE = 'Inspirations';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: Inspiration[] };

export default function Inspirations() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('inspirations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: 'error', message: error.message });
        } else {
          setState({ status: 'ready', items: (data ?? []) as Inspiration[] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[var(--layout-max-width)] px-6 pb-24 pt-16 sm:px-12 sm:pt-[90px]">
      <div className="flex flex-col gap-10">
        <div className="flex max-w-[410px] flex-col gap-2">
          <h1 className="font-display text-display text-foreground">{PAGE_TITLE}</h1>
          <p className="text-label text-subtle">
            Sites qui nous inspirent — design, motion, et idées d'interface.
          </p>
        </div>

        {state.status === 'loading' && (
          <p className="text-label text-subtle">Chargement…</p>
        )}

        {state.status === 'error' && (
          <p className="text-label text-muted">
            Impossible de charger les inspirations : {state.message}
          </p>
        )}

        {state.status === 'ready' && state.items.length === 0 && (
          <p className="text-label text-subtle">
            Aucune inspiration pour l'instant. Ajoute-en depuis le dashboard Supabase.
          </p>
        )}

        {state.status === 'ready' && state.items.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {state.items.map((item) => (
              <InspirationCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
