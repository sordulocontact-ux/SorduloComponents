# Sordulo Components

Site vitrine de la bibliothèque de composants de l'agence **Sordulo**. L'objectif :
présenter, au fur et à mesure, les composants UI maison dans une grille de cartes
d'aperçu. Pour l'instant la coquille (header, page, grille) est en place ; les
composants seront ajoutés progressivement.

## Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS v4** (plugin `@tailwindcss/vite`, configuration via `@theme` dans `src/styles/tokens.css` — pas de `tailwind.config.js`)
- Polices : **DM Sans** (Google Fonts) pour le texte courant ; **Talina** pour le titre d'affichage (fichier `.otf` dans `public/fonts/`, déclaré en `@font-face` dans `src/styles/fonts.css`, exposé via `--font-display` / classe `font-display`).

## Commandes

- `npm run dev` — serveur de développement (http://localhost:5173)
- `npm run build` — typecheck (`tsc -b`) puis build de production
- `npm run preview` — prévisualise le build

## Structure

```
src/
├── App.tsx                      # Layout racine : Header + Home
├── index.css                    # Point d'entrée CSS (imports + base)
├── styles/
│   ├── tokens.css               # Design tokens (primitives + @theme sémantique)
│   └── fonts.css                # @font-face « Talina »
├── components/
│   ├── Logo.tsx                 # Logo SVG Sordulo (étoile/soleil)
│   ├── ComponentCard.tsx        # Carte d'aperçu (preview + nom + description + badges)
│   ├── layout/
│   │   └── Header.tsx           # En-tête collant (logo + badge « Sound on »)
│   └── ui/                      # ← Composants de la bibliothèque (1 dossier / composant)
│       ├── Toggle/
│       │   └── Toggle.tsx
│       └── MemoryViewModePicker/
│           ├── MemoryViewModePicker.tsx
│           └── MemoryViewModePicker.swift   # Référence source SwiftUI
├── showcase/
│   └── registry.tsx             # Registre des composants affichés dans la grille
└── pages/
    └── Home.tsx                 # Page d'accueil (titre + grille)
```

## Design system (tokens)

Architecture à **2 niveaux**, centralisée dans `src/styles/` (les composants
n'utilisent **jamais** de valeur en dur — uniquement les utilitaires sémantiques) :

- `src/styles/tokens.css`
  - **Primitives** (`:root`) — palette et familles brutes : `--c-night`, `--c-black`, `--c-gray`, `--c-green`, `--ff-sans`, `--ff-display`. Jamais référencées directement dans les composants.
  - **Sémantiques** (`@theme`) — nommées par usage, dérivées des primitives via `color-mix`, et exposées en utilitaires Tailwind.
- `src/styles/fonts.css` — déclarations `@font-face` (« Talina »).
- `src/index.css` — orchestre les imports (`tailwindcss`, `fonts`, `tokens`) + styles de base.

### Couleurs sémantiques → utilitaires

| Token (`@theme`)          | Dérivé de              | Utilitaires             | Usage                       |
| ------------------------- | ---------------------- | ----------------------- | --------------------------- |
| `--color-background`      | blanc                  | `bg-background`         | Fond de page / pastilles    |
| `--color-foreground`      | noir                   | `text-foreground`       | Texte principal             |
| `--color-muted`           | `#5f5f5f`              | `text-muted`            | Texte tertiaire (badge)     |
| `--color-subtle`          | night 20 %             | `text-subtle`           | Texte secondaire            |
| `--color-brand`           | `#00082e`              | `text-brand`            | Couleur de marque           |
| `--color-success`         | vert                   | `bg-success`            | Statut « on »               |
| `--color-surface`         | night 5 %              | `bg-surface`            | Fonds cartes / badges       |
| `--color-surface-strong`  | night 10 %             | `bg-surface-strong`     | Survol / décor (waveform)   |
| `--color-border`          | night 12 %             | `border-border`         | Bordures                    |

### Typographie → utilitaires

Styles de texte composites (taille + interligne + interlettrage + graisse) :

| Token          | Réglages                          | Utilitaire     | Usage              |
| -------------- | --------------------------------- | -------------- | ------------------ |
| `--text-display` | 43px / 0.9 / -1.72px / 700       | `text-display` | Titre (+ `font-display`) |
| `--text-label`   | 14px / 0.94 / -0.7px / 600       | `text-label`   | Labels, descriptions, header |
| `--text-caption` | 11px / 1 / -0.3px / 600          | `text-caption` | Badges plateforme  |

Familles : `font-sans` (DM Sans), `font-display` (Talina). Rayons : `rounded-card` (12px), `rounded-pill` (999px). Layout : `--layout-max-width` (1116px), `--layout-gutter` (48px).

## Ajouter un composant à la vitrine

1. Créer le composant dans son dossier : `src/components/ui/MonComposant/MonComposant.tsx`.
   N'utiliser **que** les tokens sémantiques (jamais de couleur/taille en dur).
   Un son éventuel est colocalisé dans le même dossier (ex. `tap-sound.mp3`).
2. L'enregistrer dans `src/showcase/registry.tsx` :

```tsx
import monSon from '../components/ui/MonComposant/mon-son.mp3';

{
  id: 'mon-composant',
  name: 'Mon composant',
  description: 'Courte description',
  preview: <MonComposant />,
  platforms: ['react', 'swift'], // badges affichés sur la carte (optionnel)
  sound: monSon,                 // sound design : clic → son + icône animée (optionnel)
}
```

**Sound design** : si `sound` est défini, un clic sur la carte joue le fichier audio et
déclenche l'icône son animée (`SoundWave`, ~1,4 s : apparition → montée → descente →
disparition). Sans `sound`, le clic ne fait rien apparaître.

La grille de `Home.tsx` se met à jour automatiquement à partir du registre.

## Référence Figma

Maquette source : `node-id=1527-395` du fichier Figma Sordulo. La largeur de référence
est 1440px (header en pleine largeur, padding 48px ; contenu centré `max-w-[1116px]`).
La mise en page est rendue responsive (grille 1 colonne sur mobile, 2 colonnes ≥ md).
