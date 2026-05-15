export type ProductGuideStep = {
  title: string;
  body: string;
  userFeeling: string;
  insights: string[];
  anchor: string;
  position: string;
  arrow: string;
  highlight: string;
};

const searchGuideStep: ProductGuideStep = {
  title: '통합 검색',
  body: '상단 검색창에서는 기업명, 카드뉴스 제목, 핵심 키워드를 바로 찾을 수 있습니다. 검색 결과는 Peer+, 카드뉴스, 관련 분석 화면으로 바로 연결되므로 메뉴를 여러 번 타지 않고 원하는 맥락으로 바로 들어가는 진입점입니다.',
  userFeeling: '찾고 싶은 기업이나 이슈가 이미 있을 때 화면을 여러 번 옮기지 않아도 바로 도달할 수 있어 탐색이 훨씬 짧고 명확하게 느껴집니다.',
  insights: [
    '특정 Peer사 중심으로 비교 화면을 바로 열거나, 연결된 카드뉴스를 바로 확인할 수 있습니다.',
    '반복적으로 보이는 키워드가 실제로 어느 기사와 화면에 연결되는지 빠르게 좁혀볼 수 있습니다.',
  ],
  anchor: '상단 검색창',
  position: 'left-[560px] top-[98px]',
  arrow: 'left-12 -top-3 border-l border-t',
  highlight: 'left-[500px] top-[22px] h-[62px] w-[calc(100vw-980px)]',
};

