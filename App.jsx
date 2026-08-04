import { useState } from "react";

const SERIES_OPTIONS = {
  "Educação Infantil": ["Infantil I", "Infantil II", "Infantil III"],
  "Fundamental I": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental II": ["6º ano", "7º ano", "8º ano", "9º ano"],
};

const DISCIPLINAS = {
  "Educação Infantil": ["Linguagem", "Matemática", "Natureza e Sociedade", "Artes", "Movimento"],
  "Fundamental I": ["Português", "Matemática", "Ciências", "História", "Geografia", "Artes", "Ed. Física", "Inglês"],
  "Fundamental II": ["Português", "Matemática", "Ciências", "História", "Geografia", "Artes", "Ed. Física", "Inglês"],
};

const TIPOS_QUESTAO = [
  { id: "alternativas", label: "Alternativas (A, B, C)", icon: "🔘" },
  { id: "complete", label: "Complete a frase", icon: "✏️" },
  { id: "relacione", label: "Relacione as colunas", icon: "🔗" },
  { id: "texto", label: "Procure no texto", icon: "📖" },
  { id: "desenhe", label: "Desenhe", icon: "🎨" },
  { id: "criatividade", label: "Use sua criatividade", icon: "💡" },
  { id: "outro", label: "Outro (descreva abaixo)", icon: "📝" },
];

const TEMAS_SUGERIDOS = {
  "Português": ["Tipos de frases", "Substantivos", "Sinais de pontuação", "Interpretação de texto", "Ordem alfabética", "Sílabas"],
  "Matemática": ["Adição e subtração", "Tabuada", "Formas geométricas", "Medidas de tempo", "Números pares e ímpares", "Frações"],
  "Ciências": ["Corpo humano", "Animais vertebrados", "Ciclo da água", "Sistema solar", "Plantas", "Alimentação saudável"],
  "História": ["Povos indígenas", "Independência do Brasil", "Linha do tempo", "Cultura africana", "Festas populares"],
  "Geografia": ["Meios de transporte", "Bairro e cidade", "Regiões do Brasil", "Relevo", "Clima"],
  "Artes": ["Cores primárias", "Releitura de obra", "Arte indígena", "Música e ritmo"],
  "Linguagem": ["Vogais", "Nome próprio", "Rimas", "Histórias", "Parlendas"],
  "Natureza e Sociedade": ["Animais", "Estações do ano", "Família", "Higiene"],
  "Movimento": ["Brincadeiras", "Coordenação motora", "Jogos cooperativos"],
  "Ed. Física": ["Esportes coletivos", "Jogos populares", "Saúde e movimento"],
  "Inglês": ["Greetings", "Colors and numbers", "Animals", "Family members", "Food"],
};

