import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PERFIL } from './core/content';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly perfil = PERFIL;
  readonly anio = 2026;
}
