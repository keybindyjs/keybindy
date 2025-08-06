type LogOptions = {
  silent?: boolean;
};

const createLogger = (method: 'log' | 'warn' | 'error') => {
  return (message: any, options: LogOptions = {}) => {
    if (!options.silent) {
      console[method]('[Keybindy]', message);
    }
  };
};

export class Logger {
  private silent: boolean;

  constructor(options: { silent?: boolean } = {}) {
    this.silent = options.silent || false;
  }

  log(message: any, options: LogOptions = {}) {
    if (!this.silent && !options.silent) {
      console.log('[Keybindy]', message);
    }
  }

  warn(message: any, options: LogOptions = {}) {
    if (!this.silent && !options.silent) {
      console.warn('[Keybindy]', message);
    }
  }

  error(message: any, options: LogOptions = {}) {
    if (!this.silent && !options.silent) {
      console.error('[Keybindy]', message);
    }
  }
}

export const logger = new Logger();

export const log = createLogger('log');
export const warn = createLogger('warn');
export const error = createLogger('error');
