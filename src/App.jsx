import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

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
  const tiposComOrdem = Object.entries(config.tipos)
    .filter(([, qtd]) => qtd > 0)
    .map(([id, qtd]) => {
      const tipo = TIPOS_QUESTAO.find((q) => q.id === id);
      if (!tipo || id === "outro") return null;
      const area = config.tiposArea[id];
      const areaTexto = area === "pouco" ? " (pouco espaço para resposta)" :
        area === "medio" ? " (espaço médio para resposta)" :
        area === "muito" ? " (muito espaço para resposta)" :
        area === "linhas" ? " (incluir linhas pontilhadas para o aluno escrever)" :
        area === "quadro" ? " (incluir quadro/moldura grande para o aluno desenhar)" : "";
      const ordem = config.tiposOrdem[id] || 99;
      return { id, label: tipo.label, qtd, areaTexto, ordem };
    })
    .filter(Boolean)
    .sort((a, b) => a.ordem - b.ordem);

  const tiposSelecionados = tiposComOrdem
    .map((t, i) => `${i + 1}º — ${t.label}: ${t.qtd} questão(ões)${t.areaTexto}`)
    .join("\n- ");

  return `Você é um especialista em educação do Colégio Gênesis Life, em Osasco-SP. Gere uma atividade escolar adaptada com as seguintes especificações:

SÉRIE: ${config.serie}
SEGMENTO: ${config.segmento}
DISCIPLINA: ${config.disciplina}
TEMA: ${config.tema}
TIPOS DE QUESTÃO, QUANTIDADES E ORDEM (siga EXATAMENTE essas quantidades e essa ordem):
- ${tiposSelecionados}
${config.outroTexto && config.tipos.outro > 0 ? `- Tipo personalizado pelo professor: "${config.outroTexto}" — ${config.tipos.outro} questão(ões)` : ""}
${config.gabarito ? "INCLUIR GABARITO AO FINAL PARA O PROFESSOR" : "NÃO incluir gabarito"}
${config.progressao ? `
PROGRESSÃO DE DIFICULDADE: Organize as questões em progressão de dificuldade:
- ${config.niveis.facil}% fáceis (para o aluno ganhar confiança)
- ${config.niveis.medio}% intermediárias
- ${config.niveis.dificil}% desafiadoras (para estimular o raciocínio)
Sinalize o nível de cada questão com: (Fácil), (Intermediária) ou (Desafio) ao lado do número.` : ""}
${config.necessidades.length > 0 ? `
NECESSIDADES ESPECIAIS DO ALUNO — adapte a atividade inteira considerando:
${config.necessidades.map(n => `- ${n}`).join("\n")}
${config.outraNecessidade ? `- ${config.outraNecessidade}` : ""}

Orientações de adaptação:
- Para dificuldade de leitura: enunciados curtos, palavras simples, evitar textos longos, priorizar questões visuais.
- Para TDAH: questões diretas, uma instrução por vez, atividade mais curta, variar tipos para manter engajamento.
- Para TEA: comandos literais e objetivos, evitar figuras de linguagem, roteiro previsível, apoio visual.
- Para deficiência intelectual: reduzir complexidade, usar imagens de apoio, repetir padrões, linguagem concreta.
- Para alfabetização em processo: letras maiúsculas quando possível, frases curtas, apoio de imagem.
- Para comandos mais curtos: uma ação por enunciado, sem frases compostas.
Aplique APENAS as orientações relevantes às necessidades informadas acima.` : ""}

REGRAS IMPORTANTES:
1. SEMPRE comece a atividade com um TEXTO BASE sobre o tema, com título "📖 Leia o texto com atenção:". Esse texto é o CORAÇÃO da atividade — TODAS as respostas de TODAS as questões devem ser encontradas nele. O aluno lê, procura e responde.
2. As questões de ALTERNATIVAS devem ter respostas que o aluno encontra no texto base.
3. As questões de COMPLETE A FRASE devem usar frases retiradas ou baseadas no texto base.
4. As questões de RELACIONE AS COLUNAS devem usar informações presentes no texto base.
5. As questões de PROCURE NO TEXTO devem pedir que o aluno localize informações no texto base.
6. NENHUMA questão pode exigir conhecimento que não esteja no texto base (exceto "Desenhe" e "Use sua criatividade", que são livres).
7. Enunciados objetivos, claros e curtos, adequados à faixa etária.
8. Alternativas sempre com EXATAMENTE 3 opções: A, B e C.
9. Adapte a linguagem e complexidade à série informada.
10. Para "Desenhe" e "Use sua criatividade", crie comandos estimulantes relacionados ao tema do texto.
11. Para "Relacione as colunas", use exatamente duas colunas claras.
12. Numere todas as questões sequencialmente.
13. Use linguagem acolhedora e motivadora.

FORMATO DE SAÍDA (use Markdown simples):

- NÃO escreva o nome do colégio.
- NÃO crie cabeçalho, campos de nome, número, professora, turma ou data.
- Comece diretamente pelo conteúdo da atividade.
- Apresente primeiro um título curto do tema usando: ## ${config.tema}
- Depois, quando necessário, apresente uma explicação curta e adequada à série.
- Em seguida, coloque as questões numeradas.

${config.gabarito ? "---\n## 📋 Gabarito do Professor\n(respostas aqui)" : ""}

Gere a atividade agora. Seja criativo e pedagógico.
${config.modoProva ? `MODO PROVA: Esta é uma PROVA, não uma atividade. Ajustes:
- Use tom formal e avaliativo (sem "vamos aprender", sem linguagem lúdica)
- Numere as questões como "Questão 1", "Questão 2"
${config.valorQuestao ? `- Cada questão vale ${config.valorQuestao} pontos — indique "(${config.valorQuestao} pontos)" ao lado de cada questão` : ""}
${config.tempoEstimado ? `- Tempo estimado: ${config.tempoEstimado} minutos` : ""}` : ""}
${config.recadoResponsavel ? `
RECADO PARA O RESPONSÁVEL: Ao final da atividade, ANTES do gabarito, inclua uma seção:
## 📩 Recado para o Responsável
Escreva um bilhete curto (3-4 linhas) explicando ao pai/mãe:
- O tema que o aluno está estudando
- O objetivo pedagógico desta atividade
- Como o responsável pode ajudar em casa
Use linguagem acolhedora e acessível.` : ""}
${config.alunoSelecionado ? `
PERFIL DO ALUNO (adapte a atividade com base nessas informações):
Nome: ${config.alunoSelecionado.nome}
Série: ${config.alunoSelecionado.serie}
${config.alunoSelecionado.necessidades && config.alunoSelecionado.necessidades.length > 0 ? `Necessidades: ${config.alunoSelecionado.necessidades.join(", ")}` : ""}
${config.alunoSelecionado.observacoes ? `Observações do professor: ${config.alunoSelecionado.observacoes}` : ""}
${config.alunoSelecionado.pei_resumo ? `PEI (Plano Educacional Individualizado):\n${config.alunoSelecionado.pei_resumo}` : ""}
Use TODAS essas informações para personalizar a atividade. Adapte linguagem, complexidade, tipos de apoio e formato às necessidades deste aluno.` : ""}
${config.letraMaiuscula ? "IMPORTANTE: Escreva TODA a atividade em LETRAS MAIÚSCULAS." : ""}
${config.negrito ? "IMPORTANTE: Escreva TODA a atividade em **negrito** — enunciados, alternativas, textos, frases para completar, tudo." : ""}`;
}

