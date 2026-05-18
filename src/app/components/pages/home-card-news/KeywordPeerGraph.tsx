import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import type { GraphLink, GraphNode } from './types';

export function KeywordPeerGraph({
  nodes,
  links,
  selectedNodeId,
  onSelect,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 15);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return mountFallbackGraph({ mount, nodes, links, selectedNodeId, onSelectRef });
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f1218, 1);
    renderer.domElement.setAttribute('data-testid', 'keyword-peer-graph-canvas');
    renderer.domElement.setAttribute('aria-label', '키워드와 Peer사 관계를 보여주는 3D 그래프');
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    const point = new THREE.PointLight(0x3cffd0, 1.4, 36);
    point.position.set(6, 6, 8);
    scene.add(ambient, point);

    const group = new THREE.Group();
    scene.add(group);

    const nodePositions = new Map<string, THREE.Vector3>();
    const nodeMeshes: THREE.Mesh[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: THREE.Object3D | null = null;
    let frameId = 0;
    let width = 1;
    let height = 1;

    const rootNode = nodes.find((node) => node.id === 'root') ?? nodes[0];
    nodePositions.set(rootNode.id, new THREE.Vector3(0, 0, 0));

    const outerNodes = nodes.filter((node) => node.id !== 'root');
    outerNodes.forEach((node, index) => {
      const ring = node.kind === 'peer' ? 4.2 : 6.1;
      const zLift = node.kind === 'peer' ? 0.8 : -0.5;
      const angle = (index / outerNodes.length) * Math.PI * 2;
      nodePositions.set(
        node.id,
        new THREE.Vector3(
          Math.cos(angle) * ring,
          Math.sin(angle) * ring * 0.62,
          Math.sin(angle * 1.7) * 1.2 + zLift,
        ),
      );
    });

    for (const link of links) {
      const source = nodePositions.get(link.source);
      const target = nodePositions.get(link.target);
      if (!source || !target) continue;

      const geometry = new THREE.BufferGeometry().setFromPoints([source, target]);
      const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });
      group.add(new THREE.Line(geometry, material));
    }

    for (const node of nodes) {
      const position = nodePositions.get(node.id) ?? new THREE.Vector3();
      const isSelected = node.id === selectedNodeId;
      const radius = node.kind === 'root' ? 0.55 : node.kind === 'peer' ? 0.34 : 0.25;
      const geometry = new THREE.SphereGeometry(isSelected ? radius * 1.35 : radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        emissive: new THREE.Color(node.color),
        emissiveIntensity: isSelected ? 0.65 : 0.22,
        metalness: 0.22,
        roughness: 0.34,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData.nodeId = node.id;
      group.add(mesh);
      nodeMeshes.push(mesh);

      const sprite = createLabelSprite(node.label, node.kind === 'root' ? '#ffffff' : node.color);
      sprite.position.copy(position.clone().add(new THREE.Vector3(0, node.kind === 'root' ? -0.95 : -0.58, 0)));
      group.add(sprite);
    }

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(nodeMeshes)[0]?.object ?? null;
      hovered = hit;
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };

    const handleClick = () => {
      if (hovered?.userData.nodeId) {
        onSelectRef.current(hovered.userData.nodeId as string);
      }
    };

    renderer.domElement.addEventListener('pointermove', updatePointer);
    renderer.domElement.addEventListener('click', handleClick);
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      group.rotation.y = t * 0.18;
      group.rotation.x = Math.sin(t * 0.35) * 0.09;

      for (const mesh of nodeMeshes) {
        const selected = mesh.userData.nodeId === selectedNodeId;
        const hover = mesh === hovered;
        const pulse = 1 + Math.sin(t * 2.8 + mesh.position.x) * 0.035;
        const targetScale = (selected ? 1.28 : hover ? 1.18 : 1) * pulse;
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointermove', updatePointer);
      renderer.domElement.removeEventListener('click', handleClick);
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material?.dispose?.();
        }
      });
      renderer.dispose();
    };
  }, [links, nodes, selectedNodeId]);

  return <div ref={mountRef} className="h-full min-h-[330px] w-full sm:min-h-[420px]" data-testid="keyword-peer-graph" />;
}

