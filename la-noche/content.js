export const CONTENT_VERSION = "0.4.0";

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
    premiumOnly: true,
    freePreview: false,
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
    id: "canceladisimos",
    title: "Canceladísimos",
    emoji: "🚨",
    age18: true,
    premiumOnly: true,
    freePreview: false,
    description: "Opiniones impopulares, dilemas incómodos, confesiones debatibles y elecciones que nadie quiere admitir.",
    tagline: "Decí lo que pensás. Después bancate el escrutinio del grupo."
  },
  rompehielo: {
    id: "rompehielo",
    title: "Rompehielo",
    emoji: "🧊",
    age18: false,
    description: "Pensado para gente que todavía no se conoce demasiado.",
    tagline: "Se empieza liviano y se va poniendo mejor."
  }
};

export const MODES = {
  quien_fue: {
    id: "quien_fue",
    title: "¿Quién fue?",
    emoji: "🕵️",
    description: "Aparece una historia real del grupo. Todos intentan descubrir a quién pertenece.",
    minPlayers: 3,
    scoring: "100 puntos por acertar. El autor gana 25 por cada jugador engañado, máximo 100."
  },
  lee_al_grupo: {
    id: "lee_al_grupo",
    title: "Leé al grupo",
    emoji: "📊",
    description: "Durante la preparación todos votan. En vivo hay que predecir cuál fue la respuesta de la mayoría.",
    minPlayers: 3,
    scoring: "100 puntos por anticipar la opción ganadora."
  },
  mentiroso: {
    id: "mentiroso",
    title: "El Mentiroso",
    emoji: "😈",
    description: "Una afirmación puede ser verdadera o inventada. Hay que detectar el engaño.",
    minPlayers: 3,
    scoring: "100 por detectar correctamente. Quien escribió la mentira gana 30 por cada persona engañada."
  },
  silla_caliente: {
    id: "silla_caliente",
    title: "Silla Caliente",
    emoji: "🔥",
    description: "Una persona responde en secreto. Los demás deben adivinar qué elegiría.",
    minPlayers: 3,
    scoring: "100 puntos por coincidir con la respuesta de la persona protagonista."
  },
  duo: {
    id: "duo",
    title: "Dúo",
    emoji: "🤝",
    description: "Dos personas responden sobre la otra. Si se conocen, coinciden.",
    minPlayers: 4,
    scoring: "100 para cada integrante del dúo si coinciden. El resto gana 75 por predecir correctamente si coinciden o no."
  },
  ordena_al_grupo: {
    id: "ordena_al_grupo",
    title: "Ordená al grupo",
    emoji: "🏁",
    description: "Ordenás personas según una consigna y comparás tu ranking con el consenso del grupo.",
    minPlayers: 4,
    scoring: "Hasta 150 puntos según qué tan cerca quede tu orden del ranking colectivo."
  },
  todos_contra_uno: {
    id: "todos_contra_uno",
    title: "Todos contra uno",
    emoji: "🎯",
    description: "Una persona tiene una respuesta secreta. Todos los demás intentan leerle la cabeza.",
    minPlayers: 3,
    scoring: "100 por descubrirla. La persona protagonista gana 30 por cada jugador que falla, máximo 120."
  },
  duo_coincidimos: {id:"duo_coincidimos",title:"Coincidimos",emoji:"👯",description:"Los dos eligen sin ver la respuesta del otro. Si coinciden, suman.",minPlayers:2,scoring:"100 puntos para cada uno si coinciden."},
  duo_dilema: {id:"duo_dilema",title:"¿Qué elegirías?",emoji:"⚖️",description:"Dilemas A/B para descubrir si piensan igual.",minPlayers:2,scoring:"100 puntos para cada uno si coinciden."},
  duo_duelo: {id:"duo_duelo",title:"Duelo",emoji:"⚡",description:"Preguntas rápidas de cultura general. Cada respuesta correcta suma.",minPlayers:2,scoring:"100 puntos por respuesta correcta."},
  duo_5seg: {id:"duo_5seg",title:"5 segundos",emoji:"⏱️",description:"Cumplí la consigna antes de cinco segundos y marcá si llegaste.",minPlayers:2,scoring:"75 puntos si completás el desafío."},
  mision_secreta: {
    id: "mision_secreta",
    title: "Misión secreta",
    emoji: "💣",
    description: "El juego te da una misión para completar durante la juntada sin que el resto lo note.",
    minPlayers: 3,
    scoring: "250 puntos por completar la misión."
  }
};

