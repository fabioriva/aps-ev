import 'dotenv/config.js'
import * as uWS from 'uWebSockets.js'
// import { checkEv } from './lib/ev.js'
import logger from './lib/logger.js'
import db from './lib/db.js'
import Plc from './lib//Plc.js'
import Router from './lib/Router.js'
import server from './lib/server.js'

const HTTP = Number(process.env.HTTP)
const IP = process.env.PLC_IP
const RACK = Number(process.env.PLC_RACK)
const SLOT = Number(process.env.PLC_SLOT)

async function ev (aps, card, slot) {
  try {
    const url = `${process.env.PW_API}?stall=${slot}&cardID=${card}&location=${aps}`
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PW_TOKEN
      }
    })
    if (res.ok) {
      const json = await res.json()
      return Boolean(json.busy)
    } else {
      logger.error('fetch response status %d %s', res.status, res.statusText)
      return true
    }
  } catch (err) {
    logger.error('fetch network error %o', err)
    return true
  }
}

const start = async (def, obj) => {
  try {
    const app = uWS.App().listen(HTTP, token => logger.info(token))
    // plc comm
    const plc01 = new Plc(IP, RACK, SLOT)
    plc01.run(def, obj)
    plc01.on('pub', async ({ channel, data }) => {
      if (channel === 'aps/queue') {
        const item = JSON.parse(data)
        const busy = await ev(process.env.APS, item.card, item.slot)
        logger.debug('queue item: %o is busy: %s', item, busy)
        if (!busy) {
          await plc01.ev_unlock(def, item.slot)
        }
      }
    })
    // map service
    const plc02 = new Plc(IP, RACK, SLOT)
    plc02.map(def, obj)
    // api routes
    const router = new Router(app, db, plc01)
    router.run(def, obj, `/aps/${process.env.APS}/ev`)
    // log server
    server(db, process.env.SERVER, process.env.TCP)
  } catch (err) {
    logger.error(new Error(err))
    process.exit(1)
  }
}

export default start
