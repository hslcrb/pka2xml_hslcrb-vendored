const fs = require('node:fs')
const path = require('node:path')

const binary = path.resolve(__dirname, '../../pka2xml')
try {
  if (process.platform !== 'linux' || process.arch !== 'x64') throw new Error('현재 패키징 대상은 Linux x64입니다.')
  fs.accessSync(binary, fs.constants.X_OK)
  const file = fs.openSync(binary, 'r')
  const header = Buffer.alloc(20)
  try { fs.readSync(file, header, 0, header.length, 0) } finally { fs.closeSync(file) }
  if (header.toString('hex', 0, 4) !== '7f454c46' || header[4] !== 2 || header.readUInt16LE(18) !== 62) throw new Error('Linux x64 ELF 엔진이 필요합니다.')
  console.log('Linux x64 변환 엔진 확인: resources/bin/pka2xml에 포함됩니다.')
} catch (error) {
  console.error(`패키징 준비 실패: ${error.message}\n저장소 루트에서 make로 변환 엔진을 먼저 빌드해 주세요.`)
  process.exitCode = 1
}
