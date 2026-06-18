/*
 * 작성일: 2026-04-21
 * 작성자: 최종민
 * 변경이력:
 *   2026-04-21 최종민 — axis-frontend 베이스라인 구성
 *   2026-04-23 안가은 — 초기 프론트엔드 셋업(기능 없음) 반영
 */
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(<App />)
