export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const { prompt, estilo } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt não enviado." });

  const geminiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6K_R0hvnP3DR819LO0XGU5e-eRIZu-4AZ2fwHvufZ3CKg";

  const estiloTexto = {
    "didatica": "Educational illustration, clean lines, white background, no text",
    "infantil": "Colorful children cartoon illustration, cheerful, white background",
    "realista": "Realistic educational photo, high quality, clean background",
    "colorir": "Black line drawing for coloring, no fill, simple lines, white background",
    "esquema": "Educational diagram, arrows, labels, white background",
    "automatico": "Clear educational illustration, white background",
  };

  const promptFinal = `${estiloTexto[estilo] || estiloTexto["automatico"]}. ${prompt}`;
  const erros = [];

  // Tentativa 1: generateContent
  try {
    const r1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${promptFinal}` }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    );
    const d1 = await r1.json();
    if (r1.ok) {
      const parts = d1?.candidates?.[0]?.content?.parts || [];
      const img = parts.find((p) => p.inlineData);
      if (img) {
        return res.status(200).json({ image: img.inlineData.data, mimeType: img.inlineData.mimeType || "image/png" });
      }
      erros.push("T1: sem imagem na resposta");
    } else {
      erros.push("T1: " + (d1?.error?.message || r1.status));
    }
  } catch (e) {
    erros.push("T1: " + e.message);
  }

  // Tentativa 2: Interactions API
  try {
    const r2 = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          model: "gemini-3.1-flash-image",
          input: [{ type: "text", text: promptFinal }],
        }),
      }
    );
    const d2 = await r2.json();
    if (r2.ok) {
      if (d2.output_image) {
        return res.status(200).json({ image: d2.output_image.data, mimeType: d2.output_image.mime_type || "image/png" });
      }
      if (d2.steps) {
        for (const step of d2.steps) {
          if (step.content) {
            for (const block of step.content) {
              if (block.type === "image" && block.data) {
                return res.status(200).json({ image: block.data, mimeType: block.mime_type || "image/png" });
              }
            }
          }
        }
      }
      erros.push("T2: sem imagem");
    } else {
      erros.push("T2: " + (d2?.error?.message || r2.status));
    }
  } catch (e) {
    erros.push("T2: " + e.message);
  }

  return res.status(500).json({ error: "Falhou: " + erros.join(" | ") });
}
