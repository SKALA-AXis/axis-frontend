export type ImageCategory = 'ax' | 'security' | 'infra' | 'deals';

export type CuratedImage = {
  id: string;
  alt: string;
  photographer: string;
};

export const cardImagePool: Record<ImageCategory, CuratedImage[]> = {
  ax: [
    { id: '1644088379091-d574269d422f', alt: '추상 데이터 네트워크 노드', photographer: 'Conny Schneider' },
    { id: '1545987796-200677ee1011', alt: '금속 격자 구조 - 신경망 메타포', photographer: 'Alina Grubnyak' },
    { id: '1597733336794-12d05021d510', alt: '보라·파랑 그라디언트 디지털', photographer: 'JJ Ying' },
  ],
  security: [
    { id: '1548092372-0d1bd40894a3', alt: '파란 노트북 보안 클로즈업', photographer: 'Philipp Katzenberger' },
    { id: '1614064641938-3bbee52942c7', alt: '어두운 키보드 위 빨간 자물쇠', photographer: 'FlyD' },
    { id: '1526374965328-7f61d4dc18c5', alt: '녹색 매트릭스 바이너리 코드', photographer: 'Markus Spiske' },
  ],
  infra: [
    { id: '1558494949-ef010cbdcc31', alt: '데이터센터 파란 케이블 네트워크', photographer: 'Taylor Vick' },
    { id: '1695668548342-c0c1ad479aee', alt: '서버 랙 클로즈업', photographer: 'Kevin Ache' },
    { id: '1561233835-f937539b95b9', alt: '인디케이터 LED 벽', photographer: 'Krzysztof Kowalik' },
  ],
  deals: [
    { id: '1517048676732-d65bc937f952', alt: '회의 테이블 - 펜과 노트', photographer: 'Dylan Gillis' },
    { id: '1573164574572-cb89e39749b4', alt: '노트북 앞 악수', photographer: 'Mina Rad' },
    { id: '1616587656977-ac36a5a430bc', alt: '오픈플랜 회의', photographer: 'LinkedIn Sales Solutions' },
  ],
};
