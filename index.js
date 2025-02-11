import 'dotenv/config.js'
import * as uWS from 'uWebSockets.js'
import { checkEv } from './lib/ev.js'
import { logger } from './lib/logger.js'
import db from './lib/db.js'
import Plc from './lib//Plc.js'
import Router from './lib/Router.js'
import server from './lib/server.js'

const HTTP = Number(process.env.HTTP)
const IP = process.env.PLC_IP
const RACK = Number(process.env.PLC_RACK)
const SLOT = Number(process.env.PLC_SLOT)

const start = async (def, obj) => {
  try {
    const app = uWS.App().listen(HTTP, token => logger.info(token))
    // plc comm
    const plc01 = new Plc(IP, RACK, SLOT)
    plc01.run(def, obj)
    plc01.on('pub', ({ channel, data }) => {
      if (channel === 'aps/queue') {
        const { index, queue } = JSON.parse(data)
        if (queue.length) {
          checkEv(def, queue[index], obj, plc01)
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
