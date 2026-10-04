import { redirect } from 'next/navigation';
import { DATA_ROOM_PATH } from '@/content/constants';

/** The Investor Hub's old address. It is the Data Room's Overview now, so links already sent keep working. */
export default function InvestorsPage() {
  redirect(DATA_ROOM_PATH);
}
