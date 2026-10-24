const assert = require('node:assert/strict');
const path = require('node:path');
const { Worker } = require('node:worker_threads');
const { test } = require('node:test');

const publicDir = path.resolve(__dirname, '../web/public');
const xml = new TextEncoder().encode('<PACKETTRACER><VERSION>8.2.2.0400</VERSION><NAME>한글 network</NAME></PACKETTRACER>');

function runtime(t) {
  const worker = new Worker(path.join(__dirname, 'helpers/browser-worker.cjs'), { workerData: { publicDir } });
  t.after(() => worker.terminate());
  let id = 0;
  return (type, payload = {}) => new Promise((resolve, reject) => {
    const jobId = ++id;
    const timer = setTimeout(() => done(new Error('Worker did not finish within 15 seconds')), 15000);
    const onMessage = (message) => {
      if (message.id === jobId) done(null, message);
    };
    const onError = (error) => done(error);
    function done(error, value) {
      clearTimeout(timer);
      worker.off('message', onMessage);
      worker.off('error', onError);
      error ? reject(error) : resolve(value);
    }
    worker.on('message', onMessage);
    worker.on('error', onError);
    worker.postMessage({ id: jobId, type, ...payload });
  });
}

test('real WASM worker preserves XML bytes across repeated conversions and Unicode names', async (t) => {
  const send = runtime(t);
  assert.equal((await send('init')).type, 'ready');
  for (let i = 0; i < 3; i++) {
    const encrypted = await send('convert', { data: xml, args: ['-e', '내 실습.xml', '결과.pka'] });
    assert.equal(encrypted.result.success, true, encrypted.result.logs.join('\n'));
    assert.ok(encrypted.result.output.length > 16);
    const decrypted = await send('convert', { data: encrypted.result.output, args: ['-d', '결과.pka', '내 실습.xml'] });
    assert.equal(decrypted.result.success, true, decrypted.result.logs.join('\n'));
    assert.deepEqual(decrypted.result.output, xml);
  }
});

test('a corrupt input fails without poisoning the following conversion', async (t) => {
  const send = runtime(t);
  const invalid = await send('convert', { data: new Uint8Array([1, 2, 3]), args: ['-d', 'broken.pka', 'result.xml'] });
  assert.equal(invalid.result.success, false);
  assert.equal(invalid.result.output, undefined);
  assert.ok(invalid.result.logs.length);
  const valid = await send('convert', { data: xml, args: ['-e', 'source.xml', 'good.pka'] });
  assert.equal(valid.result.success, true, valid.result.logs.join('\n'));
});

test('invalid arguments, oversized data, and virtual path traversal are rejected', async (t) => {
  const send = runtime(t);
  for (const args of [['-d'], ['--unknown', 'a', 'b'], ['-e', '../source.xml', 'output.pka']]) {
    const result = (await send('convert', { data: xml, args })).result;
    assert.equal(result.success, false);
    assert.equal(result.output, undefined);
  }
  const result = (await send('convert', { data: new Uint8Array(32 * 1024 * 1024 + 1), args: ['-e', 'a.xml', 'b.pka'] })).result;
  assert.equal(result.success, false);
  assert.match(result.logs.join(' '), /32/);
});

test('output-only forge and stdout nets operations use their real CLI arity', async (t) => {
  const send = runtime(t);
  const forged = (await send('convert', { data: new Uint8Array(), args: ['--forge', 'offline.nets'] })).result;
  assert.equal(forged.success, true, forged.logs.join('\n'));
  const decoded = (await send('convert', { data: forged.output, args: ['-nets', 'offline.nets'] })).result;
  assert.equal(decoded.success, true, decoded.logs.join('\n'));
  assert.ok(decoded.output.length > 0);
});
