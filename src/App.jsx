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
  const tiposSelecionados = config.tipos
    .map((t) => TIPOS_QUESTAO.find((q) => q.id === t)?.label)
    .join(", ");

  return `Você é um especialista em educação do Colégio Gênesis Life, em Osasco-SP. Gere uma atividade escolar adaptada com as seguintes especificações:

SÉRIE: ${config.serie}
SEGMENTO: ${config.segmento}
DISCIPLINA: ${config.disciplina}
TEMA: ${config.tema}
TIPOS DE QUESTÃO OBRIGATÓRIOS: ${tiposSelecionados}
${config.gabarito ? "INCLUIR GABARITO AO FINAL PARA O PROFESSOR" : "NÃO incluir gabarito"}

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
  const [tipos, setTipos] = useState(TIPOS_QUESTAO.map((t) => t.id));
  const [gabarito, setGabarito] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");

  const toggleTipo = (id) => {
    setTipos((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const gerarAtividade = async () => {
    if (tipos.length === 0) {
      setError("Selecione pelo menos um tipo de questão.");
      return;
    }
    setError("");
    setLoading(true);
    setResultado("");
    try {
      const prompt = buildPrompt({ segmento, serie, disciplina, tema, tipos, gabarito });

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
    setTipos(TIPOS_QUESTAO.map((t) => t.id));
    setGabarito(true);
    setResultado("");
    setError("");
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

      const cabecalhoWord = activityHeaderHtml().replace(
        'src="/logo-genesis.png"',
        `src="${logoDataUrl}"`
      );

      const documentoWord = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Gênesis Atividades">
  <title>Atividade - ${disciplina} - ${tema}</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.55; color: #222; }
    h1 { font-size: 18pt; border-bottom: 2px solid #97128b; padding-bottom: 6px; }
    h2 { font-size: 15pt; margin-top: 18px; color: #111; text-transform: uppercase; background: #fff200; display: inline-block; padding: 2px 5px; }
    h3 { font-size: 13pt; margin-top: 16px; }
    hr { border: 0; border-top: 1px solid #aaa; margin: 18px 0; }
    p { margin: 0 0 10px; }
    ${activityStyles}
  </style>
</head>
<body>
  ${cabecalhoWord}
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
            Gerador de atividades adaptadas com IA
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
              {TIPOS_QUESTAO.map((t) => (
                <button key={t.id} onClick={() => toggleTipo(t.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                    background: tipos.includes(t.id) ? "#f7e9f6" : "white",
                    border: tipos.includes(t.id) ? "2px solid #97128b" : "2px solid #eadfec",
                    fontSize: 14, color: "#2d1838", textAlign: "left", transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ flex: 1, fontWeight: 500 }}>{t.label}</span>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: tipos.includes(t.id) ? "none" : "2px solid #cfbfd4",
                    background: tipos.includes(t.id) ? "#97128b" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 14, fontWeight: 700,
                  }}>
                    {tipos.includes(t.id) ? "✓" : ""}
                  </span>
                </button>
              ))}
            </div>
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
