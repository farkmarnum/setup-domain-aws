type LogLevel = 'error' | 'warn' | 'log' | 'info' | 'debug'

interface Logger {
  logLevel: LogLevel
}

type LogInput = any

const DEFAULT_LOG_LEVEL = 'log'

class Logger {
  constructor() {
    this.logLevel = DEFAULT_LOG_LEVEL as LogLevel
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  debug(str: LogInput) {
    if (['debug'].includes(this.logLevel)) {
      console.debug(str)
    }
  }

  info(str: LogInput) {
    if (['debug', 'info'].includes(this.logLevel)) {
      console.info(str)
    }
  }

  log(str: LogInput) {
    if (['debug', 'info', 'log'].includes(this.logLevel)) {
      console.log(str)
    }
  }

  warn(str: LogInput) {
    if (['debug', 'info', 'log', 'warn'].includes(this.logLevel)) {
      console.warn(str)
    }
  }

  error(str: LogInput) {
    if (['debug', 'info', 'log', 'warn', 'error'].includes(this.logLevel)) {
      console.error(str)
    }
  }
}

export default Logger
