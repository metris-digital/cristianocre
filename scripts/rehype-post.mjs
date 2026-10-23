// Ajustes no HTML do texto dos posts, para sair igual ao que o CSS espera:
// o primeiro parágrafo é o "lead" (texto de abertura maior) e toda tabela
// fica dentro de <div class="tbl-wrap">, que rola de lado no celular. Link
// para fora do site abre em outra aba. Citação de um parágrafo só fica sem
// o <p> dentro, como sempre foi no site.
export default function rehypePost() {
  return (arvore) => {
    const primeiro = arvore.children.find((n) => n.type === 'element');
    if (primeiro?.tagName === 'p') {
      primeiro.properties.className = ['lead', ...(primeiro.properties.className ?? [])];
    }
    embrulharTabelas(arvore);
    linksExternos(arvore);
    citacoes(arvore);
  };
}

function embrulharTabelas(no) {
  if (!no.children) return;
  no.children = no.children.map((filho) => {
    if (filho.type === 'element' && filho.tagName === 'table') {
      return { type: 'element', tagName: 'div', properties: { className: ['tbl-wrap'] }, children: [filho] };
    }
    if (!(filho.type === 'element' && filho.properties?.className?.includes?.('tbl-wrap'))) embrulharTabelas(filho);
    return filho;
  });
}

function linksExternos(no) {
  if (no.type === 'element' && no.tagName === 'a') {
    const href = String(no.properties.href ?? '');
    if (/^https?:\/\//.test(href) && !href.startsWith('https://www.cristianocre.com')) {
      no.properties.target ??= '_blank';
      no.properties.rel ??= ['noopener'];
    }
  }
  no.children?.forEach(linksExternos);
}


function citacoes(no) {
  if (no.type === 'element' && no.tagName === 'blockquote') {
    const elementos = no.children.filter((n) => !(n.type === 'text' && !n.value.trim()));
    if (elementos.length === 1 && elementos[0].tagName === 'p') no.children = elementos[0].children;
  }
  no.children?.forEach(citacoes);
}
