// llms.txt: o texto curado de src/data/llms.txt, mais os posts e episódios
// que ainda não aparecem nele. Post novo entra sozinho no fim da seção de
// secaoLlms (ou em "Outros artigos", antes de "Contato e canais"). Para
// mudar o resumo ou a posição de um post, escreva a linha dele no arquivo.
import fs from 'node:fs';
import { publicados, titulo } from '../lib/posts';
import { SITE, textoPuro } from '../lib/site';

const PADRAO = 'Outros artigos';
const ANTES_DE = '## Contato e canais';

export async function GET() {
  let texto = fs.readFileSync('src/data/llms.txt', 'utf8');
  const faltando = (await publicados()).filter((p) => !texto.includes(`](${SITE}/${p.id})`));

  const porSecao = new Map<string, string[]>();
  for (const p of faltando) {
    const secao = p.data.secaoLlms && texto.includes(`\n## ${p.data.secaoLlms}\n`) ? p.data.secaoLlms : PADRAO;
    const linha = `- [${titulo(p)}](${SITE}/${p.id}): ${textoPuro(p.data.cardTexto ?? p.data.description)}`;
    porSecao.set(secao, [...(porSecao.get(secao) ?? []), linha]);
  }

  for (const [secao, linhas] of porSecao) {
    const bloco = linhas.join('\n') + '\n';
    const cabecalho = `\n## ${secao}\n`;
    const ini = texto.indexOf(cabecalho);
    if (ini === -1) {
      const pos = texto.indexOf(ANTES_DE);
      const novo = `## ${secao}\n\n${bloco}\n`;
      texto = pos === -1 ? `${texto.trimEnd()}\n\n${novo}` : texto.slice(0, pos) + novo + texto.slice(pos);
    } else {
      // Fim da seção: começo da próxima, ou fim do arquivo.
      const prox = texto.indexOf('\n## ', ini + cabecalho.length);
      const fim = prox === -1 ? texto.length : prox;
      const corpo = texto.slice(0, fim).trimEnd();
      texto = `${corpo}\n${bloco}` + texto.slice(fim);
    }
  }
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
