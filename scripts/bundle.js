// Builds a single self-contained HTML file with all CSS/JS inlined, so it
// works when opened directly (file://) with no sibling folders required —
// a safe drop-in for anyone who just wants "one html file that plays".
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Inline the stylesheet
html = html.replace(
  /<link rel="stylesheet" href="css\/main\.css" \/>/,
  () => `<style>\n${fs.readFileSync(path.join(root, 'css/main.css'), 'utf8')}\n</style>`
);

// Inline every script tag, in order, preserving load order
const scriptSrcs = [
  'js/vendor/three.min.js',
  'js/elements-data.js',
  'js/data/element-profiles.js',
  'js/data/element-profiles-2.js',
  'js/fx/core.js',
  'js/fx/objects.js',
  'js/fx/nucleus.js',
  'js/fx/specimen.js',
  'js/fx/charts.js',
  'js/starfield.js',
  'js/periodic-table.js',
  'js/audio.js',
  'js/intro.js',
  'js/lab.js',
  'js/theater/theater.js',
  'js/theater/sites-common.js',
  'js/theater/sites-stellar.js',
  'js/theater/sites-cosmic.js',
  'js/theater/reveal.js',
  'js/gold-journey.js',
  'js/app.js',
];

scriptSrcs.forEach(src => {
  const code = fs.readFileSync(path.join(root, src), 'utf8');
  const tag = `<script src="${src}"></script>`;
  if (!html.includes(tag)) throw new Error('Could not find script tag for ' + src);
  html = html.replace(tag, `<script>\n${code}\n</script>`);
});

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'cosmic-elements-journey.html');
fs.writeFileSync(outPath, html);
console.log('wrote', outPath, (fs.statSync(outPath).size/1024/1024).toFixed(2), 'MB');
