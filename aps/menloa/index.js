import 'dotenv/config.js'
// import fetch from 'node-fetch'
import * as uWS from 'uWebSockets.js'
import * as def from './def.js'
import * as obj from './obj.js'
import { checkEv } from '../../ev.js'
import { logger } from '../../logger.js'
import Plc from '../../Plc.js'
import Router from '../../Router.js'
import Server from '../../Server.js'

const start = async () => {
  try {
    const app = uWS.App().listen(def.HTTP, token => logger.info(token))
    // db
    const log = new Server('sqlite.db')
    log.run(def.SERVER, def.TCP)
    // plc comm
    const plc01 = new Plc(def.PLC)
    plc01.data(def, obj)
    plc01.on('pub', ({ channel, data }) => {
      if (channel === 'aps/queue') {
        const { index, queue } = JSON.parse(data)
        if (queue.length) {
          // checkEv(queue[index], plc01)
          checkEv(def, queue[index], obj, plc01)
        }
      }
    })
    const plc02 = new Plc(def.PLC)
    plc02.map(def, obj)
    // api routes
    const router = new Router(app, log, plc01)
    router.run(def, obj, `/aps/${def.APS}/ev`)
  } catch (err) {
    logger.error(new Error(err))
    process.exit(1)
  }
}

start()
