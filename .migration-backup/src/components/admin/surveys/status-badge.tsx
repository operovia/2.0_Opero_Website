import { Badge } from '@/components/ui/badge';
import { surveyStatusLabels, type SurveyStatus } from '@/surveys/types';

const tones = { draft: 'neutral', open: 'success', closed: 'warning' } as const;

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  return <Badge tone={tones[status]}>{surveyStatusLabels[status]}</Badge>;
}
