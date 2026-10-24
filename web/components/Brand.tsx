import Image from 'next/image';
import Link from 'next/link';

export const SOURCE_URL = 'https://github.com/hslcrb/pka2xml_hslcrb-vendored';

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="pka2xml 홈">
      <Image src="/brand/pka2xml-mark.svg" alt="" width={40} height={40} priority />
      <span className="brand-name">pka<span>2</span>xml</span>
      {!compact && <span className="brand-note">THE TRANSPARENT WORKSHOP</span>}
    </Link>
  );
}
