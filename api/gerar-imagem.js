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
    "didatica": "Ilustração didática educacional, traços limpos, fundo branco, sem texto na imagem",
    "infantil": "Ilustração infantil colorida, estilo cartoon educacional, alegre, fundo branco",
    "realista": "Foto realista educacional, alta qualidade, fundo limpo",
    "colorir": "Desenho em linhas pretas para colorir, sem preenchimento, traços simples, fundo branco",
    "esquema": "Esquema educacional técnico, diagrama didático, setas, labels em português, fundo branco",
    "automatico": "Ilustração educacional clara e didática, fundo branco",
  };

  const promptFinal = `${estiloTexto[estilo] || estiloTexto["automatico"]}. ${prompt}. Todos os textos, labels e legendas devem estar em PORTUGUÊS do Brasil. Adequado para atividades escolares do ensino fundamental.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Gere uma imagem: ${promptFinal}` }] }],
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
