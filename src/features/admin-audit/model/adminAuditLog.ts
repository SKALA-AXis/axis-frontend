export type AdminAuditLog = {
  id: number;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string | null;
  reason: string | null;
  createdAt: string | null;
};
