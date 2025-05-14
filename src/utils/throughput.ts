const maxTick = 65535
const resolution = 10
const timeDiff = 1000 / resolution

export default function throughput(seconds = 5): (delta: number) => number {
  const start = Date.now()
  const size = resolution * seconds
  const buffer = new Float32Array(size)
  let pointer = 0
  let last = (getTick(start) - 1) & maxTick

  return function (delta) {
    const tick = getTick(start)
    const x = (tick - last) & maxTick
    pointer = ((pointer + x) ^ ((size ^ x) & -(size < x))) % size
    last = tick

    if (delta) buffer[pointer === 0 ? size - 1 : pointer - 1] = delta

    // Sum all deltas in the window
    let sum = 0
    for (let i = 0; i < size; i++) sum += buffer[i]
    return (sum * resolution) / size
  }
}

function getTick(start: number): number {
  return ((Date.now() - start) / timeDiff) & 65535
}
