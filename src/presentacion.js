// Presentación automática de convivencia escolar.
//
// Arma un .pptx desde las cifras del establecimiento, para la cuenta pública, el Consejo
// Escolar y el sostenedor.
//
// DOS REGLAS QUE NO SE NEGOCIAN:
//
//  1. SOLO AGREGADOS. Nada de nombres, RUN ni relatos. El endpoint tampoco los entrega. Un
//     PPT circula por correo y no se puede retirar una vez enviado.
//
//  2. NO SE MAQUILLA EL VACÍO. Si el establecimiento no registró casos, la presentación lo
//     dice con todas sus letras en vez de dibujar gráficos en cero. Un gráfico vacío se lee
//     como «no pasó nada»; el texto explica que no se registró, que es distinto.
//
// pptxgenjs se carga con import dinámico para que no entre al bundle principal: pesa más que
// media aplicación y solo hace falta cuando alguien genera una presentación.

const AZUL = "1D4E89";
const TINTA = "16212E";
const SUAVE = "63758A";
const LINEA = "D3DBE4";
const OK = "1A6349";
const ALERTA = "A32019";
const AVISO = "8A5B00";
const PAPEL = "FFFFFF";
const FONDO = "F4F6F8";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const mesCorto = (clave) => {
  const [a, m] = String(clave).split("-");
  return MESES[Number(m) - 1] + " " + String(a).slice(2);
};

