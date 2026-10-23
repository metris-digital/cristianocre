// Páginas do site que não são post nem episódio, para o sitemap. Página fixa
// nova entra aqui. lastmod é a data da última mudança de verdade no conteúdo:
// não atualize sem mudar a página (o Google ignora lastmod que muda sempre).
// /insights e /podcast ficam de fora: a data delas sai do post mais novo.

export const PAGINAS_FIXAS: { url: string; lastmod?: string; changefreq?: string; priority?: string }[] = [
  { url: "/", lastmod: "2026-07-25" },
  { url: "/diagnostico", lastmod: "2026-07-25" },
  { url: "/black", lastmod: "2026-09-10", changefreq: "daily", priority: "0.9" },
  { url: "/materiais", lastmod: "2026-07-28" },
  { url: "/checklist-de-ecommerce", lastmod: "2026-08-02", changefreq: "monthly", priority: "0.8" },
  { url: "/calendario-de-ecommerce-2026", lastmod: "2026-08-02", changefreq: "monthly", priority: "0.8" },
  { url: "/como-montar-um-ecommerce", lastmod: "2026-08-02", changefreq: "monthly", priority: "0.8" },
  { url: "/mentoria", lastmod: "2026-08-01" },
  { url: "/termos", lastmod: "2026-07-25" },
  { url: "/privacidade", lastmod: "2026-10-23" },
  { url: "/cases", lastmod: "2026-08-01" },
  { url: "/case-malacara", lastmod: "2026-08-01" },
  { url: "/case-vinhos-collection", lastmod: "2026-08-01" },
  { url: "/treinamentos", lastmod: "2026-08-01" },
  { url: "/treinamentos-in-company", lastmod: "2026-08-01" },
  { url: "/cursos-online", lastmod: "2026-08-01" },
  { url: "/curso-marketing-para-ecommerce", lastmod: "2026-08-01" },
];
