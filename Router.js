import { logger } from './logger.js'
import { sendJson } from './json.js'
import { WriteArea } from './utils7.js'

const CARD_NOT_VALID = 'parameters not valid'
const CARD_OUT_OF_RANGE = 'card out of range'
const CARD_NOT_EV = 'card out of range'
const QUEUE_FULL = 'queue is full'
const CARD_QUEUED = 'card queued'
const CARD_IN_OPERATION = 'card in operation'
const CARD_NOT_PARKED = 'card not parked'
const CARD_NOT_QUEUED = 'card not queued'
const CARD_NOT_PARKED_IN_EV = 'card not parked in EV stall'
const CARD_PARKED_IN_EV = 'card parked in EV stall'

class Response {
  constructor (severity, Response) {
    this.severity = severity
    this.Response = Response
  }
}

class Router {
  constructor (app, srv, plc) {
    this.app = app // uws
    this.plc = plc // s7
    this.srv = srv // s7 logs
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
      // const docs = await this.srv.db.find('SELECT * FROM logs ORDER BY d1 DESC')
      const docs = await this.srv.db.findAll()
      sendJson(res, docs)
    })
    this.app.get(prefix + '/overview', (res, req) => {
      this.log(req)
      sendJson(res, obj.overview)
    })
    this.app.get(prefix + '/queue/exit/in/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      if (!Number.isInteger(card)) {
        return sendJson(res, this.error(card, CARD_NOT_VALID))
      }
      if (card < def.CARD_MIN || card > def.CARD_MAX) {
        return sendJson(res, this.error(card, CARD_OUT_OF_RANGE))
      }
      // const item = obj.exitQueue.find(i => i.card === card)
      // if (item !== undefined) {
      //   return sendJson(res, this.error(card, CARD_QUEUED))
      // }
      // const stall = obj.stalls.find(s => s.status === card)
      // if (stall === undefined) {
      //   return sendJson(res, this.error(card, CARD_NOT_PARKED))
      // }
      res.onAborted(() => {
        res.aborted = true
      })
      logger.info('api %s card %s', req.getUrl(), card)
      sendJson(res, await this.write(card, def.REQ_EXIT_IN))
    })
    this.app.get(prefix + '/queue/exit/out/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      if (!Number.isInteger(card)) {
        return sendJson(res, this.error(card, CARD_NOT_VALID))
      }
      if (card < def.CARD_MIN || card > def.CARD_MAX) {
        return sendJson(res, this.error(card, CARD_OUT_OF_RANGE))
      }
      // const item = obj.exitQueue.find(i => i.card === card)
      // if (item === undefined) {
      //   return sendJson(res, this.error(card, CARD_NOT_QUEUED))
      // }
      res.onAborted(() => {
        res.aborted = true
      })
      logger.info('api %s card %s', req.getUrl(), card)
      sendJson(res, await this.write(card, def.REQ_EXIT_OUT))
    })
    this.app.get(prefix + '/queue/swap/in/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      if (!Number.isInteger(card)) {
        return sendJson(res, this.error(card, CARD_NOT_VALID))
      }
      if (card < def.CARD_MIN || card > def.CARD_MAX) {
        return sendJson(res, this.error(card, CARD_OUT_OF_RANGE))
      }
      // const item = obj.swapQueue.find(i => i.card === card)
      // if (item !== undefined) {
      //   return sendJson(res, this.error(card, CARD_QUEUED))
      // }
      // const stall = obj.stalls.find(s => s.status === card)
      // if (stall === undefined) {
      //   return sendJson(res, this.error(card, CARD_NOT_PARKED))
      // }
      res.onAborted(() => {
        res.aborted = true
      })
      logger.info('api %s card %s', req.getUrl(), card)
      sendJson(res, await this.write(card, def.REQ_SWAP_IN))
    })
    this.app.get(prefix + '/queue/swap/out/:card', async (res, req) => {
      this.log(req)
      const card = parseInt(req.getParameter(0))
      if (!Number.isInteger(card)) {
        return sendJson(res, this.error(card, CARD_NOT_VALID))
      }
      if (card < def.CARD_MIN || card > def.CARD_MAX) {
        return sendJson(res, this.error(card, CARD_OUT_OF_RANGE))
      }
      // const item = obj.swapQueue.find(i => i.card === card)
      // if (item === undefined) {
      //   return sendJson(res, this.error(card, CARD_NOT_QUEUED))
      // }
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
