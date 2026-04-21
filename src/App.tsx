import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import BriefingPage from './pages/BriefingPage'
import SearchPage from './pages/SearchPage'
import PeerMonitorPage from './pages/PeerMonitorPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/briefing" replace />} />
        <Route path="/briefing" element={<BriefingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/peers" element={<PeerMonitorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}
