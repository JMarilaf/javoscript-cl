import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IdiomaService } from '../../core/idioma.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private seo = inject(SeoService);
  protected i18n = inject(IdiomaService);

  protected perfil = this.i18n.perfil;
  protected ui = this.i18n.ui;
  protected casos = computed(() => this.i18n.c().casos);
  protected proyectos = computed(() => this.i18n.c().proyectos);
  protected stack = computed(() => this.i18n.c().stack);

  constructor() {
    // effect y no ngOnInit: al cambiar de idioma hay que reescribir titulo,
    // descripcion, canonical y hreflang.
    effect(() => {
      const p = this.perfil();
      this.seo.set(`${p.nombre} — ${p.titular}`, p.resumen);
      this.seo.jsonLd('ld-person', {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: p.nombre,
        jobTitle: p.titular.split('—')[0].trim(),
        email: `mailto:${p.email}`,
        url: 'https://javoscript.cl',
        sameAs: [p.linkedin, p.github],
        address: { '@type': 'PostalAddress', addressLocality: 'Santiago', addressCountry: 'CL' },
        knowsAbout: ['Angular', 'TypeScript', 'Java', 'Spring', 'SAP Commerce Cloud', 'SEO'],
      });
    });
  }
}
