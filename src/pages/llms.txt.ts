import type { APIRoute } from "astro";
import { createLlmsIndex } from "../features/articles/lib/discovery";

export const GET: APIRoute = async () =>
  new Response(await createLlmsIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
