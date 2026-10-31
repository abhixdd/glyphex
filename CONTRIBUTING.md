# Contributing to Glyphex

Thanks for helping. Bug reports, ideas and pull requests are all welcome.

## Set up

```bash
npm install
npm run dev
```

You need a recent Node.js (22 or newer) and a browser with WebGL2.

## Before you open a pull request

- `npm run lint` reports no problems.
- `npm run build` succeeds.
- You tried your change in the browser. Load a resource pack of your own to check the preview, the effect list and the Scratch GLSL panel.
- **Never commit resource packs** (or anything extracted from one) to the repository. `.zip` and `.jar` files are git-ignored on purpose.
- For UI changes, check a phone-width layout as well as desktop.

Keep pull requests small and focused, and describe what changed and why.

## Style

- React with plain functions and hooks. Don't set state inside `useMemo` or synchronously inside effects; derive values instead.
- Tailwind for styling. Shared colors, panels and buttons live in `src/index.css` (`.panel`, `.inset`, `.btn`).
- No new dependencies unless they are clearly worth it. The app is fully client-side.

## Bug reports

Please include: what you did, what you expected, what happened, your browser, and, if it involves a pack, which shader files it uses (don't attach packs you don't have the right to share).

## Licensing of contributions

Glyphex is under the [GNU Affero General Public License v3.0](LICENSE). By submitting a contribution you agree that it is licensed under the same terms.
