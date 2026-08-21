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

function fieldCell(label, width, { align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    margins: { top: 120, bottom: 220, left: 140, right: 140 },
    verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ alignment: align, children: [text(label, { bold: true, size: 20 })] })],
  });
}

function createHeader({ logoBytes, title, subtitle = "", showGrade = false }) {
  const logo = new ImageRun({
    data: logoBytes,
    type: "png",
    transformation: { width: 86, height: 62 },
    altText: { title: "Logo", description: "Logo do Colégio Gênesis Life", name: "Logo" },
  });

  const identity = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [1900, 7600],
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1900, type: WidthType.DXA },
            borders: cellBorders,
            margins: { top: 120, bottom: 120, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [logo] })],
          }),
          new TableCell({
            width: { size: 7600, type: WidthType.DXA },
            borders: cellBorders,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text("COLÉGIO GÊNESIS LIFE", { bold: true, size: 30 })],
                spacing: { after: 90 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(String(title || "").toUpperCase(), { bold: true, size: 24 })],
                spacing: { after: subtitle ? 50 : 0 },
              }),
              ...(subtitle ? [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(subtitle, { size: 19, color: COLORS.muted, italics: true })],
              })] : []),
            ],
          }),
        ],
      }),
    ],
  });

  const details = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2800, 2200, 4500],
    borders: noBorder,
    rows: [new TableRow({
      children: [
        fieldCell("Data: ____/____/________", 2800),
        fieldCell("Turma:", 2200),
        fieldCell("Prof.ª:", 4500),
      ],
    })],
  });

  const studentWidths = showGrade ? [6500, 1200, 1800] : [8000, 1500];
  const student = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: studentWidths,
    borders: noBorder,
    rows: [new TableRow({
      children: [
        fieldCell("Nome:", studentWidths[0]),
        fieldCell("Nº:", studentWidths[1], { align: AlignmentType.CENTER }),
        ...(showGrade ? [fieldCell("Nota:", studentWidths[2], { align: AlignmentType.CENTER })] : []),
      ],
    })],
  });

  return [
    identity,
    new Paragraph({ spacing: { after: 70 } }),
    details,
    new Paragraph({ spacing: { after: 45 } }),
    student,
    new Paragraph({ spacing: { after: 180 } }),
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
  const children = [
    ...createHeader({
      logoBytes,
      title: modoProva ? `Prova de ${disciplina}` : `Atividade Adaptada de ${disciplina}`,
      subtitle: tema,
      showGrade: modoProva,
    }),
  ];

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
  const children = [
    ...createHeader({ logoBytes, title: `Atividade PRO de ${disciplina}`, subtitle: tema }),
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