export const viewGuideMap: Record<string, ProductGuideStep[]> = {
  home: [
    searchGuideStep,
    { title: 'Today Insight', body: '홈의 첫 섹션은 오늘 가장 먼저 읽어야 할 경쟁 구도를 SK AX 기준으로 압축한 영역입니다. 상단 4분면 그래프에서는 x축을 SK AX와의 유사도, y축을 시장 파급력으로 두고 각 Peer의 현재 위치를 보여주며, 아래 3개 카드는 그 그래프를 바탕으로 Peer사는 어떤 관점으로 읽어야 하는지, SK AX는 어떤 관점에서 대응해야 하는지, 그래서 어떤 인사이트가 나오는지를 순서대로 정리합니다.', userFeeling: '뉴스를 하나씩 읽기 전에 먼저 누구를 직접 비교해야 하는지, 어떤 기업을 시장 기준점으로 봐야 하는지가 잡혀서 오늘의 판단 프레임을 빠르게 세우게 됩니다.', insights: ['SK AX와 직접 맞붙는 경쟁군과 간접적으로 시장 기대치를 끌어올리는 기업을 같은 그래프에서 나눠 볼 수 있습니다.', '아래 카드 3개를 통해 그래프 결과를 기준으로 Peer사 관점, SK AX 관점, 그리고 최종 인사이트를 자연스럽게 이어서 읽을 수 있습니다.'], anchor: '메인 인사이트 영역', position: 'left-[360px] top-[176px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[136px] h-[420px] w-[calc(100vw-760px)]' },
    { title: '요약 카드뉴스', body: '오른쪽 카드뉴스 큐는 오늘 우선 확인해야 할 카드만 묶어 보여줍니다. 상단 대표 카드에서 핵심 이슈를 먼저 보고, 아래 리스트에서는 다른 후보 카드를 훑은 뒤 클릭해서 상세 카드뉴스 팝업으로 바로 이어집니다.', userFeeling: '원문 기사로 바로 들어가지 않고도 오늘 중요한 카드부터 우선순위를 정할 수 있어, 정보량이 많아도 부담이 크게 줄어듭니다.', insights: ['대표 카드와 후보 리스트를 함께 보며 오늘 가장 먼저 읽을 뉴스를 빠르게 고를 수 있습니다.', '카드를 열면 요약, 시사점, 원문 링크까지 이어져 홈 화면 안에서 바로 맥락 확인이 가능합니다.'], anchor: '오늘의 요약 카드뉴스', position: 'right-[64px] top-[220px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[150px] h-[360px] w-[390px]' },
    { title: '키워드 그래프', body: '하단 그래프는 키워드 검색지수 증감률을 중심으로 읽는 영역입니다. 선 위의 튀는 포인트만 클릭해 왜 값이 급등했는지, 그리고 그 변화가 SK AX 관점에서 어떤 의미를 가지는지 바로 확인할 수 있습니다.', userFeeling: '뉴스에서 읽은 변화가 실제 관심 신호로 어떻게 나타났는지를 같은 자리에서 확인할 수 있어, 정성 정보와 반응 흐름이 더 자연스럽게 이어집니다.', insights: ['클릭 가능한 급등 포인트에서 왜 값이 튀었는지와 SK AX에 어떤 의미가 있는지 바로 확인할 수 있습니다.', '단순 추이 확인이 아니라 급등 구간의 원인과 해석까지 함께 읽을 수 있습니다.'], anchor: '하단 그래프 영역', position: 'left-[360px] bottom-[72px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] bottom-[28px] h-[300px] w-[calc(100vw-700px)]' },
  ],
  briefings: [
    { title: '브리핑 기간 선택', body: '상단 기간 컨트롤에서 일간, 주간, 월간 브리핑 범위와 기준 날짜를 고릅니다. 주간은 월과 주차를 함께 바꾸고, 월간은 기준 월을 선택해 같은 형식의 브리핑을 다른 시점으로 다시 생성해 읽는 방식입니다.', userFeeling: '오늘 하루만이 아니라 지난 주와 월 단위 흐름까지 같은 틀에서 이어 볼 수 있어 시장 맥락이 끊기지 않고 누적으로 읽힙니다.', insights: ['특정 기간에 반복된 이슈와 경쟁사 신호를 같은 구조로 비교할 수 있습니다.', '단발성 기사인지, 주간·월간 누적 흐름인지 판단하는 기준이 됩니다.'], anchor: '좌측 상단 기간 컨트롤', position: 'left-[330px] top-[112px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[96px] h-[64px] w-[430px]' },
    { title: '브리핑 리포트', body: '브리핑 본문은 선택한 기간의 카드뉴스를 그대로 나열하는 대신, 핵심 변화와 그 의미를 보고용 문장으로 다시 정리한 메인 리포트입니다. 상단 리드 문장, 핵심 신호 카드, 의미와 시사점, SK AX 대응 방향, 벤치마킹 포인트, 제안 아이디어 순서로 읽습니다.', userFeeling: '기사와 숫자를 직접 조합하지 않아도 회의나 보고 전에 바로 쓸 수 있는 구조로 정리되어 있어 훨씬 빠르게 전체 맥락을 잡게 됩니다.', insights: ['기간 안에서 가장 중요한 변화가 무엇인지와 왜 중요한지를 빠르게 파악할 수 있습니다.', 'SK AX 대응 방향과 제안 아이디어까지 이어져 브리핑 결과를 바로 실무 논의로 연결할 수 있습니다.'], anchor: '브리핑 본문', position: 'left-[420px] top-[258px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[210px] h-[420px] w-[calc(100vw-760px)]' },
    { title: '근거 카드뉴스', body: '우측 카드 큐는 현재 브리핑 문장을 만드는 데 사용된 근거 카드뉴스 목록입니다. 카드 하나를 눌러 브리핑을 벗어나지 않고 바로 상세 카드뉴스를 열어, 어떤 기사와 데이터가 이 리포트를 뒷받침하는지 즉시 확인할 수 있습니다.', userFeeling: '결론만 읽는 것이 아니라 근거 기사까지 같은 화면에서 바로 확인할 수 있어 브리핑 내용에 대한 신뢰가 높아집니다.', insights: ['브리핑의 핵심 문장이 어떤 카드 묶음에서 나왔는지 빠르게 추적할 수 있습니다.', '중요한 변화가 실제로 반복된 기사 흐름인지 교차 검증할 수 있습니다.'], anchor: '근거 카드뉴스 큐', position: 'right-[58px] top-[300px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[48px] top-[210px] h-[420px] w-[360px]' },
    { title: '공유·인쇄', body: '우측 상단 버튼에서는 현재 브리핑을 미리보기 형태로 열고, 공유와 출력까지 이어서 처리합니다. 보고 전에 화면을 다시 정리하지 않고 바로 전달 가능한 형태로 넘기는 용도입니다.', userFeeling: '분석 화면이 바로 공유 가능한 산출물로 이어져서 개인 검토용이 아니라 실제 협업 결과물에 가깝게 느껴집니다.', insights: ['브리핑 내용을 팀과 빠르게 공유하거나 회의 자료로 넘길 수 있습니다.', '현재 선택한 기간과 해석 구조를 그대로 보존한 상태로 전달할 수 있습니다.'], anchor: '우측 상단 버튼', position: 'right-[56px] top-[126px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[96px] h-[64px] w-[260px]' },
  ],
  insight: [
    { title: '핵심 인사이트', body: '상단 요약 영역은 현재 가장 중요한 판단 문장을 먼저 보여줍니다. 시각 모드에서는 단계 카드를 눌러 원인-변화-영향-대응 흐름을 바꿔 읽고, 텍스트 모드에서는 같은 흐름을 카드형 문장으로 한 번에 확인합니다.', userFeeling: '무슨 일이 있었는지보다 왜 이 변화가 중요한지를 먼저 읽게 되어, 분석의 중심을 빠르게 잡고 뒤 내용을 훨씬 수월하게 따라가게 됩니다.', insights: ['현재 시장 변화에서 가장 중요한 핵심 판단 문장을 먼저 확인할 수 있습니다.', '원인-변화-영향-대응 단계를 따라가며 해석 흐름을 구조적으로 읽을 수 있습니다.'], anchor: '인사이트 요약', position: 'left-[380px] top-[150px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[116px] h-[220px] w-[calc(100vw-820px)]' },
    { title: '판단 근거와 시사점', body: '중앙 분석 섹션은 왼쪽의 판단 근거와 오른쪽의 시사점으로 나뉩니다. 판단 근거는 왜 이런 해석이 가능한지 정리한 영역이고, 시사점은 그 결과를 SK AX 관점에서 어떻게 읽어야 하는지 연결하는 영역입니다.', userFeeling: '분석 결과가 단순 요약이 아니라 근거와 해석으로 분리되어 있어, 무엇이 사실이고 무엇이 해석인지 더 명확하게 느껴집니다.', insights: ['현재 판단이 어떤 근거에서 출발했는지와 어떤 의미로 이어지는지 분리해 읽을 수 있습니다.', '회의나 보고 시 사실 설명과 해석 설명을 나눠 전달하기 쉬워집니다.'], anchor: '인사이트 분석 섹션', position: 'left-[380px] top-[360px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[320px] h-[360px] w-[calc(100vw-820px)]' },
    { title: '출처 카드뉴스', body: '오른쪽 출처 카드뉴스는 현재 인사이트의 근거 기사 큐입니다. 각 카드는 날짜, Peer사, 제목만 빠르게 보여주고, 클릭 시 상세 팝업으로 열려 실제 기사 요약과 원문 연결까지 확인할 수 있습니다.', userFeeling: '인사이트 옆에서 근거를 바로 다시 볼 수 있어 결과가 추상적인 의견이 아니라 설명 가능한 분석 결과로 느껴집니다.', insights: ['인사이트 판단이 어떤 카드뉴스 묶음에서 나왔는지 빠르게 검증할 수 있습니다.', '필요할 때만 상세 카드뉴스를 열어 근거를 더 깊게 확인할 수 있습니다.'], anchor: '출처 영역', position: 'right-[56px] top-[230px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[46px] top-[180px] h-[320px] w-[360px]' },
  ],
  peerPlus: [
    { title: 'Peer 필터', body: '상단 칩에서 전체 또는 개별 기업을 선택하면 아래 표, 핵심 비교 포인트, SWOT, 키워드, 레이더가 모두 같은 기준으로 함께 바뀝니다. 전체는 시장 전체 비교, 기업별은 SK AX와 해당 기업의 1:1 비교를 뜻합니다.', userFeeling: '전체 시장 구조를 보다가도 특정 경쟁사만 바로 좁혀볼 수 있어, 비교 흐름이 끊기지 않고 자연스럽게 이어집니다.', insights: ['전체 모드에서는 시장 전반 비교를, 기업별 모드에서는 SK AX와 선택 기업의 직접 비교를 수행합니다.', '같은 필터 기준이 아래 모든 컴포넌트에 동시에 반영되어 해석 기준이 흔들리지 않습니다.'], anchor: 'Peer+ 상단', position: 'right-[70px] top-[118px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[94px] h-[62px] w-[420px]' },
    { title: 'Peer 한눈 비교', body: '상단 표는 SK AX와 주요 Peer의 매출, 영업이익, 영업이익률, AX 비중, 수주 수, 핵심 키워드를 같은 순서로 놓고 비교하는 영역입니다. 전체 모드에서는 여러 기업을 한 번에, 기업별 모드에서는 SK AX와 선택 기업만 남겨 바로 읽기 쉽게 바뀝니다.', userFeeling: '공시 수치와 핵심 키워드를 표 한 번으로 정리해서 볼 수 있어 긴 자료를 읽기 전에 전체 경쟁 구도를 훨씬 빠르게 파악하게 됩니다.', insights: ['누가 규모와 수익성에서 우위인지, 어떤 키워드가 붙는지 한 줄 단위로 빠르게 비교할 수 있습니다.', '수주 수가 별도 그래프가 아니라 표 안에 함께 들어가 있어 주요 비교 항목을 한 자리에서 읽을 수 있습니다.'], anchor: 'Peer 한눈 비교 표', position: 'left-[360px] top-[230px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[170px] h-[220px] w-[calc(100vw-390px)]' },
    { title: '핵심 비교와 SWOT', body: '중앙 영역은 왼쪽의 핵심 비교 포인트와 오른쪽의 SWOT 분석으로 나뉩니다. 왼쪽은 사업 신호, 기술 신호, 리스크만 남겨 실무 비교에 바로 쓰는 축이고, 오른쪽은 같은 기업을 전략 해석 관점에서 다시 보는 보드입니다.', userFeeling: '실무 비교용 정보와 전략 해석용 정보가 분리되어 있어서 지금 당장 비교할 항목과 더 길게 볼 포인트를 한눈에 구분하게 됩니다.', insights: ['핵심 비교 포인트에서는 지금 바로 제안이나 내부 브리핑에 넣을 비교 문장을 빠르게 읽을 수 있습니다.', 'SWOT 보드에서는 선택 기업이 SK AX에 주는 기회와 위협을 더 전략적으로 해석할 수 있습니다.'], anchor: 'Peer 비교 시사점', position: 'left-[360px] top-[430px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[380px] h-[300px] w-[calc(100vw-390px)]' },
    { title: '워드클라우드', body: '좌측 하단 워드클라우드는 최근 도입·협력 핵심 키워드를 시각적으로 묶어 보여주는 영역입니다. 전체 모드에서는 모든 기업의 반복 키워드를 합쳐 보고, 기업별 모드에서는 선택 기업 중심 키워드만 남깁니다. 키워드를 누르면 연결된 카드뉴스를 바로 열 수 있습니다.', userFeeling: '숫자 비교만으로는 잘 안 보이는 사업·기술 문맥을 먼저 넓게 보고, 필요하면 카드뉴스로 바로 내려가 확인할 수 있어 해석이 더 직관적입니다.', insights: ['반복해서 등장하는 협력, 기술, 도입 주제를 한 번에 확인할 수 있습니다.', '클릭을 통해 해당 키워드가 어떤 카드뉴스 문맥에서 나왔는지 곧바로 검증할 수 있습니다.'], anchor: '워드클라우드', position: 'left-[380px] top-[760px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[700px] h-[280px] w-[calc(100vw-760px)]' },
    { title: '재무 체질 레이더', body: '우측 레이더는 수익성, 성장성, AX 집중도, 수주 모멘텀, 운영 효율, 시장 노출의 6개 축을 겹쳐 보는 비교 차트입니다. 전체 모드에서는 모든 기업을 서로 다른 색으로 겹쳐 보고, 기업별 모드에서는 SK AX와 선택 기업만 남겨 차이를 더 선명하게 읽습니다.', userFeeling: '표 숫자만 볼 때보다 각 기업의 체질 차이가 모양으로 한 번에 보여서 상대적인 강약을 더 직관적으로 파악하게 됩니다.', insights: ['어느 축에서 누가 상대적으로 강한지 선 모양과 벌어진 구간으로 빠르게 읽을 수 있습니다.', '전체 비교와 1:1 비교를 같은 차트 형식으로 전환해 해석 일관성을 유지할 수 있습니다.'], anchor: '재무 체질 레이더', position: 'right-[58px] top-[760px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[48px] top-[700px] h-[360px] w-[420px]' },
    { title: '관련 카드뉴스', body: '기업별 모드에서만 하단 관련 카드뉴스가 나타납니다. 현재 선택한 기업과 직접 연결된 카드만 남기기 때문에, 표와 비교 섹션에서 본 차이가 실제 어떤 기사 신호에서 나왔는지 바로 따라가 확인하는 용도입니다.', userFeeling: '수치와 키워드에서 본 변화가 실제 기사 근거와 바로 연결되어 분석 결과가 더 구체적이고 설득력 있게 느껴집니다.', insights: ['정량 비교에서 본 차이가 어떤 카드뉴스로 설명되는지 바로 검증할 수 있습니다.', '선택 기업에서 반복되는 이슈를 카드 단위로 다시 훑어볼 수 있습니다.'], anchor: '관련 카드뉴스', position: 'left-[380px] top-[1080px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[1020px] h-[320px] w-[calc(100vw-390px)]' },
  ],
  issues: [
    { title: '필터와 날짜 검색', body: '상단 필터 영역에서는 Peer사, 섹터, 날짜, 키워드를 조합해 카드 목록을 좁혀 봅니다. 북마크만 보기 버튼을 켜면 저장한 카드만 남고, 오른쪽 건수 표시로 현재 필터 결과 개수를 바로 확인합니다.', userFeeling: '원하는 산업과 기업 뉴스만 빠르게 골라볼 수 있어 탐색 피로가 줄고, 지금 필요한 카드에 더 집중하게 됩니다.', insights: ['기업·섹터·날짜·키워드 기준으로 카드뉴스를 즉시 재정렬할 수 있습니다.', '북마크 카드만 따로 모아 다시 검토하는 용도로도 활용할 수 있습니다.'], anchor: '카드뉴스 필터 영역', position: 'left-[330px] top-[142px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[112px] h-[92px] w-[calc(100vw-390px)]' },
    { title: '카드뉴스 그리드', body: '카드뉴스 목록은 커버, 날짜, 카테고리, Peer사 정보를 한 카드 안에 압축해 보여주는 탐색 그리드입니다. 먼저 넓게 훑은 뒤 필요한 카드만 눌러 상세 팝업으로 들어가는 구조이며, 상세에서는 AI 요약과 원문 링크까지 이어집니다.', userFeeling: '긴 기사 원문에 바로 들어가기 전에 핵심 정보만 넓게 스캔할 수 있어 정보 탐색 속도가 훨씬 빨라집니다.', insights: ['산업과 경쟁사 관련 이슈를 카드 단위로 넓게 비교할 수 있습니다.', '제목과 메타 정보만으로도 어떤 주제가 반복되는지 빠르게 감을 잡을 수 있습니다.'], anchor: '카드뉴스 목록', position: 'left-[360px] top-[300px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[235px] h-[calc(100vh-330px)] w-[calc(100vw-390px)]' },
  ],
  mixer: [
    { title: '사용 전: 입력 조합', body: '믹서 시작 전에는 Peer, 고객사, 산업, 키워드를 칩으로 조합합니다. 여기서 고른 조합이 결과 인사이트의 관점과 연결 구조를 결정합니다.', userFeeling: '직접 조건을 조합하면서 내가 중요하다고 보는 관점으로 분석을 설계한다는 주도감을 느끼게 합니다.', insights: ['특정 기업, 산업, 키워드 조합이 어떤 전략 시나리오로 이어질지 가설을 세울 수 있습니다.', '같은 카드뉴스라도 어떤 관점으로 조합하느냐에 따라 전혀 다른 인사이트가 만들어질 수 있다는 점을 확인할 수 있습니다.'], anchor: '믹서 선택 패널', position: 'left-[330px] top-[160px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[108px] h-[180px] w-[calc(100vw-700px)]' },
    { title: '사용 전: 카드뉴스 후보', body: '북마크와 카드뉴스 후보를 골라 믹서에 넣습니다. 선택한 뉴스는 결과의 근거 카드뉴스로 다시 확인할 수 있습니다.', userFeeling: '내가 중요하다고 고른 카드가 분석의 출발점이 되기 때문에 결과에 더 높은 몰입과 신뢰를 느끼게 됩니다.', insights: ['서로 다른 뉴스 사이의 새로운 연결 가능성을 직접 실험할 수 있습니다.', '선택한 카드 묶음이 어떤 전략 방향성을 만들어내는지 비교해 볼 수 있습니다.'], anchor: '카드뉴스 후보/북마크', position: 'right-[70px] top-[170px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[112px] h-[260px] w-[420px]' },
    { title: '사용 전: 구성 비율', body: '오른쪽 도넛 차트는 선택한 Peer, 산업, 키워드, 카드뉴스 비율을 보여줍니다. 결과를 만들기 전 입력 균형을 점검하는 영역입니다.', userFeeling: '선택한 입력이 한쪽으로 쏠리지 않았는지 미리 확인할 수 있어 결과 해석에 대한 자신감을 높여줍니다.', insights: ['어떤 요소가 현재 분석을 과도하게 끌고 가는지 사전에 점검할 수 있습니다.', '균형 잡힌 입력 조합이 더 설득력 있는 전략 시나리오로 이어질 가능성을 판단할 수 있습니다.'], anchor: '입력 비율 차트', position: 'right-[70px] top-[320px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[250px] h-[330px] w-[340px]' },
    { title: '사용 후: 결과 인사이트', body: '믹서를 실행하면 상단 중앙에 새 인사이트가 정리됩니다. 고객 제안 방향, 벤치마킹 포인트, 대응 아이디어를 먼저 읽습니다.', userFeeling: '직접 고른 뉴스와 키워드 조합이 하나의 전략 문장으로 정리돼 나와서, 단순 조회가 아니라 새로운 제안 아이디어를 만든다는 느낌을 줍니다.', insights: ['선택한 조합이 어떤 제안 아이디어와 사업 기회로 이어질 수 있는지 확인할 수 있습니다.', '벤치마킹 포인트와 대응 아이디어를 바로 활용 가능한 문장 형태로 얻을 수 있습니다.'], anchor: '믹서 결과 인사이트', position: 'left-[420px] top-[210px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[330px] top-[160px] h-[300px] w-[calc(100vw-840px)]' },
    { title: '사용 후: 신호 분포', body: '결과 화면에서는 선택값이 어떤 전략 신호로 재구성됐는지 레이더 차트로 확인합니다. 입력 비율 차트와 별개의 결과 검토 영역입니다.', userFeeling: '조합 결과의 방향성이 시각적으로 드러나기 때문에 만들어진 시나리오의 성격을 직관적으로 이해하게 됩니다.', insights: ['결과가 성장, 협력, 기술, 사업 확장 중 어디에 더 무게가 실렸는지 볼 수 있습니다.', '같은 입력이라도 어떤 전략 신호가 강하게 형성됐는지 비교하며 해석을 다듬을 수 있습니다.'], anchor: '믹서 결과 신호 분포', position: 'left-[360px] top-[430px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[390px] h-[300px] w-[calc(100vw-760px)]' },
    { title: '사용 후: 결과 근거', body: '결과에 반영된 카드뉴스를 클릭하면 상세가 플로팅으로 열립니다. 그래프보다 실제 근거를 확인하는 흐름입니다.', userFeeling: '새로 생성된 결과도 다시 원래 카드뉴스로 검증할 수 있어 분석이 과도하게 추상적이지 않다고 느끼게 합니다.', insights: ['전략 시나리오가 어떤 근거 기사 묶음에서 도출됐는지 추적할 수 있습니다.', '결과를 뒷받침하는 뉴스의 맥락을 다시 읽으며 활용 가능성을 검토할 수 있습니다.'], anchor: '결과 카드뉴스', position: 'right-[66px] top-[310px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[56px] top-[250px] h-[340px] w-[420px]' },
  ],
  keywordGraph: [
    { title: '키워드 필터와 보기 전환', body: '상단 컨트롤에서는 기업, AX, 보안, 인프라, 수주 축으로 그래프를 좁히고, 확대·축소, 3D 보기, 전체화면까지 함께 조절합니다. 필터와 보기 방식은 같은 그래프에 즉시 반영됩니다.', userFeeling: '복잡한 관계망을 그대로 다 보지 않고 내가 궁금한 축만 남겨 볼 수 있어 분석 초점이 훨씬 또렷해집니다.', insights: ['특정 기업군이나 주제 축만 남겨 연결 구조를 선택적으로 확인할 수 있습니다.', '2D와 3D, 전체화면 전환을 통해 복잡한 관계망을 더 읽기 쉬운 방식으로 바꿔 볼 수 있습니다.'], anchor: '상단 컨트롤', position: 'right-[58px] top-[142px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[104px] h-[92px] w-[520px]' },
    { title: '키워드 맵', body: '그래프 본문에서는 기업, 산업, 세부 키워드가 연결 구조로 펼쳐집니다. 노드 크기와 위치를 통해 어떤 키워드가 중심에 있는지, 어떤 키워드가 여러 기업·주제와 동시에 연결되는지 읽는 영역입니다.', userFeeling: '여러 뉴스에 흩어져 있던 산업 흐름이 관계망으로 정리되어 보여서, 어떤 키워드가 실제 중심축인지 더 쉽게 파악하게 됩니다.', insights: ['현재 시장에서 중심이 되는 키워드와 연결 강도를 직관적으로 확인할 수 있습니다.', '특정 기업과 산업 키워드가 어떤 구조로 묶이는지 한 화면에서 볼 수 있습니다.'], anchor: '2D 그래프 영역', position: 'left-[380px] top-[250px]', arrow: '-left-3 top-16 border-b border-l', highlight: 'left-[315px] top-[160px] h-[calc(100vh-240px)] w-[calc(100vw-680px)]' },
    { title: '관련 카드뉴스', body: '기업, Peer사, 키워드 노드를 클릭하면 관련 카드뉴스가 그래프 위 오버레이로 열립니다. 관계망에서 본 연결이 실제 어떤 기사 문맥에서 나왔는지, 그래프를 벗어나지 않고 바로 확인하는 단계입니다.', userFeeling: '그래프에서 본 연결이 실제 기사와 바로 이어져서, 시각화가 추상적인 그림이 아니라 근거 탐색 도구처럼 느껴집니다.', insights: ['특정 키워드가 왜 중요한지 관련 카드뉴스와 함께 해석할 수 있습니다.', '관계 구조와 실제 기사 흐름을 연결해 분석의 설명 가능성을 높일 수 있습니다.'], anchor: '노드 선택 결과', position: 'right-[72px] top-[330px]', arrow: 'right-[-12px] top-16 border-r border-t', highlight: 'right-[56px] top-[260px] h-[360px] w-[420px]' },
    { title: '노드 상세와 확장 보기', body: '오른쪽 상세 패널에서는 선택한 키워드의 분류, 연결 노드, 추이 정보를 확인합니다. 필요하면 상단 컨트롤에서 3D 보기나 전체화면으로 확장해 같은 키워드 구조를 더 넓은 시야에서 다시 탐색할 수 있습니다.', userFeeling: '한쪽에서는 구조를 보고 다른 쪽에서는 추이와 세부 연결을 확인할 수 있어, 그래프 탐색이 덜 추상적이고 더 설명 가능하게 느껴집니다.', insights: ['선택한 키워드가 어떤 다른 키워드와 연결되는지 상세하게 확인할 수 있습니다.', '확대와 3D 보기로 복잡한 연결망을 더 넓은 시야에서 재검토할 수 있습니다.'], anchor: '상단 컨트롤', position: 'right-[58px] top-[142px]', arrow: 'right-8 -top-3 border-l border-t', highlight: 'right-[48px] top-[104px] h-[92px] w-[520px]' },
  ],
  settings: [
    { title: '회원 설정', body: '설정 화면에서는 프로필 정보, 알림 시간과 채널, 접속 로그 같은 개인 환경 항목을 한 곳에서 조정합니다. 좌측 탭을 바꾸며 필요한 설정 범주를 나눠 관리하는 구조입니다.', userFeeling: '정보 수신 방식과 개인 환경을 내 업무 리듬에 맞게 조절할 수 있어 서비스가 더 개인화되어 있다고 느끼게 됩니다.', insights: ['브리핑과 알림을 원하는 시간과 채널에 맞춰 놓치지 않도록 조정할 수 있습니다.', '프로필과 접속 이력을 함께 관리해 개인 보안과 사용 패턴을 점검할 수 있습니다.'], anchor: '설정 탭', position: 'left-[340px] top-[230px]', arrow: '-left-3 top-14 border-b border-l', highlight: 'left-[315px] top-[185px] h-[260px] w-[300px]' },
  ],
};

