export const EXIT_ST_QUEUE_LEN = 5
export const EXIT_EV_QUEUE_LEN = 5
export const SWAP_EV_QUEUE_LEN = 5
export const SWAP_ST_QUEUE_LEN = 5

const DB_DATA = 541
const DB_DATA_LEN = 186
export const DB_DATA_INIT_DEVICE = 0
export const DB_DATA_INIT_EXIT_EV_QUEUE = 38
export const DB_DATA_INIT_EXIT_ST_QUEUE = 74
export const DB_DATA_INIT_SWAP_EV_QUEUE = 110
export const DB_DATA_INIT_SWAP_ST_QUEUE = 148

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
  start: 36,
  amount: 2,
  wordLen: 0x02
}
export const REQ_EXIT_EV_OUT = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 72,
  amount: 2,
  wordLen: 0x02
}
export const REQ_EXIT_ST_OUT = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 108,
  amount: 2,
  wordLen: 0x02
}

export const REQ_SWAP_EV_IN = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 144,
  amount: 2,
  wordLen: 0x02
}
export const REQ_SWAP_EV_OUT = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 146,
  amount: 2,
  wordLen: 0x02
}
export const REQ_SWAP_ST_IN = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 182,
  amount: 2,
  wordLen: 0x02
}
export const REQ_SWAP_ST_OUT = {
  area: 0x84,
  dbNumber: DB_DATA,
  start: 184,
  amount: 2,
  wordLen: 0x02
}
export const CARD_MIN = 1
export const CARD_MAX = 266
export const CARD_LEN = 4
export const CARDS = 266
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
export const EV_CARDS_READ = {
  area: 0x84,
  dbNumber: 543,
  start: 0,
  amount: CARDS * 4,
  wordLen: 0x02
}
export const EV_STALLS_READ = {
  area: 0x84,
  dbNumber: 542,
  start: 0,
  amount: STALLS * 4,
  wordLen: 0x02
}
