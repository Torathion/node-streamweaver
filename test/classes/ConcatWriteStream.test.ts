import { isTypedArray } from 'node:util/types'
import { isArray } from 'compresso'
import { ConcatWriteStream } from 'src'
import { bufferFrom } from 'src/constants'
import { describe, expect, it } from 'vitest'

describe('ConcatWriteStream', () => {
  describe('basic', () => {
    it('can be created', () => {
      const cws = new ConcatWriteStream()
      cws.write('space')
      cws.end(' cats')

      expect(cws).toBeDefined()
    })

    it('can have no encoding nor data be set', () => {
      const cws = new ConcatWriteStream(data => {
        expect(data).toEqual([])
      })

      cws.end()
    })

    it('can set an encoding', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(data).toBe('')
        },
        { encoding: 'string' }
      )

      cws.end()
    })

    it('can write data on end', () => {
      const cws = new ConcatWriteStream(data => {
        expect(data).toBe('this is the end')
      })

      cws.write('this ')
      cws.write('is the ')
      cws.end('end')
    })
  })

  describe('array', () => {
    it('can create an array out of streams', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(data).toEqual([1, 2, 3, 4, 5, 6])
        },
        { encoding: 'array' }
      )

      cws.write([1, 2, 3])
      cws.write([4, 5, 6])
      cws.end()
    })

    it('infers from first', () => {
      const cws = new ConcatWriteStream(data => {
        expect(isArray(data)).toBe(true)
      })

      cws.write([1, 2, 3])
      cws.end()
    })
  })

  describe('buffer', () => {
    it('should create a stream with buffers', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(Buffer.isBuffer(data)).toBe(true)
          expect(data.toString('utf8')).toBe('pizza Array is not a stringy cat')
        },
        { encoding: 'buffer' }
      )

      cws.write(bufferFrom('pizza Array is not a ', 'utf8'))
      cws.write(bufferFrom('stringy cat'))
      cws.end()
    })

    it('handles mixed types', () => {
      const cws = new ConcatWriteStream(data => {
        expect(Buffer.isBuffer(data)).toBe(true)
        expect((data as Buffer).toString('utf8')).toBe('pizza Array is not a stringy cat555')
      })

      cws.write(bufferFrom('pizza'))
      cws.write(' Array is not a ')
      cws.write([115, 116, 114, 105, 110, 103, 121])
      cws.write(new Uint8Array([32, 99, 97, 116]))
      cws.write(555)
      cws.end()
    })
  })

  describe('objects', () => {
    it('should handle objects with encoding: "objects"', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(data.length).toBe(2)
          expect(data[0]).toEqual({ foo: 'bar' })
          expect(data[1]).toEqual({ nacho: 'taco' })
        },
        { encoding: 'objects' }
      )

      cws.write({ foo: 'bar' })
      cws.write({ nacho: 'taco' })
      cws.end()
    })

    it('should handle objects automatically', () => {
      const cws = new ConcatWriteStream(data => {
        expect(data.length).toBe(2)
        expect(data[0]).toEqual({ foo: 'bar' })
        expect(data[1]).toEqual({ nacho: 'taco' })
      })

      cws.write({ foo: 'bar' })
      cws.write({ nacho: 'taco' })
      cws.end()
    })
  })

  describe('string', () => {
    it('handles strings', () => {
      const cws = new ConcatWriteStream(data => {
        expect(typeof data).toBe('string')
        expect(data).toBe('nacho dogs')
      })

      cws.write('nacho ')
      cws.write('dogs')
      cws.end()
    })

    it('can convert strings into buffers', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(Buffer.isBuffer(data)).toBe(true)
          expect(data.toString('utf8')).toBe('nacho dogs')
        },
        { encoding: 'buffer' }
      )

      cws.write('nacho ')
      cws.write('dogs')
      cws.end()
    })

    it('handles mixed encodings', () => {
      const cws = new ConcatWriteStream(data => {
        expect(typeof data).toBe('string')
        expect(data).toBe('nacho dogs')
      })

      cws.write('na')
      cws.write(bufferFrom('cho'))
      cws.write([32, 100])
      cws.write(new Uint8Array([111, 103, 115]))
      cws.end()
    })

    it('handles strings from multibyte characters', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(typeof data).toBe('string')
          expect(data).toBe('☃☃☃☃☃☃☃☃')
        },
        { encoding: 'string' }
      )

      const snowman = bufferFrom('☃')
      for (let i = 0; i < 8; i++) {
        cws.write(snowman.subarray(0, 1))
        cws.write(snowman.subarray(1))
      }

      cws.end()
    })

    it('infers encoding from empty chunk', () => {
      const cws = new ConcatWriteStream(data => {
        expect(typeof data).toBe('string')
        expect(data).toBe('nacho dogs')
      })

      cws.write('')
      cws.write('nacho ')
      cws.write('dogs')
      cws.end()
    })

    it('can convert numbers to strings', () => {
      const cws = new ConcatWriteStream(data => {
        expect(data).toBe('a1000')
      })

      cws.write('a')
      cws.write(1000)
      cws.end()
    })
  })

  describe('typed arrays', () => {
    it('handles typed arrays', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(isTypedArray(data)).toBe(true)
          expect(bufferFrom(data as any).toString('utf8')).toBe('abcde fg xyz')
        },
        { encoding: 'u8' }
      )

      cws.write(new Uint8Array([97, 98, 99, 100, 101]))
      cws.write(new Uint8Array([32, 102, 103]))
      cws.write(new Uint8Array([32, 120, 121, 122]))
      cws.end()
    })

    it('handles typed arrays from mixed encodings', () => {
      const cws = new ConcatWriteStream(
        data => {
          expect(isTypedArray(data)).toBe(true)
          expect(bufferFrom(data as any).toString('utf8')).toBe('abcde fg xyz')
        },
        { encoding: 'u8' }
      )

      cws.write('abcde')
      cws.write(bufferFrom(' fg '))
      cws.end([120, 121, 122])
    })

    it('infers type by first', () => {
      const cws = new ConcatWriteStream(data => {
        expect(isTypedArray(data)).toBe(true)
      })

      cws.write(new Uint8Array([1, 2, 3]))
      cws.end()
    })
  })
})
