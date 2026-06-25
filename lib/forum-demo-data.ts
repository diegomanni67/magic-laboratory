import { ForumThread, ForumReply } from './forum-storage'

// Datos demo realistas para Fundamentos Forum - sin métricas falsas
export const fundamentosDemoThreads: ForumThread[] = [
  // Movies
  {
    id: 'demo-1',
    title: '¿Qué opinan de la nueva temporada de Stranger Things?',
    content: 'Acabo de terminar la temporada 4 y estoy en shock. ¿Alguien más siente que la serie está tomando un rumbo mucho más oscuro? Me encantó el desarrollo de los personajes, especialmente Eleven y Max. ¿Qué fue su momento favorito?',
    author: 'Ana Martínez',
    authorEmail: 'ana@example.com',
    authorRole: 'Student',
    category: 'movies',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 45,
    pinned: false,
    tags: ['stranger-things', 'netflix', 'series']
  },
  {
    id: 'demo-2',
    title: 'Recomendaciones de películas independientes de 2024',
    content: 'Busco películas indie que hayan salido este año. Me gusta el cine de autor, dramas psicológicos y anything con buena cinematografía. Últimamente vi "Past Lives" y me encantó. ¿Alguna sugerencia?',
    author: 'Diego Silva',
    authorEmail: 'diego@example.com',
    authorRole: 'Student',
    category: 'movies',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 32,
    pinned: false,
    tags: ['independent', 'recommendations', '2024']
  },
  
  // Music
  {
    id: 'demo-3',
    title: 'Radiohead - ¿Cuál es su mejor álbum?',
    content: 'Tengo un debate con un amigo. Él dice que OK Computer es indiscutiblemente el mejor, pero yo creo que In Rainbows tiene una cohesión perfecta. ¿Qué opinan ustedes? ¿Kid A entra en la conversación?',
    author: 'Diego Silva',
    authorEmail: 'diego@example.com',
    authorRole: 'Student',
    category: 'music',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    replies: 4,
    views: 67,
    pinned: true,
    tags: ['radiohead', 'debate', 'albums']
  },
  {
    id: 'demo-4',
    title: 'Busco bandas similares a The Strokes',
    content: 'Me encanta el revival del garage rock de los 2000s. Aparte de The Strokes, ya escucho a The Velvet Underground, The Hives y Yeah Yeah Yeahs. ¿Qué más me recomiendan? Prefiero algo con esa misma energía cruda.',
    author: 'Carlos Rodríguez',
    authorEmail: 'carlos@example.com',
    authorRole: 'Student',
    category: 'music',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 38,
    pinned: false,
    tags: ['garage-rock', 'recommendations', 'the-strokes']
  },

  // Travels
  {
    id: 'demo-5',
    title: 'Mi experiencia viajando solo por Japón',
    content: 'El año pasado hice mi primer viaje solo a Japón y fue una experiencia transformadora. Estuve 3 semanas: Tokio, Kioto, Osaka y Hiroshima. Si alguien está planeando algo similar, puedo compartir tips sobre el JR Pass, dónde quedarse y qué evitar. ¡Fue increíble!',
    author: 'Martín Gómez',
    authorEmail: 'martin@example.com',
    authorRole: 'Student',
    category: 'travels',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 días atrás
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 52,
    pinned: false,
    tags: ['japan', 'solo-travel', 'asia']
  },
  {
    id: 'demo-6',
    title: '¿Europa en verano o primavera?',
    content: 'Estoy planeando mi primer viaje a Europa para el año que viene. No puedo decidir si ir en julio/agosto o abril/mayo. Me gustaría evitar multitudes pero también tener buen clima. ¿Alguien ha viajado en ambas épocas que pueda comparar?',
    author: 'Sofía Torres',
    authorEmail: 'sofia@example.com',
    authorRole: 'Student',
    category: 'travels',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 días atrás
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 41,
    pinned: false,
    tags: ['europe', 'travel-tips', 'seasons']
  },

  // Food
  {
    id: 'demo-7',
    title: 'Receta de pasta casera - Tips de abuela',
    content: 'Después de años intentando, finalmente logré hacer pasta fresca como mi abuela. El secreto está en no usar demasiada harina en la mesa y dejar la masa reposar 30 minutos. ¿Alguien más hace su propia pasta? Compartamos técnicas.',
    author: 'Lucía Fernández',
    authorEmail: 'lucia@example.com',
    authorRole: 'Student',
    category: 'food',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 29,
    pinned: false,
    tags: ['pasta', 'homemade', 'cooking']
  },
  {
    id: 'demo-8',
    title: 'Los mejores restaurantes de Buenos Aires (según mi experiencia)',
    content: 'He vivido en BA toda mi vida y he probado de todo. Desde parrillas clásicas hasta cocina de autor. Mi top 3 actual: Don Julio, Tegui y Chila. ¿Ustedes cuáles recomiendan? Busco descubrir nuevos lugares.',
    author: 'Roberto Silva',
    authorEmail: 'roberto@example.com',
    authorRole: 'Student',
    category: 'food',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    replies: 4,
    views: 58,
    pinned: true,
    tags: ['restaurants', 'buenos-aires', 'foodie']
  },

  // Gaming
  {
    id: 'demo-9',
    title: 'Baldur\'s Gate 3 - ¿Vale la pena si no conocés la saga?',
    content: 'Nunca jugué los anteriores Baldur\'s Gate pero todo el mundo habla maravillas de este. Me gusta RPGs como The Witcher 3 y Divinity. ¿Es necesario conocer la lore o puedo entrar directo? ¿Cuántas horas requiere aproximadamente?',
    author: 'Carlos Rodríguez',
    authorEmail: 'carlos@example.com',
    authorRole: 'Student',
    category: 'gaming',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 44,
    pinned: false,
    tags: ['bg3', 'rpg', 'recommendations']
  },
  {
    id: 'demo-10',
    title: 'Armé mi primer PC gamer - Guía de componentes',
    content: 'Después de meses de investigación, finalmente armé mi PC. Usé un RTX 4070, Ryzen 7 7800X3D, 32GB RAM. Si alguien está pensando en armar la suya, puedo compartir mi experiencia con compatibilidad, presupuesto y dónde comprar piezas.',
    author: 'Valentina Torres',
    authorEmail: 'valentina@example.com',
    authorRole: 'Student',
    category: 'gaming',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 36,
    pinned: false,
    tags: ['pc-building', 'hardware', 'tech']
  },

  // Sports
  {
    id: 'demo-11',
    title: 'Entrenamiento para maratón - Primeros 3 meses',
    content: 'Empecé a entrenar para mi primera maratón. Estoy en el mes 3 y ya puedo correr 15km sin parar. ¿Alguien más está entrenando? Compartamos rutinas, consejos sobre nutrición y cómo evitar lesiones. Es más difícil de lo que pensaba.',
    author: 'Martín Gómez',
    authorEmail: 'martin@example.com',
    authorRole: 'Student',
    category: 'sports',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 33,
    pinned: false,
    tags: ['running', 'marathon', 'training']
  },
  {
    id: 'demo-12',
    title: '¿Fútbol o fútbol americano? Debate eterno',
    content: 'Siendo argentino, obviamente amo el fútbol. Pero últimamente me estoy metiendo en el NFL y es fascinante. La estrategia es completamente distinta. ¿Alguien sigue ambos? ¿Cuál prefieren y por qué?',
    author: 'Martín Gómez',
    authorEmail: 'martin@example.com',
    authorRole: 'Student',
    category: 'sports',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 días atrás
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    replies: 4,
    views: 61,
    pinned: true,
    tags: ['football', 'nfl', 'debate']
  },

  // Daily Life
  {
    id: 'demo-13',
    title: '¿Cómo mantienen el equilibrio trabajo-vida personal?',
    content: 'Últimamente me siento agobiado con el trabajo y los estudios. Intento tener hobbies pero no me da el tiempo. ¿Ustedes cómo manejan esto? ¿Tienen alguna rutina o técnica que les funcione bien?',
    author: 'Ana Martínez',
    authorEmail: 'ana@example.com',
    authorRole: 'Student',
    category: 'daily-life',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 47,
    pinned: false,
    tags: ['work-life-balance', 'mental-health', 'advice']
  },
  {
    id: 'demo-14',
    title: 'Pequeñas cosas que te hacen feliz durante el día',
    content: 'Quería hacer un hilo positivo. ¿Cuáles son esas pequeñas cosas del día a día que te alegran? Yo: café recién hecho, un buen libro, atardeceres hermosos y mensajes de amigos. Compartamos momentos felices 😊',
    author: 'Sofía Torres',
    authorEmail: 'sofia@example.com',
    authorRole: 'Student',
    category: 'daily-life',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 días atrás
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    replies: 5,
    views: 54,
    pinned: false,
    tags: ['positive', 'happiness', 'daily-life']
  }
]

