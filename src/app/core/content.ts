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

export const PERFIL = {
  nombre: 'Javier Marilaf',
  titular: 'Desarrollador Full Stack — Angular · Java/Spring · eCommerce',
  resumen:
    'Tres años construyendo y sosteniendo una plataforma de eCommerce que sirve a diez marcas de retail desde una sola base de código. Me tocan los problemas que cruzan capas: un upgrade de plataforma, un login que se cae en producción, SEO que depende del renderizado en servidor.',
  ubicacion: 'Santiago, Chile',
  email: 'javiermarilaf@gmail.com',
  linkedin: 'https://linkedin.com/in/jmarilaf',
  github: 'https://github.com/JMarilaf',
};

export const STACK = [
  { grupo: 'Frontend', items: ['Angular 14–19', 'TypeScript', 'RxJS', 'NgRx', 'SSR / Hydration', 'Spartacus', 'SCSS'] },
  { grupo: 'Backend', items: ['Java', 'Spring', 'Node.js', 'NestJS', 'Python', 'REST', 'GraphQL'] },
  { grupo: 'eCommerce', items: ['SAP Commerce Cloud 2211', 'CCv2', 'OCC API', 'Solr', 'ImpEx', 'Shopify / Liquid'] },
  { grupo: 'Datos e infra', items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Docker', 'Git', 'GA4 / GTM'] },
];

export const CASOS: Caso[] = [
  {
    slug: 'incidente-autenticacion',
    titulo: 'El upgrade que dejó a miles de clientes sin poder entrar',
    gancho: 'Un algoritmo de contraseñas removido en un release notes, y un bloqueo por fuerza bruta que castigaba a quien insistía.',
    rol: 'Diagnóstico de causa raíz, diseño e implementación del fix, verificación end-to-end',
    contexto: 'Plataforma eCommerce multimarca — 10 sitios de retail en Chile',
    stack: ['Java 21', 'Spring', 'SAP Commerce 2211', 'Groovy', 'SQL'],
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
    stack: ['Java 21', 'Spring', 'Angular 14→19', 'TypeScript', 'Express SSR', 'Ant', 'Gradle'],
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
];

export const PROYECTOS: Proyecto[] = [
  {
    nombre: 'Interviewer',
    descripcion:
      'Plataforma de preparación para entrevistas técnicas y práctica de inglés, con generación de preguntas asistida por IA y rondas de vocabulario. La construí para mi propia preparación y la mantengo en producción.',
    stack: ['NestJS', 'Angular SSR', 'PostgreSQL', 'Docker'],
    demo: 'https://api-quiz.javoscript.cl',
    estado: 'En producción',
  },
  {
    nombre: 'Palmares',
    descripcion:
      'PWA de gestión escolar para apoderados: centraliza pruebas, actividades y material de clase que hoy se pierde en WhatsApp. Auth por invitación, notificaciones push y optimización de imágenes en cliente y servidor.',
    stack: ['NestJS', 'Prisma', 'Angular 18 PWA', 'PostgreSQL', 'MinIO'],
    demo: 'https://palmares.javoscript.cl',
    estado: 'En producción',
  },
];
