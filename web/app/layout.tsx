import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'pka2xml — WASM Web Reversing Tool',
  description:
    'Cisco Packet Tracer .pka/.pkt 파일을 브라우저에서 직접 리버싱하는 WebAssembly 기반 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
