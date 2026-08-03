export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido.",
    });
  }

  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({
      error: "O prompt não foi enviado.",
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY não encontrada na Vercel.");

    return res.status(500).json({
      error: "A chave da API não está configurada na Vercel.",
    });
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
        max_tokens: 4000,
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
      console.error("Erro retornado pela Anthropic:", {
        status: response.status,
        resposta: data,
      });

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          `A API retornou o erro ${response.status}.`,
      });
    }

    const text =
      data?.content
        ?.map((item) => item.text || "")
        .join("\n")
        .trim() || "";

    if (!text) {
      console.error("A Anthropic respondeu sem conteúdo:", data);

      return res.status(500).json({
        error: "A inteligência artificial respondeu sem conteúdo.",
      });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Erro interno em /api/gerar:", error);

    return res.status(500).json({
      error: error?.message || "Erro interno do servidor.",
    });
  }
}
