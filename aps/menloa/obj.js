import { EXIT_QUEUE_LEN, SWAP_QUEUE_LEN, STALLS } from './def.js'
import { Device } from '../../Device.js'
import { generateQueue } from '../../Queue.js'
import { generateStalls } from '../../Stall.js'

const EU1 = new Device(1, 'EU1')
const EU2 = new Device(2, 'EU2')
const EU3 = new Device(3, 'EU3')
const T1 = new Device(4, 'T1')
const T2 = new Device(5, 'T2')
const T3 = new Device(6, 'T3')
export const devices = [EU1, EU2, EU3, T1, T2, T3]
export const exitQueue = generateQueue(EXIT_QUEUE_LEN)
export const swapQueue = generateQueue(SWAP_QUEUE_LEN)
export const stalls = generateStalls(STALLS)
export const overview = {
  devices,
  exitQueue,
  swapQueue
}
export const q = { index: 0 }
