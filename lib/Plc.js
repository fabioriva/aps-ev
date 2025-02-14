import { EventEmitter } from 'events'
import snap7 from 'node-snap7'
import logger from './logger.js'
import { ReadArea, WriteArea } from './utils7.js'
import { updateCards } from './Card.js'
import { updateDevices } from './Device.js'
import { updateQueue } from './Queue.js'
import { updateStalls } from './Stall.js'

class Plc extends EventEmitter {
  constructor (ip, rack, slot) {
    super()
    this.client = new snap7.S7Client()
    this.online = this.client.ConnectTo(ip, rack, slot)
    // this.params = plc
  }

  error (e) {
    this.online = !this.client.Disconnect()
    isNaN(e) ? logger.error(e) : logger.error(this.client.ErrorText(e))
  }

  exec_time (ping, func_) {
    const pong = process.hrtime(ping)
    logger.trace(`Execution time in millisecond: ${(pong[0] * 1000000000 + pong[1]) / 1000000}\t${func_}`)
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
            // updateQueue(def.DB_DATA_INIT_SWAP_EV_QUEUE, buffer, 6, obj.swapEvQueue),
            // updateQueue(def.DB_DATA_INIT_SWAP_ST_QUEUE, buffer, 6, obj.swapStQueue)
          ])
          this.exec_time(ping, 'data')
        } else {
          this.online = this.client.Connect()
          this.online ? logger.info('Connected to PLC') : logger.info('Connecting to PLC ...')
        }
        if (this.online_ !== this.online) {
          this.online_ = this.online
        }
        this.publish('aps/info', {
          comm: this.online
        })
        this.data(def, obj)
      }, process.env.POLL_TIME)
    } catch (e) {
      this.error(e)
    } finally {
      // const queue = obj.exitQueue.concat(obj.swapQueue).filter(item => item.card > 0)
      // const q = obj.exitQueue.concat(obj.swapEvQueue, obj.swapStQueue).filter(item => item.card > 0)
      // obj.q.index < queue.length - 1 ? obj.q.index += 1 : obj.q.index = 0
      // this.publish('aps/queue', { queue: q, index: obj.q.index })
      const queue = obj.exitQueue.concat(obj.swapQueue).filter(item => item.card > 0 && obj.stalls.some(stall => stall.nr === item.slot && stall.ev_type !== 0))
      if (queue.length) {
        obj.q.index < queue.length - 1 ? obj.q.index += 1 : obj.q.index = 0
        this.publish('aps/queue', { ...queue[obj.q.index] })
      }
    }
  }

  async ev_cards (def, obj) {
    try {
      const { area, dbNumber, start, amount, wordLen } = def.EV_CARDS_READ
      const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
      // let byte = 0
      // obj.cards.forEach(element => {
      //   console.log(element, buffer.readInt16BE(byte), buffer.readInt16BE(byte + 2))
      //   element.ev_type = buffer.readInt16BE(byte)
      //   element.ev_wantToCharge = buffer.readInt16BE(byte + 2)
      //   byte += 4
      // })
      await updateCards(0, buffer, def.CARD_LEN, obj.cards)
    } catch (e) {
      this.error(e)
    }
  }

  async ev_stalls (def, obj) {
    try {
      const { area, dbNumber, start, amount, wordLen } = def.EV_STALLS_READ
      const buffer = this.online ? await ReadArea(this.client, area, dbNumber, start, amount, wordLen) : Buffer.alloc(amount)
      let byte = 0
      obj.stalls.forEach(element => {
        element.ev_type = buffer.readInt16BE(byte)
        element.ev_isCharging = buffer.readInt16BE(byte + 2)
        byte += 4
      })
    } catch (e) {
      this.error(e)
    }
  }

  async ev_unlock (def, slot) {
    try {
      const buffer = Buffer.alloc(2)
      buffer.writeUInt16BE(0, 0)
      const { area, dbNumber } = def.EV_STALLS_READ
      const start = slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2
      const response = await WriteArea(this.client, area, dbNumber, start, 2, 0x02, buffer)
      logger.debug('write parameters: area %s db %d start %d, response: %s', area, dbNumber, start, response)
    } catch (err) {
      logger.error(err, 'write error')
      return true
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
          this.online ? logger.info('Connected to PLC') : logger.info('Connecting to PLC ...')
        }
        if (this.online_ !== this.online) {
          this.online_ = this.online
        }
        this.publish('aps/info', {
          comm: this.online
        })
        this.map(def, obj)
      }, process.env.POLL_TIME)
    } catch (e) {
      this.error(e)
    } finally {
      this.ev_cards(def, obj)
      this.ev_stalls(def, obj)
      // this.publish('aps/map', obj.stalls)
    }
  }

  async run (def, obj) {
    try {
      this.ev_cards(def, obj)
      this.data(def, obj)
    } catch (e) {
      this.error(e)
    }
  }

  publish (channel, data) {
    this.emit('pub', { channel, data: JSON.stringify(data) })
    // this.emit('pub', { channel, data: Buffer.from(JSON.stringify(data)) })
  }
}

export default Plc
