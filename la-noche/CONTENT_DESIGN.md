# La Noche — diseño de contenido v0.2

## Idea central
La plataforma transforma información real de un grupo en una playlist de minijuegos sociales. Las temáticas cambian el tono y el tipo de contenido; los modos cambian la mecánica.

## Dos formas de preparar una partida
- **Jugar ahora:** todos entran, responden un set corto y se empieza.
- **Preparar para una fecha:** el host crea el evento días antes, comparte el link y cada invitado responde cuando quiere. El host ve el progreso, pero nunca las respuestas.

## Temáticas iniciales
1. Clásico
2. Profundo
3. Picante 18+
4. Parejas
5. Cumpleaños
6. Caos
7. Rompehielo

Las siguientes pueden agregarse después sin cambiar la arquitectura: Amigos de toda la vida, Viaje, Despedida, Trabajo, Familia.

## Modos
### ¿Quién fue?
Historia real de una persona. El resto adivina autor.
- Acertar: +100.
- Autor: +25 por cada jugador engañado, tope +100.

### Leé al grupo
El grupo votó antes. Durante la partida cada jugador predice la opción mayoritaria.
- Mayoría correcta: +100.

### El Mentiroso
Una afirmación es verdadera o falsa.
- Detectar correctamente: +100.
- Autor de mentira: +30 por persona engañada.

### Silla Caliente
Una persona responde primero en secreto y los demás intentan anticiparla.
- Coincidir: +100.

### Dúo
Dos personas responden sobre la otra.
- Coincidencia: +100 para cada integrante.
- El resto puede apostar a si coinciden: +50.

### Ordená al grupo
Se crea un ranking colectivo y cada persona intenta aproximarse.
- 0 a 150 según distancia al consenso.

### Todos contra uno
Una persona elige una respuesta secreta entre opciones.
- Descubrirla: +100.
- Protagonista: +30 por cada jugador que falle.

### Misión secreta
Acción que debe ocurrir naturalmente durante la reunión.
- +200 / +300 / +400 según dificultad.
- Requiere confirmación de otro jugador.
- Nunca debe implicar acciones peligrosas, invasivas, humillantes o ilegales.

## Estructura recomendada de una partida Clásica de 35–45 minutos
- 3 ¿Quién fue?
- 2 Leé al grupo
- 2 Mentiroso
- 2 Silla Caliente
- 1 Dúo
- 1 Ordená al grupo
- 1 Todos contra uno
- Misiones secretas corriendo en paralelo
- Final con ranking general y premios secundarios

## Objetivo
En las versiones competitivas gana quien acumula más puntos, pero los modos premian habilidades diferentes: conocer personas, anticipar al grupo, engañar de forma creíble y completar misiones.

Premios secundarios:
- Mejor detective
- Mejor mentiroso
- El que mejor conoce al grupo
- Más difícil de leer
- Rey/Reina de las misiones

## Modelo gratuito
La preparación es gratis. El grupo puede cargar todo el contenido y jugar **una ronda completa gratis**. Después se muestra cuántas rondas personalizadas quedaron creadas y se ofrece desbloquear el resto.

Durante desarrollo debe existir un modo de prueba que saltee el bloqueo.

## Regla importante de contenido
Una temática no es un modo. "Picante 18+" es una temática. "¿Quién fue?" es un modo. Una misma temática alimenta varios modos, lo que evita partidas repetitivas y permite sumar nuevas temáticas sin reprogramar las mecánicas.
