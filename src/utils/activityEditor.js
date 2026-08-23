const QUESTION_LINE = /^(\s*(?:#{1,6}\s*)?(?:\*\*)?(?:(?:quest[aã]o)\s*)?)(\d+)(\s*[.)-]\s*.*)$/i;
const TEACHER_SECTION = /^\s*(?:#{1,6}\s*)?(?:📋|💡|📩)?\s*(?:gabarito|dicas|material do professor|recado para o respons[aá]vel)/i;

export function parseActivityMarkdown(markdown) {
  const lines = String(markdown || "").split("\n");
  const questionStarts = [];
  let tailStart = lines.length;

  lines.forEach((line, index) => {
    if (QUESTION_LINE.test(line)) questionStarts.push(index);
    if (questionStarts.length > 0 && tailStart === lines.length && TEACHER_SECTION.test(line)) tailStart = index;
  });

  if (questionStarts.length === 0) return { intro: lines.join("\n"), questions: [], tail: "" };

  const questions = questionStarts.map((start, index) => {
    const nextQuestion = questionStarts[index + 1] ?? tailStart;
    return lines.slice(start, Math.min(nextQuestion, tailStart)).join("\n").trim();
  }).filter(Boolean);

  return {
    intro: lines.slice(0, questionStarts[0]).join("\n").trim(),
    questions,
    tail: lines.slice(tailStart).join("\n").trim(),
  };
}

export function renumberQuestion(question, number) {
  const lines = String(question || "").split("\n");
  const index = lines.findIndex((line) => QUESTION_LINE.test(line));
  if (index === -1) return `## Questão ${number}\n\n${String(question || "").trim()}`;
  lines[index] = lines[index].replace(QUESTION_LINE, (_match, prefix, _oldNumber, suffix) => `${prefix}${number}${suffix}`);
  return lines.join("\n");
}

export function composeActivityMarkdown(editor) {
  const questions = (editor.questions || []).map((question, index) => renumberQuestion(question, index + 1));
  return [editor.intro, ...questions, editor.tail].filter((part) => String(part || "").trim()).join("\n\n");
}
