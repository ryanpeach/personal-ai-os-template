import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'apps/todo',
    loadComponent: () => import('./apps/todo/todo.component').then((m) => m.TodoComponent),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
