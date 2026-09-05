import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'caso/:slug',
    loadComponent: () => import('./pages/caso/caso.component').then((m) => m.CasoComponent),
  },
  { path: '**', redirectTo: '' },
];
