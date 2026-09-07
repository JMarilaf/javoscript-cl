import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { IdiomaService } from '../../core/idioma.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-caso',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caso.component.html',
  styleUrl: './caso.component.scss',
})
export class CasoComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);
  protected i18n = inject(IdiomaService);

  protected ui = this.i18n.ui;

  private slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug'))), {
    initialValue: this.route.snapshot.paramMap.get('slug'),
  });

  /** El slug es el mismo en ambos idiomas, asi que cambiar de idioma no pierde la pagina. */
  protected caso = computed(() => this.i18n.c().casos.find((c) => c.slug === this.slug()));

  constructor() {
    effect(() => {
      const c = this.caso();
      if (!c) {
        this.router.navigateByUrl(this.i18n.base() || '/');
        return;
      }
      this.seo.set(`${c.titulo} — Javier Marilaf`, c.gancho);
      this.seo.jsonLd('ld-caso', {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: c.titulo,
        description: c.gancho,
        inLanguage: this.i18n.idioma(),
        author: { '@type': 'Person', name: 'Javier Marilaf', url: 'https://javoscript.cl' },
        about: c.stack,
      });
    });
  }
}
