import { randomBytes } from 'node:crypto';
import { readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { placeSchema, validatePlaces } from '../src/lib/schema.ts';

const endpoint = '/__forktown/places';
const maxBodyBytes = 8192;
const loopback = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

class SaveError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function reply(res: ServerResponse, status: number, body: object) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

function trustedRequest(req: IncomingMessage, token: string) {
  if (!loopback.has(req.socket.remoteAddress ?? '')) return false;
  if (!token || req.headers['x-forktown-token'] !== token) return false;
  try {
    const origin = new URL(req.headers.origin ?? '');
    return (
      ['http:', 'https:'].includes(origin.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) &&
      origin.host === req.headers.host &&
      origin.origin === req.headers.origin &&
      (!req.headers['sec-fetch-site'] || req.headers['sec-fetch-site'] === 'same-origin')
    );
  } catch {
    return false;
  }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    let exceeded = false;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (exceeded) return;
      if (size > maxBodyBytes) {
        exceeded = true;
        chunks.length = 0;
        reject(new SaveError(413, 'This place file is too large. Keep it to the builder fields.'));
      } else chunks.push(chunk);
    });
    req.on('end', () => {
      if (exceeded) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new SaveError(400, 'This is not valid JSON. Return to your design and try again.'));
      }
    });
    req.on('error', reject);
    req.on('aborted', () => reject(new SaveError(400, 'The save request was interrupted.')));
  });
}

async function savePlace(root: string, data: unknown) {
  const parsed = placeSchema.safeParse(data);
  if (!parsed.success)
    throw new SaveError(400, parsed.error.issues.map((issue) => issue.message).join(' '));
  const place = parsed.data;
  if (place.creator.toLowerCase() === 'forktown')
    throw new SaveError(
      400,
      'Use your own GitHub username. Forktown is reserved for starter places.',
    );

  // Never follow a replaced places directory outside this checkout.
  const directory = join(await realpath(root), 'places');
  if ((await realpath(directory)) !== directory)
    throw new SaveError(409, 'The places folder must be a regular folder in this project.');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.json'));
  const filename = `${place.id}.json`;
  if (files.some((file) => file.toLowerCase() === filename.toLowerCase()))
    throw new SaveError(
      409,
      `${filename} already exists. Choose a different file id; nothing was overwritten.`,
    );

  const entries = [];
  for (const file of files) {
    try {
      entries.push({ file, data: JSON.parse(await readFile(join(directory, file), 'utf8')) });
    } catch {
      throw new SaveError(
        409,
        `Fix the unreadable JSON in places/${file} before adding another place.`,
      );
    }
  }
  const result = validatePlaces([...entries, { file: filename, data: place }]);
  if (result.errors.length) throw new SaveError(409, result.errors.join(' '));
  try {
    // Exclusive creation also protects against another writer creating this file mid-save.
    await writeFile(join(directory, filename), JSON.stringify(place, null, 2) + '\n', {
      flag: 'wx',
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new SaveError(409, `${filename} already exists. Nothing was overwritten.`);
    throw error;
  }
  return { file: `places/${filename}`, place };
}

export function localPlacesMiddleware(root: string, token: string): Connect.NextHandleFunction {
  // Serialize validation + creation so two tabs cannot claim the same plot at once.
  let pending: Promise<unknown> = Promise.resolve();
  return (req, res, next) => {
    if (req.url?.split('?')[0] !== endpoint) return next();
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return reply(res, 405, { error: 'Use the builder’s Save to my project button.' });
    }
    if (!trustedRequest(req, token))
      return reply(res, 403, {
        error: 'Open the builder on this computer and refresh before saving.',
      });
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json')
      return reply(res, 415, { error: 'The place must be sent as JSON.' });

    void readBody(req)
      .then((data) => {
        const saving = pending.then(() => savePlace(root, data));
        pending = saving.catch(() => undefined);
        return saving;
      })
      .then((saved) => reply(res, 201, saved))
      .catch((error: unknown) => {
        const known = error instanceof SaveError;
        reply(res, known ? error.status : 500, {
          error: known
            ? error.message
            : 'Could not save the file. Check that the places folder is writable, then try again.',
        });
      });
  };
}

export function localPlacesPlugin(): Plugin {
  let token = '';
  return {
    name: 'forktown-local-places',
    config(_config, { command, isPreview }) {
      token = command === 'serve' && !isPreview ? randomBytes(32).toString('hex') : '';
      return { define: { __FORKTOWN_LOCAL_SAVE_TOKEN__: JSON.stringify(token) } };
    },
    configureServer(server) {
      server.middlewares.use(localPlacesMiddleware(server.config.root, token));
    },
  };
}
