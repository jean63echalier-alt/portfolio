# jeechalier.fr — Site commercial Jean Echalier Services

Site Astro 5 + Tailwind CSS 4, déployable sur Vercel. Le portfolio sert de
preuve aux 4 piliers de services (contenus gérés en Markdown).

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # vérifie aussi les schémas de contenu (Zod)
```

## Ajouter / éditer un projet

1 fichier = 1 projet dans `src/content/projets/*.md` (frontmatter validé au
build : titre, pilier, client, rôle, `videoId` YouTube, galerie…).
`draft: true` masque la fiche. Les brouillons en place sont à rédiger en
Phase 2 (format Le Défi / La Solution / Les Résultats — voir `beeclou.md`).

Images : à déposer dans `public/images/projets/<slug>/` (WebP recommandé),
puis référencer dans `cover` et `gallery`.

## À faire avant mise en ligne (Phase 3-4)

- [ ] Formulaire : remplacer `VOTRE_ID` dans `src/pages/contact.astro`
      (Formspree/Formspark) ou brancher une API route Vercel.
- [ ] Rédiger les 5 fiches projets en brouillon + exporter les visuels.
- [ ] Renseigner le `videoId` YouTube de Clermont Foot 63.
- [ ] Compléter mentions légales et bio.
- [ ] Créer `public/og-default.png` (1200×630).
- [ ] Déployer sur Vercel, brancher jeechalier.fr, soumettre le sitemap
      dans Google Search Console (site actuellement non indexé).

## Design tokens

Palette « basalte » : fond gris Volvic `#eeeeea`, encre `#16181a`, accent
cobalt `#2b3cf0`. Typo : Archivo (display expanded), Instrument Sans (texte),
IBM Plex Mono (labels). Tokens dans `src/styles/global.css`.
