import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

import { CONTENIDO, IDIOMA_POR_DEFECTO, Idioma } from './content';

/**
 * El idioma se deriva de la URL, no de estado guardado en el cliente.
 *
 * Es la unica forma de que el servidor renderice el idioma correcto sin
 * adivinar, y de que un buscador pueda indexar las dos versiones por separado.
 * `/`      -> español
 * `/en/…`  -> ingles
 */
@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private router = inject(Router);

  /** Se inicializa con la URL actual para que el primer render del SSR ya sea correcto. */
  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly idioma = computed<Idioma>(() => (esRutaEn(this.url()) ? 'en' : IDIOMA_POR_DEFECTO));
  readonly otro = computed<Idioma>(() => (this.idioma() === 'es' ? 'en' : 'es'));

  readonly c = computed(() => CONTENIDO[this.idioma()]);
  readonly ui = computed(() => this.c().ui);
  readonly perfil = computed(() => this.c().perfil);

  /** Prefijo de ruta del idioma activo: '' para español, '/en' para ingles. */
  readonly base = computed(() => (this.idioma() === 'en' ? '/en' : ''));

  /** La misma pagina en el otro idioma, para el selector y para hreflang. */
  readonly urlOtroIdioma = computed(() => rutaEn(this.url(), this.otro()));

  /** Ruta absoluta de esta pagina en un idioma dado. */
  enIdioma(idioma: Idioma): string {
    return rutaEn(this.url(), idioma);
  }
}

/** Solo `/en` exacto o `/en/…`, para no capturar rutas como `/entrevistas`. */
function esRutaEn(url: string): boolean {
  const limpia = url.split(/[?#]/)[0];
  return limpia === '/en' || limpia.startsWith('/en/');
}

/** Traduce una URL al prefijo del idioma pedido, conservando el resto de la ruta. */
export function rutaEn(url: string, idioma: Idioma): string {
  const limpia = url.split(/[?#]/)[0];
  const sinPrefijo = esRutaEn(limpia) ? limpia.slice(3) || '/' : limpia;
  if (idioma === 'es') return sinPrefijo === '' ? '/' : sinPrefijo;
  return sinPrefijo === '/' ? '/en' : `/en${sinPrefijo}`;
}
