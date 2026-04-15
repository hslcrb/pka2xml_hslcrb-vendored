// WASM 모듈 로더: Emscripten으로 컴파일된 pka2xml.wasm을 동적 로딩
// 파일 변환은 Web Worker에서 격리 실행됨

export interface WasmModule {
    callMain: (args: string[]) => number;
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
        readFile: (path: string) => Uint8Array;
        unlink: (path: string) => void;
        mkdir: (path: string) => void;
    };
}

let cachedModule: WasmModule | null = null;

export async function loadWasm(): Promise<WasmModule> {
    if (cachedModule) return cachedModule;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const factory = (window as any).createPka2xml;
    if (!factory) {
        throw new Error(
            'pka2xml WASM 모듈이 로드되지 않았습니다. /pka2xml.js 스크립트가 <head>에 포함되어 있는지 확인하세요.'
        );
    }

    cachedModule = await factory({
        print: (text: string) => console.log('[pka2xml]', text),
        printErr: (text: string) => console.error('[pka2xml err]', text),
    });

    return cachedModule!;
}

export interface ConvertResult {
    success: boolean;
    output?: Uint8Array<ArrayBuffer>;
    logs: string[];
    exitCode: number;
}

/**
 * pka2xml 변환 실행 (WASM 직접 호출)
 * @param inputFileName 가상 파일시스템 상의 입력 파일명 (e.g. "input.pka")
 * @param outputFileName 가상 파일시스템 상의 출력 파일명 (e.g. "output.xml")
 * @param inputData 입력 파일의 바이트 데이터
 * @param args CLI args (e.g. ["-d", "input.pka", "output.xml"])
 */
export async function runPka2xml(
    inputData: Uint8Array,
    args: string[]
): Promise<ConvertResult> {
    const logs: string[] = [];
    let exitCode = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const factory = (window as any).createPka2xml;
    if (!factory) {
        return { success: false, logs: ['WASM 모듈 로드 실패'], exitCode: -1 };
    }

    const mod: WasmModule = await factory({
        print: (text: string) => logs.push(text),
        printErr: (text: string) => logs.push(`[ERR] ${text}`),
    });

    try {
        // 입력 파일을 MEMFS 가상 파일시스템에 마운트
        const inputPath = '/' + args[args.length - 2];
        const outputPath = '/' + args[args.length - 1];
        mod.FS.writeFile(inputPath, inputData);

        exitCode = mod.callMain(args);

        let output: Uint8Array<ArrayBuffer> | undefined;
        try {
            const raw = mod.FS.readFile(outputPath);
            output = new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)) as Uint8Array<ArrayBuffer>;
            mod.FS.unlink(outputPath);
        } catch {
            // 출력 파일이 없는 경우 (e.g. forge 명령)
        }
        mod.FS.unlink(inputPath);

        return { success: exitCode === 0, output, logs, exitCode };
    } catch (e) {
        logs.push(String(e));
        return { success: false, logs, exitCode: -1 };
    }
}
