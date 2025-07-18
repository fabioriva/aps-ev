import {
  CARDS,
  EXIT_ST_QUEUE_LEN,
  EXIT_EV_QUEUE_LEN,
  SWAP_EV_QUEUE_LEN,
  SWAP_ST_QUEUE_LEN,
  STALLS
} from './def.js'
import { Device } from '../../lib/Device.js'
import { generateCards } from '../../lib/Card.js'
import { generateQueue } from '../../lib/Queue.js'
import { generateStalls } from '../../lib/Stall.js'

const EVT1 = new Device(1, 'EVT1')
const EVT2 = new Device(2, 'EVT2')
const EVT3 = new Device(3, 'EVT3')
const IVT4 = new Device(4, 'IVT4')
const IVT5 = new Device(5, 'IVT5')
const IVT6 = new Device(6, 'IVT6')
export const devices = [EVT1, EVT2, EVT3, IVT4, IVT5, IVT6]
export const exitStQueue = generateQueue(EXIT_ST_QUEUE_LEN)
export const exitEvQueue = generateQueue(EXIT_EV_QUEUE_LEN)
export const swapEvQueue = generateQueue(SWAP_EV_QUEUE_LEN)
export const swapStQueue = generateQueue(SWAP_ST_QUEUE_LEN)
export const cards = generateCards(CARDS)
export const stalls = generateStalls(STALLS)
export const overview = {
  devices,
  exitStQueue,
  exitEvQueue,
  swapEvQueue,
  swapStQueue
}
export const q = { index: 0 }
