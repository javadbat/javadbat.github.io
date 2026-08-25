import type { APIRoute, GetStaticPaths } from "astro";
import { buildArticleMarkdown, getPublishedArticles, type ArticleEntry } from "../../features/articles/lib/articles";

export const getStaticPaths = (async () => {
  const articles = await getPublishedArticles({ includeDrafts: false });
  return articles.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const entry = props.entry as ArticleEntry;
  return new Response(buildArticleMarkdown(entry), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
