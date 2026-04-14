export interface ElectronAPI {
    openFile: (options: any) => Promise<string | undefined>;
    execute: (args: string[]) => Promise<{
        success: boolean;
        stdout: string;
        stderr: string;
        error?: string;
    }>;
    onMessage: (callback: (event: any, message: string) => void) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
