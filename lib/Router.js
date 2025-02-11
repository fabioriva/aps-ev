import { logger } from './logger.js'
import { sendJson } from './json.js'
import { WriteArea } from './utils7.js'

const CARD_NOT_VALID = 'parameters not valid'
const CARD_OUT_OF_RANGE = 'card out of range'
const CARD_NOT_EV = 'card is not EV'
const QUEUE_FULL = 'queue is full'
const CARD_QUEUED = 'card queued'
const CARD_IN_OPERATION = 'card in operation'
const CARD_NOT_PARKED = 'card not parked'
const CARD_NOT_QUEUED = 'card not queued'
// const CARD_NOT_PARKED_IN_EV = 'card not parked in EV stall'
// const CARD_PARKED_IN_EV = 'card parked in EV stall'

function checkCard (card, def, obj, in_, out, queue) {
  if (!Number.isInteger(card)) {
    return CARD_NOT_VALID
  }
  if (card < def.CARD_MIN || card > def.CARD_MAX) {
    return CARD_OUT_OF_RANGE
  }
  if (obj.cards.find(element => element.nr === card).type === 0) {
    return CARD_NOT_EV
  }
  if (obj.devices.find(element => element.card === card)) {
    return CARD_IN_OPERATION
  }
  if (in_ && queue[queue.length - 1].card !== 0) {
    return QUEUE_FULL
  }
  if (in_ && queue.some(element => element.card === card)) {
    return CARD_QUEUED
  }
  if (in_ && !obj.stalls.some(element => element.status === card)) {
    return CARD_NOT_PARKED
  }
  if (out && !queue.some(element => element.card === card)) {
    return CARD_NOT_QUEUED
  }
  return undefined
}

class Response {
  constructor (severity, Response) {
    this.severity = severity
    this.Response = Response
  }
}

class Router {
  constructor (app, db, plc) {
    this.app = app // uws
    this.db = db // sqlite
    this.plc = plc // s7
  }

  error (card, error) {
    const e = new Response('warning', error)
    logger.warn('card %s %o', card, e)
    return e
  }

  exec_time (ping, func_) {
    const pong = process.hrtime(ping)
    logger.debug(`Execution time in millisecond: ${(pong[0] * 1000000000 + pong[1]) / 1000000}\t${func_}`)
  }

  log (req) {
    logger.info({
      'user-agent': req.getHeader('user-agent'),
      method: req.getMethod(),
      url: req.getUrl()
    })
  }

  run (def, obj, prefix) {
    this.app.get('/*', (res, req) => {
      this.log(req)
      res.end('aps-ev/api resource not found')
    })
    this.app.get(prefix + '/logs', async (res, req) => {
      this.log(req)
      res.onAborted(() => {
        res.aborted = true
      })
      const docs = this.db.prepare('SELECT * FROM logs ORDER BY date DESC LIMIT 10').all()
      sendJson(res, docs)
    })
    this.app.get(prefix + '/overview', (res, req) => {
      this.log(req)
      sendJson(res, obj.overview)
    })
    this.app.get(prefix + '/queue/exit/in/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      const error = checkCard(card, def, obj, true, false, obj.exitQueue)
      if (error !== undefined) {
        return sendJson(res, this.error(card, error))
      }
      res.onAborted(() => {
        res.aborted = true
      })
      logger.info('api %s card %s', req.getUrl(), card)
      sendJson(res, await this.write(card, def.REQ_EXIT_IN))
    })
    this.app.get(prefix + '/queue/exit/out/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      const error = checkCard(card, def, obj, false, true, obj.exitQueue)
      if (error !== undefined) {
        return sendJson(res, this.error(card, error))
      }
      res.onAborted(() => {
        res.aborted = true
      })
      logger.info('api %s card %s', req.getUrl(), card)
      sendJson(res, await this.write(card, def.REQ_EXIT_OUT))
    })
    this.app.get(prefix + '/queue/swap/ev/in/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      const error = checkCard(card, def, obj, true, false, obj.swapQueue)
      if (error !== undefined) {
        return sendJson(res, this.error(card, error))
      }
      res.onAborted(() => {
        res.aborted = true
      })
      logger.info('api %s card %s', req.getUrl(), card)
      sendJson(res, await this.write(card, def.REQ_SWAP_IN))
    })
    this.app.get(prefix + '/queue/swap/ev/out/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      const error = checkCard(card, def, obj, false, true, obj.swapQueue)
      if (error !== undefined) {
        return sendJson(res, this.error(card, error))
      }
      res.onAborted(() => {
        res.aborted = true
      })
      logger.info('api %s card %s', req.getUrl(), card)
      sendJson(res, await this.write(card, def.REQ_SWAP_OUT))
    })
    this.app.get(prefix + '/stalls', (res, req) => {
      this.log(req)
      sendJson(res, obj.stalls)
    })
    this.app.get(prefix + '/stalls_ev', (res, req) => {
      this.log(req)
      sendJson(res, obj.stalls.filter(s => s.ev_type !== 0))
    })
  }

  async write (card, parameters) {
    const buffer = Buffer.alloc(2)
    buffer.writeUInt16BE(card, 0)
    const { area, dbNumber, start, amount, wordLen } = parameters
    const response = await WriteArea(this.plc.client, area, dbNumber, start, amount, wordLen, buffer)
    logger.debug({ card, response }, response ? 'write ok' : 'write error')

    return new Response(response ? 'success' : 'error', response ? 'Sent request for card ' + card : 'Write error!')
  }
}

export default Router
