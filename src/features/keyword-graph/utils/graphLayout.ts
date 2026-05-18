import * as THREE from 'three';
import { graphNodes, type KeywordNode } from '../../../shared/mocks/keywordGraph';

/**
 * CSS var() 표현식 또는 hex/rgb 값을 실제 색 문자열로 해석.
 * SSR/Node 환경 (window 없음) 에서는 fallback 반환.
 */
export function resolveCssColor(value: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const variableMatch = value.match(/^var\((--[^)]+)\)$/);
  if (!variableMatch) return value;
  return getComputedStyle(document.documentElement).getPropertyValue(variableMatch[1]).trim() || fallback;
}

/**
 * 노드 크기 + 활성 상태에 따라 그래프에 표시될 원 반지름 계산.
 */
export function getGraphNodeDisplayRadius(node: KeywordNode, active = false): number {
  const base = node.category === '기업'
    ? node.size / 3.2
    : node.size >= 22
      ? node.size / 3.8
      : node.size / 4.35;
  return base + (active ? 2.4 : 0);
}

/**
 * 노드 라벨 줄바꿈 — 너무 길면 절반 기준으로 split.
 * 공백 있으면 단어 단위, 없으면 글자 단위.
 */
export function splitGraphLabel(label: string): string[] {
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

/**
 * 키워드 구 그래프에서 노드의 3D 위치 결정.
 * - 'sk-axis' 는 원점 (중심)
 * - 4 peer 기업은 고정 앵커 (전후좌우)
 * - 나머지는 golden-angle 분포 + size 기반 layer
 */
export function getSpherePosition(node: KeywordNode, radius: number, index = 0): THREE.Vector3 {
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
  const phi = Math.acos(1 - (2 * normalizedIndex) / (graphNodes.length + 2));
  const theta = normalizedIndex * goldenAngle;
  const layer = node.size >= 21 ? 0.94 : 0.58 + (index % 6) * 0.07;
  const layeredRadius = radius * Math.min(1, layer);
  return new THREE.Vector3(
    layeredRadius * Math.sin(phi) * Math.cos(theta),
    layeredRadius * Math.cos(phi),
    layeredRadius * Math.sin(phi) * Math.sin(theta),
  );
}
