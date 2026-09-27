import { Closing } from '@/components/site/home/closing';
import { Hero } from '@/components/site/home/hero';
import { OppieSection } from '@/components/site/home/oppie';
import { PartnerInvite } from '@/components/site/home/partner';
import { Platform } from '@/components/site/home/platform';
import { Problem } from '@/components/site/home/problem';
import { Proof } from '@/components/site/home/proof';
export default function HomePage({ home, scenes }: { home: any; scenes: any[] }) {
  return (
    <>
      <Hero content={home.hero} scenes={scenes} />
      <Problem content={home.problem} />
      <Platform content={home.platform} />
      <OppieSection content={home.oppie} />
      <Proof content={home.proof} />
      <PartnerInvite content={home.partner} />
      <Closing content={home.closing} />
    </>
  );
}
