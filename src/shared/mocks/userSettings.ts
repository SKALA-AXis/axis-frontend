export type LoginHistoryItem = {
  id: string;
  date: string;
  time: string;
  action: string;
  country: string;
  ipAddress: string;
};

export const mockLoginHistory: LoginHistoryItem[] = [
  { id: '1', date: '2026.05.04', time: '09:14', action: 'login', country: '대한민국', ipAddress: '121.168.25.41' },
  { id: '2', date: '2026.05.03', time: '18:42', action: 'view', country: '대한민국', ipAddress: '121.168.25.41' },
  { id: '3', date: '2026.05.02', time: '08:57', action: 'share', country: '일본', ipAddress: '103.24.77.118' },
  { id: '4', date: '2026.05.01', time: '21:05', action: 'download', country: '미국', ipAddress: '34.201.11.82' },
];
