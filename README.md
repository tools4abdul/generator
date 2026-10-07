# Sign Generator

Self-service "[Group] for Abdul" graphic generator for the Abdul El-Sayed for
U.S. Senate campaign. Type a group name, pick a color scheme and a format,
download a PNG or SVG. Fully client-side — nothing typed is ever sent anywhere.

Deployed at [tools4abdul.com/generator](https://tools4abdul.com/generator).
The build here is checked out and built as part of the `tools4abdul/cliposition`
repo's GitHub Pages deploy workflow, which copies this project's `dist/`
output into its own artifact at `/generator/`.

## Develop

```
npm install
npm run dev
npm run build
npm run check
```

## Shared tool header

The five Tools for Abdul applications use the canonical component and styles from
`tools4abdul/cliposition/shared/tool-header/`. This project's versioned copy is in
`src/tool-header/` so standalone builds need no runtime fetch or extra package.
From the canonical checkout run `node scripts/sync-tool-header.mjs <this-checkout>`
to update the copy; commit and rebuild it with the app. The logo returns to Positions;
explicit links lead to the campaign, voting information, volunteering, and volunteer
Slack. Arabic is not published in this release.
