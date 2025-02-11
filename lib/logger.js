import pino from 'pino'

/*
const TRACE = 'silent'
const DEBUG = 'debug'
const INFO = 'info'
const WARN = 'warn'
const ERROR = 'error'
const FATAL = 'fatal'
**/

export default pino({
  level: process.env.LOG_LEVEL,
  msgPrefix: '[aps-ev] ',
  timestamp: pino.stdTimeFunctions.isoTime
})
