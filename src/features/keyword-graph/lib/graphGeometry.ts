import * as THREE from 'three';
import type { KeywordNode } from '../../../shared/content/keywordGraph';

// KeywordGraphView 의 Three.js 구(sphere) 렌더링용 순수 기하/라벨 헬퍼 (refactoring P2).
// 컴포넌트에서 그대로 옮긴 것 — DOM/상태 의존 없음.

/** 노드 표시 반지름(기업/대형/일반 구간 + active 가중). */
export function getGraphNodeDisplayRadius(node: KeywordNode, active = false) {
  const base = node.category === '기업'
    ? node.size / 3.35
    : node.size >= 22
      ? node.size / 3.65
      : node.size / 4.05;
  return base + (active ? 2.4 : 0);
}

/** 긴 라벨을 두 줄로 분할(공백+11자 초과는 단어 기준, 7자 초과는 절반). */
export function splitGraphLabel(label: string) {
  if (label.includes(' ') && label.length > 11) {
    const parts = label.split(' ');
    const midpoint = Math.ceil(parts.length / 2);
    return [parts.slice(0, midpoint).join(' '), parts.slice(midpoint).join(' ')];
  }
  if (label.length > 7) {
    const midpoint = Math.ceil(label.length / 2);
    return [label.slice(0, midpoint), label.slice(midpoint)];
  }
  return [label];
}

/** 구 표면 노드 좌표(중심 sk-axis=원점, 회사 앵커 고정, 나머지는 피보나치 분포). */
export function getSpherePosition(node: KeywordNode, radius: number, index = 0, totalNodes = 5) {
  if (node.id === 'sk-axis') {
    return new THREE.Vector3(0, 0, 0);
  }

  const companyAnchors: Record<string, [number, number, number]> = {
    'samsung-sds': [-0.66, 0.58, -0.46],
    'lg-cns': [0.72, 0.54, -0.34],
    'hyundai-autoever': [-0.58, -0.62, 0.48],
    'posco-dx': [0.62, -0.58, 0.50],
  };

  const anchor = companyAnchors[node.id];
  if (anchor) {
    return new THREE.Vector3(anchor[0], anchor[1], anchor[2]).normalize().multiplyScalar(radius * 0.98);
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const normalizedIndex = index + 1.5;
  const phi = Math.acos(1 - (2 * normalizedIndex) / (totalNodes + 2));
  const theta = normalizedIndex * goldenAngle;
  const layer = node.size >= 21 ? 0.94 : 0.58 + (index % 6) * 0.07;
  const layeredRadius = radius * Math.min(1, layer);
  return new THREE.Vector3(
    layeredRadius * Math.sin(phi) * Math.cos(theta),
    layeredRadius * Math.cos(phi),
    layeredRadius * Math.sin(phi) * Math.sin(theta),
  );
}
