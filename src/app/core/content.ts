export type Idioma = 'es' | 'en';
export const IDIOMAS: readonly Idioma[] = ['es', 'en'] as const;
export const IDIOMA_POR_DEFECTO: Idioma = 'es';

export interface Caso {
  slug: string;
  titulo: string;
  gancho: string;
  rol: string;
  contexto: string;
  stack: string[];
  secciones: { h: string; p: string[]; code?: { lang: string; texto: string }; lista?: string[] }[];
  cierre: string;
}

export interface Proyecto {
  nombre: string;
  descripcion: string;
  stack: string[];
  demo?: string;
  repo?: string;
  estado: string;
}

export interface Perfil {
  nombre: string;
  titular: string;
  resumen: string;
  ubicacion: string;
  email: string;
  linkedin: string;
  github: string;
}

/** Textos de interfaz. Todo lo que no es contenido editorial vive aca. */
export interface Ui {
  escribeme: string;
  elTrabajo: string;
  correo: string;
  redes: string;
  casos: string;
  notaCasos: string;
  proyectos: string;
  notaProyectos: string;
  stack: string;
  volver: string;
  rol: string;
  cierre: string;
  notaAnonimato: string;
  tema: string;
  temaClaro: string;
  temaOscuro: string;
  idioma: string;
}

export interface Contenido {
  perfil: Perfil;
  stack: { grupo: string; items: string[] }[];
  casos: Caso[];
  proyectos: Proyecto[];
  ui: Ui;
}

/** Datos que no se traducen: son los mismos en cualquier idioma. */
const CONTACTO = {
  nombre: 'Javier Marilaf',
  email: 'javiermarilaf@gmail.com',
  linkedin: 'https://linkedin.com/in/jmarilaf',
  github: 'https://github.com/JMarilaf',
};

// ---------------------------------------------------------------------------
// Español
// ---------------------------------------------------------------------------

