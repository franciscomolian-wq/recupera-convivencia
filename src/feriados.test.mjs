// Pruebas del cálculo de feriados y días hábiles. Offline, sin red ni base.
//
// Se contrastan contra la lista oficial publicada en feriadoschilenos.cl para
// 2026 y 2027, que son los años que cubren los traslados por ley: en 2026 el
// 29 de junio y el 12 de octubre caen lunes (no se mueven) y en 2027 caen
// martes (sí se mueven). Si alguien toca las reglas, esto lo detecta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { feriadosNacionales, domingoDePascua, setDeFeriados } from "./feriados.js";
import { addBusinessDays, esHabil, configurarFeriados } from "./engine.js";

// Solo los feriados NACIONALES. No incluye los regionales (Arica, Chillán) ni
// los de ley especial de un año, que se cargan a mano desde Configuración.
const OFICIAL = {
  2026: [
    "2026-01-01", "2026-04-03", "2026-04-04", "2026-05-01", "2026-05-21",
    "2026-06-21", "2026-06-29", "2026-07-16", "2026-08-15", "2026-09-18",
    "2026-09-19", "2026-10-12", "2026-10-31", "2026-11-01", "2026-12-08", "2026-12-25",
  ],
  2027: [
    "2027-01-01", "2027-03-26", "2027-03-27", "2027-05-01", "2027-05-21",
    "2027-06-21", "2027-06-28", "2027-07-16", "2027-08-15", "2027-09-18",
    "2027-09-19", "2027-10-11", "2027-10-31", "2027-11-01", "2027-12-08", "2027-12-25",
  ],
};

for (const anio of [2026, 2027]) {
  test(`los feriados nacionales de ${anio} coinciden con el calendario oficial`, () => {
    const calculados = feriadosNacionales(anio).map((f) => f.fecha);
    assert.deepEqual(calculados, OFICIAL[anio]);
  });
}

test("Semana Santa se deriva de la Pascua", () => {
  assert.equal(domingoDePascua(2026).toISOString().slice(0, 10), "2026-04-05");
  assert.equal(domingoDePascua(2027).toISOString().slice(0, 10), "2027-03-28");
});

test("Ley 19.668: 29 de junio y 12 de octubre se trasladan al lunes", () => {
  const f = (a) => feriadosNacionales(a).map((x) => x.fecha);
  // 2027: el 29/06 cae martes -> lunes 28; el 12/10 cae martes -> lunes 11.
  assert.ok(f(2027).includes("2027-06-28"), "San Pedro y San Pablo trasladado");
  assert.ok(!f(2027).includes("2027-06-29"), "y ya no está en su fecha nominal");
  assert.ok(f(2027).includes("2027-10-11"), "Encuentro de Dos Mundos trasladado");
  // 2026: ambos caen lunes -> se quedan donde están.
  assert.ok(f(2026).includes("2026-06-29"));
  assert.ok(f(2026).includes("2026-10-12"));
});

test("Ley 20.299: el 31 de octubre se mueve solo si cae martes o miércoles", () => {
  // 2028: el 31/10 cae martes -> viernes anterior, 27/10.
  const f2028 = feriadosNacionales(2028).map((x) => x.fecha);
  assert.ok(f2028.includes("2028-10-27"), "martes -> viernes anterior");
  // 2029: el 31/10 cae miércoles -> viernes siguiente, 02/11.
  const f2029 = feriadosNacionales(2029).map((x) => x.fecha);
  assert.ok(f2029.includes("2029-11-02"), "miércoles -> viernes siguiente");
  // 2026: cae sábado -> se queda.
  assert.ok(feriadosNacionales(2026).map((x) => x.fecha).includes("2026-10-31"));
});

test("un día hábil no es fin de semana ni feriado", () => {
  configurarFeriados();
  assert.equal(esHabil("2026-09-18T12:00:00"), false, "Independencia");
  assert.equal(esHabil("2026-09-19T12:00:00"), false, "Glorias del Ejército");
  assert.equal(esHabil("2026-09-20T12:00:00"), false, "domingo");
  assert.equal(esHabil("2026-09-21T12:00:00"), true, "lunes hábil");
});

test("el plazo salta los feriados, no solo el fin de semana", () => {
  configurarFeriados();
  // Martes 15/09/2026 + 3 hábiles: miércoles 16, jueves 17, y como el 18 y 19
  // son feriados y el 20 es domingo, el tercero cae el lunes 21.
  const d = addBusinessDays(new Date(2026, 8, 15), 3);
  assert.equal(d.toISOString().slice(0, 10), "2026-09-21");
});

test("Semana Santa también corre el vencimiento", () => {
  configurarFeriados();
  // Miércoles 01/04/2026 + 2 hábiles: el jueves 2 cuenta, y el viernes 3 y
  // sábado 4 son feriados, así que el segundo cae el lunes 6.
  const d = addBusinessDays(new Date(2026, 3, 1), 2);
  assert.equal(d.toISOString().slice(0, 10), "2026-04-06");
});

test("sin feriados de por medio se comporta como antes", () => {
  configurarFeriados();
  const d = addBusinessDays(new Date(2026, 10, 9), 5); // lunes 09/11/2026
  assert.equal(d.toISOString().slice(0, 10), "2026-11-16");
});

test("los feriados propios del establecimiento también cuentan", () => {
  configurarFeriados({ extra: [{ fecha: "2026-11-11", nombre: "Feriado regional de prueba" }] });
  assert.equal(esHabil("2026-11-11T12:00:00"), false);
  const d = addBusinessDays(new Date(2026, 10, 10), 1); // martes 10 -> salta el 11
  assert.equal(d.toISOString().slice(0, 10), "2026-11-12");
  configurarFeriados(); // se restaura para no afectar a otras pruebas
});

test("se puede descartar un feriado que no aplica", () => {
  configurarFeriados({ quitar: ["2026-06-21"] });
  assert.equal(esHabil("2026-06-22T12:00:00"), true);
  const s = setDeFeriados(2026, [], ["2026-06-21"]);
  assert.equal(s.has("2026-06-21"), false);
  configurarFeriados();
});

test("addBusinessDays no se cuelga si la lista de feriados es absurda", () => {
  // Salvaguarda: con todo el año marcado como feriado, debe cortar por el tope
  // de iteraciones en vez de girar para siempre.
  const todos = [];
  for (let i = 0; i < 400; i++) {
    const d = new Date(2026, 0, 1 + i);
    todos.push({ fecha: d.toISOString().slice(0, 10), nombre: "x" });
  }
  configurarFeriados({ extra: todos });
  const inicio = Date.now();
  const d = addBusinessDays(new Date(2026, 0, 1), 5);
  assert.ok(Date.now() - inicio < 2000, "termina rápido");
  assert.ok(d instanceof Date);
  configurarFeriados();
});
