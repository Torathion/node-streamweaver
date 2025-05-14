import { createReadStream, createWriteStream, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { createServer, get, IncomingMessage } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { ProgressStream } from 'src'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('progress-stream', () => {
  let testServer: ReturnType<typeof createServer>
  let testFile: string
  let port: number

  beforeEach(async () => {
    // Create a test HTTP server that serves a 1MB file
    testServer = createServer((_req, res) => {
      res.writeHead(200, {
        'Content-Length': 1 * 1024 * 1024, // 1MB
        'Content-Type': 'application/octet-stream'
      })
      res.end(Buffer.alloc(1 * 1024 * 1024)) // Single buffer for simplicity
    })

    // Wrap server.listen in a Promise to ensure port is assigned
    port = await new Promise<number>((resolve, reject) => {
      testServer.on('error', err => {
        reject(err)
      })
      testServer.listen(0, () => {
        const address = testServer.address()
        if (!address) {
          reject(new Error('Server address not available'))
          return
        }
        resolve((address as AddressInfo).port)
      })
    })

    testFile = join(tmpdir(), `test-download-${Date.now()}.bin`)
  })
  afterEach(async () => {
    // Close the server using a Promise
    await new Promise<void>((resolve, reject) => {
      testServer.close(err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })

    // Clean up the test file
    try {
      unlinkSync(testFile)
    } catch {}
  })

  it('should track download progress', async () => {
    const mockLog = vi.fn()
    const mockProgress = vi.fn()

    const str = new ProgressStream({
      drain: true,
      speed: 20,
      time: 100
    })
    str.on('progress', progress => {
      mockProgress(progress)
      mockLog(`Progress: ${progress.percentage.toFixed(2)}%`)
    })

    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const req = get(`http://localhost:${port}`, res => {
        resolve(res)
      })
      req.on('error', err => {
        reject(err)
      })
    })

    response.pipe(str).pipe(createWriteStream(testFile))

    await new Promise((resolve, reject) => {
      str.on('end', resolve)
      str.on('error', reject)
    })
    expect(mockProgress).toHaveBeenCalled()
    expect(mockProgress.mock.calls.some(([p]) => p.percentage > 0)).toBe(true)
    expect(mockProgress.mock.calls.some(([p]) => p.percentage === 100)).toBe(true)
  })

  it('should handle http module with content-length', async () => {
    const str = new ProgressStream({ time: 100 })
    const mockProgress = vi.fn()
    str.on('progress', mockProgress)

    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const req = get(`http://localhost:${port}`, res => {
        resolve(res)
      })
      req.on('error', err => {
        reject(err)
      })
    })

    response.pipe(str).pipe(createWriteStream(testFile))

    await new Promise((resolve, reject) => {
      str.on('end', resolve)
      str.on('error', reject)
    })
    expect(mockProgress).toHaveBeenCalled()
    expect(mockProgress.mock.calls[0][0].length).toBe(1 * 1024 * 1024)
  })

  it('should track progress for local file system operations', async () => {
    const mockProgress = vi.fn()
    const sourceFile = join(tmpdir(), `test-source-${Date.now()}.bin`)
    const destFile = join(tmpdir(), `test-dest-${Date.now()}.bin`)

    // Create a 10MB test file
    const fileSize = 10 * 1024 * 1024 // 10MB
    writeFileSync(sourceFile, Buffer.alloc(fileSize))

    // Get file size for ProgressStream
    const stats = statSync(sourceFile)
    expect(stats.size).toBe(fileSize)

    const str = new ProgressStream({
      length: stats.size, // Provide file size explicitly
      time: 100
    })
    str.on('progress', progress => {
      mockProgress(progress)
    })
    createReadStream(sourceFile).pipe(str).pipe(createWriteStream(destFile))

    await new Promise((resolve, reject) => {
      str.on('end', resolve)
      str.on('error', reject)
    })

    // Verify progress events
    expect(mockProgress).toHaveBeenCalled()
    expect(mockProgress.mock.calls.some(([p]) => p.percentage > 0)).toBe(true)
    expect(mockProgress.mock.calls.some(([p]) => p.percentage === 100)).toBe(true)
    expect(mockProgress.mock.calls[0][0].length).toBe(fileSize)

    // Clean up test files
    try {
      unlinkSync(sourceFile)
      unlinkSync(destFile)
    } catch (err) {
      console.error('Error deleting fs test files:', err)
    }
  })
})