export default function App() {
  // Autenticação
  const [usuario, setUsuario] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user || null);
      setVerificandoAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fazerLogin = async () => {
    setLoginErro("");
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginSenha,
    });
    if (error) {
      setLoginErro("Email ou senha incorretos.");
    }
    setLoginLoading(false);
  };

  const fazerLogout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  // Estados do app
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
  const [tiposOrdem, setTiposOrdem] = useState({});
  const [progressao, setProgressao] = useState(false);
  const [niveis, setNiveis] = useState({ facil: 30, medio: 50, dificil: 20 });
  const [letraMaiuscula, setLetraMaiuscula] = useState(false);
  const [negrito, setNegrito] = useState(false);
  const [modoProva, setModoProva] = useState(false);
  const [valorQuestao, setValorQuestao] = useState("");
  const [tempoEstimado, setTempoEstimado] = useState("");
  const [recadoResponsavel, setRecadoResponsavel] = useState(false);
  const [geracaoLote, setGeracaoLote] = useState(false);
  const [alunosLote, setAlunosLote] = useState([]);
  const [lotePorcentagem, setLotePorcentagem] = useState(0);
  const [loteGerando, setLoteGerando] = useState(false);

  // PRO states
  const [proStep, setProStep] = useState(1);
  const [proSegmento, setProSegmento] = useState("");
  const [proSerie, setProSerie] = useState("");
  const [proDisciplina, setProDisciplina] = useState("");
  const [proTema, setProTema] = useState("");
  const [proQtdQuestoes, setProQtdQuestoes] = useState(6);
  const [proDificuldade, setProDificuldade] = useState("progressivo");
  const [proImagens, setProImagens] = useState("algumas");
  const [proEstiloImagem, setProEstiloImagem] = useState("automatico");
  const [proTipoAtividade, setProTipoAtividade] = useState("mista");
  const [proAreaResposta, setProAreaResposta] = useState("media");
  const [proGabarito, setProGabarito] = useState(true);
  const [proAlunoSelecionado, setProAlunoSelecionado] = useState(null);
  const [proNecessidades, setProNecessidades] = useState([]);
  const [proLoading, setProLoading] = useState(false);
  const [proLoadingMsg, setProLoadingMsg] = useState("");
  const [proResultado, setProResultado] = useState(null);
  const [proImgsGeradas, setProImgsGeradas] = useState({});
  const [proError, setProError] = useState("");
  const [necessidades, setNecessidades] = useState([]);
  const [outraNecessidade, setOutraNecessidade] = useState("");
  const [modoEscuro, setModoEscuro] = useState(false);
  const [pagina, setPagina] = useState("dashboard");
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Supabase - Alunos
  const [alunos, setAlunos] = useState([]);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalAtividades, setTotalAtividades] = useState(0);
  const [alunoForm, setAlunoForm] = useState({ nome: "", serie: "", turma: "", numero: "", necessidades: [], observacoes: "" });
  const [alunoEditando, setAlunoEditando] = useState(null);
  const [alunoNecessidadeOutra, setAlunoNecessidadeOutra] = useState("");
  const [alunoBusca, setAlunoBusca] = useState("");
  const [alunoMsg, setAlunoMsg] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  const NECESSIDADES_OPCOES = [
    "Dificuldade de leitura",
    "TDAH",
    "TEA",
    "Deficiência intelectual",
    "Alfabetização em processo",
    "Comandos mais curtos",
  ];

  const carregarAlunos = async () => {
    const { data } = await supabase.from("alunos").select("*").order("nome");
    if (data) {
      setAlunos(data);
      setTotalAlunos(data.length);
    }
  };

  const [atividadesSalvas, setAtividadesSalvas] = useState([]);
  const [filtroDisc, setFiltroDisc] = useState("");
  const [filtroSerie, setFiltroSerie] = useState("");
  const [filtroBuscaAtiv, setFiltroBuscaAtiv] = useState("");
  const [recadoGerado, setRecadoGerado] = useState({});
  const [recadoCarregando, setRecadoCarregando] = useState(null);

  const gerarRecadoHistorico = async (ativ) => {
    setRecadoCarregando(ativ.id);
    try {
      const prompt = `Você é um professor do Colégio Gênesis Life. Escreva um RECADO CURTO (máximo 5 linhas) para o responsável do aluno${ativ.aluno_nome ? ` ${ativ.aluno_nome}` : ""} sobre a atividade de ${ativ.disciplina} com o tema "${ativ.tema}" (${ativ.serie}).

O recado deve:
- Explicar o tema que o aluno está estudando
- Dizer o objetivo pedagógico
- Sugerir como o responsável pode ajudar em casa
- Usar linguagem acolhedora e acessível

Comece com "Prezado(a) responsável," e termine com "Atenciosamente, Equipe Pedagógica — Colégio Gênesis Life".`;

      const response = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (response.ok && data.text) {
        setRecadoGerado((prev) => ({ ...prev, [ativ.id]: data.text }));
      }
    } catch (e) {}
    setRecadoCarregando(null);
  };

  const carregarAtividades = async () => {
    const { data } = await supabase.from("atividades").select("*").order("criado_em", { ascending: false });
    if (data) {
      setAtividadesSalvas(data);
      setTotalAtividades(data.length);
    }
  };

  const salvarAluno = async () => {
    if (!alunoForm.nome.trim() || !alunoForm.serie.trim()) {
      setAlunoMsg("Preencha nome e série.");
      return;
    }
    const payload = {
      ...alunoForm,
      numero: alunoForm.numero ? Number(alunoForm.numero) : null,
    };
    if (alunoEditando) {
      await supabase.from("alunos").update(payload).eq("id", alunoEditando);
      setAlunoEditando(null);
      setAlunoMsg("✅ Aluno atualizado!");
    } else {
      await supabase.from("alunos").insert(payload);
      setAlunoMsg("✅ Aluno cadastrado!");
    }
    setAlunoForm({ nome: "", serie: "", turma: "", numero: "", necessidades: [], observacoes: "" });
    setAlunoNecessidadeOutra("");
    carregarAlunos();
    setTimeout(() => setAlunoMsg(""), 3000);
  };

  const editarAluno = (aluno) => {
    setAlunoForm({
      nome: aluno.nome,
      serie: aluno.serie,
      turma: aluno.turma || "",
      numero: aluno.numero || "",
      necessidades: aluno.necessidades || [],
      observacoes: aluno.observacoes || "",
    });
    setAlunoEditando(aluno.id);
  };

  const excluirAluno = async (id) => {
    if (confirm("Tem certeza que deseja excluir este aluno?")) {
      await supabase.from("alunos").delete().eq("id", id);
      carregarAlunos();
      setAlunoMsg("🗑️ Aluno excluído.");
      setTimeout(() => setAlunoMsg(""), 3000);
    }
  };

  const toggleAlunoNecessidade = (nec) => {
    setAlunoForm((prev) => ({
      ...prev,
      necessidades: prev.necessidades.includes(nec)
        ? prev.necessidades.filter((n) => n !== nec)
        : [...prev.necessidades, nec],
    }));
  };

  useEffect(() => {
    if (usuario) {
      carregarAlunos();
      carregarAtividades();
    }
  }, [usuario]);

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
      const prompt = buildPrompt({ segmento, serie, disciplina, tema, tipos, gabarito, outroTexto, tiposArea, tiposOrdem, progressao, niveis, necessidades, outraNecessidade, letraMaiuscula, negrito, alunoSelecionado, modoProva, valorQuestao, tempoEstimado, recadoResponsavel });

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

      // Salvar atividade no banco
      await supabase.from("atividades").insert({
        aluno_id: alunoSelecionado?.id || null,
        aluno_nome: alunoSelecionado?.nome || null,
        disciplina,
        serie,
        tema,
        tipos_questao: tipos,
        conteudo: data.text,
      });
      carregarAtividades();
    } catch (e) {
      setError("Erro na geração. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const gerarEmLote = async () => {
    if (alunosLote.length === 0) return;
    if (tiposAtivos().length === 0) {
      setError("Selecione pelo menos um tipo de questão.");
      return;
    }
    setLoteGerando(true);
    setLotePorcentagem(0);

    for (let i = 0; i < alunosLote.length; i++) {
      const aluno = alunosLote[i];
      try {
        const prompt = buildPrompt({
          segmento, serie: aluno.serie || serie, disciplina, tema, tipos, gabarito, outroTexto,
          tiposArea, tiposOrdem, progressao, niveis,
          necessidades: aluno.necessidades || [], outraNecessidade: "",
          letraMaiuscula, negrito, alunoSelecionado: aluno,
          modoProva, valorQuestao, tempoEstimado, recadoResponsavel,
        });

        const response = await fetch("/api/gerar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const data = await response.json();

        if (response.ok && data.text) {
          await supabase.from("atividades").insert({
            aluno_id: aluno.id,
            aluno_nome: aluno.nome,
            disciplina,
            serie: aluno.serie || serie,
            tema,
            tipos_questao: tipos,
            conteudo: data.text,
          });
        }
      } catch (e) {}
      setLotePorcentagem(Math.round(((i + 1) / alunosLote.length) * 100));
    }

    setLoteGerando(false);
    setGeracaoLote(false);
    setAlunosLote([]);
    carregarAtividades();
    alert(`✅ ${alunosLote.length} atividades geradas com sucesso! Confira no Histórico.`);
  };

  const toggleAlunoLote = (aluno) => {
    setAlunosLote((prev) =>
      prev.find((a) => a.id === aluno.id)
        ? prev.filter((a) => a.id !== aluno.id)
        : [...prev, aluno]
    );
  };

  // PRO - Gerar atividade com imagens
  const gerarPro = async () => {
    setProError("");
    setProLoading(true);
    setProLoadingMsg("Gerando questões com IA...");
    setProImgsGeradas({});

    const nivelImg = { "sem": 0, "poucas": 1, "algumas": 3, "muitas": 5 };
    const maxImgs = nivelImg[proImagens] || 3;

    const prompt = `Você é um especialista em educação. Gere uma atividade escolar em formato JSON.

SÉRIE: ${proAlunoSelecionado?.serie || proSerie}
DISCIPLINA: ${proDisciplina}
TEMA: ${proTema}
QUANTIDADE DE QUESTÕES: ${proQtdQuestoes}
DIFICULDADE: ${proDificuldade}
TIPO DE ATIVIDADE: ${proTipoAtividade}
ÁREA DE RESPOSTA: ${proAreaResposta}
${proGabarito ? "INCLUIR GABARITO" : "SEM GABARITO"}
MÁXIMO DE IMAGENS: ${maxImgs} (só quando realmente útil pedagogicamente)
ESTILO DAS IMAGENS: ${proEstiloImagem}
${proAlunoSelecionado ? `ALUNO: ${proAlunoSelecionado.nome}
NECESSIDADES: ${(proAlunoSelecionado.necessidades || []).join(", ")}
OBSERVAÇÕES: ${proAlunoSelecionado.observacoes || ""}` : ""}
${proNecessidades.length > 0 ? `ADAPTAÇÕES: ${proNecessidades.join(", ")}` : ""}

REGRAS:
1. Comece com um TEXTO BASE sobre o tema que contenha as respostas das questões.
2. Adapte a linguagem à série.
3. IMAGENS: Você DEVE marcar EXATAMENTE ${maxImgs} questão(ões) com "precisaImagem": true. Para cada uma, escreva um "promptImagem" detalhado EM PORTUGUÊS descrevendo a imagem a ser gerada. Inclua "com textos e labels em português" no prompt. As outras devem ter "precisaImagem": false e "promptImagem": null.
4. Respeite EXATAMENTE o número de ${maxImgs} imagens.

Responda APENAS com JSON válido, sem markdown, neste formato:
{
  "textoBase": "texto introdutório sobre o tema...",
  "questoes": [
    {
      "numero": 1,
      "tipo": "multipla_escolha",
      "enunciado": "texto da questão",
      "precisaImagem": false,
      "promptImagem": null,
      "alternativas": ["A) ...", "B) ...", "C) ..."],
      "resposta": "A"
    },
    {
      "numero": 2,
      "tipo": "complete",
      "enunciado": "Complete: O sol é uma ______",
      "precisaImagem": true,
      "promptImagem": "Ilustração didática do sistema solar mostrando o sol no centro, planetas ao redor, fundo branco, sem texto",
      "alternativas": null,
      "resposta": "estrela"
    }
  ],
  "gabarito": ${proGabarito ? '"texto do gabarito completo"' : "null"},
  "dicasProfessor": "Seção com dicas e observações para o professor sobre como aplicar esta atividade, adaptações sugeridas e pontos de atenção."
}`;

    try {
      const response = await fetch("/api/gerar-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro na API");

      let resultado;
      try {
        if (data.json) {
          resultado = data.json;
        } else {
          let text = data.text || "";
          text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          const start = text.indexOf("{");
          const end = text.lastIndexOf("}");
          if (start !== -1 && end !== -1) text = text.substring(start, end + 1);
          resultado = JSON.parse(text);
        }
      } catch (parseErr) {
        console.error("Erro parsing JSON PRO:", data.text?.substring(0, 500));
        throw new Error("A IA retornou um formato inválido. Tente gerar novamente.");
      }

      if (!resultado.questoes || !Array.isArray(resultado.questoes)) {
        throw new Error("A IA não retornou questões válidas. Tente novamente.");
      }

      setProResultado(resultado);

      // Gerar imagens
      const questoesComImagem = resultado.questoes.filter((q) => q.precisaImagem && q.promptImagem);
      const imagensColetadas = {};

      if (questoesComImagem.length > 0) {
        setProLoadingMsg(`Gerando ${questoesComImagem.length} imagem(ns)...`);

        for (const q of questoesComImagem) {
          try {
            setProLoadingMsg(`Gerando imagem da questão ${q.numero}...`);
            const imgResponse = await fetch("/api/gerar-imagem", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: q.promptImagem, estilo: proEstiloImagem }),
            });
            const imgData = await imgResponse.json();

            if (imgResponse.ok && imgData.image) {
              imagensColetadas[q.numero] = { data: imgData.image, mime: imgData.mimeType || "image/png" };
            }
          } catch (e) {}
        }
        setProImgsGeradas(imagensColetadas);
      }

      // Salvar no Supabase (com imagens)
      try {
        await supabase.from("atividades").insert({
          aluno_id: proAlunoSelecionado?.id || null,
          aluno_nome: proAlunoSelecionado?.nome || null,
          disciplina: proDisciplina,
          serie: proAlunoSelecionado?.serie || proSerie,
          tema: proTema,
          tipos_questao: { tipo: proTipoAtividade, pro: true },
          conteudo: JSON.stringify(resultado),
          imagens: imagensColetadas,
        });
        carregarAtividades();
      } catch (e) {}

      setProStep(3);
    } catch (e) {
      setProError(e.message || "Erro na geração. Tente novamente.");
    } finally {
      setProLoading(false);
      setProLoadingMsg("");
    }
  };

  const baixarWordPro = async () => {
    try {
      const logoResponse = await fetch("/logo-genesis.png");
      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(logoBlob);
      });

      const r = proResultado;
      let questoesHtml = "";

      for (const q of r.questoes) {
        const img = proImgsGeradas[q.numero];
        questoesHtml += `<h3 style="margin-top:20px; font-size:12pt;">Questão ${q.numero}</h3>`;
        if (img) {
          questoesHtml += `<p><img src="data:${img.mime};base64,${img.data}" width="300" style="border:1px solid #ddd; border-radius:4px;" /></p>`;
        }
        questoesHtml += `<p>${q.enunciado}</p>`;
        if (q.alternativas) {
          questoesHtml += q.alternativas.map((a) => `<p style="margin-left:20px;">${a}</p>`).join("");
        }
        const areaH = proAreaResposta === "pequena" ? 30 : proAreaResposta === "grande" ? 100 : 60;
        if (!q.alternativas) {
          questoesHtml += `<div style="border:1px solid #ccc; min-height:${areaH}px; margin:10px 0; border-radius:4px;"></div>`;
        }
      }

      let gabaritoHtml = "";
      let dicasHtml = "";
      if (r.dicasProfessor) {
        dicasHtml = `<hr/><h2 style="font-size:14pt; color:#1F3A3D;">💡 Dicas e Observações para o Professor</h2><p style="background:#F5F0E5; padding:10px; border-radius:4px;">${r.dicasProfessor}</p>`;
      }
      if (r.gabarito) {
        gabaritoHtml = `<hr/><h2 style="font-size:14pt; color:#c0392b;">Gabarito do Professor</h2><p>${typeof r.gabarito === "string" ? r.gabarito : r.questoes.map((q) => `${q.numero}) ${q.resposta}`).join("<br/>")}</p>`;
      }

      const doc = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><style>
