import { briefingFocusTitle, formatInsightItems } from './utils';
import type { BriefingReport } from './types';

export function buildBriefingReportText(briefing: BriefingReport) {
  return [
    `[AXIS ${briefing.label} 브리핑] ${briefing.title}`,
    '',
    '1. Executive Summary',
    briefing.briefingLead,
    '',
    `2. ${briefingFocusTitle}`,
    ...briefing.whatHappenedDigest.map((item, index) => `${index + 1}) ${item}`),
    '',
    '3. 의미와 시사점',
    ...formatInsightItems(briefing.meaning).map((item, index) => `${index + 1}) ${item}`),
    '',
    '4. 벤치마킹 포인트',
    ...formatInsightItems(briefing.benchmark).map((item, index) => `${index + 1}) ${item}`),
  ].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPrintSection(title: string, items: string[]) {
  return `
    <section class="report-section">
      <h2>${escapeHtml(title)}</h2>
      <ol>
        ${items.map((item, index) => `<li><strong>${index + 1}</strong><span>${escapeHtml(item)}</span></li>`).join('')}
      </ol>
    </section>
  `;
}

export function buildBriefingPrintHtml(briefing: BriefingReport) {
  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(briefing.title)}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #f7f1e8;
          color: #1a1a1f;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .page {
          min-height: 100vh;
          background: #ffffff;
          border: 1px solid #eadfce;
          padding: 32px;
        }
        .kicker {
          color: #dc5a24;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        h1 {
          margin: 10px 0 0;
          font-size: 30px;
          line-height: 1.18;
          letter-spacing: -0.04em;
        }
        .lead {
          margin: 18px 0 0;
          padding: 18px;
          border: 1px solid #eadfce;
          border-left: 5px solid #dc5a24;
          border-radius: 10px;
          background: #fff8ef;
          font-size: 16px;
          font-weight: 650;
          line-height: 1.75;
        }
        .report-section {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #eadfce;
        }
        .report-section h2 {
          margin: 0;
          font-size: 17px;
          letter-spacing: -0.02em;
        }
        ol {
          display: grid;
          gap: 9px;
          margin: 14px 0 0;
          padding: 0;
          list-style: none;
        }
        li {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 9px;
          padding: 11px 12px;
          border: 1px solid #efe5d9;
          border-radius: 9px;
          background: #fffdf9;
          font-size: 13px;
          line-height: 1.65;
        }
        li strong { color: #b8451a; }
        .footer {
          margin-top: 28px;
          color: #77706a;
          font-size: 11px;
          text-align: right;
        }
        @media print {
          body { background: #ffffff; }
          .page { border: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      <main class="page">
        <p class="kicker">AXIS ${escapeHtml(briefing.label)} briefing</p>
        <h1>${escapeHtml(briefing.title)}</h1>
        <p class="lead">${escapeHtml(briefing.briefingLead)}</p>
        ${renderPrintSection(briefingFocusTitle, briefing.whatHappenedDigest)}
        ${renderPrintSection('의미와 시사점', formatInsightItems(briefing.meaning))}
        ${renderPrintSection('벤치마킹 포인트', formatInsightItems(briefing.benchmark))}
        <p class="footer">AXIS 브리핑 리포트 · ${escapeHtml(briefing.window)}</p>
      </main>
    </body>
  </html>`;
}
