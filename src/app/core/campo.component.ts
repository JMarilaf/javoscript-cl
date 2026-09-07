import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';

/**
 * Campo generativo de fondo. WebGL crudo, sin libreria: un solo triangulo que
 * cubre la pantalla y un fragment shader con domain warping.
 *
 * Decisiones que importan:
 *  - Se monta con afterNextRender, asi que nunca corre en el servidor.
 *  - Renderiza a una fraccion de la resolucion real y CSS lo escala. El campo
 *    es suave, asi que el upscale no se nota, y baja el costo por pixel a un
 *    tercio.
 *  - Se detiene cuando la pestana no esta visible: no gasta bateria de fondo.
 *  - Respeta prefers-reduced-motion y cualquier fallo de WebGL cayendo a un
 *    degradado CSS estatico, declarado en el propio host.
 */
@Component({
  selector: 'app-campo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #lienzo aria-hidden="true"></canvas>`,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: -1;
      display: block;
      pointer-events: none;
      background:
        radial-gradient(120% 90% at 15% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%),
        radial-gradient(100% 80% at 85% 100%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%),
        var(--bg);
    }
    canvas { display: block; width: 100%; height: 100%; }
  `,
})
export class CampoComponent {
  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private host = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => this.arrancar());
  }

  private arrancar(): void {
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto) return; // el degradado del host queda como fondo estatico

    const canvas = this.lienzo().nativeElement;
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return; // sin WebGL, tambien queda el degradado

    const programa = compilar(gl, VERTEX, FRAGMENT);
    if (!programa) return;

    const posicion = gl.getAttribLocation(programa, 'a_pos');
    const uTiempo = gl.getUniformLocation(programa, 'u_tiempo');
    const uRes = gl.getUniformLocation(programa, 'u_res');
    const uPuntero = gl.getUniformLocation(programa, 'u_puntero');
    const uAcento = gl.getUniformLocation(programa, 'u_acento');
    const uFondo = gl.getUniformLocation(programa, 'u_fondo');

    // Un solo triangulo mas grande que la pantalla: cubre todo con 3 vertices
    // en vez de los 6 de dos triangulos.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posicion);
    gl.vertexAttribPointer(posicion, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(programa);

    // El shader trabaja en la escala reducida; el elemento ocupa el 100%.
    let dibujado = false;
    const ESCALA = 0.55;
    const redimensionar = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5) * ESCALA;
      const w = Math.max(1, Math.round(this.host.nativeElement.clientWidth * dpr));
      const h = Math.max(1, Math.round(this.host.nativeElement.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      if (dibujado) dibujar();
    };
    redimensionar();
    const ro = new ResizeObserver(redimensionar);
    ro.observe(this.host.nativeElement);

    // El puntero mueve el campo. Se interpola para que no salte.
    const objetivo = { x: 0.5, y: 0.5 };
    const suave = { x: 0.5, y: 0.5 };
    const mover = (e: PointerEvent) => {
      objetivo.x = e.clientX / innerWidth;
      objetivo.y = 1 - e.clientY / innerHeight;
    };
    addEventListener('pointermove', mover, { passive: true });

    const leerColor = (nombre: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
    let acento = aRgb(leerColor('--accent'));
    let fondo = aRgb(leerColor('--bg'));
    const esquema = matchMedia('(prefers-color-scheme: dark)');
    const releerColores = () => {
      acento = aRgb(leerColor('--accent'));
      fondo = aRgb(leerColor('--bg'));
    };
    esquema.addEventListener('change', releerColores);

    // El tema tambien cambia por el selector, que escribe data-tema en <html>.
    // Sin esto el campo se queda con la paleta del tema anterior.
    const observador = new MutationObserver(() => {
      releerColores();
      if (!raf) dibujar(); // si el bucle esta pausado, refrescar igual
    });
    observador.observe(document.documentElement, { attributeFilter: ['data-tema'] });

    let raf = 0;
    let t0 = performance.now();
    let tiempo = 0;

    const dibujar = () => {
      gl.uniform1f(uTiempo, tiempo);
      gl.uniform2f(uPuntero, suave.x, suave.y);
      gl.uniform3f(uAcento, acento[0], acento[1], acento[2]);
      gl.uniform3f(uFondo, fondo[0], fondo[1], fondo[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const pintar = (ahora: number) => {
      raf = requestAnimationFrame(pintar);
      const dt = Math.min((ahora - t0) / 1000, 0.05);
      t0 = ahora;
      tiempo += dt;

      suave.x += (objetivo.x - suave.x) * 0.045;
      suave.y += (objetivo.y - suave.y) * 0.045;
      dibujar();
    };

    const reanudar = () => {
      if (raf || document.hidden) return;
      t0 = performance.now();
      raf = requestAnimationFrame(pintar);
    };
    const pausar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    document.addEventListener('visibilitychange', () => (document.hidden ? pausar() : reanudar()));

    // Un frame siempre, aunque la pestana cargue en segundo plano: asi el
    // canvas nunca queda transparente esperando a que la miren.
    dibujar();
    dibujado = true;
    reanudar();
  }
}

/** '#ff5c46' o 'rgb(...)' a [0..1, 0..1, 0..1]. */
function aRgb(css: string): [number, number, number] {
  const hex = css.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const nums = css.match(/[\d.]+/g);
  if (nums && nums.length >= 3) {
    return [+nums[0] / 255, +nums[1] / 255, +nums[2] / 255];
  }
  return [1, 0.36, 0.27];
}

function compilar(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const cargar = (tipo: number, fuente: string) => {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[campo] shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v = cargar(gl.VERTEX_SHADER, vs);
  const f = cargar(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('[campo] link:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/**
 * Domain warping: se evalua fbm sobre coordenadas que a su vez vienen de fbm.
 * Produce estructuras que fluyen sin repetirse. Tres octavas alcanzan porque
 * el resultado se ve escalado desde media resolucion.
 */
const FRAGMENT = `
precision highp float;

uniform float u_tiempo;
uniform vec2  u_res;
uniform vec2  u_puntero;
uniform vec3  u_acento;
uniform vec3  u_fondo;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float ruido(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * ruido(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  float t = u_tiempo * 0.085;

  // El puntero desplaza el campo, no lo distorsiona: se siente que el fondo
  // responde sin que el efecto se vuelva un juguete.
  vec2 haciaPuntero = (u_puntero - vec2(0.5)) * 0.35;
  p += haciaPuntero;

  vec2 q = vec2(fbm(p * 3.2 + t), fbm(p * 3.2 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 3.2 + 3.4 * q + vec2(1.7, 9.2) + t * 1.4),
                fbm(p * 3.2 + 3.4 * q + vec2(8.3, 2.8) - t * 1.1));
  float f = fbm(p * 3.2 + 3.0 * r);

  // Bandas suaves en vez de nubes: se lee mas intencional.
  float banda = smoothstep(0.28, 0.74, f);
  float brillo = pow(smoothstep(0.40, 0.95, f + 0.30 * length(r)), 1.8);

  vec3 col = u_fondo;

  // El campo se atenua hacia el centro: ahi vive el texto y tiene que leerse.
  float calma = mix(0.30, 1.0, smoothstep(0.05, 0.62, distance(uv, vec2(0.5))));

  // Sobre fondo claro no se puede sumar luz: revienta a blanco. Se mezcla
  // hacia un tono mas oscuro que el fondo en vez de aclararlo.
  float luma = dot(u_fondo, vec3(0.299, 0.587, 0.114));
  float esClaro = step(0.5, luma);
  vec3 realce = mix(u_acento, u_acento * 0.42, esClaro);
  float fuerza = mix(1.0, 0.55, esClaro);

  col = mix(col, mix(u_fondo, realce, 0.62), banda * calma * fuerza);
  col = mix(col, realce, brillo * 0.16 * calma * fuerza);

  // Filamentos: la derivada del campo marca los bordes de las bandas y da
  // estructura, que es lo que separa esto de una mancha difusa.
  float borde = abs(f - fbm(p * 3.2 + 3.0 * r + vec2(0.02)));
  col = mix(col, realce, smoothstep(0.025, 0.0, borde) * 0.14 * calma * fuerza);

  // Vinieta: devuelve las esquinas al fondo para que no compita con el texto.
  float d = distance(uv, vec2(0.5));
  col = mix(col, u_fondo, smoothstep(0.62, 1.25, d) * 0.5);

  // Dither: rompe el banding que deja el upscale desde media resolucion.
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;
