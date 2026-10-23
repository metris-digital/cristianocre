// Converte posts antigos (HTML em public/) para markdown em src/content/insights
// (episódios do podcast, podcast-*, vão para src/content/podcast).
//
//   npm run converter -- carrinho-abandonado-ecommerce consultoria-de-ecommerce
//
// Lê o HTML, escreve o .md com os campos no topo e o texto em markdown, e
// apaga o HTML de public/ (o Astro passa a gerar a página). Blocos com classe
// (keybox, cta-inline, formula...) ficam em HTML dentro do markdown, como
// estão. Depois rode `npm run build && npm run comparar` para conferir.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';
import { tables } from 'turndown-plugin-gfm';

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('Diga quais posts converter: npm run converter -- nome-do-post');
  process.exit(1);
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*', strongDelimiter: '**' });
td.use(tables);
// Qualquer bloco com classe fica em HTML, igual ao original.
td.keep((no) => no.nodeType === 1 && (no.getAttribute('class') || no.getAttribute('style')) && !['A', 'B', 'STRONG', 'I', 'EM'].includes(no.nodeName));
td.addRule('negrito', { filter: ['b', 'strong'], replacement: (c) => (c.trim() ? `**${c}**` : c) });

const PADRAO_CHAMADA = {
  selo: 'Diagnóstico gratuito',
  titulo: 'Pare de fazer marketing no improviso.',
  texto: 'Receba uma análise gratuita do seu marketing e descubra onde estão as maiores oportunidades de crescimento.',
  numero: '1h',
  numeroLegenda: 'análise com o Cristiano',
  botao: 'Quero meu diagnóstico',
  link: '/diagnostico',
  nota: 'É gratuito e sem compromisso.',
};

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

for (const slug of slugs) converter(slug);

