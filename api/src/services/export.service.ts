import PDFDocument from "pdfkit";
import { addMoney, toMoney } from "@fintrack/shared";
import { prisma } from "../lib/prisma.js";
import { formatDateOnly } from "../lib/utils.js";
import { getReports } from "./dashboard.service.js";

const BRAND_GREEN = "#16a34a";
const BRAND_DARK = "#15803d";
const TEXT_MUTED = "#71717a";
const ROW_ALT = "#fafafa";
const BORDER = "#e4e4e7";
const PDF_MARGIN = 48;
const PDF_PAGE_WIDTH = 595.28;
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN * 2;

interface ExportContext {
  user: { name: string; email: string; currency: string; timezone: string };
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  transactions: Awaited<ReturnType<typeof fetchTransactions>>;
  report: Awaited<ReturnType<typeof getReports>>;
}

type TransactionRow = ExportContext["transactions"][number];

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

function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
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
  const [user, transactions, report] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { id: userId },
      select: { name: true, email: true, currency: true, timezone: true },
    }),
    fetchTransactions(userId, startDate, endDate),
    getReports(userId, startDate, endDate),
  ]);

  return {
    user,
    startDate,
    endDate,
    generatedAt: new Date(),
    transactions,
    report,
  };
}

function buildCsvSections(ctx: ExportContext): string[] {
  const { user, startDate, endDate, generatedAt, transactions, report } = ctx;
  const period = `${formatDateOnly(startDate)} to ${formatDateOnly(endDate)}`;
  const generated = formatGeneratedAt(generatedAt, user.timezone);

  const sections: string[] = [
    "FinTrack Personal Finance Report",
    csvLine(["Report Type", "Transaction Statement"]),
    csvLine(["Prepared For", user.name]),
    csvLine(["Email", user.email]),
    csvLine(["Period", period]),
    csvLine(["Currency", user.currency]),
    csvLine(["Generated At", generated]),
    "",
    "Summary",
    csvLine(["Metric", `Amount (${user.currency})`]),
    csvLine(["Total Income", toMoney(report.income)]),
    csvLine(["Total Expenses", toMoney(report.expenses)]),
    csvLine(["Net Cash Flow", toMoney(report.net)]),
    csvLine(["Transaction Count", transactions.length]),
    "",
    "Transactions",
    csvLine([
      "#",
      "Date",
      "Type",
      "Category",
      "Account",
      "Amount",
      "Currency",
      "Description",
      "Reference",
    ]),
    ...transactions.map((tx, index) =>
      csvLine([
        index + 1,
        formatDateOnly(tx.transactionDate),
        formatTxType(tx.type),
        tx.category.name,
        tx.account.name,
        toMoney(tx.amount.toString()),
        tx.currency,
        tx.description ?? "",
        tx.reference ?? "",
      ]),
    ),
  ];

  if (report.expenseByCategory.length > 0) {
    sections.push(
      "",
      "Expenses by Category",
      csvLine(["Category", `Amount (${user.currency})`, "Share (%)"]),
      ...report.expenseByCategory.map((row) =>
        csvLine([row.categoryName, toMoney(row.amount), row.percent.toFixed(1)]),
      ),
    );
  }

  if (report.accountReport.length > 0) {
    sections.push(
      "",
      "Account Balances",
      csvLine(["Account", `Balance (${user.currency})`]),
      ...report.accountReport.map((row) => csvLine([row.name, toMoney(row.balance)])),
    );
  }

  sections.push("", "Generated by FinTrack · Personal cash-flow tracking");
  return sections;
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
  options?: { title?: string },
): void {
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const startX = PDF_MARGIN + (PDF_CONTENT_WIDTH - tableWidth) / 2;
  const rowHeight = 22;
  const headerHeight = 26;
  const bottomLimit = doc.page.height - PDF_MARGIN - 28;

  if (options?.title) {
    ensurePdfSpace(doc, 34, bottomLimit);
    doc.fillColor("#18181b").font("Helvetica-Bold").fontSize(11).text(options.title, PDF_MARGIN, doc.y);
    doc.moveDown(0.6);
  }

  const drawHeader = (y: number) => {
    doc.save();
    doc.rect(startX, y, tableWidth, headerHeight).fill(BRAND_DARK);
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
  const { user, startDate, endDate, generatedAt } = ctx;
  const headerHeight = 92;

  doc.save();
  doc.rect(0, 0, PDF_PAGE_WIDTH, headerHeight).fill(BRAND_GREEN);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("FinTrack", PDF_MARGIN, 24);
  doc.font("Helvetica").fontSize(11).text("Personal Finance Report", PDF_MARGIN, 50);
  doc.fontSize(10).text("Transaction Statement", PDF_MARGIN, 66);
  doc.restore();

  doc.y = headerHeight + 18;
  doc.fillColor("#18181b").font("Helvetica-Bold").fontSize(12).text("Report Details", PDF_MARGIN);
  doc.moveDown(0.5);

  const metaRows: [string, string][] = [
    ["Prepared for", user.name],
    ["Email", user.email],
    ["Period", `${formatDateOnly(startDate)} to ${formatDateOnly(endDate)}`],
    ["Currency", user.currency],
    ["Generated", formatGeneratedAt(generatedAt, user.timezone)],
  ];

  doc.font("Helvetica").fontSize(9.5);
  for (const [label, value] of metaRows) {
    doc.fillColor(TEXT_MUTED).text(`${label}:`, PDF_MARGIN, doc.y, { continued: true, width: 90 });
    doc.fillColor("#18181b").text(` ${value}`, { width: PDF_CONTENT_WIDTH - 90 });
    doc.moveDown(0.15);
  }

  doc.moveDown(0.8);
}

function drawPdfSummary(doc: PDFKit.PDFDocument, ctx: ExportContext): void {
  const { user, report, transactions } = ctx;

  doc.fillColor("#18181b").font("Helvetica-Bold").fontSize(12).text("Summary", PDF_MARGIN);
  doc.moveDown(0.5);

  drawPdfTable(
    doc,
    [
      { header: "Metric", width: 220 },
      { header: `Amount (${user.currency})`, width: 140, align: "right" },
    ],
    [
      ["Total Income", formatCurrency(report.income, user.currency)],
      ["Total Expenses", formatCurrency(report.expenses, user.currency)],
      ["Net Cash Flow", formatCurrency(report.net, user.currency)],
      ["Transactions", String(transactions.length)],
    ],
  );

  doc.moveDown(0.6);
}

function drawPdfFooters(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page++) {
    doc.switchToPage(page);
    doc.save();
    doc.strokeColor(BORDER).moveTo(PDF_MARGIN, doc.page.height - 36).lineTo(PDF_PAGE_WIDTH - PDF_MARGIN, doc.page.height - 36).stroke();
    doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(8);
    doc.text("FinTrack · Personal cash-flow tracking", PDF_MARGIN, doc.page.height - 26, {
      width: PDF_CONTENT_WIDTH,
      align: "left",
    });
    doc.text(`Page ${page + 1} of ${range.count}`, PDF_MARGIN, doc.page.height - 26, {
      width: PDF_CONTENT_WIDTH,
      align: "right",
    });
    doc.restore();
  }
}

