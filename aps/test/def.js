export const APS = 'spire'
export const DB = 'wallstreet'
export const HTTP = 9100
export const PLC = {
  ip: '192.168.20.55',
  rack: 0,
  slot: 1,
  polling_time: 999
}
export const SERVER = '192.168.20.56'
export const TCP = 9101
export const EXIT_QUEUE_LEN = 5
export const SWAP_QUEUE_LEN = 10

const DB_DATA = 541
const DB_DATA_LEN = 140
export const DB_DATA_INIT_DEVICE = 0
export const DB_DATA_INIT_EXIT_QUEUE = 36
export const DB_DATA_INIT_SWAP_QUEUE = 74

export const DATA_READ = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 0,
  amount: DB_DATA_LEN,
  wordLen: 0x02
}
export const REQ_EXIT_IN = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 70,
  amount: 2,
  wordLen: 0x02
}
export const REQ_EXIT_OUT = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 72,
  amount: 2,
  wordLen: 0x02
}
export const REQ_SWAP_IN = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 138,
  amount: 2,
  wordLen: 0x02
}
export const REQ_SWAP_OUT = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 140,
  amount: 2,
  wordLen: 0x02
}
export const CARD_MIN = 1
export const CARD_MAX = 266
export const STALLS = 276
export const STALL_LEN = 10
export const STALL_STATUS = {
  FREE: 0,
  PAPA: 997,
  RSVD: 998,
  LOCK: 999
}

export const MAP_READ = {
  area: 0x84,
  dbNumber: 510,
  start: 0,
  amount: STALLS * STALL_LEN,
  wordLen: 0x02
}
export const EV_STALLS_READ = {
  area: 0x84,
  dbNumber: 542,
  start: 0,
  amount: STALLS * 4,
  wordLen: 0x02
}
