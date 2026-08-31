import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { isDev } from './config';

/** Redirige console.* a un archivo en userData/logs en producción. */
export function setupProdLogger(): void {
  if (isDev) return;

  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logFilePath = path.join(logDir, `emma_${new Date().toISOString().slice(0, 10)}.log`);
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

  const origError = console.error;
  const origWarn = console.warn;
  const origLog = console.log;

  const logToFile = (level: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}]: ${args
      .map((a) => (typeof a === 'object' ? util.inspect(a, { depth: 5 }) : String(a)))
      .join(' ')}\n`;
    logStream.write(line);
    if (level === 'error') origError.apply(console, args);
    else if (level === 'warn') origWarn.apply(console, args);
    else origLog.apply(console, args);
  };

  console.log = (...args) => logToFile('info', ...args);
  console.error = (...args) => logToFile('error', ...args);
  console.warn = (...args) => logToFile('warn', ...args);
  console.log('✅ Logger de producción EMMA inicializado:', logFilePath);
}
