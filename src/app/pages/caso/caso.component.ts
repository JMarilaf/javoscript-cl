import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CASOS, Caso } from '../../core/content';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-caso',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './caso.component.html',
  styleUrl: './caso.component.scss',
})
export class CasoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);

  caso!: Caso;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    const found = CASOS.find((c) => c.slug === slug);

    if (!found) {
      this.router.navigate(['/']);
      return;
    }

    this.caso = found;
    this.seo.set(`${found.titulo} — Javier Marilaf`, found.gancho, `/caso/${found.slug}/`);
    this.seo.jsonLd('ld-caso', {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: found.titulo,
      description: found.gancho,
      author: { '@type': 'Person', name: 'Javier Marilaf', url: 'https://javoscript.cl' },
      about: found.stack,
    });
  }
}
