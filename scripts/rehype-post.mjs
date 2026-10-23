// Ajustes no HTML do texto dos posts, para sair igual ao que o CSS espera:
// o primeiro parágrafo é o "lead" (texto de abertura maior) e toda tabela
// fica dentro de <div class="tbl-wrap">, que rola de lado no celular. Link
// para fora do site abre em outra aba. Citação de um parágrafo só fica sem
// o <p> dentro, como sempre foi no site. Parágrafo só com um link do YouTube
// vira o vídeo com capa e play (o app.js troca pelo player no clique): é o
// que o editor do Metris CMS insere, [Título](https://www.youtube.com/watch?v=ID).
export default function rehypePost() {
  return (arvore) => {
    const primeiro = arvore.children.find((n) => n.type === 'element');
    if (primeiro?.tagName === 'p') {
      primeiro.properties.className = ['lead', ...(primeiro.properties.className ?? [])];
    }
    embrulharTabelas(arvore);
    linksExternos(arvore);
    citacoes(arvore);
    videos(arvore);
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

const ID_YOUTUBE = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
const textoDe = (no) => (no.type === 'text' ? no.value : (no.children ?? []).map(textoDe).join(''));

function videos(no) {
  if (!no.children) return;
  no.children = no.children.map((filho) => {
    if (filho.type !== 'element') return filho;
    const elementos = filho.children?.filter((n) => !(n.type === 'text' && !n.value.trim())) ?? [];
    const [link] = elementos;
    const id = filho.tagName === 'p' && elementos.length === 1 && link.tagName === 'a'
      ? String(link.properties.href ?? '').match(ID_YOUTUBE)?.[1]
      : null;
    if (!id) {
      videos(filho);
      return filho;
    }
    return {
      type: 'element',
      tagName: 'button',
      properties: {
        className: ['vthumb'],
        dataYt: id,
        style: `background-image:url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')`,
        ariaLabel: `Assistir: ${textoDe(link).trim() || 'vídeo'}`,
      },
      children: [{ type: 'element', tagName: 'span', properties: { className: ['play'] }, children: [] }],
    };
  });
}
