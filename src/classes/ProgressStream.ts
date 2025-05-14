import { type ReadStream, statSync } from 'node:fs'
import { isReadable, Readable, Transform } from 'node:stream'
import type { ProgressOptions, ProgressStreamState } from 'src/types'
import type { StreamData } from 'src/types/types'
import type { SimpleVoidFunction } from 'typestar'
import throughput from '../utils/throughput'

interface HttpSource extends Readable {
  headers?: {
    'content-encoding'?: string
    'content-length'?: string
  }
}

const DefaultOptions: ProgressOptions = {
  drain: false,
  length: 0,
  objectMode: false,
  speed: 5000,
  time: 0,
  transferred: 0
}

export default class ProgressStream extends Transform {
  #delta: number
  readonly #drain: boolean
  #length: number
  #nextUpdate: number
  readonly #speed: (delta: number) => number
  readonly #start: number
  readonly #state: ProgressStreamState
  readonly #time: number
  #transferred: number

  constructor(options: Partial<ProgressOptions>, onProgress?: VoidFunction) {
    const opts = Object.assign({}, DefaultOptions, options)

    super({
      highWaterMark: opts.objectMode ? 16 : undefined,
      objectMode: opts.objectMode
    })

    const length = (this.#length = opts.length)
    this.#time = opts.time
    this.#transferred = opts.transferred
    this.#delta = 0
    this.#drain = opts.drain
    this.#start = Date.now()
    this.#nextUpdate = this.#start + this.#time
    this.#speed = throughput(opts.speed)

    this.#state = {
      delta: 0,
      eta: 0,
      length,
      percentage: 0,
      remaining: length,
      runtime: 0,
      speed: 0,
      transferred: this.#transferred
    }

    if (onProgress) this.on('progress', onProgress)
    if (this.#drain) this.resume()

    this.setupPipeHandlers()
  }

  private emitProgress(ended: boolean): void {
    const state = this.#state
    state.delta = this.#delta
    state.percentage = ended ? 100 : (this.#length ? (this.#transferred / this.#length) * 100 : 0)
    state.speed = this.#speed(this.#delta)
    state.eta = Math.round(state.remaining / state.speed) || 0
    state.runtime = Math.floor((Date.now() - this.#start) / 1000)
    this.#nextUpdate = Date.now() + this.#time

    this.#delta = 0
    this.emit('progress', this.#state)
  }

  private setupPipeHandlers(): void {
    this.on('pipe', source => {
      if (this.#length > 0) return
      if (isHttpSource(source)) {
        this.setLength(+(source.headers?.['content-length'] ?? 0))
        return
      }

      if (isReadable(source) && 'path' in source) {
        this.setLength(statSync((source as ReadStream).path as string).size)
      }
    })
  }

  _flush(callback: SimpleVoidFunction): void {
    this.emitProgress(true)
    callback()
  }

  _transform(chunk: StreamData, _encoding?: BufferEncoding, callback?: (error?: Error | null, data?: any) => void): void {
    const len = (this as any)._writableState.objectMode ? 1 : chunk.length
    const transferred = (this.#transferred += len)
    this.#delta += len
    this.#state.transferred = transferred
    this.#state.remaining = Math.max(this.#length - transferred, 0)

    if (Date.now() >= this.#nextUpdate) {
      this.emitProgress(false)
    }

    callback?.(null, chunk)
  }

  /**
   *  Returns the current progress state of the stream.
   *
   *  @returns The current progress state.
   */
  progress(): ProgressStreamState {
    const state = this.#state
    state.speed = this.#speed(0)
    state.eta = Math.round(state.remaining / state.speed) || 0
    return state
  }

  /**
   * Sets the total length of the data being processed.
   *
   * @param newLength - The new total length.
   */
  setLength(newLength: number): void {
    const len = (this.#length = newLength)
    this.#state.length = len
    this.#state.remaining = len - this.#transferred
    this.emit('length', len)
  }
}

function isHttpSource(s: any): s is HttpSource {
  return s.readable && !s.writable && !!s.headers
}
