export type ProductGuideStep = {
  title: string;
  body: string;
  anchor: string;
  position: string;
  arrow: string;
  highlight: string;
};

export const viewGuideMap: Record<string, ProductGuideStep[]> = {
  home: [
    { title: '통합 검색', body: '상단 검색창에 Peer사, 키워드, 카드뉴스 제목을 입력합니다. Peer사는 Peer+로, 키워드는 카드뉴스 검색 결과로 바로 연결됩니다.', anchor: '상단 검색창', position: 'left-[560px] top-[98px]', arrow: 'left-12 -top-3 border-l border-t', highlight: 'left-[500px] top-[22px] h-[62px] w-[calc(100vw-980px)]' },
    { title: 'Today Insight', body: '홈의 첫 섹션은 오늘 감지된 핵심 변화와 Graphify로 들어갈 시각화 영역입니다. 요약 수치보다 오늘 읽어야 할 흐름이 먼저 보이도록 구성합니다.', anchor: '메인 인사이트 영역', position: 'left-[360px] top-[176px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[136px] h-[360px] w-[calc(100vw-760px)]' },
    { title: '요약 카드뉴스', body: '오른쪽 카드뉴스 큐는 오늘 볼 뉴스만 압축해서 보여줍니다. 카드를 클릭하면 페이지 이동 없이 상세 카드뉴스가 플로팅으로 열립니다.', anchor: '오늘의 요약 카드뉴스', position: 'right-[64px] top-[220px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[150px] h-[360px] w-[390px]' },
    { title: '그래프 전환', body: '하단 그래프는 관심도, 주가 변동, Peer사별 수주/재무 지표를 넘겨 보며 오늘의 흐름을 비교하는 영역입니다.', anchor: '하단 그래프 영역', position: 'left-[360px] bottom-[72px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] bottom-[28px] h-[260px] w-[calc(100vw-700px)]' },
  ],
  briefings: [
    { title: '브리핑 기간 선택', body: '달력 옆에서 일간, 주간, 월간을 함께 고릅니다. 놓친 브리핑도 날짜 기준으로 다시 열 수 있습니다.', anchor: '좌측 상단 기간 컨트롤', position: 'left-[330px] top-[112px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[96px] h-[64px] w-[430px]' },
    { title: '브리핑 리포트', body: '카드뉴스를 개별로 나열하지 않고, 오늘의 핵심 변화와 SK AX 대응 방향으로 종합합니다.', anchor: '브리핑 본문', position: 'left-[420px] top-[258px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[210px] h-[420px] w-[calc(100vw-760px)]' },
    { title: '근거 카드뉴스', body: '우측 근거 카드뉴스는 브리핑을 만든 원천 카드입니다. 클릭하면 현재 브리핑 위에서 카드뉴스 상세가 열립니다.', anchor: '근거 카드뉴스 큐', position: 'right-[58px] top-[300px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[48px] top-[210px] h-[420px] w-[360px]' },
    { title: '공유·인쇄', body: '공유·인쇄 버튼은 브리핑 템플릿 미리보기를 열고, 그 안에서 내용 복사, 공유, 템플릿 인쇄를 실행합니다.', anchor: '우측 상단 버튼', position: 'right-[56px] top-[126px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[96px] h-[64px] w-[260px]' },
  ],
  insight: [
    { title: '핵심 인사이트', body: '상단은 지금 가장 중요한 변화와 SK AX 관점의 해석을 읽는 영역입니다. 개별 뉴스보다 결론을 먼저 확인합니다.', anchor: '인사이트 요약', position: 'left-[380px] top-[150px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[116px] h-[220px] w-[calc(100vw-820px)]' },
    { title: '원인·변화·영향·대응', body: '본문은 원인, 변화, 영향, 대응을 한 화면에서 이어 읽도록 나뉩니다. 각 섹션은 보고서 문장으로 바로 옮길 수 있는 내용입니다.', anchor: '인사이트 분석 섹션', position: 'left-[380px] top-[360px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[320px] h-[360px] w-[calc(100vw-820px)]' },
    { title: '출처 카드뉴스', body: '오른쪽 출처 카드뉴스를 누르면 현재 화면 위에서 근거 내용을 확인합니다. 인사이트의 근거를 빠르게 되짚는 용도입니다.', anchor: '출처 영역', position: 'right-[56px] top-[230px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[46px] top-[180px] h-[320px] w-[360px]' },
  ],
  peerPlus: [
    { title: 'Peer 선택', body: '우측 상단 Peer 칩으로 기업을 바꾸면 IR 수치, 워드클라우드, 관련 카드뉴스가 함께 바뀝니다.', anchor: 'Peer+ 상단', position: 'right-[70px] top-[118px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[94px] h-[62px] w-[420px]' },
    { title: 'IR Numeric Pack', body: '정량 지표는 매출, 영업이익, 수주, 클라우드/AI 투자 흐름을 증감값과 함께 보는 영역입니다.', anchor: 'IR 정량자료', position: 'right-[70px] top-[230px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[56px] top-[176px] h-[310px] w-[420px]' },
    { title: '차별 시사점', body: 'SK AX와 Peer사의 차이를 비교해 영업/전략 관점에서 바로 쓸 수 있는 시사점을 강조합니다.', anchor: 'Peer 비교 시사점', position: 'left-[360px] top-[330px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[260px] h-[300px] w-[calc(100vw-860px)]' },
    { title: '워드클라우드', body: '최근 도입한 AI 기술, 사업, MOU 키워드를 워드클라우드로 봅니다. 키워드를 클릭하면 관련 카드뉴스 목록이 플로팅으로 열립니다.', anchor: '워드클라우드', position: 'right-[420px] top-[530px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[360px] top-[430px] h-[260px] w-[420px]' },
  ],
  issues: [
    { title: '필터와 날짜 검색', body: '상단 한 줄에서 날짜, 대주제/소주제, Peer사, 키워드를 좁혀 봅니다. 필터는 카드 목록을 바꾸고 북마크 자료와도 연결됩니다.', anchor: '카드뉴스 필터 영역', position: 'left-[330px] top-[142px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[112px] h-[92px] w-[calc(100vw-390px)]' },
    { title: '카드뉴스 그리드', body: '카드뉴스는 4열 그리드로 훑어보는 영역입니다. 제목, 섹터, Peer사를 보고 관심 있는 카드를 선택합니다.', anchor: '카드뉴스 목록', position: 'left-[360px] top-[300px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[235px] h-[calc(100vh-330px)] w-[calc(100vw-390px)]' },
    { title: '플로팅 상세', body: '카드를 누르면 현재 화면 위에 상세가 뜹니다. 여러 장의 카드뉴스를 넘기며 요약, 시사점, 근거를 확인합니다.', anchor: '카드뉴스 상세 팝업', position: 'right-[64px] top-[250px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[190px] h-[420px] w-[420px]' },
    { title: '북마크/공유', body: '각 카드의 북마크와 공유 버튼은 믹서 후보, 브리핑 근거, 개인 검토 목록으로 이어집니다.', anchor: '카드 액션', position: 'right-[64px] top-[520px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[455px] h-[150px] w-[320px]' },
  ],
  mixer: [
    { title: '사용 전: 입력 조합', body: '믹서 시작 전에는 Peer, 고객사, 산업, 키워드를 얇은 선택 칩으로 조합합니다. 여기서 선택한 값이 결과 인사이트의 관점이 됩니다.', anchor: '믹서 선택 패널', position: 'left-[330px] top-[160px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[108px] h-[180px] w-[calc(100vw-700px)]' },
    { title: '사용 전: 카드뉴스 후보', body: '북마크와 카드뉴스 후보를 골라 믹서에 넣습니다. 선택한 뉴스는 결과의 근거 카드뉴스로 다시 확인할 수 있습니다.', anchor: '카드뉴스 후보/북마크', position: 'right-[70px] top-[170px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[112px] h-[260px] w-[420px]' },
    { title: '사용 전: 구성 비율', body: '아래 도넛 차트는 선택한 Peer, 산업, 키워드, 카드뉴스 비율을 보여줍니다. 결과를 만들기 전 입력 균형을 점검하는 영역입니다.', anchor: '입력 비율 차트', position: 'left-[360px] bottom-[92px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] bottom-[48px] h-[240px] w-[calc(100vw-760px)]' },
    { title: '사용 후: 결과 인사이트', body: '믹서를 실행하면 상단 중앙에 새 인사이트가 정리됩니다. 고객 제안 방향, 벤치마킹 포인트, 대응 아이디어를 먼저 읽습니다.', anchor: '믹서 결과 인사이트', position: 'left-[420px] top-[210px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[160px] h-[300px] w-[calc(100vw-840px)]' },
    { title: '사용 후: 신호 분포', body: '결과 화면에서는 선택값이 어떤 전략 신호로 재구성됐는지 레이더 차트로 확인합니다. 입력 비율 차트와 별개의 결과 검토 영역입니다.', anchor: '믹서 결과 신호 분포', position: 'left-[360px] top-[430px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[390px] h-[300px] w-[calc(100vw-760px)]' },
    { title: '사용 후: 결과 근거', body: '결과에 반영된 카드뉴스를 클릭하면 상세가 플로팅으로 열립니다. 그래프보다 실제 근거를 확인하는 흐름입니다.', anchor: '결과 카드뉴스', position: 'right-[66px] top-[310px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[250px] h-[340px] w-[420px]' },
  ],
  keywordGraph: [
    { title: '키워드 필터', body: '우측 상단 필터에서 기업, 섹터, 키워드를 좁힙니다. 선택한 필터는 2D와 3D 보기 모두에 반영됩니다.', anchor: '키워드 필터', position: 'right-[58px] top-[180px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[130px] h-[100px] w-[420px]' },
    { title: '2D 키워드 맵', body: '2D 그래프에서는 SK AX, Peer사, 섹터, 세부 키워드가 크기와 색으로 구분됩니다. 노드를 드래그하고 휠로 확대/축소합니다.', anchor: '2D 그래프 영역', position: 'left-[380px] top-[250px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[160px] h-[calc(100vh-240px)] w-[calc(100vw-680px)]' },
    { title: '관련 카드뉴스', body: '기업, Peer사, 키워드 노드를 클릭하면 관련 카드뉴스가 현재 그래프 위에 뜹니다. 바깥 영역을 누르면 닫힙니다.', anchor: '노드 선택 결과', position: 'right-[72px] top-[330px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[56px] top-[260px] h-[360px] w-[420px]' },
    { title: '3D/전체화면', body: '3D 보기에서는 SK AX를 중심에 두고 키워드가 구 안팎에 배치됩니다. 전체화면에서도 보기 전환과 필터를 계속 사용할 수 있습니다.', anchor: '상단 컨트롤', position: 'right-[58px] top-[142px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[104px] h-[72px] w-[520px]' },
  ],
  settings: [
    { title: '회원 설정', body: '프로필, 접속 로그, 알림 시간과 채널을 한 화면에서 조정합니다.', anchor: '설정 탭', position: 'left-[340px] top-[230px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[185px] h-[260px] w-[300px]' },
  ],
};

