import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Um post do blog (/insights). O nome do arquivo é o endereço: o post
 * src/content/insights/carrinho-abandonado-ecommerce.md sai em
 * /carrinho-abandonado-ecommerce, na raiz, como sempre foi.
 *
 * O build quebra se faltar campo obrigatório, de propósito: é mais barato
 * falhar no envio do que descobrir no Google.
 */
const link = z.object({ titulo: z.string(), url: z.string() });

const post = z.object({
    // Título da página (H1). O trecho entre asteriscos ganha o destaque em
    // degradê: "Consultoria de e-commerce: *quando vale a pena*".
    title: z.string(),
    // Título da aba e do Google, e a descrição que aparece embaixo dele. O
    // Google corta acima de uns 70 e 160 caracteres. Os tetos aqui são largos
    // para não quebrar o build com texto antigo; o aviso fica com o CMS.
    seoTitle: z.string().max(120),
    description: z.string().min(80).max(260),
    selo: z.string(),
    sub: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    leitura: z.number().int().positive(),

    // Imagem de compartilhamento, em public/img (JPG de 1200 × 675).
    imagem: z.string(),
    // Mostra a imagem no topo do post. Precisa da versão .webp ao lado.
    capa: z.boolean().default(false),
    // Texto alternativo da capa. Em branco, usa o título.
    capaAlt: z.string().optional(),
    legenda: z.string().optional(),
    // Capa em vídeo no lugar da imagem: o ID do vídeo no YouTube (o trecho
    // depois de watch?v=). A miniatura vem do próprio YouTube.
    video: z.string().optional(),
    videoRotulo: z.string().default('Assistir ao episódio'),
    // Dados do vídeo para o Google (VideoObject), quando o post tem vídeo na
    // capa ou no texto. Data é a de publicação no YouTube.
    videoDados: z
      .object({
        id: z.string(),
        nome: z.string(),
        descricao: z.string(),
        data: z.coerce.date().optional(),
        canal: z.string().default('Metris'),
      })
      .optional(),

    // Página pilar do assunto: entra na trilha de navegação e nos dados
    // estruturados (isPartOf). O endereço pode ter um trecho: /podcast#serie.
    pilar: link.optional(),
    tema: z.string().optional(),
    rich: z.boolean().default(false),
    // Dados estruturados extras do artigo (evento, empresa, pessoas citadas),
    // em JSON. Mesclados por cima dos que o molde gera. Campo técnico.
    ldExtra: z.record(z.any()).optional(),

    // Mostra "Publicado em" na linha do autor.
    mostrarPublicado: z.boolean().default(false),
    // Posts da primeira leva, sem o espaçamento ajustado no topo e no FAQ.
    // Não use em post novo.
    estiloAntigo: z.boolean().default(false),

    // Título e texto acima do título do FAQ, em HTML (raro).
    faqIntro: z.string().optional(),
    faqSelo: z.string().nullable().default('Perguntas frequentes'),
    faqTitulo: z.string().default('Perguntas frequentes'),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).min(1),

    relacionadosTitulo: z.string().default('Continue lendo'),
    relacionados: z.array(link).default([]),

    // Vitrine de guias do mesmo assunto, no fim de uma página pilar.
    guia: z
      .object({
        selo: z.string(),
        titulo: z.string(),
        texto: z.string(),
        itens: z.array(z.object({ chip: z.string(), titulo: z.string(), texto: z.string(), url: z.string() })),
      })
      .optional(),

    // Chamada no fim do post. Os textos em branco usam o padrão.
    chamada: z
      .object({
        selo: z.string().default('Diagnóstico gratuito'),
        titulo: z.string().default('Pare de fazer marketing no improviso.'),
        texto: z
          .string()
          .default('Receba uma análise gratuita do seu marketing e descubra onde estão as maiores oportunidades de crescimento.'),
        numero: z.string().default('1h'),
        numeroLegenda: z.string().default('análise com o Cristiano'),
        botao: z.string().default('Quero meu diagnóstico'),
        link: z.string().default('/diagnostico'),
        nota: z.string().default('É gratuito e sem compromisso.'),
      })
      .default({}),

    // Card na lista do /insights (e do /podcast). Categoria é o filtro;
    // selo, título e texto em branco usam os do post.
    categoria: z.enum(['ecommerce', 'trafego', 'mentoria', 'servicos', 'podcast']),
    cardSelo: z.string().optional(),
    cardTitulo: z.string().optional(),
    cardTexto: z.string().optional(),

    // Seção do llms.txt em que o post entra se ainda não estiver lá. O
    // nome precisa ser igual ao título da seção (sem o ##).
    secaoLlms: z.string().optional(),

    feedYoutube: z.boolean().default(false),
    draft: z.boolean().default(false),
});

const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '*.md' }),
  schema: post,
});

// Episódios do podcast: mesma página e mesmos campos de um post.
const podcast = defineCollection({
  loader: glob({ base: './src/content/podcast', pattern: '*.md' }),
  schema: post,
});

export const collections = { insights, podcast };
