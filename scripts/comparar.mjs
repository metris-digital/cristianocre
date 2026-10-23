// Confere se cada post convertido para markdown saiu igual ao HTML antigo.
//
//   npm run build && npm run comparar [-- nome-do-post ...]
//
// Compara a página gerada (dist/) com a original (no branch de produção do
// Git): o conteúdo do <main>, tag a tag e texto a texto, e os campos de SEO
// do <head>. Diferenças só de forma (espaços, <b> e <strong>, ordem de
// atributos, entidades) não contam.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse } from 'node-html-parser';
import { decodeHTML } from 'entities';

const BRANCH = 'main-cristianocre';
const PASTAS = ['src/content/insights', 'src/content/podcast'];
const pedidos = process.argv.slice(2);
const slugs = pedidos.length
  ? pedidos
  : PASTAS.flatMap((p) => fs.readdirSync(p).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));

// Atributos que o molde novo padronizou de propósito. O id dos títulos é o
// âncora que o Astro cria (/post#secao).
const IGNORAR_ATRIBUTOS = new Set(['fetchpriority', 'loading', 'id']);
// Blocos que passaram a ser iguais em todos os posts: o card do autor tinha
// 11 versões escritas à mão.
const IGNORAR_BLOCOS = ['author-card'];

// dist/ velho compara a página original com ela mesma e dá falso "igual".
const md = Math.max(...PASTAS.flatMap((p) => fs.readdirSync(p).map((f) => fs.statSync(`${p}/${f}`).mtimeMs)));
if (!fs.existsSync('dist') || fs.statSync('dist').mtimeMs < md) {
  console.error('O dist/ é mais velho que os posts. Rode npm run build antes.');
  process.exit(1);
}

let falhas = 0;
for (const slug of slugs) {
  const antigo = execFileSync('git', ['show', `${BRANCH}:${slug}.html`], { encoding: 'utf8', maxBuffer: 1e8 });
  const novo = fs.readFileSync(`dist/${slug}.html`, 'utf8');
  const problemas = [...compararHead(antigo, novo), ...compararMain(antigo, novo)];
  if (problemas.length) {
    falhas++;
    console.log(`\n✗ ${slug}`);
    for (const p of problemas.slice(0, 15)) console.log(`  ${p}`);
    if (problemas.length > 15) console.log(`  ... e mais ${problemas.length - 15}`);
  } else {
    console.log(`✓ ${slug}`);
  }
}
console.log(falhas ? `\n${falhas} de ${slugs.length} com diferença.` : `\nTodos os ${slugs.length} iguais.`);
process.exit(falhas ? 1 : 0);

