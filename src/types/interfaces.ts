import type { TransformOptions } from 'node:stream'
import type { StreamEncoding } from './types'

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
 * Interface for a logger that overwrites the previous line in the terminal.
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
