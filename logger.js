import pino from 'pino'

const TRACE = 'silent'
const DEBUG = 'debug'
const INFO = 'info'
const WARN = 'warn'
const ERROR = 'error'
const FATAL = 'fatal'

const levels = [TRACE, DEBUG, INFO, WARN, ERROR, FATAL]

export const logger = pino({
  level: levels[1],
  msgPrefix: '[aps-ev] ',
  timestamp: pino.stdTimeFunctions.isoTime
})
