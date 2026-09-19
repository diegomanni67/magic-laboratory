export const CONTENT_VERSION = "0.3.0";

export const THEMES = {
  clasico: {
    id: "clasico",
    title: "Clásico",
    emoji: "🎉",
    age18: false,
    description: "Anécdotas, secretos, mentiras, recuerdos y votaciones sobre el grupo.",
    tagline: "La versión que funciona con casi cualquier grupo."
  },
  profundo: {
    id: "profundo",
    title: "Profundo",
    emoji: "🧠",
    age18: false,
    description: "Valores, decisiones, miedos, sueños y preguntas para conocerse de verdad.",
    tagline: "Menos pavadas. Más descubrir cómo piensa cada uno."
  },
  picante18: {
    id: "picante18",
    title: "Picante 18+",
    emoji: "🌶️",
    age18: true,
    description: "Atracción, citas, intimidad, confesiones y situaciones incómodamente divertidas.",
    tagline: "Solo para adultos y grupos con confianza."
  },
  parejas: {
    id: "parejas",
    title: "Parejas",
    emoji: "❤️",
    age18: false,
    description: "Recuerdos, gustos, decisiones y cuánto conoce cada persona a su pareja.",
    tagline: "Para jugar en pareja o con varias parejas."
  },
  cumple: {
    id: "cumple",
    title: "Cumpleaños",
    emoji: "🎂",
    age18: false,
    description: "Todo gira alrededor del cumpleañero: historias, recuerdos y cuánto lo conocen.",
    tagline: "El homenaje puede convertirse en escrache."
  },
  caos: {
    id: "caos",
    title: "Caos",
    emoji: "💣",
    age18: false,
    description: "Situaciones absurdas, desafíos, votaciones veloces y misiones durante la juntada.",
    tagline: "Para grupos que quieren quilombo, no reflexión."
  },
  canceladisimos: {
    prep_story: [
      "Contá la anécdota más oscura de la que te hayas reído aunque sabías que no daba.",
      "Contá una vez en la que pensaste algo horrible y por suerte no lo dijiste.",
      "Contá la peor cosa que hiciste por plata, comodidad o conveniencia.",
      "Contá una traición chica que nunca confesaste.",
      "Contá una situación en la que fingiste tristeza, empatía o interés para quedar bien.",
      "Contá algo que hiciste en un velorio, funeral o situación solemne que fue completamente fuera de lugar.",
      "Contá la mentira más grande que sostuviste solo porque ya era demasiado tarde para admitir la verdad.",
      "Contá una ocasión en la que deseaste que alguien desapareciera de un plan, grupo o relación.",
      "Contá algo moralmente indefendible que igual volverías a hacer.",
      "Contá la situación más vergonzosa en la que aprovechaste que nadie te estaba mirando.",
      "Contá una vez en la que te alegraste secretamente de que a otra persona le fuera mal.",
      "Contá algo que criticás en otros pero vos hacés igual."
    ],
    majority: [
      "¿Quién vendería un secreto del grupo por suficiente plata?",
      "¿Quién sería capaz de reírse en un funeral y después fingir tos?",
      "¿Quién se quedaría con plata encontrada aunque supiera de quién es?",
      "¿Quién saldría con la pareja o ex de un amigo si supiera que nunca se va a enterar?",
      "¿Quién fingiría una emergencia para escapar de una cita horrible?",
      "¿Quién sería más capaz de cobrar una deuda en medio de un velorio?",
      "¿Quién borraría pruebas antes de admitir que hizo algo mal?",
      "¿Quién inventaría una tragedia personal para conseguir un beneficio?",
      "¿Quién leería un chat ajeno entero si encuentra un celular desbloqueado?",
      "¿Quién sería capaz de hacer una colecta y quedarse con un pequeño porcentaje 'por gastos'?",
      "¿Quién tiene más chances de decir algo imperdonable y rematar con 'era un chiste'?",
      "¿Quién sería el primero en pelearse por una herencia antes de que termine el funeral?"
    ],
    hot_seat: [
      "¿Aceptarías mucha plata por contar el secreto más fuerte de tu mejor amigo?",
      "¿Te quedarías con una herencia si supieras que moralmente le correspondía a otra persona?",
      "¿Mentirías diciendo que un familiar murió para faltar al trabajo una semana?",
      "¿Leerías los mensajes privados de alguien fallecido si tuvieras acceso al celular?",
      "¿Irías al funeral de alguien que odiabas solo para ver quién fue?",
      "¿Está peor engañar a tu pareja o engañar a tu mejor amigo?",
      "¿Aceptarías dinero para fingir una amistad durante un año?",
      "¿Te harías el distraído si vieras a un amigo robando algo caro?",
      "¿Está bien quedarse con plata encontrada si nadie puede demostrar de quién era?",
      "¿Preferís que se hagan públicos tus últimos 100 mensajes o tus últimas 100 búsquedas?",
      "¿Borrarías pruebas que incriminan a un amigo si sabés que nadie va a descubrirte?",
      "¿Aceptarías ir a un funeral de alguien que no conocés si te pagan por llorar?"
    ],
    rank: [
      "Ordenalos de más a menos probable que venda un secreto por plata.",
      "Ordenalos de más a menos probable que se ría en el peor momento posible.",
      "Ordenalos de más a menos probable que mienta usando una tragedia como excusa.",
      "Ordenalos de más a menos probable que revise un celular ajeno desbloqueado.",
      "Ordenalos de más a menos probable que discuta por una herencia demasiado pronto.",
      "Ordenalos de más a menos probable que haga trampa si está seguro de que nadie lo descubre.",
      "Ordenalos de más a menos probable que cobre una deuda en un momento totalmente inapropiado.",
      "Ordenalos de más a menos probable que desaparezca después de causar un problema.",
      "Ordenalos de más a menos probable que finja empatía para quedar bien.",
      "Ordenalos de más a menos probable que diga 'era un chiste' después de cruzar una línea."
    ],
    duo: [
      "¿Por cuánta plata cree el otro que venderías un secreto del grupo?",
      "¿Qué cree el otro que harías primero si encontraras un celular ajeno desbloqueado?",
      "¿Qué límite moral cree el otro que cruzarías por mucha plata?",
      "¿Qué cree el otro que sería peor que se filtre de vos: mensajes, búsquedas, fotos o audios?",
      "¿Qué cree el otro que harías si te enteraras de una infidelidad de tu mejor amigo?",
      "¿Qué cree el otro que te daría más culpa: traicionar a un amigo o quedarte con plata que no era tuya?",
      "¿Qué cree el otro que harías si pudieras borrar una sola cagada de tu pasado sin consecuencias?",
      "¿Qué cree el otro que te haría reír aunque sabés que no deberías?"
    ],
    one_vs_all: [
      "¿Cuál es el peor momento posible en el que te tentaste de risa?",
      "¿Qué cosa harías si supieras con absoluta certeza que nadie se va a enterar?",
      "¿Por cuánta plata revelarías el secreto más fuerte que conocés de alguien?",
      "¿Qué sería peor que se filtrara: tus mensajes, tus búsquedas, tus fotos o tus audios?",
      "¿Cuál es la mentira más oscura que considerarías decir para salir de un problema serio?",
      "¿Qué cosa moralmente horrible pensás que casi cualquiera haría por suficiente plata?",
      "¿Qué traición perdonarías si también te beneficiara?",
      "¿Qué situación trágica te hizo reír por un motivo completamente inapropiado?",
      "¿Qué harías si encontraras un sobre con muchísimo dinero y un nombre adentro?",
      "¿Qué preferís: que todos sepan tu peor mentira o tu pensamiento más oscuro?",
      "¿A quién del grupo nunca le dejarías tu celular desbloqueado?",
      "¿Qué harías primero si supieras que mañana desaparece internet para siempre?"
    ],
    missions: [
      "Conseguí que alguien diga “con eso no se jode” sin pedirle que lo diga.",
      "Lográ que alguien admita que haría algo moralmente horrible por suficiente plata.",
      "Conseguí que alguien diga cuál fue el peor momento en que se tentó de risa.",
      "Hacé que dos personas discutan sobre si revisar un celular puede justificarse.",
      "Conseguí que alguien admita una mentira que usó para escapar de un compromiso.",
      "Lográ que alguien diga “yo eso lo haría” frente a una situación indefendible.",
      "Conseguí que alguien elija a quién del grupo le confiaría menos un secreto.",
      "Hacé que alguien cuente una anécdota de funeral, velorio o momento solemne que terminó mal.",
      "Conseguí que el grupo discuta qué traición sería la más difícil de perdonar.",
      "Lográ que alguien admita haberse alegrado secretamente de que a otra persona le saliera algo mal.",
      "Conseguí que alguien diga qué haría con una valija llena de dinero sin dueño aparente.",
      "Hacé que alguien cuente la peor excusa que alguna vez inventó."
    ]
  },

  rompehielo: {
    prep_story: [
      "Contá un dato inesperado sobre vos.",
      "Contá un hobby o interés que no sea evidente al conocerte.",
      "Contá una comida que amás y a mucha gente no le gusta.",
      "Contá un lugar raro o inesperado que hayas visitado.",
      "Contá algo que sabés hacer bastante bien.",
      "Contá una pequeña manía tuya."
    ],
    majority: [
      "¿Quién parece más probable que viaje solo?",
      "¿Quién parece más competitivo?",
      "¿Quién parece más probable que tenga un hobby inesperado?",
      "¿Quién parece más tranquilo bajo presión?",
      "¿Quién parece más probable que se quede despierto hasta muy tarde?",
      "¿Quién parece más probable que improvise un plan?"
    ],
    hot_seat: [
      "¿Preferís una noche tranquila o una fiesta grande?",
      "¿Preferís playa o montaña?",
      "¿Preferís planificar un viaje o improvisarlo?",
      "¿Preferís levantarte temprano o quedarte despierto hasta tarde?",
      "¿Preferís cocinar o pedir comida?",
      "¿Preferís conocer mucha gente o tener pocos amigos muy cercanos?"
    ],
    rank: [
      "Ordenalos según quién parece más aventurero.",
      "Ordenalos según quién parece más competitivo.",
      "Ordenalos según quién parece más organizado."
    ],
    duo: [
      "Adiviná qué elegiría el otro: playa o montaña.",
      "Adiviná qué elegiría el otro: salir o quedarse en casa.",
      "Adiviná qué elegiría el otro: dulce o salado.",
      "Adiviná qué elegiría el otro: viajar con plan o improvisar."
    ],
    one_vs_all: [
      "¿Cuál sería tu viaje ideal?",
      "¿Qué habilidad te gustaría aprender?",
      "¿Qué comida podrías comer todas las semanas?",
      "¿Qué tipo de plan te cuesta rechazar?"
    ],
    missions: []
  }
};

export function getTheme(id) {
  return THEMES[id] || THEMES.clasico;
}

export function getPrompts(themeId, type) {
  return PROMPTS[themeId]?.[type] || PROMPTS.clasico[type] || [];
}
