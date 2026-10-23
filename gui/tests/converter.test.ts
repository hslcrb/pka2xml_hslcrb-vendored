import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm, symlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { binaryPathFor, buildArguments, executeConversion, validateRequest } from '../electron/converter.js'

test('validates a narrow operation and absolute paths before starting any process', () => {
  for (const invalid of [null, [], {}, { operation: 'GRAPH_MODE' }, { operation: 'decrypt', inputPath: 'relative.pka', outputPath: '/tmp/result.xml' }, { operation: 'forge', outputPath: '/tmp/a\0b' }]) {
    assert.throws(() => validateRequest(invalid))
  }
  assert.throws(() => validateRequest({ operation: 'decrypt', inputPath: '/tmp/same', outputPath: '/tmp/same' }), /같은/)
  assert.deepEqual(buildArguments({ operation: 'decrypt', inputPath: '/tmp/한글 ; input.pka', outputPath: '/tmp/out.xml' }), ['-d', '/tmp/한글 ; input.pka', '/tmp/out.xml'])
  assert.deepEqual(buildArguments({ operation: 'forge', outputPath: '/tmp/auth' }), ['--forge', '/tmp/auth'])
  assert.deepEqual(buildArguments({ operation: 'logs', inputPath: '/tmp/log' }), ['-logs', '/tmp/log'])
})

test('resolves the packaged engine outside app.asar', () => {
  assert.equal(binaryPathFor('/repo/gui', '/package/resources', false), '/repo/pka2xml')
  assert.equal(binaryPathFor('/package/resources/app.asar', '/package/resources', true), '/package/resources/bin/pka2xml')
})

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pka2xml-desktop-'))
  const binary = path.join(directory, 'test-engine')
  await writeFile(binary, `#!/usr/bin/env node
const fs = require('node:fs');
const [flag, input, output] = process.argv.slice(2);
if (flag === '-nets' || flag === '-logs') { fs.writeSync(1, fs.readFileSync(input)); process.exit(0); }
const content = flag === '--forge' ? 'auth' : fs.readFileSync(input, 'utf8');
const target = flag === '--forge' ? input : output;
if (content === 'slow') { setTimeout(() => fs.writeFileSync(target, 'late'), 30000); }
else if (content === 'fail') { fs.writeFileSync(target, 'partial'); fs.writeSync(2, 'invalid packet'); process.exitCode = 2; }
else { fs.writeFileSync(target, content); fs.writeSync(1, JSON.stringify(process.argv.slice(2))); }
`, { mode: 0o755 })
  return { directory, binary, cleanup: () => rm(directory, { recursive: true, force: true }) }
}

test('passes Unicode and shell metacharacters literally and produces a usable file', async () => {
  const f = await fixture()
  try {
    const inputPath = path.join(f.directory, '입력 " ; $(touch SHOULD_NOT_EXIST).pka')
    const outputPath = path.join(f.directory, '저장 파일.xml')
    await writeFile(inputPath, '<PACKETTRACER5/>')
    const result = await executeConversion(f.binary, { operation: 'decrypt', inputPath, outputPath })
    assert.equal(result.success, true, result.error)
    assert.equal(result.outputPath, outputPath)
    assert.equal(await readFile(outputPath, 'utf8'), '<PACKETTRACER5/>')
    assert.equal(JSON.parse(result.stdout)[1], inputPath)
  } finally { await f.cleanup() }
})

test('failure preserves an existing destination and a later conversion still succeeds', async () => {
  const f = await fixture()
  try {
    const inputPath = path.join(f.directory, 'input.pka')
    const outputPath = path.join(f.directory, 'output.xml')
    await writeFile(inputPath, 'fail')
    await writeFile(outputPath, 'keep me')
    const failed = await executeConversion(f.binary, { operation: 'decrypt', inputPath, outputPath })
    assert.equal(failed.success, false)
    assert.match(failed.error ?? '', /invalid packet/)
    assert.equal(await readFile(outputPath, 'utf8'), 'keep me')
    await writeFile(inputPath, 'recovered')
    assert.equal((await executeConversion(f.binary, { operation: 'decrypt', inputPath, outputPath })).success, true)
    assert.equal(await readFile(outputPath, 'utf8'), 'recovered')
  } finally { await f.cleanup() }
})

test('cancellation and timeout preserve the destination and clean temporary files', async () => {
  const f = await fixture()
  try {
    const inputPath = path.join(f.directory, 'input.pka')
    const outputPath = path.join(f.directory, 'output.xml')
    await writeFile(inputPath, 'slow')
    await writeFile(outputPath, 'keep me')
    const controller = new AbortController()
    const pending = executeConversion(f.binary, { operation: 'decrypt', inputPath, outputPath }, controller.signal)
    setTimeout(() => controller.abort(), 100)
    const cancelled = await pending
    assert.equal(cancelled.cancelled, true)
    assert.equal(cancelled.success, false)
    const timedOut = await executeConversion(f.binary, { operation: 'decrypt', inputPath, outputPath }, undefined, 100)
    assert.equal(timedOut.success, false)
    assert.match(timedOut.error ?? '', /시간/)
    assert.equal(await readFile(outputPath, 'utf8'), 'keep me')
    const { readdir } = await import('node:fs/promises')
    assert.deepEqual((await readdir(f.directory)).sort(), ['input.pka', 'output.xml', 'test-engine'])
  } finally { await f.cleanup() }
})

test('rejects source aliases and returns stdout-only operations without an output path', async () => {
  const f = await fixture()
  try {
    const inputPath = path.join(f.directory, 'input')
    const outputPath = path.join(f.directory, 'alias')
    await writeFile(inputPath, 'hello')
    await symlink(inputPath, outputPath)
    const result = await executeConversion(f.binary, { operation: 'decrypt', inputPath, outputPath })
    assert.equal(result.success, false)
    assert.match(result.error ?? '', /같은/)
    const decoded = await executeConversion(f.binary, { operation: 'nets', inputPath })
    assert.equal(decoded.success, true)
    assert.equal(decoded.stdout, 'hello')
    assert.equal(decoded.outputPath, undefined)
  } finally { await f.cleanup() }
})
