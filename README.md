# Sign Generator

Self-service "[Group] for Abdul" graphic generator for the Abdul El-Sayed for
U.S. Senate campaign. Type a group name, pick a color scheme and a format,
download a PNG. Fully client-side — nothing typed is ever sent anywhere.

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