function buildTransactionsPdf(ctx: ExportContext): Promise<Buffer> {
  const { user, transactions, report } = ctx;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PDF_MARGIN, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawPdfReportHeader(doc, ctx);
    drawPdfSummary(doc, ctx);

    if (report.expenseByCategory.length > 0) {
      drawPdfTable(
        doc,
        [
          { header: "Category", width: 200 },
          { header: "Amount", width: 90, align: "right" },
          { header: "Share", width: 70, align: "right" },
        ],
        report.expenseByCategory.map((row) => [
          truncate(row.categoryName, 28),
          formatCurrency(row.amount, user.currency),
          `${row.percent.toFixed(1)}%`,
        ]),
        { title: "Expenses by Category" },
      );
      doc.moveDown(0.6);
    }

    if (report.accountReport.length > 0) {
      drawPdfTable(
        doc,
        [
          { header: "Account", width: 220 },
          { header: "Balance", width: 140, align: "right" },
        ],
        report.accountReport.map((row) => [
          truncate(row.name, 32),
          formatCurrency(row.balance, user.currency),
        ]),
        { title: "Account Balances" },
      );
      doc.moveDown(0.6);
    }

    if (transactions.length === 0) {
      doc.fillColor(TEXT_MUTED).font("Helvetica").fontSize(10).text("No transactions in this period.", PDF_MARGIN);
    } else {
      drawPdfTable(
        doc,
        [
          { header: "Date", width: 62 },
          { header: "Type", width: 52 },
          { header: "Category", width: 88 },
          { header: "Account", width: 82 },
          { header: "Amount", width: 78, align: "right" },
          { header: "Description", width: 133 },
        ],
        transactions.map((tx: TransactionRow) => [
          formatDateOnly(tx.transactionDate),
          formatTxType(tx.type),
          truncate(tx.category.name, 16),
          truncate(tx.account.name, 14),
          formatCurrency(tx.amount.toString(), tx.currency),
          truncate(tx.description ?? "—", 24),
        ]),
        { title: "Transactions" },
      );
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
