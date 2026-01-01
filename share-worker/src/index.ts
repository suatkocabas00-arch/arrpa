export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const htmlTemplate = (data: any) => `
<!DOCTYPE html>
<html lang="${data.locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- OpenGraph Tags -->
  <meta property="og:title" content="${data.title}" />
  <meta property="og:description" content="${data.description}" />
  <meta property="og:image" content="${data.image}" />
  <meta property="og:type" content="website" />

  <title>${data.title}</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      background:#111;
      color:#fff;
      padding:20px;
    }
    .card {
      background:#1a1a1a;
      padding:15px;
      border-radius:12px;
      max-width:420px;
      margin:auto;
      box-shadow:0 2px 10px rgba(0,0,0,0.5);
    }
    .price {
      font-size:22px;
      font-weight:bold;
      margin:10px 0;
      color:#4CAF50;
    }
    .btn {
      display:block;
      background:#FF6A00;
      color:#fff;
      padding:12px;
      text-align:center;
      border-radius:8px;
      text-decoration:none;
      font-weight:bold;
      margin-top:12px;
    }
  </style>
</head>
<body>

<div class="card">
  <h2>${data.title}</h2>
  <p>${data.description}</p>
  <div class="price">${data.price} ${data.currency}</div>
  <img src="${data.image}" style="width:100%;border-radius:8px" />
  <a class="btn" href="#">Arrpa’da Aç</a>
</div>

</body>
</html>
`;

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Share route yakalama
    if (path.startsWith("/l/")) {
      const id = path.split("/")[2];

      // Supabase RPC çağırma
      const supabaseReq = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/rpcpubliclistingdetail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ p_id: Number(id), p_locale: "en" })
      });

      if (!supabaseReq.ok) {
        return new Response("İlan bulunamadı veya hata oluştu", { status: 404 });
      }

      const res = await supabaseReq.json();

      const listingData = {
        locale: res.locale || "en",
        title: res.title || "Arrpa İlan",
        description: res.description || "Açıklama yok",
        price: res.price || "0",
        currency: res.currency || "TRY",
        image: res.main_avatar || "", // OG preview için ana görsel
      };

      // HTML döndürme
      return new Response(htmlTemplate(listingData), {
        headers: { "Content-Type": "text/html" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
