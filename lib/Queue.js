import * as util from 'util'

class Queue {
  constructor (id, card = 0, slot = 0, size = 0) {
    this.id = id
    this.card = card
    this.slot = slot
    this.size = size
  }

  update (buffer) {
    this.card = buffer.readInt16BE(0)
    this.slot = buffer.readInt16BE(2)
    this.size = buffer.readInt16BE(4)
  }
}

const generateQueue = len => {
  const queue = []
  for (let i = 0; i < len; i++) {
    queue.push(new Queue(i + 1))
  }
  return queue
}

const updateQueue = util.promisify(
  (start, buffer, offset, data, callback) => {
    let byte = start
    for (let i = 0; i < data.length; i++) {
      data[i].update(buffer.slice(byte, byte + offset))
      byte += offset
    }
    callback(null, data)
  }
)

export { generateQueue, updateQueue }
