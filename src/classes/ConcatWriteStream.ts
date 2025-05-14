import { Writable } from 'node:stream'
import { isTypedArray } from 'node:util/types'
import type { StreamData, StreamEncoding } from 'src/types/types'
import type { AnyArray, AnyObject, SimpleVoidFunction } from 'typestar'
import { isArray, isObj, isString, mergeArr, toObjString } from 'compresso'
import { bufferFrom } from 'src/constants'

type StreamDataEncoded<T extends StreamEncoding | undefined> = T extends 'string'
  ? string
  : T extends 'buffer'
    ? Buffer
    : T extends 'u8' | 'uint8' | 'uint8array'
      ? Uint8Array
      : T extends 'array'
        ? AnyArray<unknown>
        : T extends 'objects'
          ? AnyObject
          : StreamData

export default class ConcatWriteStream<T extends StreamEncoding> extends Writable {
  private readonly body: StreamData[]
  private encoding?: string
  private readonly shouldInferEncoding: boolean

  constructor(callback?: (data: StreamDataEncoded<T>) => void, opts: { encoding?: T } = {}) {
    super({ objectMode: true })
    let encoding = opts.encoding
    let shouldInferEncoding = false

    if (encoding) {
      if (encoding === 'u8' || encoding === 'uint8') encoding = 'uint8array' as T
    } else {
      shouldInferEncoding = true
    }

    this.encoding = encoding
    this.shouldInferEncoding = shouldInferEncoding
    this.body = []

    if (callback) {
      this.on('finish', () => {
        callback(this.getBody())
      })
    }
  }

  private getBody(): StreamDataEncoded<T> {
    if (!this.encoding && this.body.length === 0) return [] as AnyArray<unknown> as StreamDataEncoded<T>
    if (this.shouldInferEncoding) this.encoding = inferEncoding(this.body)

    switch (this.encoding!) {
      case 'array':
        return arrayConcat(this.body) as StreamDataEncoded<T>
      case 'buffer':
        return bufferConcat(this.body) as StreamDataEncoded<T>
      case 'string':
        return stringConcat(this.body) as StreamDataEncoded<T>
      case 'uint8array':
        return u8Concat(this.body) as StreamDataEncoded<T>
    }
    return this.body as StreamDataEncoded<T>
  }

  _write(chunk: StreamData, _enc: string, next: SimpleVoidFunction): void {
    this.body.push(chunk)
    next()
  }
}

function arrayConcat(parts: StreamData[]): unknown[] {
  const res: unknown[] = []
  mergeArr(res, parts.flat())
  return res
}

function bufferConcat(parts: StreamData[]): Buffer {
  return Buffer.concat(concatBufferLike(parts))
}

function concatBufferLike(parts: StreamData[]): Buffer[] {
  const len = parts.length
  const bufs = new Array(len)
  for (let i = 0; i < len; i++) {
    const p = parts[i]
    bufs[i] = isBufferLike(p) ? bufferFrom(p) : bufferFrom(isObj(p) ? toObjString(p) : p)
  }
  return bufs
}

function inferEncoding(body: StreamData[], buffer?: StreamData): StreamEncoding {
  const first = buffer ?? body[0]
  if (Buffer.isBuffer(first)) return 'buffer'
  if (first instanceof Uint8Array) return 'uint8array'
  if (isArray(first)) return 'array'
  if (isString(first)) return 'string'
  return isObj(first) ? 'objects' : 'buffer'
}

function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  return toObjString(value).endsWith('Array]')
}

function isBufferLike(value: unknown): value is ArrayBufferLike {
  return typeof value === 'string' || (!!value && (isArrayLike(value) || isTypedArray(value)))
}

function stringConcat(parts: StreamData[]): string {
  const strings = concatBufferLike(parts)
  return Buffer.isBuffer(parts[0]) ? Buffer.concat(strings).toString('utf8') : strings.join('')
}

function u8Concat(parts: StreamData[]): Uint8Array {
  const len = parts.length
  let totalLen = 0
  let i: number, p: Uint8Array | Buffer
  for (i = 0; i < len; i++) {
    p = parts[i] as Uint8Array | Buffer
    if (isString(p)) parts[i] = bufferFrom(p)
    totalLen += (parts[i] as Uint8Array | Buffer).length
  }

  const u8 = new Uint8Array(totalLen)

  let offset = 0
  for (i = 0; i < len; i++) {
    p = parts[i] as Uint8Array | Buffer
    u8.set(p, offset)
    offset += p.length
  }

  return u8
}
