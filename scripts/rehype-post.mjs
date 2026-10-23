// Ajustes no HTML do texto dos posts, para sair igual ao que o CSS espera:
// o primeiro parágrafo é o "lead" (texto de abertura maior) e toda tabela
// fica dentro de <div class="tbl-wrap">, que rola de lado no celular.
export default function rehypePost() {
  return (arvore) => {
    const primeiro = arvore.children.find((n) => n.type === 'element');
    if (primeiro?.tagName === 'p') {
      primeiro.properties.className = ['lead', ...(primeiro.properties.className ?? [])];
    }
    embrulharTabelas(arvore);
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
