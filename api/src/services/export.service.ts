import PDFDocument from "pdfkit";
import { addMoney, toMoney } from "@fintrack/shared";
import { prisma } from "../lib/prisma.js";
import { formatDateOnly } from "../lib/utils.js";

/** Matches web `--primary: 224 41% 30%` (navy-slate) */
const PRIMARY = "#2d3f6c";
/** Darker shade for table header row */
const PRIMARY_DARK = "#212e4f";
const TEXT_MUTED = "#71717a";
const ROW_ALT = "#f8fafc";
const BORDER = "#e4e4e7";
const PDF_MARGIN = 48;
const PDF_PAGE_WIDTH = 595.28;
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN * 2;

interface ExportContext {
  user: { currency: string };
  startDate: Date;
  endDate: Date;
  transactions: Awaited<ReturnType<typeof fetchTransactions>>;
}

type TransactionRow = ExportContext["transactions"][number];

const TRANSACTION_COLUMNS = [
  { header: "Date", width: 62 },
  { header: "Type", width: 52 },
  { header: "Category", width: 88 },
  { header: "Account", width: 82 },
  { header: "Amount", width: 78, align: "right" as const },
  { header: "Description", width: 133 },
];

function escapeCsv(value: string | null | undefined): string {
  const s = value ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvLine(values: (string | number | boolean | null | undefined)[]): string {
  return values.map((value) => escapeCsv(value == null ? "" : String(value))).join(",");
}

function formatTxType(type: string): string {
  return type === "INCOME" ? "Income" : "Expense";
}

function formatPdfMoney(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (!Number.isFinite(num)) return amount;

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));

  const sign = num < 0 ? "-" : "";
  return `${sign}${currency} ${formatted}`;
}

function formatGeneratedAt(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function formatPeriod(startDate: Date, endDate: Date): string {
  return `${formatDateOnly(startDate)} to ${formatDateOnly(endDate)}`;
}

async function fetchTransactions(userId: string, startDate: Date, endDate: Date) {
  return prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      transactionDate: { gte: startDate, lte: endDate },
    },
    include: {
      account: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
  });
}

async function getExportContext(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<ExportContext> {
  const [user, transactions] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { id: userId },
      select: { currency: true },
    }),
    fetchTransactions(userId, startDate, endDate),
  ]);

  return {
    user,
    startDate,
    endDate,
    transactions,
  };
}

function buildTransactionCsvRows(ctx: ExportContext): string[] {
  const { user, transactions } = ctx;

  return transactions.map((tx) =>
    csvLine([
      formatDateOnly(tx.transactionDate),
      formatTxType(tx.type),
      tx.category.name,
      tx.account.name,
      toMoney(tx.amount.toString()),
      tx.currency,
      tx.description ?? "",
      tx.reference ?? "",
    ]),
  );
}

function buildCsvSections(ctx: ExportContext): string[] {
  const period = formatPeriod(ctx.startDate, ctx.endDate);

  return [
    "FinTrack",
    csvLine(["Report", "Transactions"]),
    csvLine(["Period", period]),
    "",
    csvLine(["Date", "Type", "Category", "Account", "Amount", "Currency", "Description", "Reference"]),
    ...buildTransactionCsvRows(ctx),
  ];
}

interface PdfTableColumn {
  header: string;
  width: number;
  align?: "left" | "right" | "center";
}

function drawPdfTable(
  doc: PDFKit.PDFDocument,
  columns: PdfTableColumn[],
  rows: string[][],
): void {
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const startX = PDF_MARGIN;
  const rowHeight = 22;
  const headerHeight = 26;
  const bottomLimit = doc.page.height - PDF_MARGIN - 28;

  const drawHeader = (y: number) => {
    doc.save();
    doc.rect(startX, y, tableWidth, headerHeight).fill(PRIMARY_DARK);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);

    let x = startX;
    for (const column of columns) {
      doc.text(column.header, x + 6, y + 8, {
        width: column.width - 12,
        align: column.align ?? "left",
      });
      x += column.width;
    }
    doc.restore();
  };

  const drawRow = (cells: string[], y: number, index: number) => {
    doc.save();
    if (index % 2 === 0) {
      doc.rect(startX, y, tableWidth, rowHeight).fill(ROW_ALT);
    }
    doc.rect(startX, y, tableWidth, rowHeight).strokeColor(BORDER).lineWidth(0.5).stroke();

    doc.fillColor("#18181b").font("Helvetica").fontSize(8.5);
    let x = startX;
    columns.forEach((column, columnIndex) => {
      doc.text(cells[columnIndex] ?? "", x + 6, y + 7, {
        width: column.width - 12,
        height: rowHeight - 6,
        ellipsis: true,
        lineBreak: false,
        align: column.align ?? "left",
      });
      x += column.width;
    });
    doc.restore();
  };

  ensurePdfSpace(doc, headerHeight + rowHeight, bottomLimit);
  let y = doc.y;
  drawHeader(y);
  y += headerHeight;

  rows.forEach((cells, index) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = PDF_MARGIN;
      drawHeader(y);
      y += headerHeight;
    }
    drawRow(cells, y, index);
    y += rowHeight;
  });

  doc.y = y + 8;
}