export const THEME_MODES = {
  clasico: ["quien_fue","lee_al_grupo","mentiroso","silla_caliente","duo","ordena_al_grupo","todos_contra_uno","mision_secreta"],
  profundo: ["quien_fue","lee_al_grupo","silla_caliente","duo","ordena_al_grupo","todos_contra_uno"],
  picante18: ["quien_fue","lee_al_grupo","mentiroso","silla_caliente","duo","todos_contra_uno","mision_secreta"],
  parejas: ["quien_fue","silla_caliente","duo","todos_contra_uno","ordena_al_grupo"],
  cumple: ["quien_fue","lee_al_grupo","mentiroso","silla_caliente","todos_contra_uno","mision_secreta"],
  caos: ["lee_al_grupo","mentiroso","silla_caliente","ordena_al_grupo","todos_contra_uno","mision_secreta"],
  canceladisimos: ["quien_fue","lee_al_grupo","mentiroso","silla_caliente","ordena_al_grupo","todos_contra_uno","mision_secreta"],
  rompehielo: ["quien_fue","lee_al_grupo","mentiroso","silla_caliente","duo"]
};

export const DUO_CHOICES = {
  clasico: [
    {question:"¿Qué elegirían para un fin de semana libre?",left:"Salir de viaje",right:"Quedarse descansando"},
    {question:"¿Qué preferirían si mañana no tuvieran obligaciones?",left:"Improvisar un plan",right:"No hacer nada"},
    {question:"¿Qué elegirían?",left:"Playa",right:"Montaña"},
    {question:"¿Qué pesa más para ustedes?",left:"Tener razón",right:"Evitar la discusión"}
  ],
  profundo: [
    {question:"¿Qué pesa más?",left:"Libertad",right:"Seguridad"},
    {question:"¿Qué elegirían?",left:"Una verdad dolorosa",right:"Una mentira tranquilizadora"},
    {question:"¿Qué preferirían?",left:"Una vida estable",right:"Una vida intensa"},
    {question:"¿Qué cuesta más?",left:"Perdonar",right:"Pedir perdón"}
  ],
  parejas: [
    {question:"¿Qué plan elegirían?",left:"Viaje sorpresa",right:"Viaje organizado"},
    {question:"¿Qué valoran más?",left:"Tiempo juntos",right:"Detalles"},
    {question:"Después de una discusión, ¿qué prefieren?",left:"Hablar enseguida",right:"Esperar"},
    {question:"¿Qué noche eligen?",left:"Salir",right:"Quedarse en casa"}
  ],
  cumple: [
    {question:"¿Qué elegirían para festejar?",left:"Fiesta grande",right:"Plan chico"},
    {question:"¿Qué regalo prefieren?",left:"Experiencia",right:"Objeto"},
    {question:"¿Qué plan gana?",left:"Viaje",right:"Cena"},
    {question:"¿Qué pesa más?",left:"Sorpresa",right:"Elegir juntos"}
  ],
  caos: [
    {question:"¿Qué elegirían?",left:"Un millón hoy",right:"Diez millones en diez años"},
    {question:"¿Qué poder prefieren?",left:"Congelar el tiempo",right:"Teletransportarse"},
    {question:"¿Qué sería menos insoportable?",left:"Un año sin redes",right:"Un año sin streaming"},
    {question:"¿Qué harían?",left:"Aceptar la apuesta",right:"No arriesgar"}
  ],
  rompehielo: [
    {question:"¿Qué elegirían?",left:"Dulce",right:"Salado"},
    {question:"¿Qué prefieren?",left:"Playa",right:"Montaña"},
    {question:"¿Qué plan gana?",left:"Salir",right:"Quedarse en casa"},
    {question:"¿Cómo viajarían?",left:"Todo planeado",right:"Improvisando"}
  ],
  picante18: [],
  canceladisimos: []
};

