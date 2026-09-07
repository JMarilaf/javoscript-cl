# javoscript.cl

Portafolio personal de Javier Marilaf. Angular 21 standalone con renderizado en
servidor, bilingüe y prerenderizado.

Repositorio: https://github.com/JMarilaf/javoscript-cl

## Cómo está armado

```
src/app/core/content.ts          todo el contenido del sitio, indexado por idioma
src/app/core/idioma.service.ts   idioma derivado de la URL
src/app/core/tema.service.ts     tema claro/oscuro/auto
src/app/core/campo.component.ts  el campo generativo WebGL de la portada
src/app/core/seo.service.ts      title, canonical, hreflang y JSON-LD
src/server.ts                    Express: cabeceras de seguridad e inyección de tema
public/fonts/                    IBM Plex self-hosted
```

Para cambiar textos basta con tocar `core/content.ts`.

## Las tres decisiones que explican el resto

**El campo de la portada no usa librería.** Es un fragment shader con domain
warping sobre WebGL crudo: un triángulo a pantalla completa y unas cien líneas.
Traer Three.js habría sumado peso y una pregunta abierta sobre la CSP, que no
admite `unsafe-eval`. Renderiza al 55% de la resolución y CSS lo escala; el
campo es suave y el upscale no se nota. Se pausa fuera de foco y cae a un
degradado CSS con `prefers-reduced-motion` o sin WebGL.

**El idioma vive en la URL, no en el cliente.** `/` es español y `/en` inglés.
Es lo que permite que el servidor renderice el idioma correcto sin adivinar y
que los buscadores indexen las dos versiones. No se usa `@angular/localize`: un
objeto indexado por idioma y las mismas páginas montadas dos veces en el router.
Los slugs no cambian entre idiomas, así que cambiar de idioma no pierde la
página.

**El tema se resuelve en el servidor.** La elección va en cookie, no en
`localStorage`, porque el servidor tiene que leerla. Como el sitio está
prerenderizado, Express inyecta `data-tema` sobre el HTML antes de enviarlo: sin
parpadeo y sin script inline, que la CSP bloquearía.

## Desarrollo

```bash
npm install
npm start                 # http://localhost:4200
```

El dev server **no** reproduce el Express de producción: la inyección de tema y
el servido de rutas prerenderizadas solo se ven en el build real.

```bash
npm run build
PORT=4003 node dist/web/server/server.mjs
```

## Despliegue

El servidor tiene este repositorio clonado en `~/projects/portfolio/web`:

```bash
git -C ~/projects/portfolio/web pull --ff-only
cd ~/projects/portfolio && sudo docker compose up -d --build
```

Escucha en el puerto **4003**, detrás de Nginx Proxy Manager y Cloudflare.
