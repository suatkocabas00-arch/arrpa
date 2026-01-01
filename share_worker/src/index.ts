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
  <meta property="og:image" content="${image}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />

  <style>
    body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#0f0f0f;color:#fff;}
    .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
    .card{width:100%;max-width:520px;background:#141414;border:1px solid rgba(255,255,255,.06);
      border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);}
    .img{width:100%;aspect-ratio:16/9;background:#0b0b0b;display:flex;align-items:center;justify-content:center;}
    .img img{width:100%;height:100%;object-fit:cover;}
    .content{padding:18px 18px 20px;}
    h1{font-size:20px;margin:0 0 8px;line-height:1.25;}
    .meta{opacity:.8;font-size:14px;margin:0 0 12px;}
    .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;}
    a.btn{flex:1;min-width:180px;display:inline-block;text-align:center;text-decoration:none;
      padding:12px 14px;border-radius:10px;font-weight:700;}
    .primary{background:#ff6a00;color:#fff;}
    .ghost{background:#1f1f1f;color:#fff;border:1px solid rgba(255,255,255,.08);}
    .brand{opacity:.6;font-size:12px;margin-top:14px;text-align:center;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="img">
        <img src="${image}" alt="${title}" />
      </div>
      <div class="content">
        <h1>${title}</h1>
        <p class="meta">${priceText}${locationText ? " • " + locationText : ""}</p>
        <p class="meta">${description}</p>

        <div class="row">
          <a class="btn primary" href="${appUrl}">Arrpa’da Aç</a>
          <a class="btn ghost" href="https://arrpa.app">Arrpa Web</a>
        </div>

        <div class="brand">Arrpa • Listing Share</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function callRpc(env: Env, rpc: string, body: any) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/${rpc}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { ok: r.ok, status: r.status, json, text };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // sadece /l/:id
    if (!path.startsWith("/l/")) {
      return new Response("Not Found", { status: 404 });
    }

    const idStr = path.split("/")[2] ?? "";
    const id = Number(idStr);
    if (!Number.isFinite(id) || id <= 0) {
      return new Response("Invalid listing id", { status: 400 });
    }

    const locale = (url.searchParams.get("lang") || "en").toLowerCase();
    const canonicalUrl = `${url.origin}/l/${id}`;
    const appUrl = env.APP_DOWNLOAD_URL || "https://arrpa.app";

    // RPC adı: rpcpubliclistingdetail (senin mevcut)
    const rpcRes = await callRpc(env, "rpcpubliclistingdetail", {
      p_id: id,
      p_locale: locale,
    });

    if (!rpcRes.ok) {
      return new Response(`Listing not found (${rpcRes.status})`, { status: 404 });
    }

    const row = pickFirst(rpcRes.json);
    if (!row) {
      return new Response("Listing not found", { status: 404 });
    }

    // title alanı bazen yok olabilir: category_name vs fallback
    const title =
      row.title ||
      row.category_name ||
      "Arrpa Listing";

    // description kısa olsun (OG için çok uzamasın)
    const rawDesc = row.description || row.state_note || "";
    const description =
      rawDesc.length > 220 ? rawDesc.slice(0, 217) + "..." : rawDesc || "Listing on Arrpa";

    // image fallback
    const image =
      row.main_avatar ||
      row.image ||
      env.DEFAULT_OG_IMAGE ||
      "https://arrpa.app/default-og.png"; // bunu istersen kaldır / değiştir

    const priceText = row.price
      ? `${row.price} ${row.currency || ""}`.trim()
      : "";

    const locationText = [row.country, row.city, row.town].filter(Boolean).join(" / ");

    const html = buildHtml({
      locale,
      title,
      description,
      image,
      priceText,
      locationText,
      canonicalUrl,
      appUrl,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        // çok kısa cache: preview hızlansın ama güncellemeler gecikmesin
        "Cache-Control": "public, max-age=60",
      },
    });
  },
};
