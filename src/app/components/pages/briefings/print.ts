/*
 * 작성일: 2026-05-18
 * 작성자: 최종민
 * 변경이력:
 *   2026-05-18 최종민 — 프론트 전면 개편 시 브리핑 리포트 텍스트 생성 로직 추가 및 후속 정리
 *   2026-05-29 안가은 — 브리핑/믹서 페이지 구성 수정 및 글자 크기 조절 반영
 *   2026-06-10 박진 — 챗봇 플로우 연동에 맞춰 수정
 */
import type { BriefingFlowStep, BriefingReport } from './types';

function flowLines(items: readonly BriefingFlowStep[]): string[] {
  return items.map((item, index) => {
    const detailText = item.details.map((detail, detailIndex) => `  - ${detailIndex + 1}. ${detail}`).join('\n');
    return `${index + 1}) ${item.label} — ${item.headline}\n${item.description}\n${detailText}`;
  });
}

export function buildBriefingReportText(
  briefing: BriefingReport,
  focusTitle: string,
  flowSteps: readonly BriefingFlowStep[],
) {
  return [
    `[AXIS ${briefing.label} 브리핑] ${briefing.title}`,
    '',
    '1. Executive Summary',
    briefing.briefingLead,
    '',
    `2. ${focusTitle}`,
    ...briefing.whatHappenedDigest.map((item, index) => `${index + 1}) ${item}`),
    '',
    '3. 해석 흐름',
    ...flowLines(flowSteps),
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

function renderFlowPrintSection(title: string, items: readonly BriefingFlowStep[]) {
  return `
    <section class="report-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="flow-list">
        ${items
          .map(
            (item, index) =>
              `<section class="flow-item">
                <div class="flow-heading">
                  <strong>${index + 1}</strong>
                  <div>
                    <p class="flow-label">${escapeHtml(item.label)}</p>
                    <p><b>${escapeHtml(item.headline)}</b></p>
                  </div>
                </div>
                <p class="flow-description">${escapeHtml(item.description)}</p>
                <ol class="flow-detail-list">
                  ${item.details
                    .map(
                      (detail, detailIndex) =>
                        `<li><strong>${detailIndex + 1}</strong><span>${escapeHtml(detail)}</span></li>`,
                    )
                    .join('')}
                </ol>
              </section>`,
          )
          .join('')}
      </div>
    </section>
  `;
}

export function buildBriefingPrintHtml(
  briefing: BriefingReport,
  focusTitle: string,
  flowSteps: readonly BriefingFlowStep[],
) {
  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(briefing.title)}</title>
      <style>
        @page { size: A4; margin: 26mm 24mm; }
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
          padding: 44px;
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
        .flow-list {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }
        .flow-item {
          border: 1px solid #efe5d9;
          border-radius: 9px;
          background: #fffdf9;
          padding: 12px;
        }
        .flow-heading {
          display: grid;
          grid-template-columns: 26px 1fr;
          gap: 9px;
          align-items: start;
        }
        .flow-label {
          margin: 0 0 4px;
          color: #b8451a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .flow-heading p {
          margin: 0;
          font-size: 13px;
          line-height: 1.65;
        }
        .flow-description {
          margin: 10px 0 0;
          font-size: 13px;
          line-height: 1.7;
        }
        .flow-detail-list {
          margin-top: 10px;
        }
        .footer {
          margin-top: 28px;
          color: #77706a;
          font-size: 11px;
          text-align: right;
        }
        @media print {
          body { background: #ffffff; }
          .page { border: 0; padding: 8mm 6mm; }
        }
      </style>
    </head>
    <body>
      <main class="page">
        <p class="kicker">AXIS ${escapeHtml(briefing.label)} briefing</p>
        <h1>${escapeHtml(briefing.title)}</h1>
        <p class="lead">${escapeHtml(briefing.briefingLead)}</p>
        ${renderPrintSection(focusTitle, briefing.whatHappenedDigest)}
        ${renderFlowPrintSection('해석 흐름', flowSteps)}
        <p class="footer">AXIS 브리핑 리포트 · ${escapeHtml(briefing.window)}</p>
      </main>
    </body>
  </html>`;
}
