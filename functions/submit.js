// Habilita GET para probar la ruta desde el navegador
export async function onRequestGet() {
  return new Response(
    JSON.stringify({ error: "Usá POST para enviar datos" }),
    {
      headers: { "Content-Type": "application/json" },
      status: 405
    }
  );
}

// Maneja el envío real del formulario
export async function onRequestPost(context) {
  const { request, env } = context;

  const form = await request.json();
  const { cancion, token, hora } = form;

  if (!token) {
    return new Response(JSON.stringify({ error: "Falta token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
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
    return new Response(JSON.stringify({ error: "Captcha inválido" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Enviar a Discord
  await fetch(env.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `@everyone - 🎵 Nuevo pedido: ${cancion}\n🕒 Hora: ${hora}`
    })
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
