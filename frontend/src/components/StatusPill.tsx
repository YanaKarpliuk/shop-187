import type { ReturnStatus } from '../api';
import { Badge, type BadgeTone } from './Badge';

const STATUS_TONE: Record<ReturnStatus, BadgeTone> = {
  open: 'amber',
  approved: 'emerald',
  rejected: 'red',
};

export function StatusPill({ status }: { status: ReturnStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} className="capitalize">
      {status}
    </Badge>
  );
}
