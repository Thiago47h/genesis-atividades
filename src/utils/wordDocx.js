import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  HeightRule,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const COLORS = {
  text: "222222",
  muted: "666666",
  border: "9A9A9A",
  lightBorder: "D0D0D0",
  light: "F7F7F7",
};

const thinBorder = { style: BorderStyle.SINGLE, size: 6, color: COLORS.border };
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function text(value, options = {}) {
  return new TextRun({ text: String(value || ""), font: "Arial", size: 22, color: COLORS.text, ...options });
}

function paragraph(value = "", options = {}) {
  return new Paragraph({
    children: Array.isArray(value) ? value : [text(value)],
    spacing: { after: 120, line: 300 },
    ...options,
  });
}

function markdownRuns(value) {
  const runs = [];
  const source = String(value || "");
  const parts = source.split(/(\*\*.*?\*\*)/g).filter(Boolean);
  for (const part of parts) {
    const bold = part.startsWith("**") && part.endsWith("**");
    runs.push(text(bold ? part.slice(2, -2) : part, { bold }));
  }
  return runs.length ? runs : [text("")];
}

function markdownToParagraphs(markdown, { includeTeacherContent = true } = {}) {
  let source = String(markdown || "");
  if (!includeTeacherContent) {
    source = source.split(/\n##\s*(?:📋\s*)?Gabarito/i)[0];
    source = source.split(/\n##\s*(?:💡\s*)?Dicas/i)[0];
  }

  return source.split("\n").map((rawLine) => {
    const line = rawLine.trimEnd();
    if (!line.trim()) return new Paragraph({ spacing: { after: 80 } });
    if (/^---+$/.test(line.trim())) {
      return new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.lightBorder } },
        spacing: { before: 80, after: 140 },
      });
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length === 1 ? HeadingLevel.HEADING_1 :
        heading[1].length === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      return new Paragraph({
        heading: level,
        children: markdownRuns(heading[2]),
        spacing: { before: 160, after: 100 },
      });
    }

    return new Paragraph({
      children: markdownRuns(line),
      spacing: { after: 100, line: 300 },
    });
  });
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function fetchImageBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar o logo.");
  return new Uint8Array(await response.arrayBuffer());
}

function imageType(mime = "image/png") {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("gif")) return "gif";
  return "png";
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawBox(context, x, y, width, height, { fill = "#FFFFFF", radius = 22, lineWidth = 3 } = {}) {
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = lineWidth;
  context.strokeStyle = "#929292";
  context.stroke();
}

function drawCenteredText(context, value, x, y, width, {
  fontSize = 38,
  fontWeight = 700,
  color = "#222222",
  italic = false,
} = {}) {
  const fontStyle = italic ? "italic " : "";
  let size = fontSize;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  do {
    context.font = `${fontStyle}${fontWeight} ${size}px Arial, sans-serif`;
    if (context.measureText(value).width <= width - 36 || size <= 22) break;
    size -= 2;
  } while (size > 22);
  context.fillText(value, x + width / 2, y);
}

function drawField(context, label, x, y, width, height, { centered = false } = {}) {
  drawBox(context, x, y, width, height, { radius: 18, lineWidth: 3 });
  context.fillStyle = "#222222";
  context.font = "700 25px Arial, sans-serif";
  context.textBaseline = "top";
  context.textAlign = centered ? "center" : "left";
  context.fillText(label, centered ? x + width / 2 : x + 22, y + 18);
}

