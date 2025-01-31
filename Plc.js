import { EventEmitter } from 'events'
import snap7 from 'node-snap7'
import { logger } from './logger.js'
import { ReadArea } from './utils7.js'
import { updateDevices } from './Device.js'
import { updateQueue } from './Queue.js'
import { updateStalls } from './Stall.js'

class Plc extends EventEmitter {
  constructor (plc) {
    super()
    this.client = new snap7.S7Client()
    this.online = this.client.ConnectTo(plc.ip, plc.rack, plc.slot)
    this.params = plc
  }

  error (e) {
    this.online = !this.client.Disconnect()
    isNaN(e) ? logger.error(e) : logger.error(this.client.ErrorText(e))
  }

  exec_time (ping, func_) {
    const pong = process.hrtime(ping)
    logger.debug(`Execution time in millisecond: ${(pong[0] * 1000000000 + pong[1]) / 1000000}\t${func_}`)
  }

  data (def, obj) {
    try {
      setTimeout(async () => {
        if (this.online) {
          const ping = process.hrtime()
          const { area, dbNumber, start, amount, wordLen } = def.DATA_READ
          const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
          await Promise.all([
            updateDevices(def.DB_DATA_INIT_DEVICE, buffer, 6, obj.devices),
            updateQueue(def.DB_DATA_INIT_EXIT_QUEUE, buffer, 6, obj.exitQueue),
            updateQueue(def.DB_DATA_INIT_SWAP_QUEUE, buffer, 6, obj.swapQueue)
          ])
          this.exec_time(ping, 'data')
        } else {
          this.online = this.client.Connect()
          this.online ? logger.info('Connected to PLC %s', this.params.ip) : logger.info('Connecting to PLC %s ...', this.params.ip)
        }
        if (this.online_ !== this.online) {
          this.online_ = this.online
        }
        this.publish('aps/info', {
          comm: this.online
        })
        this.data(def, obj)
      }, this.params.polling_time)
    } catch (e) {
      this.error(e)
    } finally {
      const q = obj.exitQueue.concat(obj.swapQueue).filter(item => item.card > 0)
      obj.q.index < q.length - 1 ? obj.q.index += 1 : obj.q.index = 0
      this.publish('aps/queue', { queue: q, index: obj.q.index })
    }
  }

  async init (def, obj) {
    try {
      const { area, dbNumber, start, amount, wordLen } = def.EV_STALLS_READ
      const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
      let byte = 0
      obj.stalls.forEach(s => {
        s.ev_type = buffer.readInt16BE(byte)
        s.ev_isCharging = buffer.readInt16BE(byte + 2)
        byte += 4
      })
    } catch (e) {
      this.error(e)
    }
  }

  map (def, obj) {
    try {
      setTimeout(async () => {
        if (this.online) {
          const ping = process.hrtime()
          const { area, dbNumber, start, amount, wordLen } = def.MAP_READ
          const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
          await updateStalls(0, buffer, def.STALL_LEN, obj.stalls)
          this.exec_time(ping, 'map')
        } else {
          this.online = this.client.Connect()
          this.online ? logger.info('Connected to PLC %s', this.params.ip) : logger.info('Connecting to PLC %s ...', this.params.ip)
        }
        if (this.online_ !== this.online) {
          this.online_ = this.online
        }
        this.publish('aps/info', {
          comm: this.online
        })
        this.map(def, obj)
      }, this.params.polling_time)
    } catch (e) {
      this.error(e)
    } finally {
      this.init(def, obj)
      this.publish('aps/map', obj.stalls)
    }
  }

  // async run (def, obj) {
  //   try {
  //     this.online = this.client.ConnectTo(this.params.ip, this.params.rack, this.params.slot)
  //   } catch (e) {
  //     this.error(e)
  //   }
  // }

  publish (channel, data) {
    this.emit('pub', { channel, data: JSON.stringify(data) })
    // this.emit('pub', { channel, data: Buffer.from(JSON.stringify(data)) })
  }
}

export default Plc
