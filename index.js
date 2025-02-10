import 'dotenv/config.js'
// import fetch from 'node-fetch'
import * as uWS from 'uWebSockets.js'
import { checkEv } from './ev.js'
import { logger } from './logger.js'
import Plc from './Plc.js'
import Router from './Router.js'
import Server from './Server.js'

const HTTP = Number(process.env.HTTP)
const IP = process.env.PLC_IP
const RACK = Number(process.env.PLC_RACK)
const SLOT = Number(process.env.PLC_SLOT)

const start = async (def, obj) => {
  try {
    const app = uWS.App().listen(HTTP, token => logger.info(token))
    // db
    const log = new Server('sqlite.db') // ':memory:' or empty '' for anonymous db or db name 'sqlite.db'
    log.run(process.env.SERVER, process.env.TCP)
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
    const plc02 = new Plc(IP, RACK, SLOT)
    plc02.map(def, obj)
    // api routes
    const router = new Router(app, log, plc01)
    router.run(def, obj, `/aps/${process.env.APS}/ev`)
  } catch (err) {
    logger.error(new Error(err))
    process.exit(1)
  }
}

export default start