async function logoImageFromBytes(bytes) {
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  try {
    const image = new Image();
    image.src = blobUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    return image;
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function createHeaderImage({ logoBytes, title, subtitle = "", showGrade = false }) {
  const canvas = window.document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 520;
  const context = canvas.getContext("2d");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const gap = 14;
  const left = 18;
  const right = 1582;
  const logoWidth = 290;
  const titleX = left + logoWidth + gap;
  const titleWidth = right - titleX;

  drawBox(context, left, 18, logoWidth, 222, { radius: 28, lineWidth: 3 });
  drawBox(context, titleX, 18, titleWidth, 102, { radius: 24, lineWidth: 3 });
  drawBox(context, titleX, 134, titleWidth, 106, { radius: 24, lineWidth: 3 });

  const logo = await logoImageFromBytes(logoBytes);
  const maxLogoWidth = 215;
  const maxLogoHeight = 155;
  const scale = Math.min(maxLogoWidth / logo.width, maxLogoHeight / logo.height);
  const logoDrawWidth = logo.width * scale;
  const logoDrawHeight = logo.height * scale;
  context.drawImage(
    logo,
    left + (logoWidth - logoDrawWidth) / 2,
    18 + (222 - logoDrawHeight) / 2,
    logoDrawWidth,
    logoDrawHeight,
  );

  drawCenteredText(context, "COLÉGIO GÊNESIS LIFE", titleX, 69, titleWidth, { fontSize: 42, fontWeight: 700 });
  drawCenteredText(context, String(title || "").toUpperCase(), titleX, subtitle ? 168 : 187, titleWidth, { fontSize: 34, fontWeight: 700 });
  if (subtitle) {
    drawCenteredText(context, subtitle, titleX, 212, titleWidth, { fontSize: 24, fontWeight: 400, color: "#555555", italic: true });
  }

  const rowY = 258;
  const rowHeight = 104;
  const dateWidth = 500;
  const classWidth = 350;
  drawField(context, "Data: ____/____/________", left, rowY, dateWidth, rowHeight);
  drawField(context, "Turma:", left + dateWidth + gap, rowY, classWidth, rowHeight);
  drawField(context, "Prof.ª:", left + dateWidth + classWidth + gap * 2, rowY, right - (left + dateWidth + classWidth + gap * 2), rowHeight);

  const studentY = 380;
  const studentHeight = 116;
  const numberWidth = 190;
  const gradeWidth = showGrade ? 240 : 0;
  const nameWidth = right - left - numberWidth - gradeWidth - gap * (showGrade ? 2 : 1);
  drawField(context, "Nome:", left, studentY, nameWidth, studentHeight);
  drawField(context, "Nº:", left + nameWidth + gap, studentY, numberWidth, studentHeight, { centered: true });
  if (showGrade) {
    drawField(context, "Nota:", left + nameWidth + numberWidth + gap * 2, studentY, gradeWidth, studentHeight, { centered: true });
  }

  const headerBlob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao criar o cabeçalho.")), "image/png");
  });
  return new Uint8Array(await headerBlob.arrayBuffer());
}

async function createHeader({ logoBytes, title, subtitle = "", showGrade = false }) {
  const headerImage = await createHeaderImage({ logoBytes, title, subtitle, showGrade });
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({
        data: headerImage,
        type: "png",
        transformation: { width: 685, height: 223 },
        altText: { title: "Cabeçalho", description: "Cabeçalho da atividade", name: "Cabeçalho" },
      })],
      spacing: { after: 160 },
    }),
  ];
}

function answerArea(kind = "media") {
  if (kind === "linhas") {
    return [1, 2, 3].map(() => new Paragraph({
      children: [text("")],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.lightBorder } },
      spacing: { before: 120, after: 100 },
    }));
  }

  const height = kind === "pequena" ? 450 : kind === "grande" || kind === "quadro" ? 1550 : 900;
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [new TableRow({
      height: { value: height, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.lightBorder },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.lightBorder },
          left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.lightBorder },
          right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.lightBorder },
        },
        children: [paragraph("")],
      })],
    })],
  }), new Paragraph({ spacing: { after: 100 } })];
}

function createDocument(children) {
  return new Document({
    creator: "Colégio Gênesis Life",
    title: "Atividade escolar",
    description: "Atividade gerada pelo Gênesis Atividades",
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22, color: COLORS.text } },
        heading1: { run: { font: "Arial", size: 30, bold: true, color: COLORS.text } },
        heading2: { run: { font: "Arial", size: 26, bold: true, color: COLORS.text } },
        heading3: { run: { font: "Arial", size: 23, bold: true, color: COLORS.text } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 850, right: 850, bottom: 850, left: 850 },
        },
      },
      children,
    }],
  });
}

