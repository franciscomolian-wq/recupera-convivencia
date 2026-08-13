/* =================================================================
   RECUPERA CONVIVENCIA — MOTOR
   Fechas/plazos, construcción de casos, analizador de texto libre
   y utilidades de exportar / importar.
   ================================================================= */
import { CASE_TYPES } from "./data.js";

/* ----------------------------- FECHAS ----------------------------- */
export function addBusinessDays(startDate, days) {
  const d = new Date(startDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export function fmt(date) {
  return new Date(date).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysLeft(dueDate) {
  const today = new Date();
  return Math.ceil((new Date(dueDate) - today) / (1000 * 60 * 60 * 24));
}

export function urgencyColor(dl, C) {
  if (dl < 0) return C.urgent;
  if (dl <= 3) return C.warn;
  return C.ok;
}

/* --------------------------- CASOS -------------------------------- */
export function buildCase(id, typeKey, studentLabel, startOffsetDays, currentStepIdx, apoderadoEmail, extra = {}, overrideSteps = null) {
  const type = CASE_TYPES[typeKey];
  const start = new Date();
  start.setDate(start.getDate() - startOffsetDays);
  // Si el establecimiento tiene un protocolo propio para este tipo, se usa;
  // si no, se usa la plantilla normativa nacional (CASE_TYPES).
  const baseSteps = (overrideSteps && overrideSteps.length) ? overrideSteps : type.steps;
  // Salvaguarda: los plazos nunca decrecen entre pasos → el paso a paso
  // queda siempre en orden cronológico aunque un dato venga mal cargado.
  let accDays = 0;
  const steps = baseSteps.map((s, i) => {
    accDays = Math.max(accDays, s.days);
    return {
      ...s,
      id: i,
      due: addBusinessDays(start, accDays),
      done: i < currentStepIdx,
      evidence: [],
    };
  });
  return {
    id, typeKey, type, studentLabel, start, steps, currentStepIdx,
    apoderadoEmail, notifiedApoderado: currentStepIdx > 0,
    derivations: [],
    autoEmails: false,
    closed: false, closedAt: null, closeSummary: "",
    log: [{ at: start, who: "Coordinador de Convivencia", text: "Caso creado a partir del relato inicial." }],
    ...extra,
  };
}

/* ------------------- ANALIZADOR DE TEXTO LIBRE --------------------
   Heurística de palabras clave: puntúa cada tipo de caso contra el
   relato y devuelve el mejor calce + alternativas. Simula el análisis
   que en producción haría un modelo de lenguaje sobre la normativa.
   ------------------------------------------------------------------ */
export function analyzeSituation(text) {
  const t = (text || "").toLowerCase();
  const scores = Object.entries(CASE_TYPES).map(([key, v]) => {
    let score = 0;
    const matched = [];
    for (const kw of v.keywords) {
      if (t.includes(kw)) {
        score += kw.split(" ").length > 1 ? 3 : 2;
        matched.push(kw);
      }
    }
    return { key, label: v.label, score, matched, network: v.network };
  });
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const alternatives = scores.filter((s) => s.score > 0 && s.key !== best.key).slice(0, 2);
  return {
    hasMatch: best.score > 0,
    best,
    alternatives,
    confidence: best.score >= 6 ? "alta" : best.score >= 3 ? "media" : "baja",
  };
}

/* --------------------- EXPORTAR / IMPORTAR ------------------------ */
export function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `recupera-convivencia-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)); }
      catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function printView() {
  window.print();
}

/* ------------------- LINEAMIENTO POR PASO -------------------------
   Devuelve una orientación breve ("qué hacer") según el paso, para
   que el paso a paso entregue lineamientos claros desde el paso 1.
   ------------------------------------------------------------------ */
export function stepHint(title = "") {
  const t = title.toLowerCase();
  if (t.includes("acogida") || t.includes("registro")) return "Deja constancia escrita, con fecha y hora. Reserva la identidad de quien denuncia.";
  if (t.includes("riesgo") || t.includes("resguardo") || t.includes("cautelar")) return "Evalúa riesgo inmediato y aplica medidas de protección proporcionales mientras dura el proceso.";
  if (t.includes("denuncia") && (t.includes("carabineros") || t.includes("fiscalía"))) return "Denuncia obligatoria dentro de 24 h. Guarda copia del parte o comprobante.";
  if (t.includes("investigación") || t.includes("protocolo")) return "Designa responsable imparcial. Registra cada actuación y respeta el debido proceso.";
  if (t.includes("entrevista")) return "Cita por escrito. Usa el formato de entrevista y adjunta el acta firmada.";
  if (t.includes("informe")) return "Sistematiza antecedentes y evidencias. Propón medidas formativas y/o disciplinarias fundadas.";
  if (t.includes("comisión")) return "Convoca a la comisión exigida por ley antes de expulsar o cancelar matrícula.";
  if (t.includes("resolución") || t.includes("notificación")) return "Notifica por escrito a la familia e informa el plazo y la vía de apelación.";
  if (t.includes("comunicación") || t.includes("superintendencia") || t.includes("junji")) return "Informa a la autoridad correspondiente y adjunta el comprobante de envío.";
  if (t.includes("derivación") || t.includes("red")) return "Selecciona la red pertinente y envía la derivación con los antecedentes reservados.";
  if (t.includes("acompañamiento") || t.includes("psicosocial")) return "Coordina apoyo del equipo psicosocial y registra las sesiones de acompañamiento.";
  if (t.includes("seguimiento") || t.includes("cierre") || t.includes("monitoreo")) return "Verifica el cumplimiento de las medidas y deja registro del cierre.";
  return "Documenta la actuación y adjunta la evidencia que respalde este paso.";
}

/* --------------------- RELLENO DE PLANTILLA ----------------------- */
export function fillTemplate(text, c) {
  const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
  return (text || "")
    .replaceAll("{ID}", c.id)
    .replaceAll("{ETAPA}", step.title)
    .replaceAll("{ESTUDIANTE}", c.studentLabel || "—");
}

/* ----------------------- FORMATO UF / CLP ------------------------- */
export function fmtUF(n) {
  return `${(Math.round(n * 100) / 100).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
}

export function fmtCLP(clp) {
  return Math.round(clp).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

/* Calcula la facturación de un establecimiento */
export function billing(e) {
  const total = (e.students || 0) * (e.ufPerStudent || 0);
  const paid = e.paidUF || 0;
  const owed = Math.max(0, total - paid);
  const status = total === 0 ? "sin tarifa" : owed <= 0.001 ? "pagado" : paid <= 0.001 ? "adeudado" : "parcial";
  return { total, paid, owed, status };
}

/* ------------------------- EXPORTAR EXCEL ------------------------- */
/* Genera un .xls (tabla HTML que Excel abre nativamente) sin librerías. */
export function exportExcel(rows, filename, title) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const thead = `<tr>${headers.map((h) => `<th style="background:#0E6C5A;color:#fff;text-align:left">${esc(h)}</th>`).join("")}</tr>`;
  const tbody = rows.map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${title ? `<h3>${esc(title)}</h3>` : ""}<table border="1">${thead}${tbody}</table></body></html>`;
  const blob = new Blob(["﻿" + html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "reporte.xls";
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------- EXPORTAR CSV --------------------------- */
export function exportCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "reporte.csv";
  a.click();
  URL.revokeObjectURL(url);
}
