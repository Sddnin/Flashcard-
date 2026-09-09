import type { Flashcard } from "@/types";
import { saveAs } from "file-saver";

export function exportJson(cards: Flashcard[]) {
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: "application/json" });
  saveAs(blob, `flashcards-${Date.now()}.json`);
}

export async function exportPdf(cards: Flashcard[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("FlashEnglish - Danh sach tu vung", 14, 15);

  autoTable(doc, {
    startY: 22,
    head: [["Tu", "Phien am", "Loai tu", "Trinh do", "Nghia", "Vi du"]],
    body: cards.map((c) => [
      c.word,
      c.phonetic,
      c.partOfSpeech,
      c.level,
      c.meaningVi,
      c.examples.map((e) => e.en).join(" | "),
    ]),
    styles: { fontSize: 8, cellWidth: "wrap" },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 15 },
      4: { cellWidth: 40 },
      5: { cellWidth: 60 },
    },
  });

  doc.save(`flashcards-${Date.now()}.pdf`);
}

export async function exportWord(cards: Flashcard[]) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ShadingType,
  } = await import("docx");

  const headerCells = ["Từ", "Phiên âm", "Loại từ", "Trình độ", "Nghĩa", "Ví dụ"];
  const colWidths = [1600, 1600, 1200, 1000, 2600, 3800];

  const headerRow = new TableRow({
    children: headerCells.map(
      (h, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: "E5E7EB" },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
        })
    ),
  });

  const rows = cards.map(
    (c) =>
      new TableRow({
        children: [
          c.word,
          c.phonetic,
          c.partOfSpeech,
          c.level,
          c.meaningVi,
          c.examples.map((e) => `${e.en} (${e.vi})`).join("; "),
        ].map(
          (text, i) =>
            new TableCell({
              width: { size: colWidths[i], type: WidthType.DXA },
              children: [new Paragraph(text)],
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: "FlashEnglish — Danh sách từ vựng", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Tổng số: ${cards.length} từ`, spacing: { after: 200 } }),
          new Table({
            width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
            columnWidths: colWidths,
            rows: [headerRow, ...rows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `flashcards-${Date.now()}.docx`);
}

export async function exportExcel(cards: Flashcard[]) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Flashcards");

  sheet.columns = [
    { header: "Từ", key: "word", width: 20 },
    { header: "Phiên âm", key: "phonetic", width: 18 },
    { header: "Loại từ", key: "pos", width: 14 },
    { header: "Trình độ", key: "level", width: 10 },
    { header: "Nghĩa", key: "meaning", width: 30 },
    { header: "Ví dụ (EN)", key: "exEn", width: 40 },
    { header: "Ví dụ (VI)", key: "exVi", width: 40 },
    { header: "Đồng nghĩa", key: "syn", width: 25 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };

  for (const c of cards) {
    sheet.addRow({
      word: c.word,
      phonetic: c.phonetic,
      pos: c.partOfSpeech,
      level: c.level,
      meaning: c.meaningVi,
      exEn: c.examples.map((e) => e.en).join(" | "),
      exVi: c.examples.map((e) => e.vi).join(" | "),
      syn: (c.synonyms ?? []).join(", "),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `flashcards-${Date.now()}.xlsx`);
}
