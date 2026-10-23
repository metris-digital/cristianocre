// Posts e episódios publicados, do mais novo para o mais antigo, com o que a
// lista do /insights, o /podcast, o sitemap e o llms.txt precisam.
import { getCollection, type CollectionEntry } from 'astro:content';
import { semDestaque } from './site';

export type Post = CollectionEntry<'insights'> | CollectionEntry<'podcast'>;

export async function publicados(colecao?: 'insights' | 'podcast'): Promise<Post[]> {
  const ok = ({ data }: { data: { draft: boolean } }) => !data.draft;
  const todos: Post[] = [
    ...(colecao !== 'podcast' ? await getCollection('insights', ok) : []),
    ...(colecao !== 'insights' ? await getCollection('podcast', ok) : []),
  ];
  return todos.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id));
}

export function titulo(post: Post): string {
  return semDestaque(post.data.title);
}

/** Data da última mudança: atualização, ou publicação. */
export function modificado(post: Post): Date {
  return post.data.updatedDate ?? post.data.pubDate;
}
