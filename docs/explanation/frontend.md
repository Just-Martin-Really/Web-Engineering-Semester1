# Frontend

See also: [Architecture](architecture.md) · [Security](security.md)

The pages are rendered server-side with Pug and styled with [Bootstrap 5.3](https://getbootstrap.com/). Bootstrap is a project dependency and is served from the app's own origin at `/vendor/bootstrap` (mapped to `node_modules/bootstrap/dist`), never from a public CDN. Keeping every asset first-party means the Content Security Policy can stay locked to `'self'` without loosening it for external hosts.

## Design system

`public/base.css` is loaded after Bootstrap and acts as the theme layer. It remaps Bootstrap's design tokens (`--bs-primary`, link colours, border radii, the body font) onto the Fredforum brand palette, so the built-in components pick up the brand without per-element overrides. The three page stylesheets (`homepage.css`, `forumpage.css`, `registration.css`) only add the handful of touches Bootstrap does not cover.

Shared building blocks live in `views/mixins.pug`: the brand wordmark and the theme-toggle button, reused by every page's navbar.

## Light and dark mode

Colour mode is driven by Bootstrap's `data-bs-theme` attribute on `<html>`. `public/theme.js` runs synchronously in `<head>` so the correct mode is set before first paint (no flash), reading a saved choice from `localStorage` or falling back to the operating-system preference. The toggle button in the navbar flips the mode and persists it. Because the whole UI is expressed through Bootstrap and CSS variables, both modes come out cohesive with no duplicated styles.

## Progressive enhancement

All interactive features are additive: the server-side validation in `utils/validationRules.js` stays authoritative, and the client-side helpers only improve the experience. Key helpers live in `public/utils.js`:

- **Toast notifications** — `showToast()` replaces blocking `alert()` dialogs with Bootstrap toasts. It falls back gracefully if the Bootstrap bundle has not loaded yet.
- **Relative timestamps** — `timeAgo()` renders posts and comments as "vor 5 Min." while keeping the absolute date in the element's `title`.
- **Client-side validation feedback** — `validateForm()` adds Bootstrap's `was-validated` styling to the login and registration forms before a request is sent.

The forum page (`public/forumpage.js`) adds live search, a sort control (newest, oldest, most comments), a character counter for new posts, and "load more" pagination on top of the same JSON API the rest of the app uses.
