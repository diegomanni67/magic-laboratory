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
      "Contá una opinión tuya que sabés que te haría perder puntos sociales si la dijeras en una cena.",
      "Contá una vez en la que fingiste empatía, interés o tristeza solamente para quedar bien.",
      "Contá algo que hiciste por plata y que preferirías no explicar demasiado.",
      "Contá una traición menor que cometiste y nunca confesaste.",
      "Contá la peor excusa que usaste para desaparecer de una cita, amistad o compromiso.",
      "Contá una situación en la que aprovechaste una ventaja sabiendo que era bastante injusta.",
      "Contá algo que criticaste públicamente y después hiciste exactamente igual.",
      "Contá una verdad sobre vos que te haría quedar bastante peor de lo que la gente imagina.",
      "Contá una vez en la que dejaste que otra persona cargara con una culpa que también era tuya.",
      "Contá una opinión sobre amistad, pareja, plata o familia que normalmente preferís callarte.",
      "Contá la cosa más mezquina que hayas hecho por comodidad.",
      "Contá una ocasión en la que mantuviste un vínculo solo porque te convenía."
    ],
    majority: [
      "¿Quién vendería un secreto del grupo por suficiente plata?",
      "¿Quién saldría con el ex de un amigo si supiera que nunca se va a enterar?",
      "¿Quién fingiría estar enfermo para evitar ayudar a alguien?",
      "¿Quién tiene más chances de ghostear a alguien después de conseguir lo que quería?",
      "¿Quién sería capaz de quedarse con plata encontrada sin preguntar de quién es?",
      "¿Quién traicionaría primero una promesa si la recompensa fuera suficientemente buena?",
      "¿Quién tiene más probabilidades de leer un chat ajeno si encuentra el celular desbloqueado?",
      "¿Quién podría mantener dos versiones distintas de una historia según con quién habla?",
      "¿Quién mentiría mejor bajo presión sin que nadie se dé cuenta?",
      "¿Quién podría hacerse el dormido para no ayudar en una situación incómoda?",
      "¿Quién sería más probable que siga siendo amigo de alguien solo por contactos o conveniencia?",
      "¿Quién tiene más chances de negar algo aun con pruebas bastante claras enfrente?"
    ],
    hot_seat: [
      "¿Aceptarías mucha plata por contar el secreto más fuerte de tu mejor amigo?",
      "¿Saldrías con el ex de un amigo si te garantiza que jamás se enteraría?",
      "¿Perdonarías una infidelidad si supieras con certeza que nunca volvería a pasar?",
      "¿Revisarías el celular de tu pareja si tuvieras una sospecha fuerte y supieras que no te van a descubrir?",
      "¿Preferís ser buena persona y que nadie lo sepa o parecer buena persona aunque no lo seas?",
      "¿Mentirías en una entrevista de trabajo si sabés que nadie puede comprobarlo?",
      "¿Está peor traicionar a alguien o dejar que otro cargue con una culpa que también es tuya?",
      "¿Aceptarías un trabajo que odiás si paga el triple y te permite retirarte joven?",
      "¿Dejarías plantado a alguien importante por ir a un plan mucho mejor que apareció a último momento?",
      "¿Borrarías un mensaje comprometedor de un amigo si eso también te protegiera a vos?",
      "¿Está bien fingir amistad con alguien que no soportás si te conviene?",
      "¿Preferís que todos conozcan tu historial de búsquedas o tus últimos 100 mensajes privados?"
    ],
    rank: [
      "Ordenalos de más a menos probable que venda un secreto por plata.",
      "Ordenalos de más a menos probable que salga con el ex de un amigo.",
      "Ordenalos de más a menos probable que mienta para no pagar su parte.",
      "Ordenalos de más a menos probable que revise un celular ajeno desbloqueado.",
      "Ordenalos de más a menos probable que mantenga una amistad por conveniencia.",
      "Ordenalos de más a menos probable que ghostee a alguien sin explicación.",
      "Ordenalos de más a menos probable que niegue algo incluso con evidencia.",
      "Ordenalos de más a menos probable que haga trampa si está seguro de que nadie lo descubre.",
      "Ordenalos de más a menos probable que se quede callado si otro está recibiendo una culpa que también le corresponde.",
      "Ordenalos de más a menos probable que diga exactamente lo contrario según quién esté presente."
    ],
    duo: [
      "¿Por cuánta plata cree el otro que venderías un secreto del grupo?",
      "¿Qué traición cree el otro que te costaría menos cometer: amistad, pareja, trabajo o familia?",
      "¿Qué haría primero el otro si encuentra un celular desbloqueado y una conversación abierta?",
      "¿Qué límite moral cree el otro que vos cruzarías por mucha plata?",
      "¿Qué cree el otro que harías si tu mejor amigo empieza a salir con tu ex?",
      "¿Qué cree el otro que te daría más vergüenza que se haga público: tus mensajes, tus búsquedas, tus notas o tus fotos?",
      "¿Qué cree el otro que perdonarías más fácil: una mentira, una infidelidad, una traición o una humillación?",
      "¿Qué cree el otro que harías si pudieras saber una verdad privada sobre cualquier persona del grupo?"
    ],
    one_vs_all: [
      "¿Por cuánta plata revelarías el secreto más fuerte que conocés de alguien?",
      "¿Qué cosa harías si supieras con absoluta certeza que nadie se va a enterar?",
      "¿Cuál es la peor razón por la que mantendrías una amistad?",
      "¿Qué traición considerás perdonable si el beneficio es suficientemente grande?",
      "¿Qué comportamiento criticás en otros pero sabés que vos también hacés?",
      "¿A quién del grupo le confiarías menos tu celular desbloqueado?",
      "¿Qué sería peor que se filtrara: tus búsquedas, tus mensajes, tus notas o tus fotos?",
      "¿Qué regla moral pensás que la mayoría defiende en público pero rompe en privado?",
      "¿Qué cosa no perdonarías jamás aunque después admitieras que vos podrías hacerla?",
      "¿Cuál es la opinión más cruel que alguna vez tuviste sobre alguien y nunca dijiste?",
      "¿Qué preferís: que se conozca tu peor mentira o tu peor pensamiento?",
      "¿Qué vínculo romperías primero si tuvieras que elegir entre amistad, pareja, familia o trabajo?"
    ],
    missions: [
      "Conseguí que alguien diga “eso no se puede decir” sin pedirle que lo diga.",
      "Lográ que alguien admita que haría algo moralmente dudoso por suficiente plata.",
      "Conseguí que alguien diga quién del grupo sería peor para confiarle un secreto.",
      "Hacé que dos personas discutan sobre si revisar un celular puede justificarse.",
      "Lográ que alguien admita una hipocresía propia sin preguntárselo directamente.",
      "Conseguí que alguien diga “yo eso lo haría” frente a una situación bastante indefendible.",
      "Hacé que alguien cuente una excusa que usó para evitar a otra persona.",
      "Conseguí que el grupo discuta qué traición sería la más difícil de perdonar.",
      "Lográ que alguien diga cuál es el peor tipo de amigo posible.",
      "Conseguí que una persona admita que alguna vez fingió interés para conseguir algo."
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
