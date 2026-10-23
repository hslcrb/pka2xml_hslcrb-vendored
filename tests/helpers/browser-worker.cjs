// Run the real classic browser worker in a Node worker for deterministic engine tests.
const { parentPort, workerData } = require('node:worker_threads');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

globalThis.self = globalThis;
globalThis.location = { href: 'http://localhost/converter.worker.js' };
globalThis.WorkerGlobalScope = class WorkerGlobalScope {};
globalThis.postMessage = (message, transfer) => parentPort.postMessage(message, transfer);
globalThis.importScripts = (...urls) => {
  for (const url of urls) {
    const filename = path.join(workerData.publicDir, path.basename(new URL(url, location.href).pathname));
    vm.runInThisContext(fs.readFileSync(filename, 'utf8'), { filename });
  }
};
globalThis.fetch = async (url) => {
  const filename = path.join(workerData.publicDir, path.basename(new URL(url, location.href).pathname));
  return new Response(fs.readFileSync(filename), { headers: { 'Content-Type': 'application/wasm' } });
};
parentPort.on('message', (data) => globalThis.onmessage({ data }));
const filename = path.join(workerData.publicDir, 'converter.worker.js');
vm.runInThisContext(fs.readFileSync(filename, 'utf8'), { filename });
