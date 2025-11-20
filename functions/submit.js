// Habilita GET para probar desde el navegador
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
  const { contenido, token, hora, tipo } = form;

  if (!token) {
    return new Response(JSON.stringify({ error: "Falta token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!tipo) {
    return new Response(JSON.stringify({ error: "Falta tipo de mensaje" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!contenido || !hora) {
    return new Response(JSON.stringify({ error: "Faltan datos (contenido u hora)" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Verificación Turnstile
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

  // ---- EMBEDS PARA DISCORD ----
  let webhookUrl = null;
  let payload = null;

  // 🎵 PEDIDOS DE MÚSICA
  if (tipo === "musica") {
    webhookUrl = env.M_WEBHOOK_URL;

    payload = {
      content: "@everyone",
      username: "Pedidos de Música",
      avatar_url: "https://emoji.discadia.com/emojis/3a4f5e65-d9c4-4f5d-bd31-ac221251e5a2.PNG",
      embeds: [
        {
          title: "🎶 Nuevo pedido de música",
          description: "Un estudiante ha enviado un nuevo pedido:",
          color: 0x8A2BE2,
          fields: [
            { name: "🎧 Canción solicitada", value: `\`${contenido}\`` },
            { name: "🕒 Hora", value: hora }
          ],
          footer: { text: "Centro de Estudiantes — Música" },
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  // 📬 BUZÓN ANÓNIMO
  else if (tipo === "buzon") {
    webhookUrl = env.B_WEBHOOK_URL;

    payload = {
      content: "@everyone",
      username: "Buzón Anónimo",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/561/561127.png",
      embeds: [
        {
          title: "📬 Nuevo mensaje en el buzón",
          description: "Se recibió un mensaje anónimo:",
          color: 0x00BFFF,
          fields: [
            { name: "✉️ Mensaje", value: `\`${contenido}\`` },
            { name: "🕒 Hora", value: hora }
          ],
          footer: { text: "Centro de Estudiantes — Buzón" },
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  else {
    return new Response(JSON.stringify({ error: "Tipo inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Enviar al webhook correspondiente
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
