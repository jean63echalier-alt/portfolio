# jeechalier.fr — Site commercial Jean Echalier Services

## Contexte
Site vitrine + portfolio d'un studio digital indépendant (Jean Echalier,
Clermont-Ferrand). Objectif : convertir les visiteurs en demandes de devis.
Le portfolio sert de preuve aux 4 piliers de services. Positionnement :
ancrage local Clermont-Ferrand / Auvergne + interventions à distance dans
toute la France. Prix : sur devis uniquement (jamais de tarifs affichés).

## Stack
- Astro 5 (statique, content collections avec loader glob)
- Tailwind CSS 4 (plugin Vite, tokens dans src/styles/global.css via @theme)
- Déploiement : Vercel — domaine cible jeechalier.fr

## Commandes
- `npm run dev` — serveur local (port 4321)
- `npm run build` — build + validation Zod des contenus (DOIT passer avant
  tout commit)

## Architecture des contenus
- `src/content/projets/*.md` — 1 fichier = 1 réalisation. Frontmatter validé
  (src/content.config.ts) : title, pillar, type, client, sector, year, role,
  featured, draft, cover, gallery, videoId. Corps : ## Le Défi / ## La
  Solution / ## Les Résultats. `beeclou.md` est la fiche de référence.
- `src/content/services/*.md` — 1 fichier = 1 pilier (4 au total, ne jamais
  en ajouter/supprimer sans demande explicite).
- Valeurs de `pillar` : conseil-marque | web-mobile | contenu-audiovisuel |
  social-growth.

## Règles impératives
1. Tout le contenu visible est en FRANÇAIS (code et commentaires en anglais
   acceptés).
2. Ne pas modifier les design tokens (palette basalte/Volvic/cobalt, fonts
   Archivo / Instrument Sans / IBM Plex Mono) sans demande explicite.
3. Ne jamais mettre d'ID vidéo ou d'URL en dur dans les templates : toujours
   passer par le frontmatter (`videoId`, `gallery`).
4. Pas de framework JS côté client sans nécessité : Astro statique d'abord,
   île d'hydratation seulement si indispensable.
5. Zéro tarif chiffré dans les pages ; le budget est capté par le formulaire.
6. Accessibilité : conserver focus visible, alt sur toutes les images,
   prefers-reduced-motion respecté.
7. Après toute modification de contenu ou de schéma : lancer `npm run build`
   et corriger les erreurs Zod avant de conclure.

## État du projet
- Phase 1 (fondations) : TERMINÉE — layout, tokens, pages, collections.
- Phase 2 (contenus) : EN COURS — 5 fiches projets en `draft: true` à
  rédiger (clermont-foot-63, puy-de-dome, lsdj, mythese, mes-convictions) ;
  images à ajouter dans public/images/projets/<slug>/.
- Phase 3 (conversion) : formulaire contact.astro à brancher (remplacer
  VOTRE_ID Formspree ou créer une API route), og-default.png à créer.
- Phase 4 (mise en ligne) : Vercel + domaine + Search Console (le site
  actuel n'est pas indexé — prioritaire).
