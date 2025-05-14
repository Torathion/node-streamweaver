import { Readable } from 'node:stream'
import { throughput } from 'src/utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// Mock Date.now for controlled time progression
const mockDateNow = vi.spyOn(Date, 'now')
let mockTime = 0

// Helper to create a stream and collect throughput values
async function collectThroughput(stream: Readable, speed: (x: number) => number, includeEndCall = true): Promise<number[]> {
  const throughputs: number[] = []
  stream.on('data', (chunk: string) => {
    const bytesPerSecond = speed(chunk.length)
    throughputs.push(bytesPerSecond)
  })
  await new Promise(resolve =>
    stream.on('end', () => {
      if (includeEndCall) throughputs.push(speed(0))
      resolve(undefined)
    })
  )
  return throughputs
}

beforeEach(() => {
  mockTime = 0
  mockDateNow.mockImplementation(() => mockTime)
})
afterEach(() => {
  mockDateNow.mockReset()
})
describe('throughput (stream data rate with actual streams)', () => {
  const resolution = 10 // 10 samples per second
  const timeDiff = 1000 / resolution // 100ms per tick

  test('returns 0 for stream with no data', async () => {
    const speed = throughput(1)
    const stream = new Readable({
      read(): void {
        this.push(null) // End immediately
      }
    })

    expect(await collectThroughput(stream, speed)).toEqual([0])
  })

  test('measures steady stream at 1000 bytes/s over 1s', async () => {
    const speed = throughput(1) // 1s window
    const stream = new Readable({
      read(): void {
        let i = 0
        const interval = setInterval(() => {
          if (i >= 10) {
            this.push(null) // End after 10 ticks (1s)
            clearInterval(interval)
            return
          }
          mockTime += timeDiff
          this.push(Buffer.alloc(100)) // 100 bytes
          i++
        }, 0)
      }
    })
    const throughputs = await collectThroughput(stream, speed, false) // No speed(0) on end
    expect(throughputs[throughputs.length - 1]).toBeCloseTo(1000, 5) // Last value ~1000 bytes/s
  })
})
