import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import type { AlertSettings } from '../types/api'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery<AlertSettings>({
    queryKey: ['alert-settings'],
    queryFn: () => client.get('/api/alerts/settings'),
  })
  const [saved, setSaved] = useState(false)

  const { mutate: save } = useMutation({
    mutationFn: (data: Partial<AlertSettings>) => client.put('/api/alerts/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-gray-900">알림 설정</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">브리핑 시간</label>
          <input
            type="time"
            defaultValue={settings?.briefingTime ?? '08:30'}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">긴급 이슈 즉시 알림</span>
          <button
            onClick={() => save({ enableUrgent: !settings?.enableUrgent })}
            className={`relative w-10 h-6 rounded-full transition-colors ${settings?.enableUrgent ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings?.enableUrgent ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>

        {saved && <p className="text-sm text-green-600">저장되었습니다</p>}
      </div>
    </div>
  )
}