function converter(slug) {
  // Relê o original do Git se o arquivo já saiu de public/ (reconversão).
  const origem = `public/${slug}.html`;
  const html = fs.existsSync(origem)
    ? fs.readFileSync(origem, 'utf8')
    : execFileSync('git', ['show', `main-cristianocre:${slug}.html`], { encoding: 'utf8', maxBuffer: 1e8 });
  const doc = parse(html, { comment: false });
  const meta = (sel) => doc.querySelector(sel)?.getAttribute('content');
  const ld = JSON.parse(doc.querySelector('script[type="application/ld+json"]').text);
  const artigo = ld['@graph'].find((n) => ['Article', 'BlogPosting'].includes(n['@type']));
  const main = doc.querySelector('main');
  const hero = main.querySelector('.post-hero');

  const fm = {};
  const h1 = hero.querySelector('h1');
  h1.querySelectorAll('span.accent').forEach((s) => s.replaceWith(`*${s.text}*`));
  fm.title = limpar(h1.text);
  fm.seoTitle = doc.querySelector('title').text;
  fm.description = meta('meta[name="description"]');
  fm.selo = limpar(hero.querySelector('.pill').text);
  fm.sub = interno(hero.querySelector('.sub'));
  fm.pubDate = meta('meta[property="article:published_time"]');
  const blMeta = limpar(hero.querySelector('.bl-meta').text);
  const atualizado = blMeta.match(/Atualizado em (\d+) de (\S+) de (\d{4})/);
  if (atualizado) {
    const [, dia, mes, ano] = atualizado;
    fm.updatedDate = `${ano}-${String(MESES.indexOf(mes) + 1).padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  if (/Publicado em/.test(blMeta)) fm.mostrarPublicado = true;
  fm.leitura = Number(blMeta.match(/Leitura de (\d+) min/)[1]);
  fm.imagem = new URL(meta('meta[property="og:image"]')).pathname;
  const capa = main.querySelector('.post-cover');
  const video = capa?.querySelector('button.vthumb');
  if (video) {
    // Capa em vídeo (episódios do podcast): guarda só o ID do YouTube.
    fm.video = video.getAttribute('data-yt');
    const rotulo = video.getAttribute('aria-label');
    if (rotulo !== 'Assistir ao episódio') fm.videoRotulo = rotulo;
    const legenda = capa.querySelector('figcaption');
    if (legenda) fm.legenda = interno(legenda);
  } else if (capa) {
    fm.capa = true;
    const alt = capa.querySelector('img').getAttribute('alt');
    if (alt !== limpar(h1.text).replace(/\*/g, '')) fm.capaAlt = alt;
    const legenda = capa.querySelector('figcaption');
    if (legenda) fm.legenda = interno(legenda);
  }
  if (artigo.isPartOf) {
    const { pathname, hash } = new URL(artigo.isPartOf['@id']);
    const trilha = ld['@graph'].find((n) => n['@type'] === 'BreadcrumbList');
    const item = trilha?.itemListElement.find((i) => i.item?.endsWith(pathname));
    fm.pilar = { titulo: item?.name ?? pathname, url: pathname + hash };
  }
  // Dados estruturados ricos (evento, empresa, pessoas citadas) que não
  // cabem nos campos: vão inteiros para ldExtra.
  const extra = {};
  const simples = (o) => o && !Array.isArray(o) && Object.keys(o).every((k) => ['@type', 'name', '@id'].includes(k));
  if (artigo.about && !simples(artigo.about)) extra.about = artigo.about;
  else if (artigo.about?.name) fm.tema = artigo.about.name;
  if (artigo.mentions) extra.mentions = artigo.mentions;
  if (artigo.isPartOf && Object.keys(artigo.isPartOf).some((k) => k !== '@id')) extra.isPartOf = artigo.isPartOf;
  if (artigo.publisher?.url) extra.publisher = artigo.publisher;
  if (Object.keys(extra).length) fm.ldExtra = extra;
  const dadosVideo = ld['@graph'].find((n) => n['@type'] === 'VideoObject');
  if (dadosVideo) {
    fm.videoDados = {
      id: new URL(dadosVideo.contentUrl).searchParams.get('v'),
      nome: dadosVideo.name,
      descricao: dadosVideo.description,
      ...(dadosVideo.uploadDate ? { data: dadosVideo.uploadDate } : {}),
      ...(dadosVideo.publisher?.name !== 'Metris' ? { canal: dadosVideo.publisher?.name } : {}),
    };
  }

  const article = main.querySelector('article.post');
  if (article.classList.contains('rich')) fm.rich = true;

  // FAQ
  const faqBloco = main.querySelector('.faq');
  const faqSecao = faqBloco.closest('section');
  const faqSelo = faqSecao.querySelector('.sec-head .pill');
  if (!faqSelo) fm.faqSelo = null;
  else if (limpar(faqSelo.text) !== 'Perguntas frequentes') fm.faqSelo = limpar(faqSelo.text);
  const cabFaq = faqSecao.querySelector('.sec-head');
  const h2s = cabFaq.querySelectorAll('h2');
  const faqH2 = limpar(h2s[h2s.length - 1].text);
  // Texto antes do título do FAQ (raro): vai inteiro, em HTML.
  const antes = cabFaq.childNodes.filter((n) => n.nodeType === 1 && !n.classList.contains('pill'));
  antes.pop();
  if (antes.length) fm.faqIntro = antes.map((n) => n.outerHTML).join('\n');
  if (!/max-width:760px/.test(faqBloco.getAttribute('style') ?? '')) fm.estiloAntigo = true;
  if (faqH2 !== 'Perguntas frequentes') fm.faqTitulo = faqH2;
  fm.faq = faqBloco.querySelectorAll('details').map((d) => {
    const resumo = d.querySelector('summary');
    resumo.querySelector('.pm')?.remove();
    return { q: interno(resumo), a: interno(d.querySelector('.ans')) };
  });

  // Continue lendo
  const relacionados = article.querySelector('.related');
  if (relacionados) {
    const titulo = limpar(relacionados.querySelector('h3').text);
    if (titulo !== 'Continue lendo') fm.relacionadosTitulo = titulo;
    fm.relacionados = relacionados.querySelectorAll('li a').map((a) => ({ titulo: limpar(a.text), url: a.getAttribute('href') }));
    relacionados.remove();
  }
  article.querySelector('.author-card')?.remove();

  // Vitrine de guias (página pilar)
  const ilist = main.querySelector('.ilist');
  if (ilist) {
    const cab = ilist.closest('.wrap').querySelector('.sec-head');
    fm.guia = {
      selo: limpar(cab.querySelector('.pill').text),
      titulo: limpar(cab.querySelector('h2').text),
      texto: interno(cab.querySelector('p')),
      itens: ilist.querySelectorAll('a.icard').map((a) => ({
        chip: limpar(a.querySelector('.ichip').text),
        titulo: limpar(a.querySelector('h2').text),
        texto: interno(a.querySelector('p')),
        url: a.getAttribute('href'),
      })),
    };
  }

  // Chamada final
  const diag = main.querySelector('.diag');
  const lido = {
    selo: limpar(diag.querySelector('.pill').text),
    titulo: interno(diag.querySelector('h2')),
    texto: interno(diag.querySelector('.diag-grid > div > p')),
    numero: limpar(diag.querySelector('.big').text),
    numeroLegenda: limpar(diag.querySelector('.cap').text),
    botao: limpar(diag.querySelector('.btn').text.replace('→', '')),
    link: diag.querySelector('.btn').getAttribute('href').replace(`?utm_source=cristianocre&utm_medium=blog&utm_campaign=${slug}`, ''),
    nota: interno(diag.querySelector('.micro')),
  };
  const chamada = Object.fromEntries(Object.entries(lido).filter(([k, v]) => v !== PADRAO_CHAMADA[k]));
  if (Object.keys(chamada).length) fm.chamada = chamada;

  if (html.includes('youtube-feed.js')) fm.feedYoutube = true;

  // Blocos que o turndown estragaria: o botão de vídeo é vazio (o turndown
  // descarta) e a fórmula viraria bloco de código. Saem intactos.
  const intactos = [];
  article.querySelectorAll('button.vthumb, pre[class]').forEach((el) => {
    // Tag de abertura sozinha na linha: o markdown trata como bloco HTML e
    // não põe o botão dentro de um parágrafo.
    intactos.push(el.tagName === 'BUTTON' ? el.outerHTML.replace(/^(<button[^>]*>)/, '$1\n') : el.outerHTML);
    el.replaceWith(`<p>@@BLOCO${intactos.length - 1}@@</p>`);
  });

  const lead = article.querySelector('p.lead');
  if (lead) lead.removeAttribute('class');
  const corpo = td.turndown(article.innerHTML).replace(/\n{3,}/g, '\n\n')
    .replace(/^(\s*)-   /gm, '$1- ')
    .replace(/^(\s*)(\d+)\.  /gm, '$1$2. ')
    .replace(/@@BLOCO(\d+)@@/g, (_, i) => intactos[Number(i)])
    .trim();

  const pasta = slug.startsWith('podcast-') ? 'podcast' : 'insights';
  fs.writeFileSync(`src/content/${pasta}/${slug}.md`, `---\n${yaml(fm)}---\n\n${corpo}\n`);
  if (fs.existsSync(origem)) fs.unlinkSync(origem);
  console.log(`ok  ${slug}`);
}

function limpar(t) {
  return t.replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Conteúdo do elemento: texto puro se não houver tag, senão o HTML. */
function interno(el) {
  if (!el) return undefined;
  const h = el.innerHTML.replace(/\s+/g, ' ').trim();
  return /<[a-z]/i.test(h) ? h : limpar(el.text);
}

// YAML simples: textos entre aspas duplas (formato JSON, que o YAML aceita).
function yaml(obj, recuo = '') {
  let s = '';
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      s += `${recuo}${k}:\n`;
      for (const item of v) {
        const linhas = yaml(item, `${recuo}    `).trimEnd().split('\n');
        s += `${recuo}  - ${linhas[0].trimStart()}\n` + linhas.slice(1).map((l) => l + '\n').join('');
      }
    } else if (k === 'ldExtra') {
      // JSON numa linha: o YAML aceita e ninguém edita isso à mão.
      s += `${recuo}${k}: ${JSON.stringify(v)}\n`;
    } else if (v && typeof v === 'object') {
      s += `${recuo}${k}:\n${yaml(v, `${recuo}  `)}`;
    } else if (typeof v === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      s += `${recuo}${k}: ${JSON.stringify(v)}\n`;
    } else {
      s += `${recuo}${k}: ${v}\n`;
    }
  }
  return s;
}
