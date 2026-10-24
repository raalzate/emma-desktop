// Entrada mínima de Electron (sin ventana) para `pnpm voice:smoke`: ver smoke.ts.
import { app } from 'electron';
import { runVoiceSmokeAndExit } from './smoke';

app.whenReady().then(runVoiceSmokeAndExit);
