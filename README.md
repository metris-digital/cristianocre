# cristianocre.com

Site pessoal do Cristiano Creczyenski: home, landing pages (Diagnóstico 360,
mentoria, treinamentos), materiais gratuitos com captação de leads no Notion,
podcast e o blog em `/insights`.

**Este repositório é público.** Nada de nota interna, dado de cliente ou
segredo em arquivo versionado, nem em comentário HTML (aparece no
view-source). Segredos ficam nas variáveis de ambiente da Vercel.

## Como está montado

Feito em [Astro](https://astro.build), na mesma estrutura do metris.digital.
Os posts e os episódios do podcast são arquivos markdown, editados pelo
Metris CMS ou direto aqui. As outras páginas são HTML puro em `public/`.

| Onde | O que é |
|---|---|
| `src/content/insights/` | Um `.md` por post do blog. O nome do arquivo é o endereço: `roas-nao-e-lucro.md` sai em `/roas-nao-e-lucro` |
| `src/content/podcast/` | Um `.md` por episódio (`podcast-*.md`), com os mesmos campos dos posts |
| `src/content.config.ts` | Os campos de um post, com o que é obrigatório. Campo errado quebra o build |
| `src/pages/[slug].astro` | A página de cada post e episódio |
| `src/pages/insights.astro`, `podcast.astro` | As listas, geradas a partir dos posts e episódios |
| `src/pages/sitemap.xml.ts`, `llms.txt.ts` | Sitemap e llms.txt, gerados no build |
| `src/data/paginas-fixas.ts` | Páginas que não são post, para o sitemap |
| `src/data/llms.txt` | O texto curado do llms.txt |
| `src/components/`, `src/layouts/` | Topo, rodapé, card da lista e o `<head>` de SEO, GA4 e Pixel |
| `scripts/rehype-post.mjs` | Ajustes no texto do post (abertura, tabelas, links externos, vídeos) |
| `public/` | Arquivos servidos como estão: as páginas em HTML puro, `styles.css`, `app.js`, imagens |
| `public/styles.css`, `public/app.js` | Estilo e script de todas as páginas: menu, formulários, GA4, Pixel da Meta, vídeos |
| `api/` | Funções da Vercel: leads no Notion e API de Conversões da Meta (`inscrever.js`, `capi.js`, `_meta.js`), feed do YouTube (`youtube.js`) |
| `cms.config.json` | O que o Metris CMS mostra para editar: coleções e campos |
| `test/` | Testes da função de leads |

## Publicar um post

**Pelo Metris CMS** (https://cms.metris.digital): escreva e publique. Cada
publicação vira um commit no branch de produção e entra no ar em cerca de
1 minuto.

**Direto no código:** crie `src/content/insights/nome-do-post.md` copiando os
campos de um post parecido, ponha a imagem em `public/img/nome-do-post.jpg`
(1200 × 675) e envie. Não precisa mexer em mais nada: a lista do
`/insights`, o sitemap e o llms.txt se atualizam sozinhos.

No texto do post:

- O primeiro parágrafo vira a abertura em destaque.
- Um link do YouTube sozinho num parágrafo vira o vídeo com capa:
  `[Título do vídeo](https://www.youtube.com/watch?v=ID)`.
- Bloco com estilo próprio (`keybox`, `cta-inline`, tabelas com
  formatação) vai em HTML no meio do markdown, como nos posts existentes.

## Trabalhar no site

```bash
git clone https://github.com/metris-digital/cristianocre.git ~/PROJETOS/CRISTIANOCRE-SITE
cd ~/PROJETOS/CRISTIANOCRE-SITE
npm install
```

1. Antes de começar: `git pull` (no VS Code: Sync Changes). O CMS também
   envia commits.
2. Para ver no navegador: `npm run dev` e abra o endereço que aparecer. As
   funções de `api/` só funcionam na Vercel.
3. Antes de enviar: `npm run build`. Se quebrar, a Vercel também quebra, e o
   site no ar fica na versão anterior.
4. Mexeu em `api/inscrever.js`: `node test/testar-inscrever-local.mjs`. O
   teste não envia nada ao Notion.
5. Envie: commit com uma frase que diga o que mudou e `git push` (no VS Code:
   Commit e depois Sync Changes).

## Publicação

- **Branch de produção:** `main-cristianocre`. Cada envio nele é publicado
  pela Vercel em cerca de 1 minuto, em https://www.cristianocre.com
  (`cristianocre.com` sem www redireciona para lá).
- Outro branch gera uma prévia na Vercel, sem mexer no site no ar.
- A Vercel roda `npm run build` e publica a pasta `dist/` (ver
  `vercel.json`). Os endereços não têm `.html` nem barra no fim.
- Voltar uma versão: Vercel → projeto → Deployments → a versão anterior →
  Promote. O último estado do site antes do Astro está na tag `html-antigo`.
- Domínio e variáveis: Vercel → projeto → Settings.

## Variáveis de ambiente (Vercel)

Lista e explicação de cada uma em `.env.example`. Variável nova só vale para
publicações feitas depois de criada: depois de adicionar, use Redeploy.

| Variável | Para quê |
|---|---|
| `NOTION_TOKEN` | Integração interna do Notion que grava os leads |
| `NOTION_DATABASE_ID` | Base "Leads: Materiais (Site)" |
| `META_CAPI_TOKEN` | API de Conversões da Meta |
| `META_PIXEL_ID`, `META_TEST_EVENT_CODE`, `META_API_VERSION` | Opcionais |

Diagnóstico rápido: `https://www.cristianocre.com/api/inscrever` mostra se
o Notion está configurado, e `/api/capi`, se a Meta está.

## Pendências

- Trocar os links das iscas por versões só de leitura ou cópia (hoje são
  links de edição), em `public/materiais.html`, atributo `data-redirect`.
- Conferir YouTube e LinkedIn reais no rodapé (`src/components/Rodape.astro`
  e as páginas de `public/`).
- Trocar as fotos genéricas dos avatares do hero (`public/index.html`).
- Encurtar título e descrição de 8 páginas que passam do que o Google
  mostra: os 6 episódios do podcast, `google-merchant-center-para-ecommerce`,
  `forum-ecommerce-brasil-tendencias` e `carrinho-abandonado-ecommerce`.
- Levar para o Astro as páginas que ainda estão em `public/` (home, LPs,
  materiais, cases), para o topo e o rodapé virem de um lugar só.
