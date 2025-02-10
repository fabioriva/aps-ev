import * as util from 'util'

class Device {
  constructor (id, name, card = 0, stall = 0, status = 0) {
    this.id = id
    this.name = name
    this.card = card
    this.stall = stall
    this.status = status
  }

  update (buffer) {
    this.card = buffer.readInt16BE(0)
    this.stall = buffer.readInt16BE(2)
    this.status = buffer.readInt16BE(4)
  }
}

const updateDevices = util.promisify(
  (start, buffer, offset, devices, callback) => {
    let byte = start
    for (let i = 0; i < devices.length; i++) {
      devices[i].update(buffer.slice(byte, byte + offset))
      byte += offset
    }
    callback(null, devices)
  }
)

export { updateDevices, Device }
