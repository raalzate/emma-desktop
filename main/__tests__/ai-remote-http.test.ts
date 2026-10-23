import { describe, it, expect, vi } from 'vitest';
import {
  buildGenerateRequest,
  buildVerifyRequest,
  parseGenerateResponse,
  describeRemoteError,
  RemoteHttpError,
  withRetry,
  parseKeySetArgs,
  parseRemoteGenerateArgs,
} from '../services/ai-remote-http';

describe('buildGenerateRequest', () => {
  it('Gemini lleva la llave en el header x-goog-api-key, nunca en la URL', () => {
    const { url, init } = buildGenerateRequest('gemini', 'SECRETA', 'gemini-2.5-flash', 'hi', 'sys');
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    expect(url).not.toContain('SECRETA');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('SECRETA');
    const body = JSON.parse(init.body as string);
    expect(body.contents[0].parts[0].text).toBe('hi');
    expect(body.systemInstruction.parts[0].text).toBe('sys');
  });

  it('OpenAI usa Bearer y antepone el system', () => {
    const { url, init } = buildGenerateRequest('openai', 'k', 'gpt-4o-mini', 'hi', 'sys');
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer k');
    expect(JSON.parse(init.body as string).messages[0]).toEqual({ role: 'system', content: 'sys' });
  });

  it('Anthropic usa x-api-key y la versión de la API', () => {
    const { init } = buildGenerateRequest('anthropic', 'k', 'claude-haiku-4-5', 'hi');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('k');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(JSON.parse(init.body as string).system).toBeUndefined();
  });
});

describe('buildVerifyRequest', () => {
  it('verifica con el listado de modelos: no consume cuota de generación', () => {
    expect(buildVerifyRequest('gemini', 'k').url).toBe('https://generativelanguage.googleapis.com/v1beta/models');
    expect(buildVerifyRequest('openai', 'k').url).toBe('https://api.openai.com/v1/models');
    expect(buildVerifyRequest('anthropic', 'k').url).toBe('https://api.anthropic.com/v1/models');
    expect(buildVerifyRequest('gemini', 'k').init.method).toBe('GET');
  });
});

describe('parseGenerateResponse', () => {
  it('une las partes de texto de cada proveedor', () => {
    expect(parseGenerateResponse('gemini', { candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] })).toBe('ab');
    expect(parseGenerateResponse('openai', { choices: [{ message: { content: ' x ' } }] })).toBe('x');
    expect(parseGenerateResponse('anthropic', { content: [{ text: 'y' }, { type: 'other' }] })).toBe('y');
  });

  it('respuesta sin forma esperada devuelve vacío', () => {
    expect(parseGenerateResponse('gemini', null)).toBe('');
    expect(parseGenerateResponse('openai', {})).toBe('');
  });
});

describe('describeRemoteError', () => {
  it('429 explica la cuota y sugiere el modelo liviano o esperar', () => {
    const msg = describeRemoteError('gemini', 429);
    expect(msg).toMatch(/quota|limit/i);
    expect(msg).toContain('gemini-2.5-flash-lite');
  });

  it('401/403 dice que la llave es inválida', () => {
    expect(describeRemoteError('openai', 401)).toMatch(/key/i);
    expect(describeRemoteError('gemini', 403)).toMatch(/key/i);
  });

  it('5xx dice que el proveedor no responde', () => {
    expect(describeRemoteError('anthropic', 503)).toMatch(/unavailable|try again/i);
  });

  it('Gemini 400 con API_KEY_INVALID también es llave inválida', () => {
    expect(describeRemoteError('gemini', 400, '{"error":{"details":[{"reason":"API_KEY_INVALID"}]}}')).toMatch(/key/i);
  });
});

describe('withRetry', () => {
  const sleep = vi.fn(async () => {});

  it('reintenta 429 y 5xx con espera creciente y devuelve el éxito', async () => {
    sleep.mockClear();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new RemoteHttpError(429, 'q'))
      .mockRejectedValueOnce(new RemoteHttpError(503, 'down'))
      .mockResolvedValueOnce('ok');
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 100, sleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 200);
  });

  it('no reintenta errores que no son transitorios (401)', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new RemoteHttpError(401, 'bad'));
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1, sleep })).rejects.toMatchObject({ status: 401 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('agotados los intentos, propaga el último error', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new RemoteHttpError(429, 'q'));
    await expect(withRetry(fn, { attempts: 2, baseDelayMs: 1, sleep })).rejects.toMatchObject({ status: 429 });
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('validación de la entrada del IPC (Zod)', () => {
  it('acepta un proveedor conocido y una llave de texto', () => {
    expect(parseKeySetArgs('gemini', '  abc ')).toEqual({ provider: 'gemini', key: 'abc' });
  });

  it('rechaza proveedor desconocido o llave que no es texto', () => {
    expect(() => parseKeySetArgs('evil', 'k')).toThrow();
    expect(() => parseKeySetArgs('gemini', 42)).toThrow();
  });

  it('valida los argumentos de generación', () => {
    expect(parseRemoteGenerateArgs({ provider: 'openai', model: 'gpt-4o-mini', prompt: 'hi' })).toMatchObject({ provider: 'openai' });
    expect(() => parseRemoteGenerateArgs({ provider: 'openai', model: '', prompt: 'hi' })).toThrow();
    expect(() => parseRemoteGenerateArgs({ provider: 'gemini', model: 'm', prompt: 3 })).toThrow();
  });

  it('el modelo no puede romper la ruta de la URL', () => {
    expect(() => parseRemoteGenerateArgs({ provider: 'gemini', model: '../x?key=1', prompt: 'hi' })).toThrow();
  });
});