function mountFallbackGraph({
  mount,
  nodes,
  links,
  selectedNodeId,
  onSelectRef,
}: {
  mount: HTMLDivElement;
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNodeId: string;
  onSelectRef: { current: (nodeId: string) => void };
}) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return () => {};
  }

  canvas.setAttribute('data-testid', 'keyword-peer-graph-canvas');
  canvas.setAttribute('aria-label', '키워드와 Peer사 관계를 보여주는 3D 그래프');
  canvas.style.display = 'block';
  canvas.style.height = '100%';
  canvas.style.width = '100%';
  mount.appendChild(canvas);

  let width = 1;
  let height = 1;
  let frameId = 0;
  let hoveredId = '';
  let positions = new Map<string, { x: number; y: number; radius: number; node: GraphNode }>();

  const resize = () => {
    const bounds = mount.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const computePositions = (time: number) => {
    const next = new Map<string, { x: number; y: number; radius: number; node: GraphNode }>();
    const centerX = width / 2;
    const centerY = height / 2 + 8;
    const rootNode = nodes.find((node) => node.id === 'root') ?? nodes[0];
    next.set(rootNode.id, { x: centerX, y: centerY, radius: selectedNodeId === rootNode.id ? 36 : 30, node: rootNode });

    const outerNodes = nodes.filter((node) => node.id !== rootNode.id);
    const radiusX = Math.max(120, width * 0.34);
    const radiusY = Math.max(86, height * 0.32);
    outerNodes.forEach((node, index) => {
      const baseAngle = (index / Math.max(1, outerNodes.length)) * Math.PI * 2;
      const angle = baseAngle + time * 0.16;
      const layer = node.kind === 'peer' ? 0.76 : 1;
      const x = centerX + Math.cos(angle) * radiusX * layer;
      const y = centerY + Math.sin(angle) * radiusY * layer;
      const radius = node.kind === 'peer' ? 16 : 12;
      next.set(node.id, { x, y, radius: selectedNodeId === node.id ? radius * 1.36 : radius, node });
    });

    positions = next;
  };

  const drawLabel = (label: string, x: number, y: number, color: string) => {
    context.save();
    context.font = '700 11px Arial, sans-serif';
    const textWidth = Math.min(140, Math.max(54, context.measureText(label).width + 28));
    const labelX = x - textWidth / 2;
    const labelY = y + 22;
    context.fillStyle = 'rgba(0, 0, 0, 0.62)';
    roundRect(context, labelX, labelY, textWidth, 20, 10);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 1.4;
    context.stroke();
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, x, labelY + 10, textWidth - 14);
    context.restore();
  };

  const draw = () => {
    const time = performance.now() * 0.001;
    computePositions(time);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#0f1218';
    context.fillRect(0, 0, width, height);

    for (const link of links) {
      const source = positions.get(link.source);
      const target = positions.get(link.target);
      if (!source || !target) continue;

      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      context.lineWidth = 1;
      context.stroke();
    }

    for (const { x, y, radius, node } of positions.values()) {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredId === node.id;
      const pulse = 1 + Math.sin(time * 3 + x * 0.01) * 0.04;
      const drawRadius = radius * (isHovered ? 1.12 : 1) * pulse;
      const gradient = context.createRadialGradient(x - drawRadius * 0.35, y - drawRadius * 0.35, 0, x, y, drawRadius * 1.25);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.24, node.color);
      gradient.addColorStop(1, isSelected ? node.color : 'rgba(255,255,255,0.20)');

      context.beginPath();
      context.arc(x, y, drawRadius, 0, Math.PI * 2);
      context.fillStyle = gradient;
      context.fill();

      if (isSelected || isHovered) {
        context.beginPath();
        context.arc(x, y, drawRadius + 8, 0, Math.PI * 2);
        context.strokeStyle = isSelected ? 'rgba(60, 255, 208, 0.72)' : 'rgba(255, 255, 255, 0.34)';
        context.lineWidth = 1.5;
        context.stroke();
      }

      drawLabel(node.label, x, y, node.kind === 'root' ? '#ffffff' : node.color);
    }
  };

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    draw();
  };

  const updatePointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nextHovered = '';

    for (const { x: nodeX, y: nodeY, radius, node } of positions.values()) {
      const distance = Math.hypot(x - nodeX, y - nodeY);
      if (distance <= radius + 14) {
        nextHovered = node.id;
        break;
      }
    }

    hoveredId = nextHovered;
    canvas.style.cursor = hoveredId ? 'pointer' : 'grab';
  };

  const handleClick = () => {
    if (hoveredId) {
      onSelectRef.current(hoveredId);
    }
  };

  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('click', handleClick);
  resize();
  animate();

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointermove', updatePointer);
    canvas.removeEventListener('click', handleClick);
    mount.removeChild(canvas);
  };
}

function createLabelSprite(text: string, color: string) {
  const dpr = 2;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const baseW = 512;
  const baseH = 128;
  canvas.width = baseW * dpr;
  canvas.height = baseH * dpr;

  if (context) {
    context.scale(dpr, dpr);
    context.clearRect(0, 0, baseW, baseH);
    context.font = '700 48px "Pretendard Variable", "Inter", system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 6;
    context.strokeStyle = 'rgba(15, 17, 23, 0.95)';
    context.lineJoin = 'round';
    context.miterLimit = 2;
    context.strokeText(text, baseW / 2, baseH / 2);
    context.fillStyle = '#ffffff';
    context.fillText(text, baseW / 2, baseH / 2);
    context.fillStyle = color;
    context.fillRect(baseW / 2 - 18, baseH / 2 + 32, 36, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, 0.6, 1);
  return sprite;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
