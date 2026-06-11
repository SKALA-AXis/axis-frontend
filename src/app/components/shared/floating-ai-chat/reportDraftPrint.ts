import type { AssistantReportDraft } from '../../../../features/assistant/model/assistant';

export function printReportDraft(reportDraft: AssistantReportDraft) {
  const printWindow = window.open('', '_blank', 'width=900,height=1200');
  if (!printWindow) {
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(buildReportDraftPrintHtml(reportDraft));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 180);
  return true;
}

function buildReportDraftPrintHtml(reportDraft: AssistantReportDraft) {
  const title = reportDraft.title || 'AXIS 보고서 초안';
  const sections = (reportDraft.sections ?? []).filter((section) => section.title || section.body);
  const printableSections = sections.filter((section) => !/목차|구성/.test(section.title ?? ''));
  const summarySection = printableSections[0] ?? sections[0];
  const generatedAt = new Date().toLocaleString('ko-KR');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1f1f24; background: #f4f1ed; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 18mm 18mm; background: #fffdfb; }
    .eyebrow { margin: 0 0 8px; color: #c2411d; font-size: 11px; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }
    h1 { margin: 0; color: #1f1f24; font-size: 25px; line-height: 1.25; }
    .meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; padding-bottom: 18px; border-bottom: 2px solid #e7ded4; color: #6f6a66; font-size: 11px; }
    .overview { display: grid; grid-template-columns: 0.9fr 1.4fr; gap: 14px; margin: 18px 0 16px; }
    .panel { border: 1px solid #e7ded4; background: #fff8f2; padding: 12px; page-break-inside: avoid; }
    .panel h2, .section h2 { margin: 0 0 8px; color: #c2411d; font-size: 14px; line-height: 1.35; }
    .toc { margin: 0; padding-left: 18px; color: #3f3b38; font-size: 11px; line-height: 1.7; }
    .summary { margin: 0; white-space: pre-wrap; color: #33302e; font-size: 12px; line-height: 1.65; }
    .section { border-top: 1px solid #e7ded4; padding: 13px 0 12px; page-break-inside: avoid; }
    .section-number { display: inline-block; min-width: 24px; margin-right: 6px; color: #8f8176; font-size: 11px; font-weight: 800; }
    .section-body { margin: 0; white-space: pre-wrap; color: #292725; font-size: 12.5px; line-height: 1.62; }
    .footer { margin-top: 18px; border-top: 1px solid #e7ded4; padding-top: 9px; color: #8f8176; font-size: 10px; }
    @media print { body { background: #fff; } .page { width: auto; min-height: auto; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <article class="page">
    <header>
      <p class="eyebrow">AXIS Report Draft</p>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        <span>생성 시각: ${escapeHtml(generatedAt)}</span>
        <span>본문 섹션: ${printableSections.length}개</span>
        <span>출처: AXIS 챗봇 응답</span>
      </div>
    </header>
    <div class="overview">
      <section class="panel">
        <h2>목차</h2>
        ${reportTocHtml(printableSections)}
      </section>
      <section class="panel">
        <h2>요약</h2>
        <p class="summary">${escapeHtml(summarySection?.body || '보고서 요약을 생성하지 못했습니다.')}</p>
      </section>
    </div>
    <main>
      ${printableSections.map((section, index) => reportSectionHtml(section, index)).join('')}
    </main>
    <footer class="footer">본 문서는 AXIS 챗봇이 생성한 보고서 초안입니다. 외부 공유 전 원문 근거와 수치를 확인하세요.</footer>
  </article>
</body>
</html>`;
}

function reportTocHtml(sections: Array<{ title?: string; body?: string }>) {
  if (sections.length === 0) {
    return '<p class="summary">목차를 생성하지 못했습니다.</p>';
  }
  return `
    <ol class="toc">
      ${sections.map((section) => `<li>${escapeHtml(section.title || '본문')}</li>`).join('')}
    </ol>
  `;
}

function reportSectionHtml(section: { title?: string; body?: string }, index: number) {
  return `
    <section class="section">
      <h2><span class="section-number">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(section.title || '본문')}</h2>
      <p class="section-body">${escapeHtml(section.body || '')}</p>
    </section>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