@page{size:A4;margin:1.5cm}body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;color:#222}
h2{font-size:14pt;margin-top:20px}h3{font-size:12pt;margin-top:16px}hr{border:0;border-top:1px solid #999;margin:14px 0}
</style></head><body>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:0">
<tr><td rowspan="2" width="90" style="border:1px solid #555;text-align:center;vertical-align:middle;padding:6px">
<img src="${logoDataUrl}" width="55" alt="Logo"/><br/><span style="font-size:6pt;font-weight:bold;color:#555">COLÉGIO<br/>GÊNESIS<br/>LIFE</span></td>
<td style="border:1px solid #555;text-align:center;vertical-align:middle;padding:6px;font-size:14pt;font-weight:bold">Colégio Genesis Life</td></tr>
<tr><td style="border:1px solid #555;text-align:center;vertical-align:middle;padding:6px;font-size:11pt">${proDisciplina} - ${proTema}</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:0">
<tr><td width="82%" style="border:1px solid #555;padding:6px 10px;font-size:11pt">Nome:</td>
<td style="border:1px solid #555;padding:6px 10px;font-size:11pt">Nº</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
<tr><td width="30%" style="border:1px solid #555;padding:6px 10px;font-size:11pt">Prof.</td>
<td width="25%" style="border:1px solid #555;padding:6px 10px;font-size:11pt;text-align:center">____/____/ 2026</td>
<td width="22%" style="border:1px solid #555;padding:6px 10px;font-size:11pt">Turma:</td>
<td width="23%" style="border:1px solid #555;padding:6px 10px;font-size:11pt">Nota:</td></tr></table>
<h2>📖 Leia o texto com atenção:</h2>
<p>${r.textoBase}</p><hr/>
${questoesHtml}
${dicasHtml}
${gabaritoHtml}
</body></html>`;

      const blob = new Blob(["\ufeff", doc], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `atividade-pro-${proDisciplina}-${proTema}.doc`.replace(/\s+/g, "-").toLowerCase();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setProError("Erro ao gerar Word.");
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
    setTiposOrdem({});
    setProgressao(false);
    setNiveis({ facil: 30, medio: 50, dificil: 20 });
    setLetraMaiuscula(false);
    setNegrito(false);
    setModoProva(false);
    setValorQuestao("");
    setTempoEstimado("");
    setRecadoResponsavel(false);
    setGeracaoLote(false);
    setAlunosLote([]);
    setLotePorcentagem(0);
    setNecessidades([]);
    setOutraNecessidade("");
    setAlunoSelecionado(null);
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
      ${modoProva ? `Prova de ${disciplina}` : `Atividade Adaptada de ${disciplina} - ${tema}`}
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
${modoProva && tempoEstimado ? `<p style="font-size:11pt; text-align:right; color:#555;"><strong>Tempo estimado:</strong> ${tempoEstimado} minutos</p>` : ""}

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

  const dk = modoEscuro;
  const cores = {
    bg: dk ? "#1C1B18" : "#FAF7F1",
    card: dk ? "#2A2824" : "#FFFFFF",
    cardBorder: dk ? "#3D3A34" : "#E7E0D3",
    cardActiveBg: dk ? "#2E3530" : "#E1EDE9",
    text: dk ? "#E8E4DB" : "#22201D",
    textSub: dk ? "#9A9388" : "#8A8378",
    label: dk ? "#B5AFA5" : "#8A8378",
    input: dk ? "#2A2824" : "#FFFFFF",
    inputBorder: dk ? "#3D3A34" : "#E2DACB",
    chipBg: dk ? "#2A2824" : "#FFFFFF",
    chipBorder: dk ? "#3D3A34" : "#E2DACB",
    areaSubBg: dk ? "#252320" : "#F1ECDF",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: dk ? "#c4a8d4" : "#8A8378", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" };
  const chipStyle = { padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s", boxShadow: "0 1px 2px rgba(75,13,99,0.04)" };
  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `2px solid ${cores.inputBorder}`, fontSize: 14, color: cores.text, outline: "none", boxSizing: "border-box", background: cores.input };
  const nextBtnStyle = { display: "block", width: "100%", marginTop: 24, padding: "14px", borderRadius: 10, border: "none", background: "#C1683C", color: "#FAF3EA", fontSize: 15, fontWeight: 800, cursor: "pointer", transition: "opacity 0.2s", boxShadow: "0 4px 12px rgba(193,104,60,0.24)" };
  const backBtnStyle = { display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 10, border: `2px solid ${cores.cardBorder}`, background: cores.card, color: dk ? "#c4a8d4" : "#8A8378", fontSize: 14, fontWeight: 600, cursor: "pointer" };

  const MENU = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "gerador", label: "Atividade", icon: "✨" },
    { id: "pro", label: "PRO", icon: "🚀" },
    { id: "alunos", label: "Alunos", icon: "👩‍🎓" },
    { id: "historico", label: "Histórico", icon: "📋" },
  ];

  // Tela de carregamento
  if (verificandoAuth) {
    return (
      <div style={{
        fontFamily: "'Work Sans', system-ui, sans-serif",
        background: "#FAF7F1", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <img src="/logo-genesis.png" alt="Logo" style={{ width: 60, marginBottom: 16 }} />
          <div style={{ fontSize: 14, color: "#8A8378" }}>Carregando...</div>
        </div>
      </div>
    );
  }

  // Tela de login
  if (!usuario) {
    return (
      <div style={{
        fontFamily: "'Work Sans', system-ui, sans-serif",
        background: "#FAF7F1", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
        <div style={{
          background: "#fff", borderRadius: 16, padding: "40px 36px",
          boxShadow: "0 4px 24px rgba(34,32,29,0.08)",
          width: "100%", maxWidth: 380,
        }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src="/logo-genesis.png" alt="Logo" style={{ width: 64, marginBottom: 12 }} />
            <div style={{ fontSize: 22, fontWeight: 600, color: "#22201D" }}>Gênesis Atividades</div>
            <div style={{ fontSize: 13, color: "#8A8378", marginTop: 4 }}>Faça login para continuar</div>
          </div>

          {loginErro && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: "#FEF2F2", color: "#991B1B", fontSize: 13, fontWeight: 500,
            }}>
              {loginErro}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8A8378", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fazerLogin()}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "2px solid #E2DACB", fontSize: 14, color: "#22201D",
                outline: "none", boxSizing: "border-box", background: "#fff",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8A8378", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={loginSenha}
              onChange={(e) => setLoginSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fazerLogin()}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "2px solid #E2DACB", fontSize: 14, color: "#22201D",
                outline: "none", boxSizing: "border-box", background: "#fff",
              }}
            />
          </div>

          <button
            onClick={fazerLogin}
            disabled={loginLoading}
            style={{
              width: "100%", padding: "14px", borderRadius: 10, border: "none",
              background: "#C1683C", color: "#FAF3EA", fontSize: 15, fontWeight: 700,
              cursor: loginLoading ? "wait" : "pointer",
              opacity: loginLoading ? 0.7 : 1,
              boxShadow: "0 4px 12px rgba(193,104,60,0.24)",
            }}
          >
            {loginLoading ? "Entrando..." : "Entrar"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#B5AFA5" }}>
            Colégio Gênesis Life — Osasco/SP
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Alunos cadastrados", valor: totalAlunos, icon: "👩‍🎓", cor: "#1F3A3D" },
    { label: "Atividades criadas", valor: totalAtividades, icon: "📝", cor: "#e6a817" },
  ];

  return (
    <div style={{
      fontFamily: "'Work Sans', system-ui, sans-serif",
      background: cores.bg,
      minHeight: "100vh",
      transition: "background 0.3s",
    }}>

      {/* Header horizontal com nav pills */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px",
        borderBottom: `1px solid ${cores.cardBorder}`,
        background: cores.card,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo-genesis.png" alt="Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", color: cores.text }}>
            Gênesis Atividades
          </div>
        </div>

        <nav style={{
          display: "flex", gap: 4,
          background: dk ? "#2A2824" : "#F1ECDF",
          padding: 5, borderRadius: 999,
        }}>
          {MENU.map((item) => (
            <button key={item.id} onClick={() => setPagina(item.id)}
              style={{
                border: "none", cursor: "pointer", padding: "9px 14px",
                borderRadius: 7, fontSize: 13.5, fontFamily: "inherit",
                color: pagina === item.id ? cores.text : "#8A8378",
                fontWeight: pagina === item.id ? 700 : 500,
                background: pagina === item.id ? (dk ? "#3D3A34" : "#EFE9DA") : "transparent",
                transition: "all 0.15s",
              }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#8A8378" }}>{usuario?.email}</span>
          <button onClick={() => setModoEscuro(!modoEscuro)} style={{
            background: "none", border: `1px solid ${cores.cardBorder}`,
            borderRadius: 8, padding: "6px 10px", cursor: "pointer",
            fontSize: 16, color: cores.text,
          }}>
            {dk ? "☀️" : "🌙"}
          </button>
          <button onClick={fazerLogout} style={{
            background: "none", border: `1px solid ${cores.cardBorder}`,
            borderRadius: 8, padding: "6px 10px", cursor: "pointer",
            fontSize: 12, color: "#C1683C", fontWeight: 600,
          }}>
            Sair
          </button>
        </div>
      </header>

        {/* Dashboard */}
        {pagina === "dashboard" && (
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 32px" }}>
            <div style={{ marginBottom: 44 }}>
              <h1 style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 10px", lineHeight: 1.1, color: cores.text }}>
                Bem-vindo!
              </h1>
              <p style={{ margin: 0, color: "#79726A", fontSize: 16 }}>Visão geral do Colégio Gênesis Life</p>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16, marginBottom: 48,
            }}>
              {statCards.map((card) => (
                <div key={card.label} style={{
                  padding: "26px 28px", background: cores.card, borderRadius: 14,
                  boxShadow: "0 1px 2px rgba(34,32,29,0.04), 0 8px 24px rgba(34,32,29,0.05)",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "#8A8378", textTransform: "uppercase", marginBottom: 12 }}>{card.label}</div>
                  <div style={{ fontSize: 38, fontWeight: 600, color: cores.text }}>{card.valor}</div>
                </div>
              ))}
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 0, marginBottom: 48,
              background: "#1F3A3D", borderRadius: 16, overflow: "hidden",
              boxShadow: "0 12px 32px rgba(34,32,29,0.14)",
            }}>
              <div style={{ padding: 44, color: "#F3EFE6" }}>
                <div style={{ fontSize: 26, fontWeight: 600, marginBottom: 10 }}>Comece agora</div>
                <p style={{ margin: "0 0 24px", fontSize: 15, lineHeight: 1.55, color: "#D8E3E1", maxWidth: 420 }}>
                  Comece gerando uma atividade adaptada para seus alunos!
                </p>
                <button onClick={() => setPagina("gerador")} style={{
                  background: "#C1683C", color: "#FAF3EA", border: "none", borderRadius: 8,
                  padding: "13px 24px", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
                }}>
                  Gerar atividade →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder: Alunos */}
        {pagina === "alunos" && (
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: cores.text, margin: "0 0 4px" }}>👩‍🎓 Alunos</h2>
            <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 20px" }}>Cadastre alunos com suas necessidades para gerar atividades personalizadas.</p>

            {alunoMsg && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: dk ? "#1a3a2e" : "#e8f5e9", color: dk ? "#81c784" : "#2e7d32", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {alunoMsg}
              </div>
            )}

            {/* Formulário */}
            <div style={{ background: cores.card, borderRadius: 14, padding: "20px", border: `1px solid ${cores.cardBorder}`, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: cores.text, margin: "0 0 16px" }}>
                {alunoEditando ? "✏️ Editar aluno" : "➕ Cadastrar aluno"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input type="text" placeholder="Nome completo" value={alunoForm.nome} onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Série</label>
                  <select value={alunoForm.serie} onChange={(e) => setAlunoForm({ ...alunoForm, serie: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Selecione</option>
                    {Object.values(SERIES_OPTIONS).flat().map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Turma</label>
                  <input type="text" placeholder="Ex: A, B" value={alunoForm.turma} onChange={(e) => setAlunoForm({ ...alunoForm, turma: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Número</label>
                  <input type="number" placeholder="Nº" value={alunoForm.numero} onChange={(e) => setAlunoForm({ ...alunoForm, numero: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <label style={labelStyle}>Necessidades do aluno</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {NECESSIDADES_OPCOES.map((nec) => {
                  const sel = alunoForm.necessidades.includes(nec);
                  return (
                    <button key={nec} onClick={() => toggleAlunoNecessidade(nec)} style={{
                      ...chipStyle, fontSize: 11, padding: "6px 10px",
                      background: sel ? "#1F3A3D" : cores.card,
                      color: sel ? "white" : cores.text,
                      border: sel ? "1px solid #1F3A3D" : `1px solid ${cores.cardBorder}`,
                    }}>{nec}</button>
                  );
                })}
                <button onClick={() => {
                  if (alunoNecessidadeOutra.trim()) {
                    toggleAlunoNecessidade(alunoNecessidadeOutra.trim());
                    setAlunoNecessidadeOutra("");
                  }
                }} style={{
                  ...chipStyle, fontSize: 11, padding: "6px 10px",
                  background: cores.card, color: cores.text,
                  border: `1px solid ${cores.cardBorder}`,
                }}>+ Outro</button>
              </div>
              {alunoForm.necessidades.filter((n) => !NECESSIDADES_OPCOES.includes(n)).length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {alunoForm.necessidades.filter((n) => !NECESSIDADES_OPCOES.includes(n)).map((n) => (
                    <span key={n} onClick={() => toggleAlunoNecessidade(n)} style={{
                      ...chipStyle, fontSize: 11, padding: "6px 10px", cursor: "pointer",
                      background: "#1F3A3D", color: "white", border: "1px solid #1F3A3D",
                    }}>{n} ✕</span>
                  ))}
                </div>
              )}
              <input type="text" placeholder="Digite uma necessidade personalizada e clique '+ Outro'" value={alunoNecessidadeOutra} onChange={(e) => setAlunoNecessidadeOutra(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && alunoNecessidadeOutra.trim()) {
                    toggleAlunoNecessidade(alunoNecessidadeOutra.trim());
                    setAlunoNecessidadeOutra("");
                  }
                }}
                style={{ ...inputStyle, marginBottom: 12, fontSize: 12 }} />

              <label style={labelStyle}>Observações</label>
              <textarea placeholder="Ex: Aprende melhor com imagens, precisa de mais tempo..." value={alunoForm.observacoes} onChange={(e) => setAlunoForm({ ...alunoForm, observacoes: e.target.value })}
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={salvarAluno} style={{ ...nextBtnStyle, marginTop: 0, flex: 1 }}>
                  {alunoEditando ? "💾 Salvar alterações" : "➕ Cadastrar aluno"}
                </button>
                {alunoEditando && (
                  <button onClick={() => {
                    setAlunoEditando(null);
                    setAlunoForm({ nome: "", serie: "", turma: "", numero: "", necessidades: [], observacoes: "" });
                  }} style={backBtnStyle}>Cancelar</button>
                )}
              </div>
            </div>

            {/* Lista de alunos */}
            <div style={{ background: cores.card, borderRadius: 14, padding: "20px", border: `1px solid ${cores.cardBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: cores.text, margin: 0, flex: 1 }}>
                  📋 Alunos cadastrados ({alunos.length})
                </h3>
                <input type="text" placeholder="🔍 Buscar..." value={alunoBusca} onChange={(e) => setAlunoBusca(e.target.value)}
                  style={{ ...inputStyle, width: 180, fontSize: 12, padding: "8px 12px" }} />
              </div>

              {alunos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: cores.textSub }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 14 }}>Nenhum aluno cadastrado ainda.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {alunos
                    .filter((a) => a.nome.toLowerCase().includes(alunoBusca.toLowerCase()) || (a.serie || "").toLowerCase().includes(alunoBusca.toLowerCase()) || (a.turma || "").toLowerCase().includes(alunoBusca.toLowerCase()))
                    .map((aluno) => (
                    <div key={aluno.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 10,
                      background: cores.areaSubBg, border: `1px solid ${cores.cardBorder}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: cores.text }}>{aluno.nome}</div>
                        <div style={{ fontSize: 12, color: cores.textSub }}>
                          {aluno.serie}{aluno.turma ? ` — Turma ${aluno.turma}` : ""}{aluno.numero ? ` — Nº ${aluno.numero}` : ""}
                        </div>
                        {aluno.necessidades && aluno.necessidades.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                            {aluno.necessidades.map((n) => (
                              <span key={n} style={{
                                fontSize: 10, padding: "2px 6px", borderRadius: 4,
                                background: dk ? "#1F3A2E" : "#E1EDE9", color: dk ? "#7BA896" : "#1F5C3E",
                                fontWeight: 600,
                              }}>{n}</span>
                            ))}
                          </div>
                        )}
                        {aluno.observacoes && (
                          <div style={{ fontSize: 11, color: cores.textSub, marginTop: 4, fontStyle: "italic" }}>
                            {aluno.observacoes}
                          </div>
                        )}
                      </div>
                      <button onClick={() => editarAluno(aluno)} style={{
                        background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4,
                      }}>✏️</button>
                      <button onClick={() => excluirAluno(aluno.id)} style={{
                        background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4,
                      }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder: Histórico */}
        {pagina === "historico" && (
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: cores.text, margin: "0 0 4px" }}>📋 Histórico</h2>
            <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 20px" }}>Todas as atividades geradas ({atividadesSalvas.length})</p>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input type="text" placeholder="🔍 Buscar por tema ou aluno..." value={filtroBuscaAtiv} onChange={(e) => setFiltroBuscaAtiv(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 180, fontSize: 12, padding: "8px 12px" }} />
              <select value={filtroDisc} onChange={(e) => setFiltroDisc(e.target.value)}
                style={{ ...inputStyle, width: 140, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}>
                <option value="">Disciplina</option>
                {[...new Set(atividadesSalvas.map((a) => a.disciplina))].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={filtroSerie} onChange={(e) => setFiltroSerie(e.target.value)}
                style={{ ...inputStyle, width: 120, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}>
                <option value="">Série</option>
                {[...new Set(atividadesSalvas.map((a) => a.serie))].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {atividadesSalvas.length === 0 ? (
              <div style={{
                background: cores.card, borderRadius: 14, padding: "40px 20px",
                border: `1px solid ${cores.cardBorder}`, textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, color: cores.textSub }}>Nenhuma atividade gerada ainda.</div>
                <button onClick={() => setPagina("gerador")} style={{ ...nextBtnStyle, maxWidth: 220, margin: "16px auto 0" }}>
                  Gerar primeira atividade
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {atividadesSalvas
                  .filter((a) => !filtroDisc || a.disciplina === filtroDisc)
                  .filter((a) => !filtroSerie || a.serie === filtroSerie)
                  .filter((a) => !filtroBuscaAtiv || (a.tema || "").toLowerCase().includes(filtroBuscaAtiv.toLowerCase()) || (a.aluno_nome || "").toLowerCase().includes(filtroBuscaAtiv.toLowerCase()))
                  .map((ativ) => (
                  <div key={ativ.id} style={{
                    background: cores.card, borderRadius: 12, padding: "16px 18px",
                    border: `1px solid ${cores.cardBorder}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: cores.text }}>{ativ.tema}</div>
                        <div style={{ fontSize: 12, color: cores.textSub }}>
                          {ativ.disciplina} — {ativ.serie}
                          {ativ.aluno_nome ? ` — ${ativ.aluno_nome}` : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: cores.textSub }}>
                        {new Date(ativ.criado_em).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12, color: cores.textSub, lineHeight: 1.5,
                      maxHeight: 60, overflow: "hidden",
                      marginBottom: 12,
                    }}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(ativ.conteudo);
                          if (parsed.textoBase) return parsed.textoBase.substring(0, 200) + "...";
                        } catch (e) {}
                        return (ativ.conteudo || "").substring(0, 200) + "...";
                      })()}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button onClick={async () => {
                        try {
                          const parsed = JSON.parse(ativ.conteudo);
                          if (parsed.textoBase) {
                            setProResultado(parsed);
                            setProImgsGeradas(ativ.imagens || {});
                            setProStep(3);
                            setProDisciplina(ativ.disciplina);
                            setProSerie(ativ.serie);
                            setProTema(ativ.tema);
                            setPagina("pro");
                            return;
                          }
                        } catch (e) {}
                        setResultado(ativ.conteudo);
                        setDisciplina(ativ.disciplina);
                        setSerie(ativ.serie);
                        setTema(ativ.tema);
                        setStep(4);
                        setPagina("gerador");
                      }} style={{
                        padding: "6px 14px", borderRadius: 8, border: `1px solid ${cores.cardBorder}`,
                        background: cores.card, color: cores.text, fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                      }}>👁️ Ver</button>
                      <span style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: (() => { try { JSON.parse(ativ.conteudo); return "#C1683C"; } catch(e) { return cores.cardBorder; } })(),
                        color: (() => { try { JSON.parse(ativ.conteudo); return "white"; } catch(e) { return cores.textSub; } })(),
                      }}>
                        {(() => { try { JSON.parse(ativ.conteudo); return "PRO"; } catch(e) { return "Normal"; } })()}
                      </span>
                      <button onClick={() => gerarRecadoHistorico(ativ)}
                        disabled={recadoCarregando === ativ.id}
                        style={{
                        padding: "6px 14px", borderRadius: 8, border: `1px solid ${cores.cardBorder}`,
                        background: cores.card, color: cores.text, fontSize: 12, fontWeight: 600,
                        cursor: recadoCarregando === ativ.id ? "wait" : "pointer",
                        opacity: recadoCarregando === ativ.id ? 0.6 : 1,
                      }}>{recadoCarregando === ativ.id ? "⏳" : "📩"} Recado</button>
                      <button onClick={async () => {
                        await supabase.from("atividades").delete().eq("id", ativ.id);
                        carregarAtividades();
                      }} style={{
                        padding: "6px 14px", borderRadius: 8, border: `1px solid ${cores.cardBorder}`,
                        background: cores.card, color: "#c0392b", fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                      }}>🗑️</button>
                    </div>
                    {recadoGerado[ativ.id] && (
                      <div style={{
                        marginTop: 10, padding: "14px 16px", borderRadius: 10,
                        background: dk ? "#1F3A2E" : "#F0F8F0", border: `1px solid ${dk ? "#2E5040" : "#C8E6C9"}`,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: dk ? "#7BA896" : "#2E7D32", marginBottom: 6 }}>📩 Recado para o responsável:</div>
                        <div style={{ fontSize: 13, color: cores.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{recadoGerado[ativ.id]}</div>
                        <button onClick={() => {
                          navigator.clipboard.writeText(recadoGerado[ativ.id]);
                          alert("Recado copiado!");
                        }} style={{
                          marginTop: 8, padding: "5px 12px", borderRadius: 6,
                          border: `1px solid ${cores.cardBorder}`, background: cores.card,
                          color: cores.text, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}>📋 Copiar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gerador de Atividades */}
        {/* GERADOR PRO */}
        {pagina === "pro" && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 40px" }}>

            {proStep === 1 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: cores.text, margin: "0 0 4px" }}>
                  🚀 Gerador PRO
                </h2>
                <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 24px" }}>
                  Atividades avançadas com imagens geradas por IA.
                </p>

                {/* Aluno (opcional) */}
                {alunos.length > 0 && (
                  <div style={{ background: cores.card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${cores.cardBorder}`, marginBottom: 16 }}>
                    <label style={{ ...labelStyle, margin: "0 0 8px 0" }}>👩‍🎓 Aluno (opcional)</label>
                    {proAlunoSelecionado ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: cores.cardActiveBg, border: "1px solid #1F3A3D" }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: cores.text }}>{proAlunoSelecionado.nome} — {proAlunoSelecionado.serie}</span>
                        <button onClick={() => setProAlunoSelecionado(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: cores.textSub }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                        {alunos.map((a) => (
                          <button key={a.id} onClick={() => { setProAlunoSelecionado(a); setProSerie(a.serie); setProNecessidades(a.necessidades || []); }}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: `1px solid ${cores.cardBorder}`, background: cores.card, cursor: "pointer", textAlign: "left", width: "100%", fontSize: 13, color: cores.text }}>
                            {a.nome} <span style={{ fontSize: 11, color: cores.textSub }}>— {a.serie}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Série (se não tem aluno) */}
                {!proAlunoSelecionado && (
                  <>
                    <label style={labelStyle}>Segmento</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      {Object.keys(SERIES_OPTIONS).map((seg) => (
                        <button key={seg} onClick={() => { setProSegmento(seg); setProSerie(""); }}
                          style={{ ...chipStyle, background: proSegmento === seg ? "#1F3A3D" : cores.card, color: proSegmento === seg ? "white" : cores.text, border: proSegmento === seg ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                          {seg}
                        </button>
                      ))}
                    </div>
                    {proSegmento && (
                      <>
                        <label style={labelStyle}>Série</label>
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                          {SERIES_OPTIONS[proSegmento].map((s) => (
                            <button key={s} onClick={() => setProSerie(s)}
                              style={{ ...chipStyle, background: proSerie === s ? "#1F3A3D" : cores.card, color: proSerie === s ? "white" : cores.text, border: proSerie === s ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Disciplina */}
                <label style={labelStyle}>Disciplina</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  {[...new Set(Object.values(DISCIPLINAS).flat())].map((d) => (
                    <button key={d} onClick={() => setProDisciplina(d)}
                      style={{ ...chipStyle, background: proDisciplina === d ? "#1F3A3D" : cores.card, color: proDisciplina === d ? "white" : cores.text, border: proDisciplina === d ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                      {d}
                    </button>
                  ))}
                </div>

                {/* Tema */}
                <label style={labelStyle}>Tema</label>
                <input type="text" placeholder="Ex: Frações, Sistema Solar, Animais..." value={proTema} onChange={(e) => setProTema(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />

                {(proSerie || proAlunoSelecionado) && proDisciplina && proTema.trim() && (
                  <button onClick={() => setProStep(2)} style={nextBtnStyle}>Próximo →</button>
                )}
              </div>
            )}

            {proStep === 2 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: cores.text, margin: "0 0 4px" }}>
                  🚀 Configurações PRO
                </h2>
                <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 20px" }}>
                  {proDisciplina} — {proTema} {proAlunoSelecionado ? `— ${proAlunoSelecionado.nome}` : ""}
                </p>

                {/* Quantidade */}
                <label style={labelStyle}>Quantidade de questões</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[3, 5, 6, 8, 10].map((n) => (
                    <button key={n} onClick={() => setProQtdQuestoes(n)}
                      style={{ ...chipStyle, background: proQtdQuestoes === n ? "#1F3A3D" : cores.card, color: proQtdQuestoes === n ? "white" : cores.text, border: proQtdQuestoes === n ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                      {n}
                    </button>
                  ))}
                </div>

                {/* Dificuldade */}
                <label style={labelStyle}>Nível de dificuldade</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[{ id: "facil", label: "Fácil" }, { id: "medio", label: "Médio" }, { id: "dificil", label: "Difícil" }, { id: "progressivo", label: "Progressivo" }].map((n) => (
                    <button key={n.id} onClick={() => setProDificuldade(n.id)}
                      style={{ ...chipStyle, background: proDificuldade === n.id ? "#1F3A3D" : cores.card, color: proDificuldade === n.id ? "white" : cores.text, border: proDificuldade === n.id ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                      {n.label}
                    </button>
                  ))}
                </div>

                {/* Tipo de atividade */}
                <label style={labelStyle}>Tipo de atividade</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[{ id: "mista", label: "Mista" }, { id: "multipla_escolha", label: "Múltipla escolha" }, { id: "aberta", label: "Perguntas abertas" }, { id: "complete", label: "Complete" }, { id: "ligue", label: "Ligue/Associe" }, { id: "vf", label: "V ou F" }, { id: "interpretacao", label: "Interpretação" }].map((t) => (
                    <button key={t.id} onClick={() => setProTipoAtividade(t.id)}
                      style={{ ...chipStyle, fontSize: 12, background: proTipoAtividade === t.id ? "#1F3A3D" : cores.card, color: proTipoAtividade === t.id ? "white" : cores.text, border: proTipoAtividade === t.id ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Imagens */}
                <label style={labelStyle}>Uso de imagens</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[{ id: "sem", label: "Sem imagens" }, { id: "poucas", label: "Poucas" }, { id: "algumas", label: "Algumas" }, { id: "muitas", label: "Muitas" }].map((i) => (
                    <button key={i.id} onClick={() => setProImagens(i.id)}
                      style={{ ...chipStyle, fontSize: 12, background: proImagens === i.id ? "#1F3A3D" : cores.card, color: proImagens === i.id ? "white" : cores.text, border: proImagens === i.id ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                      {i.label}
                    </button>
                  ))}
                </div>

                {/* Estilo das imagens */}
                {proImagens !== "sem" && (
                  <>
                    <label style={labelStyle}>Estilo das imagens</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      {[{ id: "automatico", label: "Automático" }, { id: "didatica", label: "Didática" }, { id: "infantil", label: "Infantil" }, { id: "realista", label: "Realista" }, { id: "colorir", label: "P/ colorir" }, { id: "esquema", label: "Esquema" }].map((e) => (
                        <button key={e.id} onClick={() => setProEstiloImagem(e.id)}
                          style={{ ...chipStyle, fontSize: 12, background: proEstiloImagem === e.id ? "#C1683C" : cores.card, color: proEstiloImagem === e.id ? "white" : cores.text, border: proEstiloImagem === e.id ? "2px solid #C1683C" : `2px solid ${cores.cardBorder}` }}>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Área de resposta */}
                <label style={labelStyle}>Área para resposta</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {[{ id: "pequena", label: "Pequena" }, { id: "media", label: "Média" }, { id: "grande", label: "Grande" }].map((a) => (
                    <button key={a.id} onClick={() => setProAreaResposta(a.id)}
                      style={{ ...chipStyle, background: proAreaResposta === a.id ? "#1F3A3D" : cores.card, color: proAreaResposta === a.id ? "white" : cores.text, border: proAreaResposta === a.id ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                      {a.label}
                    </button>
                  ))}
                </div>

                {/* Gabarito */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: cores.card, borderRadius: 10, border: `2px solid ${cores.cardBorder}`, marginBottom: 16 }}>
                  <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: cores.text }}>Incluir gabarito?</span>
                  <button onClick={() => setProGabarito(!proGabarito)} style={{
                    width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                    background: proGabarito ? "#1F3A3D" : "#C7BFAE", position: "relative", transition: "background 0.2s",
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: cores.card, position: "absolute", top: 3, left: proGabarito ? 25 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </button>
                </div>

                {/* Adaptações */}
                {!proAlunoSelecionado && (
                  <>
                    <label style={labelStyle}>Adaptações (opcional)</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                      {["Dificuldade de leitura", "TDAH", "TEA", "Deficiência intelectual", "Alfabetização em processo", "Comandos mais curtos"].map((nec) => {
                        const sel = proNecessidades.includes(nec);
                        return (
                          <button key={nec} onClick={() => setProNecessidades((prev) => sel ? prev.filter((n) => n !== nec) : [...prev, nec])}
                            style={{ ...chipStyle, fontSize: 11, padding: "6px 10px", background: sel ? "#1F3A3D" : cores.card, color: sel ? "white" : cores.text, border: sel ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                            {nec}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {proError && <div style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>{proError}</div>}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button onClick={() => setProStep(1)} style={backBtnStyle}>← Voltar</button>
                  <button onClick={gerarPro} disabled={proLoading}
                    style={{ ...nextBtnStyle, marginTop: 0, flex: 1, opacity: proLoading ? 0.7 : 1 }}>
                    {proLoading ? "⏳ Gerando..." : "🚀 Gerar Atividade PRO"}
                  </button>
                </div>

                {proLoading && (
                  <div style={{ textAlign: "center", marginTop: 20, padding: 20, background: cores.card, borderRadius: 12, border: `1px solid ${cores.cardBorder}` }}>
                    <div style={{ fontSize: 32, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🤖</div>
                    <div style={{ fontSize: 13, color: cores.textSub }}>{proLoadingMsg}</div>
                    <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
                  </div>
                )}
              </div>
            )}

            {proStep === 3 && proResultado && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: cores.text, margin: "0 0 4px" }}>
                  🚀 Atividade PRO gerada!
                </h2>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  <span style={{ background: dk ? "#2E3530" : "#E1EDE9", color: dk ? "#7BA896" : "#1F3A3D", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{proAlunoSelecionado?.serie || proSerie}</span>
                  <span style={{ background: dk ? "#2E2540" : "#f0e8f8", color: dk ? "#B88FD0" : "#5b2580", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{proDisciplina}</span>
                  <span style={{ background: dk ? "#3A3020" : "#fff7d6", color: dk ? "#D4A84A" : "#7a5700", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{proTema}</span>
                </div>

                <div style={{ background: "#fff", padding: "28px 24px", borderRadius: 12, border: "1px solid #ddd", color: "#222", boxShadow: dk ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ fontSize: 14, color: "#1F3A3D", marginTop: 0 }}>📖 Leia o texto com atenção:</h3>
                  <p style={{ lineHeight: 1.7, fontSize: 14 }}>{proResultado.textoBase}</p>
                  <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />

                  {proResultado.questoes.map((q) => (
                    <div key={q.numero} style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>Questão {q.numero}</p>
                      {proImgsGeradas[q.numero] && (
                        <img src={`data:${proImgsGeradas[q.numero].mime};base64,${proImgsGeradas[q.numero].data}`}
                          style={{ maxWidth: 280, borderRadius: 8, border: "1px solid #ddd", margin: "8px 0" }} />
                      )}
                      <p style={{ fontSize: 14 }}>{q.enunciado}</p>
                      {q.alternativas && q.alternativas.map((a, i) => (
                        <p key={i} style={{ fontSize: 13, marginLeft: 16 }}>{a}</p>
                      ))}
                    </div>
                  ))}

                  {proResultado.dicasProfessor && (
                    <>
                      <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />
                      <h3 style={{ fontSize: 14, color: "#1F3A3D" }}>💡 Dicas e Observações para o Professor</h3>
                      <div style={{ fontSize: 13, lineHeight: 1.7, background: "#F5F0E5", padding: "12px 16px", borderRadius: 8, border: "1px solid #E2DACB" }}>
                        {proResultado.dicasProfessor.split("\n").map((l, i) => <p key={i} style={{ margin: "4px 0" }}>{l}</p>)}
                      </div>
                    </>
                  )}

                  {proResultado.gabarito && (
                    <>
                      <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />
                      <h3 style={{ fontSize: 14, color: "#c0392b" }}>📋 Gabarito</h3>
                      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                        {typeof proResultado.gabarito === "string"
                          ? proResultado.gabarito.split("\n").map((l, i) => <p key={i} style={{ margin: "2px 0" }}>{l}</p>)
                          : Array.isArray(proResultado.gabarito)
                            ? proResultado.gabarito.map((g, i) => <p key={i} style={{ margin: "2px 0" }}>{g}</p>)
                            : proResultado.questoes?.map((q) => (
                              <p key={q.numero} style={{ margin: "2px 0" }}><strong>{q.numero})</strong> {q.resposta}</p>
                            ))
                        }
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                  <button onClick={() => { setProStep(1); setProResultado(null); setProImgsGeradas({}); }} style={backBtnStyle}>← Nova Atividade</button>
                  <button onClick={baixarWordPro} style={{ ...nextBtnStyle, marginTop: 0, flex: 1 }}>📄 Baixar Word</button>
                </div>
                {Object.keys(proImgsGeradas).length === 0 && proResultado.questoes?.some((q) => q.precisaImagem) && (
                  <button onClick={async () => {
                    const questoesComImagem = proResultado.questoes.filter((q) => q.precisaImagem && q.promptImagem);
                    if (questoesComImagem.length === 0) return;
                    setProLoading(true);
                    setProLoadingMsg("Regerando imagens...");
                    for (const q of questoesComImagem) {
                      try {
                        setProLoadingMsg(`Gerando imagem da questão ${q.numero}...`);
                        const imgResponse = await fetch("/api/gerar-imagem", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ prompt: q.promptImagem, estilo: proEstiloImagem }),
                        });
                        const imgData = await imgResponse.json();
                        if (imgResponse.ok && imgData.image) {
                          setProImgsGeradas((prev) => ({ ...prev, [q.numero]: { data: imgData.image, mime: imgData.mimeType || "image/png" } }));
                        }
                      } catch (e) {}
                    }
                    setProLoading(false);
                    setProLoadingMsg("");
                  }} disabled={proLoading}
                    style={{ ...backBtnStyle, width: "100%", marginTop: 10, justifyContent: "center", background: "#C1683C", color: "white", border: "none" }}>
                    {proLoading ? "⏳ Gerando imagens..." : "🖼️ Gerar imagens desta atividade"}
                  </button>
                )}
                <button onClick={() => { setProStep(2); setProResultado(null); setProImgsGeradas({}); }}
                  style={{ ...backBtnStyle, width: "100%", marginTop: 10, textAlign: "center", justifyContent: "center" }}>
                  🔄 Gerar outra versão
                </button>
              </div>
            )}
          </div>
        )}

        {/* Gerador de Atividades (original) */}
        {pagina === "gerador" && (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 40px" }}>
        {step < 4 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s <= step ? "#1F3A3D" : "#E2DACB",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            {/* Seletor de aluno */}
            <div style={{
              background: cores.card, borderRadius: 12, padding: "14px 16px",
              border: `1px solid ${cores.cardBorder}`, marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: alunoSelecionado ? 0 : 10 }}>
                <label style={{ ...labelStyle, margin: 0 }}>👩‍🎓 Aluno (opcional)</label>
                {alunoSelecionado && (
                  <button onClick={() => setAlunoSelecionado(null)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: cores.textSub,
                  }}>✕ Remover</button>
                )}
              </div>
              {alunoSelecionado ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginTop: 10,
                  padding: "10px 12px", borderRadius: 8,
                  background: cores.cardActiveBg, border: "1px solid #1F3A3D",
                }}>
                  <span style={{ fontSize: 22 }}>👩‍🎓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: cores.text }}>{alunoSelecionado.nome}</div>
                    <div style={{ fontSize: 11, color: cores.textSub }}>
                      {alunoSelecionado.serie}{alunoSelecionado.turma ? ` — Turma ${alunoSelecionado.turma}` : ""}
                    </div>
                    {alunoSelecionado.necessidades && alunoSelecionado.necessidades.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {alunoSelecionado.necessidades.map((n) => (
                          <span key={n} style={{
                            fontSize: 9, padding: "2px 6px", borderRadius: 4,
                            background: dk ? "#1F3A2E" : "#E1EDE9", color: dk ? "#7BA896" : "#1F5C3E",
                            fontWeight: 600,
                          }}>{n}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 18, color: "#2e7d32" }}>✓</span>
                </div>
              ) : (
                <>
                  {alunos.length === 0 ? (
                    <div style={{ fontSize: 12, color: cores.textSub, padding: "8px 0" }}>
                      Nenhum aluno cadastrado. <span onClick={() => setPagina("alunos")} style={{ color: "#1F3A3D", cursor: "pointer", fontWeight: 600 }}>Cadastrar →</span>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                      {alunos.map((aluno) => (
                        <button key={aluno.id} onClick={() => {
                          setAlunoSelecionado(aluno);
                          if (aluno.serie) {
                            const seg = Object.entries(SERIES_OPTIONS).find(([, series]) => series.includes(aluno.serie));
                            if (seg) { setSegmento(seg[0]); setSerie(aluno.serie); }
                          }
                          if (aluno.necessidades && aluno.necessidades.length > 0) {
                            setNecessidades(aluno.necessidades);
                          }
                        }} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 10px", borderRadius: 8, border: `1px solid ${cores.cardBorder}`,
                          background: cores.card, cursor: "pointer", textAlign: "left",
                          transition: "all 0.15s", width: "100%",
                        }}>
                          <span style={{ fontSize: 14 }}>👩‍🎓</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: cores.text }}>{aluno.nome}</div>
                            <div style={{ fontSize: 11, color: cores.textSub }}>{aluno.serie}{aluno.turma ? ` — ${aluno.turma}` : ""}</div>
                          </div>
                          {aluno.necessidades && aluno.necessidades.length > 0 && (
                            <span style={{ fontSize: 10, color: "#1F3A3D", fontWeight: 600 }}>{aluno.necessidades.length} nec.</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Geração em lote */}
            {alunos.length > 0 && (
              <div style={{
                background: cores.card, borderRadius: 12, padding: "14px 16px",
                border: `1px solid ${cores.cardBorder}`, marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ ...labelStyle, margin: 0 }}>🚀 Geração em lote</label>
                  <button onClick={() => setGeracaoLote(!geracaoLote)} style={{
                    background: geracaoLote ? "#1F3A3D" : "none",
                    border: geracaoLote ? "none" : `1px solid ${cores.cardBorder}`,
                    borderRadius: 8, padding: "4px 12px", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    color: geracaoLote ? "#fff" : cores.textSub,
                  }}>
                    {geracaoLote ? "Fechar" : "Abrir"}
                  </button>
                </div>
                {geracaoLote && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: cores.textSub, marginBottom: 8 }}>
                      Selecione os alunos pra gerar uma atividade personalizada pra cada um:
                    </div>
                    <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                      {alunos.map((aluno) => {
                        const sel = alunosLote.find((a) => a.id === aluno.id);
                        return (
                          <button key={aluno.id} onClick={() => toggleAlunoLote(aluno)} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 10px", borderRadius: 8,
                            border: sel ? "2px solid #1F3A3D" : `1px solid ${cores.cardBorder}`,
                            background: sel ? cores.cardActiveBg : cores.card,
                            cursor: "pointer", textAlign: "left", width: "100%",
                          }}>
                            <span style={{
                              width: 20, height: 20, borderRadius: 5, display: "flex",
                              alignItems: "center", justifyContent: "center", fontSize: 12,
                              background: sel ? "#1F3A3D" : "transparent",
                              border: sel ? "none" : `2px solid ${cores.cardBorder}`,
                              color: "white", fontWeight: 700,
                            }}>{sel ? "✓" : ""}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: cores.text }}>{aluno.nome}</div>
                              <div style={{ fontSize: 11, color: cores.textSub }}>{aluno.serie}{aluno.turma ? ` — ${aluno.turma}` : ""}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {alunosLote.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: cores.textSub }}>
                        ✅ {alunosLote.length} aluno(s) selecionado(s) — configure a atividade e gere no final.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {alunosLote.length > 0 ? (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: cores.text, margin: "0 0 4px" }}>
                  Disciplina
                </h2>
                <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 20px" }}>
                  A série vem do cadastro de cada aluno. Escolha a disciplina.
                </p>
                <label style={labelStyle}>Disciplina</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[...new Set(Object.values(DISCIPLINAS).flat())].map((d) => (
                    <button key={d} onClick={() => setDisciplina(d)}
                      style={{ ...chipStyle, background: disciplina === d ? "#1F3A3D" : cores.card, color: disciplina === d ? "white" : cores.text, border: disciplina === d ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                      {d}
                    </button>
                  ))}
                </div>
                {disciplina && (
                  <button onClick={() => setStep(2)} style={nextBtnStyle}>Próximo →</button>
                )}
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: cores.text, margin: "0 0 4px" }}>
                  Série e Disciplina
                </h2>
                <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 20px" }}>
                  Selecione o segmento, a série e a disciplina da atividade.
                </p>
                <label style={labelStyle}>Segmento</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {Object.keys(SERIES_OPTIONS).map((seg) => (
                    <button key={seg} onClick={() => { setSegmento(seg); setSerie(""); setDisciplina(""); }}
                      style={{ ...chipStyle, background: segmento === seg ? "#1F3A3D" : cores.card, color: segmento === seg ? "white" : cores.text, border: segmento === seg ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
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
                          style={{ ...chipStyle, background: serie === s ? "#1F3A3D" : cores.card, color: serie === s ? "white" : cores.text, border: serie === s ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
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
                          style={{ ...chipStyle, background: disciplina === d ? "#1F3A3D" : cores.card, color: disciplina === d ? "white" : cores.text, border: disciplina === d ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}` }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {disciplina && (
                  <button onClick={() => setStep(2)} style={nextBtnStyle}>Próximo →</button>
                )}
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: cores.text, margin: "0 0 4px" }}>
              Tema da Atividade
            </h2>
            <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 20px" }}>
              Digite um tema ou escolha uma sugestão abaixo.
            </p>
            <input type="text" placeholder="Ex: Animais do cerrado, Tabuada do 7..." value={tema} onChange={(e) => setTema(e.target.value)} style={inputStyle} />
            {sugestoes.length > 0 && (
              <>
                <label style={{ ...labelStyle, marginTop: 16 }}>Sugestões para {disciplina}</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {sugestoes.map((s) => (
                    <button key={s} onClick={() => setTema(s)}
                      style={{ ...chipStyle, fontSize: 12, background: tema === s ? cores.cardActiveBg : cores.card, border: tema === s ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}`, color: cores.text }}>
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
            <h2 style={{ fontSize: 16, fontWeight: 700, color: cores.text, margin: "0 0 4px" }}>
              Tipos de Questão
            </h2>
            <p style={{ fontSize: 13, color: cores.textSub, margin: "0 0 20px" }}>
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
                      background: ativo ? cores.cardActiveBg : cores.card,
                      border: ativo ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}`,
                      borderBottom: ativo ? `1px solid ${dk ? "#4a3060" : "#D4CCBD"}` : undefined,
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 20, cursor: "pointer" }} onClick={() => toggleTipo(t.id)}>{t.icon}</span>
                      <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: cores.text, cursor: "pointer" }} onClick={() => toggleTipo(t.id)}>{t.label}</span>
                      {ativo ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <select
                            value={tiposOrdem[t.id] || ""}
                            onChange={(e) => setTiposOrdem((prev) => ({ ...prev, [t.id]: Number(e.target.value) || "" }))}
                            style={{
                              width: 50, padding: "3px 2px", borderRadius: 6,
                              border: `1px solid ${dk ? "#4a4a6c" : "#C7BFAE"}`, fontSize: 12, fontWeight: 600,
                              color: tiposOrdem[t.id] ? (dk ? "#7BA896" : "#1F3A3D") : (dk ? "#777" : "#aaa"),
                              background: cores.card, cursor: "pointer", textAlign: "center",
                            }}
                          >
                            <option value="">Nº</option>
                            {[1,2,3,4,5,6,7].map((n) => (
                              <option key={n} value={n}>{n}º</option>
                            ))}
                          </select>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button onClick={() => setQtd(t.id, tipos[t.id] - 1)} style={{
                            width: 28, height: 28, borderRadius: 6, border: `1px solid ${dk ? "#4a4a6c" : "#C7BFAE"}`,
                            background: cores.card, color: dk ? "#7BA896" : "#1F3A3D", fontSize: 16, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>−</button>
                          <span style={{
                            width: 28, textAlign: "center", fontSize: 15, fontWeight: 700, color: dk ? "#7BA896" : "#1F3A3D",
                          }}>{tipos[t.id]}</span>
                          <button onClick={() => setQtd(t.id, tipos[t.id] + 1)} style={{
                            width: 28, height: 28, borderRadius: 6, border: `1px solid ${dk ? "#4a4a6c" : "#C7BFAE"}`,
                            background: cores.card, color: dk ? "#7BA896" : "#1F3A3D", fontSize: 16, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>+</button>
                          </div>
                        </div>
                      ) : (
                        <span onClick={() => toggleTipo(t.id)} style={{
                          width: 22, height: 22, borderRadius: 6, border: `2px solid ${dk ? "#4a4a6c" : "#C7BFAE"}`,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }} />
                      )}
                    </div>
                    {ativo && (
                      <div style={{
                        display: "flex", gap: 5, flexWrap: "wrap", padding: "8px 12px",
                        background: cores.areaSubBg, borderRadius: "0 0 10px 10px",
                        border: "2px solid #1F3A3D", borderTop: "none",
                      }}>
                        <span style={{ fontSize: 11, color: cores.textSub, width: "100%", marginBottom: 2 }}>Área de resposta:</span>
                        {AREAS.map((a) => (
                          <button key={a.id} onClick={() => setTiposArea((prev) => ({
                            ...prev, [t.id]: prev[t.id] === a.id ? "" : a.id
                          }))} style={{
                            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                            cursor: "pointer", transition: "all 0.15s",
                            background: areaAtual === a.id ? "#1F3A3D" : cores.card,
                            color: areaAtual === a.id ? "white" : cores.text,
                            border: areaAtual === a.id ? "1px solid #1F3A3D" : `1px solid ${cores.cardBorder}`,
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
                    border: "2px solid #1F3A3D",
                    background: cores.areaSubBg,
                    fontSize: 13,
                  }}
                />
              </div>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 20, padding: "12px 14px",
              background: cores.card, borderRadius: 10, border: `2px solid ${cores.cardBorder}`,
            }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: cores.text }}>
                Incluir gabarito para o professor?
              </span>
              <button onClick={() => setGabarito(!gabarito)} style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: gabarito ? "#1F3A3D" : "#C7BFAE",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: cores.card,
                  position: "absolute", top: 3, left: gabarito ? 25 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 10, padding: "12px 14px",
              background: cores.card, borderRadius: 10, border: `2px solid ${cores.cardBorder}`,
            }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: cores.text }}>
                Progressão de dificuldade?
              </span>
              <button onClick={() => setProgressao(!progressao)} style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: progressao ? "#1F3A3D" : "#C7BFAE",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: cores.card,
                  position: "absolute", top: 3, left: progressao ? 25 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>
            {progressao && (
              <div style={{
                display: "flex", gap: 8, padding: "10px 14px", marginTop: 4,
                background: cores.areaSubBg, borderRadius: 10, border: `1px solid ${cores.cardBorder}`,
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
                        border: `1px solid ${dk ? "#4a4a6c" : "#C7BFAE"}`, textAlign: "center",
                        fontSize: 13, fontWeight: 700, color: n.color, background: cores.card,
                      }}
                    />
                    <span style={{ fontSize: 11, color: cores.textSub }}>% {n.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 10, padding: "12px 14px",
              background: cores.card, borderRadius: 10, border: `2px solid ${cores.cardBorder}`,
            }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: cores.text }}>
                Letra MAIÚSCULA
              </span>
              <button onClick={() => setLetraMaiuscula(!letraMaiuscula)} style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: letraMaiuscula ? "#1F3A3D" : "#C7BFAE",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: cores.card,
                  position: "absolute", top: 3, left: letraMaiuscula ? 25 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 10, padding: "12px 14px",
              background: cores.card, borderRadius: 10, border: `2px solid ${cores.cardBorder}`,
            }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: cores.text }}>
                Texto em <strong>negrito</strong>
              </span>
              <button onClick={() => setNegrito(!negrito)} style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: negrito ? "#1F3A3D" : "#C7BFAE",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: cores.card,
                  position: "absolute", top: 3, left: negrito ? 25 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            {/* Modo Prova */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginTop: 10, padding: "12px 14px",
              background: cores.card, borderRadius: 10, border: `2px solid ${cores.cardBorder}`,
            }}>
              <span style={{ fontSize: 14, flex: 1, fontWeight: 500, color: cores.text }}>
                📝 Modo Prova
              </span>
              <button onClick={() => setModoProva(!modoProva)} style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: modoProva ? "#1F3A3D" : "#C7BFAE",
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 10, background: cores.card,
                  position: "absolute", top: 3, left: modoProva ? 25 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>
            {modoProva && (
              <div style={{
                display: "flex", gap: 10, padding: "10px 14px", marginTop: 4,
                background: cores.areaSubBg, borderRadius: 10, border: `1px solid ${cores.cardBorder}`,
                flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 11, color: cores.textSub, display: "block", marginBottom: 4 }}>Valor por questão</label>
                  <input type="text" placeholder="Ex: 1,0" value={valorQuestao}
                    onChange={(e) => setValorQuestao(e.target.value)}
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ fontSize: 11, color: cores.textSub, display: "block", marginBottom: 4 }}>Tempo estimado (min)</label>
                  <input type="text" placeholder="Ex: 45" value={tempoEstimado}
                    onChange={(e) => setTempoEstimado(e.target.value)}
                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} />
                </div>
              </div>
            )}

            {/* Necessidades do aluno — só no modo individual */}
            {alunosLote.length === 0 && (
            <>
            <label style={{ ...labelStyle, marginTop: 20 }}>Necessidades do aluno (opcional)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Dificuldade de leitura",
                "TDAH",
                "TEA (Transtorno do Espectro Autista)",
                "Deficiência intelectual",
                "Alfabetização em processo",
                "Comandos mais curtos",
                "Outro",
              ].map((nec) => {
                const selecionado = necessidades.includes(nec);
                return (
                  <button key={nec} onClick={() => {
                    setNecessidades((prev) =>
                      prev.includes(nec) ? prev.filter((n) => n !== nec) : [...prev, nec]
                    );
                    if (nec === "Outro" && necessidades.includes("Outro")) setOutraNecessidade("");
                  }} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", borderRadius: 10, cursor: "pointer",
                    background: selecionado ? cores.cardActiveBg : cores.card,
                    border: selecionado ? "2px solid #1F3A3D" : `2px solid ${cores.cardBorder}`,
                    fontSize: 13, color: cores.text, textAlign: "left", transition: "all 0.15s",
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 5,
                      border: selecionado ? "none" : `2px solid ${dk ? "#4a4a6c" : "#C7BFAE"}`,
                      background: selecionado ? "#1F3A3D" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {selecionado ? "✓" : ""}
                    </span>
                    <span style={{ fontWeight: 500 }}>{nec}</span>
                  </button>
                );
              })}
            </div>
            {necessidades.includes("Outro") && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Descreva a necessidade do aluno..."
                  value={outraNecessidade}
                  onChange={(e) => setOutraNecessidade(e.target.value)}
                  style={{
                    ...inputStyle,
                    border: "2px solid #1F3A3D",
                    background: cores.areaSubBg,
                    fontSize: 13,
                  }}
                />
              </div>
            )}
            </>
            )}

            {error && <div style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={backBtnStyle}>← Voltar</button>
              {alunosLote.length === 0 && (
                <button onClick={gerarAtividade} disabled={loading || loteGerando}
                  style={{ ...nextBtnStyle, marginTop: 0, flex: 1, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "⏳ Gerando atividade..." : "✨ Gerar Atividade"}
                </button>
              )}
            </div>

            {/* Gerar em lote */}
            {alunosLote.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: cores.textSub, marginBottom: 8 }}>
                  🚀 {alunosLote.length} aluno(s) selecionado(s) no lote
                  {loteGerando && ` — ${lotePorcentagem}%`}
                </div>
                {loteGerando && (
                  <div style={{ height: 6, borderRadius: 3, background: cores.cardBorder, marginBottom: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, background: "#1F3A3D", width: `${lotePorcentagem}%`, transition: "width 0.3s" }} />
                  </div>
                )}
                <button onClick={gerarEmLote} disabled={loading || loteGerando}
                  style={{ ...nextBtnStyle, marginTop: 0, background: "#1F3A3D", color: "#fff", opacity: loteGerando ? 0.7 : 1 }}>
                  {loteGerando ? `⏳ Gerando... ${lotePorcentagem}%` : `🚀 Gerar para ${alunosLote.length} alunos`}
                </button>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: "center", marginTop: 20, padding: 20, background: cores.card, borderRadius: 12, border: `1px solid ${cores.cardBorder}` }}>
                <div style={{ fontSize: 32, marginBottom: 8, animation: "pulse 1.5s infinite" }}>🤖</div>
                <div style={{ fontSize: 13, color: cores.textSub }}>
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
              <span style={{ background: dk ? "#2E3530" : "#E1EDE9", color: dk ? "#7BA896" : "#1F3A3D", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{serie}</span>
              <span style={{ background: dk ? "#2E2540" : "#f0e8f8", color: dk ? "#B88FD0" : "#5b2580", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{disciplina}</span>
              <span style={{ background: dk ? "#3A3020" : "#fff7d6", color: dk ? "#D4A84A" : "#7a5700", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{tema}</span>
            </div>
            <div style={{
              background: "#fff", padding: "28px 24px", borderRadius: 12,
              border: "1px solid #ddd", fontSize: 14, lineHeight: 1.7,
              color: "#222", whiteSpace: "pre-wrap", boxShadow: dk ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
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
      )}
    </div>
  );
}

