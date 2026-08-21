import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const SERIES_OPTIONS = {
  "Educação Infantil": ["Infantil I", "Infantil II", "Infantil III"],
  "Fundamental I": ["1º ano", "2º ano", "3º ano", "4º ano", "5º ano"],
  "Fundamental II": ["6º ano", "7º ano", "8º ano", "9º ano"],
};

const DISCIPLINAS = {
  "Educação Infantil": ["Linguagem", "Matemática", "Natureza e Sociedade", "Artes", "Movimento"],
  "Fundamental I": ["Português", "Matemática", "Ciências", "História", "Geografia", "Artes", "Ed. Física", "Inglês", "Espanhol"],
  "Fundamental II": ["Português", "Matemática", "Ciências", "História", "Geografia", "Artes", "Ed. Física", "Inglês", "Espanhol"],
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
  "Espanhol": ["Saludos", "Colores y números", "Animales", "La familia", "Los alimentos", "El cuerpo humano"],
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
  const [buscaAluno, setBuscaAluno] = useState("");

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

    const prompt = `Você é um especialista em educação do Colégio Gênesis Life, em Osasco-SP. Gere uma atividade escolar em formato JSON.

SÉRIE: ${proAlunoSelecionado?.serie || proSerie}
DISCIPLINA: ${proDisciplina}
TEMA: ${proTema}
QUANTIDADE DE QUESTÕES: ${proQtdQuestoes}
DIFICULDADE: ${proDificuldade}
TIPO DE ATIVIDADE: ${proTipoAtividade}
ÁREA DE RESPOSTA: ${proAreaResposta}
${proGabarito ? "INCLUIR GABARITO" : "SEM GABARITO"}
MÁXIMO DE IMAGENS: ${maxImgs}
ESTILO DAS IMAGENS: ${proEstiloImagem}
${proAlunoSelecionado ? `
PERFIL DO ALUNO:
Nome: ${proAlunoSelecionado.nome}
Série: ${proAlunoSelecionado.serie}
Necessidades: ${(proAlunoSelecionado.necessidades || []).join(", ")}
Observações: ${proAlunoSelecionado.observacoes || ""}
${proAlunoSelecionado.pei_resumo ? `PEI: ${proAlunoSelecionado.pei_resumo}` : ""}
Use TODAS essas informações para personalizar a atividade.` : ""}
${proNecessidades.length > 0 ? `
ADAPTAÇÕES ESPECIAIS — adapte a atividade considerando:
${proNecessidades.map(n => `- ${n}`).join("\n")}

Orientações:
- Dificuldade de leitura: enunciados curtos, palavras simples, priorizar visual.
- TDAH: questões diretas, uma instrução por vez, variar tipos.
- TEA: comandos literais, evitar figuras de linguagem, roteiro previsível, apoio visual.
- Deficiência intelectual: reduzir complexidade, imagens de apoio, linguagem concreta.
- Alfabetização em processo: letras maiúsculas, frases curtas, apoio de imagem.
- Comandos mais curtos: uma ação por enunciado.
Aplique APENAS as relevantes.` : ""}

REGRAS IMPORTANTES:
1. SEMPRE comece com um TEXTO BASE sobre o tema. Esse texto é o CORAÇÃO da atividade — TODAS as respostas de TODAS as questões devem ser encontradas nele.
2. Questões de ALTERNATIVAS: respostas que o aluno encontra no texto base. EXATAMENTE 3 opções: A, B e C.
3. Questões de COMPLETE: frases retiradas ou baseadas no texto base.
4. Questões de RELACIONE/LIGUE/ASSOCIAÇÃO: informações presentes no texto base.
5. NENHUMA questão pode exigir conhecimento que não esteja no texto base (exceto "Desenhe" e criatividade).
6. Enunciados objetivos, claros e curtos, adequados à faixa etária.
7. Adapte a linguagem e complexidade à série.
8. Use linguagem acolhedora e motivadora.
9. Numere todas as questões sequencialmente.
10. IMAGENS: Marque EXATAMENTE ${maxImgs} questão(ões) com "precisaImagem": true. Para cada uma, escreva um "promptImagem" detalhado EM PORTUGUÊS. Inclua "com textos em português" no prompt. As outras: "precisaImagem": false e "promptImagem": null.

Responda APENAS com JSON válido, sem markdown, neste formato:
{
  "textoBase": "texto introdutório sobre o tema com todas as informações para responder as questões...",
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
      "promptImagem": "Ilustração didática do sistema solar mostrando o sol no centro, com textos em português, fundo branco",
      "alternativas": null,
      "resposta": "estrela"
    }
  ],
  "gabarito": ${proGabarito ? '"gabarito completo com todas as respostas"' : "null"},
  "dicasProfessor": "Dicas e observações para o professor: como aplicar esta atividade, adaptações sugeridas, pontos de atenção sobre o aluno."
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
          text = text.replace(/```json\s*/g, "").replace(/