function ensurePdfSpace(doc: PDFKit.PDFDocument, height: number, bottomLimit: number): void {
  if (doc.y + height > bottomLimit) {
    doc.addPage();
    doc.y = PDF_MARGIN;
  }
}

function drawPdfReportHeader(doc: PDFKit.PDFDocument, ctx: ExportContext): void {
  const headerHeight = 76;
  const period = formatPeriod(ctx.startDate, ctx.endDate);
  const rightEdge = PDF_PAGE_WIDTH - PDF_MARGIN;

  doc.save();
  doc.rect(0, 0, PDF_PAGE_WIDTH, headerHeight).fill(PRIMARY);

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text("FinTrack", PDF_MARGIN, 26, {
    lineBreak: false,
  });

  doc.font("Helvetica").fontSize(11);
  const transactionsLabel = "Transactions";
  const transactionsWidth = doc.widthOfString(transactionsLabel);
  doc.text(transactionsLabel, rightEdge - transactionsWidth, 22, { lineBreak: false });

  doc.fontSize(10).fillColor("#e2e8f0");
  const periodWidth = doc.widthOfString(period);
  doc.text(period, rightEdge - periodWidth, 44, { lineBreak: false });

  doc.restore();

  doc.y = headerHeight + 24;
}

function drawPdfFooters(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  const footerY = doc.page.height - 26;
  const leftLabel = "FinTrack · Personal cash-flow tracking";

  for (let page = range.start; page < range.start + range.count; page++) {
    doc.switchToPage(page);
    doc.save();
    doc.strokeColor(BORDER).moveTo(PDF_MARGIN, doc.page.height - 36).lineTo(PDF_PAGE_WIDTH - PDF_MARGIN, doc.page.height - 36).stroke();
    doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(8);
    doc.text(leftLabel, PDF_MARGIN, footerY, { lineBreak: false });

    const pageLabel = `Page ${page + 1} of ${range.count}`;
    const pageLabelWidth = doc.widthOfString(pageLabel);
    doc.text(pageLabel, PDF_PAGE_WIDTH - PDF_MARGIN - pageLabelWidth, footerY, { lineBreak: false });
    doc.restore();
  }
}

function mapTransactionPdfRows(ctx: ExportContext): string[][] {
  const { user, transactions } = ctx;

  return transactions.map((tx: TransactionRow) => [
    formatDateOnly(tx.transactionDate),
    formatTxType(tx.type),
    truncate(tx.category.name, 16),
    truncate(tx.account.name, 14),
    formatPdfMoney(tx.amount.toString(), tx.currency || user.currency),
    truncate(tx.description ?? "—", 24),
  ]);
}

function buildTransactionsPdf(ctx: ExportContext): Promise<Buffer> {
  const { transactions } = ctx;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PDF_MARGIN, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawPdfReportHeader(doc, ctx);

    if (transactions.length === 0) {
      doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(10).text("No transactions in this period.", PDF_MARGIN);
    } else {
      drawPdfTable(doc, TRANSACTION_COLUMNS, mapTransactionPdfRows(ctx));
    }

    drawPdfFooters(doc);
    doc.end();
  });
}

export async function exportTransactionsCsv(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<string> {
  const ctx = await getExportContext(userId, startDate, endDate);
  return `\uFEFF${buildCsvSections(ctx).join("\n")}`;
}

export async function exportAccountsCsv(userId: string): Promise<string> {
  const [user, accounts] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { id: userId },
      select: { name: true, email: true, currency: true, timezone: true },
    }),
    prisma.account.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const generatedAt = new Date();
  const totalOpening = accounts.reduce(
    (sum, account) => addMoney(sum, toMoney(account.openingBalance.toString())),
    "0.00",
  );

  const sections = [
    "FinTrack Personal Finance Report",
    csvLine(["Report Type", "Account Summary"]),
    csvLine(["Prepared For", user.name]),
    csvLine(["Email", user.email]),
    csvLine(["Currency", user.currency]),
    csvLine(["Generated At", formatGeneratedAt(generatedAt, user.timezone)]),
    "",
    "Accounts",
    csvLine(["Name", "Type", "Currency", "Opening Balance", "Active"]),
    ...accounts.map((account) =>
      csvLine([
        account.name,
        account.type,
        account.currency,
        toMoney(account.openingBalance.toString()),
        account.isActive ? "Yes" : "No",
      ]),
    ),
    "",
    "Summary",
    csvLine(["Metric", `Amount (${user.currency})`]),
    csvLine(["Total Accounts", accounts.length]),
    csvLine(["Active Accounts", accounts.filter((account) => account.isActive).length]),
    csvLine(["Total Opening Balance", totalOpening]),
    "",
    "Generated by FinTrack · Personal cash-flow tracking",
  ];

  return `\uFEFF${sections.join("\n")}`;
}

export async function exportTransactionsPdf(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<Buffer> {
  const ctx = await getExportContext(userId, startDate, endDate);
  return buildTransactionsPdf(ctx);
}

export function parseReportDates(startDate: string, endDate: string) {
  return { start: startDate, end: endDate };
}
