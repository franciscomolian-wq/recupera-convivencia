/* ==========================================================================
   FERIADOS LEGALES DE CHILE
   ==========================================================================
   Los plazos de los protocolos se cuentan en días hábiles. Hasta ahora el
   cálculo solo saltaba sábados y domingos, así que un plazo legal podía vencer
   en un feriado — y frente a una fiscalización eso juega en contra del colegio.

   Qué se calcula aquí y qué no, a propósito:

   SÍ, porque la regla es determinista y verificable:
     · Los feriados de fecha fija.
     · Viernes y Sábado Santo (se derivan de la Pascua).
     · Los tres feriados con traslado por ley (29 junio, 12 octubre, 31 octubre).

   NO, porque no se pueden deducir de una fórmula:
     · Feriados REGIONALES (7 de junio en Arica y Parinacota, 20 de agosto en
       Chillán y Chillán Viejo). Dependen de dónde esté el establecimiento.
     · Feriados por ley especial de un solo año (elecciones, censos, y casos
       como el "San Viernes" del 17 de septiembre de 2027).
   Esos se agregan a mano desde Configuración.

   Criterio ante la duda: es preferible OMITIR un feriado que inventarlo.
   Omitirlo adelanta el vencimiento —el colegio actúa antes, va a favor—;
   inventarlo lo atrasa, y eso sí puede significar incumplir un plazo legal.
   ========================================================================== */

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

// Domingo de Pascua (algoritmo de Gauss/Meeus para el calendario gregoriano).
export function domingoDePascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

// Ley 19.668: el 29 de junio y el 12 de octubre se trasladan al lunes de esa
// semana si caen martes, miércoles o jueves; al lunes de la semana siguiente si
// caen viernes. Si caen lunes, sábado o domingo, se quedan donde están.
function trasladoLunes(fecha) {
  const dia = fecha.getDay(); // 0 domingo … 6 sábado
  const d = new Date(fecha);
  if (dia >= 2 && dia <= 4) d.setDate(d.getDate() - (dia - 1));      // martes a jueves
  else if (dia === 5) d.setDate(d.getDate() + 3);                    // viernes
  return d;
}

// Ley 20.299: el 31 de octubre se traslada al viernes anterior si cae martes, y
// al viernes siguiente si cae miércoles. En cualquier otro caso se mantiene.
function trasladoViernes(fecha) {
  const dia = fecha.getDay();
  const d = new Date(fecha);
  if (dia === 2) d.setDate(d.getDate() - 4);        // martes -> viernes anterior
  else if (dia === 3) d.setDate(d.getDate() + 2);   // miércoles -> viernes siguiente
  return d;
}

/** Feriados nacionales de un año, como [{ fecha: "YYYY-MM-DD", nombre }]. */
export function feriadosNacionales(anio) {
  const pascua = domingoDePascua(anio);
  const viernesSanto = new Date(pascua); viernesSanto.setDate(pascua.getDate() - 2);
  const sabadoSanto = new Date(pascua); sabadoSanto.setDate(pascua.getDate() - 1);

  const lista = [
    [new Date(anio, 0, 1), "Año Nuevo"],
    [viernesSanto, "Viernes Santo"],
    [sabadoSanto, "Sábado Santo"],
    [new Date(anio, 4, 1), "Día del Trabajo"],
    [new Date(anio, 4, 21), "Glorias Navales"],
    // El Día de los Pueblos Indígenas sigue al solsticio de invierno: casi
    // siempre el 21, pero algunos años cae el 20 (por ejemplo, 2024). Se ofrece
    // el 21 como valor por defecto y la pantalla de Configuración pide confirmarlo.
    [new Date(anio, 5, 21), "Día Nacional de los Pueblos Indígenas"],
    [trasladoLunes(new Date(anio, 5, 29)), "San Pedro y San Pablo"],
    [new Date(anio, 6, 16), "Virgen del Carmen"],
    [new Date(anio, 7, 15), "Asunción de la Virgen"],
    [new Date(anio, 8, 18), "Independencia Nacional"],
    [new Date(anio, 8, 19), "Glorias del Ejército"],
    [trasladoLunes(new Date(anio, 9, 12)), "Encuentro de Dos Mundos"],
    [trasladoViernes(new Date(anio, 9, 31)), "Iglesias Evangélicas y Protestantes"],
    [new Date(anio, 10, 1), "Día de Todos los Santos"],
    [new Date(anio, 11, 8), "Inmaculada Concepción"],
    [new Date(anio, 11, 25), "Navidad"],
  ];

  return lista
    .map(([f, nombre]) => ({ fecha: iso(f), nombre }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Feriados de varios años seguidos, para cubrir plazos que cruzan el año. */
export function feriadosDeRango(desde, hasta) {
  const out = [];
  for (let a = desde; a <= hasta; a++) out.push(...feriadosNacionales(a));
  return out;
}

/**
 * Conjunto de fechas "YYYY-MM-DD" no hábiles, listo para addBusinessDays.
 * `extra` son los feriados propios del establecimiento (regionales, elecciones,
 * suspensiones de clases) que se agregan desde Configuración.
 * `quitar` permite descartar uno del cálculo si no aplica.
 */
export function setDeFeriados(anioBase, extra = [], quitar = []) {
  const s = new Set(feriadosDeRango(anioBase - 1, anioBase + 1).map((f) => f.fecha));
  for (const f of extra) s.add(typeof f === "string" ? f : f.fecha);
  for (const f of quitar) s.delete(typeof f === "string" ? f : f.fecha);
  return s;
}