function buildPrompt(config) {
  const tiposSelecionados = Object.entries(config.tipos)
    .filter(([, qtd]) => qtd > 0 && TIPOS_QUESTAO.find((q) => q.id !== "outro"))
    .map(([id, qtd]) => {
      const tipo = TIPOS_QUESTAO.find((q) => q.id === id);
      if (!tipo || id === "outro") return null;
      const area = config.tiposArea[id];
      const areaTexto = area === "pouco" ? " (pouco espaço para resposta)" :
        area === "medio" ? " (espaço médio para resposta)" :
        area === "muito" ? " (muito espaço para resposta)" :
        area === "linhas" ? " (incluir linhas pontilhadas para o aluno escrever)" :
        area === "quadro" ? " (incluir quadro/moldura grande para o aluno desenhar)" : "";
      return `${tipo.label}: ${qtd} questão(ões)${areaTexto}`;
    })
    .filter(Boolean)
    .join("\n- ");

  return `Você é um especialista em educação do Colégio Gênesis Life, em Osasco-SP. Gere uma atividade escolar adaptada com as seguintes especificações:

SÉRIE: ${config.serie}
SEGMENTO: ${config.segmento}
DISCIPLINA: ${config.disciplina}
TEMA: ${config.tema}
TIPOS DE QUESTÃO E QUANTIDADES (siga EXATAMENTE essas quantidades):
- ${tiposSelecionados}
${config.outroTexto && config.tipos.outro > 0 ? `- Tipo personalizado pelo professor: "${config.outroTexto}" — ${config.tipos.outro} questão(ões)` : ""}
${config.gabarito ? "INCLUIR GABARITO AO FINAL PARA O PROFESSOR" : "NÃO incluir gabarito"}
${config.progressao ? `
PROGRESSÃO DE DIFICULDADE: Organize as questões em progressão de dificuldade:
- ${config.niveis.facil}% fáceis (para o aluno ganhar confiança)
- ${config.niveis.medio}% intermediárias
- ${config.niveis.dificil}% desafiadoras (para estimular o raciocínio)
Sinalize o nível de cada questão com: (Fácil), (Intermediária) ou (Desafio) ao lado do número.` : ""}

REGRAS IMPORTANTES:
1. Enunciados objetivos, claros e curtos, adequados à faixa etária.
2. Alternativas sempre com EXATAMENTE 3 opções: A, B e C.
3. Adapte a linguagem e complexidade à série informada.
4. Para "Desenhe" e "Use sua criatividade", crie comandos estimulantes e específicos ao tema.
5. Para "Procure no texto", crie um pequeno texto adequado à série e faça perguntas de localização.
6. Para "Relacione as colunas", use exatamente duas colunas claras.
7. Numere todas as questões sequencialmente.
8. Use linguagem acolhedora e motivadora.

FORMATO DE SAÍDA (use Markdown simples):

- NÃO escreva o nome do colégio.
- NÃO crie cabeçalho, campos de nome, número, professora, turma ou data.
- Comece diretamente pelo conteúdo da atividade.
- Apresente primeiro um título curto do tema usando: ## ${config.tema}
- Depois, quando necessário, apresente uma explicação curta e adequada à série.
- Em seguida, coloque as questões numeradas.

${config.gabarito ? "---\n## 📋 Gabarito do Professor\n(respostas aqui)" : ""}

Gere a atividade agora. Seja criativo e pedagógico.`;
}

