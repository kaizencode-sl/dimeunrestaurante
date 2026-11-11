const hourInMadrid = new Intl.DateTimeFormat("es-ES", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: "Europe/Madrid",
})

/**
 * The question the site asks, by the time in Madrid (not the visitor's own
 * clock). Spanish hours: lunch runs from morning until late afternoon, dinner
 * after that.
 */
export function mealQuestion(now = new Date()) {
  const hour = Number(hourInMadrid.format(now))
  return hour >= 6 && hour < 17 ? "¿Dónde comemos hoy?" : "¿Dónde cenamos hoy?"
}
