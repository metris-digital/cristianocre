// sitemap.xml: páginas fixas (src/data/paginas-fixas.ts), as listas do
// /insights e do /podcast e todos os posts e episódios publicados. Post novo
// entra sozinho, com a data de atualização (ou de publicação) no lastmod.
import { PAGINAS_FIXAS } from '../data/paginas-fixas';
import { publicados, modificado } from '../lib/posts';
import { SITE, dataIso } from '../lib/site';

type Entrada = { url: string; lastmod?: string; changefreq?: string; priority?: string };

export async function GET() {
  const posts = await publicados();
  const episodios = posts.filter((p) => p.collection === 'podcast');
  const maisNova = (lista: typeof posts) => dataIso(new Date(Math.max(...lista.map((p) => modificado(p).getTime()))));

  const entradas: Entrada[] = [
    ...PAGINAS_FIXAS,
    { url: '/insights', lastmod: maisNova(posts) },
    ...(episodios.length ? [{ url: '/podcast', lastmod: maisNova(episodios), changefreq: 'weekly', priority: '0.9' }] : []),
    ...posts.map((p) => ({ url: `/${p.id}`, lastmod: dataIso(modificado(p)), changefreq: 'monthly', priority: '0.8' })),
  ];

  const linha = (e: Entrada) =>
    `  <url><loc>${SITE}${e.url}</loc>` +
    (e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : '') +
    (e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : '') +
    (e.priority ? `<priority>${e.priority}</priority>` : '') +
    '</url>';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas.map(linha).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
