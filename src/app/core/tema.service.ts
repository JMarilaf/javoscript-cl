import { DOCUMENT, Injectable, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Tema = 'claro' | 'oscuro';

export const COOKIE_TEMA = 'tema';

/**
 * Tema claro/oscuro.
 *
 * No hay un estado "auto" visible: el sitio arranca en lo que diga el sistema
 * operativo —eso lo resuelve `prefers-color-scheme` en el CSS— y el
 * interruptor solo aparece como claro u oscuro. Tres estados no se comunican
 * con un solo control, y la mayoria de la gente nunca necesita el tercero.
 *
 * La eleccion se guarda en cookie, no en localStorage, porque el servidor
 * tiene que leerla para escribir `data-tema` en el HTML y evitar el parpadeo.
 * Un script inline en el <head>, que es la solucion habitual, quedaria
 * bloqueado por la CSP del sitio (`script-src 'self'`).
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private doc = inject(DOCUMENT);
  private navegador = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Solo para accesibilidad (`aria-checked`). La posicion visible de la
   * perilla NO depende de esto: la calcula el CSS con `--tema-pos`, asi que
   * es correcta desde el primer render aunque el servidor no sepa el tema del
   * sistema.
   */
  readonly esOscuro = signal(false);

  constructor() {
    afterNextRender(() => this.esOscuro.set(this.actual() === 'oscuro'));
  }

  /** El tema que se esta viendo ahora: atributo explicito, o el del sistema. */
  actual(): Tema {
    const explicito = this.doc.documentElement.getAttribute('data-tema');
    if (explicito === 'claro' || explicito === 'oscuro') return explicito;
    return this.navegador && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro';
  }

  alternar(): void {
    this.fijar(this.actual() === 'oscuro' ? 'claro' : 'oscuro');
  }

  fijar(t: Tema): void {
    this.doc.documentElement.setAttribute('data-tema', t);
    this.esOscuro.set(t === 'oscuro');
    if (!this.navegador) return;

    // Un ano, y SameSite=Lax: es una preferencia de presentacion, no un dato
    // que sirva para rastrear a nadie entre sitios.
    this.doc.cookie = `${COOKIE_TEMA}=${t}; path=/; max-age=31536000; SameSite=Lax`;
  }
}
