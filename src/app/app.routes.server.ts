import { RenderMode, ServerRoute } from '@angular/ssr';
import { CASOS } from './core/content';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  {
    path: 'caso/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => CASOS.map((c) => ({ slug: c.slug })),
  },
  { path: '**', renderMode: RenderMode.Server },
];
