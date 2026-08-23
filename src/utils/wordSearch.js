const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function normalizeWordSearchWord(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
}

function hashText(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededLetter(seed, row, column) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const value = (seed + Math.imul(row + 1, 2654435761) + Math.imul(column + 1, 1597334677)) >>> 0;
  return alphabet[value % alphabet.length];
}

export function buildWordSearch(words, requestedSize) {
  const normalizedWords = [...new Set((words || []).map(normalizeWordSearchWord).filter((word) => word.length >= 2 && word.length <= 16))]
    .slice(0, 12);
  const longest = Math.max(0, ...normalizedWords.map((word) => word.length));
  const size = Math.max(8, Math.min(16, Number(requestedSize) || Math.max(longest + 2, 10)));
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  const seed = hashText(normalizedWords.join("|"));

  normalizedWords.sort((a, b) => b.length - a.length).forEach((word, wordIndex) => {
    let placed = false;
    const candidates = [];
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        for (let directionIndex = 0; directionIndex < DIRECTIONS.length; directionIndex += 1) {
          candidates.push({ row, column, directionIndex });
        }
      }
    }
    candidates.sort((a, b) => {
      const scoreA = hashText(`${seed}|${wordIndex}|${a.row}|${a.column}|${a.directionIndex}`);
      const scoreB = hashText(`${seed}|${wordIndex}|${b.row}|${b.column}|${b.directionIndex}`);
      return scoreA - scoreB;
    });
    for (const candidate of candidates) {
      if (placed) break;
      const { row, column } = candidate;
      const direction = DIRECTIONS[candidate.directionIndex];
      const endRow = row + direction[0] * (word.length - 1);
      const endColumn = column + direction[1] * (word.length - 1);
      if (endRow < 0 || endRow >= size || endColumn < 0 || endColumn >= size) continue;
      const fits = [...word].every((letter, index) => {
        const current = grid[row + direction[0] * index][column + direction[1] * index];
        return !current || current === letter;
      });
      if (!fits) continue;
      [...word].forEach((letter, index) => {
        grid[row + direction[0] * index][column + direction[1] * index] = letter;
      });
      placed = true;
    }
  });

  return grid.map((row, rowIndex) => row.map((letter, columnIndex) => letter || seededLetter(seed, rowIndex, columnIndex)));
}

export function normalizeProActivity(activity) {
  return {
    ...activity,
    questoes: (activity?.questoes || []).map((question) => {
      const words = question?.cacaPalavras?.palavras;
      if (!Array.isArray(words) || words.length === 0) return question;
      return {
        ...question,
        cacaPalavras: {
          ...question.cacaPalavras,
          palavras: [...new Set(words.map(normalizeWordSearchWord).filter((word) => word.length >= 2 && word.length <= 16))],
          grade: buildWordSearch(words, question.cacaPalavras.tamanho),
        },
      };
    }),
  };
}
