import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { IDIOMAS } from './content';
import { IdiomaService } from './idioma.service';

const ORIGEN = 'https://javoscript.cl';

/** Codigo de idioma HTML para cada idioma del sitio. */
const LANG: Record<string, string> = { es: 'es-CL', en: 'en' };

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);
  private i18n = inject(IdiomaService);

  set(t: string, desc: string): void {
    const idioma = this.i18n.idioma();
    const url = ORIGEN + this.i18n.enIdioma(idioma);

    this.doc.documentElement.setAttribute('lang', LANG[idioma]);

    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ property: 'og:title', content: t });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: LANG[idioma].replace('-', '_') });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.enlace('canonical', url);

    // hreflang en las dos direcciones mas x-default: sin esto los buscadores
    // tratan las dos versiones como contenido duplicado y eligen una sola.
    for (const otro of IDIOMAS) {
      this.enlace('alternate', ORIGEN + this.i18n.enIdioma(otro), LANG[otro]);
    }
    this.enlace('alternate', ORIGEN + this.i18n.enIdioma('es'), 'x-default');
  }

  jsonLd(id: string, data: unknown): void {
    this.doc.getElementById(id)?.remove();
    const s = this.doc.createElement('script');
    s.id = id;
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    this.doc.head.appendChild(s);
  }

  /** Crea o actualiza un <link>, identificandolo por rel + hreflang. */
  private enlace(rel: string, href: string, hreflang?: string): void {
    const sel = hreflang
      ? `link[rel="${rel}"][hreflang="${hreflang}"]`
      : `link[rel="${rel}"]:not([hreflang])`;
    let el = this.doc.querySelector<HTMLLinkElement>(sel);
    if (!el) {
      el = this.doc.createElement('link');
      el.setAttribute('rel', rel);
      if (hreflang) el.setAttribute('hreflang', hreflang);
      this.doc.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }
}
