export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const { prompt, estilo } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt não enviado." });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: "GEMINI_API_KEY não configurada." });

  const estiloTexto = {
    "didatica": "Educational illustration, clean lines, white background, no text in image",
    "infantil": "Colorful children cartoon illustration, cheerful, white background",
    "realista": "Realistic educational photo, high quality, clean background",
    "colorir": "Black line drawing for coloring, no fill, simple lines, white background",
    "esquema": "Educational diagram, arrows, labels, white background",
    "automatico": "Clear educational illustration, white background",
  };

  const promptFinal = `${estiloTexto[estilo] || estiloTexto["automatico"]}. ${prompt}. Suitable for elementary school activities.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image-001:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${promptFinal}` }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Gemini: " + (data?.error?.message || JSON.stringify(data).substring(0, 300)),
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const img = parts.find((p) => p.inlineData);

    if (img) {
      return res.status(200).json({
        image: img.inlineData.data,
        mimeType: img.inlineData.mimeType || "image/png",
      });
    }

    return res.status(500).json({ error: "Gemini respondeu sem imagem." });
  } catch (error) {
    return res.status(500).json({ error: "Erro: " + error.message });
  }
}
