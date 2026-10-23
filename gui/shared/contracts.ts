export const operations = ['decrypt', 'encrypt', 'fix', 'forge', 'nets', 'logs'] as const
export type Operation = typeof operations[number]

export interface ConversionRequest {
  operation: Operation
  inputPath?: string
  outputPath?: string
}

export interface ConversionResult {
  success: boolean
  cancelled: boolean
  stdout: string
  stderr: string
  error?: string
  outputPath?: string
  elapsedMs: number
  exitCode: number | null
}

export interface EngineInfo {
  available: boolean
  platform: string
  message: string
}

export interface ElectronAPI {
  getEngineInfo: () => Promise<EngineInfo>
  chooseInput: (operation: Operation) => Promise<string | null>
  chooseOutput: (operation: Operation, inputPath?: string) => Promise<string | null>
  execute: (request: ConversionRequest) => Promise<ConversionResult>
  cancel: () => Promise<boolean>
  revealOutput: () => Promise<boolean>
}