export async function generarPresentacion(datos, etiquetaTipo) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const p = new PptxGenJS();
  p.layout = "LAYOUT_16x9";
  p.author = "Recupera Convivencia";
  p.title = "Convivencia escolar · " + datos.establecimiento.nombre;

  const hoy = new Date();
  const fechaLarga = hoy.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  // Cabecera común de las láminas interiores.
  const cabecera = (s, titulo) => {
    s.addText(titulo, { x: 0.55, y: 0.38, w: 8.4, h: 0.5, fontSize: 24, bold: true, color: TINTA });
    s.addShape(p.ShapeType.line, { x: 0.55, y: 0.95, w: 8.9, h: 0, line: { color: LINEA, width: 1 } });
    s.addText(datos.establecimiento.nombre, {
      x: 0.55, y: 5.05, w: 6, h: 0.3, fontSize: 9, color: SUAVE,
    });
    s.addText(fechaLarga, { x: 6.5, y: 5.05, w: 2.95, h: 0.3, fontSize: 9, color: SUAVE, align: "right" });
  };

  // Ficha de cifra grande.
  const cifra = (s, x, y, valor, rotulo, color) => {
    s.addShape(p.ShapeType.rect, { x, y, w: 2.05, h: 1.35, fill: { color: FONDO }, line: { color: LINEA, width: 1 } });
    s.addShape(p.ShapeType.rect, { x, y, w: 0.045, h: 1.35, fill: { color: color || SUAVE } });
    s.addText(String(valor), { x: x + 0.18, y: y + 0.15, w: 1.8, h: 0.6, fontSize: 30, bold: true, color: color || TINTA });
    s.addText(rotulo, { x: x + 0.18, y: y + 0.76, w: 1.8, h: 0.5, fontSize: 9.5, color: SUAVE });
  };

  // ---------------------------------------------------------------- Portada
  const portada = p.addSlide();
  portada.background = { color: PAPEL };
  portada.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 0.22, h: 5.63, fill: { color: AZUL } });

  if (datos.establecimiento.insignia) {
    try {
      // Se pasa sin el prefijo "data:" porque es la forma documentada de pptxgenjs;
      // acepta ambas, y verificado quedó incrustada como ppt/media/image-1-1.png.
      portada.addImage({
        data: datos.establecimiento.insignia.replace(/^data:/, ""),
        x: 0.75, y: 0.75, w: 1.1, h: 1.1,
        sizing: { type: "contain", w: 1.1, h: 1.1 },
      });
    } catch (e) {
      // No se traga el error: si la insignia no entra, quien genera el informe debe saberlo.
      console.error("[presentacion] no se pudo incrustar la insignia:", e?.message);
    }
  }

  const yTitulo = datos.establecimiento.insignia ? 2.15 : 1.35;
  portada.addText("Convivencia escolar", { x: 0.75, y: yTitulo, w: 8.2, h: 0.7, fontSize: 34, bold: true, color: TINTA });
  portada.addText(datos.establecimiento.nombre, { x: 0.75, y: yTitulo + 0.72, w: 8.2, h: 0.5, fontSize: 19, color: AZUL });
  portada.addText(
    (datos.establecimiento.rbd ? "RBD " + datos.establecimiento.rbd + "  ·  " : "") + fechaLarga,
    { x: 0.75, y: yTitulo + 1.24, w: 8.2, h: 0.35, fontSize: 12, color: SUAVE },
  );
  portada.addText("Informe generado desde la plataforma · cifras agregadas, sin datos de estudiantes", {
    x: 0.75, y: 4.95, w: 8.2, h: 0.35, fontSize: 9.5, color: SUAVE, italic: true,
  });

  // ------------------------------------------------------- Matrícula y base
  const s1 = p.addSlide();
  cabecera(s1, "El establecimiento");
  cifra(s1, 0.55, 1.25, datos.matricula.total, "Estudiantes en la plataforma", AZUL);
  cifra(s1, 2.85, 1.25, datos.matricula.conNee, "Con necesidades educativas especiales", SUAVE);
  cifra(s1, 5.15, 1.25, datos.situacionesRegistradas, "Situaciones registradas", OK);
  cifra(s1, 7.45, 1.25, datos.matricula.sinCorreoApoderado, "Sin correo de apoderado", datos.matricula.sinCorreoApoderado > 0 ? ALERTA : OK);

  if (datos.matricula.sinCorreoApoderado > 0) {
    const pct = Math.round((100 * datos.matricula.sinCorreoApoderado) / Math.max(1, datos.matricula.total));
    s1.addText(
      [
        { text: "Punto a mejorar. ", options: { bold: true, color: ALERTA } },
        { text: `El ${pct}% de los estudiantes no tiene registrado el correo de su apoderado. Sin ese dato no es posible enviar el aviso de tratamiento de datos, las citaciones por enlace ni los reconocimientos, y esas familias no pueden tener cuenta en la plataforma.`, options: { color: TINTA } },
      ],
      { x: 0.55, y: 3.0, w: 8.9, h: 0.9, fontSize: 12 },
    );
  }

  // ------------------------------------------------------------------ Casos
  if (!datos.casos) {
    const sx = p.addSlide();
    cabecera(sx, "Casos de convivencia");
    sx.addText("Este informe no incluye las cifras de casos porque el perfil que lo generó no tiene acceso al módulo de casos de convivencia.", {
      x: 0.55, y: 1.4, w: 8.9, h: 1, fontSize: 13, color: TINTA,
    });
  } else if (datos.casos.total === 0) {
    // No se dibujan gráficos en cero: se explica.
    const sx = p.addSlide();
    cabecera(sx, "Casos de convivencia");
    sx.addShape(p.ShapeType.rect, { x: 0.55, y: 1.3, w: 8.9, h: 2.6, fill: { color: "FBF1DE" } });
    sx.addShape(p.ShapeType.rect, { x: 0.55, y: 1.3, w: 0.045, h: 2.6, fill: { color: AVISO } });
    sx.addText("No hay casos de convivencia registrados en la plataforma.", {
      x: 0.85, y: 1.55, w: 8.3, h: 0.45, fontSize: 17, bold: true, color: AVISO,
    });
    sx.addText(
      "Eso no significa que no hayan ocurrido situaciones de convivencia: significa que no se registraron aquí. " +
      "Un informe que dibujara gráficos en cero daría a entender lo primero, y no sería cierto.\n\n" +
      "Para que este informe tenga contenido, el equipo necesita registrar lo que ocurre. La vía más liviana es " +
      "«Registrar situación» en Cursos: tres campos, sin tipificación legal y sin plazos corriendo. " +
      "Los casos formales se abren solo cuando el hecho lo amerita.",
      { x: 0.85, y: 2.1, w: 8.3, h: 1.7, fontSize: 12, color: TINTA, lineSpacingMultiple: 1.25 },
    );
  } else {
    const c = datos.casos;

    // Resumen
    const s2 = p.addSlide();
    cabecera(s2, "Casos de convivencia");
    cifra(s2, 0.55, 1.25, c.total, "Casos registrados", AZUL);
    cifra(s2, 2.85, 1.25, c.abiertos, "Abiertos", c.abiertos > 0 ? AVISO : OK);
    cifra(s2, 5.15, 1.25, c.vencidos, "Con plazo vencido", c.vencidos > 0 ? ALERTA : OK);
    cifra(s2, 7.45, 1.25, c.cerrados, "Cerrados", OK);

    const cumplimiento = c.total ? Math.round((100 * (c.total - c.vencidos)) / c.total) : 100;
    s2.addText(
      [
        { text: "Cumplimiento de plazos: ", options: { color: SUAVE } },
        { text: cumplimiento + "%", options: { bold: true, color: cumplimiento >= 90 ? OK : cumplimiento >= 70 ? AVISO : ALERTA } },
        { text: `  ·  ${c.total - c.vencidos} de ${c.total} casos dentro de plazo.`, options: { color: TINTA } },
      ],
      { x: 0.55, y: 2.95, w: 8.9, h: 0.4, fontSize: 13 },
    );

    if (c.riesgoVital > 0) {
      s2.addShape(p.ShapeType.rect, { x: 0.55, y: 3.5, w: 8.9, h: 0.75, fill: { color: "FBEBE9" } });
      s2.addShape(p.ShapeType.rect, { x: 0.55, y: 3.5, w: 0.045, h: 0.75, fill: { color: ALERTA } });
      s2.addText(
        [
          { text: "Situaciones críticas: ", options: { bold: true, color: ALERTA } },
          { text: `${c.riesgoVital} caso(s) de riesgo vital o salud mental en el periodo. Cada uno activó la alerta inmediata a Orientación, PIE, Dirección y Coordinación.`, options: { color: TINTA } },
        ],
        { x: 0.85, y: 3.65, w: 8.3, h: 0.5, fontSize: 11.5 },
      );
    }

    // Por tipo
    if (c.porTipo.length) {
      const s3 = p.addSlide();
      cabecera(s3, "Tipos de situación más frecuentes");
      s3.addChart(p.ChartType.bar, [{
        name: "Casos",
        labels: c.porTipo.slice(0, 8).map(([k]) => etiquetaTipo(k)),
        values: c.porTipo.slice(0, 8).map(([, v]) => v),
      }], {
        x: 0.55, y: 1.2, w: 8.9, h: 3.6, barDir: "bar",
        chartColors: [AZUL], showValue: true, dataLabelColor: TINTA, dataLabelFontSize: 10,
        catAxisLabelFontSize: 10, valAxisLabelFontSize: 9, showLegend: false,
        valAxisMajorUnit: 1, valGridLine: { style: "dash", color: LINEA },
      });
    }

    // Por curso
    if (c.porCurso.length) {
      const s4 = p.addSlide();
      cabecera(s4, "Cursos con más casos");
      s4.addChart(p.ChartType.bar, [{
        name: "Casos",
        labels: c.porCurso.slice(0, 10).map(([k]) => k),
        values: c.porCurso.slice(0, 10).map(([, v]) => v),
      }], {
        x: 0.55, y: 1.2, w: 8.9, h: 3.1, barDir: "col",
        chartColors: [AZUL], showValue: true, dataLabelColor: TINTA, dataLabelFontSize: 10,
        catAxisLabelFontSize: 10, valAxisLabelFontSize: 9, showLegend: false,
        valAxisMajorUnit: 1, valGridLine: { style: "dash", color: LINEA },
      });
      const [curso, n] = c.porCurso[0];
      s4.addText(
        `El curso con más casos es ${curso}, con ${n}. Concentrar la mirada en un curso permite intervenir el clima del grupo y no solo los hechos individuales.`,
        { x: 0.55, y: 4.4, w: 8.9, h: 0.5, fontSize: 11, color: SUAVE },
      );
    }

    // Tendencia
    const s5 = p.addSlide();
    cabecera(s5, "Evolución en el tiempo");
    s5.addChart(p.ChartType.line, [{
      name: "Casos abiertos en el mes",
      labels: c.tendencia.map((m) => mesCorto(m.mes)),
      values: c.tendencia.map((m) => m.total),
    }], {
      x: 0.55, y: 1.2, w: 8.9, h: 3.1,
      chartColors: [AZUL], lineDataSymbol: "circle", lineSize: 3,
      catAxisLabelFontSize: 10, valAxisLabelFontSize: 9, showLegend: false,
      valAxisMajorUnit: 1, valGridLine: { style: "dash", color: LINEA },
    });
    s5.addText("Últimos seis meses, según la fecha en que se registró cada caso.", {
      x: 0.55, y: 4.4, w: 8.9, h: 0.4, fontSize: 11, color: SUAVE,
    });

    // Medidas
    const s6 = p.addSlide();
    cabecera(s6, "Medidas y seguimiento");
    cifra(s6, 0.55, 1.25, c.medidas.total, "Medidas registradas", AZUL);
    cifra(s6, 2.85, 1.25, c.medidas.cumplidas, "Cumplidas con evidencia", OK);
    cifra(s6, 5.15, 1.25, c.medidas.pendientes, "Pendientes", c.medidas.pendientes > 0 ? AVISO : OK);
    s6.addText(
      "La Ley 21.809 exige poder demostrar el cumplimiento de las medidas. En la plataforma, marcar una medida como cumplida obliga a registrar la evidencia que lo respalda.",
      { x: 0.55, y: 3.0, w: 8.9, h: 0.7, fontSize: 12, color: TINTA },
    );
  }

  // ------------------------------------------------------- Puntos a mejorar
  const sm = p.addSlide();
  cabecera(sm, "Puntos a mejorar");
  const puntos = [];
  if (datos.matricula.sinCorreoApoderado > 0) {
    puntos.push(`Cargar el correo de apoderado de ${datos.matricula.sinCorreoApoderado} estudiante(s). Es lo que habilita el aviso de tratamiento, el consentimiento y las citaciones por enlace.`);
  }
  if (datos.casos && datos.casos.vencidos > 0) {
    puntos.push(`Regularizar ${datos.casos.vencidos} caso(s) con plazo vencido. Los plazos de los protocolos son legales y su incumplimiento es fiscalizable.`);
  }
  if (datos.casos && datos.casos.medidas.pendientes > 0) {
    puntos.push(`Cerrar el seguimiento de ${datos.casos.medidas.pendientes} medida(s) pendiente(s), registrando la evidencia de su cumplimiento.`);
  }
  if (datos.casos && datos.casos.total === 0) {
    puntos.push("Instalar el registro cotidiano de situaciones. Sin registro no hay historial, y sin historial no se puede demostrar el trabajo realizado ni detectar patrones a tiempo.");
  }
  if (datos.situacionesRegistradas === 0) {
    puntos.push("Dar a conocer «Registrar situación» al cuerpo docente. Es la vía liviana para dejar constancia de lo cotidiano sin abrir un procedimiento formal.");
  }
  if (!puntos.length) puntos.push("No se detectan puntos críticos en el periodo. Mantener el registro al día.");

  sm.addText(
    puntos.map((x) => ({ text: x, options: { bullet: { code: "2022" }, breakLine: true, paraSpaceAfter: 10 } })),
    { x: 0.55, y: 1.25, w: 8.9, h: 3.5, fontSize: 12.5, color: TINTA, lineSpacingMultiple: 1.2 },
  );

  // ------------------------------------------------------------------ Cierre
  const sc = p.addSlide();
  sc.background = { color: FONDO };
  sc.addText("Sobre este informe", { x: 0.75, y: 1.0, w: 8.4, h: 0.5, fontSize: 22, bold: true, color: TINTA });
  sc.addText(
    "Generado automáticamente desde Recupera Convivencia con la información registrada por el establecimiento a la fecha indicada.\n\n" +
    "Contiene únicamente cifras agregadas. No incluye nombres, RUN ni relatos de estudiantes, y no debe complementarse con ellos: este documento está pensado para circular.\n\n" +
    "Los antecedentes individuales que respaldan estas cifras están en la plataforma, accesibles solo para los perfiles autorizados por el establecimiento.",
    { x: 0.75, y: 1.7, w: 8.4, h: 2.4, fontSize: 12.5, color: TINTA, lineSpacingMultiple: 1.3 },
  );
  sc.addText(`Generado por ${datos.generadoPor} · ${fechaLarga}`, {
    x: 0.75, y: 4.6, w: 8.4, h: 0.35, fontSize: 10, color: SUAVE,
  });

  const nombre = "convivencia-" +
    datos.establecimiento.nombre.normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) +
    "-" + hoy.toISOString().slice(0, 10) + ".pptx";

  await p.writeFile({ fileName: nombre });
  return nombre;
}
