import { format } from 'date-fns'
import * as net from 'net'
import { MongoClient } from 'mongodb'
import { logger } from './logger.js'
import { getPlcDateTime } from './utils7.js'

const LOG_LEN = 32
const PORT = 9101

class Db {
  constructor (db) {
    this.db = db
  }

  async find () {
    const query = {}
    const options = { projection: { _id: 0 } }
    const docs = await this.collection.find(query, options).sort({ date: -1 }).toArray()
    return docs
  }

  async insert (doc) {
    const res = await this.collection.insertOne(doc)
    // console.log(`A document was inserted with the _id: ${res.insertedId}`)
    logger.debug('document was inserted with the _id: %s', res.insertedId)
  }

  async run () {
    const client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    const db = client.db(this.db)
    this.collection = db.collection('ev')
    this.server()
  }

  server () {
    const this_ = this
    const server = net.createServer()
    server.listen(PORT, '192.168.20.56', () => logger.info('TCP log server is running on port ' + PORT + '.'))
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
        await this_.insert(doc)
        // await this_.find()
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
}

class Document {
  constructor (log) {
    this.card = log.card
    const d = format(log.date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    this.date = new Date(d)
    this.endpoint = this.setEndpoint(log.device)
    this.response = this.setResponse(log.operation)
  }

  setEndpoint (n) {
    if (n === 1) return '/queue/exit/in/:card'
    if (n === 2) return '/queue/exit/out/:card'
    if (n === 3) return '/queue/swap/in/:card'
    if (n === 4) return '/queue/swap/out/:card'
    return undefined
  }

  setResponse (n) {
    if (n === 1) return 'error 1: card number not valid'
    if (n === 2) return 'error 2: card is not EV card'
    if (n === 3) return 'error 3: queue is full'
    if (n === 4) return 'error 4: card queued'
    if (n === 5) return 'error 5: card in operation'
    if (n === 6) return 'error 6: card not parked'
    if (n === 7) return 'error 7: card not queued'
    if (n === 8) return 'error 8: card not parked in EV stall'
    if (n === 9) return 'error 9: card parked in EV stall'
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

export default Db
