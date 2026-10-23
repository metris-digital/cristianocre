# Instruções para o Claude neste repositório

Site cristianocre.com. Estrutura, publicação e variáveis: [README.md](README.md).

## Antes de tudo

- **Repositório público.** Nunca versione nota interna, origem de conteúdo
  (reuniões, treinamentos), dado de cliente ou segredo. Nem em comentário
  HTML. Notas editoriais ficam em `~/Desktop/CRISTIANOCRE/NOTAS-EDITORIAIS-ARTIGOS.md`.
- **Linha editorial e voz** (público, território, regra de dados, escada de
  valor) estão em `~/Desktop/CRISTIANOCRE/CLAUDE.md`. Leia antes de escrever
  ou revisar texto.
- **Skills** (`frontend-ux-ui`, `copy-landing-page`, `conteudo`,
  `copy-anuncios`): a fonte é `~/Desktop/CRISTIANOCRE/.claude/skills/`. Neste
  Mac, `.claude/skills` aqui é um atalho para lá, fora do Git.
- **O Metris CMS também envia commits** para o branch de produção. Rode
  `git pull` antes de mexer.

## Regras do código

1. **Astro, mesma estrutura do metris.digital.** Posts e episódios são
   markdown em `src/content/`; o resto das páginas é HTML puro em `public/`,
   servido como está. Página nova que não seja post vai em `public/` (ou
   em `src/pages/`, se usar o topo e o rodapé dos componentes) e entra em
   `src/data/paginas-fixas.ts` para o sitemap.
2. **Post novo é só o `.md`.** A lista do `/insights`, a do `/podcast`, o
   sitemap e o llms.txt se atualizam no build. Não edite à mão o que é
   gerado.
3. **Campo novo de post** entra em `src/content.config.ts` (o build valida) e
   em `cms.config.json` (o CMS mostra), com os mesmos limites. Campo técnico
   que ninguém edita (como `ldExtra`) fica só no `content.config.ts`: o CMS
   preserva no arquivo o que não conhece.
4. **Os arquivos de `src/content/` precisam sobreviver ao CMS.** Abrir e
   salvar no CMS sem mexer devolve o arquivo idêntico. Escreva o front matter
   no mesmo formato dos posts existentes: texto entre aspas duplas, data sem
   aspas.
5. **`public/app.js` e `public/styles.css` valem para todas as páginas.**
   Mudou, confira mais de uma página: um post, a lista e uma página de
   `public/`.
6. **Endereços nunca mudam.** Sem `.html` e sem barra no fim. Renomear um
   `.md` muda o endereço do post e exige redirecionamento 301 no
   `vercel.json`.
7. **Pixel da Meta `942431053282816`** e GA4 `G-BDN80J4GWP` ficam em
   `src/lib/site.ts` e escritos nas páginas de `public/`. O Pixel precisa
   bater com `CC_PIXEL` no `app.js`.
8. **Nenhum dado inventado.** Sem origem, `[inserir dado real]` (o CMS não
   publica com esse marcador).
9. **Nunca gere lead de teste** no formulário publicado: cada envio vira
   linha no Notion e evento na Meta. Teste a lógica com
   `node test/testar-inscrever-local.mjs`.
10. **`npm run build` passa antes de enviar.** As funções de `api/` são
    CommonJS: o `package.json` não pode ganhar `"type": "module"`.

## Consentimento (LGPD), igual ao metris.digital

- O `<head>` de toda página (no `Base.astro` e nas páginas de `public/`)
  começa com o consentimento negado (Consent Mode v2 do Google e
  `fbq('consent','revoke')`), **antes** do `gtag('config')` e do
  `fbq('init')`. Página nova em `public/` precisa do mesmo trecho.
- O aviso vem do `app.js`. A escolha fica em `localStorage`
  (`cc-consentimento`). O link "Preferências de cookies" do rodapé (classe
  `js-lgpd-abrir`) reabre o aviso.
- **Sem aceite, nada vai para a Meta, nem pelo servidor:** `/api/inscrever` e
  `/api/capi` só chamam a API de Conversões com `consentiu: true`. O lead vai
  para o Notion do mesmo jeito.
- Ferramenta nova de análise ou anúncio exige atualizar a seção 5
  (`#cookies`) de `public/privacidade.html`.
- Nas páginas de material (formulário `.matform`), o `app.js` cria o CTA fixo
  do celular. Ele só aparece depois da resposta ao aviso de cookies.

## Diagnóstico do Pixel da Meta

- Navegador automatizado (Puppeteer, Chrome sem tela) não dispara o Pixel.
  Para testar, use um Chrome comum ou troque a identificação do navegador.

- O painel "Eventos de teste" da Meta pode mostrar a URL errada. Confira o
  campo `dl` no DevTools (Network → `facebook.com/tr`), não o painel.
- A configuração automática do pixel gera eventos próprios (`eid` com
  prefixo `ob3_plugin-set_`, `SubscribedButtonClick`) e hasheia o telefone
  sem o 55. O `identificar()` do `app.js` corrige o telefone.
- `POST /api/inscrever` devolve `capi: "enviado"` quando a Meta aceita.

## Ferramentas neste Mac

- Node 24 instalado (`/usr/local/bin/node`): `npm run dev`, `npm run build`,
  os testes de `test/` e `node --check arquivo.js` para conferir sintaxe.
- Não há gerador de WebP. Imagem de post: JPG com
  `sips -Z 1200 -s format jpeg -s formatOptions 55`. Sem o `.webp` ao lado,
  o site usa o JPG.
