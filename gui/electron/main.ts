import { app, BrowserWindow, ipcMain, dialog, shell, type IpcMainInvokeEvent } from 'electron'
import { access, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { binaryPathFor, executeConversion, validateRequest } from './converter.js'
import { isTrustedFrame, suggestedOutput, validateOperation } from './policy.js'
import type { ConversionResult, EngineInfo, Operation } from '../shared/contracts.js'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rendererFile = path.join(appRoot, 'dist', 'index.html')
const devURL = app.isPackaged ? undefined : process.env.VITE_DEV_SERVER_URL
const rendererURL = devURL ?? pathToFileURL(rendererFile).href
const binaryPath = binaryPathFor(appRoot, process.resourcesPath, app.isPackaged)
let win: BrowserWindow | null = null
let activeJob: AbortController | null = null
let lastOutput: string | undefined

function trustedWindow(event: IpcMainInvokeEvent): BrowserWindow {
  if (!win || event.sender !== win.webContents || !isTrustedFrame(event.senderFrame?.url ?? '', rendererURL, event.senderFrame === win.webContents.mainFrame)) {
    throw new Error('허용되지 않은 요청입니다.')
  }
  return win
}

async function engineInfo(): Promise<EngineInfo> {
  const platform = `${process.platform} ${process.arch}`
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    return { available: false, platform, message: '현재 데스크톱 변환 엔진은 Linux x64에서 지원됩니다. 다른 환경에서는 브라우저 작업실 또는 직접 빌드한 명령줄 도구를 사용해 주세요.' }
  }
  try {
    await access(binaryPath, constants.X_OK)
    if (!(await stat(binaryPath)).isFile()) throw new Error('Not a file')
    return { available: true, platform, message: '내 컴퓨터의 변환 엔진이 준비되었습니다.' }
  } catch {
    return { available: false, platform, message: app.isPackaged ? '앱에 변환 엔진이 없습니다. resources/bin/pka2xml이 포함된 Linux 배포본을 사용해 주세요.' : '변환 엔진을 찾을 수 없습니다. 저장소 루트에서 make로 pka2xml을 빌드한 뒤 앱을 다시 열어 주세요.' }
  }
}

function filtersFor(operation: Operation, output = false) {
  if (operation === 'decrypt' && output || operation === 'encrypt' && !output) return [{ name: 'XML', extensions: ['xml'] }]
  if (['decrypt', 'encrypt', 'fix'].includes(operation)) return [{ name: 'Packet Tracer', extensions: ['pka', 'pkt'] }]
  return [{ name: '모든 파일', extensions: ['*'] }]
}

function failure(error: string, cancelled = false): ConversionResult {
  return { success: false, cancelled, error, stdout: '', stderr: '', elapsedMs: 0, exitCode: null }
}

function registerHandlers() {
  ipcMain.handle('workshop:engine', event => { trustedWindow(event); return engineInfo() })
  ipcMain.handle('workshop:input', async (event, value: unknown) => {
    const window = trustedWindow(event)
    const operation = validateOperation(value)
    if (activeJob) throw new Error('진행 중인 작업을 먼저 완료해 주세요.')
    const result = await dialog.showOpenDialog(window, { title: '원본 파일 선택', buttonLabel: '이 파일 사용', properties: ['openFile'], filters: filtersFor(operation) })
    return result.canceled ? null : result.filePaths[0] ?? null
  })
  ipcMain.handle('workshop:output', async (event, value: unknown, inputPath: unknown) => {
    const window = trustedWindow(event)
    const operation = validateOperation(value)
    if (activeJob) throw new Error('진행 중인 작업을 먼저 완료해 주세요.')
    const source = typeof inputPath === 'string' && inputPath.length <= 4096 && !inputPath.includes('\0') && path.isAbsolute(inputPath) ? inputPath : undefined
    const result = await dialog.showSaveDialog(window, { title: '결과를 저장할 위치', buttonLabel: '이 위치 사용', defaultPath: suggestedOutput(operation, source), filters: filtersFor(operation, true) })
    return result.canceled ? null : result.filePath ?? null
  })
  ipcMain.handle('workshop:execute', async (event, value: unknown): Promise<ConversionResult> => {
    const window = trustedWindow(event)
    if (activeJob) return failure('다른 변환 작업이 진행 중입니다.')
    const controller = new AbortController()
    activeJob = controller
    lastOutput = undefined
    try {
      const request = validateRequest(value)
      const engine = await engineInfo()
      if (!engine.available) return failure(engine.message)
      if (request.outputPath && await access(request.outputPath).then(() => true, () => false)) {
        const answer = await dialog.showMessageBox(window, {
          type: 'question', title: '기존 결과 파일 바꾸기', message: '이 위치의 파일을 새 결과로 바꿀까요?',
          detail: `${request.outputPath}\n\n변환이 성공했을 때만 기존 파일을 바꿉니다.`,
          buttons: ['돌아가기', '파일 바꾸기'], defaultId: 0, cancelId: 0,
        })
        if (answer.response !== 1) return failure('저장을 취소했습니다. 기존 파일은 유지됩니다.', true)
      }
      const result = await executeConversion(binaryPath, request, controller.signal)
      if (result.success) lastOutput = result.outputPath
      return result
    } catch (error) {
      return failure(error instanceof Error ? error.message : '작업을 시작하지 못했습니다.')
    } finally { activeJob = null }
  })
  ipcMain.handle('workshop:cancel', event => {
    trustedWindow(event)
    if (!activeJob) return false
    activeJob.abort()
    return true
  })
  ipcMain.handle('workshop:reveal', async event => {
    trustedWindow(event)
    if (!lastOutput) return false
    try {
      await access(lastOutput)
      shell.showItemInFolder(lastOutput)
      return true
    } catch { return false }
  })
}

function createWindow() {
  win = new BrowserWindow({
    title: 'pka2xml · 투명한 작업실', width: 1200, height: 880, minWidth: 720, minHeight: 600,
    backgroundColor: '#F5F4ED', autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(appRoot, 'dist-electron', 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
    },
  })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedFrame(url, rendererURL, true)) event.preventDefault()
  })
  win.webContents.session.setPermissionCheckHandler((contents, permission, _origin, details) =>
    contents === win?.webContents && permission === 'clipboard-sanitized-write' && isTrustedFrame(details.requestingUrl ?? '', rendererURL, details.isMainFrame))
  win.webContents.session.setPermissionRequestHandler((contents, permission, callback, details) =>
    callback(contents === win?.webContents && permission === 'clipboard-sanitized-write' && isTrustedFrame(details.requestingUrl, rendererURL, details.isMainFrame)))
  win.on('closed', () => { activeJob?.abort(); win = null })
  void win.loadURL(rendererURL)
}

app.on('before-quit', () => activeJob?.abort())
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
void app.whenReady().then(() => { registerHandlers(); createWindow() })
