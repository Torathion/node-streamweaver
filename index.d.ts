import { Readable, Transform, TransformOptions, Writable } from 'node:stream'
import { AnyArray, AnyObject, SimpleVoidFunction } from 'typestar'

declare module 'node-streamweaver' {
  /**
   *  Type narrowing the possible encodings of a stream.
   */
  export type StreamEncoding = 'string' | 'buffer' | 'u8' | 'uint8' | 'uint8array' | 'array' | 'objects'
  /**
   *  Type narrowing the possible values the data inside a stream can be converted to.
   */
  export type StreamData = string | Buffer | Uint8Array | AnyArray<unknown> | AnyObject
  /**
   *  Type mapping the possible encodings to the corresponding `StreamData` conversion.
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
  export interface ConcatWriteStreamOptions {
    encoding?: StreamEncoding
  }
  /**
   * Options for configuring the ProgressStream.
   */
  export interface ProgressOptions extends TransformOptions {
    /**
     * Whether the stream should be in a flowing state initially.
     */
    drain: boolean
    /**
     * The total length of the data being processed, in bytes or number of objects.
     */
    length: number
    /**
     * The interval in milliseconds at which progress events are emitted.
     */
    speed: number
    /**
     * The interval in milliseconds between progress updates.
     */
    time: number
    /**
     * The number of bytes or objects already transferred.
     */
    transferred: number
  }
  /**
   * Represents the current state of the progress stream.
   */
  export interface ProgressStreamState {
    /**
     * The amount of data transferred since the last progress event.
     */
    delta: number
    /**
     * The estimated time remaining in seconds.
     */
    eta: number
    /**
     * The total length of the data being processed.
     */
    length: number
    /**
     * The percentage of data transferred (0-100).
     */
    percentage: number
    /**
     * The amount of data remaining to be transferred.
     */
    remaining: number
    /**
     * The total runtime of the stream in seconds.
     */
    runtime: number
    /**
     * The current transfer speed in bytes/second or objects/second.
     */
    speed: number
    /**
     * The total amount of data transferred so far.
     */
    transferred: number
  }
  /**
   * Logger that overwrites the previous line in the terminal.
   */
  export interface SingleLineLogger {
    /**
     * Logs the provided arguments to the stream, overwriting the previous output.
     * @param args Arguments to be logged, joined by a space.
     */
    (...args: any[]): void
    /**
     * Clears the current output from the stream.
     */
    clear: () => void
  }
  /**
   *  `Writable` extension that can concat multiple data inputs to one stream.
   */
  export class ConcatWriteStream<T extends StreamEncoding> extends Writable {
    constructor(callback?: (data: StreamDataEncoded<T>) => void, opts?: { encoding?: T })
    _write(chunk: StreamData, _enc: string, next: SimpleVoidFunction): void
  }
  /**
   * A Transform stream that emits 'progress' events during data processing.
   */
  export class ProgressStream extends Transform {
    constructor(options?: Partial<ProgressOptions>, onProgress?: SimpleVoidFunction)
    /**
     *  Returns the current progress state of the stream.
     *
     *  @returns The current progress state.
     */
    progress(): ProgressStreamState
    /**
     * Sets the total length of the data being processed.
     *
     * @param newLength - The new total length.
     */
    setLength(newLength: number): void
  }
  /**
   *  Creates a logger that writes output to a single line in the provided stream,
   *  overwriting the previous content.
   *
   *  @param stream - The `NodeJS.WriteStream` to write to (e.g., process.stdout or process.stderr).
   *  @returns A SingleLineLogger instance.
   */
  export function singleLineLog(stream: Writable): SingleLineLogger
  /**
   * Calculates the throughput of a stream (e.g., bytes per second).
   *
   *  @param seconds - The time window in seconds over which to calculate the average. Defaults to 5.
   *  @returns A function that takes the current delta (amount of data transferred since the last call)
   *  and returns the calculated throughput.
   */
  export function throughput(seconds?: number): (delta: number) => number
}
