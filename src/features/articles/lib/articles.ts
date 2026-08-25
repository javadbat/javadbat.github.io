import { getCollection, type CollectionEntry } from "astro:content";

export type ArticleEntry = CollectionEntry<"articles">;

export async function getPublishedArticles(options: { includeDrafts?: boolean } = {}): Promise<ArticleEntry[]> {
  const includeDrafts = options.includeDrafts ?? import.meta.env.DEV;
  const articles = await getCollection("articles", ({ data }) => includeDrafts || !data.draft);

  return articles.sort((left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime());
}

export function getArticleUrl(article: ArticleEntry): string {
  return `/articles/${article.id}/`;
}

export function getReadingTime(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

export function formatArticleDate(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getAllTags(articles: ArticleEntry[]): string[] {
  return [...new Set(articles.flatMap(({ data }) => data.tags))].sort((left, right) => left.localeCompare(right));
}

export function cleanMdxForAgents(body: string): string {
  return body
    .replace(/^import\s+.+?;\s*$/gm, "")
    .replace(
      /<CodeBlock\s+filename="([^"]+)"\s+language="([^"]+)"\s+code=\{`([\s\S]*?)`\}\s*\/>/g,
      (_match, filename: string, language: string, code: string) =>
        `\n\`\`\`${language} title="${filename}"\n${code.trim()}\n\`\`\`\n`,
    )
    .replace(
      /<Callout(?:\s+title="([^"]*)")?[^>]*>\s*([\s\S]*?)\s*<\/Callout>/g,
      (_match, title: string | undefined, content: string) =>
        `> **${title ?? "Note"}:** ${content.trim().replace(/\n\s*/g, "\n> ")}`,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildArticleMarkdown(article: ArticleEntry): string {
  const { data } = article;
  const metadata = [
    `# ${data.title}`,
    "",
    data.description,
    "",
    `Published: ${data.publishedAt.toISOString()}`,
    data.updatedAt ? `Updated: ${data.updatedAt.toISOString()}` : null,
    data.tags.length ? `Tags: ${data.tags.join(", ")}` : null,
    "",
  ].filter((line): line is string => line !== null);

  return `${metadata.join("\n")}\n${cleanMdxForAgents(article.body ?? "")}\n`;
}
