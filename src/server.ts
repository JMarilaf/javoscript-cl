import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

app.disable('x-powered-by');

/**
 * Cabeceras de seguridad. El sitio es HTML estatico sin formularios ni sesion,
 * asi que la CSP puede ser estricta: 'self' para todo y sin 'unsafe-inline' en
 * scripts (por eso app.config.ts no usa withEventReplay). Los estilos si lo
 * necesitan: Angular y beasties inyectan CSS critico en linea.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

/* ---------------------------------------------------------------------------
 * Tema resuelto en el servidor.
 *
 * El sitio esta prerenderizado, asi que el HTML se genera en build y una cookie
 * no puede influir en el. Para que quien eligio un tema distinto al de su
 * sistema no vea un parpadeo, aqui se lee la cookie y se escribe el atributo
 * `data-tema` sobre el HTML antes de enviarlo.
 *
 * La solucion habitual —un <script> inline en el <head>— quedaria bloqueada por
 * la CSP de arriba, que no admite 'unsafe-inline' en script-src.
 * ------------------------------------------------------------------------- */
const TEMAS_VALIDOS = new Set(['claro', 'oscuro']);

function temaDeCookie(cookie: string | undefined): string | null {
  const m = cookie?.match(/(?:^|;\s*)tema=([^;]*)/);
  const v = m?.[1];
  return v && TEMAS_VALIDOS.has(v) ? v : null;
}

function conTema(html: string, tema: string): string {
  return html.replace(/<html\b(?![^>]*\bdata-tema=)/i, `<html data-tema="${tema}"`);
}

/** Cache en memoria del HTML prerenderizado: son pocos archivos y no cambian. */
const prerenderizado = new Map<string, string | null>();

async function leerPrerenderizado(pathname: string): Promise<string | null> {
  if (prerenderizado.has(pathname)) return prerenderizado.get(pathname)!;

  // normalize + prefijo obligatorio: evita que un `..` en la URL saque la
  // lectura fuera del directorio publicado.
  const destino = normalize(join(browserDistFolder, pathname, 'index.html'));
  const html = destino.startsWith(browserDistFolder)
    ? await readFile(destino, 'utf8').catch(() => null)
    : null;

  prerenderizado.set(pathname, html);
  return html;
}

app.get('**', async (req, res, next) => {
  const tema = temaDeCookie(req.headers.cookie);
  if (!tema || !req.accepts('html')) return next();

  const html = await leerPrerenderizado(req.path);
  if (!html) return next();

  // Vary: dos usuarios con cookies distintas reciben HTML distinto, y ninguna
  // cache intermedia debe mezclarlos.
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Vary', 'Cookie');
  res.type('html').send(conTema(html, tema));
});

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
    setHeaders: (res, filePath) => {
      // Los assets llevan hash en el nombre y pueden cachearse un anio.
      // El HTML no: con 1y un visitante veria esta version del sitio hasta 2027.
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => {
      const tema = temaDeCookie(req.headers.cookie);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Vary', 'Cookie');
      res.send(tema ? conTema(html, tema) : html);
    })
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
