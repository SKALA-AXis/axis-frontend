import { ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { GlobalTrendsPanel } from '../../../../features/global-trends/components/GlobalTrendsPanel';

interface GlobalTrendsViewProps {
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}

export function GlobalTrendsView({ onUpdateTimeChange }: GlobalTrendsViewProps) {
  return (
    <ExecutivePage>
      <ExecutiveContainer>
        <GlobalTrendsPanel onUpdateTimeChange={onUpdateTimeChange} />
      </ExecutiveContainer>
    </ExecutivePage>
  );
}
