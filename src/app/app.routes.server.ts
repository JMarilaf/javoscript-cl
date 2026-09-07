import { RenderMode, ServerRoute } from '@angular/ssr';
import { CONTENIDO } from './core/content';

/** Los slugs son los mismos en ambos idiomas: la URL no cambia, el contenido si. */
const slugs = async () => CONTENIDO.es.casos.map((c) => ({ slug: c.slug }));

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'caso/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: slugs },
  { path: 'en', renderMode: RenderMode.Prerender },
  { path: 'en/caso/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: slugs },
  { path: '**', renderMode: RenderMode.Server },
];
