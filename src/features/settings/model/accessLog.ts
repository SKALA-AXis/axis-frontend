export type AccessLogItem = {
  id: string;
  action: string;
  success: boolean;
  country: string;
  ipAddress: string;
  userAgent: string;
  occurredAt: string;
};
