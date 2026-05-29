export type AdminCardStatus = 'ACTIVE' | 'PENDING' | 'DELETED';

export type AdminCard = {
  id: string;
  title: string;
  peerId: string;
  status: AdminCardStatus;
  createdAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  deletionReason: string | null;
  restoredAt: string | null;
  restoredBy: string | null;
  restoredReason: string | null;
};
