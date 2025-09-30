// scripts/convert-images.js
// Resize and convert images to WebP (and keep originals). Uses sharp.
// Usage: node scripts/convert-images.js
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const assetsDir = path.join(__dirname, '..', 'assets')
const files = fs.readdirSync(assetsDir).filter(f => /\.(jpe?g|png)$/i.test(f))

async function processFile (file) {
  const src = path.join(assetsDir, file)
  const name = path.parse(file).name
  const outWebp = path.join(assetsDir, `${name}.webp`)
  const outWebpSmall = path.join(assetsDir, `${name}-lg.webp`)
  try {
    // create full-size webp (quality 80)
    await sharp(src).webp({ quality: 80 }).toFile(outWebp)
    // create resized large (max width 1600) webp
    await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 75 }).toFile(outWebpSmall)
    console.log('Processed', file)
  } catch (err) {
    console.error('Failed', file, err.message)
  }
}

(async () => {
  for (const f of files) { await processFile(f) }
})()
