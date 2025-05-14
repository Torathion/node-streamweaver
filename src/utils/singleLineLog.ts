import type { SingleLineLogger } from 'src/types'
import stringWidth from 'string-width'

// ANSI escape codes as Buffers converted to strings
const MOVE_LEFT = Buffer.from('1b5b3130303044', 'hex').toString()
const MOVE_UP = Buffer.from('1b5b3141', 'hex').toString()
const CLEAR_LINE = Buffer.from('1b5b304b', 'hex').toString()

export default function singleLineLog(stream: NodeJS.WriteStream): SingleLineLogger {
  let currentOutput: string | null = null
  let prevLineCount = 0

  // Handle process exit for stdout/stderr
  if (stream === process.stderr || stream === process.stdout) {
    process.on('exit', () => {
      if (currentOutput) {
        stream.write('')
      }
    })
    // Override stream.write
  } else {
    const originalWrite = stream.write.bind(stream)
    stream.write = function (this: NodeJS.WriteStream, data: any, ...args: any[]): boolean {
      if (currentOutput && data !== currentOutput) {
        currentOutput = null
      }
      return originalWrite.call(this, data, ...args)
    }
  }

  const log = function (...args: any[]): void {
    currentOutput = ''
    const nextStr = args.join(' ')

    // Clear previous output
    for (let i = 0; i < prevLineCount; i++) {
      currentOutput = `${MOVE_LEFT}${CLEAR_LINE}${i < prevLineCount - 1 ? MOVE_UP : ''}`
    }

    stream.write(`${currentOutput}${nextStr}`)

    prevLineCount = 0
    for (const line of nextStr.split('\n')) {
      prevLineCount += Math.ceil(stringWidth(line) / (stream.columns || 80)) || 1
    }
  }

  log.clear = function (): void {
    stream.write('')
    currentOutput = null
  }

  return log as SingleLineLogger
}
