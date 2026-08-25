import type { APIRoute } from "astro";
import { SITE } from "../features/articles/config/site";

export const GET: APIRoute = () =>
  new Response(["User-agent: *", "Allow: /", `Sitemap: ${SITE.url}/sitemap-index.xml`, ""].join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
