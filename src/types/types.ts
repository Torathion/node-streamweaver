import type { AnyArray, AnyObject } from 'typestar'

export type ConcatWriteStreamEncoding = 'string' | 'buffer' | 'u8' | 'uint8' | 'uint8array' | 'array' | 'objects'
export type StreamData = string | Buffer | Uint8Array | AnyArray<unknown> | AnyObject