export const PROMPTS = {
  clasico: {
    prep_story: [
      "Contá una anécdota tuya que el grupo pueda llegar a reconocer.",
      "Contá algo vergonzoso que te haya pasado.",
      "Contá una situación en la que hiciste algo impulsivo.",
      "Contá una historia que hoy te dé risa pero en el momento fue un desastre.",
      "Contá algo que hiciste y que casi nadie del grupo sabe.",
      "Contá una situación en la que mentiste para salir de un problema.",
      "Contá un momento en el que te equivocaste de persona, lugar o situación.",
      "Contá una anécdota de viaje, fiesta o salida que pueda delatarte."
    ],
    majority: [
      "¿Quién llegaría tarde a su propio casamiento?",
      "¿Quién sobreviviría mejor solo en una isla?",
      "¿Quién desaparecería primero en una fiesta?",
      "¿Quién podría hacerse famoso por accidente?",
      "¿Quién tiene más chances de abandonar todo y mudarse a otro país?",
      "¿Quién es más probable que mande un mensaje y se arrepienta al segundo?",
      "¿Quién sería el peor compañero de departamento?",
      "¿Quién podría mantener un secreto por más tiempo?",
      "¿Quién se haría amigo de un desconocido en cinco minutos?",
      "¿Quién tiene más chances de perder el celular esta noche?",
      "¿Quién sería mejor detective?",
      "¿Quién probablemente tendría una doble vida sin que nadie lo note?"
    ],
    hot_seat: [
      "¿Preferís tener muchísimo dinero o muchísimo tiempo libre?",
      "¿Preferís saber siempre cuándo te mienten o que nadie pueda saber cuándo mentís vos?",
      "¿Elegirías vivir diez años en el futuro o volver diez años al pasado?",
      "¿Preferís ser muy conocido o completamente anónimo?",
      "¿Perdonás más fácil una mentira o una traición?",
      "¿Preferís una vida estable o una vida impredecible?",
      "¿Elegirías conocer la fecha de tu muerte si pudieras?",
      "¿Preferís tener razón en una discusión o terminarla rápido?"
    ],
    rank: [
      "Ordenalos de más a menos probable que se vaya a vivir al exterior.",
      "Ordenalos de más a menos competitivo.",
      "Ordenalos de mejor a peor guardando secretos.",
      "Ordenalos de más a menos probable que llegue tarde.",
      "Ordenalos de más a menos probable que sobreviva en un reality.",
      "Ordenalos de más a menos probable que se haga viral sin querer."
    ],
    duo: [
      "¿Cuál sería el plan ideal del otro para un sábado a la noche?",
      "¿Qué elegiría el otro: viaje improvisado o viaje totalmente organizado?",
      "¿Qué le cuesta más al otro: pedir perdón o decir que no?",
      "¿Qué preferiría el otro: regalo caro o regalo muy pensado?",
      "¿Qué elegiría el otro: playa o montaña?",
      "¿Cuál es la comida que el otro pediría sin mirar demasiado el menú?"
    ],
    one_vs_all: [
      "Si mañana te depositaran una fortuna, ¿qué sería lo primero que harías?",
      "¿Qué objeto salvarías primero si tuvieras que abandonar tu casa?",
      "¿Qué profesión completamente distinta probarías durante un año?",
      "¿Qué elegirías: no usar redes sociales nunca más o no mirar series/películas nunca más?",
      "¿Con quién del grupo te irías a un viaje sin planificar nada?",
      "¿Qué preferís perder: el celular durante una semana o salir de tu casa durante una semana?"
    ],
    missions: [
      "Conseguí que alguien diga la palabra “literalmente” sin pedirle que la diga.",
      "Lográ que dos personas se saquen una selfie con vos.",
      "Conseguí que alguien cuente una anécdota de viaje sin preguntarle directamente por viajes.",
      "Hacé que alguien proponga pedir o preparar comida.",
      "Conseguí que una persona te preste un objeto sin explicarle por qué.",
      "Lográ que alguien cambie de asiento.",
      "Conseguí un brindis del grupo sin decir que es una misión.",
      "Hacé que alguien use una frase que suele repetir mucho."
    ]
  },

  profundo: {
    prep_story: [
      "Contá una decisión que te haya cambiado más de lo que esperabas.",
      "Contá una vez en la que cambiaste completamente de opinión sobre algo importante.",
      "Contá algo que te costó aprender sobre vos mismo.",
      "Contá un momento en el que sentiste que estabas empezando una etapa nueva.",
      "Contá una situación que te haya hecho valorar algo que antes dabas por sentado.",
      "Contá un miedo que hayas superado parcialmente.",
      "Contá una conversación que recuerdes años después.",
      "Contá una pequeña decisión que terminó teniendo una consecuencia enorme."
    ],
    majority: [
      "¿Quién cambiaría estabilidad por perseguir un sueño?",
      "¿Quién perdonaría más fácilmente una traición?",
      "¿Quién podría empezar de cero en otro país?",
      "¿Quién piensa más en el futuro?",
      "¿Quién necesita más tiempo a solas?",
      "¿Quién tiene más facilidad para cambiar de opinión?",
      "¿Quién elegiría una vida tranquila antes que una vida exitosa?",
      "¿Quién se conoce mejor a sí mismo?"
    ],
    hot_seat: [
      "¿Qué pesa más para vos: arrepentirte de hacer algo o de no haberlo hecho?",
      "¿Preferís una verdad dolorosa o una mentira que te haga feliz?",
      "¿Qué es más importante: ser entendido o ser aceptado?",
      "¿Elegirías borrar un mal recuerdo si eso también borrara lo que aprendiste?",
      "¿Preferís saber cómo te recuerdan los demás o cómo te vas a recordar vos dentro de veinte años?",
      "¿Qué valorás más: libertad o seguridad?",
      "¿Preferís tener éxito en algo que no amás o fracasar intentando algo que sí?",
      "¿Qué cuesta más: cambiar o aceptar que algo no va a cambiar?"
    ],
    rank: [
      "Ordenalos de más a menos dispuesto a empezar de cero.",
      "Ordenalos de más a menos probable que siga su intuición.",
      "Ordenalos de más a menos emocional al tomar decisiones.",
      "Ordenalos de más a menos dispuesto a perdonar.",
      "Ordenalos de más a menos probable que cambie radicalmente de vida.",
      "Ordenalos de más a menos probable que priorice felicidad sobre dinero."
    ],
    duo: [
      "¿Cuál creés que es el mayor sueño actual del otro?",
      "¿Qué creés que al otro le cuesta admitir?",
      "¿Qué situación hace sentir más seguro al otro?",
      "¿Qué elegiría el otro: una vida predecible y feliz o una intensa e incierta?",
      "¿Cuál es una cualidad del otro que él mismo subestima?",
      "¿Qué necesita el otro cuando está realmente mal: compañía o espacio?"
    ],
    one_vs_all: [
      "¿Qué te gustaría que la gente entendiera mejor de vos?",
      "¿Qué cambiarías de tu vida actual si supieras que nadie va a juzgarte?",
      "¿Qué te da más miedo perder?",
      "¿Qué significa para vos tener una buena vida?",
      "¿Qué edad sentís que tenés por dentro?",
      "¿Qué preferirías saber: cómo vas a morir o qué legado vas a dejar?"
    ],
    missions: []
  },

  picante18: {
    prep_story: [
      "Contá una situación incómoda que hayas vivido en una cita.",
      "Contá una vez en la que entendiste completamente mal una señal de interés.",
      "Contá una confesión sobre citas o atracción que el grupo probablemente no conozca.",
      "Contá una decisión sentimental impulsiva que hayas tomado.",
      "Contá una cita que haya terminado de una manera que no esperabas.",
      "Contá una vez en la que mandaste un mensaje del que después te arrepentiste.",
      "Contá una situación en la que te gustó alguien inesperado.",
      "Contá algo que te haya pasado intentando impresionar a alguien."
    ],
    majority: [
      "¿Quién tendría una cita con alguien que conoció esa misma noche?",
      "¿Quién volvería con un ex?",
      "¿Quién se enamoraría primero?",
      "¿Quién podría mantener mejor una relación secreta?",
      "¿Quién tiene más chances de revisar el perfil de un ex por curiosidad?",
      "¿Quién podría confundir atracción con enamoramiento?",
      "¿Quién sería más probable que tenga un crush con alguien totalmente inesperado?",
      "¿Quién sería más celoso aunque diga que no?"
    ],
    hot_seat: [
      "¿Qué te atrae primero de alguien: personalidad o apariencia?",
      "¿Preferís que alguien sea muy directo o que genere misterio?",
      "¿Volverías con un ex si realmente creyera haber cambiado?",
      "¿Qué te importa más: química o compatibilidad?",
      "¿Preferís una relación intensa o una relación tranquila?",
      "¿Perdonarías un beso con otra persona?",
      "¿Te animarías a decirle a un amigo que te atrae?",
      "¿Preferís saber todo sobre el pasado sentimental de una pareja o casi nada?"
    ],
    rank: [
      "Ordenalos de más a menos probable que se enamore primero.",
      "Ordenalos de más a menos probable que vuelva con un ex.",
      "Ordenalos de más a menos probable que dé el primer paso.",
      "Ordenalos de más a menos probable que tenga un romance secreto.",
      "Ordenalos de más a menos celoso.",
      "Ordenalos de más a menos probable que se enganche después de una sola cita."
    ],
    duo: [
      "¿Qué tipo de persona cree el otro que te atrae?",
      "¿Qué pesa más para el otro: química o estabilidad?",
      "¿El otro preferiría dar el primer paso o que se lo den?",
      "¿El otro perdonaría que su pareja o cita coquetee con alguien más?",
      "¿Qué le daría más vergüenza al otro: ser rechazado o admitir que le gusta alguien?",
      "¿El otro elegiría una relación intensa o tranquila?"
    ],
    one_vs_all: [
      "¿Qué cosa hace que pierdas interés inmediatamente en alguien?",
      "¿Qué preferís: primera cita muy planeada o totalmente improvisada?",
      "¿Saldrías con alguien que ya salió con un amigo tuyo?",
      "¿Qué elegirías: mucha química y poca compatibilidad o poca química y mucha compatibilidad?",
      "¿Le darías una segunda oportunidad a una cita que salió muy mal?",
      "¿Qué te cuesta más: encarar o terminar una relación?"
    ],
    missions: [
      "Conseguí que alguien cuente cómo conoció a una ex pareja o interés amoroso.",
      "Lográ que alguien diga qué famoso le parece atractivo.",
      "Conseguí que dos personas discutan amistosamente sobre qué cuenta como una buena primera cita.",
      "Hacé que alguien admita haber investigado a una cita en redes.",
      "Conseguí que alguien diga qué característica le resulta irresistible.",
      "Lográ que alguien cuente su peor cita sin pedírselo directamente."
    ]
  },

  parejas: {
    prep_story: [
      "Contá un recuerdo con tu pareja que para vos sea mucho más importante de lo que parece.",
      "Contá una situación graciosa de los primeros meses de la relación.",
      "Contá una costumbre de tu pareja que al principio te sorprendía.",
      "Contá un pequeño gesto de tu pareja que recuerdes especialmente.",
      "Contá una discusión que hoy les cause gracia.",
      "Contá una situación en la que tu pareja te sorprendió para bien."
    ],
    majority: [
      "¿Qué pareja del grupo es más probable que improvise un viaje mañana?",
      "¿Qué pareja tardaría más en decidir dónde cenar?",
      "¿Qué pareja sobreviviría mejor un mes sin celular?",
      "¿Qué pareja tiene rutinas más diferentes entre sí?",
      "¿Qué pareja se conoce mejor?",
      "¿Qué pareja sería más competitiva jugando contra las demás?"
    ],
    hot_seat: [
      "¿Qué preferís recibir de tu pareja: tiempo, palabras, ayuda, detalles o contacto físico?",
      "¿Preferís un viaje sorpresa o elegirlo juntos?",
      "¿Qué valorás más: que te escuchen o que intenten resolverte el problema?",
      "¿Preferís festejar fechas importantes en grande o de forma íntima?",
      "¿Qué pesa más: tener gustos parecidos o valores parecidos?",
      "¿Preferís hablar un problema enseguida o esperar a estar más tranquilo?"
    ],
    rank: [
      "Ordená qué conoce mejor tu pareja de vos: gustos, miedos, hábitos, sueños.",
      "Ordená qué valorás más en la relación: humor, confianza, comunicación, admiración.",
      "Ordená qué plan elegirían juntos: viaje, cena, recital, día en casa."
    ],
    duo: [
      "¿Cuál es la comida que pediría tu pareja sin pensarlo mucho?",
      "¿Cuál es el destino de viaje que más elegiría?",
      "¿Qué hace primero cuando está de mal humor?",
      "¿Qué regalo preferiría: experiencia, objeto, sorpresa o algo hecho por vos?",
      "¿Qué recuerdo de la relación elegiría como favorito?",
      "¿Quién pidió perdón primero después de la última discusión importante?"
    ],
    one_vs_all: [
      "¿Cuál fue tu primera impresión de tu pareja?",
      "¿Qué plan elegirías para un aniversario ideal?",
      "¿Qué hábito de tu pareja te resultaría más raro si desapareciera mañana?",
      "¿Qué creés que tu pareja admira más de vos?"
    ],
    missions: []
  },

  cumple: {
    prep_story: [
      "Contá una anécdota con el cumpleañero que él probablemente recuerde.",
      "Contá una historia vergonzosa del cumpleañero sin poner su nombre.",
      "Contá la primera impresión que tuviste del cumpleañero.",
      "Contá una situación en la que el cumpleañero te haya sorprendido.",
      "Contá un recuerdo viejo que solo algunos invitados conozcan.",
      "Contá un momento en el que el cumpleañero haya hecho algo muy propio de él."
    ],
    majority: [
      "¿Quién conoce al cumpleañero desde hace más tiempo?",
      "¿Quién podría elegir mejor un regalo para el cumpleañero?",
      "¿Quién se parece más al cumpleañero?",
      "¿Quién sobreviviría mejor un viaje de una semana a solas con el cumpleañero?",
      "¿Quién sabe más historias comprometedoras del cumpleañero?",
      "¿Quién probablemente reciba primero un mensaje del cumpleañero cuando tiene un problema?"
    ],
    hot_seat: [
      "¿Qué elegiría el cumpleañero: viaje, fiesta o regalo caro?",
      "¿Qué preferiría: volver a tener 18 o saltar diez años al futuro?",
      "¿Qué persona famosa elegiría para cenar una noche?",
      "¿Qué plan elegiría para un cumpleaños perfecto?",
      "¿Qué le importa más en una amistad: lealtad, humor, sinceridad o presencia?",
      "¿Qué recuerdo de su vida elegiría para volver a vivir un día?"
    ],
    rank: [
      "Ordená a estas personas según cuánto conocen al cumpleañero.",
      "Ordená los planes según cuánto le gustarían al cumpleañero.",
      "Ordená estas cosas según cuánto las valora el cumpleañero: amigos, trabajo, viajes, descanso."
    ],
    duo: [
      "¿Qué elegiría el cumpleañero para comer si pudiera pedir cualquier cosa?",
      "¿Qué viaje elegiría el cumpleañero?",
      "¿Qué cosa lo hace reír más rápido?",
      "¿Qué costumbre suya cree que el cumpleañero es la más evidente?"
    ],
    one_vs_all: [
      "¿Cuál fue tu mejor cumpleaños?",
      "¿Qué edad te gustaría volver a tener por una semana?",
      "¿Qué regalo recordás más?",
      "¿Qué persona de acá podría organizarte mejor una sorpresa?"
    ],
    missions: [
      "Conseguí que el cumpleañero cuente una historia de su infancia.",
      "Lográ que el cumpleañero diga quién llegó más tarde.",
      "Conseguí que alguien haga un brindis sin mencionar el juego.",
      "Hacé que dos personas se saquen una foto con el cumpleañero.",
      "Conseguí que el cumpleañero nombre una canción que le encanta."
    ]
  },

  caos: {
    prep_story: [
      "Contá la decisión más absurda que hayas tomado por impulso.",
      "Contá una situación ridícula en la que terminaste por casualidad.",
      "Contá una mentira absurda que una vez te creyeron.",
      "Contá el peor plan que aceptaste sabiendo que iba a salir mal.",
      "Contá una anécdota que parezca inventada pero haya pasado de verdad.",
      "Contá algo raro que hayas comprado, guardado o coleccionado."
    ],
    majority: [
      "¿Quién vendería todo y se iría mañana a otro país por una apuesta?",
      "¿Quién sería eliminado primero de un reality?",
      "¿Quién podría terminar detenido por una confusión absurda?",
      "¿Quién aceptaría un trabajo rarísimo solo por la historia?",
      "¿Quién podría casarse en Las Vegas por impulso?",
      "¿Quién sobreviviría peor 24 horas sin internet?",
      "¿Quién podría convertirse accidentalmente en influencer?",
      "¿Quién aceptaría participar en un programa de televisión sin saber de qué se trata?"
    ],
    hot_seat: [
      "¿Preferís tener que cantar todo lo que decís o bailar cada vez que caminás?",
      "¿Preferís vivir un año sin espejo o un año sin cámara?",
      "¿Aceptarías un millón de dólares por cambiar tu nombre legal por uno ridículo durante diez años?",
      "¿Preferís tener un botón que congela el tiempo o uno que te teletransporta una vez por día?",
      "¿Preferís que todos escuchen tus pensamientos durante diez minutos o que publiquen tu historial de búsquedas?",
      "¿Vivirías gratis en una mansión si supieras que está embrujada?"
    ],
    rank: [
      "Ordenalos de más a menos probable que termine en un reality.",
      "Ordenalos de más a menos probable que acepte una apuesta absurda.",
      "Ordenalos de más a menos probable que pierda un vuelo por quedarse dormido.",
      "Ordenalos de más a menos probable que empiece una discusión con un desconocido.",
      "Ordenalos de más a menos probable que termine viral en TikTok."
    ],
    duo: [
      "Si los dos tuvieran que abrir un negocio absurdo juntos, ¿qué elegirían?",
      "¿Quién sobreviviría más tiempo en un apocalipsis?",
      "¿Quién gastaría primero un premio inesperado?",
      "¿Quién se rendiría primero en un viaje sin planificación?"
    ],
    one_vs_all: [
      "Si tuvieras que cambiar tu nombre mañana, ¿qué elegirías?",
      "¿Qué habilidad inútil te gustaría dominar perfectamente?",
      "¿Qué famoso sería el peor compañero de departamento?",
      "¿Qué ley absurda crearías por un solo día?"
    ],
    missions: [
      "Conseguí que tres personas hagan exactamente el mismo gesto.",
      "Lográ que alguien empiece a cantar.",
      "Conseguí que una persona te dé algo de comer sin pedírselo directamente.",
      "Hacé que alguien diga “esto es cualquiera”.",
      "Lográ que dos personas cambien de asiento.",
      "Conseguí que alguien improvise un brindis.",
      "Hacé que alguien muestre una foto vieja de su celular.",
      "Conseguí que el grupo vote algo sin mencionar que forma parte de tu misión."
    ]
  },

  canceladisimos: {
    prep_story: [
      "Contá una opinión impopular tuya que casi nunca decís en voz alta.",
      "Contá una costumbre social que todo el mundo parece aceptar y a vos te parece ridícula.",
      "Contá una vez en la que defendiste una opinión y después te arrepentiste.",
      "Contá algo muy popular que a vos te parece sobrevalorado.",
      "Contá una opinión tuya que sabés que dividiría al grupo.",
      "Contá una regla social que romperías si no existiera ninguna consecuencia.",
      "Contá una pequeña hipocresía propia que estés dispuesto a admitir.",
      "Contá una postura que tenías hace años y hoy te da vergüenza."
    ],
    majority: [
      "¿Quién tiene más opiniones que no diría delante de desconocidos?",
      "¿Quién sería más probable que discuta una opinión impopular durante una hora?",
      "¿Quién tiene más chances de ser malinterpretado por algo que diga?",
      "¿Quién podría defender mejor una postura con la que ni siquiera está de acuerdo?",
      "¿Quién es más probable que cambie de opinión después de una buena discusión?",
      "¿Quién tiene menos filtro cuando entra en confianza?",
      "¿Quién sería más probable que publique algo y después lo borre?",
      "¿Quién tiene la opinión más distinta al resto del grupo sobre casi todo?"
    ],
    hot_seat: [
      "¿Es peor ser hipócrita o ser brutalmente sincero?",
      "¿Preferís que tus amigos te digan siempre la verdad aunque duela o que a veces te protejan?",
      "¿Separás completamente la obra de la persona que la creó?",
      "¿Está bien dejar de hablarle a alguien sin explicaciones si ya no querés ese vínculo?",
      "¿Es peor traicionar una amistad o traicionar tus propios valores para conservarla?",
      "¿Preferís caer mal diciendo lo que pensás o caer bien callándotelo?",
      "¿La gente merece siempre una segunda oportunidad?",
      "¿Está bien revisar el celular de tu pareja si tenés una sospecha muy fuerte?"
    ],
    rank: [
      "Ordenalos de más a menos probable que diga algo incómodo en una cena.",
      "Ordenalos de más a menos políticamente incorrecto dentro de este grupo.",
      "Ordenalos de más a menos probable que sostenga una opinión aunque todos estén en contra.",
      "Ordenalos de más a menos probable que borre un mensaje después de mandarlo.",
      "Ordenalos de más a menos probable que cambie de opinión durante una discusión.",
      "Ordenalos de más a menos probable que tenga una opinión secreta muy distinta a lo que muestra."
    ],
    duo: [
      "¿Qué tema cree el otro que genera más discusiones innecesarias?",
      "¿Qué tolera menos el otro: hipocresía, arrogancia, mentira o victimismo?",
      "¿El otro prefiere sinceridad total o cuidar las formas?",
      "¿Qué opinión del otro creés que sorprendería más al grupo?",
      "¿El otro cambiaría una opinión fuerte para evitar perder una amistad?",
      "¿Qué le molesta más al otro: que lo contradigan o que no lo escuchen?"
    ],
    one_vs_all: [
      "¿Qué cosa muy popular te parece totalmente sobrevalorada?",
      "¿Qué comportamiento social te molesta aunque para otros sea normal?",
      "¿Qué verdad incómoda pensás que la mayoría de la gente evita admitir?",
      "¿Preferís ser respetado o querido?",
      "¿Qué es peor: mentir para no lastimar o decir una verdad solo para descargarla?",
      "¿Qué opinión tuya genera más desacuerdo cuando la decís?"
    ],
    missions: [
      "Conseguí que alguien diga “eso no se puede decir” sin pedírselo directamente.",
      "Lográ que dos personas del grupo defiendan posiciones opuestas sobre un tema trivial.",
      "Conseguí que alguien admita que cambió de opinión sobre algo importante.",
      "Hacé que alguien diga qué cosa popular considera sobrevalorada.",
      "Conseguí que alguien diga “depende” tres veces durante una discusión.",
      "Lográ que alguien admita una pequeña hipocresía propia."
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