function safeFilename(value) {
  return String(value || "atividade-genesis")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function saveDocx(document, filename) {
  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const link = documentGlobal().createElement("a");
  link.href = url;
  link.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  documentGlobal().body.appendChild(link);
  link.click();
  documentGlobal().body.removeChild(link);
  URL.revokeObjectURL(url);
}

function documentGlobal() {
  return window.document;
}

export async function downloadStandardActivityDocx({
  resultado,
  disciplina,
  tema,
  modoProva = false,
  tempoEstimado = "",
  includeTeacherContent = true,
}) {
  const logoBytes = await fetchImageBytes("/logo-genesis.png");
  const header = await createHeader({
      logoBytes,
      title: modoProva ? `Prova de ${disciplina}` : `Atividade Adaptada de ${disciplina}`,
      subtitle: tema,
      showGrade: modoProva,
    });
  const children = [...header];

  if (modoProva && tempoEstimado) {
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [text(`Tempo estimado: ${tempoEstimado} minutos`, { italics: true, color: COLORS.muted, size: 19 })],
      spacing: { after: 140 },
    }));
  }

  children.push(...markdownToParagraphs(resultado, { includeTeacherContent }));
  const suffix = includeTeacherContent ? "professor" : "aluno";
  const filename = safeFilename(`${modoProva ? "prova" : "atividade"}-${disciplina}-${tema}-${suffix}`);
  await saveDocx(createDocument(children), filename);
}

export async function downloadProActivityDocx({
  resultado,
  imagens = {},
  disciplina,
  tema,
  tiposArea = {},
  includeTeacherContent = true,
}) {
  const logoBytes = await fetchImageBytes("/logo-genesis.png");
  const header = await createHeader({ logoBytes, title: `Atividade PRO de ${disciplina}`, subtitle: tema });
  const children = [
    ...header,
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [text("Leia o texto com atenção:", { bold: true, size: 26 })],
      spacing: { after: 100 },
    }),
    paragraph(resultado?.textoBase || ""),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.lightBorder } },
      spacing: { before: 100, after: 160 },
    }),
  ];

  for (const question of resultado?.questoes || []) {
    children.push(new Paragraph({
      keepNext: true,
      children: [text(`Questão ${question.numero}`, { bold: true, size: 23 })],
      spacing: { before: 150, after: 80 },
    }));

    const generatedImage = imagens[question.numero];
    if (generatedImage?.data) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({
          data: base64ToBytes(generatedImage.data),
          type: imageType(generatedImage.mime),
          transformation: { width: 330, height: 220 },
          altText: { title: `Imagem da questão ${question.numero}`, description: "Imagem educacional", name: "Imagem educacional" },
        })],
        spacing: { after: 100 },
      }));
    }

    children.push(paragraph(question.enunciado || ""));
    if (Array.isArray(question.alternativas)) {
      for (const option of question.alternativas) {
        children.push(new Paragraph({
          children: [text(option)],
          indent: { left: 280 },
          spacing: { after: 80 },
        }));
      }
    } else {
      const area = question.areaResposta || tiposArea[question.tipo] || "media";
      children.push(...answerArea(area));
    }
  }

  if (includeTeacherContent && (resultado?.dicasProfessor || resultado?.gabarito)) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [text("Material do Professor", { bold: true, size: 30 })],
    }));

    if (resultado.dicasProfessor) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [text("Dicas e observações", { bold: true, size: 25 })],
      }));
      children.push(...String(resultado.dicasProfessor).split("\n").map((line) => paragraph(line)));
    }

    if (resultado.gabarito) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [text("Gabarito", { bold: true, size: 25 })],
      }));
      if (typeof resultado.gabarito === "string") {
        children.push(...resultado.gabarito.split("\n").map((line) => paragraph(line)));
      } else if (Array.isArray(resultado.gabarito)) {
        children.push(...resultado.gabarito.map((line) => paragraph(line)));
      } else {
        children.push(...(resultado.questoes || []).map((question) => paragraph(`${question.numero}) ${question.resposta || ""}`)));
      }
    }
  }

  const suffix = includeTeacherContent ? "professor" : "aluno";
  const filename = safeFilename(`atividade-pro-${disciplina}-${tema}-${suffix}`);
  await saveDocx(createDocument(children), filename);
}
