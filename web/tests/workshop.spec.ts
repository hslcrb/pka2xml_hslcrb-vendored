import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const sourceXml = Buffer.from('<PACKETTRACER><VERSION>8.2.2.0400</VERSION><NAME>우리 실습</NAME></PACKETTRACER>');

async function downloadedBytes(download: import('@playwright/test').Download) {
  const file = await download.path();
  if (!file) throw new Error('Download did not produce a local file');
  return readFile(file);
}

test('the introduction loads no converter and fits desktop and mobile', async ({ page }) => {
  const engineRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (/pka2xml\.(wasm|js)|converter\.worker\.js/.test(request.url())) engineRequests.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('a[href="/workbench"]').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(engineRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('a real browser worker round-trips Unicode XML and recovers after corrupt data without uploading', async ({ page }) => {
  const uploads: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' || request.method() === 'PUT') uploads.push(request.url());
  });
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const worker = new Worker('/converter.worker.js');
    let id = 0;
    type Result = { success: boolean; output?: Uint8Array; logs: string[] };
    function convert(args: string[], data: Uint8Array): Promise<Result> {
      return new Promise((resolve, reject) => {
        const job = ++id;
        const timeout = setTimeout(() => reject(new Error('Worker timeout')), 20_000);
        worker.onmessage = ({ data: reply }) => {
          if (reply.id !== job) return;
          clearTimeout(timeout);
          if (reply.type === 'error') reject(new Error(reply.message));
          else resolve(reply.result);
        };
        worker.onerror = () => reject(new Error('Worker failed'));
        worker.postMessage({ id: job, type: 'convert', args, data });
      });
    }
    try {
      const xml = new TextEncoder().encode('<PACKETTRACER><VERSION>8.2.2.0400</VERSION><NAME>우리 네트워크</NAME></PACKETTRACER>');
      const bad = await convert(['-d', '손상 파일.pka', 'result.xml'], new Uint8Array([1, 2, 3]));
      const encoded = await convert(['-e', '우리 실습.xml', 'result.pka'], xml);
      if (!encoded.output) throw new Error(encoded.logs.join('\n'));
      const decoded = await convert(['-d', 'result.pka', '우리 실습.xml'], encoded.output);
      const patched = await convert(['-f', 'result.pka', 'patched.pkt'], encoded.output);
      if (!patched.output) throw new Error(patched.logs.join('\n'));
      const patchXml = await convert(['-d', 'patched.pkt', 'patched.xml'], patched.output);
      return {
        badSucceeded: bad.success,
        encoded: encoded.success,
        decoded: decoded.success,
        exact: Array.from(decoded.output || []).join(',') === Array.from(xml).join(','),
        patched: patched.success,
        patchedXml: new TextDecoder().decode(patchXml.output),
      };
    } finally {
      worker.terminate();
    }
  });
  expect(result.badSucceeded).toBe(false);
  expect(result.encoded).toBe(true);
  expect(result.decoded).toBe(true);
  expect(result.exact).toBe(true);
  expect(result.patched).toBe(true);
  expect(result.patchedXml).toContain('<VERSION>6.0.1.0000</VERSION>');
  expect(uploads).toEqual([]);
});

