export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  DEFAULT_OG_IMAGE?: string; // opsiyonel
  APP_DOWNLOAD_URL?: string; // opsiyonel (landing / store)
}

function esc(s: any) {
  const str = String(s ?? "");
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pickFirst(objOrArr: any) {
  if (Array.isArray(objOrArr)) return objOrArr[0] ?? null;
  return objOrArr ?? null;
}

function buildHtml(data: {
  locale: string;
  title: string;
  description: string;
  image: string;
  priceText: string;
  locationText: string;
  canonicalUrl: string;
  appUrl: string;
}) {
  const title = esc(data.title);
  const description = esc(data.description);
  const image = esc(data.image);
  const priceText = esc(data.priceText);
  const locationText = esc(data.locationText);
  const canonicalUrl = esc(data.canonicalUrl);
  const appUrl = esc(data.appUrl);

  return `<!DOCTYPE html>
<html lang="${esc(data.locale)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="robots" content="index,follow" />

  <!-- Basic SEO -->
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- OpenGraph -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" /
