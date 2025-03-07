import { format } from 'date-fns'
import * as util from 'util'
import { getPlcDateTime } from './utils7.js'

class Stall {
  constructor (
    nr,
    status = 0,
    date = format(new Date('1990-01-01 00:00:00'), 'yyyy-MM-dd HH:mm:ss'),
    size = 0
  ) {
    this.nr = nr
    this.status = status
    this.date = date
    this.size = size
  }

  update (buffer) {
    this.status = buffer.readInt16BE(0)
    this.date = format(
      getPlcDateTime(buffer.readInt16BE(2), buffer.readInt32BE(4)),
      'yyyy-MM-dd HH:mm:ss'
    )
    this.size = buffer.readInt16BE(8)
  }
}

export const generateStalls = len => {
  const stalls = []
  for (let i = 0; i < len; i++) {
    stalls.push(new Stall(i + 1))
  }
  return stalls
}

export const updateStalls = util.promisify(
  (start, buffer, offset, stalls, callback) => {
    let byte = start
    const min = 0
    const max = buffer.length / offset
    for (let i = min; i < max; i++) {
      stalls[i].update(buffer.slice(byte, byte + offset))
      byte += offset
    }
    callback(null, stalls)
  }
)

export const occupancy = (size, stalls, stallStatus) => {
  // const occupancy = { free: 0, busy: 0, locked: 0 }
  const occupancy = [
    { id: 'busy', value: 0 },
    { id: 'free', value: 0 },
    { id: 'lock', value: 0 }
  ]
  for (let i = 0; i < stalls.length; i++) {
    if (size === 0 || stalls[i].size === size) {
      switch (stalls[i].status) {
        case 0:
          // ++occupancy.free
          ++occupancy[1].value
          break
        case stallStatus.LOCK:
          // ++occupancy.locked
          ++occupancy[2].value
          break
        default:
          // ++occupancy.busy
          ++occupancy[0].value
          break
      }
    }
  }
  return occupancy
}
