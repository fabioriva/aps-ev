import 'dotenv/config.js'
// import fetch from 'node-fetch'
import * as uWS from 'uWebSockets.js'
import * as def from './def.js'
import * as obj from './obj.js'
import Db from '../../db.js'
import { checkEv } from '../../ev.js'
import { logger } from '../../logger.js'
import Plc from '../../Plc.js'
import Router from '../../Router.js'
// import { WriteArea } from '../../utils7.js'

// const checkEv = async (item, plc) => {
//   logger.debug('queue item: %o', item)
//   const { card, slot } = item
//   if (card >= def.CARD_MIN && card <= def.CARD_MAX && isEv(slot)) {
//     const busy = await isEvBusy(card, slot)
//     logger.info('card %s slot %s is busy: %s', card, slot, busy)
//     if (!busy) {
//       await unlockEv(card, slot, plc)
//     }
//   }
// }

// const isEv = (slot) => obj.stalls.some(stall => stall.nr === slot && stall.ev_type !== 0)

// const isEvBusy = async (card, slot) => {
//   try {
//     const url = `${process.env.PW_API}?stall=${slot}&cardID=${card}&location=${def.APS}`
//     const res = await fetch(url, {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': process.env.PW_TOKEN
//       }
//     })
//     if (res.ok) {
//       const json = await res.json()
//       return Boolean(json.busy)
//     } else {
//       logger.error('fetch response status %d %s', res.status, res.statusText)
//       return true
//     }
//   } catch (err) {
//     logger.error('fetch network error %o', err)
//     return true
//   }
// }

// const unlockEv = async (card, slot, plc) => {
//   try {
//     const buffer = Buffer.alloc(2)
//     buffer.writeUInt16BE(0, 0)
//     const { area, dbNumber } = def.EV_STALLS_READ
//     const start = slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2
//     const response = await WriteArea(plc.client, area, dbNumber, start, 2, 0x02, buffer)
//     logger.debug('write parameters: area %s db %d start %d, response: %s', area, dbNumber, start, response)
//   } catch (err) {
//     logger.error(err, 'write error')
//     return true
//   }
// }

const start = async () => {
  try {
    const app = uWS.App().listen(def.HTTP, token => logger.info(token))
    // db
    const db = new Db(def.DB)
    db.run(def)
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
    const router = new Router(app, db, plc01)
    router.run(def, obj, `/aps/${def.APS}/ev`)
  } catch (err) {
    logger.error(new Error(err))
    process.exit(1)
  }
}

start()
