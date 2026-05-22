export type NotificationSeverity = 'NORMAL' | 'IMPORTANT' | string;

export type NotificationItem = {
  id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  sourceType: string;
  sourceId: string;
  sourceUrl: string;
  companyName: string;
  matchedKeywords: string[];
  target: string;
  read: boolean;
  createdAt: string;
};

export type NotificationPreferences = {
  enabled: boolean;
  importantEnabled: boolean;
  keywords: string[];
};
