import type { APIRoute } from "astro";
import { createLlmsFull } from "../features/articles/lib/discovery";

export const GET: APIRoute = async () =>
  new Response(await createLlmsFull(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
