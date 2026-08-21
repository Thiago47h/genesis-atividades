import { TIPOS_QUESTAO } from "../constants/education.js";

export function buildPrompt(config) {
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
11. Para "Relacione as colunas" ou "Ligue":
- Crie exatamente duas colunas: COLUNA A e COLUNA B.
- A COLUNA A deve usar números: 1, 2, 3...
- A COLUNA B deve usar letras: A, B, C...
- Use de 3 a 5 itens e mantenha a mesma quantidade nas duas colunas.
- EMBARALHE a COLUNA B para que as respostas corretas NÃO fiquem na mesma linha da COLUNA A.
- NUNCA trace as ligações, coloque setas, destaque respostas ou entregue os pares corretos na atividade.
- Apresente visualmente em duas colunas lado a lado, com bastante espaço entre elas para o aluno traçar linhas.
- Informe as correspondências corretas somente no gabarito, no formato: 1-C, 2-A, 3-B.
12. Numere todas as questões sequencialmente.
13. Use linguagem acolhedora e motivadora.
14. Em questões de alternativas, TODAS as opções (A, B e C) devem ter EXATAMENTE a mesma formatação. NUNCA coloque somente a alternativa correta em negrito, itálico, maiúsculas, entre símbolos ou com qualquer destaque que revele a resposta. Se o negrito geral estiver ativado, todas as alternativas ficam em negrito por igual.

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
