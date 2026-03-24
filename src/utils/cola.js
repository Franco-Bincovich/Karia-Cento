// utils/cola.js
// Cola de concurrencia para /api/chat.
// Limita requests simultáneos a la API de Anthropic para no saturarla.
// Máximo 3 requests concurrentes, los demás esperan en cola.
//
// Nota: p-queue 8.x es ESM-only y no compatible con require(). Se implementa
// un concurrency limiter CJS-nativo con la misma interfaz: cola.add(fn).

class ConcurrencyQueue {
  /**
   * @param {{ concurrency: number }} opts
   */
  constructor({ concurrency }) {
    this._concurrency = concurrency;
    this._running = 0;
    this._queue = [];
  }

  /**
   * Encola una función async y la ejecuta cuando haya un slot disponible.
   *
   * @param {() => Promise<any>} fn
   * @returns {Promise<any>}
   */
  add(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._dequeue();
    });
  }

  _dequeue() {
    while (this._running < this._concurrency && this._queue.length > 0) {
      const { fn, resolve, reject } = this._queue.shift();
      this._running++;
      Promise.resolve()
        .then(fn)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this._running--;
          this._dequeue();
        });
    }
  }
}

const cola = new ConcurrencyQueue({ concurrency: 3 });

module.exports = cola;
