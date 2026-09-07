import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Tema = 'auto' | 'claro' | 'oscuro';

export const COOKIE_TEMA = 'tema';

/**
 * Tema con tres estados. `auto` sigue al sistema operativo y es el valor por
 * defecto: la mayoria de la gente nunca toca el selector, y para esa mayoria
 * basta el `prefers-color-scheme` del CSS.
 *
 * La eleccion explicita se guarda en cookie, no en localStorage, porque el
 * servidor tiene que poder leerla: asi el HTML ya sale con el atributo puesto
 * y no hay parpadeo. Un script inline en el <head>, que es la solucion
 * habitual, quedaria bloqueado por la CSP del sitio (`script-src 'self'`).
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private doc = inject(DOCUMENT);
  private navegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** El servidor ya dejo el atributo puesto; en el navegador se lee de ahi. */
  readonly tema = signal<Tema>(leerDelDocumento(this.doc));

  fijar(t: Tema): void {
    this.tema.set(t);

    const raiz = this.doc.documentElement;
    if (t === 'auto') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', t);

    if (!this.navegador) return;

    // Un ano, y SameSite=Lax: es una preferencia de presentacion, no un dato
    // que sirva para rastrear a nadie entre sitios.
    this.doc.cookie =
      t === 'auto'
        ? `${COOKIE_TEMA}=; path=/; max-age=0; SameSite=Lax`
        : `${COOKIE_TEMA}=${t}; path=/; max-age=31536000; SameSite=Lax`;
  }

  /** Cicla auto -> claro -> oscuro -> auto. */
  siguiente(): void {
    const orden: Tema[] = ['auto', 'claro', 'oscuro'];
    this.fijar(orden[(orden.indexOf(this.tema()) + 1) % orden.length]);
  }
}

function leerDelDocumento(doc: Document): Tema {
  const v = doc.documentElement.getAttribute('data-tema');
  return v === 'claro' || v === 'oscuro' ? v : 'auto';
}