test('the workbench route is reachable with keyboard navigation and has no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/workbench');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('GUI downloads exact round trips, clears stale results, and recovers from a corrupt file', async ({ page }) => {
  await page.goto('/workbench');
  await page.getByRole('button', { name: /다시 패키징/ }).click();
  await page.getByTestId('file-input').setInputFiles({ name: '우리 실습.xml', mimeType: 'application/xml', buffer: sourceXml });
  await page.getByTestId('run-conversion').click();
  await expect(page.getByTestId('download-result')).toBeVisible();
  const [encryptedDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-result').click()]);
  expect(encryptedDownload.suggestedFilename()).toBe('우리 실습.pka');
  const encrypted = await downloadedBytes(encryptedDownload);

  await page.getByRole('button', { name: /XML로 열기/ }).click();
  await expect(page.getByTestId('download-result')).toHaveCount(0);
  await expect(page.getByTestId('run-conversion')).toBeDisabled();
  await page.getByTestId('file-input').setInputFiles({ name: '우리 실습.pka', mimeType: 'application/octet-stream', buffer: encrypted });
  await page.getByTestId('run-conversion').click();
  await expect(page.getByTestId('download-result')).toBeVisible();
  const [decryptedDownload] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-result').click()]);
  expect(await downloadedBytes(decryptedDownload)).toEqual(sourceXml);

  await page.getByTestId('file-input').setInputFiles({ name: '손상 파일.pka', mimeType: 'application/octet-stream', buffer: Buffer.from([1, 2, 3]) });
  await expect(page.getByTestId('download-result')).toHaveCount(0);
  await page.getByTestId('run-conversion').click();
  await expect(page.getByText('다시 한번 살펴볼까요?')).toBeVisible();
  await expect(page.getByTestId('download-result')).toHaveCount(0);
  await page.getByTestId('file-input').setInputFiles({ name: '복구.pka', mimeType: 'application/octet-stream', buffer: encrypted });
  await page.getByTestId('run-conversion').click();
  await expect(page.getByTestId('download-result')).toBeVisible();
});

test('GUI forge needs no input file and its result can be read through nets', async ({ page }) => {
  await page.goto('/workbench');
  await page.getByLabel('고급 작업').selectOption('forge');
  await expect(page.getByTestId('file-input')).toHaveCount(0);
  await expect(page.getByTestId('run-conversion')).toBeEnabled();
  await page.getByTestId('run-conversion').click();
  await expect(page.getByTestId('download-result')).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-result').click()]);
  const generated = await downloadedBytes(download);
  expect(generated.length).toBeGreaterThan(16);
  await page.getByLabel('고급 작업').selectOption('nets');
  await expect(page.getByTestId('download-result')).toHaveCount(0);
  await page.getByTestId('file-input').setInputFiles({ name: 'auth.txt', mimeType: 'application/octet-stream', buffer: generated });
  await page.getByTestId('run-conversion').click();
  await expect(page.getByTestId('download-result')).toBeVisible();
  await expect(page.locator('.preview-details pre')).not.toBeEmpty();
});

test('cancelling engine startup clears the job and retry uses a fresh worker', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/pka2xml.wasm', async route => {
    await gate;
    await route.continue().catch(() => undefined);
  });
  try {
    await page.goto('/workbench');
    await page.getByRole('button', { name: /다시 패키징/ }).click();
    await page.getByTestId('file-input').setInputFiles({ name: '취소 후 재시도.xml', mimeType: 'application/xml', buffer: sourceXml });
    const requested = page.waitForRequest('**/pka2xml.wasm');
    await page.getByTestId('run-conversion').click();
    await requested;
    await page.getByTestId('cancel-conversion').click();
    await expect(page.getByText('작업을 멈췄어요.')).toBeVisible();
    await expect(page.getByTestId('download-result')).toHaveCount(0);
    release();
    await page.unroute('**/pka2xml.wasm');
    await page.getByTestId('run-conversion').click();
    await expect(page.getByTestId('download-result')).toBeVisible();
  } finally { release(); }
});

test('console accepts quoted Korean filenames and keeps results for the download command', async ({ page }) => {
  await page.goto('/workbench');
  await page.getByRole('tab', { name: /명령어 콘솔/ }).click();
  await page.getByTestId('file-input').setInputFiles({ name: '우리 실습.xml', mimeType: 'application/xml', buffer: sourceXml });
  await page.getByTestId('console-input').fill('pka2xml -e "우리 실습.xml" "명령어 결과.pka"');
  await page.getByTestId('run-command').click();
  await expect(page.getByTestId('download-result')).toBeVisible();
  await page.getByTestId('console-input').fill('ls');
  await page.getByTestId('run-command').click();
  await expect(page.getByRole('log')).toContainText('명령어 결과.pka');
  await page.getByTestId('console-input').fill('download');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('run-command').click()]);
  expect(download.suggestedFilename()).toBe('명령어 결과.pka');
  expect((await downloadedBytes(download)).length).toBeGreaterThan(16);
  await page.getByTestId('console-input').fill('clear');
  await page.getByTestId('run-command').click();
  await expect(page.getByRole('log')).toBeEmpty();
  await expect(page.getByTestId('download-result')).toHaveCount(0);
});