export const commonGuideSteps: ProductGuideStep[] = [
  searchGuideStep,
  {
    title: '업데이트와 알림',
    body: '상단 우측에서는 마지막 데이터 업데이트 시각과 알림 패널을 확인합니다. 알림을 열면 새로 들어온 변화, 브리핑 준비 상태, 추천 흐름을 확인하고 바로 해당 화면으로 이동할 수 있습니다.',
    userFeeling: '데이터가 언제 기준으로 갱신됐는지와 무엇이 새로 들어왔는지를 한 자리에서 확인할 수 있어 서비스 전반의 신뢰도가 높아집니다.',
    insights: [
      '새로 들어온 변화 신호와 브리핑 알림을 놓치지 않고 관련 화면으로 즉시 이동할 수 있습니다.',
      '현재 보고 있는 내용이 어느 시점까지 반영된 것인지 확인해 해석 기준 시점을 맞출 수 있습니다.',
    ],
    anchor: '업데이트와 알림',
    position: 'right-[56px] top-[126px]',
    arrow: 'right-8 -top-3 border-l border-t',
    highlight: 'right-[48px] top-[92px] h-[64px] w-[260px]',
  },
  {
    title: '도움말 버튼',
    body: '물음표 버튼을 누르면 지금 보고 있는 화면 기준의 가이드가 다시 열립니다. 처음부터 다시 보거나 필요한 단계만 빠르게 확인할 때 쓰는 진입점입니다.',
    userFeeling: '헷갈리는 기능이 생겨도 같은 화면 안에서 바로 설명을 다시 열 수 있어 사용 흐름이 덜 끊깁니다.',
    insights: [
      '현재 화면에서 어떤 영역을 먼저 읽어야 하는지 다시 빠르게 확인할 수 있습니다.',
      '새로 바뀐 레이아웃이나 기능이 있어도 가이드를 통해 바로 적응할 수 있습니다.',
    ],
    anchor: '도움말 버튼',
    position: 'right-[56px] top-[170px]',
    arrow: 'right-8 -top-3 border-l border-t',
    highlight: 'right-[96px] top-[132px] h-[64px] w-[64px]',
  },
  {
    title: '프로필과 설정',
    body: '프로필 버튼을 누르면 설정 화면으로 이동해 알림, 프로필, 환경 항목을 조정할 수 있습니다. 개인 기준으로 화면과 알림을 맞추는 관리 진입점입니다.',
    userFeeling: '도움말 확인과 개인 환경 조정을 같은 상단 흐름 안에서 처리할 수 있어 사용 동선이 단순하게 느껴집니다.',
    insights: [
      '설정 화면으로 바로 이동해 알림 시간과 개인 환경을 조정할 수 있습니다.',
      '내 업무 방식에 맞는 기본 환경을 빠르게 유지할 수 있습니다.',
    ],
    anchor: '프로필·설정',
    position: 'right-[32px] top-[170px]',
    arrow: 'right-8 -top-3 border-l border-t',
    highlight: 'right-[32px] top-[132px] h-[64px] w-[64px]',
  },
  {
    title: '사이드바 이동',
    body: '좌측 사이드바에서 홈, 브리핑, 인사이트, Peer+, 카드뉴스, 믹서, 키워드 그래프 등 주요 화면으로 이동합니다. 현재 보고 있는 메뉴는 강조되어 있어 지금 어느 분석 단계에 있는지 바로 알 수 있습니다.',
    userFeeling: '여러 기능을 오가더라도 현재 위치를 잃지 않고 원하는 분석 화면으로 빠르게 전환할 수 있어 흐름이 안정적으로 느껴집니다.',
    insights: [
      '홈, 브리핑, 인사이트, Peer+, 카드뉴스, 믹서, 키워드 그래프를 같은 정보 흐름 안에서 오가며 비교할 수 있습니다.',
      '현재 보고 있는 메뉴와 다음 분석 화면의 연결 맥락을 유지할 수 있습니다.',
    ],
    anchor: '사이드바 메뉴',
    position: 'left-[260px] top-[260px]',
    arrow: '-left-3 top-16 border-b border-l',
    highlight: 'left-[12px] top-[84px] h-[calc(100vh-140px)] w-[220px]',
  },
  {
    title: 'AXIS AI 챗봇',
    body: '우측 하단 AI 챗봇은 현재 화면 내용을 질문형으로 다시 탐색하는 보조 도구입니다. 보고 있는 카드뉴스, 인사이트, 비교 화면을 바탕으로 재설명, 요약, 후속 질문을 이어갈 수 있습니다.',
    userFeeling: '정적인 화면을 읽는 데서 멈추지 않고 필요한 내용을 바로 질문해 다시 설명받을 수 있어 이해 속도가 빨라집니다.',
    insights: [
      '복잡한 비교 결과나 카드뉴스 흐름을 대화형으로 다시 정리할 수 있습니다.',
      '현재 화면의 내용을 바탕으로 보고용 문장이나 후속 질문을 빠르게 뽑아볼 수 있습니다.',
    ],
    anchor: 'AI 챗봇',
    position: 'right-[86px] bottom-[120px]',
    arrow: 'right-8 -top-3 border-l border-t',
    highlight: 'right-[48px] bottom-[48px] h-[72px] w-[72px]',
  },
];

export const guideTargetByAnchor: Record<string, string> = {
  '상단 검색창': 'global-search',
  '업데이트와 알림': 'topnav-notifications',
  '도움말 버튼': 'topnav-help',
  '프로필·설정': 'topnav-profile',
  '사이드바 메뉴': 'sidebar-nav',
  'AI 챗봇': 'ai-chat',
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
  'Peer 한눈 비교 표': 'peer-overview',
  'IR 정량자료': 'peer-ir',
  'Peer 비교 시사점': 'peer-insight',
  '분기 추이 그래프': 'peer-quarterly-trend',
  '재무 체질 레이더': 'peer-radar',
  '워드클라우드': 'peer-wordcloud',
  '관련 카드뉴스': 'peer-related-cardnews',
  '카드뉴스 필터 영역': 'cardnews-filter',
  '카드뉴스 목록': 'cardnews-grid',
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
