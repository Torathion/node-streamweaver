import type { AnyArray, AnyObject } from 'typestar'

/**
 *  Type narrowing the possible values the data inside the `ConcatWriteStream` can be converted to.
 */
export type StreamData = string | Buffer | Uint8Array | AnyArray<unknown> | AnyObject
/**
 *  Type mapping the possible encodings to the corresponding `StreamData` conversion
 */
export type StreamDataEncoded<T extends StreamEncoding | undefined> = T extends 'string'
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
/**
 *  Type narrowing the possible encodings of the `ConcatWriteStream`
 */
export type StreamEncoding = 'string' | 'buffer' | 'u8' | 'uint8' | 'uint8array' | 'array' | 'objects'
