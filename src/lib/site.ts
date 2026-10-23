// Dados que se repetem no site inteiro. Mudou aqui, muda em todas as páginas
// geradas pelo Astro. As páginas que ainda estão em public/ têm esses valores
// escritos à mão: confira lá também.

export const SITE = 'https://www.cristianocre.com';

// Precisa bater com CC_PIXEL em public/app.js.
export const PIXEL_META = '942431053282816';
export const GA4 = 'G-BDN80J4GWP';

export const AUTOR = {
  nome: 'Cristiano Creczyenski',
  cargo: 'CEO da Metris',
  linkedin: 'https://www.linkedin.com/in/cristianocre/',
  foto: `${SITE}/cristiano.jpg`,
  descricao:
    'Especialista em e-commerce, marketing de performance, CRM e mídia paga, com mais de 17 anos de experiência ajudando marcas a transformar tráfego em vendas.',
  sameAs: [
    'https://www.linkedin.com/in/cristianocre/',
    'https://br.linkedin.com/in/cristianocre',
    'https://www.instagram.com/cristianocre',
    'https://www.youtube.com/@cristianocre',
  ],
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** 2026-05-20 → "20 de maio de 2026" */
export function dataPorExtenso(d: Date): string {
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** 2026-05-20 */
export function dataIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Link para o site da Metris com a origem marcada no GA4 deles. */
export function linkMetris(url: string, campanha: string, meio = 'blog'): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}utm_source=cristianocre&utm_medium=${meio}&utm_campaign=${campanha}`;
}

/** "texto com *destaque*" → HTML com o destaque em degradê. */
export function comDestaque(texto: string): string {
  return escapar(texto).replace(/\*([^*]+)\*/g, '<span class="accent">$1</span>');
}

export function semDestaque(texto: string): string {
  return texto.replace(/\*([^*]+)\*/g, '$1');
}

export function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Texto puro de um trecho em HTML (para os dados estruturados). */
export function textoPuro(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8209;/g, '‑')
    .replace(/\s+/g, ' ')
    .trim();
}
