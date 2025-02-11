import { format } from 'date-fns'
import net from 'net'
// import Db from './SQLite.js'
import { logger } from './logger.js'
import { getPlcDateTime } from './utils7.js'

const LOG_LEN = 32

class Document {
  constructor (log) {
    this.card = log.card
    const d = format(log.date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    // this.date = new Date(d)
    this.date = d
    // this.d1 = null
    // this.d2 = null
    this.endpoint = this.setEndpoint(log.device)
    this.response = this.setResponse(log.operation)
  }

  setEndpoint (n) {
    if (n === 1) return '/queue/exit/in/:card'
    if (n === 2) return '/queue/exit/out/:card'
    if (n === 3) return '/queue/swap/ev/in/:card'
    if (n === 4) return '/queue/swap/ev/out/:card'
    if (n === 5) return '/queue/swap/st/in/:card'
    if (n === 6) return '/queue/swap/st/out/:card'
    return undefined
  }

  setResponse (n) {
    if (n === 1) return 'error 1: card number not valid'
    if (n === 2) return 'error 2: card is not EV card'
    if (n === 3) return 'error 3: card is in operation'
    if (n === 4) return 'error 4: card is not parked'
    if (n === 5) return 'error 5: queue is full'
    if (n === 6) return 'error 6: card is queued'
    if (n === 7) return 'error 7: card is not queued'
    // if (n === 1) return 'error 1: card number not valid'
    // if (n === 2) return 'error 2: card is not EV card'
    // if (n === 3) return 'error 3: queue is full'
    // if (n === 4) return 'error 4: card queued'
    // if (n === 5) return 'error 5: card in operation'
    // if (n === 6) return 'error 6: card not parked'
    // if (n === 7) return 'error 7: card not queued'
    // if (n === 8) return 'error 8: card not parked in EV stall'
    // if (n === 9) return 'error 9: card parked in EV stall'
    return 'success'
    // if (n > 0) {
    //   return 'error ' + n
    // } else {
    //   return 'success'
    // }
  }
}

class Log {
  constructor (buffer) {
    this.stx = buffer.readInt16BE(0)
    this.system = buffer.readInt16BE(2)
    this.device = buffer.readInt16BE(4)
    this.mode = buffer.readInt16BE(6)
    this.operation = buffer.readInt16BE(8)
    this.stall = buffer.readInt16BE(10)
    this.card = buffer.readInt16BE(12)
    this.size = buffer.readInt16BE(14)
    this.alarm = buffer.readInt16BE(16)
    this.event = buffer.readInt16BE(18)
    this.date = getPlcDateTime(buffer.readInt16BE(20), buffer.readInt32BE(22))
    this.elapsed = buffer.readInt32BE(26)
    this.etx = buffer.readInt16BE(30)
  }
}

const server = (db, host, port) => {
  const server = net.createServer()
  server.listen(port, host, () => logger.info('TCP log server is running on port ' + port + '.'))
  server.on('connection', function (sock) {
    const client = sock.remoteAddress + ':' + sock.remotePort
    logger.info('socket connected ' + client)
    sock.on('data', async function (data) {
      logger.info('socket data ' + sock.remoteAddress + ': ' + data)
      const buffer = Buffer.alloc(LOG_LEN, data)
      // console.log(buffer)
      const log = new Log(buffer)
      // console.log(log)
      const doc = new Document(log)
      // console.log(doc)
      const insert = db.prepare('INSERT INTO logs(card, date, endpoint, response) VALUES(?, ?, ?, ?)')
      insert.run(Object.values(doc))
      // 'SELECT datetime("now", "subsec")'
    })
    sock.on('close', function () {
      logger.info('socket close ' + client)
    })
    sock.on('end', function () {
      logger.info('socket end ', client)
    })
    sock.on('error', function (e) {
      logger.error('socket error ', client, e)
    })
  })
}

export default server
