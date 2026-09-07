import { Routes } from '@angular/router';

/**
 * Las mismas paginas se montan dos veces: una sin prefijo (español) y otra
 * bajo `/en` (ingles). El idioma se deduce de la URL en IdiomaService, asi que
 * los componentes no necesitan saber bajo que rama estan.
 */
const paginas: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'caso/:slug',
    loadComponent: () => import('./pages/caso/caso.component').then((m) => m.CasoComponent),
  },
];

export const routes: Routes = [
  // `/en` va primero: si fuera al reves, la rama vacia capturaria todo.
  { path: 'en', children: paginas },
  { path: '', children: paginas },
  { path: '**', redirectTo: '' },
];
