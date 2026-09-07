import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { CampoComponent } from './core/campo.component';
import { IdiomaService } from './core/idioma.service';
import { TemaService } from './core/tema.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CampoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected i18n = inject(IdiomaService);
  protected perfil = this.i18n.perfil;
  protected ui = this.i18n.ui;
  protected temas = inject(TemaService);

  /** Glifo del estado actual: circulo medio = auto, vacio = claro, lleno = oscuro. */
  protected glifo = computed(
    () => ({ auto: '◐', claro: '○', oscuro: '●' })[this.temas.tema()],
  );

  protected etiquetaTema = computed(() => {
    const u = this.ui();
    const nombre = { auto: 'Auto', claro: u.temaClaro, oscuro: u.temaOscuro }[this.temas.tema()];
    return `${u.tema}: ${nombre}`;
  });
}
