import { Badge } from '@/components/ui/badge';
import { statusBadgeVariant, statusLabel, type ApplicationStatus } from './lib';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>;
}
