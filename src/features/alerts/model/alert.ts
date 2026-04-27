export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: string[];
  lastTriggered: string;
}

export interface AlertHistoryItem {
  id: string;
  title: string;
  message: string;
  channel: string;
  status: 'sent' | 'pending';
  triggeredAt: string;
}

export interface AlertsData {
  rules: AlertRule[];
  history: AlertHistoryItem[];
  conditionOptions: string[];
  channelOptions: string[];
}
