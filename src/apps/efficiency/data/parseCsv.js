import workerSource from "../../../workers/csvWorkerSource.worker.js";

function createCsvWorker() {
  const blob = new Blob([workerSource], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);
  return { worker, workerUrl };
}

function cleanupWorker(worker, workerUrl) {
  worker.terminate();
  URL.revokeObjectURL(workerUrl);
}

function safeCleanup(worker, workerUrl) {
  try {
    cleanupWorker(worker, workerUrl);
  } catch {
    // no-op cleanup fallback
  }
}

function parseError(error, fallback) {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" && error ? error : fallback);
}

function runWorker(file, onProgress) {
  const { worker, workerUrl } = createCsvWorker();

  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const { type, payload, error } = event.data || {};
      if (type === "progress") {
        onProgress?.(payload?.progress || 0);
        return;
      }
      if (type === "result") {
        safeCleanup(worker, workerUrl);
        resolve(payload);
        return;
      }
      if (type === "error") {
        safeCleanup(worker, workerUrl);
        reject(parseError(error, "CSV parse failed."));
      }
    };

    worker.onerror = (event) => {
      safeCleanup(worker, workerUrl);
      reject(parseError(event?.message, "Worker execution failed."));
    };

    worker.postMessage({ file });
  });
}


export function parseCsvWithWorker(file, onProgress) {
  return runWorker(file, onProgress);
}
