import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { AUTHOR, SITE } from "../config/site";
import { buildArticleMarkdown, getArticleUrl, getPublishedArticles } from "./articles";

export async function createRssFeed(context: APIContext) {
  const articles = await getPublishedArticles({ includeDrafts: false });

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      link: getArticleUrl(article),
      categories: article.data.tags,
      author: AUTHOR.name,
    })),
    customData: "<language>en-us</language>",
  });
}

export async function createLlmsIndex(): Promise<string> {
  const articles = await getPublishedArticles({ includeDrafts: false });
  const links = articles
    .map((article) => `- [${article.data.title}](${SITE.url}${getArticleUrl(article)}): ${article.data.description}`)
    .join("\n");

  return [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "## Articles",
    "",
    links || "No published articles yet.",
    "",
    "## Feeds and machine-readable content",
    "",
    `- [RSS feed](${SITE.url}/rss.xml)` ,
    `- [Sitemap](${SITE.url}/sitemap-index.xml)`,
    `- [Expanded article corpus](${SITE.url}/llms-full.txt)`,
    "",
  ].join("\n");
}

export async function createLlmsFull(): Promise<string> {
  const articles = await getPublishedArticles({ includeDrafts: false });
  const content = articles
    .map((article) => `${buildArticleMarkdown(article)}\nSource: ${SITE.url}${getArticleUrl(article)}\n`)
    .join("\n---\n\n");

  return [`# ${SITE.name}: full article corpus`, "", content || "No published articles yet.", ""].join("\n");
}