export const fundamentosDemoReplies: ForumReply[] = [
  // Replies for Stranger Things thread
  {
    id: 'reply-1',
    threadId: 'demo-1',
    content: 'Totalmente de acuerdo. La escena de Vecna en el cuarto de Max fue aterradora, pero también muy bien hecha. Creo que el tono más oscuro le sienta bien a la serie.',
    author: 'Sofía Torres',
    authorEmail: 'sofia@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-2',
    threadId: 'demo-1',
    content: 'Mi momento favorito fue cuando Eleven descubre su pasado. El desarrollo visual de ese laboratorio fue increíble. Los Duffer brothers realmente mejoraron la producción.',
    author: 'Carlos Rodríguez',
    authorEmail: 'carlos@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'reply-3',
    threadId: 'demo-1',
    content: '¿Creen que van a poder mantener este nivel para la temporada final? Me preocupa que se vuelva demasiado predecible.',
    author: 'Diego Silva',
    authorEmail: 'diego@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: undefined
  },

  // Replies for Radiohead thread
  {
    id: 'reply-4',
    threadId: 'demo-3',
    content: 'OK Computer es el mejor conceptualmente, pero In Rainbows es más disfrutable de principio a fin. Creo que depende del mood. Para melancolía: OK Computer. Para felicidad: In Rainbows.',
    author: 'Ana Martínez',
    authorEmail: 'ana@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    likes: 3,
    parentId: undefined
  },
  {
    id: 'reply-5',
    threadId: 'demo-3',
    content: 'Kid A es el más experimental y el que más influyó en la música posterior. Pero si hablamos de "mejor álbum" como experiencia completa, voto por In Rainbows.',
    author: 'Valentina Torres',
    authorEmail: 'valentina@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-6',
    threadId: 'demo-3',
    content: 'The Bends es subestimado. Tiene canciones que son pura perfección como "Fake Plastic Trees" y "Street Spirit". Para mí es su álbum más accesible.',
    author: 'Martín Gómez',
    authorEmail: 'martin@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'reply-7',
    threadId: 'demo-3',
    content: '@Ana totalmente de acuerdo. In Rainges es el álbum que pongo cuando necesito animarme. "15 Step" y "Bodysnatchers" son himnos.',
    author: 'Carlos Rodríguez',
    authorEmail: 'carlos@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    likes: 0,
    parentId: 'reply-4'
  },

  // Replies for Japan travel
  {
    id: 'reply-8',
    threadId: 'demo-5',
    content: '¡Qué envidia! Estoy planeando mi viaje para el próximo año. ¿El JR Pass realmente vale la pena? He leído opiniones encontradas.',
    author: 'Lucía Fernández',
    authorEmail: 'lucia@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'reply-9',
    threadId: 'demo-5',
    content: 'El JR Pass vale la pena solo si vas a hacer viajes largos entre ciudades. Para solo Tokio-Kioto-Osaka, quizás conviene comprar tickets individuales. Calculá bien antes.',
    author: 'Roberto Silva',
    authorEmail: 'roberto@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-10',
    threadId: 'demo-5',
    content: '@Lucía yo hice el cálculo y me salió que el JR Pass de 7 días se pagaba solo con Tokyo-Kyoto ida y vuelta. Además incluye el Shinkansen, que es una experiencia en sí mismo.',
    author: 'Martín Gómez',
    authorEmail: 'martin@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: 'reply-8'
  },

  // Replies for pasta recipe
  {
    id: 'reply-11',
    threadId: 'demo-7',
    content: '¡Bravo! La pasta fresca es otra cosa. Yo uso harina 00 y dejo reposar 1 hora en la heladera. La textura queda mucho mejor.',
    author: 'Roberto Silva',
    authorEmail: 'roberto@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-12',
    threadId: 'demo-7',
    content: '¿Hacés fettuccine o tagliatelle? Yo siempre termino con fettuccine porque es más fácil, pero quiero intentar otras formas.',
    author: 'Ana Martínez',
    authorEmail: 'ana@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: undefined
  },
  {
    id: 'reply-13',
    threadId: 'demo-7',
    content: '@Ana yo empecé con fettuccine y ahora hago ravioli. Es más trabajo pero vale la pena. Lo difícil es cerrarlos bien para que no se abran al hervir.',
    author: 'Lucía Fernández',
    authorEmail: 'lucia@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    likes: 1,
    parentId: 'reply-12'
  },

  // Replies for BG3
  {
    id: 'reply-14',
    threadId: 'demo-9',
    content: 'No es necesario conocer la saga. El juego te introduce al mundo perfectamente. Yo nunca jugué los anteriores y me volví adicto. Son como 100-150 horas para una primera partida completa.',
    author: 'Valentina Torres',
    authorEmail: 'valentina@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    likes: 3,
    parentId: undefined
  },
  {
    id: 'reply-15',
    threadId: 'demo-9',
    content: 'Si te gustó Divinity, vas a amar BG3. Es el mismo estudio pero con mucho más presupuesto y una historia más profunda. La libertad de elección es increíble.',
    author: 'Diego Silva',
    authorEmail: 'diego@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-16',
    threadId: 'demo-9',
    content: 'Mi único consejo: no te apresures. Hay tanto contenido que si vas rápido te perdés detalles. Explorá todo, hablá con todos. Es un juego para disfrutar.',
    author: 'Carlos Rodríguez',
    authorEmail: 'carlos@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },

  // Replies for marathon training
  {
    id: 'reply-17',
    threadId: 'demo-11',
    content: '¡Felicitaciones! 15km es un gran hito. Yo estoy en el mes 4 y ya hice 21km una vez. El secreto es la constancia, no la velocidad. Y estirar mucho después.',
    author: 'Roberto Silva',
    authorEmail: 'roberto@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-18',
    threadId: 'demo-11',
    content: 'Para nutrición, probá comer algo ligero 2 horas antes de correr. Yo uso banana con miel. Y durante la carrera, geles cada 45 minutos.',
    author: 'Martín Gómez',
    authorEmail: 'martin@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },

  // Replies for work-life balance
  {
    id: 'reply-19',
    threadId: 'demo-13',
    content: 'Lo que me funciona es la regla del "no". Aprendí a decir no a cosas que no me aportan valor. También reservo 1 hora por día para mí, sin celular ni trabajo.',
    author: 'Valentina Torres',
    authorEmail: 'valentina@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 3,
    parentId: undefined
  },
  {
    id: 'reply-20',
    threadId: 'demo-13',
    content: 'Yo uso la técnica Pomodoro para estudiar. 25 minutos de foco, 5 de descanso. Me ayuda a no sentirme abrumado y ver progreso.',
    author: 'Carlos Rodríguez',
    authorEmail: 'carlos@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-21',
    threadId: 'demo-13',
    content: 'A veces el problema es que nos exigimos demasiado. Está bien no ser productivo 100% del tiempo. El descanso también es productividad.',
    author: 'Sofía Torres',
    authorEmail: 'sofia@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },

  // Replies for happiness thread
  {
    id: 'reply-22',
    threadId: 'demo-14',
    content: 'Para mí: caminar sin destino, encontrar música nueva que me encanta, y las llamadas largas con amigos. Las cosas simples son las mejores.',
    author: 'Diego Silva',
    authorEmail: 'diego@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-23',
    threadId: 'demo-14',
    content: '¡Me encanta este hilo! Mis cosas: cuando el sol sale y ilumina todo, el olor a lluvia, y terminar un libro que me encantó.',
    author: 'Lucía Fernández',
    authorEmail: 'lucia@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'reply-24',
    threadId: 'demo-14',
    content: 'El momento antes de dormir cuando todo está en silencio. Y cuando alguien me recuerda algo que dije hace tiempo, significa que me escucharon.',
    author: 'Ana Martínez',
    authorEmail: 'ana@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'reply-25',
    threadId: 'demo-14',
    content: 'Cuando cocino algo y sale perfecto la primera vez. Y los días de lluvia donde no hay nada mejor que quedarse en casa con una serie.',
    author: 'Martín Gómez',
    authorEmail: 'martin@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'reply-26',
    threadId: 'demo-14',
    content: 'Encontrar un café con buena música y ambiente. Es mi pequeño ritual de los fines de semana.',
    author: 'Roberto Silva',
    authorEmail: 'roberto@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: undefined
  }
]

// Datos demo realistas para Maestria Forum - sin métricas falsas
export const maestriaDemoThreads: ForumThread[] = [
  // Movies
  {
    id: 'studio-demo-1',
    title: 'Best movies for learning business English',
    content: 'I recommend "The Social Network" and "The Wolf of Wall Street" for business vocabulary. The dialogue is fast but very realistic for corporate environments.',
    author: 'James Chen',
    authorEmail: 'james@example.com',
    authorRole: 'Student',
    category: 'movies',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 45,
    pinned: true,
    tags: ['business-english', 'movies', 'vocabulary']
  },
  {
    id: 'studio-demo-2',
    title: 'Documentaries about entrepreneurship',
    content: 'Looking for documentaries that showcase real business scenarios. "Startup.com" and "The Founder" are great examples. Any other suggestions?',
    author: 'Laura Martinez',
    authorEmail: 'laura@example.com',
    authorRole: 'Student',
    category: 'movies',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 32,
    pinned: false,
    tags: ['documentaries', 'entrepreneurship', 'business']
  },

  // Music
  {
    id: 'studio-demo-3',
    title: 'Music for focused work sessions',
    content: 'What music do you listen to while working on complex projects? I find lo-fi beats and classical music help me concentrate better.',
    author: 'David Kim',
    authorEmail: 'david@example.com',
    authorRole: 'Student',
    category: 'music',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    replies: 4,
    views: 67,
    pinned: true,
    tags: ['productivity', 'music', 'focus']
  },
  {
    id: 'studio-demo-4',
    title: 'Podcasts for professional development',
    content: 'I listen to "How I Built This" and "The Tim Ferriss Show" for business insights. What podcasts do you recommend for career growth?',
    author: 'Sarah Johnson',
    authorEmail: 'sarah@example.com',
    authorRole: 'Student',
    category: 'music',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 38,
    pinned: false,
    tags: ['podcasts', 'career', 'business']
  },

  // Travels
  {
    id: 'studio-demo-5',
    title: 'Business travel tips and tricks',
    content: 'After 50+ business trips, I\'ve learned to always pack a universal adapter, carry-on only, and keep digital copies of important documents.',
    author: 'Michael Brown',
    authorEmail: 'michael@example.com',
    authorRole: 'Student',
    category: 'travels',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 52,
    pinned: false,
    tags: ['business-travel', 'tips', 'productivity']
  },
  {
    id: 'studio-demo-6',
    title: 'Best cities for remote work',
    content: 'I\'m considering moving to a city with good internet infrastructure and coworking spaces. Currently looking at Lisbon, Bali, and Medellín.',
    author: 'Emma Wilson',
    authorEmail: 'emma@example.com',
    authorRole: 'Student',
    category: 'travels',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 41,
    pinned: false,
    tags: ['remote-work', 'digital-nomad', 'travel']
  },

  // Food
  {
    id: 'studio-demo-7',
    title: 'Networking over lunch - restaurant recommendations',
    content: 'What are your go-to restaurants for business lunches? I prefer quiet places with good service and moderate noise levels.',
    author: 'Robert Chen',
    authorEmail: 'robert@example.com',
    authorRole: 'Student',
    category: 'food',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 29,
    pinned: false,
    tags: ['networking', 'business-lunch', 'restaurants']
  },
  {
    id: 'studio-demo-8',
    title: 'Healthy meal prep for busy professionals',
    content: 'I spend Sundays meal prepping for the week. This saves me hours and keeps me eating healthy despite my busy schedule.',
    author: 'Jennifer Lee',
    authorEmail: 'jennifer@example.com',
    authorRole: 'Student',
    category: 'food',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    replies: 4,
    views: 58,
    pinned: true,
    tags: ['meal-prep', 'health', 'productivity']
  },

  // Gaming
  {
    id: 'studio-demo-9',
    title: 'Gaming for stress relief after work',
    content: 'After long work days, I play relaxing games like Stardew Valley or Animal Crossing. What games help you decompress?',
    author: 'Alex Turner',
    authorEmail: 'alex@example.com',
    authorRole: 'Student',
    category: 'gaming',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 44,
    pinned: false,
    tags: ['stress-relief', 'gaming', 'work-life-balance']
  },
  {
    id: 'studio-demo-10',
    title: 'VR for professional training',
    content: 'Our company is implementing VR training programs. Has anyone used VR for professional development? What were your experiences?',
    author: 'Chris Park',
    authorEmail: 'chris@example.com',
    authorRole: 'Student',
    category: 'gaming',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 36,
    pinned: false,
    tags: ['vr', 'training', 'technology']
  },

  // Sports
  {
    id: 'studio-demo-11',
    title: 'Corporate sports leagues',
    content: 'My company has a volleyball league. It\'s great for team building and networking across departments. Does your company have sports activities?',
    author: 'Daniel Garcia',
    authorEmail: 'daniel@example.com',
    authorRole: 'Student',
    category: 'sports',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    replies: 2,
    views: 33,
    pinned: false,
    tags: ['corporate-sports', 'team-building', 'networking']
  },
  {
    id: 'studio-demo-12',
    title: 'Morning workout routine for professionals',
    content: 'I wake up at 5:30 AM for a 30-minute workout before work. It gives me energy and clarity for the day. What\'s your routine?',
    author: 'Maria Santos',
    authorEmail: 'maria@example.com',
    authorRole: 'Student',
    category: 'sports',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    replies: 4,
    views: 61,
    pinned: true,
    tags: ['morning-routine', 'fitness', 'productivity']
  },

  // Daily Life
  {
    id: 'studio-demo-13',
    title: 'Time-blocking technique for productivity',
    content: 'I use time-blocking to manage my schedule. Each day is divided into 2-hour focused work blocks with short breaks in between.',
    author: 'Tom Wilson',
    authorEmail: 'tom@example.com',
    authorRole: 'Student',
    category: 'daily-life',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    replies: 3,
    views: 47,
    pinned: false,
    tags: ['time-management', 'productivity', 'work']
  },
  {
    id: 'studio-demo-14',
    title: 'Building professional relationships remotely',
    content: 'Working remotely makes it harder to build relationships. I schedule virtual coffee chats with colleagues. What strategies do you use?',
    author: 'Lisa Anderson',
    authorEmail: 'lisa@example.com',
    authorRole: 'Student',
    category: 'daily-life',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    replies: 5,
    views: 54,
    pinned: false,
    tags: ['remote-work', 'relationships', 'networking']
  }
]

export const maestriaDemoReplies: ForumReply[] = [
  // Replies for business movies thread
  {
    id: 'studio-reply-1',
    threadId: 'studio-demo-1',
    content: 'Great suggestions! I also recommend "The Pursuit of Happyness" for vocabulary about persistence and entrepreneurship.',
    author: 'Sarah Johnson',
    authorEmail: 'sarah@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-2',
    threadId: 'studio-demo-1',
    content: 'The dialogue in "The Social Network" is incredibly fast. I had to watch with subtitles first to catch everything.',
    author: 'David Kim',
    authorEmail: 'david@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'studio-reply-3',
    threadId: 'studio-demo-1',
    content: 'Don\'t forget "Moneyball" for sports business vocabulary and analytics terminology.',
    author: 'Michael Brown',
    authorEmail: 'michael@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: undefined
  },

  // Replies for music for work thread
  {
    id: 'studio-reply-4',
    threadId: 'studio-demo-3',
    content: 'I prefer instrumental music. Anything with lyrics distracts me. Video game soundtracks are perfect - designed to focus without being distracting.',
    author: 'Emma Wilson',
    authorEmail: 'emma@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    likes: 3,
    parentId: undefined
  },
  {
    id: 'studio-reply-5',
    threadId: 'studio-demo-3',
    content: 'White noise or nature sounds work best for me. Rain sounds or cafe ambience help me concentrate.',
    author: 'Robert Chen',
    authorEmail: 'robert@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-6',
    threadId: 'studio-demo-3',
    content: 'I can\'t work without music. Jazz playlists or ambient electronic music keep me in the zone for hours.',
    author: 'Jennifer Lee',
    authorEmail: 'jennifer@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'studio-reply-7',
    threadId: 'studio-demo-3',
    content: '@Emma I agree about video game soundtracks! The Civilization VI soundtrack is my go-to for deep work.',
    author: 'Alex Turner',
    authorEmail: 'alex@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    likes: 0,
    parentId: 'studio-reply-4'
  },

  // Replies for business travel
  {
    id: 'studio-reply-8',
    threadId: 'studio-demo-5',
    content: 'Great tips! I\'d add: always have a backup charger, download offline maps, and learn basic phrases in the local language.',
    author: 'Laura Martinez',
    authorEmail: 'laura@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'studio-reply-9',
    threadId: 'studio-demo-5',
    content: 'I always pack a portable WiFi hotspot. Hotel internet can be unreliable, and I need to stay connected for work.',
    author: 'Chris Park',
    authorEmail: 'chris@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-10',
    threadId: 'studio-demo-5',
    content: '@Laura the offline maps tip is crucial! Google Maps offline feature has saved me multiple times in areas with poor reception.',
    author: 'Daniel Garcia',
    authorEmail: 'daniel@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: 'studio-reply-8'
  },

  // Replies for healthy meal prep
  {
    id: 'studio-reply-11',
    threadId: 'studio-demo-7',
    content: 'I meal prep too! My strategy is cook once, eat twice. Make double portions and freeze half for later in the week.',
    author: 'Tom Wilson',
    authorEmail: 'tom@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-12',
    threadId: 'studio-demo-7',
    content: 'For business lunches, I recommend quiet hotel restaurants or private dining rooms. They\'re designed for professional meetings.',
    author: 'Lisa Anderson',
    authorEmail: 'lisa@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: undefined
  },
  {
    id: 'studio-reply-13',
    threadId: 'studio-demo-7',
    content: '@Tom great idea! I do something similar with batch cooking grains and proteins, then mix and match throughout the week.',
    author: 'Jennifer Lee',
    authorEmail: 'jennifer@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    likes: 1,
    parentId: 'studio-reply-11'
  },

  // Replies for VR training
  {
    id: 'studio-reply-14',
    threadId: 'studio-demo-9',
    content: 'Our company uses VR for safety training. It\'s much more effective than watching videos because you\'re actually in the simulation.',
    author: 'Chris Park',
    authorEmail: 'chris@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    likes: 3,
    parentId: undefined
  },
  {
    id: 'studio-reply-15',
    threadId: 'studio-demo-9',
    content: 'VR training is expensive but the retention rate is much higher. It\'s worth the investment for critical skills.',
    author: 'James Chen',
    authorEmail: 'james@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-16',
    threadId: 'studio-demo-9',
    content: 'We use VR for customer service training. Employees practice handling difficult situations in a safe environment before facing real customers.',
    author: 'Sarah Johnson',
    authorEmail: 'sarah@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },

  // Replies for corporate sports
  {
    id: 'studio-reply-17',
    threadId: 'studio-demo-11',
    content: 'Our company has running club and yoga sessions. It\'s a great way to meet people from different departments.',
    author: 'Maria Santos',
    authorEmail: 'maria@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-18',
    threadId: 'studio-demo-11',
    content: 'Sports activities improve company culture significantly. People are more collaborative when they\'ve bonded outside work.',
    author: 'Michael Brown',
    authorEmail: 'michael@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },

  // Replies for time management
  {
    id: 'studio-reply-19',
    threadId: 'studio-demo-13',
    content: 'I use the Pomodoro technique combined with time-blocking. 25-minute focused sprints within each 2-hour block.',
    author: 'Emma Wilson',
    authorEmail: 'emma@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 3,
    parentId: undefined
  },
  {
    id: 'studio-reply-20',
    threadId: 'studio-demo-13',
    content: 'Time-blocking changed my productivity. I schedule everything, including breaks and email checking time.',
    author: 'David Kim',
    authorEmail: 'david@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-21',
    threadId: 'studio-demo-13',
    content: 'The key is protecting your blocks. Say no to meetings during your focus time. Your calendar should reflect your priorities.',
    author: 'Laura Martinez',
    authorEmail: 'laura@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },

  // Replies for remote relationships
  {
    id: 'studio-reply-22',
    threadId: 'studio-demo-14',
    content: 'Virtual coffee chats are excellent! I also participate in online team-building activities and virtual happy hours.',
    author: 'Robert Chen',
    authorEmail: 'robert@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-23',
    threadId: 'studio-demo-14',
    content: 'I use Slack channels for casual conversations. Having a #random channel helps maintain social connections.',
    author: 'Jennifer Lee',
    authorEmail: 'jennifer@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'studio-reply-24',
    threadId: 'studio-demo-14',
    content: 'Scheduled video calls for non-work topics help. I have weekly check-ins with my team where we discuss personal updates.',
    author: 'Alex Turner',
    authorEmail: 'alex@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    likes: 2,
    parentId: undefined
  },
  {
    id: 'studio-reply-25',
    threadId: 'studio-demo-14',
    content: 'Don\'t underestimate the power of quick messages. A simple "how was your weekend?" goes a long way in building relationships.',
    author: 'Sarah Johnson',
    authorEmail: 'sarah@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 1,
    parentId: undefined
  },
  {
    id: 'studio-reply-26',
    threadId: 'studio-demo-14',
    content: 'I joined online communities related to my industry. Meeting professionals outside my company has expanded my network significantly.',
    author: 'Tom Wilson',
    authorEmail: 'tom@example.com',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    likes: 0,
    parentId: undefined
  }
]

// Función para inicializar datos demo en localStorage
export const initializeDemoData = (forumType: 'fundamentos' | 'maestria' = 'fundamentos') => {
  if (typeof window === 'undefined') return

  const threadsKey = `forum_threads_${forumType}`
  const repliesKey = `forum_replies_${forumType}`

  const demoThreads = forumType === 'fundamentos' ? fundamentosDemoThreads : maestriaDemoThreads
  const demoReplies = forumType === 'fundamentos' ? fundamentosDemoReplies : maestriaDemoReplies

  try {
    // Serializar fechas como strings ISO para localStorage
    const threadsToSave = demoThreads.map((thread: ForumThread) => ({
      ...thread,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString()
    }))

    const repliesToSave = demoReplies.map((reply: ForumReply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString()
    }))

    // Siempre cargar datos demo para asegurar que los hilos estén disponibles
    localStorage.setItem(threadsKey, JSON.stringify(threadsToSave))
    localStorage.setItem(repliesKey, JSON.stringify(repliesToSave))
    console.log(`Demo data initialized for ${forumType}:`, {
      threads: threadsToSave.length,
      replies: repliesToSave.length
    })
  } catch (error) {
    console.error('Error initializing demo data:', error)
  }
}
