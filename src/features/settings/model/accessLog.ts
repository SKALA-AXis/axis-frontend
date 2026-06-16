export type AccessLogItem = {
  id: string;
  action: string;
  success: boolean;
  country: string;
  ipAddress: string;
  userAgent: string;
  occurredAt: string;
};

export type AccessLogPage = {
  items: AccessLogItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};
