type Meta = Record<string, unknown>;

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Meta) {
  const payload = meta ? { message, ...meta } : message;
  if (level === 'info') console.log(payload);
  if (level === 'warn') console.warn(payload);
  if (level === 'error') console.error(payload);
}

export const logger = {
  info: (message: string, meta?: Meta) => log('info', message, meta),
  warn: (message: string, meta?: Meta) => log('warn', message, meta),
  error: (message: string, meta?: Meta) => log('error', message, meta),
};