const ES: Contenido = {
  perfil: {
    ...CONTACTO,
    titular: 'Desarrollador Full Stack — Angular · Java/Spring · eCommerce',
    resumen:
      'Tres años construyendo y sosteniendo una plataforma de eCommerce que sirve a diez marcas de retail desde una sola base de código. Me tocan los problemas que cruzan capas: un upgrade de plataforma, un login que se cae en producción, SEO que depende del renderizado en servidor.',
    ubicacion: 'Santiago, Chile',
  },

  ui: {
    escribeme: 'Escríbeme',
    elTrabajo: 'El trabajo',
    correo: 'Correo',
    redes: 'Redes',
    casos: 'Casos de trabajo',
    notaCasos:
      'Tres problemas reales de producción, contados completos: el síntoma, el diagnóstico, la decisión y cómo se verificó. Anonimizados por confidencialidad del cliente.',
    proyectos: 'Proyectos propios',
    notaProyectos: 'Construidos y desplegados por mí, corriendo en mi propio servidor.',
    stack: 'Stack',
    volver: '← Volver',
    rol: 'Rol',
    cierre: 'Lo que me llevo',
    notaAnonimato:
      'Caso anonimizado: se omiten el nombre del cliente, las marcas involucradas y cualquier fragmento de código propietario.',
    tema: 'Tema',
    temaClaro: 'Claro',
    temaOscuro: 'Oscuro',
    idioma: 'Idioma',
  },

  stack: [
    { grupo: 'Frontend', items: ['Angular 14–19', 'TypeScript', 'RxJS', 'NgRx', 'SSR / Hydration', 'Spartacus', 'SCSS'] },
    { grupo: 'Backend', items: ['Java', 'Spring', 'Node.js', 'NestJS', 'Python', 'REST', 'GraphQL'] },
    { grupo: 'eCommerce', items: ['SAP Commerce Cloud 2211', 'CCv2', 'OCC API', 'Solr', 'ImpEx', 'Shopify / Liquid'] },
    { grupo: 'Datos e infra', items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Docker', 'Git', 'GA4 / GTM'] },
  ],

  casos: [
    {
      slug: 'incidente-autenticacion',
      titulo: 'El upgrade que dejó a miles de clientes sin poder entrar',
      gancho: 'Un algoritmo de contraseñas removido en un release notes, y un bloqueo por fuerza bruta que castigaba a quien insistía.',
      rol: 'Diagnóstico de causa raíz, diseño e implementación del fix, verificación end-to-end',
      contexto: 'Plataforma eCommerce multimarca — 10 sitios de retail en Chile',
      stack: ['SAP Commerce 2211', 'Java 21', 'Spring Security', 'Groovy', 'SQL'],
      secciones: [
        {
          h: 'El síntoma',
          p: [
            'Tras un upgrade mayor de plataforma, un grupo de clientes dejó de poder iniciar sesión. La contraseña era correcta, pero el login fallaba. El resto de los usuarios entraba sin problemas.',
            'Desde afuera parecía intermitente. No lo era.',
          ],
        },
        {
          h: 'El diagnóstico',
          p: ['Los logs del servidor mostraban el error real:'],
          code: { lang: 'text', texto: "PasswordEncoderNotFoundException:\n  cannot find password encoder for encoding 'pbkdf2'" },
        },
        {
          h: '',
          p: [
            'La versión nueva de la plataforma había removido el algoritmo <strong>pbkdf2</strong> de su fábrica de encoders. Las contraseñas de esos clientes seguían almacenadas con ese algoritmo, así que el sistema ya no tenía forma de validarlas. No era intermitente: fallaba el 100% de las veces para el 100% de esos usuarios.',
            'Una consulta a la base confirmó el tamaño del problema: los logins con <code>pbkdf2</code> eran del orden del <strong>10% de los inicios de sesión diarios</strong>, sostenido mes a mes durante más de un año.',
          ],
        },
        {
          h: 'El agravante que no estaba en el ticket',
          p: ['Revisando la configuración encontré algo que nadie había conectado con el incidente:'],
          code: {
            lang: 'properties',
            texto: 'bruteForceAttackHandler.maxAttempts = 5\nbruteForceAttackHandler.timeFrame   = 300    # 5 minutos\nbruteForceAttackHandler.waitTime    = 3600   # 1 hora',
          },
        },
        {
          h: '',
          p: [
            'Un cliente con contraseña <code>pbkdf2</code> iba a fallar <strong>siempre</strong>. Y alguien seguro de su contraseña reintenta. Al quinto intento quedaba bloqueado una hora, momento en el cual ya ni el flujo de recuperación le servía.',
            'El bug no solo impedía entrar: castigaba a quien insistía.',
          ],
        },
        {
          h: 'La solución',
          p: [
            'Descarté el reseteo masivo de contraseñas: obliga a todos los afectados a pasar por correo, y muchos ni siquiera saben que están afectados.',
            'En cambio implementé un <strong>encoder de compatibilidad</strong>: una clase Java que reimplementa la verificación <code>pbkdf2</code> usando solo JCE estándar, sin dependencias de la plataforma, registrada en la fábrica de encoders junto a los algoritmos vigentes.',
          ],
          code: { lang: 'text', texto: 'factory keys : [*, argon2, scrypt, bcrypt, pbkdf2]\npbkdf2       -> LegacyPbkdf2PasswordEncoder' },
        },
        {
          h: '',
          p: [
            'La pieza clave es que el encoder declara <code>needsUpgrade = true</code>. Con eso, <strong>el primer login exitoso de un cliente legacy re-encripta su contraseña al algoritmo actual de forma transparente</strong>. El usuario no se entera, y el problema se extingue solo a medida que la gente entra.',
          ],
        },
        {
          h: 'La verificación',
          p: ['No lo di por bueno con que compilara:'],
          lista: [
            'Scripts Groovy en consola de administración confirmando que la fábrica resolvía el encoder',
            'Usuario de prueba sembrado con hash pbkdf2 conocido, marcado explícitamente como cuenta de QA',
            'Verificación de los tres estados: contraseña correcta, incorrecta y needsUpgrade',
            'Login real end-to-end en staging, releyendo el estado en una petición HTTP separada para no confiar en la memoria del mismo script',
            'Revisión del arranque de Tomcat buscando conflictos de definición sobre el bean de la fábrica',
          ],
        },
        {
          h: 'El resultado',
          p: [
            'Los logins con <code>pbkdf2</code> cayeron a cero en los días siguientes al despliegue: los clientes legacy quedaron migrados al algoritmo vigente sin ninguna intervención de su parte, sin resetear una sola contraseña y sin comunicado a clientes.',
          ],
        },
      ],
      cierre:
        'El error visible («no puedo entrar») y el error real (un algoritmo removido en un release notes) pueden estar a mucha distancia, y el camino entre ambos son los logs, no las suposiciones. El bloqueo por fuerza bruta, además, no estaba en el ticket: apareció por leer la configuración alrededor del bug, no el bug. La mitad del daño estaba ahí.',
    },
    {
      slug: 'upgrade-multisite',
      titulo: 'Upgrade de JDK 21 y Angular 19 en un multisite de 10 marcas',
      gancho: 'Subir dos plataformas a la vez sin detener al equipo que sigue mergeando a staging todos los días.',
      rol: 'Responsable de la rama de upgrade, de punta a punta',
      contexto: 'Plataforma eCommerce multimarca — SAP Commerce Cloud + Angular/Spartacus con SSR',
      stack: ['Angular 14→19', 'JDK 21', 'Spring', 'TypeScript', 'Express SSR', 'Ant', 'Gradle'],
      secciones: [
        {
          h: 'El problema',
          p: [
            'Una sola base de código sirve a diez marcas de retail, cada una con su theming, su configuración y su catálogo. Había que subir dos plataformas a la vez —el runtime de Java y el framework de frontend— sin detener el desarrollo del resto del equipo.',
            'El escenario clásico: mientras la rama de upgrade avanza, la rama de la que salió se aleja. Y cuanto más tarda, peor es el merge.',
          ],
        },
        {
          h: 'Cómo lo abordé',
          p: [
            '<strong>Integración cronológica, no big-bang.</strong> En lugar de un merge final gigante, traje cerca de <strong>90 releases de staging en orden cronológico</strong>, resolviendo conflictos release por release en TypeScript, Java y SCSS. Es más lento al principio y mucho más barato al final: cada conflicto se resuelve con el contexto de su propio cambio a la vista, no con el de noventa cambios encimados.',
            '<strong>Migración de Angular por capas.</strong> De Angular 14/17 a 19: paso a la API de providers (<code>provideHttpClient</code>, <code>provideClientHydration</code>, <code>provideAppInitializer</code>), reescritura del arranque de SSR sobre Express y ajuste de hydration.',
            '<strong>El SSR fue lo más difícil.</strong> Con hydration, cualquier diferencia entre lo que renderiza el servidor y lo que espera el cliente se manifiesta tarde y de forma confusa. En una revisión post-upgrade detecté que el HTML inicial que entregaba el servidor no era el que correspondía: invisible en el navegador, determinante para SEO y para el primer render.',
            '<strong>Verificar por sitio, no por proyecto.</strong> Un bug que aparecía en una marca y no en otra, con el mismo código, casi siempre significaba que la diferencia estaba en configuración. Mapear qué marca consume qué base de código evitó buscar en el lugar equivocado.',
          ],
        },
        {
          h: 'Lo que salió mal',
          p: [
            'Al llevar la rama a producción apareció el incidente de autenticación del otro caso, y en staging se cayó la navegación de una sola de las marcas. Ninguna de las dos cosas se veía en desarrollo local: las dos dependían de configuración de ambiente.',
            'De ahí salió la práctica que más rendimiento me dio después: <strong>antes de tocar producción, comparar la configuración entre ambientes</strong>, no solo el código. Varios de los problemas del upgrade no estaban en el diff.',
          ],
        },
        {
          h: 'El resultado',
          p: [
            'Los diez sitios en producción sobre JDK 21 y Angular 19, con la deuda técnica de dos versiones mayores saldada. Documenté además una guía reproducible de levantamiento del entorno completo en local, que era una de las barreras de entrada del equipo.',
          ],
        },
      ],
      cierre:
        'En un upgrade de este tamaño el código es la parte fácil. Lo caro es el orden en que integras, la diferencia entre ambientes, y saber qué se rompió por configuración y qué por compilación.',
    },
    {
      slug: 'seo-geo-ssr',
      titulo: 'SEO técnico, GEO y Core Web Vitals sobre Angular SSR',
      gancho: 'En renderizado de servidor, SEO y performance no son dos temas: son el mismo.',
      rol: 'Implementación técnica en frontend y analítica',
      contexto: 'Diez sitios de eCommerce sobre una base Angular con renderizado en servidor',
      stack: ['Angular SSR', 'TypeScript', 'JSON-LD', 'GA4', 'GTM', 'Liquid', 'Lighthouse'],
      secciones: [
        {
          h: 'El problema',
          p: [
            'Un eCommerce vive del tráfico orgánico, y sobre SSR el SEO técnico deja de ser «poner los meta tags». Hay tres cosas que se cruzan: lo que el servidor entrega en el HTML inicial, lo que el cliente hidrata encima, y lo que la analítica alcanza a medir en el medio.',
            'A eso se sumó algo nuevo: cada vez más tráfico llega desde asistentes generativos, que no leen el sitio como lo lee un crawler clásico.',
          ],
        },
        {
          h: 'Lo que implementé',
          p: [
            '<strong>Datos estructurados por tipo de página.</strong> Un módulo Angular propio que emite JSON-LD diferenciado para producto, listado, FAQ, tiendas y breadcrumbs, resuelto en servidor, que es donde el crawler lo necesita.',
            '<strong>GEO / AEO.</strong> Archivos <code>llms.txt</code> y estructuración del contenido pensada para motores generativos, no solo para buscadores. Es la parte más nueva del trabajo y la que menos gente está haciendo hoy.',
            '<strong>Core Web Vitals con método medible.</strong> Carga diferida y asíncrona de fuentes, CSS y scripts de terceros; corrección de CLS en carruseles above-the-fold; depuración de dependencias no usadas. Optimización guiada por medición, no por checklist.',
            '<strong>Analítica en SSR, que es donde se pone difícil.</strong> No existe <code>window</code> en servidor, la hidratación duplica eventos si no la controlas, y el orden de ejecución no es el del navegador. Resolví eventos de compra para usuarios invitados, separación del tracking productivo del de staging, y diagnóstico de errores de User-ID en GA4 tras el upgrade.',
            '<strong>Auditoría antes de ejecutar.</strong> Recibí un informe SEO externo con un backlog priorizado y, antes de tomarlo como plan de trabajo, verifiqué punto por punto qué estaba realmente pendiente. Varias tareas marcadas como críticas ya estaban resueltas; otras estaban mal dimensionadas. El plan real salió de esa verificación, no del informe.',
          ],
        },
      ],
      cierre:
        'Un informe externo es una hipótesis, no un backlog. Verificarlo antes de ejecutarlo ahorró semanas de trabajo mal dirigido.',
    },
  ],

  proyectos: [
    {
      nombre: 'Interviewer',
      descripcion:
        'Preparación para entrevistas técnicas y práctica de inglés, con generación de preguntas asistida por IA. La construí para mí y la mantengo corriendo.',
      stack: ['NestJS', 'Angular SSR', 'PostgreSQL', 'Docker'],
      demo: 'https://api-quiz.javoscript.cl',
      estado: 'En producción',
    },
    {
      nombre: 'Palmares',
      descripcion:
        'PWA para apoderados: centraliza pruebas, actividades y material de clase que hoy se pierde en WhatsApp. Auth por invitación y notificaciones push.',
      stack: ['Angular 18 PWA', 'NestJS', 'Prisma', 'PostgreSQL', 'MinIO'],
      demo: 'https://palmares.javoscript.cl',
      estado: 'En producción',
    },
  ],
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const EN: Contenido = {
  perfil: {
    ...CONTACTO,
    titular: 'Full Stack Developer — Angular · Java/Spring · eCommerce',
    resumen:
      'Three years building and maintaining an eCommerce platform that serves ten retail brands from a single codebase. I work on the problems that cut across layers: a platform upgrade, a login that breaks in production, SEO that depends on server-side rendering.',
    ubicacion: 'Santiago, Chile',
  },

  ui: {
    escribeme: 'Get in touch',
    elTrabajo: 'The work',
    correo: 'Email',
    redes: 'Links',
    casos: 'Case studies',
    notaCasos:
      'Three real production problems, told in full: the symptom, the diagnosis, the decision and how it was verified. Anonymised for client confidentiality.',
    proyectos: 'Side projects',
    notaProyectos: 'Built and deployed by me, running on my own server.',
    stack: 'Stack',
    volver: '← Back',
    rol: 'Role',
    cierre: 'What I took from it',
    notaAnonimato:
      'Anonymised case study: the client name, the brands involved and any proprietary code have been left out.',
    tema: 'Theme',
    temaClaro: 'Light',
    temaOscuro: 'Dark',
    idioma: 'Language',
  },

  stack: [
    { grupo: 'Frontend', items: ['Angular 14–19', 'TypeScript', 'RxJS', 'NgRx', 'SSR / Hydration', 'Spartacus', 'SCSS'] },
    { grupo: 'Backend', items: ['Java', 'Spring', 'Node.js', 'NestJS', 'Python', 'REST', 'GraphQL'] },
    { grupo: 'eCommerce', items: ['SAP Commerce Cloud 2211', 'CCv2', 'OCC API', 'Solr', 'ImpEx', 'Shopify / Liquid'] },
    { grupo: 'Data & infra', items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Docker', 'Git', 'GA4 / GTM'] },
  ],

  casos: [
    {
      slug: 'incidente-autenticacion',
      titulo: 'The upgrade that locked thousands of customers out',
      gancho: 'A password algorithm dropped in a release note, and a brute-force lockout that punished anyone who kept trying.',
      rol: 'Root cause diagnosis, design and implementation of the fix, end-to-end verification',
      contexto: 'Multi-brand eCommerce platform — 10 retail sites in Chile',
      stack: ['SAP Commerce 2211', 'Java 21', 'Spring Security', 'Groovy', 'SQL'],
      secciones: [
        {
          h: 'The symptom',
          p: [
            'After a major platform upgrade, a group of customers could no longer sign in. The password was correct, but the login failed. Everyone else got in without trouble.',
            'From the outside it looked intermittent. It was not.',
          ],
        },
        {
          h: 'The diagnosis',
          p: ['The server logs showed the real error:'],
          code: { lang: 'text', texto: "PasswordEncoderNotFoundException:\n  cannot find password encoder for encoding 'pbkdf2'" },
        },
        {
          h: '',
          p: [
            'The new platform version had removed the <strong>pbkdf2</strong> algorithm from its encoder factory. Those customers’ passwords were still stored with that algorithm, so the system had no way left to validate them. It was not intermittent: it failed 100% of the time for 100% of those users.',
            'A query against the database confirmed the scale: <code>pbkdf2</code> logins accounted for roughly <strong>10% of daily sign-ins</strong>, steady month over month for more than a year.',
          ],
        },
        {
          h: 'The aggravating factor that was not in the ticket',
          p: ['Going through the configuration I found something nobody had connected to the incident:'],
          code: {
            lang: 'properties',
            texto: 'bruteForceAttackHandler.maxAttempts = 5\nbruteForceAttackHandler.timeFrame   = 300    # 5 minutes\nbruteForceAttackHandler.waitTime    = 3600   # 1 hour',
          },
        },
        {
          h: '',
          p: [
            'A customer with a <code>pbkdf2</code> password was going to fail <strong>every single time</strong>. And someone confident in their password retries. On the fifth attempt they were locked out for an hour — at which point even the recovery flow was no use to them.',
            'The bug did not just block people out: it punished the ones who kept trying.',
          ],
        },
        {
          h: 'The fix',
          p: [
            'I ruled out a mass password reset: it forces every affected customer through email, and most of them do not even know they are affected.',
            'Instead I implemented a <strong>compatibility encoder</strong>: a Java class that reimplements <code>pbkdf2</code> verification using only standard JCE, with no platform dependencies, registered in the encoder factory alongside the current algorithms.',
          ],
          code: { lang: 'text', texto: 'factory keys : [*, argon2, scrypt, bcrypt, pbkdf2]\npbkdf2       -> LegacyPbkdf2PasswordEncoder' },
        },
        {
          h: '',
          p: [
            'The key piece is that the encoder declares <code>needsUpgrade = true</code>. With that, <strong>a legacy customer’s first successful login transparently re-encrypts their password to the current algorithm</strong>. The user never notices, and the problem drains away on its own as people sign in.',
          ],
        },
        {
          h: 'The verification',
          p: ['I did not call it done just because it compiled:'],
          lista: [
            'Groovy scripts in the admin console confirming the factory resolved the encoder',
            'A test user seeded with a known pbkdf2 hash, explicitly flagged as a QA account',
            'Verification of all three states: correct password, wrong password, and needsUpgrade',
            'A real end-to-end login on staging, re-reading state in a separate HTTP request so as not to trust the same script’s memory',
            'A review of Tomcat startup looking for conflicting bean definitions on the factory',
          ],
        },
        {
          h: 'The outcome',
          p: [
            '<code>pbkdf2</code> logins dropped to zero within days of the deploy: legacy customers were migrated to the current algorithm with no action on their part, without resetting a single password and without a customer-facing announcement.',
          ],
        },
      ],
      cierre:
        'The visible error ("I can’t log in") and the real error (an algorithm dropped in a release note) can sit very far apart, and the path between them is the logs, not assumptions. The brute-force lockout was not in the ticket either: it surfaced from reading the configuration around the bug rather than the bug itself. Half the damage was there.',
    },
    {
      slug: 'upgrade-multisite',
      titulo: 'Upgrading JDK 21 and Angular 19 across a ten-brand multisite',
      gancho: 'Moving two platforms at once without stopping the team that keeps merging into staging every day.',
      rol: 'Owner of the upgrade branch, end to end',
      contexto: 'Multi-brand eCommerce platform — SAP Commerce Cloud + Angular/Spartacus with SSR',
      stack: ['Angular 14→19', 'JDK 21', 'Spring', 'TypeScript', 'Express SSR', 'Ant', 'Gradle'],
      secciones: [
        {
          h: 'The problem',
          p: [
            'A single codebase serves ten retail brands, each with its own theming, configuration and catalogue. Two platforms had to move at once — the Java runtime and the frontend framework — without stopping the rest of the team from shipping.',
            'The classic scenario: while the upgrade branch moves forward, the branch it came from drifts away. And the longer it takes, the worse the merge gets.',
          ],
        },
        {
          h: 'How I approached it',
          p: [
            '<strong>Chronological integration, not big bang.</strong> Instead of one enormous final merge, I brought in around <strong>90 staging releases in chronological order</strong>, resolving conflicts release by release across TypeScript, Java and SCSS. It is slower at the start and far cheaper at the end: each conflict gets resolved with the context of its own change in view, not with ninety changes piled on top of each other.',
            '<strong>Layered Angular migration.</strong> From Angular 14/17 to 19: the move to the providers API (<code>provideHttpClient</code>, <code>provideClientHydration</code>, <code>provideAppInitializer</code>), a rewrite of the SSR bootstrap on Express, and hydration adjustments.',
            '<strong>SSR was the hard part.</strong> With hydration, any difference between what the server renders and what the client expects shows up late and confusingly. In a post-upgrade review I found that the initial HTML the server was serving was not the right one: invisible in the browser, decisive for SEO and for the first render.',
            '<strong>Verify per site, not per project.</strong> A bug that showed up on one brand and not another, with the same code, almost always meant the difference lived in configuration. Mapping which brand consumes which codebase kept me from looking in the wrong place.',
          ],
        },
        {
          h: 'What went wrong',
          p: [
            'Taking the branch to production surfaced the authentication incident from the other case study, and on staging the navigation of exactly one brand broke. Neither was visible in local development: both depended on environment configuration.',
            'That is where the practice that paid off most afterwards came from: <strong>before touching production, diff the configuration between environments</strong>, not just the code. Several of the upgrade’s problems were not in the diff.',
          ],
        },
        {
          h: 'The outcome',
          p: [
            'All ten sites in production on JDK 21 and Angular 19, with two major versions of technical debt paid off. I also documented a reproducible guide for standing up the full environment locally, which had been one of the team’s barriers to entry.',
          ],
        },
      ],
      cierre:
        'In an upgrade this size the code is the easy part. What costs you is the order you integrate in, the difference between environments, and knowing what broke because of configuration versus what broke at compile time.',
    },
    {
      slug: 'seo-geo-ssr',
      titulo: 'Technical SEO, GEO and Core Web Vitals on Angular SSR',
      gancho: 'With server-side rendering, SEO and performance are not two subjects: they are the same one.',
      rol: 'Technical implementation across frontend and analytics',
      contexto: 'Ten eCommerce sites on a single Angular codebase with server-side rendering',
      stack: ['Angular SSR', 'TypeScript', 'JSON-LD', 'GA4', 'GTM', 'Liquid', 'Lighthouse'],
      secciones: [
        {
          h: 'The problem',
          p: [
            'An eCommerce business lives on organic traffic, and on SSR technical SEO stops being "add the meta tags". Three things intersect: what the server delivers in the initial HTML, what the client hydrates on top of it, and what analytics manages to measure in between.',
            'On top of that came something new: a growing share of traffic arrives from generative assistants, which do not read a site the way a classic crawler does.',
          ],
        },
        {
          h: 'What I implemented',
          p: [
            '<strong>Structured data per page type.</strong> An in-house Angular module that emits distinct JSON-LD for product, listing, FAQ, stores and breadcrumbs, resolved on the server, which is where the crawler needs it.',
            '<strong>GEO / AEO.</strong> <code>llms.txt</code> files and content structured for generative engines, not only for search engines. It is the newest part of the work and the one fewest people are doing today.',
            '<strong>Core Web Vitals with a measurable method.</strong> Deferred and async loading of fonts, CSS and third-party scripts; CLS fixes on above-the-fold carousels; pruning unused dependencies. Optimisation driven by measurement, not by checklist.',
            '<strong>Analytics under SSR, which is where it gets hard.</strong> There is no <code>window</code> on the server, hydration duplicates events unless you control it, and execution order is not the browser’s. I resolved purchase events for guest users, separated production tracking from staging, and diagnosed GA4 User-ID errors after the upgrade.',
            '<strong>Audit before executing.</strong> I received an external SEO report with a prioritised backlog and, before taking it as a work plan, I verified point by point what was actually outstanding. Several items marked critical were already resolved; others were badly sized. The real plan came out of that verification, not out of the report.',
          ],
        },
      ],
      cierre:
        'An external report is a hypothesis, not a backlog. Verifying it before executing it saved weeks of misdirected work.',
    },
  ],

  proyectos: [
    {
      nombre: 'Interviewer',
      descripcion:
        'Technical interview prep and English practice, with AI-assisted question generation. I built it for myself and keep it running.',
      stack: ['NestJS', 'Angular SSR', 'PostgreSQL', 'Docker'],
      demo: 'https://api-quiz.javoscript.cl',
      estado: 'In production',
    },
    {
      nombre: 'Palmares',
      descripcion:
        'A PWA for parents: it centralises tests, activities and class material that currently gets lost in WhatsApp. Invite-only auth and push notifications.',
      stack: ['Angular 18 PWA', 'NestJS', 'Prisma', 'PostgreSQL', 'MinIO'],
      demo: 'https://palmares.javoscript.cl',
      estado: 'In production',
    },
  ],
};

export const CONTENIDO: Record<Idioma, Contenido> = { es: ES, en: EN };
