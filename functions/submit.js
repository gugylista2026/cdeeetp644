export async function onRequestPost(context) {
  const { request, env } = context;

  const form = await request.json();
  const { cancion, token, hora } = form;

  if (!token) {
    return new Response(JSON.stringify({ error: "Falta token" }), { status: 400 });
  }

  const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

  const result = await fetch(verifyUrl, {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token
    })
  });

  const outcome = await result.json();

  if (!outcome.success) {
    return new Response(JSON.stringify({ error: "Captcha inválido" }), { status: 403 });
  }

  await fetch(env.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `@everyone - 🎵 Nuevo pedido: ${cancion}\n🕒 Hora: ${hora}`
    })
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
