import type { Metadata } from 'next';
import Workbench from '@/components/Workbench';
export const metadata: Metadata = { title: '워크벤치', description: 'Packet Tracer 파일을 이 기기에서 변환하세요. 파일 변환 GUI와 접근성 높은 명령어 콘솔을 제공합니다.' };
export default function WorkbenchPage() { return <Workbench />; }
