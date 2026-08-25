import type { APIRoute } from "astro";
import { createRssFeed } from "../features/articles/lib/discovery";

export const GET: APIRoute = (context) => createRssFeed(context);
