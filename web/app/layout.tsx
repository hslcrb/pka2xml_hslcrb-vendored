import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'pka2xml — 파일 속 네트워크를 투명하게', template: '%s · pka2xml' },
  description:
    'Packet Tracer PKA·PKT와 XML 사이를 가볍게. 파일을 서버에 업로드하지 않고 브라우저에서 변환하는 오픈소스 작업실.',
  applicationName: 'pka2xml',
  icons: { icon: '/brand/pka2xml-mark.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
