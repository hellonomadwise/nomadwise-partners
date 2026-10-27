# Nomadwise partner placements

The page behind **partners.nomadwise.io**, where eSIM providers see open 1st and 2nd positions on Nomadwise's eSIM guides, their own placements, and send a package offer.

| Piece | Where |
|---|---|
| Page | `index.html`, `style.css`, `app.js` (plain HTML and JavaScript, no build step) |
| Data | Supabase project `nomadwise-maps`, in its own `partners` schema (not exposed to the API) |
| Access | Providers: a private link per provider (`#k=…`), made in the team view. Team: Google sign-in, NomadMaps founders plus emails added in the team view |
| Hosting | GitHub Pages from `main`, custom domain in `CNAME` |

Providers only ever receive their own data: the database function `partners_provider_page` replaces other providers' names with "other" and leaves out per-article views and clicks.

Nothing is emailed automatically. Replies and renewal reminders are drafted on the page and open in the team's email app after one of us approves them.

Separate from Nomad Maps (coworking) on purpose.
