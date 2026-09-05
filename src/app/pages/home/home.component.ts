import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CASOS, PERFIL, PROYECTOS, STACK } from '../../core/content';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private seo = inject(SeoService);

  readonly perfil = PERFIL;
  readonly stack = STACK;
  readonly casos = CASOS;
  readonly proyectos = PROYECTOS;

  ngOnInit(): void {
    this.seo.set(
      `${PERFIL.nombre} — ${PERFIL.titular}`,
      PERFIL.resumen,
      '/',
    );
    this.seo.jsonLd('ld-person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: PERFIL.nombre,
      jobTitle: 'Desarrollador Full Stack',
      email: `mailto:${PERFIL.email}`,
      url: 'https://javoscript.cl',
      sameAs: [PERFIL.linkedin, PERFIL.github],
      address: { '@type': 'PostalAddress', addressLocality: 'Santiago', addressCountry: 'CL' },
      knowsAbout: ['Angular', 'TypeScript', 'Java', 'Spring', 'SAP Commerce Cloud', 'SEO técnico'],
    });
  }
}