export default function App() {
  const [step, setStep] = useState(1);
  const [segmento, setSegmento] = useState("");
  const [serie, setSerie] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [tema, setTema] = useState("");
  const [tipos, setTipos] = useState(
    Object.fromEntries(TIPOS_QUESTAO.map((t) => [t.id, t.id === "outro" ? 0 : 2]))
  );
  const [gabarito, setGabarito] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");
  const [outroTexto, setOutroTexto] = useState("");
  const [tiposArea, setTiposArea] = useState({});
  const [progressao, setProgressao] = useState(false);
  const [niveis, setNiveis] = useState({ facil: 30, medio: 50, dificil: 20 });

  const toggleTipo = (id) => {
    setTipos((prev) => ({ ...prev, [id]: prev[id] > 0 ? 0 : 2 }));
  };

  const setQtd = (id, val) => {
    const n = Math.max(0, Math.min(10, Number(val) || 0));
    setTipos((prev) => ({ ...prev, [id]: n }));
  };

  const tiposAtivos = () => Object.entries(tipos).filter(([, q]) => q > 0);

  const gerarAtividade = async () => {
    if (tiposAtivos().length === 0) {
      setError("Selecione pelo menos um tipo de questão.");
      return;
    }
    setError("");
    setLoading(true);
    setResultado("");
    try {
      const prompt = buildPrompt({ segmento, serie, disciplina, tema, tipos, gabarito, outroTexto, tiposArea, progressao, niveis });

      // Chama a serverless function /api/gerar (a chave fica segura no servidor)
      const response = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar");
      }

      setResultado(data.text);
      setStep(4);
    } catch (e) {
      setError("Erro na geração. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetar = () => {
    setStep(1);
    setSegmento("");
    setSerie("");
    setDisciplina("");
    setTema("");
    setTipos(Object.fromEntries(TIPOS_QUESTAO.map((t) => [t.id, t.id === "outro" ? 0 : 2])));
    setGabarito(true);
    setResultado("");
    setError("");
    setOutroTexto("");
    setTiposArea({});
    setProgressao(false);
    setNiveis({ facil: 30, medio: 50, dificil: 20 });
  };

  const sugestoes = TEMAS_SUGERIDOS[disciplina] || [];

  const renderMarkdown = (md) => {
    let html = md
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    return `<p>${html}</p>`;
  };

  const activityHeaderHtml = () => `
    <div class="activity-header">
      <div class="header-logo-box">
        <img src="/logo-genesis.png" alt="Logo do Colégio Gênesis Life" />
      </div>
      <div class="header-main">
        <div class="school-name">COLÉGIO GÊNESIS LIFE</div>
        <div class="activity-name">ATIVIDADE ADAPTADA DE ${disciplina.toUpperCase()}</div>
      </div>
      <div class="student-row">
        <div><strong>Nome:</strong> <span class="line"></span></div>
        <div class="number-field"><strong>Nº</strong> <span class="short-line"></span></div>
      </div>
      <div class="teacher-row">
        <div><strong>Profª:</strong> <span class="medium-line"></span></div>
        <div><strong>Data:</strong> ____/____/________</div>
        <div><strong>Turma:</strong> <span class="short-line"></span></div>
      </div>
    </div>`;


  const baixarWord = async () => {
    try {
      const logoResponse = await fetch("/logo-genesis.png");
      if (!logoResponse.ok) throw new Error("Logo não encontrado");

      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(logoBlob);
      });

      const documentoWord = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #222; }
    h2 { font-size: 14pt; margin-top: 20px; margin-bottom: 8px; }
    h3 { font-size: 12pt; margin-top: 16px; }
    hr { border: 0; border-top: 1px solid #999; margin: 14px 0; }
    p { margin: 0 0 8px; }
  </style>
</head>
<body>

<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:0;">
  <tr>
    <td rowspan="2" width="90" style="border:1px solid #555; text-align:center; vertical-align:middle; padding:6px;">
      <img src="${logoDataUrl}" width="55" alt="Logo" /><br/>
      <span style="font-size:6pt; font-weight:bold; color:#555; letter-spacing:0.5px;">COLÉGIO<br/>GÊNESIS<br/>LIFE</span>
    </td>
    <td style="border:1px solid #555; text-align:center; vertical-align:middle; padding:6px; font-size:14pt; font-weight:bold;">
      Colégio Genesis Life
    </td>
  </tr>
  <tr>
    <td style="border:1px solid #555; text-align:center; vertical-align:middle; padding:6px; font-size:11pt;">
      Atividade Adaptada de ${disciplina} - ${tema}
    </td>
  </tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:0;">
  <tr>
    <td width="82%" style="border:1px solid #555; padding:6px 10px; font-size:11pt;">Nome:</td>
    <td style="border:1px solid #555; padding:6px 10px; font-size:11pt;">Nº</td>
  </tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:16px;">
  <tr>
    <td width="30%" style="border:1px solid #555; padding:6px 10px; font-size:11pt;">Prof.</td>
    <td width="25%" style="border:1px solid #555; padding:6px 10px; font-size:11pt; text-align:center;">____/____/ 2026</td>
    <td width="22%" style="border:1px solid #555; padding:6px 10px; font-size:11pt;">Turma:</td>
    <td width="23%" style="border:1px solid #555; padding:6px 10px; font-size:11pt;">Nota:</td>
  </tr>
</table>

${renderMarkdown(resultado)}

</body>
</html>`;

      const blob = new Blob(["\ufeff", documentoWord], {
        type: "application/msword;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const nomeSeguro = `${disciplina}-${tema}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      link.href = url;
      link.download = `atividade-${nomeSeguro || "genesis"}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (erro) {
      setError("Não foi possível gerar o arquivo do Word. Tente novamente.");
    }
  };
  const activityStyles = `
    .activity-header{display:grid;grid-template-columns:180px 1fr;border:2px solid #777;border-radius:12px;overflow:hidden;margin-bottom:24px;background:#fff}
    .header-logo-box{grid-row:1 / span 3;display:flex;align-items:center;justify-content:center;padding:10px;border-right:2px solid #777}
    .header-logo-box img{width:150px;max-height:78px;object-fit:contain}
    .header-main{display:grid;grid-template-rows:1fr 1fr}
    .school-name,.activity-name{display:flex;align-items:center;justify-content:center;font-weight:800;text-align:center;padding:8px;border-bottom:2px solid #777}
    .school-name{font-size:17px}.activity-name{font-size:18px}
    .student-row,.teacher-row{display:grid;align-items:center;font-size:15px}
    .student-row{grid-template-columns:1fr 150px;border-bottom:2px solid #777}
    .teacher-row{grid-template-columns:1.1fr 1fr .9fr}
    .student-row>div,.teacher-row>div{padding:7px 10px}
    .student-row>div+div,.teacher-row>div+div{border-left:2px solid #777}
    .line,.medium-line,.short-line{display:inline-block;border-bottom:1px solid #222;vertical-align:middle}
    .line{width:75%}.medium-line{width:55%}.short-line{width:55px}
    .number-field{text-align:center}
    @media(max-width:640px){.activity-header{grid-template-columns:120px 1fr}.header-logo-box img{width:100px}.school-name{font-size:14px}.activity-name{font-size:15px}.student-row{grid-template-columns:1fr 90px}.teacher-row{grid-template-columns:1fr}.teacher-row>div+div{border-left:0;border-top:2px solid #777}}
    @media print{.activity-header{break-inside:avoid;page-break-inside:avoid}.header-logo-box img{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  `;

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      background: "#f7f4fa",
      minHeight: "100vh",
      padding: "0",
    }}>
      <div style={{
        background: "linear-gradient(135deg, #4b0d63 0%, #7b126f 52%, #9b147f 100%)",
        padding: "20px 24px",
        color: "white",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 3px 16px rgba(75,13,99,0.28)",
      }}>
        <div style={{
          width: 58, height: 58, borderRadius: 14,
          background: "rgba(255,255,255,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)", padding: 5, flexShrink: 0,
        }}>
          <img src="/logo-genesis.png" alt="Logo do Colégio Gênesis Life" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>
            Gênesis <span style={{ color: "#ffd43b" }}>Atividades</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.88, marginTop: 2 }}>
            Gerador de atividades by Thiago
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right", lineHeight: 1.05, display: "none" }} className="school-brand">
          <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.9 }}>COLÉGIO</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>GÊNESIS</div>
          <div style={{ fontSize: 10, color: "#ffd43b", letterSpacing: 5 }}>LIFE</div>
        </div>
        <style>{`@media (min-width: 640px) { .school-brand { display: block !important; } }`}</style>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 40px" }}>
        {step < 4 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s <= step ? "#97128b" : "#e2d7e6",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d1838", margin: "0 0 4px" }}>
              Série e Disciplina
            </h2>
            <p style={{ fontSize: 13, color: "#765f7e", margin: "0 0 20px" }}>
              Selecione o segmento, a série e a disciplina da atividade.
            </p>
            <label style={labelStyle}>Segmento</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {Object.keys(SERIES_OPTIONS).map((seg) => (
                <button key={seg} onClick={() => { setSegmento(seg); setSerie(""); setDisciplina(""); }}
                  style={{ ...chipStyle, background: segmento === seg ? "#97128b" : "white", color: segmento === seg ? "white" : "#3c2445", border: segmento === seg ? "2px solid #97128b" : "2px solid #dfd2e3" }}>
                  {seg}
                </button>
              ))}
            </div>
            {segmento && (
              <>
                <label style={labelStyle}>Série</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {SERIES_OPTIONS[segmento].map((s) => (
                    <button key={s} onClick={() => setSerie(s)}
                      style={{ ...chipStyle, background: serie === s ? "#97128b" : "white", color: serie === s ? "white" : "#3c2445", border: serie === s ? "2px solid #97128b" : "2px solid #dfd2e3" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            {serie && (
              <>
                <label style={labelStyle}>Disciplina</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {DISCIPLINAS[segmento].map((d) => (
                    <button key={d} onClick={() => setDisciplina(d)}
                      style={{ ...chipStyle, background: disciplina === d ? "#97128b" : "white", color: disciplina === d ? "white" : "#3c2445", border: disciplina === d ? "2px solid #97128b" : "2px solid #dfd2e3" }}>
                      {d}
                    </button>
                  ))}
                </div>
              </>
            )}
            {disciplina && (
              <button onClick={() => setStep(2)} style={nextBtnStyle}>Próximo →</button>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d1838", margin: "0 0 4px" }}>
              Tema da Atividade
            </h2>
            <p style={{ fontSize: 13, color: "#765f7e", margin: "0 0 20px" }}>
              Digite um tema ou escolha uma sugestão abaixo.
            </p>
            <input type="text" placeholder="Ex: Animais do cerrado, Tabuada do 7..." value={tema} onChange={(e) => setTema(e.target.value)} style={inputStyle} />
            {sugestoes.length > 0 && (
              <>
                <label style={{ ...labelStyle, marginTop: 16 }}>Sugestões para {disciplina}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {sugestoes.map((s) => (
                    <button key={s} onClick={() => setTema(s)}
                      style={{ ...chipStyle, fontSize: 12, background: tema === s ? "#f7e9f6" : "white", border: tema === s ? "2px solid #97128b" : "2px solid #eadfec", color: "#3c2445" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(1)} style={backBtnStyle}>← Voltar</button>
              {tema.trim() && (
                <button onClick={() => setStep(3)} style={{ ...nextBtnStyle, marginTop: 0, flex: 1 }}>Próximo →</button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#2d1838", margin: "0 0 4px" }}>
              Tipos de Questão
            </h2>
            <p style={{ fontSize: 13, color: "#765f7e", margin: "0 0 20px" }}>
              Escolha quais tipos incluir na atividade.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TIPOS_QUESTAO.map((t) => {
                const ativo = tipos[t.id] > 0;
                const areaAtual = tiposArea[t.id] || "";
                const AREAS = [
                  { id: "pouco", label: "Pouco espaço" },
                  { id: "medio", label: "Médio" },
                  { id: "muito", label: "Muito espaço" },
                  { id: "linhas", label: "Linhas" },
                  { id: "quadro", label: "Quadro p/ desenho" },
                ];
                return (
                  <div key={t.id}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: ativo ? "10px 10px 0 0" : 10,
                      background: ativo ? "#f7e9f6" : "white",
                      border: ativo ? "2px solid #97128b" : "2px solid #eadfec",
                      borderBottom: ativo ? "1px solid #e0c4de" : undefined,
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => toggleTipo(t.id)}>{t.icon}</span>
                      <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: "#2d1838", cursor: "pointer" }} onClick={() => toggleTipo(t.id)}>{t.label}</span>
                      {ativo ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button onClick={() => setQtd(t.id, tipos[t.id] - 1)} style={{
                            width: 28, height: 28, borderRadius: 6, border: "1px solid #cfbfd4",
                            background: "white", color: "#97128b", fontSize: 16, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>−</button>
                          <span style={{
                            width: 28, textAlign: "center", fontSize: 15, fontWeight: 700, color: "#97128b",
                          }}>{tipos[t.id]}</span>
                          <button onClick={() => setQtd(t.id, tipos[t.id] + 1)} style={{
                            width: 28, height: 28, borderRadius: 6, border: "1px solid #cfbfd4",
                            background: "white", color: "#97128b", fontSize: 16, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>+</button>
                        </div>
                      ) : (
                        <span onClick={() => toggleTipo(t.id)} style={{
                          width: 22, height: 22, borderRadius: 6, border: "2px solid #cfbfd4",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} />
                      )}
                    </div>
                    {ativo && (
                      <div style={{
                        display: "flex", gap: 5, flexWrap: "wrap", padding: "8px 12px",
                        background: "#fdf5fd", borderRadius: "0 0 10px 10px",
                        border: "2px solid #97128b", borderTop: "none",
                      }}>
                        <span style={{ fontSize: 11, color: "#765f7e", width: "100%", marginBottom: 2 }}>Área de resposta:</span>
                        {AREAS.map((a) => (
                          <button key={a.id} onClick={() => setTiposArea((prev) => ({
                            ...prev, [t.id]: prev[t.id] === a.id ? "" : a.id
                          }))} style={{
                            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                            cursor: "pointer", transition: "all 0.15s",
                            background: areaAtual === a.id ? "#97128b" : "white",
                            color: areaAtual === a.id ? "white" : "#3c2445",
                            border: areaAtual === a.id ? "1px solid #97128b" : "1px solid #dfd2e3",
                          }}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {tipos.outro > 0 && (
              <div style={{ marginTop: 12 }}>
                <input
                  type="text"
                  placeholder="Descreva o tipo de questão que deseja. Ex: Caça-palavras, Verdadeiro ou Falso, Cruzadinha..."
                  value={outroTexto}
                  onChange={(e) => setOutroTexto(e.target.value)}
                  style={{
                    ...inputStyle,
                    border: "2px solid #97128b",
                    background: "#fdf5fd",
                    fontSize: 13,
                  }}
                />
              </div>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 20, padding: "12px 14px",
              background: "white", borderRadius: 10, border: "2px solid #eadfec",
            }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: "#2d1838" }}>
                Incluir gabarito para o professor?
              </span>
              <button onClick={() => setGabarito(!gabarito)} style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: gabarito ? "#97128b" : "#d8cadd",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: "white",
                  position: "absolute", top: 3, left: gabarito ? 25 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 10, padding: "12px 14px",
              background: "white", borderRadius: 10, border: "2px solid #eadfec",
            }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: "#2d1838" }}>
                Progressão de dificuldade?
              </span>
              <button onClick={() => setProgressao(!progressao)} style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: progressao ? "#97128b" : "#d8cadd",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: "white",
                  position: "absolute", top: 3, left: progressao ? 25 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>
            {progressao && (
              <div style={{
                display: "flex", gap: 8, padding: "10px 14px", marginTop: 4,
                background: "#fdf5fd", borderRadius: 10, border: "1px solid #eadfec",
                flexWrap: "wrap", alignItems: "center",
              }}>
                {[
                  { key: "facil", label: "Fáceis", color: "#2e7d32" },
                  { key: "medio", label: "Intermediárias", color: "#e65100" },
                  { key: "dificil", label: "Desafiadoras", color: "#c62828" },
                ].map((n) => (
                  <div key={n.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number"
                      min="0" max="100"
                      value={niveis[n.key]}
                      onChange={(e) => setNiveis((prev) => ({ ...prev, [n.key]: Number(e.target.value) || 0 }))}
                      style={{
                        width: 42, padding: "4px 4px", borderRadius: 6,
                        border: "1px solid #cfbfd4", textAlign: "center",
                        fontSize: 13, fontWeight: 700, color: n.color, background: "white",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "#765f7e" }}>% {n.label}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <div style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={backBtnStyle}>← Voltar</button>
              <button onClick={gerarAtividade} disabled={loading}
                style={{ ...nextBtnStyle, marginTop: 0, flex: 1, opacity: loading ? 0.7 : 1 }}>
                {loading ? "⏳ Gerando atividade..." : "✨ Gerar Atividade"}
              </button>
            </div>
            {loading && (
              <div style={{ textAlign: "center", marginTop: 20, padding: 20, background: "white", borderRadius: 12, border: "1px solid #eadfec" }}>
                <div style={{ fontSize: 32, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🤖</div>
                <div style={{ fontSize: 13, color: "#765f7e" }}>
                  Criando atividade de <strong>{disciplina}</strong> sobre <strong>{tema}</strong> para o <strong>{serie}</strong>...
                </div>
                <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
              </div>
            )}
          </div>
        )}

        {step === 4 && resultado && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ background: "#f7e9f6", color: "#97128b", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{serie}</span>
              <span style={{ background: "#f0e8f8", color: "#5b2580", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{disciplina}</span>
              <span style={{ background: "#fff7d6", color: "#7a5700", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{tema}</span>
            </div>
            <div style={{
              background: "white", padding: "28px 24px", borderRadius: 12,
              border: "1px solid #eadfec", fontSize: 14, lineHeight: 1.7,
              color: "#2d1838", whiteSpace: "pre-wrap", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <style>{activityStyles}</style>
              <div
                dangerouslySetInnerHTML={{ __html: `${activityHeaderHtml()}${renderMarkdown(resultado)}` }}
                style={{ overflowX: "auto" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <button onClick={resetar} style={backBtnStyle}>← Nova Atividade</button>
              <button onClick={baixarWord} style={{ ...nextBtnStyle, marginTop: 0, flex: 1 }}>
                📄 Baixar no Word
              </button>
            </div>
            <button onClick={() => { setStep(3); setResultado(""); }}
              style={{ ...backBtnStyle, width: "100%", marginTop: 10, textAlign: "center", justifyContent: "center" }}>
              🔄 Gerar outra versão (mesmo tema)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#7b2b78", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" };
const chipStyle = { padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s", boxShadow: "0 1px 2px rgba(75,13,99,0.04)" };
const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #dfd2e3", fontSize: 14, color: "#2d1838", outline: "none", boxSizing: "border-box", background: "white" };
const nextBtnStyle = { display: "block", width: "100%", marginTop: 24, padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ffd43b, #ffc928)", color: "#35133e", fontSize: 15, fontWeight: 800, cursor: "pointer", transition: "opacity 0.2s", boxShadow: "0 5px 14px rgba(255,201,40,0.24)" };
const backBtnStyle = { display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 10, border: "2px solid #dfd2e3", background: "white", color: "#7b2b78", fontSize: 14, fontWeight: 600, cursor: "pointer" };
