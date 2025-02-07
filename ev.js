import { logger } from './logger.js'
import { WriteArea } from './utils7.js'

export const checkEv = async (def, item, obj, plc) => {
  logger.debug('queue item: %o', item)
  const { card, slot } = item
  // if (card >= def.CARD_MIN && card <= def.CARD_MAX && isEv(obj, slot)) {
  const busy = await isEvBusy(def.APS, card, slot)
  logger.info('card %s slot %s is busy: %s', card, slot, busy)
  if (!busy) {
    await unlockEv(def.EV_STALLS_READ, plc, slot)
  }
  // }
}

// const isEv = (obj, slot) => obj.stalls.some(stall => stall.nr === slot && stall.ev_type !== 0)

const isEvBusy = async (aps, card, slot) => {
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

const unlockEv = async (params, plc, slot) => {
  try {
    const buffer = Buffer.alloc(2)
    buffer.writeUInt16BE(0, 0)
    const { area, dbNumber } = params
    const start = slot === 1 ? 0 + 2 : (slot - 1) * 4 + 2
    const response = await WriteArea(plc.client, area, dbNumber, start, 2, 0x02, buffer)
    logger.debug('write parameters: area %s db %d start %d, response: %s', area, dbNumber, start, response)
  } catch (err) {
    logger.error(err, 'write error')
    return true
  }
}
