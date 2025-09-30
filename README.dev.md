Developer quick start

1. Ensure Node.js (>=14) and npm are installed.
2. Open PowerShell in project root and run:

   .\setup.ps1

This will run `npm install` and then `npm run build`.

What build does:

- minifies `main.js` to `main.min.js`
- minifies `styles.css` to `styles.min.css`
- converts JPG/PNG images in `assets/` to WebP and resized versions

After build, update `index.html` to reference minified assets for production.