export const guideTargetByAnchor: Record<string, string> = {
  '상단 검색창': 'global-search',
  '메인 인사이트 영역': 'home-insight',
  '오늘의 요약 카드뉴스': 'home-summary',
  '하단 그래프 영역': 'home-charts',
  '좌측 상단 기간 컨트롤': 'briefing-period',
  '브리핑 본문': 'briefing-main',
  '근거 카드뉴스 큐': 'briefing-evidence',
  '우측 상단 버튼': 'briefing-share-print',
  '인사이트 요약': 'insight-summary',
  '인사이트 분석 섹션': 'insight-analysis',
  '출처 영역': 'insight-sources',
  'Peer+ 상단': 'peer-selector',
  'IR 정량자료': 'peer-ir',
  'Peer 비교 시사점': 'peer-insight',
  '워드클라우드': 'peer-wordcloud',
  '카드뉴스 필터 영역': 'cardnews-filter',
  '카드뉴스 목록': 'cardnews-grid',
  '카드뉴스 상세 팝업': 'cardnews-grid',
  '카드 액션': 'cardnews-grid',
  '믹서 선택 패널': 'mixer-input',
  '카드뉴스 후보/북마크': 'mixer-candidates',
  '입력 비율 차트': 'mixer-ratio',
  '믹서 결과 인사이트': 'mixer-result',
  '믹서 결과 신호 분포': 'mixer-signal-map',
  '결과 카드뉴스': 'mixer-evidence',
  '키워드 필터': 'keyword-filter',
  '2D 그래프 영역': 'keyword-map',
  '노드 선택 결과': 'keyword-map',
  '상단 컨트롤': 'keyword-controls',
  '설정 탭': 'settings-tabs',
};
