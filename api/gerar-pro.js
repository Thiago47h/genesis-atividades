export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "O prompt não foi enviado." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Chave da API do Claude não configurada." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || `Erro ${response.status} na API.`,
      });
    }

    const text = data?.content?.map((item) => item.text || "").join("\n").trim() || "";

    if (!text) {
      return res.status(500).json({ error: "A IA respondeu sem conteúdo." });
    }

    // Tentar extrair JSON da resposta
    let jsonResult;
    try {
      // Remover possíveis backticks de markdown
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      jsonResult = JSON.parse(cleanText);
    } catch (e) {
      // Se não for JSON válido, retornar como texto
      return res.status(200).json({ text, json: null });
    }

    return res.status(200).json({ text, json: jsonResult });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Erro interno do servidor." });
  }
}
