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

const insights = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '*.md' }),
  schema: z.object({
    // Título da página (H1). O trecho entre asteriscos ganha o destaque em
    // degradê: "Consultoria de e-commerce: *quando vale a pena*".
    title: z.string(),
    // Título da aba e do Google. Acima de 70 caracteres o Google corta.
    seoTitle: z.string().max(70),
    description: z.string().min(80).max(170),
    selo: z.string(),
    sub: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    leitura: z.number().int().positive(),

    // Imagem de compartilhamento, em public/img (JPG de 1200 × 675).
    imagem: z.string(),
    // Mostra a imagem no topo do post. Precisa da versão .webp ao lado.
    capa: z.boolean().default(false),
    legenda: z.string().optional(),

    // Página pilar do assunto: entra na trilha de navegação e nos dados
    // estruturados (isPartOf).
    pilar: link.optional(),
    tema: z.string().optional(),
    rich: z.boolean().default(false),

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

    feedYoutube: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { insights };
