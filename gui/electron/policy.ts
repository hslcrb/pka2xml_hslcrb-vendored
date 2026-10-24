import path from 'node:path'
import { operations, type Operation } from '../shared/contracts.js'

export function isTrustedFrame(frameURL: string, expectedURL: string, mainFrame: boolean): boolean {
  if (!mainFrame) return false
  try {
    const frame = new URL(frameURL)
    const expected = new URL(expectedURL)
    frame.hash = ''
    expected.hash = ''
    return frame.href === expected.href
  } catch { return false }
}

export function validateOperation(value: unknown): Operation {
  if (typeof value !== 'string' || !operations.includes(value as Operation)) throw new Error('지원하지 않는 작업입니다.')
  return value as Operation
}

export function suggestedOutput(operation: Operation, inputPath?: string): string {
  if (operation === 'forge') return 'packettracer-auth'
  const parsed = path.parse(inputPath ?? 'network')
  const extension = operation === 'decrypt' ? '.xml' : operation === 'fix' && parsed.ext.toLowerCase() === '.pkt' ? '.pkt' : '.pka'
  const suffix = operation === 'fix' ? '.compatible' : parsed.ext.toLowerCase() === extension ? '.converted' : ''
  return path.join(parsed.dir, `${parsed.name}${suffix}${extension}`)
}