function compararHead(a, b) {
  const da = parse(a), db = parse(b);
  const campos = [
    ['title', (d) => d.querySelector('title')?.text],
    ['description', (d) => d.querySelector('meta[name="description"]')?.getAttribute('content')],
    ['canonical', (d) => d.querySelector('link[rel="canonical"]')?.getAttribute('href')],
    ['robots', (d) => d.querySelector('meta[name="robots"]')?.getAttribute('content')],
    ['og:image', (d) => d.querySelector('meta[property="og:image"]')?.getAttribute('content')],
    ['published', (d) => d.querySelector('meta[property="article:published_time"]')?.getAttribute('content')],
    ['ld:datePublished', (d) => artigo(d)?.datePublished],
    ['ld:dateModified', (d) => artigo(d)?.dateModified],
    ['ld:isPartOf', (d) => artigo(d)?.isPartOf?.['@id']],
    ['ld:video', (d) => JSON.stringify(ld(d).filter((n) => n['@type'] === 'VideoObject').map((v) => [v.name, v.contentUrl, v.uploadDate, v.publisher?.name]))],
    ['ld:faq', (d) => ld(d).find((n) => n['@type'] === 'FAQPage')?.mainEntity.length],
    ['pixel', (d) => (d.toString().match(/fbq\('init', '(\d+)'\)/) || [])[1]],
    ['ga4', (d) => (d.toString().match(/gtag\('config', '([^']+)'\)/) || [])[1]],
    ['app.js', (d) => String(/src="\/?app\.js"/.test(d.toString()))],
    ['youtube-feed.js', (d) => String(d.toString().includes('youtube-feed.js'))],
  ];
  const out = [];
  // Tipo de dado estruturado que existia e sumiu. (BlogPosting virou Article
  // e a trilha BreadcrumbList entrou em todos, de propósito.)
  const tipos = (d) => new Set(ld(d).map((n) => (n['@type'] === 'BlogPosting' ? 'Article' : n['@type'])));
  const novos = tipos(db);
  for (const t of tipos(da)) if (!novos.has(t)) out.push(`head ld: sumiu o ${t}`);
  // Propriedade dos dados estruturados que existia e sumiu (thumbnailUrl
  // virou lista com os dois tamanhos, de propósito).
  const tipo = (n) => (n['@type'] === 'BlogPosting' ? 'Article' : n['@type']);
  for (const n of ld(da)) {
    const m = ld(db).find((x) => tipo(x) === tipo(n));
    const agora = new Set(m ? caminhos(m) : []);
    for (const c of new Set(caminhos(n)))
      if (!agora.has(c) && !c.startsWith('.thumbnailUrl')) out.push(`head ld: ${tipo(n)} perdeu ${c}`);
  }
  for (const [nome, ler] of campos) {
    const va = ler(da), vb = ler(db);
    if (String(va) !== String(vb)) out.push(`head ${nome}: antes ${JSON.stringify(va)} | agora ${JSON.stringify(vb)}`);
  }
  return out;
}

function caminhos(o, p = '') {
  if (typeof o !== 'object' || o === null) return [p];
  if (Array.isArray(o)) return o.flatMap((x) => caminhos(x, `${p}[]`));
  return Object.entries(o).flatMap(([k, v]) => caminhos(v, `${p}.${k}`));
}

function ld(d) {
  return d.querySelectorAll('script[type="application/ld+json"]').flatMap((s) => JSON.parse(s.text)['@graph'] ?? []);
}
function artigo(d) {
  return ld(d).find((n) => ['Article', 'BlogPosting'].includes(n['@type']));
}

function compararMain(a, b) {
  const la = linhas(parse(a).querySelector('main'));
  const lb = linhas(parse(b).querySelector('main'));
  const out = [];
  // Diferença linha a linha pela maior subsequência comum.
  const n = la.length, m = lb.length;
  const lcs = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i][j] = la[i] === lb[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && la[i] === lb[j]) { i++; j++; }
    else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) out.push(`+ ${lb[j++]}`);
    else out.push(`- ${la[i++]}`);
  }
  return out;
}

// Forma canônica: uma linha por abertura de tag (com atributos ordenados) e
// uma por trecho de texto.
function linhas(no) {
  const out = [];
  const visitar = (n) => {
    if (n.nodeType === 3) {
      const t = decodificar(n.rawText).replace(/\s+/g, ' ').trim();
      if (t) out.push(`"${t}"`);
      return;
    }
    if (n.nodeType !== 1) return;
    if (IGNORAR_BLOCOS.some((c) => n.classList?.contains(c))) return;
    let tag = n.rawTagName?.toLowerCase();
    if (tag === 'strong') tag = 'b';
    if (tag === 'em') tag = 'i';
    const attrs = Object.entries(n.attributes)
      .filter(([k]) => !IGNORAR_ATRIBUTOS.has(k))
      .map(([k, v]) => {
        if (k === 'class') v = v.split(/\s+/).filter(Boolean).sort().join(' ');
        if (k === 'src' || k === 'href' || k === 'srcset') v = v.replace(/^(?!\/|https?:|#|mailto:)/, '/');
        return `${k}="${decodificar(v)}"`;
      })
      .sort();
    out.push(`<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`);
    n.childNodes.forEach(visitar);
  };
  no.childNodes.forEach(visitar);
  return out;
}

function decodificar(t) {
  return decodeHTML(t);
}
