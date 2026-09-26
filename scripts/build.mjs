import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJSON = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const [tiles, projects] = await Promise.all([
  readJSON('content/tiles.json'), readJSON('content/projects.json'),
]);
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const out = new URL('docs/', root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(new URL('public/', root), out, { recursive: true });

function document({ title, description, prefix = './', body }) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} | Braelyn Mitrovic</title>
  <meta name="description" content="${escape(description)}">
  <meta property="og:title" content="${escape(title)} | Braelyn Mitrovic">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:type" content="website">
  <link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${prefix}styles.css">
  <script src="${prefix}motion.js" type="module"></script>
</head>
<body>
  <a class="skip" href="#main">Zum Inhalt</a>
  <header class="site-header"><a class="wordmark" href="${prefix}">BRAELYN MITROVIC</a></header>
  <main id="main">${body}</main>
</body>
</html>`;
}

function tile(project) {
  const media = project.video
    ? `<video data-loop data-src="./${escape(project.video)}" poster="./${escape(project.poster)}" muted loop playsinline preload="none" aria-hidden="true"></video>`
    : project.images.map(src => `<img src="./${escape(src)}" alt="" loading="lazy" width="500" height="500">`).join('');
  return `<a class="tile tile--${escape(project.shape)}" href="./${escape(project.slug)}/" aria-label="${escape(project.title)}">${media}<span class="tile__title">${escape(project.title)}</span></a>`;
}

await writeFile(new URL('index.html', out), document({
  title: 'Portfolio',
  description: 'Videos, Interviews, Reportagen und Kommunikationsprojekte von Braelyn Mitrovic.',
  body: `<div class="collage">${tiles.map(tile).join('\n')}</div><button class="motion-toggle" data-motion-toggle type="button" aria-pressed="false">Animationen pausieren</button>`,
}));


function projectCredits(project) {
  if (!project.creditGroups?.length) return '';
  return '<div class="project-credits">' + project.creditGroups.map(group =>
    (group.title ? `<p class="credit-group-title">${escape(group.title)}</p>` : '') +
    group.items.map(credit =>
      `<p class="project-credit"><strong>${escape(credit.label)}:</strong> ${escape(credit.name)}</p>`
    ).join('\n')
  ).join('\n') + '</div>';
}

for (const project of projects) {
  const folder = new URL(`${project.slug}/`, out);
  await mkdir(folder, { recursive: true });
  const media = [
    ...project.videos.map(video => `<video src="../${escape(video.src)}" controls playsinline preload="metadata" aria-label="${escape(project.title)}" style="aspect-ratio:${video.width}/${video.height};max-height:80vh"></video>`),
    ...project.social.map(social => social.type === 'instagram'
      ? `<blockquote class="instagram-media" data-instgrm-permalink="${escape(social.url)}" data-instgrm-version="14"><a href="${escape(social.url)}">Video auf Instagram ansehen</a></blockquote><script async src="https://www.instagram.com/embed.js"></script>`
      : `<blockquote class="tiktok-embed" cite="${escape(social.url)}" data-video-id="${escape(social.id)}"><section><a href="${escape(social.url)}">Video auf TikTok ansehen</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`),
    ...project.embeds.map(src => `<iframe src="${escape(src)}" title="${escape(project.title)} – Video" loading="lazy" allow="fullscreen; picture-in-picture; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`),
    ...project.images.map(src => `<img src="../${escape(src)}" alt="${escape(project.title)}" loading="lazy">`),
  ].join('\n');
  await writeFile(new URL('index.html', folder), document({
    title: project.title,
    description: project.text[0]?.slice(0, 180) || project.title,
    prefix: '../',
    body: `<nav class="project-nav" aria-label="Portfolio"><a class="close" href="../" aria-label="Zurück zum Portfolio">×</a></nav>
    <article class="project"><div class="project-media">${media}</div><div><h1>${escape(project.title)}</h1><p class="project-year"><strong>${escape(project.year ?? 'XXXX')}</strong></p>${projectCredits(project)}${project.bodyHtml}</div></article>`,
  }));
}
await writeFile(new URL('404.html', out), document({
  title: 'Seite nicht gefunden', description: 'Zurück zum Portfolio von Braelyn Mitrovic.',
  body: '<h1>Seite nicht gefunden</h1><p><a href="./">Zum Portfolio</a></p>',
}));
await writeFile(new URL('.nojekyll', out), '');
console.log(`Built portfolio and ${projects.length} project pages.`);
