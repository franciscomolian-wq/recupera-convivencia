import React, { useState, useRef, useEffect } from "react";
import {
  Shield, Users, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Building2, UserCircle, Scale, Plus, X, Mail,
  LayoutGrid, Network, ClipboardCheck, Settings, FolderOpen, Bell,
  Printer, Download, Upload, LogOut, Sparkles, Paperclip,
  Send, BarChart3, Megaphone, Building, UserPlus, FileText, Trophy,
  Wallet, Coins, TrendingUp, CheckCircle, ClipboardList, Lock, CalendarClock,
  MessageSquare, Calendar, Gavel, Trash2, Puzzle, Share2,
  Inbox, Archive, PenLine, ExternalLink, Target, Menu, Camera, UploadCloud, Search, Award, Star, Medal, Heart,
} from "lucide-react";
import {
  NORMATIVA_LIBRARY, LEVELS, INSTITUTIONS, CASE_TYPES, ROLES,
  ESTABLISHMENTS, USERS, INITIAL_NOTIFICATIONS, EVIDENCE_TYPES,
  DEFAULT_EMAIL_TEMPLATES, INTERVIEW_TEMPLATES, DEFAULT_ESTABLISHMENT_DOCS,
  UF_VALUE_CLP, MONTHLY_REVENUE_UF, STUDENTS, MEASURE_TYPES,
  ANOTACION_TYPES, EVENT_TYPES, INITIAL_MESSAGES, INITIAL_EVENTS,
  GESTION_TYPES, GESTION_ESTADOS, INITIAL_GESTIONES,
  DOC_CATEGORIES, INITIAL_DOCUMENTS, PME_DIMENSIONS, INITIAL_ACCIONES,
  RECON_CATEGORIES, RECON_BADGES,
} from "./data.js";
import {
  fmt, daysLeft, urgencyColor, buildCase, analyzeSituation,
  exportJSON, importJSON, printView, stepHint, fillTemplate, exportCSV,
  fmtUF, fmtCLP, billing, exportExcel,
} from "./engine.js";
import { api, getToken, setToken } from "./api.js";

/* ---------------------------------------------------------------
   DESIGN TOKENS — se mantiene la línea actual (re-vestible con Stitch)
   ---------------------------------------------------------------- */
/* Paleta Google / Material: azul #1A73E8, rojo #D93025, amarillo, verde #1E8E3E */
const C = {
  sidebarBg: "#F8FAFD", sidebarBorder: "#E4E8EE", sidebarActive: "#E8F0FE",
  sidebarActiveBorder: "#D2E3FC", sidebarText: "#3C4043", sidebarTextSoft: "#5F6368",
  appBg: "#F1F3F4", cardBg: "#FFFFFF", cardBorder: "#DADCE0",
  paper: "#F1F3F4", paperLine: "#DADCE0", seal: "#1A73E8",
  urgent: "#D93025", warn: "#EA8600", ok: "#1E8E3E",
  ink: "#202124", text: "#3C4043", textSoft: "#5F6368",
  admin: "#1A73E8", adminSoft: "#E8F0FE", primary: "#1A73E8",
};
const serif = { fontFamily: "'Google Sans', 'Product Sans', 'Roboto', system-ui, sans-serif", fontWeight: 500 };
const mono = { fontFamily: "'Roboto Mono', ui-monospace, monospace" };
// Logo institucional (alojado en /recupera-logo.png). Reemplaza el ícono genérico.
function BrandLogo({ height = 36 }) {
  return <img src="/recupera-logo.png" alt="Recupera Convivencia" style={{ height, width: "auto", display: "block" }} />;
}

/* Avisos globales (toasts): informan al usuario cuando una acción falla o se guarda. */
const toastBus = { fns: new Set(), seq: 0, show(text, type = "error") { const t = { id: ++this.seq, text, type }; this.fns.forEach((f) => f(t)); } };
function toast(text, type) { toastBus.show(text, type); }
function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const fn = (t) => { setItems((p) => [...p, t]); setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 5200); };
    toastBus.fns.add(fn);
    return () => toastBus.fns.delete(fn);
  }, []);
  if (!items.length) return null;
  return (
    <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: "min(92vw, 380px)" }} className="print:hidden">
      {items.map((t) => (
        <div key={t.id} onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}
          style={{ background: t.type === "ok" ? C.ok : C.urgent, color: "#fff", borderRadius: 10, padding: "11px 14px", boxShadow: "0 6px 24px rgba(0,0,0,.22)", fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}>
          {t.type === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------- ADAPTADORES API ↔ UI -------------------------
   La UI trabaja con un objeto de caso "rico" (con type/steps/fechas).
   Estos adaptadores traducen desde/hacia la forma que guarda la API.
   ------------------------------------------------------------------ */
function apiCaseToUI(ac) {
  const type = CASE_TYPES[ac.typeKey] || { label: ac.typeKey, steps: [], network: [] };
  const steps = (ac.steps || []).map((s) => ({
    id: s.order, title: s.title, role: s.role, basis: s.basis, days: 0,
    due: s.due ? new Date(s.due) : new Date(ac.createdAt),
    done: !!s.done,
    evidence: (ac.evidence || []).filter((e) => e.stepOrder === s.order),
  }));
  // Bitácora persistida: se reconstruye desde los datos guardados (pasos, evidencia, derivaciones, correos, cierre).
  const log = [];
  (ac.steps || []).forEach((s) => { if (s.done && s.doneAt) log.push({ at: new Date(s.doneAt), text: `Paso completado: ${s.title}` }); });
  (ac.evidence || []).forEach((e) => log.push({ at: new Date(e.createdAt), text: `Evidencia (${e.type}): ${e.name}` }));
  (ac.derivations || []).forEach((d) => log.push({ at: new Date(d.createdAt), text: `Derivación a ${d.label} (${d.email})` }));
  (ac.emails || []).forEach((m) => log.push({ at: new Date(m.at), text: `Correo enviado${m.to ? " a " + m.to : ""}: ${m.subject || ""}` }));
  if (ac.closed && ac.closedAt) log.push({ at: new Date(ac.closedAt), text: `Caso cerrado. ${ac.closeSummary || ""}` });
  log.sort((a, b) => a.at - b.at);
  return {
    _dbId: ac.id,
    id: ac.code,
    typeKey: ac.typeKey, type,
    studentLabel: ac.studentLabel, level: ac.level || "",
    relato: ac.relato || "", curso: ac.curso || "",
    fechaHecho: ac.fechaHecho || "", hora: ac.hora || "", lugar: ac.lugar || "",
    testigos: ac.testigos || "", adultosRef: ac.adultosRef || "",
    start: new Date(ac.createdAt),
    steps, currentStepIdx: ac.currentStepIdx || 0,
    apoderadoEmail: ac.student?.apoderadoEmail || "",
    notifiedApoderado: (ac.currentStepIdx || 0) > 0,
    derivations: ac.derivations || [],
    autoEmails: !!ac.autoEmails,
    closed: !!ac.closed, closedAt: ac.closedAt, closeSummary: ac.closeSummary || "",
    studentId: ac.studentId || null,
    participants: (ac.participants || []).map((p) => ({ studentId: p.studentId, role: p.role, name: p.student?.name || "", curso: p.student?.curso || "" })),
    establishmentId: ac.establishmentId || null,
    log,
  };
}

// ¿El caso involucra a este estudiante? (principal o participante con rol)
function caseHasStudent(c, id) {
  return c.studentId === id || (c.participants || []).some((p) => p.studentId === id);
}
const ROLE_LABEL = { afectado: "Afectado/a", involucrado: "Involucrado/a", testigo: "Testigo" };

// Establecimiento de la API + estadísticas derivadas de los casos.
function apiEstablishmentToUI(e, cases) {
  const mine = cases.filter((c) => c.establishmentId === e.id);
  const activos = mine.filter((c) => !c.closed).length;
  const vencidos = mine.filter((c) => !c.closed && daysLeft((c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1] || {}).due) < 0).length;
  // Cumplimiento CALCULADO: % de casos del establecimiento que NO están en incumplimiento de plazo.
  const cumplimiento = mine.length ? Math.round((100 * (mine.length - vencidos)) / mine.length) : 100;
  return { ...e, activos, vencidos, cumplimiento };
}

/* kind (BD) → nombre del arreglo en la UI (inspectoría, PIE, apoderados). */
const REC_KIND_TO_ARR = {
  anotacion: "anotaciones", suspension: "suspensiones", atraso: "atrasos", retiro: "retiros",
  pieInforme: "pieInformes", pieAdecuacion: "pieAdecuaciones", pieEstrategia: "pieEstrategias", pieReunion: "pieReuniones",
  citacionApo: "citacionesApo", acuerdoApo: "acuerdosApo", docApo: "docsApo",
  reconocimiento: "reconocimientos",
};
const REC_ARR_TO_KIND = Object.fromEntries(Object.entries(REC_KIND_TO_ARR).map(([k, v]) => [v, k]));

// Deriva las partes del curso de un estudiante: usa grado/letra si existen, si no parsea "curso".
function courseParts(s) {
  let grado = s.grado || "";
  let letra = s.letra || "";
  if ((!grado || !letra) && s.curso) {
    const m = String(s.curso).match(/^\s*(\d+°?)\s*([A-Za-z°]*)/);
    if (m) { grado = grado || (m[1].includes("°") ? m[1] : m[1] + "°"); letra = letra || (m[2] || "").replace("°", ""); }
  }
  return { nivel: s.nivel || "", grado: grado || "", letra: letra || "" };
}

function apiStudentToUI(as) {
  const s = {
    id: as.id,
    name: as.name, rut: as.rut || "", curso: as.curso || "", nivel: as.nivel || "",
    grado: as.grado || "", letra: as.letra || "", genero: as.genero || "",
    apoderadoNombre: as.apoderadoNombre || "", apoderadoEmail: as.apoderadoEmail || "",
    nee: !!as.nee, neeTipo: as.neeTipo || "",
    entrevistas: as.entrevistas || [],
    citaciones: as.citaciones || [],
    compromisos: as.compromisos || [],
    medidas: as.medidas || [],
    anotaciones: [], suspensiones: [], atrasos: [], retiros: [],
    pieInformes: [], pieAdecuaciones: [], pieEstrategias: [], pieReuniones: [],
    citacionesApo: [], acuerdosApo: [], docsApo: [], reconocimientos: [],
  };
  // Desempaqueta los registros genéricos en sus arreglos: {id, ...data}
  for (const r of as.records || []) {
    const arr = REC_KIND_TO_ARR[r.kind];
    if (arr) s[arr].push({ id: r.id, ...(r.data || {}) });
  }
  return s;
}

/* Helpers para registros de expediente (inspectoría/PIE/apoderados) contra la API. */
async function addStudentRec(setStudents, sid, arrName, data) {
  try {
    const r = await api.addStudentRecord(sid, REC_ARR_TO_KIND[arrName], data);
    const item = { id: r.id, ...(r.data || {}) };
    setStudents((prev) => prev.map((x) => (x.id === sid ? { ...x, [arrName]: [...(x[arrName] || []), item] } : x)));
  } catch (e) { console.error("addStudentRec", arrName, e); toast("No se pudo guardar el registro. Inténtalo de nuevo."); }
}
function updStudentRec(setStudents, sid, arrName, id, patch) {
  let prev = null; // guardamos el valor anterior para revertir si la API falla
  setStudents((cur) => cur.map((x) => (x.id === sid ? { ...x, [arrName]: (x[arrName] || []).map((it) => { if (it.id === id) { prev = it; return { ...it, ...patch }; } return it; }) } : x)));
  api.updateStudentRecord(id, patch).catch((e) => {
    console.error("updStudentRec", e);
    toast("No se pudo guardar el cambio. Se revirtió.");
    if (prev) setStudents((cur) => cur.map((x) => (x.id === sid ? { ...x, [arrName]: (x[arrName] || []).map((it) => (it.id === id ? prev : it)) } : x)));
  });
}
function delStudentRec(setStudents, sid, arrName, id) {
  let removed = null, idx = -1; // para restaurar el registro eliminado si la API falla
  setStudents((cur) => cur.map((x) => { if (x.id !== sid) return x; const arr = x[arrName] || []; idx = arr.findIndex((it) => it.id === id); removed = arr[idx]; return { ...x, [arrName]: arr.filter((it) => it.id !== id) }; }));
  api.deleteStudentRecord(id).catch((e) => {
    console.error("delStudentRec", e);
    toast("No se pudo eliminar el registro. Se restauró.");
    if (removed) setStudents((cur) => cur.map((x) => { if (x.id !== sid) return x; const arr = [...(x[arrName] || [])]; arr.splice(idx < 0 ? arr.length : idx, 0, removed); return { ...x, [arrName]: arr }; }));
  });
}

/* Helpers para registros a nivel establecimiento (agenda/mensajes/gestiones/documental/PME). */
function orgAdd(setter, kind, data, { prepend = true, global = false } = {}) {
  return api.addOrgRecord(kind, data, global).then((r) => {
    const item = { id: r.id, ...(r.data || {}) };
    setter((prev) => (prepend ? [item, ...prev] : [...prev, item]));
    return item;
  }).catch((e) => { console.error("orgAdd", kind, e); toast("No se pudo guardar. Inténtalo de nuevo."); });
}
function orgUpdate(setter, id, patch) {
  let prev = null;
  setter((cur) => cur.map((it) => { if (it.id === id) { prev = it; return { ...it, ...patch }; } return it; }));
  api.updateOrgRecord(id, patch).catch((e) => {
    console.error("orgUpdate", e);
    toast("No se pudo guardar el cambio. Se revirtió.");
    if (prev) setter((cur) => cur.map((it) => (it.id === id ? prev : it)));
  });
}
function orgDelete(setter, id) {
  let removed = null, idx = -1;
  setter((cur) => { idx = cur.findIndex((it) => it.id === id); removed = cur[idx]; return cur.filter((it) => it.id !== id); });
  api.deleteOrgRecord(id).catch((e) => {
    console.error("orgDelete", e);
    toast("No se pudo eliminar. Se restauró.");
    if (removed) setter((cur) => { const arr = [...cur]; arr.splice(idx < 0 ? arr.length : idx, 0, removed); return arr; });
  });
}

/* Importación persistente a la BD (reemplaza la carga solo-en-memoria). */
async function importOrgRecords(setter, kind, rows) {
  const created = [];
  for (const row of rows || []) {
    const { id, ...data } = row || {};
    try { const r = await api.addOrgRecord(kind, data); created.push({ id: r.id, ...(r.data || {}) }); } catch (e) { console.error("import", kind, e); }
  }
  if (created.length) setter((prev) => [...created, ...prev]);
  return created.length;
}
async function importCases(setCases, existing, rows) {
  const codes = new Set((existing || []).map((c) => c.id));
  const created = [];
  for (const c of rows || []) {
    if (!c || !c.typeKey || codes.has(c.id)) continue;
    try {
      const cr = await api.createCase({
        code: c.id, typeKey: c.typeKey, studentLabel: c.studentLabel || "Importado",
        level: c.level, relato: c.relato, curso: c.curso, fechaHecho: c.fechaHecho, hora: c.hora,
        lugar: c.lugar, testigos: c.testigos, adultosRef: c.adultosRef, studentId: null,
        steps: (c.steps || []).map((s) => ({ title: s.title, role: s.role, basis: s.basis, due: s.due })),
      });
      created.push(apiCaseToUI(cr));
    } catch (e) { console.error("importCase", e); }
  }
  if (created.length) setCases((prev) => [...created, ...prev]);
  return created.length;
}

/* Genera un PDF con formato (carga diferida de jsPDF). */
async function exportReportPDF({ title, subtitle, indicadores, columns, rows, filename }) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(26, 115, 232); doc.rect(0, 0, W, 26, "F");
  doc.setTextColor(255); doc.setFontSize(15); doc.text(title, 14, 13);
  doc.setFontSize(9); doc.text("Recupera Convivencia · " + new Date().toLocaleDateString("es-CL"), 14, 20);
  doc.setTextColor(60, 64, 67);
  let y = 34;
  if (subtitle) { doc.setFontSize(9); doc.text(doc.splitTextToSize(subtitle, W - 28), 14, y); y += 10; }
  if (indicadores?.length) {
    doc.setFontSize(11); doc.setTextColor(32, 33, 36); doc.text("Indicadores", 14, y);
    autoTable(doc, { startY: y + 2, head: [["Indicador", "Valor"]], body: indicadores.map((i) => [i.label, String(i.value)]), theme: "grid", headStyles: { fillColor: [26, 115, 232] }, styles: { fontSize: 9 } });
    y = doc.lastAutoTable.finalY + 8;
  }
  if (columns && rows?.length) {
    doc.setFontSize(11); doc.setTextColor(32, 33, 36); doc.text("Detalle", 14, y);
    autoTable(doc, { startY: y + 2, head: [columns], body: rows, theme: "striped", headStyles: { fillColor: [30, 142, 62] }, styles: { fontSize: 8 } });
  }
  doc.save(filename || "reporte.pdf");
}

/* Extrae el texto de un PDF en el navegador (carga diferida de pdf.js). */
async function extractPdfText(file) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return text.trim();
}

/* OCR para PDF escaneados: renderiza cada página y la reconoce con Tesseract (español). */
async function ocrPdf(file, onProgress) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const { createWorker } = await import("tesseract.js");
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const nPages = Math.min(pdf.numPages, 15);
  const tw = await createWorker("spa");

  // Reconoce una página en una rotación dada; devuelve texto y confianza.
  async function recog(page, rotation, scale) {
    const viewport = page.getViewport({ scale, rotation });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const { data: { text, confidence } } = await tw.recognize(canvas);
    return { text, confidence };
  }

  let text = "";
  try {
    for (let i = 1; i <= nPages; i++) {
      onProgress && onProgress(`Reconociendo página ${i} de ${nPages}… (puede tardar)`);
      const page = await pdf.getPage(i);
      // Fotos del teléfono suelen venir rotadas: si la confianza es baja, probamos otras orientaciones.
      let best = await recog(page, 0, 2);
      if (best.confidence < 55) {
        onProgress && onProgress(`Página ${i}: corrigiendo orientación…`);
        for (const rot of [270, 90, 180]) {
          const alt = await recog(page, rot, 2);
          if (alt.confidence > best.confidence) best = alt;
          if (best.confidence >= 70) break;
        }
      }
      text += best.text + "\n";
    }
  } finally { await tw.terminate(); }
  return text.trim();
}

/* Carga masiva de usuarios: mapeo de rol (clave o etiqueta) y parser CSV. */
const ROLE_KEY_BY_TEXT = Object.entries(ROLES).reduce((m, [k, v]) => {
  m[k.toLowerCase()] = k;
  m[(v.label || "").toLowerCase()] = k;
  return m;
}, {});
function roleKeyFromText(t) {
  const s = (t || "").trim().toLowerCase();
  return ROLE_KEY_BY_TEXT[s] || (ROLES[s] ? s : "");
}
function parseUsersCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const split = (l) => l.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => /nombre|name|rut|rol|role|correo|email/.test(h));
  const idx = {
    name: header.findIndex((h) => /nombre|name/.test(h)),
    rut: header.findIndex((h) => /rut/.test(h)),
    role: header.findIndex((h) => /rol|role/.test(h)),
    email: header.findIndex((h) => /correo|email|mail/.test(h)),
  };
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const g = (cols, key, def) => { const i = hasHeader ? idx[key] : def; return i >= 0 ? (cols[i] || "") : ""; };
  return dataLines.map((l) => {
    const cols = split(l);
    return {
      name: g(cols, "name", 0),
      rut: g(cols, "rut", 1),
      role: roleKeyFromText(g(cols, "role", 2)),
      email: g(cols, "email", 3),
    };
  }).filter((r) => r.name || r.rut);
}

/* Lee la nómina oficial de SIGE (MINEDUC). Acepta el Excel exportado (HTML .xls),
   .htm/.html o .csv. Devuelve estudiantes con nivel/grado/letra listos para el repositorio.
   Formato SIGE: Año · RBD · Cod Grado · Desc Grado · Letra Curso · Run · Dígito Ver. ·
   Género · Nombres · Apellido Paterno · Apellido Materno · … · Fecha Retiro */
const stripAccents = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
function titleCaseName(s) {
  return String(s || "").toLowerCase().split(/\s+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function sigeNivel(descGrado) {
  const d = stripAccents(descGrado);
  if (/(parvul|kinder|transic|sala cuna|medio menor|medio mayor|\bnt1\b|\bnt2\b)/.test(d)) return "parvulo";
  if (/bas/.test(d)) return "basica";
  if (/medi/.test(d)) return "media";
  if (/adult/.test(d)) return "adultos";
  return "basica";
}
function sigeGrado(descGrado) {
  const m = String(descGrado || "").match(/(\d+)\s*°?/);
  if (m) return m[1] + "°";
  return titleCaseName(descGrado);
}
function parseSigeRows(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(stripAccents);
  const find = (...pats) => header.findIndex((h) => pats.some((p) => h.includes(p)));
  // "Desc Grado" (texto: "1° medio"), NO "Cod Grado" (número). El fallback excluye "cod grado".
  let iDesc = header.findIndex((h) => h.includes("desc grado") || h.includes("descgrado"));
  if (iDesc < 0) iDesc = header.findIndex((h) => h.includes("grado") && !h.includes("cod"));
  const iLetra = find("letra");
  const iRun = find("run");
  const iDv = find("digito", "dv");
  const iGen = find("genero", "sexo");
  const iNom = find("nombres", "nombre");
  const iApP = find("paterno");
  const iApM = find("materno");
  const iRet = find("retiro");
  if (iNom < 0 || iDesc < 0) return []; // no parece nómina SIGE
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const c = rows[r];
    if (!c || !c.length) continue;
    const nombres = c[iNom] || "";
    if (!stripAccents(nombres)) continue;
    const retiro = iRet >= 0 ? String(c[iRet] || "").trim() : "";
    const retirado = retiro && !/01-01-1900|1900-01-01/.test(retiro);
    const run = (iRun >= 0 ? c[iRun] : "").replace(/\D/g, "");
    const dv = (iDv >= 0 ? c[iDv] : "").trim();
    const nombre = titleCaseName([nombres, iApP >= 0 ? c[iApP] : "", iApM >= 0 ? c[iApM] : ""].join(" "));
    const desc = c[iDesc] || "";
    out.push({
      name: nombre,
      rut: run ? `${run}-${dv || ""}`.replace(/-$/, "") : "",
      nivel: sigeNivel(desc),
      grado: sigeGrado(desc),
      letra: (iLetra >= 0 ? c[iLetra] : "").trim().toUpperCase(),
      genero: (iGen >= 0 ? c[iGen] : "").trim().toUpperCase().slice(0, 1),
      retirado: !!retirado,
    });
  }
  return out;
}
function parseSigeNomina(text) {
  const looksHtml = /<t[rd][\s>]/i.test(text);
  if (looksHtml && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const trs = [...doc.querySelectorAll("tr")];
    const rows = trs.map((tr) => [...tr.querySelectorAll("td,th")].map((td) => (td.textContent || "").replace(/\s+/g, " ").trim()));
    return parseSigeRows(rows.filter((r) => r.length));
  }
  // CSV / TSV
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ";" : ",";
  const rows = lines.map((l) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, "")));
  return parseSigeRows(rows);
}

/* =================================================================
   RAÍZ — login + enrutado por rol
   ================================================================= */
// Enrutado por dominio: la raíz (recuperaconvivencia.cl / www) muestra la web de
// presentación; el subdominio app. (o netlify.app / localhost) muestra la plataforma.
function isMarketingHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname.toLowerCase();
  return h === "recuperaconvivencia.cl" || h === "www.recuperaconvivencia.cl";
}
// Captura errores de render para que un fallo puntual no deje la pantalla en blanco.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("ErrorBoundary", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f8fafc" }}>
          <div style={{ maxWidth: 460, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 28, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.08)" }}>
            <AlertTriangle size={40} style={{ color: C.urgent, margin: "0 auto 12px" }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Se produjo un error inesperado</h1>
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 18 }}>La aplicación encontró un problema al mostrar esta vista. Tus datos están a salvo. Vuelve a cargar la página para continuar.</p>
            <button onClick={() => window.location.reload()} style={{ background: C.primary, color: "#fff", border: 0, borderRadius: 9, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Recargar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Root() {
  return (
    <ErrorBoundary>
      {isMarketingHost() ? <LandingPage /> : <App />}
      <Toaster />
    </ErrorBoundary>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("invite") : null);
  const [resetTok, setResetTok] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("reset") : null);
  const [citacionTok, setCitacionTok] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("citacion") : null);
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState(USERS);
  const [institutions, setInstitutions] = useState(INSTITUTIONS);
  const [establishments, setEstablishments] = useState(ESTABLISHMENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [emailTemplates, setEmailTemplates] = useState(DEFAULT_EMAIL_TEMPLATES);
  const [docs, setDocs] = useState(DEFAULT_ESTABLISHMENT_DOCS);
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [permset, setPermset] = useState(null);
  const [courseTeachers, setCourseTeachers] = useState(null);
  const [reconCategories, setReconCategories] = useState([]);

  // Restaura la sesión si hay un token guardado (recarga de página).
  useEffect(() => {
    const t = getToken();
    if (!t) { setBooting(false); return; }
    api.me()
      .then(({ user }) => setSession(user))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  // Carga casos y expedientes reales desde la API cuando hay sesión.
  useEffect(() => {
    if (!session) return;
    let vivo = true;
    setDataLoading(true);
    Promise.all([api.listCases(), api.listStudents(), api.listOrgRecords(), api.listEstablishments()])
      .then(([cs, ss, org, ests]) => {
        if (!vivo) return;
        const mappedCases = cs.map(apiCaseToUI);
        setCases(mappedCases);
        setStudents(ss.map(apiStudentToUI));
        if (Array.isArray(ests) && ests.length) setEstablishments(ests.map((e) => apiEstablishmentToUI(e, mappedCases)));
        api.listInstitutions().then((ins) => { if (Array.isArray(ins) && ins.length) setInstitutions(ins); }).catch(() => {});
        const by = (k) => org.filter((r) => r.kind === k).map((r) => ({ id: r.id, ...(r.data || {}) }));
        setMessages(by("message"));
        setEvents(by("event"));
        setGestiones(by("gestion"));
        setDocuments(by("document"));
        setAcciones(by("accion"));
        setProtocols(by("protocol"));
        const ps = by("permset");
        setPermset(ps[0] || null);
        const ct = by("courseTeacher");
        setCourseTeachers(ct[0] || null);
        setReconCategories(by("reconCategory"));
      })
      .catch(() => {})
      .finally(() => vivo && setDataLoading(false));
    return () => { vivo = false; };
  }, [session?.id]);

  const logout = () => { setToken(null); setSession(null); setCases([]); setStudents([]); setMessages([]); setEvents([]); setGestiones([]); setDocuments([]); setAcciones([]); setProtocols([]); setPermset(null); setCourseTeachers(null); setReconCategories([]); };

  if (booting) return <Splash />;
  if (!session && inviteToken)
    return <Activate token={inviteToken} onDone={(user) => { window.history.replaceState({}, "", window.location.pathname); setInviteToken(null); setSession(user); }} onCancel={() => { window.history.replaceState({}, "", window.location.pathname); setInviteToken(null); }} />;
  if (!session && resetTok)
    return <ResetPassword token={resetTok} onDone={(user) => { window.history.replaceState({}, "", window.location.pathname); setResetTok(null); setSession(user); }} onCancel={() => { window.history.replaceState({}, "", window.location.pathname); setResetTok(null); }} />;
  if (citacionTok)
    return <CitacionConfirm token={citacionTok} onClose={() => { window.history.replaceState({}, "", window.location.pathname); setCitacionTok(null); }} />;
  if (!session) return <Login onLogin={setSession} />;

  const shared = {
    session, setSession, logout, dataLoading, cases, setCases, users, setUsers,
    institutions, setInstitutions, establishments, setEstablishments,
    notifications, setNotifications, emailTemplates, setEmailTemplates, docs, setDocs,
    students, setStudents, messages, setMessages, events, setEvents, gestiones, setGestiones,
    documents, setDocuments, acciones, setAcciones, protocols, setProtocols, permset, setPermset,
    courseTeachers, setCourseTeachers, reconCategories, setReconCategories,
  };

  const role = ROLES[session.role];
  if (role.scope === "superadmin") return <AdminApp {...shared} />;
  return <PortalApp {...shared} />;
}

/* ---------------------------------------------------------------
   SPLASH (mientras se restaura la sesión)
   ---------------------------------------------------------------- */
/* ------------------- WEB DE PRESENTACIÓN (dominio raíz) ------------------- */
const APP_ENTRY = "https://app.recuperaconvivencia.cl";
function LandingPage() {
  const feats = [
    { icon: FolderOpen, t: "Gestión de casos", d: "Registra incidentes y sigue el paso a paso legal, con plazos y responsables según la normativa vigente." },
    { icon: ClipboardList, t: "Expediente único", d: "Cada estudiante reúne sus casos, entrevistas, citaciones, compromisos y medidas en un solo lugar." },
    { icon: Sparkles, t: "Protocolos con IA", d: "El sistema lee el Reglamento de tu establecimiento (RICE) y recomienda el procedimiento, con la ley siempre por sobre todo." },
    { icon: Lock, t: "Seguridad y Ley 21.719", d: "Cifrado de datos sensibles, registro de auditoría y protección reforzada de datos de menores." },
    { icon: Users, t: "Importa tu nómina SIGE", d: "Carga a todos tus estudiantes por curso desde la nómina oficial del MINEDUC, en segundos." },
    { icon: BarChart3, t: "Reportes y alertas", d: "Estadísticas, alertas de plazos vencidos y reincidencia, con exportación a PDF y Excel." },
  ];
  return (
    <div style={{ background: C.appBg, color: C.ink, minHeight: "100vh" }}>
      {/* Barra superior */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${C.cardBorder}` }} className="sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div style={{ background: C.primary }} className="w-9 h-9 rounded-full flex items-center justify-center"><Scale size={18} color="#fff" /></div>
            <div>
              <div style={{ ...serif, color: C.ink }} className="text-base leading-none">Recupera Convivencia</div>
              <div style={{ color: C.textSoft }} className="text-[10px] uppercase tracking-wider mt-0.5">Convivencia escolar</div>
            </div>
          </div>
          <a href={APP_ENTRY} style={{ background: C.primary, color: "#fff" }} className="text-sm font-medium rounded-full px-5 py-2 hover:opacity-90 transition">Ingresar</a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-14 text-center">
        <div style={{ background: C.adminSoft, color: C.admin }} className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-5">Plataforma para establecimientos educacionales de Chile</div>
        <h1 style={{ ...serif, color: C.ink }} className="text-4xl sm:text-5xl leading-tight mb-4" >La convivencia escolar,<br />gestionada con la ley por delante.</h1>
        <p style={{ color: C.textSoft }} className="text-lg max-w-2xl mx-auto mb-8">Registra casos, sigue protocolos, lleva el expediente de cada estudiante y cumple la normativa — todo en un solo lugar, seguro y ordenado.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a href={APP_ENTRY} style={{ background: C.primary, color: "#fff" }} className="text-sm font-medium rounded-full px-7 py-3 hover:opacity-90 transition inline-flex items-center gap-2">Ingresar a la plataforma <ChevronRight size={16} /></a>
          <a href="#funciones" style={{ background: "#fff", color: C.ink, border: `1px solid ${C.cardBorder}` }} className="text-sm font-medium rounded-full px-7 py-3 hover:shadow-sm transition">Ver funciones</a>
        </div>
      </section>

      {/* Franja legal */}
      <section style={{ background: "#fff", borderTop: `1px solid ${C.cardBorder}`, borderBottom: `1px solid ${C.cardBorder}` }} className="py-4">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-center gap-2 text-center flex-wrap">
          <Shield size={16} color={C.ok} />
          <span style={{ color: C.textSoft }} className="text-sm">Alineado con la Ley 21.809, Aula Segura, Ley Karin, Inclusión y la Ley 21.719 de protección de datos.</span>
        </div>
      </section>

      {/* Funciones */}
      <section id="funciones" className="max-w-5xl mx-auto px-5 py-16">
        <h2 style={{ ...serif, color: C.ink }} className="text-2xl text-center mb-2">Todo lo que tu equipo de convivencia necesita</h2>
        <p style={{ color: C.textSoft }} className="text-center text-sm mb-10">Pensado para encargados de convivencia, inspectoría, PIE y dirección.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feats.map((f) => (
            <div key={f.t} style={{ background: "#fff", border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
              <div style={{ background: C.adminSoft }} className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"><f.icon size={20} color={C.primary} /></div>
              <div style={{ color: C.ink }} className="font-medium mb-1">{f.t}</div>
              <div style={{ color: C.textSoft }} className="text-sm leading-relaxed">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-5xl mx-auto px-5 pb-16">
        <div style={{ background: C.primary }} className="rounded-2xl p-10 text-center">
          <h2 style={{ ...serif, color: "#fff" }} className="text-2xl mb-2">¿Tu establecimiento ya tiene acceso?</h2>
          <p style={{ color: "#fff", opacity: 0.9 }} className="text-sm mb-6">Ingresa con tu RUT y contraseña. El acceso es exclusivo para personal autorizado.</p>
          <a href={APP_ENTRY} style={{ background: "#fff", color: C.primary }} className="text-sm font-medium rounded-full px-7 py-3 inline-flex items-center gap-2 hover:opacity-90 transition">Ir a la plataforma <ChevronRight size={16} /></a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#fff", borderTop: `1px solid ${C.cardBorder}` }} className="py-8">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between gap-3 flex-wrap">
          <div style={{ color: C.textSoft }} className="text-xs">© 2026 Recupera Convivencia · Plataforma de convivencia escolar</div>
          <a href="mailto:contacto@recuperaconvivencia.cl" style={{ color: C.primary }} className="text-xs">contacto@recuperaconvivencia.cl</a>
        </div>
      </footer>
    </div>
  );
}

function Splash() {
  return (
    <div style={{ background: C.appBg }} className="min-h-screen flex flex-col items-center justify-center gap-3">
      <div style={{ background: C.primary }} className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse">
        <Scale size={22} color="#fff" />
      </div>
      <div style={{ color: C.textSoft }} className="text-sm">Cargando…</div>
    </div>
  );
}

/* ---------------------------------------------------------------
   LOGIN — RUT + contraseña + verificación en dos pasos (2FA)
   ---------------------------------------------------------------- */
function Login({ onLogin }) {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPriv, setShowPriv] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  async function enviarRecuperacion(e) {
    e.preventDefault();
    setError(""); setForgotMsg(""); setLoading(true);
    try {
      const res = await api.forgotPassword(rut.trim());
      setForgotMsg(res.message || "Si el RUT está registrado y tiene correo, te enviamos un enlace.");
    } catch (err) { setError((err && (err.error || err.message)) || "No se pudo procesar la solicitud."); }
    finally { setLoading(false); }
  }

  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user, token } = await api.login(rut.trim(), password, needsCode ? code.trim() : undefined);
      setToken(token);
      onLogin(user);
    } catch (err) {
      if (err && err.twofa) {
        setNeedsCode(true);
        setError(err.error || "Ingresa el código de verificación.");
      } else {
        setError((err && (err.error || err.message)) || "No se pudo iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: C.appBg }} className="min-h-screen flex items-center justify-center p-6">
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="mb-6">
          <BrandLogo height={42} />
          <div style={{ ...mono, color: C.textSoft }} className="text-[10px] tracking-widest uppercase mt-2.5">Ingreso a la plataforma</div>
        </div>

        {forgot && <p style={{ color: C.textSoft }} className="text-sm mb-3">Ingresa tu RUT y te enviaremos un enlace a tu correo para crear una nueva contraseña.</p>}

        <form onSubmit={forgot ? enviarRecuperacion : submit} className="flex flex-col gap-3">
          <label className="block">
            <span style={{ color: C.textSoft }} className="text-xs font-medium">RUT</span>
            <div className="relative mt-1">
              <UserCircle size={16} color={C.textSoft} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={rut} onChange={(e) => setRut(e.target.value)} placeholder="12.345.678-9" autoFocus
                disabled={needsCode} inputMode="text"
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none" style={inp} />
            </div>
          </label>

          {!forgot && (
          <label className="block">
            <span style={{ color: C.textSoft }} className="text-xs font-medium">Contraseña</span>
            <div className="relative mt-1">
              <Lock size={16} color={C.textSoft} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                disabled={needsCode}
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none" style={inp} />
            </div>
          </label>
          )}

          {needsCode && (
            <label className="block">
              <span style={{ color: C.textSoft }} className="text-xs font-medium">Código de verificación (Google Authenticator)</span>
              <div className="relative mt-1">
                <Shield size={16} color={C.primary} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" autoFocus inputMode="numeric" maxLength={6}
                  className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm tracking-[0.4em] outline-none" style={inp} />
              </div>
              <span style={{ color: C.textSoft }} className="text-[11px]">Abre tu app de autenticación e ingresa el código de 6 dígitos.</span>
            </label>
          )}

          {error && (
            <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-xs rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          {forgotMsg && (
            <div style={{ background: "#E6F4EA", color: C.ok }} className="text-xs rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 size={14} /> {forgotMsg}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="mbtn mt-1 inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-full font-medium"
            style={{ background: C.primary, color: "#fff", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Procesando…" : forgot ? "Enviar enlace de recuperación" : needsCode ? "Verificar e ingresar" : "Iniciar sesión"}
          </button>

          {needsCode && (
            <button type="button" onClick={() => { setNeedsCode(false); setCode(""); setError(""); }}
              style={{ color: C.textSoft }} className="text-xs underline">
              ← Volver
            </button>
          )}
          {!needsCode && !forgot && (
            <button type="button" onClick={() => { setForgot(true); setError(""); setForgotMsg(""); }}
              style={{ color: C.textSoft }} className="text-xs underline self-start">
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {forgot && (
            <button type="button" onClick={() => { setForgot(false); setError(""); setForgotMsg(""); }}
              style={{ color: C.textSoft }} className="text-xs underline">
              ← Volver al inicio de sesión
            </button>
          )}
        </form>

        {/^(localhost|127\.|0\.0\.0\.0)/.test(typeof window !== "undefined" ? window.location.hostname : "") && (
          <p style={{ color: C.textSoft }} className="text-[11px] mt-5 leading-relaxed">
            Demo (solo local) — RUT <b>11.111.111-1</b> (Admin) o <b>22.222.222-2</b> (Coordinación), contraseña <b>demo1234</b>.
          </p>
        )}
        <p style={{ color: C.textSoft }} className="text-[11px] mt-5 leading-relaxed">
          El acceso es exclusivo para personal autorizado del establecimiento.
          {" "}<button type="button" onClick={() => setShowPriv(true)} style={{ color: C.primary }} className="underline">Política de privacidad</button>.
        </p>
      </div>
      {showPriv && <PrivacyPolicy onClose={() => setShowPriv(false)} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   POLÍTICA DE PRIVACIDAD — borrador base Ley 21.719 (requiere revisión legal)
   ---------------------------------------------------------------- */
function PrivacyPolicy({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.4)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-6 w-full max-w-lg shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-2.5 mb-4">
          <div style={{ background: C.primary }} className="w-9 h-9 rounded-full flex items-center justify-center"><Lock size={16} color="#fff" /></div>
          <div style={{ ...serif, color: C.ink }} className="text-base flex-1">Política de privacidad y protección de datos</div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5" style={{ color: C.textSoft }}><X size={16} /></button>
        </div>
        <div style={{ color: C.text }} className="text-xs leading-relaxed flex flex-col gap-2.5">
          <p><b>Marco legal.</b> Esta plataforma trata datos personales conforme a la Ley N.º 21.719 sobre protección de datos personales de Chile y la normativa educativa vigente.</p>
          <p><b>Datos que se tratan.</b> Datos de identificación de estudiantes, apoderados y personal (nombre, RUT, curso, correo), y antecedentes de convivencia escolar (casos, medidas, entrevistas). Parte de esta información corresponde a <b>datos sensibles</b> y de <b>niños, niñas y adolescentes</b>, con protección reforzada.</p>
          <p><b>Finalidad.</b> Gestionar los procesos de convivencia escolar del establecimiento: registro de incidentes, seguimiento de protocolos, expediente del estudiante y comunicación entre estamentos.</p>
          <p><b>Base de licitud.</b> Cumplimiento de deberes legales del establecimiento educacional e interés legítimo en la protección de la comunidad escolar.</p>
          <p><b>Seguridad.</b> Acceso con credencial personal (RUT + contraseña) y verificación en dos pasos opcional; <b>cifrado en reposo</b> de datos sensibles; <b>registro de auditoría</b> de accesos y acciones; control de acceso por rol.</p>
          <p><b>Derechos.</b> Los titulares (o sus representantes) pueden ejercer los derechos de acceso, rectificación, cancelación y oposición ante el establecimiento responsable del tratamiento.</p>
          <p><b>Responsable.</b> El establecimiento educacional que utiliza la plataforma es el responsable del tratamiento de los datos.</p>
          <p style={{ color: C.textSoft }} className="text-[11px] mt-1">Documento borrador. Debe ser revisado y adaptado legalmente por cada establecimiento antes de su publicación oficial.</p>
        </div>
        <div className="mt-4 flex justify-end"><Btn onClick={onClose}>Entendido</Btn></div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ACTIVAR CUENTA — desde el enlace de invitación (define contraseña)
   ---------------------------------------------------------------- */
function Activate({ token, onDone, onCancel }) {
  const [info, setInfo] = useState(null);
  const [invalid, setInvalid] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  useEffect(() => {
    api.inviteInfo(token)
      .then(setInfo)
      .catch((err) => setInvalid((err && (err.error || err.message)) || "El enlace no es válido."));
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (pass.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (pass !== pass2) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      const { user, token: jwt } = await api.activate(token, pass);
      setToken(jwt);
      onDone(user);
    } catch (err) {
      setError((err && (err.error || err.message)) || "No se pudo activar la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: C.appBg }} className="min-h-screen flex items-center justify-center p-6">
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div style={{ background: C.primary }} className="w-10 h-10 rounded-full flex items-center justify-center"><UserPlus size={19} color="#fff" /></div>
          <div>
            <div style={{ ...serif, color: C.ink }} className="text-lg">Activar tu cuenta</div>
            <div style={{ ...mono, color: C.textSoft }} className="text-[10px] tracking-widest uppercase">Recupera Convivencia</div>
          </div>
        </div>

        {invalid ? (
          <div className="flex flex-col gap-4">
            <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-sm rounded-lg px-3 py-2.5 flex items-center gap-2"><AlertTriangle size={16} /> {invalid}</div>
            <button onClick={onCancel} className="mbtn text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff" }}>Ir al inicio de sesión</button>
          </div>
        ) : !info ? (
          <div style={{ color: C.textSoft }} className="text-sm">Verificando el enlace…</div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-lg p-3 text-sm">
              <div style={{ color: C.ink }} className="font-medium">{info.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">RUT {info.rut} · {ROLES[info.role]?.label || info.role}</div>
            </div>
            <p style={{ color: C.textSoft }} className="text-xs">Crea tu contraseña para acceder. Debe tener al menos 8 caracteres.</p>
            <label className="block">
              <span style={{ color: C.textSoft }} className="text-xs font-medium">Nueva contraseña</span>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoFocus className="mt-1 w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inp} />
            </label>
            <label className="block">
              <span style={{ color: C.textSoft }} className="text-xs font-medium">Repite la contraseña</span>
              <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inp} />
            </label>
            {error && <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-xs rounded-lg px-3 py-2 flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
            <button type="submit" disabled={loading} className="mbtn mt-1 text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff", opacity: loading ? 0.5 : 1 }}>
              {loading ? "Activando…" : "Activar e ingresar"}
            </button>
            <p style={{ color: C.textSoft }} className="text-[11px] text-center">Luego podrás activar la verificación en dos pasos desde el botón de seguridad.</p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   RESTABLECER CONTRASEÑA — desde el enlace de recuperación
   ---------------------------------------------------------------- */
function ResetPassword({ token, onDone, onCancel }) {
  const [info, setInfo] = useState(null);
  const [invalid, setInvalid] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  useEffect(() => {
    api.resetInfo(token).then(setInfo).catch((err) => setInvalid((err && (err.error || err.message)) || "El enlace no es válido."));
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (pass.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (pass !== pass2) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      const { user, token: jwt } = await api.resetPassword(token, pass);
      setToken(jwt);
      onDone(user);
    } catch (err) { setError((err && (err.error || err.message)) || "No se pudo restablecer la contraseña."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background: C.appBg }} className="min-h-screen flex items-center justify-center p-6">
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div style={{ background: C.primary }} className="w-10 h-10 rounded-full flex items-center justify-center"><Lock size={19} color="#fff" /></div>
          <div>
            <div style={{ ...serif, color: C.ink }} className="text-lg">Nueva contraseña</div>
            <div style={{ ...mono, color: C.textSoft }} className="text-[10px] tracking-widest uppercase">Recupera Convivencia</div>
          </div>
        </div>
        {invalid ? (
          <div className="flex flex-col gap-4">
            <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-sm rounded-lg px-3 py-2.5 flex items-center gap-2"><AlertTriangle size={16} /> {invalid}</div>
            <button onClick={onCancel} className="mbtn text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff" }}>Ir al inicio de sesión</button>
          </div>
        ) : !info ? (
          <div style={{ color: C.textSoft }} className="text-sm">Verificando el enlace…</div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-lg p-3 text-sm">
              <div style={{ color: C.ink }} className="font-medium">{info.name}</div>
              <div style={{ color: C.textSoft }} className="text-xs">RUT {info.rut}</div>
            </div>
            <label className="block">
              <span style={{ color: C.textSoft }} className="text-xs font-medium">Nueva contraseña</span>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoFocus className="mt-1 w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inp} />
            </label>
            <label className="block">
              <span style={{ color: C.textSoft }} className="text-xs font-medium">Repite la contraseña</span>
              <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inp} />
            </label>
            {error && <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-xs rounded-lg px-3 py-2 flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
            <button type="submit" disabled={loading} className="mbtn mt-1 text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff", opacity: loading ? 0.5 : 1 }}>
              {loading ? "Guardando…" : "Cambiar contraseña e ingresar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   CONFIRMACIÓN DE CITACIÓN — página pública desde el enlace del correo
   ---------------------------------------------------------------- */
function CitacionConfirm({ token, onClose }) {
  const [info, setInfo] = useState(null);
  const [invalid, setInvalid] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCitacion(token)
      .then((d) => { setInfo(d); if (d.confirmed) setDone(true); })
      .catch((err) => setInvalid((err && (err.error || err.message)) || "El enlace no es válido o venció."));
  }, [token]);

  async function confirmar() {
    setLoading(true);
    try { await api.confirmCitacion(token); setDone(true); }
    catch (err) { setInvalid((err && (err.error || err.message)) || "No se pudo confirmar."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ background: C.appBg }} className="min-h-screen flex items-center justify-center p-6">
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div style={{ background: C.primary }} className="w-10 h-10 rounded-full flex items-center justify-center"><CalendarClock size={19} color="#fff" /></div>
          <div>
            <div style={{ ...serif, color: C.ink }} className="text-lg">Citación de apoderado</div>
            <div style={{ ...mono, color: C.textSoft }} className="text-[10px] tracking-widest uppercase">Recupera Convivencia</div>
          </div>
        </div>
        {invalid ? (
          <div className="flex flex-col gap-4">
            <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-sm rounded-lg px-3 py-2.5 flex items-center gap-2"><AlertTriangle size={16} /> {invalid}</div>
            <button onClick={onClose} className="mbtn text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff" }}>Cerrar</button>
          </div>
        ) : !info ? (
          <div style={{ color: C.textSoft }} className="text-sm">Cargando la citación…</div>
        ) : done ? (
          <div className="flex flex-col gap-4">
            <div style={{ background: C.ok + "18", color: C.ok, border: `1px solid ${C.ok}` }} className="text-sm rounded-lg px-3 py-3 flex items-center gap-2"><CheckCircle2 size={18} /> ¡Asistencia confirmada! Gracias. El establecimiento ya quedó notificado.</div>
            <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-lg p-3 text-sm">
              <div style={{ color: C.ink }} className="font-medium">{info.motivo}</div>
              <div style={{ color: C.textSoft }} className="text-xs mt-0.5">Estudiante: {info.studentName} · {info.fecha}{info.hora ? ` ${info.hora}` : ""}</div>
            </div>
            <button onClick={onClose} className="mbtn text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: "#fff", color: C.ink, border: `1px solid ${C.cardBorder}` }}>Cerrar</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p style={{ color: C.textSoft }} className="text-sm">Estimado/a {info.apoderado || "apoderado/a"}, se le cita a una reunión en el establecimiento:</p>
            <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-lg p-3 text-sm flex flex-col gap-1">
              <div><span style={{ color: C.textSoft }}>Estudiante: </span><span style={{ color: C.ink }}>{info.studentName}</span></div>
              <div><span style={{ color: C.textSoft }}>Motivo: </span><span style={{ color: C.ink }}>{info.motivo}</span></div>
              <div><span style={{ color: C.textSoft }}>Fecha: </span><span style={{ color: C.ink }}>{info.fecha || "por confirmar"}{info.hora ? ` · ${info.hora}` : ""}</span></div>
            </div>
            <button onClick={confirmar} disabled={loading} className="mbtn text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff", opacity: loading ? 0.5 : 1 }}>
              {loading ? "Confirmando…" : "Confirmar asistencia"}
            </button>
            <p style={{ color: C.textSoft }} className="text-[11px] text-center">Si no puedes asistir, comunícate con el establecimiento para reagendar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SEGURIDAD — activar/desactivar verificación en dos pasos (2FA)
   ---------------------------------------------------------------- */
function Security2FA({ session, setSession, onClose }) {
  const enabled = !!session.totpEnabled;
  const [step, setStep] = useState(enabled ? "on" : "off"); // off | qr | on
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setError(""); setLoading(true);
    try {
      const { qr, secret } = await api.setup2fa();
      setQr(qr); setSecret(secret); setStep("qr");
    } catch (err) { setError((err && (err.error || err.message)) || "No se pudo generar el código."); }
    finally { setLoading(false); }
  }

  async function confirmEnable() {
    setError(""); setLoading(true);
    try {
      await api.enable2fa(code.trim());
      setSession({ ...session, totpEnabled: true });
      setStep("on");
    } catch (err) { setError((err && (err.error || err.message)) || "Código inválido."); }
    finally { setLoading(false); }
  }

  async function disable() {
    setError(""); setLoading(true);
    try {
      await api.disable2fa(password);
      setSession({ ...session, totpEnabled: false });
      setStep("off"); setPassword("");
    } catch (err) { setError((err && (err.error || err.message)) || "No se pudo desactivar."); }
    finally { setLoading(false); }
  }

  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.35)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-6 w-full max-w-md shadow-lg">
        <div className="flex items-center gap-2.5 mb-4">
          <div style={{ background: C.primary }} className="w-9 h-9 rounded-full flex items-center justify-center"><Shield size={17} color="#fff" /></div>
          <div className="flex-1">
            <div style={{ ...serif, color: C.ink }} className="text-base">Verificación en dos pasos</div>
            <div style={{ color: C.textSoft }} className="text-xs">Google Authenticator / Authy / Microsoft Authenticator</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5" style={{ color: C.textSoft }}><X size={16} /></button>
        </div>

        {step === "on" && (
          <div className="flex flex-col gap-3">
            <div style={{ background: "#E6F4EA", color: C.ok }} className="text-sm rounded-lg px-3 py-2.5 flex items-center gap-2">
              <CheckCircle2 size={16} /> La verificación en dos pasos está <b>activada</b>.
            </div>
            <div style={{ color: C.textSoft }} className="text-xs">Para desactivarla, confirma tu contraseña:</div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inp} />
            {error && <div style={{ color: C.urgent }} className="text-xs">{error}</div>}
            <button onClick={disable} disabled={loading || !password} className="mbtn-outline text-sm px-4 py-2.5 rounded-full font-medium" style={{ border: `1px solid ${C.urgent}`, color: C.urgent, opacity: loading || !password ? 0.5 : 1 }}>
              {loading ? "Desactivando…" : "Desactivar 2FA"}
            </button>
          </div>
        )}

        {step === "off" && (
          <div className="flex flex-col gap-3">
            <p style={{ color: C.text }} className="text-sm">Agrega una capa extra de seguridad: además de tu RUT y contraseña, se pedirá un código de 6 dígitos de tu aplicación de autenticación.</p>
            {error && <div style={{ color: C.urgent }} className="text-xs">{error}</div>}
            <button onClick={startSetup} disabled={loading} className="mbtn text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff", opacity: loading ? 0.5 : 1 }}>
              {loading ? "Generando…" : "Activar verificación en dos pasos"}
            </button>
          </div>
        )}

        {step === "qr" && (
          <div className="flex flex-col gap-3">
            <p style={{ color: C.text }} className="text-sm">1. Escanea este código QR con tu app de autenticación:</p>
            {qr && <img src={qr} alt="QR 2FA" className="w-44 h-44 self-center rounded-lg" style={{ border: `1px solid ${C.cardBorder}` }} />}
            <p style={{ color: C.textSoft }} className="text-[11px] text-center break-all">¿No puedes escanear? Clave manual: <b style={mono}>{secret}</b></p>
            <p style={{ color: C.text }} className="text-sm">2. Ingresa el código de 6 dígitos que aparece:</p>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" maxLength={6} className="w-full rounded-lg px-3 py-2.5 text-sm tracking-[0.4em] text-center outline-none" style={inp} />
            {error && <div style={{ color: C.urgent }} className="text-xs">{error}</div>}
            <button onClick={confirmEnable} disabled={loading || code.length < 6} className="mbtn text-sm px-4 py-2.5 rounded-full font-medium" style={{ background: C.primary, color: "#fff", opacity: loading || code.length < 6 ? 0.5 : 1 }}>
              {loading ? "Verificando…" : "Confirmar y activar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------- COMPONENTES BASE -------------------------- */
function Btn({ children, onClick, variant = "solid", accent = C.primary, disabled, style }) {
  const base = "inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full font-medium";
  if (variant === "ghost")
    return <button onClick={onClick} disabled={disabled} className={`${base} mbtn-outline`} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary, ...style }}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} className={`${base} mbtn`} style={{ background: accent, color: "#fff", opacity: disabled ? 0.4 : 1, ...style }}>{children}</button>;
}

function Toolbar({ onPrint, onExport, onImport }) {
  const fileRef = useRef();
  return (
    <div className="flex items-center gap-2 flex-wrap print:hidden">
      {onPrint && <Btn variant="ghost" onClick={onPrint}><Printer size={15} /> Imprimir</Btn>}
      {onExport && <Btn variant="ghost" onClick={onExport}><Download size={15} /> Exportar</Btn>}
      {onImport && (
        <>
          <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={15} /> Importar</Btn>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { onImport(await importJSON(f)); } catch { alert("Archivo no válido"); } } e.target.value = ""; }} />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-4">
      <div style={{ color }} className="text-2xl font-semibold">{value}</div>
      <div style={{ color: C.textSoft }} className="text-xs mt-1 leading-snug">{label}</div>
    </div>
  );
}

function StatusPill({ dl }) {
  const color = urgencyColor(dl, C);
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span style={{ background: color }} className="w-2 h-2 rounded-full" />
      <span style={{ color }} className="text-xs font-medium whitespace-nowrap">{dl < 0 ? `${-dl} días de atraso` : `${dl} días`}</span>
    </span>
  );
}

function PageHead({ title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <div style={{ ...serif, color: C.ink }} className="text-2xl mb-1">{title}</div>
        {subtitle && <p style={{ color: C.textSoft }} className="text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 print:hidden">
      <div style={{ background: C.cardBg }} className="rounded-xl max-w-lg w-full p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: C.textSoft }}><X size={18} /></button>
        <div style={{ color: C.ink }} className="text-sm font-medium mb-4">{title}</div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------- CAMPANA DE NOTIFICACIONES ----------------- */
function NotificationBell({ items, onOpen }) {
  const [open, setOpen] = useState(false);
  const list = (items || []).slice(0, 15);
  const abrir = () => { setOpen(false); if (onOpen) onOpen(); };
  return (
    <div className="relative print:hidden">
      <button onClick={() => setOpen(!open)} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="w-9 h-9 rounded-lg flex items-center justify-center relative">
        <Bell size={17} color={C.ink} />
        {list.length > 0 && <span style={{ background: C.urgent }} className="absolute -top-1 -right-1 text-[10px] text-white rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{list.length}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
              <span style={{ color: C.ink }} className="text-sm font-medium">Notificaciones</span>
              {onOpen && <button onClick={abrir} style={{ color: C.seal }} className="text-xs">Ver todas →</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {list.length === 0 && <div style={{ color: C.textSoft }} className="p-4 text-sm">Sin notificaciones.</div>}
              {list.map((n) => (
                <button key={n.id} onClick={abrir} className="w-full text-left px-4 py-3 hover:bg-black/[0.03] transition" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                  <div style={{ color: C.textSoft }} className="text-[10px] uppercase tracking-wide">{n.from} · {n.at}</div>
                  <div style={{ color: C.ink }} className="text-sm font-medium mt-0.5">{n.title}</div>
                  {n.body && <div style={{ color: C.textSoft }} className="text-xs mt-0.5 line-clamp-2">{n.body}</div>}
                  <div style={{ color: C.primary }} className="text-[11px] mt-1 flex items-center gap-1">Ver en Comunicación interna <ChevronRight size={12} /></div>
                </button>
              ))}
            </div>
            {list.length > 0 && onOpen && (
              <button onClick={abrir} className="w-full text-center py-2.5 text-xs" style={{ color: C.primary, borderTop: `1px solid ${C.cardBorder}` }}>Ver todas las comunicaciones →</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* =================================================================
   PORTAL USUARIO
   ================================================================= */
const PORTAL_NAV_BY_SCOPE = {
  admin: ["dashboard", "alertas", "casos", "expedientes", "inspectoria", "pie", "nuevo", "agenda", "comunicacion", "apoderados", "documental", "reportes", "planpme", "formatos", "normativa", "protocolos", "redes", "gestion", "auditoria", "perfiles", "configuracion"],
  audit: ["dashboard", "alertas", "casos", "expedientes", "inspectoria", "pie", "agenda", "apoderados", "documental", "reportes", "planpme", "gestion", "auditoria", "normativa"],
  limited: ["dashboard", "casos", "expedientes", "pie", "nuevo", "agenda", "comunicacion", "apoderados", "documental", "planpme", "formatos", "normativa"],
  family: ["dashboard", "micaso", "normativa"],
};
const PORTAL_NAV = {
  dashboard: { label: "Panel general", icon: LayoutGrid },
  alertas: { label: "Alertas inteligentes", icon: AlertTriangle },
  casos: { label: "Casos de convivencia", icon: FolderOpen },
  expedientes: { label: "Expedientes de estudiantes", icon: ClipboardList },
  reconocimientos: { label: "Convivencia positiva", icon: Award },
  inspectoria: { label: "Inspectoría General", icon: Gavel },
  pie: { label: "Integración PIE", icon: Puzzle },
  agenda: { label: "Agenda institucional", icon: Calendar },
  comunicacion: { label: "Comunicación interna", icon: MessageSquare },
  apoderados: { label: "Comunicación con apoderados", icon: Inbox },
  documental: { label: "Gestión documental", icon: Archive },
  gestion: { label: "Redes externas (gestiones)", icon: Share2 },
  nuevo: { label: "Nuevo caso", icon: Plus },
  reportes: { label: "Reportes y estadísticas", icon: BarChart3 },
  planpme: { label: "Plan de convivencia y PME", icon: Target },
  formatos: { label: "Formatos y plantillas", icon: FileText },
  normativa: { label: "Motor normativo", icon: Shield },
  protocolos: { label: "Protocolos del establecimiento", icon: ClipboardCheck },
  redes: { label: "Redes de derivación", icon: Network },
  auditoria: { label: "Panel de auditoría", icon: ClipboardCheck },
  cursos: { label: "Cursos", icon: LayoutGrid },
  perfiles: { label: "Usuarios y accesos", icon: Users },
  permisos: { label: "Permisos por rol", icon: Lock },
  configuracion: { label: "Configuración", icon: Settings },
  micaso: { label: "Mi caso", icon: FolderOpen },
};

/* Agrupación del menú por secciones, con color por sección (paleta Google) */
const NAV_GROUPS = [
  { label: "Principal", color: "#1A73E8", keys: ["dashboard", "alertas", "micaso"] },
  { label: "Casos y estudiantes", color: "#1E8E3E", keys: ["casos", "expedientes", "reconocimientos", "cursos", "inspectoria", "pie", "nuevo"] },
  { label: "Comunicación y agenda", color: "#E8710A", keys: ["agenda", "comunicacion", "apoderados"] },
  { label: "Documentos y redes", color: "#D93025", keys: ["documental", "gestion", "redes", "formatos"] },
  { label: "Análisis y planificación", color: "#1A73E8", keys: ["reportes", "planpme"] },
  { label: "Referencia y cuenta", color: "#5F6368", keys: ["normativa", "protocolos", "auditoria", "perfiles", "permisos", "configuracion"] },
];
function initials(name) { return (name || "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }

/* ===================== PERMISOS POR ROL (matriz configurable) =====================
   Nivel por rol × módulo: "editar" | "ver" | "" (sin acceso).
   Los valores por defecto reproducen el comportamiento actual por scope; cada
   establecimiento puede sobreescribirlos. La ley/gestión sensible sigue acotada. */
const PERM_MODULES = [
  { k: "casos", label: "Casos de convivencia" },
  { k: "expedientes", label: "Expedientes de estudiantes" },
  { k: "reconocimientos", label: "Convivencia positiva" },
  { k: "inspectoria", label: "Inspectoría General" },
  { k: "pie", label: "Integración PIE" },
  { k: "apoderados", label: "Comunicación con apoderados" },
  { k: "comunicacion", label: "Comunicación interna" },
  { k: "agenda", label: "Agenda institucional" },
  { k: "gestion", label: "Redes externas (gestiones)" },
  { k: "documental", label: "Gestión documental" },
  { k: "planpme", label: "Plan de convivencia / PME" },
  { k: "reportes", label: "Reportes y estadísticas" },
  { k: "alertas", label: "Alertas inteligentes" },
  { k: "formatos", label: "Formatos y plantillas" },
  { k: "normativa", label: "Motor normativo" },
  { k: "redes", label: "Redes de derivación" },
  { k: "protocolos", label: "Protocolos del establecimiento" },
];
const PERM_KEYS = new Set(PERM_MODULES.map((m) => m.k));
const PERM_ROLES = ["coordinador", "director", "sostenedor", "superintendencia", "inspectoria", "pie", "orientacion", "utp", "profesorJefe", "docente", "asistente"];
const AUDIT_KEYS = new Set(["alertas", "casos", "expedientes", "inspectoria", "pie", "agenda", "apoderados", "documental", "reportes", "planpme", "gestion", "normativa", "redes", "reconocimientos"]);
const LIMITED_KEYS = new Set(["casos", "expedientes", "pie", "agenda", "comunicacion", "apoderados", "documental", "planpme", "formatos", "normativa", "reconocimientos"]);

function defaultLevel(roleKey, mk) {
  const sc = ROLES[roleKey]?.scope;
  if (sc === "admin") return "editar";
  if (sc === "audit") return AUDIT_KEYS.has(mk) ? "ver" : "";
  if (sc === "limited") return LIMITED_KEYS.has(mk) ? "editar" : "";
  return "";
}
function effLevel(roleKey, mk, permset) {
  const custom = permset && permset[roleKey];
  if (custom && Object.prototype.hasOwnProperty.call(custom, mk)) return custom[mk];
  return defaultLevel(roleKey, mk);
}
function navKeysFromPerms(roleKey, permset) {
  const sc = ROLES[roleKey]?.scope;
  if (sc === "family") return ["dashboard", "casos", "expedientes", "normativa"];
  const keys = ["dashboard", "cursos"];
  for (const m of PERM_MODULES) if (effLevel(roleKey, m.k, permset)) keys.push(m.k);
  if (effLevel(roleKey, "casos", permset) === "editar") keys.push("nuevo");
  if (sc === "admin" || sc === "audit") keys.push("auditoria");
  if (["coordinador", "director"].includes(roleKey)) keys.push("perfiles", "permisos");
  if (sc === "admin") keys.push("configuracion");
  return keys;
}
function moduleForView(v) {
  if (v === "nuevo" || v === "caso") return "casos";
  if (v === "expediente") return "expedientes";
  return v;
}
// Ajusta el "scope" del rol para la vista actual según el nivel de permiso (editar→admin, ver→audit).
function roleForView(role, roleKey, view, permset) {
  if (role.scope === "family" || role.scope === "superadmin") return role;
  const m = moduleForView(view);
  if (!PERM_KEYS.has(m)) return role;
  const lvl = effLevel(roleKey, m, permset);
  if (lvl === "editar") return { ...role, scope: "admin" };
  if (lvl === "ver") return { ...role, scope: "audit" };
  return role;
}

/* Color por tipo de institución (paleta extendida Google) */
const INST_TYPE_COLORS = {
  "protección": "#1E8E3E",
  "seguridad": "#D93025",
  "judicial": "#9334E6",
  "fiscalización": "#1A73E8",
  "salud": "#12A4A4",
  "laboral": "#E8710A",
  "comunitaria": "#B5309E",
  "interno": "#5F6368",
};
const instColor = (id, institutions) => INST_TYPE_COLORS[institutions.find((i) => i.id === id)?.type] || "#5F6368";

/* Color por categoría de caso (agrupa los 13 tipos en familias) */
const CASE_CAT_COLOR = {
  bullying: "#1A73E8", ciberacoso: "#1A73E8", discriminacion: "#1A73E8",
  agresionGrave: "#D93025", drogas: "#D93025",
  vulneracion: "#9334E6", situacionRiesgo: "#9334E6", junjiParvulo: "#9334E6",
  violenciaFuncionario: "#E8710A", maltratoDocenteEstudiante: "#E8710A",
  disciplinario: "#12A4A4", denunciaInterna: "#12A4A4", accidenteEscolar: "#5F6368",
  revisionPertenencias: "#E8710A",
  desregulacion: "#9334E6",
};
const caseColor = (typeKey) => CASE_CAT_COLOR[typeKey] || "#5F6368";

/* Color por categoría documental */
const DOC_CAT_COLOR = {
  "Informe": "#1A73E8", "Acta": "#1E8E3E", "Protocolo": "#9334E6", "Formulario": "#12A4A4",
  "Oficio": "#E8710A", "Resolución": "#D93025", "Certificado": "#B5309E",
  "Consentimiento": "#1A73E8", "Evidencia": "#5F6368", "Otro": "#5F6368",
};

function PortalApp(props) {
  const { session, setSession, cases, setCases, notifications, setNotifications } = props;
  const role = ROLES[session.role];
  const navKeys = navKeysFromPerms(session.role, props.permset);
  const { students, setStudents } = props;
  const [view, setView] = useState("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id);
  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const visibleCases = cases; // el backend ya acota los casos (el apoderado solo ve los de su pupilo/a)
  const pageRole = roleForView(role, session.role, view, props.permset);
  const notifItems = (props.messages || [])
    .filter((m) => m.to === "todos" || m.to === session.role || m.from === session.name)
    .map((m) => ({ id: m.id, from: m.from, at: m.at, title: m.subject, body: m.body }));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sec2fa, setSec2fa] = useState(false);
  function go(v) { setView(v); setMobileOpen(false); }
  function openCase(id) { setSelectedCaseId(id); setView("caso"); setMobileOpen(false); }
  function openStudent(id) { setSelectedStudentId(id); setView("expediente"); setMobileOpen(false); }

  // Crea el caso (y el estudiante si es nuevo) en la base de datos.
  async function persistCase(built) {
    const parts = (built.participants || []).filter((p) => p.studentId);
    let sid = built.studentId;
    // Si no hay estudiante vinculado NI participantes, se crea uno nuevo con los datos escritos.
    if (!sid && parts.length === 0) {
      const ns = await api.createStudent({ name: built.studentLabel, curso: built.curso || null, nivel: built.level || null });
      setStudents((prev) => [...prev, apiStudentToUI(ns)]);
      sid = ns.id;
    }
    const created = await api.createCase({
      code: built.id, typeKey: built.typeKey, studentLabel: built.studentLabel,
      level: built.level, relato: built.relato, curso: built.curso,
      fechaHecho: built.fechaHecho, hora: built.hora, lugar: built.lugar,
      testigos: built.testigos, adultosRef: built.adultosRef, studentId: sid || null,
      participants: parts.map((p) => ({ studentId: p.studentId, role: p.role })),
      steps: built.steps.map((s) => ({ title: s.title, role: s.role, basis: s.basis, due: s.due })),
    });
    const mapped = apiCaseToUI(created);
    setCases((prev) => [mapped, ...prev]);
    setSelectedCaseId(mapped.id);
    setView("caso");
  }

  return (
    <div style={{ background: C.appBg, minHeight: "100vh" }} className="flex">
      {sec2fa && <Security2FA session={session} setSession={setSession} onClose={() => setSec2fa(false)} />}
      <Sidebar navKeys={navKeys} navMap={PORTAL_NAV} view={view} setView={go}
        openCase={openCase} session={session} role={role} onLogout={props.logout} onSecurity={() => setSec2fa(true)}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 shrink-0 sticky top-0 z-20 print:hidden" style={{ background: C.sidebarBg, borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: C.ink }} aria-label="Abrir menú"><Menu size={22} /></button>
          <div style={{ ...serif, color: C.ink }} className="text-base">Recupera Convivencia</div>
          <div className="ml-auto"><NotificationBell items={notifItems} onOpen={() => { if (navKeys.includes("comunicacion")) go("comunicacion"); }} /></div>
        </div>
      <main className="flex-1 p-6 sm:p-10 min-w-0">
        <div className="hidden lg:flex justify-end mb-4"><NotificationBell items={notifItems} onOpen={() => { if (navKeys.includes("comunicacion")) go("comunicacion"); }} /></div>
        {view === "dashboard" && <Dashboard role={pageRole} cases={visibleCases} onOpenCase={openCase} onGo={setView} />}
        {view === "nuevo" && <CaseWizard students={students} protocols={props.protocols} onCreate={persistCase} onCancel={() => setView("dashboard")} />}
        {view === "protocolos" && <ProtocolsPage protocols={props.protocols} setProtocols={props.setProtocols} role={pageRole} />}
        {view === "permisos" && <PermissionsPage permset={props.permset} setPermset={props.setPermset} roleKey={session.role} />}
        {view === "casos" && <CaseList cases={visibleCases} onOpen={openCase} role={pageRole} />}
        {view === "expedientes" && <StudentsPage students={students} cases={cases} onOpen={openStudent} />}
        {view === "cursos" && <CoursesPage students={students} setStudents={setStudents} courseTeachers={props.courseTeachers} setCourseTeachers={props.setCourseTeachers} roleKey={session.role} onOpenStudent={openStudent} />}
        {view === "expediente" && selectedStudent && <StudentDetail student={selectedStudent} cases={cases} setStudents={setStudents} role={pageRole} onOpenCase={openCase} onBack={() => setView("expedientes")} />}
        {view === "reconocimientos" && <ReconocimientosPage students={students} setStudents={setStudents} role={pageRole} roleKey={session.role} onOpenStudent={openStudent} customCats={props.reconCategories} setCustomCats={props.setReconCategories} />}
        {view === "inspectoria" && <InspectoriaPage students={students} setStudents={setStudents} role={pageRole} />}
        {view === "pie" && <PIEPage students={students} setStudents={setStudents} cases={cases} role={pageRole} />}
        {view === "agenda" && <AgendaPage events={props.events} setEvents={props.setEvents} cases={cases} role={pageRole} />}
        {view === "comunicacion" && <MessagesPage messages={props.messages} setMessages={props.setMessages} session={session} role={pageRole} />}
        {view === "apoderados" && <ApoderadosPage students={students} setStudents={setStudents} role={pageRole} />}
        {view === "documental" && <DocumentalPage documents={props.documents} setDocuments={props.setDocuments} cases={cases} role={pageRole} />}
        {view === "gestion" && <GestionRedesPage gestiones={props.gestiones} setGestiones={props.setGestiones} institutions={props.institutions} cases={cases} role={pageRole} />}
        {view === "alertas" && <AlertsPage cases={cases} students={students} gestiones={props.gestiones} onOpenCase={openCase} onOpenStudent={openStudent} onGo={setView} />}
        {view === "caso" && selectedCase && <CaseDetail c={selectedCase} role={pageRole} roleKey={session.role} setCases={setCases} templates={props.emailTemplates} institutions={props.institutions} student={students.find((s) => s.id === selectedCase.studentId)} onOpenStudent={openStudent} onBack={() => setView(role.scope === "family" ? "dashboard" : "casos")} />}
        {view === "reportes" && <ReportsPage cases={cases} setCases={setCases} students={students} />}
        {view === "planpme" && <PlanPMEPage docs={props.docs} setDocs={props.setDocs} acciones={props.acciones} setAcciones={props.setAcciones} role={pageRole} />}
        {view === "formatos" && <FormatosPage />}
        {view === "normativa" && <NormativaPage docs={props.docs} setDocs={props.setDocs} role={pageRole} />}
        {view === "redes" && <RedesPage institutions={props.institutions} />}
        {view === "auditoria" && <AuditPanel cases={cases} />}
        {view === "perfiles" && <PerfilesPage roleKey={session.role} />}
        {view === "configuracion" && <ConfigPage {...props} />}
      </main>
      </div>
    </div>
  );
}

function Sidebar({ navKeys, navMap, view, setView, openCase, session, role, onLogout, onSecurity, mobileOpen, setMobileOpen }) {
  const activeFor = (key) =>
    view === key ||
    (key === "casos" && view === "caso") ||
    (key === "expedientes" && view === "expediente") ||
    (key === "micaso" && view === "caso");

  return (
    <aside style={{ background: C.sidebarBg, borderRight: `1px solid ${C.sidebarBorder}` }} className={`drawer ${mobileOpen ? "open" : ""} w-72 shrink-0 flex flex-col h-screen z-40 print:hidden`}>
      {/* Marca + barra de 4 colores de Google */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <BrandLogo height={36} />
          <button onClick={() => setMobileOpen && setMobileOpen(false)} className="lg:hidden ml-auto" style={{ color: C.sidebarTextSoft }} aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <div className="flex h-1 rounded-full overflow-hidden mt-4">
          <div className="flex-1" style={{ background: "#4285F4" }} />
          <div className="flex-1" style={{ background: "#EA4335" }} />
          <div className="flex-1" style={{ background: "#FBBC04" }} />
          <div className="flex-1" style={{ background: "#34A853" }} />
        </div>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto pb-3">
        {NAV_GROUPS.map((group) => {
          const keys = group.keys.filter((k) => navKeys.includes(k));
          if (keys.length === 0) return null;
          return (
            <div key={group.label} className="mb-1.5">
              <div style={{ color: C.sidebarTextSoft }} className="px-3 pt-3 pb-1 text-[9.5px] font-semibold uppercase tracking-[.13em] flex items-center gap-1.5">
                <span style={{ background: group.color }} className="w-1.5 h-1.5 rounded-full inline-block" /> {group.label}
              </div>
              {keys.map((key) => {
                const item = navMap[key]; const Icon = item.icon;
                const active = activeFor(key);
                return (
                  <button key={key} onClick={() => { if (key === "micaso") openCase("RC-2026-014"); else setView(key); }}
                    className="nav-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-left"
                    style={{ background: active ? group.color + "1F" : undefined, color: active ? group.color : C.sidebarText, fontWeight: active ? 600 : 500 }}>
                    <Icon size={17} style={{ color: group.color, opacity: active ? 1 : 0.85 }} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bloque de sesión */}
      <div className="px-3 pb-3 pt-2" style={{ borderTop: `1px solid ${C.sidebarBorder}` }}>
        <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl mt-1" style={{ background: C.cardBg, border: `1px solid ${C.sidebarBorder}` }}>
          <div style={{ background: C.primary }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold">{initials(session.name)}</div>
          <div className="min-w-0 flex-1">
            <div style={{ color: C.ink }} className="text-sm font-medium truncate">{session.name}</div>
            <div style={{ color: C.sidebarTextSoft }} className="text-[11px] truncate">{role.label}</div>
          </div>
          {onSecurity && (
            <button onClick={onSecurity} title="Seguridad (verificación en dos pasos)" className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-black/5" style={{ color: session.totpEnabled ? C.ok : C.sidebarTextSoft }}><Shield size={16} /></button>
          )}
          <button onClick={onLogout} title="Cerrar sesión" className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-black/5" style={{ color: C.sidebarTextSoft }}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------- DASHBOARD ------------------------------ */
function Dashboard({ role, cases, onOpenCase, onGo }) {
  const isFamily = role.scope === "family";
  const withDeadline = cases.map((c) => {
    const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
    return { c, step, dl: daysLeft(step.due) };
  });
  const overdue = withDeadline.filter((x) => x.dl < 0).length;
  const soon = withDeadline.filter((x) => x.dl >= 0 && x.dl <= 3).length;

  if (isFamily) {
    const item = withDeadline[0];
    return (
      <div className="max-w-3xl">
        <PageHead title="Hola, apoderado/a" subtitle="Este es el estado actual del caso de su pupilo/a." />
        {item && (
          <button onClick={() => onOpenCase(item.c.id)} className="text-left w-full">
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 hover:shadow-sm transition">
              <div style={{ ...mono, color: C.textSoft }} className="text-xs">{item.c.id}</div>
              <div style={{ color: C.ink }} className="text-lg font-medium mt-1">{item.c.type.label}</div>
              <div style={{ color: C.textSoft }} className="text-sm mt-2">Etapa actual: {item.step.title}</div>
              <div className="mt-3"><StatusPill dl={item.dl} /></div>
            </div>
          </button>
        )}
      </div>
    );
  }
  return (
    <div>
      <PageHead title="Panel general" subtitle="Resumen del estado de convivencia del establecimiento." right={<Toolbar onPrint={printView} />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Casos activos" value={cases.length} color={C.ink} />
        <StatCard label="Plazos por vencer (≤3 días)" value={soon} color={C.warn} />
        <StatCard label="Plazos vencidos" value={overdue} color={C.urgent} />
        <StatCard label="Casos al día" value={cases.length - overdue - soon} color={C.ok} />
      </div>
      <div className="flex items-center justify-between mb-3">
        <div style={{ color: C.ink }} className="text-sm font-medium uppercase tracking-wide">Casos recientes</div>
        {role.scope === "admin" && <button onClick={() => onGo("nuevo")} style={{ color: C.seal }} className="text-xs flex items-center gap-1 font-medium"><Plus size={13} /> Nuevo caso</button>}
      </div>
      <div className="flex flex-col gap-2">
        {withDeadline.map(({ c, step, dl }) => (
          <button key={c.id} onClick={() => onOpenCase(c.id)} className="text-left">
            <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${caseColor(c.typeKey)}` }} className="rounded-lg p-4 flex items-center justify-between gap-3 hover:shadow-sm transition">
              <div className="flex items-start gap-2.5">
                <span style={{ background: caseColor(c.typeKey) }} className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <div>
                <span style={{ ...mono, color: C.textSoft }} className="text-xs">{c.id}</span>
                <span style={{ color: C.ink }} className="text-sm ml-3">{c.type.label}</span>
                <div style={{ color: C.textSoft }} className="text-xs mt-1">{step.title}</div>
                </div>
              </div>
              {c.closed ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0">Cerrado</span> : <StatusPill dl={dl} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- CASE LIST ------------------------------ */
function CaseList({ cases, onOpen, role }) {
  return (
    <div>
      <PageHead title="Casos de convivencia" subtitle={role.scope === "audit" ? "Vista de solo lectura." : "Selecciona un caso para ver su paso a paso."} right={<Toolbar onPrint={printView} />} />
      <div className="flex flex-col gap-2">
        {cases.map((c) => {
          const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
          const dl = daysLeft(step.due);
          return (
            <button key={c.id} onClick={() => onOpen(c.id)} className="text-left">
              <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${caseColor(c.typeKey)}` }} className="rounded-lg p-4 flex items-center justify-between gap-3 hover:shadow-sm transition">
                <div className="flex items-start gap-2.5">
                  <span style={{ background: caseColor(c.typeKey) }} className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <span style={{ ...mono, color: C.textSoft }} className="text-xs">{c.id}</span>
                    <span style={{ color: C.ink }} className="text-sm ml-3">{c.type.label}</span>
                    <div style={{ color: C.textSoft }} className="text-xs mt-1">{c.studentLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">{c.closed ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">Cerrado</span> : <StatusPill dl={dl} />}<ChevronRight size={16} color={C.textSoft} /></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------- EXPEDIENTES DE ESTUDIANTES ------------------- */
function StudentsPage({ students, cases, onOpen }) {
  const [q, setQ] = useState("");
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [letra, setLetra] = useState("");
  const LIMIT = 80;
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  const enriched = students.map((s) => ({ s, ...courseParts(s) }));
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const niveles = uniq(enriched.map((e) => e.nivel));
  const grados = uniq(enriched.filter((e) => e.nivel === nivel).map((e) => e.grado)).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  const letras = uniq(enriched.filter((e) => e.nivel === nivel && e.grado === grado).map((e) => e.letra)).sort();
  const query = q.trim().toLowerCase();
  const filtered = enriched.filter((e) =>
    (!nivel || e.nivel === nivel) && (!grado || e.grado === grado) && (!letra || e.letra === letra) &&
    (!query || `${e.s.name} ${e.s.rut || ""} ${e.s.curso || ""}`.toLowerCase().includes(query))
  );
  const shown = filtered.slice(0, LIMIT);
  const Sel = ({ value, onChange, children, disabled }) => (
    <select value={value} onChange={onChange} disabled={disabled} className="rounded-md p-2 text-sm" style={{ ...inp, opacity: disabled ? 0.5 : 1 }}>{children}</select>
  );

  return (
    <div>
      <PageHead title="Expedientes de estudiantes" subtitle="Cada estudiante tiene un expediente único que reúne sus casos e historial (entrevistas, citaciones, compromisos y medidas)." right={<Toolbar onPrint={printView} onExport={() => exportJSON(students, "expedientes.json")} />} />

      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search size={15} color={C.textSoft} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, RUT o curso…"
            className="w-full rounded-md p-2.5 pl-9 text-sm" style={inp} />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Sel value={nivel} onChange={(e) => { setNivel(e.target.value); setGrado(""); setLetra(""); }}>
            <option value="">Todos los niveles</option>
            {niveles.map((n) => <option key={n} value={n}>{LEVELS[n] || n}</option>)}
          </Sel>
          <Sel value={grado} onChange={(e) => { setGrado(e.target.value); setLetra(""); }} disabled={!nivel}>
            <option value="">Todos los grados</option>
            {grados.map((g) => <option key={g} value={g}>{g}</option>)}
          </Sel>
          <Sel value={letra} onChange={(e) => setLetra(e.target.value)} disabled={!grado}>
            <option value="">Todas las letras</option>
            {letras.map((l) => <option key={l} value={l}>{l || "(sin letra)"}</option>)}
          </Sel>
          {(q || nivel || grado || letra) && (
            <button onClick={() => { setQ(""); setNivel(""); setGrado(""); setLetra(""); }} style={{ color: C.primary }} className="text-xs flex items-center gap-1"><X size={13} /> Limpiar</button>
          )}
          <span style={{ color: C.textSoft }} className="text-xs ml-auto">{filtered.length} de {students.length} estudiante(s)</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: C.textSoft }} className="text-sm text-center py-8">Sin coincidencias. Ajusta el buscador o los filtros.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map(({ s }) => {
            const scases = cases.filter((c) => caseHasStudent(c, s.id));
            const abiertos = scases.filter((c) => !c.closed).length;
            return (
              <button key={s.id} onClick={() => onOpen(s.id)} className="text-left">
                <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 flex items-center justify-between gap-3 hover:shadow-sm transition">
                  <div className="flex items-center gap-3">
                    <div style={{ background: C.primary }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"><UserCircle size={18} color="#fff" /></div>
                    <div>
                      <div style={{ color: C.ink }} className="text-sm font-medium">{s.name}</div>
                      <div style={{ color: C.textSoft }} className="text-xs">{s.curso || "Sin curso"} · {LEVELS[s.nivel] || ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: C.textSoft }}>Casos: <b style={{ color: C.ink }}>{scases.length}</b></span>
                    <span style={{ color: C.textSoft }}>Abiertos: <b style={{ color: abiertos ? C.warn : C.ok }}>{abiertos}</b></span>
                    <span style={{ color: C.textSoft }}>Medidas: <b style={{ color: C.ink }}>{(s.medidas || []).length}</b></span>
                    <ChevronRight size={16} color={C.textSoft} />
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length > LIMIT && (
            <div style={{ color: C.textSoft }} className="text-xs text-center py-3">Mostrando {LIMIT} de {filtered.length}. Afina la búsqueda o los filtros para ver el resto.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpBlock({ icon: Icon, title, children }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-4">
      <div style={{ color: C.ink }} className="text-sm font-medium mb-3 flex items-center gap-2"><Icon size={16} style={{ color: C.primary }} /> {title}</div>
      {children}
    </div>
  );
}

/* =================== REPOSITORIO DE CURSOS =================== */
function CoursesPage({ students, setStudents, courseTeachers, setCourseTeachers, roleKey, onOpenStudent }) {
  const canManage = ["coordinador", "director", "superadmin"].includes(roleKey);
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [letra, setLetra] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [imp, setImp] = useState(null); // {rows, activos, retirados} vista previa
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  useEffect(() => { if (canManage) api.listUsers().then((us) => setTeachers(us.filter((u) => u.role === "profesorJefe"))).catch(() => {}); }, [canManage]);

  function readFileText(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // SIGE exporta en Latin-1 (ISO-8859-1); decodificamos correctamente los acentos.
      reader.onload = () => { try { resolve(new TextDecoder("iso-8859-1").decode(reader.result)); } catch (err) { reject(err); } };
      reader.onerror = reject;
      reader.readAsArrayBuffer(f);
    });
  }

  async function onSigeFile(e) {
    const files = [...(e.target.files || [])]; e.target.value = "";
    if (!files.length) return;
    setMsg("");
    try {
      // Combina uno o varios archivos (p. ej. básica + media). Deduplica por RUN.
      const seen = new Set();
      const rows = [];
      for (const f of files) {
        const parsed = parseSigeNomina(await readFileText(f));
        for (const r of parsed) {
          const key = r.rut || `${r.name}|${r.grado}|${r.letra}`;
          if (seen.has(key)) continue;
          seen.add(key); rows.push(r);
        }
      }
      if (!rows.length) { setMsg("No se reconoció el formato. Usa la nómina exportada de SIGE (Excel) o un CSV con las mismas columnas."); return; }
      const activos = rows.filter((r) => !r.retirado);
      setImp({ rows, activos, retirados: rows.length - activos.length, archivos: files.length });
    } catch { setMsg("No se pudo leer el archivo."); }
  }

  async function confirmarImport(incluirRetirados) {
    if (!imp) return;
    setBusy(true); setMsg("");
    try {
      const payload = (incluirRetirados ? imp.rows : imp.activos).map(({ retirado, ...r }) => r);
      const res = await api.bulkStudents(payload);
      const ss = await api.listStudents();
      setStudents(ss.map(apiStudentToUI));
      setImp(null);
      setMsg(`Nómina importada: ${res.created} nuevo(s), ${res.updated} actualizado(s)${res.skipped ? `, ${res.skipped} omitido(s)` : ""}.`);
    } catch (e) { setMsg("Error al importar: " + (e?.error || e?.message || "intenta de nuevo.")); }
    setBusy(false);
  }

  const parts = students.map((s) => ({ s, ...courseParts(s) }));
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const niveles = uniq(parts.map((p) => p.nivel));
  const grados = uniq(parts.filter((p) => p.nivel === nivel).map((p) => p.grado)).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  const letras = uniq(parts.filter((p) => p.nivel === nivel && p.grado === grado).map((p) => p.letra)).sort();
  const alumnos = parts.filter((p) => p.nivel === nivel && p.grado === grado && p.letra === letra).map((p) => p.s);
  const courseKey = `${nivel}|${grado}|${letra}`;
  const ct = courseTeachers || {};
  const assigned = ct[courseKey] && ct[courseKey].userId ? ct[courseKey] : null;
  const cursoLabel = grado && letra ? `${grado}${letra}` : "";

  async function asignarProfe(userId) {
    const u = teachers.find((t) => t.id === userId);
    const cur = courseTeachers ? { ...courseTeachers } : {};
    const id = cur.id; delete cur.id;
    cur[courseKey] = userId ? { userId, name: u?.name || "" } : null;
    try {
      if (id) { await api.updateOrgRecord(id, cur); setCourseTeachers({ id, ...cur }); }
      else { const r = await api.addOrgRecord("courseTeacher", cur); setCourseTeachers({ id: r.id, ...(r.data || {}) }); }
    } catch (e) { console.error("courseTeacher", e); }
  }

  const Sel = ({ value, onChange, children, disabled }) => (
    <select value={value} onChange={onChange} disabled={disabled} className="rounded-md p-2.5 text-sm" style={{ ...inp, opacity: disabled ? 0.5 : 1 }}>{children}</select>
  );

  return (
    <div className="max-w-3xl">
      <PageHead title="Cursos" subtitle="Repositorio de estudiantes por curso. Elige nivel, grado y letra para ver a los alumnos del curso y su profesor jefe." right={<Toolbar onPrint={printView} />} />

      {canManage && (
        <div style={{ background: C.cardBg, border: `1px dashed ${C.cardBorder}` }} className="rounded-lg p-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <UploadCloud size={18} color={C.primary} />
            <div className="flex-1 min-w-[200px]">
              <div style={{ color: C.ink }} className="text-sm font-medium">Importar nómina SIGE</div>
              <div style={{ color: C.textSoft }} className="text-xs">Sube la nómina oficial descargada de SIGE (Excel/HTML) o un CSV. Puedes elegir <b>varios archivos</b> a la vez (ej: básica y media). Arma todos los cursos automáticamente.</div>
            </div>
            <label className="cursor-pointer">
              <span style={{ background: C.primary, color: "#fff" }} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"><UploadCloud size={15} /> Elegir archivo(s)</span>
              <input type="file" multiple accept=".htm,.html,.xls,.xlsx,.csv,.txt" className="hidden" onChange={onSigeFile} />
            </label>
          </div>
          {msg && <div style={{ color: msg.startsWith("Error") || msg.startsWith("No") ? C.urgent : C.primary }} className="text-xs mt-3">{msg}</div>}
          {imp && (
            <div style={{ background: "#fff", border: `1px solid ${C.cardBorder}` }} className="rounded-md p-3 mt-3">
              <div style={{ color: C.ink }} className="text-sm mb-2">Se detectaron <b>{imp.rows.length}</b> estudiante(s){imp.archivos > 1 ? ` en ${imp.archivos} archivos` : ""}: {imp.activos.length} activo(s){imp.retirados ? `, ${imp.retirados} retirado(s)` : ""}.</div>
              <div className="flex gap-2 flex-wrap">
                <Btn onClick={() => confirmarImport(false)} disabled={busy}>{busy ? "Importando…" : `Importar ${imp.activos.length} activos`}</Btn>
                {imp.retirados > 0 && <Btn variant="ghost" onClick={() => confirmarImport(true)} disabled={busy}>Incluir retirados ({imp.rows.length})</Btn>}
                <Btn variant="ghost" onClick={() => setImp(null)} disabled={busy}>Cancelar</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Nivel</label>
          <Sel value={nivel} onChange={(e) => { setNivel(e.target.value); setGrado(""); setLetra(""); }}>
            <option value="">Selecciona…</option>
            {niveles.map((n) => <option key={n} value={n}>{LEVELS[n] || n}</option>)}
          </Sel>
        </div>
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Grado</label>
          <Sel value={grado} onChange={(e) => { setGrado(e.target.value); setLetra(""); }} disabled={!nivel}>
            <option value="">Selecciona…</option>
            {grados.map((g) => <option key={g} value={g}>{g}</option>)}
          </Sel>
        </div>
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Letra</label>
          <Sel value={letra} onChange={(e) => setLetra(e.target.value)} disabled={!grado}>
            <option value="">Selecciona…</option>
            {letras.map((l) => <option key={l} value={l}>{l || "(sin letra)"}</option>)}
          </Sel>
        </div>
      </div>

      {niveles.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">Aún no hay estudiantes registrados. Se irán organizando por curso a medida que se agreguen.</div>}

      {nivel && grado && letra && (
        <>
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div style={{ color: C.ink }} className="text-lg" >{cursoLabel} <span style={{ color: C.textSoft }} className="text-sm">· {LEVELS[nivel] || nivel}</span></div>
                <div style={{ color: C.textSoft }} className="text-xs">{alumnos.length} estudiante(s)</div>
              </div>
              <div className="text-right">
                <div style={{ color: C.textSoft }} className="text-[11px] uppercase tracking-wide">Profesor/a jefe</div>
                {canManage ? (
                  <select value={assigned?.userId || ""} onChange={(e) => asignarProfe(e.target.value)} className="mt-1 rounded-md p-2 text-sm" style={inp}>
                    <option value="">— Sin asignar —</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                ) : (
                  <div style={{ color: assigned ? C.ink : C.textSoft }} className="text-sm mt-1">{assigned ? assigned.name : "Sin asignar"}</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ color: C.ink }} className="text-sm font-medium mb-2">Estudiantes del curso</div>
          {alumnos.length === 0 ? <div style={{ color: C.textSoft }} className="text-sm">Sin estudiantes en este curso.</div> : (
            <div className="flex flex-col gap-2">
              {alumnos.map((st) => (
                <button key={st.id} onClick={() => onOpenStudent(st.id)} className="text-left">
                  <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 flex items-center gap-3 hover:shadow-sm transition">
                    <div style={{ background: C.primary }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"><UserCircle size={16} color="#fff" /></div>
                    <span style={{ color: C.ink }} className="text-sm flex-1">{st.name}</span>
                    <span style={{ color: C.primary }} className="text-xs flex items-center gap-1">Ver expediente <ChevronRight size={13} /></span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StudentDetail({ student: s, cases, setStudents, role, onOpenCase, onBack }) {
  const readOnly = role.scope === "audit" || role.scope === "family";
  const scases = cases.filter((c) => caseHasStudent(c, s.id));
  const [ent, setEnt] = useState({ fecha: "", con: "Apoderado/a", resumen: "", foto: null });
  const [cit, setCit] = useState({ fecha: "", motivo: "", estado: "Asiste", excusa: "" });
  const [com, setCom] = useState("");
  const [med, setMed] = useState({ tipo: "formativa", descripcion: "", fecha: "" });

  function update(fn) { setStudents((prev) => prev.map((x) => (x.id === s.id ? fn(x) : x))); }
  async function add(kind, record) {
    try {
      let created;
      if (kind === "entrevistas") created = await api.addEntrevista(s.id, record);
      else if (kind === "citaciones") created = await api.addCitacion(s.id, record);
      else if (kind === "compromisos") created = await api.addCompromiso(s.id, record.texto);
      else if (kind === "medidas") created = await api.addMedida(s.id, record);
      else created = { id: `${kind}${Date.now()}`, ...record };
      update((x) => ({ ...x, [kind]: [...(x[kind] || []), created] }));
    } catch (e) { console.error("add", kind, e); toast("No se pudo guardar el registro. Inténtalo de nuevo."); }
  }
  function toggleCompromiso(cid) {
    const cur = (s.compromisos || []).find((k) => k.id === cid);
    const next = !(cur && cur.cumplido);
    update((x) => ({ ...x, compromisos: x.compromisos.map((k) => (k.id === cid ? { ...k, cumplido: next } : k)) }));
    api.setCompromiso(cid, next).catch((e) => {
      console.error("setCompromiso", e); toast("No se pudo actualizar el compromiso. Se revirtió.");
      update((x) => ({ ...x, compromisos: x.compromisos.map((k) => (k.id === cid ? { ...k, cumplido: !next } : k)) }));
    });
  }

  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const chip = (bg, color, txt) => <span style={{ background: bg, color }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{txt}</span>;

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} style={{ color: C.textSoft }} className="text-xs mb-4 flex items-center gap-1 print:hidden">← Volver a expedientes</button>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-3">
          <div style={{ background: C.primary }} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"><UserCircle size={22} color="#fff" /></div>
          <div>
            <div style={{ ...serif, color: C.ink }} className="text-2xl">{s.name}</div>
            <div style={{ color: C.textSoft }} className="text-sm">{s.curso || "Sin curso"} · {LEVELS[s.nivel] || ""} · Expediente digital único</div>
          </div>
        </div>
        <Toolbar onPrint={printView} />
      </div>

      <ExpBlock icon={FolderOpen} title={`Casos del estudiante (${scases.length})`}>
        {scases.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">Sin casos registrados.</div>}
        <div className="flex flex-col gap-2">
          {scases.map((c) => {
            const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
            const dl = daysLeft(step.due);
            return (
              <button key={c.id} onClick={() => onOpenCase(c.id)} className="text-left">
                <div style={{ border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${caseColor(c.typeKey)}` }} className="rounded-lg p-3 flex items-center justify-between gap-3 hover:shadow-sm transition">
                  <div className="flex items-center gap-2"><span style={{ background: caseColor(c.typeKey) }} className="w-2 h-2 rounded-full shrink-0" /><span style={{ ...mono, color: C.textSoft }} className="text-xs">{c.id}</span><span style={{ color: C.ink }} className="text-sm ml-1">{c.type.label}</span></div>
                  {c.closed ? chip(C.ok + "22", C.ok, "Cerrado") : <StatusPill dl={dl} />}
                </div>
              </button>
            );
          })}
        </div>
      </ExpBlock>

      <ExpBlock icon={Award} title={`Convivencia positiva (${(s.reconocimientos || []).length})`}>
        {(() => {
          const recs = s.reconocimientos || [];
          const badge = RECON_BADGES.find((b) => recs.length >= b.min);
          return (
            <>
              {badge && <div className="mb-2"><span style={{ background: badge.color + "22", color: badge.color }} className="text-xs font-medium px-2.5 py-1 rounded-full">{badge.emoji} Insignia {badge.label} · {recs.length} reconocimiento(s)</span></div>}
              {recs.length === 0 ? <div style={{ color: C.textSoft }} className="text-sm">Aún sin reconocimientos. Regístralos en “Convivencia positiva”.</div>
                : <div className="flex flex-col gap-2">
                    {recs.slice().reverse().map((r, i) => {
                      const c = RECON_CATEGORIES.find((x) => x.key === r.categoria) || {};
                      const col = r.categoriaColor || c.color || C.ok;
                      return (
                        <div key={r.id || i} style={{ background: C.paper, border: `1px solid ${C.cardBorder}` }} className="rounded-md p-2.5 text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ background: col + "18", color: col }} className="text-[11px] px-2 py-0.5 rounded-full">{r.categoriaEmoji || c.emoji || "🌟"} {r.categoriaLabel || c.label || "Reconocimiento"}</span>
                            <span style={{ color: C.textSoft }} className="text-xs ml-auto">{r.fecha}</span>
                          </div>
                          {r.descripcion && <div style={{ color: C.text }} className="mt-1">{r.descripcion}</div>}
                        </div>
                      );
                    })}
                  </div>}
            </>
          );
        })()}
      </ExpBlock>

      <ExpBlock icon={UserCircle} title={`Entrevistas (${(s.entrevistas || []).length})`}>
        <div className="flex flex-col gap-2 mb-3">
          {(s.entrevistas || []).map((e) => (
            <div key={e.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs">
              <div style={{ color: C.ink }} className="font-medium">{e.con} · {e.fecha || "sin fecha"}</div>
              {e.resumen && <div style={{ color: C.textSoft }}>{e.resumen}</div>}
              {e.foto && <a href={e.foto} target="_blank" rel="noreferrer" className="inline-block mt-1.5"><img src={e.foto} alt="Foto de la entrevista" className="w-24 h-24 object-cover rounded-md" style={{ border: `1px solid ${C.cardBorder}` }} /></a>}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex flex-col gap-2 print:hidden">
            <div className="flex flex-wrap gap-2">
              <input type="date" value={ent.fecha} onChange={(e) => setEnt({ ...ent, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
              <input value={ent.con} onChange={(e) => setEnt({ ...ent, con: e.target.value })} placeholder="Con quién" className="rounded-md p-2 text-sm" style={inp} />
              <input value={ent.resumen} onChange={(e) => setEnt({ ...ent, resumen: e.target.value })} placeholder="Resumen (o adjunta la foto)" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="mbtn-outline text-xs px-3.5 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}>
                <Camera size={15} /> {ent.foto ? "Cambiar foto" : "Tomar / subir foto"}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setEnt((p) => ({ ...p, foto: r.result })); r.readAsDataURL(f); } e.target.value = ""; }} />
              </label>
              {ent.foto && <img src={ent.foto} alt="Vista previa" className="w-12 h-12 object-cover rounded-md" style={{ border: `1px solid ${C.cardBorder}` }} />}
              <Btn onClick={() => { if (ent.resumen.trim() || ent.foto) { add("entrevistas", ent); setEnt({ fecha: "", con: "Apoderado/a", resumen: "", foto: null }); } }}><Plus size={14} /> Agregar</Btn>
            </div>
          </div>
        )}
      </ExpBlock>

      <ExpBlock icon={CalendarClock} title={`Citaciones (${(s.citaciones || []).length})`}>
        <div className="flex flex-col gap-2 mb-3">
          {(s.citaciones || []).map((c) => (
            <div key={c.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs flex items-center justify-between gap-2 flex-wrap">
              <div><span style={{ color: C.ink }} className="font-medium">{c.motivo}</span> <span style={{ color: C.textSoft }}>· {c.fecha || "sin fecha"}{c.estado === "No asiste" && c.excusa ? ` · Excusa: ${c.excusa}` : ""}</span></div>
              {c.estado === "Asiste" ? chip(C.ok + "22", C.ok, "Asiste") : chip(C.warn + "22", C.warn, "No asiste")}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2 print:hidden">
            <input type="date" value={cit.fecha} onChange={(e) => setCit({ ...cit, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
            <input value={cit.motivo} onChange={(e) => setCit({ ...cit, motivo: e.target.value })} placeholder="Motivo" className="rounded-md p-2 text-sm flex-1 min-w-[140px]" style={inp} />
            <select value={cit.estado} onChange={(e) => setCit({ ...cit, estado: e.target.value })} className="rounded-md p-2 text-sm" style={inp}><option>Asiste</option><option>No asiste</option></select>
            {cit.estado === "No asiste" && <input value={cit.excusa} onChange={(e) => setCit({ ...cit, excusa: e.target.value })} placeholder="Excusa" className="rounded-md p-2 text-sm" style={inp} />}
            <Btn onClick={() => { if (cit.motivo.trim()) { add("citaciones", cit); setCit({ fecha: "", motivo: "", estado: "Asiste", excusa: "" }); } }}><Plus size={14} /> Agregar</Btn>
          </div>
        )}
      </ExpBlock>

      <ExpBlock icon={CheckCircle2} title={`Compromisos (${(s.compromisos || []).length})`}>
        <div className="flex flex-col gap-1.5 mb-3">
          {(s.compromisos || []).map((k) => (
            <label key={k.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={k.cumplido} onChange={() => !readOnly && toggleCompromiso(k.id)} />
              <span style={{ color: k.cumplido ? C.textSoft : C.ink, textDecoration: k.cumplido ? "line-through" : "none" }}>{k.texto}</span>
            </label>
          ))}
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2 print:hidden">
            <input value={com} onChange={(e) => setCom(e.target.value)} placeholder="Nuevo compromiso" className="rounded-md p-2 text-sm flex-1 min-w-[200px]" style={inp} />
            <Btn onClick={() => { if (com.trim()) { add("compromisos", { texto: com, cumplido: false }); setCom(""); } }}><Plus size={14} /> Agregar</Btn>
          </div>
        )}
      </ExpBlock>

      <ExpBlock icon={Scale} title={`Medidas (${(s.medidas || []).length})`}>
        <div className="flex flex-col gap-2 mb-3">
          {(s.medidas || []).map((m) => {
            const mt = MEASURE_TYPES.find((t) => t.value === m.tipo);
            const col = m.tipo === "disciplinaria" ? C.urgent : m.tipo === "pedagogica" ? C.warn : C.primary;
            return (
              <div key={m.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs flex items-center justify-between gap-2 flex-wrap">
                <div><span style={{ color: C.ink }}>{m.descripcion}</span> <span style={{ color: C.textSoft }}>· {m.fecha || "sin fecha"}</span></div>
                {chip(col + "22", col, mt ? mt.label : m.tipo)}
              </div>
            );
          })}
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2 print:hidden">
            <select value={med.tipo} onChange={(e) => setMed({ ...med, tipo: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>
              {MEASURE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input value={med.descripcion} onChange={(e) => setMed({ ...med, descripcion: e.target.value })} placeholder="Descripción" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} />
            <input type="date" value={med.fecha} onChange={(e) => setMed({ ...med, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
            <Btn onClick={() => { if (med.descripcion.trim()) { add("medidas", med); setMed({ tipo: "formativa", descripcion: "", fecha: "" }); } }}><Plus size={14} /> Agregar</Btn>
          </div>
        )}
      </ExpBlock>
    </div>
  );
}

/* =================== MÓDULO 4 — INSPECTORÍA GENERAL =============== */
function InspectoriaPage({ students, setStudents, role }) {
  const readOnly = role.scope === "audit";
  const [sid, setSid] = useState(students[0]?.id);
  const s = students.find((x) => x.id === sid);
  const [anot, setAnot] = useState({ tipo: "negativa", fecha: "", descripcion: "" });
  const [susp, setSusp] = useState({ fechaInicio: "", dias: "", motivo: "" });
  const [atr, setAtr] = useState({ fecha: "", cantidad: "1" });
  const [ret, setRet] = useState({ fecha: "", hora: "", retira: "", motivo: "" });

  const sum = (k, fn) => students.reduce((a, x) => a + fn(x[k] || []), 0);
  const totAnotNeg = sum("anotaciones", (arr) => arr.filter((n) => n.tipo === "negativa").length);
  const totSusp = sum("suspensiones", (arr) => arr.length);
  const totAtrasos = sum("atrasos", (arr) => arr.reduce((b, t) => b + (Number(t.cantidad) || 1), 0));
  const totRetiros = sum("retiros", (arr) => arr.length);

  function add(kind, record) { addStudentRec(setStudents, sid, kind, record); }
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const chip = (bg, color, txt) => <span style={{ background: bg, color }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{txt}</span>;
  const anotColor = { positiva: C.ok, negativa: C.urgent, neutra: C.textSoft };

  return (
    <div className="max-w-3xl">
      <PageHead title="Inspectoría General" subtitle="Hoja de vida, control disciplinario, suspensiones, atrasos y retiros. Todo queda vinculado al estudiante." right={<Toolbar onPrint={printView} onExport={() => exportJSON(students, "inspectoria.json")} />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Anotaciones negativas" value={totAnotNeg} color={C.urgent} />
        <StatCard label="Suspensiones" value={totSusp} color={C.warn} />
        <StatCard label="Atrasos (total)" value={totAtrasos} color={C.ink} />
        <StatCard label="Retiros" value={totRetiros} color={C.ink} />
      </div>
      <div className="mb-4 print:hidden">
        <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Estudiante</label>
        <select value={sid} onChange={(e) => setSid(e.target.value)} className="mt-1.5 w-full max-w-sm rounded-md p-2.5 text-sm" style={inp}>
          {students.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.curso}</option>)}
        </select>
      </div>
      {s && (
        <>
          <ExpBlock icon={FileText} title={`Anotaciones — hoja de vida (${(s.anotaciones || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">
              {(s.anotaciones || []).map((n) => (
                <div key={n.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs flex items-center justify-between gap-2 flex-wrap">
                  <div><span style={{ color: C.ink }}>{n.descripcion}</span> <span style={{ color: C.textSoft }}>· {n.fecha || "sin fecha"}</span></div>
                  {chip(anotColor[n.tipo] + "22", anotColor[n.tipo], ANOTACION_TYPES.find((t) => t.value === n.tipo)?.label || n.tipo)}
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <select value={anot.tipo} onChange={(e) => setAnot({ ...anot, tipo: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>{ANOTACION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                <input type="date" value={anot.fecha} onChange={(e) => setAnot({ ...anot, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input value={anot.descripcion} onChange={(e) => setAnot({ ...anot, descripcion: e.target.value })} placeholder="Descripción" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} />
                <Btn onClick={() => { if (anot.descripcion.trim()) { add("anotaciones", anot); setAnot({ tipo: "negativa", fecha: "", descripcion: "" }); } }}><Plus size={14} /> Agregar</Btn>
              </div>
            )}
          </ExpBlock>

          <ExpBlock icon={Lock} title={`Suspensiones (${(s.suspensiones || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">
              {(s.suspensiones || []).map((x) => (
                <div key={x.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs"><span style={{ color: C.ink }}>{x.dias} día(s)</span> <span style={{ color: C.textSoft }}>· desde {x.fechaInicio || "sin fecha"} · {x.motivo}</span></div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <input type="date" value={susp.fechaInicio} onChange={(e) => setSusp({ ...susp, fechaInicio: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input type="number" min="1" value={susp.dias} onChange={(e) => setSusp({ ...susp, dias: e.target.value })} placeholder="Días" className="rounded-md p-2 text-sm w-20" style={inp} />
                <input value={susp.motivo} onChange={(e) => setSusp({ ...susp, motivo: e.target.value })} placeholder="Motivo" className="rounded-md p-2 text-sm flex-1 min-w-[140px]" style={inp} />
                <Btn onClick={() => { if (susp.dias) { add("suspensiones", susp); setSusp({ fechaInicio: "", dias: "", motivo: "" }); } }}><Plus size={14} /> Agregar</Btn>
              </div>
            )}
          </ExpBlock>

          <ExpBlock icon={Clock} title={`Atrasos (${(s.atrasos || []).length} registros)`}>
            <div className="flex flex-col gap-2 mb-3">
              {(s.atrasos || []).map((x) => (
                <div key={x.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs"><span style={{ color: C.ink }}>{x.cantidad} atraso(s)</span> <span style={{ color: C.textSoft }}>· {x.fecha || "sin fecha"}</span></div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <input type="date" value={atr.fecha} onChange={(e) => setAtr({ ...atr, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input type="number" min="1" value={atr.cantidad} onChange={(e) => setAtr({ ...atr, cantidad: e.target.value })} placeholder="Cantidad" className="rounded-md p-2 text-sm w-24" style={inp} />
                <Btn onClick={() => { if (atr.fecha) { add("atrasos", atr); setAtr({ fecha: "", cantidad: "1" }); } }}><Plus size={14} /> Agregar</Btn>
              </div>
            )}
          </ExpBlock>

          <ExpBlock icon={LogOut} title={`Retiros (${(s.retiros || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">
              {(s.retiros || []).map((x) => (
                <div key={x.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs"><span style={{ color: C.ink }}>{x.fecha} {x.hora}</span> <span style={{ color: C.textSoft }}>· retira: {x.retira} · {x.motivo}</span></div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <input type="date" value={ret.fecha} onChange={(e) => setRet({ ...ret, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input type="time" value={ret.hora} onChange={(e) => setRet({ ...ret, hora: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input value={ret.retira} onChange={(e) => setRet({ ...ret, retira: e.target.value })} placeholder="Retira (nombre)" className="rounded-md p-2 text-sm" style={inp} />
                <input value={ret.motivo} onChange={(e) => setRet({ ...ret, motivo: e.target.value })} placeholder="Motivo" className="rounded-md p-2 text-sm flex-1 min-w-[120px]" style={inp} />
                <Btn onClick={() => { if (ret.fecha) { add("retiros", ret); setRet({ fecha: "", hora: "", retira: "", motivo: "" }); } }}><Plus size={14} /> Agregar</Btn>
              </div>
            )}
          </ExpBlock>
        </>
      )}
    </div>
  );
}

/* =================== MÓDULO 10 — AGENDA INSTITUCIONAL ============= */
function AgendaPage({ events, setEvents, cases, role }) {
  const readOnly = role.scope === "audit";
  const [ev, setEv] = useState({ tipo: "Entrevista", title: "", fecha: "", hora: "", notas: "", recordar: 1 });
  const derived = cases.filter((c) => !c.closed).map((c) => {
    const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
    return { id: "dl-" + c.id, tipo: "Plazo legal", title: `${c.type.label} — ${step.title}`, fecha: step.due ? new Date(step.due).toISOString().slice(0, 10) : "", hora: "", notas: "Caso " + c.id, derived: true };
  }).filter((e) => e.fecha);
  const all = [...events, ...derived].sort((a, b) => (a.fecha + (a.hora || "")).localeCompare(b.fecha + (b.hora || "")));
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  function add() { if (ev.title.trim() && ev.fecha) { orgAdd(setEvents, "event", ev, { prepend: false }); setEv({ tipo: "Entrevista", title: "", fecha: "", hora: "", notas: "", recordar: 1 }); } }

  return (
    <div className="max-w-3xl">
      <PageHead title="Agenda institucional" subtitle="Entrevistas, reuniones, citaciones, audiencias, visitas y plazos legales. Los plazos de los casos activos aparecen automáticamente." right={<Toolbar onPrint={printView} onExport={() => exportJSON(events, "agenda.json")} />} />
      {!readOnly && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-5 print:hidden">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Nuevo evento</div>
          <div className="flex flex-wrap gap-2">
            <select value={ev.tipo} onChange={(e) => setEv({ ...ev, tipo: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            <input value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} placeholder="Título" className="rounded-md p-2 text-sm flex-1 min-w-[180px]" style={inp} />
            <input type="date" value={ev.fecha} onChange={(e) => setEv({ ...ev, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
            <input type="time" value={ev.hora} onChange={(e) => setEv({ ...ev, hora: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
            <input value={ev.notas} onChange={(e) => setEv({ ...ev, notas: e.target.value })} placeholder="Notas" className="rounded-md p-2 text-sm flex-1 min-w-[140px]" style={inp} />
            <div className="flex items-center gap-1.5 text-xs" style={{ color: C.textSoft }}><span>Recordar</span><input type="number" min="0" value={ev.recordar} onChange={(e) => setEv({ ...ev, recordar: Number(e.target.value) })} className="rounded-md p-2 text-sm w-16" style={inp} /><span>días antes</span></div>
            <Btn onClick={add}><Plus size={14} /> Agendar</Btn>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {all.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No hay eventos en la agenda.</div>}
        {all.map((e) => {
          const dl = e.fecha ? daysLeft(new Date(e.fecha + "T" + (e.hora || "23:59"))) : 99;
          const color = urgencyColor(dl, C);
          return (
            <div key={e.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${color}` }} className="rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="text-center shrink-0" style={{ minWidth: 46 }}>
                  <div style={{ ...mono, color: C.ink }} className="text-sm font-semibold">{e.fecha?.slice(8, 10)}</div>
                  <div style={{ color: C.textSoft }} className="text-[10px] uppercase">{["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][Number(e.fecha?.slice(5, 7)) - 1]}</div>
                </div>
                <div>
                  <div style={{ color: C.ink }} className="text-sm font-medium">{e.title}</div>
                  <div style={{ color: C.textSoft }} className="text-xs">{e.tipo}{e.hora ? ` · ${e.hora}` : ""}{e.notas ? ` · ${e.notas}` : ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span style={{ color }} className="text-xs font-medium whitespace-nowrap">{dl < 0 ? `hace ${-dl}d` : dl === 0 ? "hoy" : `en ${dl}d`}</span>
                {!readOnly && !e.derived && <button onClick={() => orgDelete(setEvents, e.id)} style={{ color: C.textSoft }} className="print:hidden"><Trash2 size={14} /></button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =================== MÓDULO 6 — COMUNICACIÓN INTERNA ============== */
function MessagesPage({ messages, setMessages, session, role }) {
  const [to, setTo] = useState("todos");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const recipients = Object.entries(ROLES).filter(([k]) => k !== "superadmin" && k !== "apoderado");
  const inbox = messages.filter((m) => m.to === "todos" || m.to === session.role || m.from === session.name);
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  function send() {
    if (!subject.trim()) return;
    orgAdd(setMessages, "message", { from: session.name, fromRole: role.label, to, subject, body, at: new Date().toISOString().slice(0, 10), read: false });
    setSubject(""); setBody(""); setSent(true); setTimeout(() => setSent(false), 2500);
  }

  return (
    <div className="max-w-3xl">
      <PageHead title="Comunicación interna" subtitle="Mensajes y alertas entre estamentos (Dirección, Inspectoría, Convivencia, PIE, Orientación, UTP, docentes). Cada comunicación queda registrada." right={<Toolbar onPrint={printView} onExport={() => exportJSON(messages, "comunicaciones.json")} />} />
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-5 print:hidden">
        <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Nuevo mensaje</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ color: C.textSoft }} className="text-xs">Para:</span>
            <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md p-2 text-sm" style={inp}>
              <option value="todos">Todos los estamentos (alerta masiva)</option>
              {recipients.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" className="rounded-md p-2.5 text-sm" style={inp} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Mensaje…" className="rounded-md p-2.5 text-sm" style={inp} />
          <div className="flex items-center gap-3"><Btn onClick={send}><Send size={14} /> Enviar</Btn>{sent && <span style={{ color: C.ok }} className="text-sm flex items-center gap-1"><CheckCircle2 size={15} /> Enviado</span>}</div>
        </div>
      </div>
      <div style={{ color: C.ink }} className="text-sm font-medium mb-3 uppercase tracking-wide">Bandeja</div>
      <div className="flex flex-col gap-2">
        {inbox.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">No hay mensajes.</div>}
        {inbox.map((m) => {
          const enviado = m.from === session.name;
          const dest = m.to === "todos" ? "Todos" : ROLES[m.to]?.label || m.to;
          return (
            <div key={m.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div style={{ color: C.textSoft }} className="text-[11px] uppercase tracking-wide">{enviado ? `Enviado a ${dest}` : `De ${m.fromRole || m.from}`} · {m.at}</div>
                <span style={{ background: enviado ? C.adminSoft : C.paper, color: enviado ? C.admin : C.seal }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{enviado ? "Enviado" : "Recibido"}</span>
              </div>
              <div style={{ color: C.ink }} className="text-sm font-medium mt-1">{m.subject}</div>
              {m.body && <div style={{ color: C.textSoft }} className="text-sm mt-0.5">{m.body}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =================== MÓDULO 5 — INTEGRACIÓN PIE ================== */
function PIEPage({ students, setStudents, cases, role }) {
  const readOnly = role.scope === "audit";
  const [sid, setSid] = useState(students[0]?.id);
  const s = students.find((x) => x.id === sid);
  const [inf, setInf] = useState({ fecha: "", profesional: "", resumen: "" });
  const [ade, setAde] = useState({ fecha: "", descripcion: "" });
  const [est, setEst] = useState({ descripcion: "", paec: true });
  const [reu, setReu] = useState({ fecha: "", participantes: "", acuerdos: "" });

  const totNEE = students.filter((x) => x.nee).length;
  const totInf = students.reduce((a, x) => a + (x.pieInformes || []).length, 0);
  const totAde = students.reduce((a, x) => a + (x.pieAdecuaciones || []).length, 0);
  const totReu = students.reduce((a, x) => a + (x.pieReuniones || []).length, 0);

  function add(kind, record) { addStudentRec(setStudents, sid, kind, record); }
  function toggleNee() {
    const next = !s.nee;
    setStudents((prev) => prev.map((x) => (x.id === sid ? { ...x, nee: next } : x)));
    api.updateStudent(sid, { nee: next }).catch((e) => {
      console.error("nee", e); toast("No se pudo actualizar. Se revirtió.");
      setStudents((prev) => prev.map((x) => (x.id === sid ? { ...x, nee: !next } : x)));
    });
  }
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const scases = cases.filter((c) => caseHasStudent(c, sid));

  return (
    <div className="max-w-3xl">
      <PageHead title="Integración PIE" subtitle="Programa de Integración Escolar: NEE, informes, adecuaciones, estrategias (PAEC) y reuniones interdisciplinarias. Comparte datos con Convivencia para no duplicar." right={<Toolbar onPrint={printView} onExport={() => exportJSON(students, "pie.json")} />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Estudiantes con NEE" value={totNEE} color={C.primary} />
        <StatCard label="Informes profesionales" value={totInf} color={C.ink} />
        <StatCard label="Adecuaciones" value={totAde} color={C.ink} />
        <StatCard label="Reuniones interdisc." value={totReu} color={C.ink} />
      </div>
      <div className="mb-4 flex items-center gap-4 flex-wrap print:hidden">
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Estudiante</label>
          <select value={sid} onChange={(e) => setSid(e.target.value)} className="mt-1.5 rounded-md p-2.5 text-sm" style={inp}>
            {students.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.curso}{x.nee ? " · NEE" : ""}</option>)}
          </select>
        </div>
        {s && !readOnly && <label className="flex items-center gap-2 text-sm mt-5" style={{ color: C.ink }}><input type="checkbox" checked={!!s.nee} onChange={toggleNee} /> Tiene NEE</label>}
      </div>
      {s && (
        <>
          {s.nee && s.neeTipo && <div style={{ background: C.adminSoft, color: C.admin }} className="rounded-md p-2.5 text-xs mb-4">NEE: {s.neeTipo}</div>}
          <ExpBlock icon={FolderOpen} title={`Casos de convivencia (espejo — ${scases.length})`}>
            {scases.length === 0 ? <div style={{ color: C.textSoft }} className="text-sm">Sin casos.</div> : (
              <div className="flex flex-col gap-1.5">{scases.map((c) => <div key={c.id} style={{ color: C.textSoft }} className="text-xs"><b style={{ color: C.ink }}>{c.id}</b> · {c.type.label}{c.closed ? " (cerrado)" : ""}</div>)}</div>
            )}
            <div style={{ color: C.textSoft }} className="text-[11px] mt-2">Datos tomados de Convivencia — no se re-ingresan aquí (evita duplicación).</div>
          </ExpBlock>
          <ExpBlock icon={FileText} title={`Informes profesionales (${(s.pieInformes || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">{(s.pieInformes || []).map((x) => <div key={x.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs"><span style={{ color: C.ink }} className="font-medium">{x.profesional} · {x.fecha}</span><div style={{ color: C.textSoft }}>{x.resumen}</div></div>)}</div>
            {!readOnly && <div className="flex flex-wrap gap-2 print:hidden"><input type="date" value={inf.fecha} onChange={(e) => setInf({ ...inf, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} /><input value={inf.profesional} onChange={(e) => setInf({ ...inf, profesional: e.target.value })} placeholder="Profesional" className="rounded-md p-2 text-sm" style={inp} /><input value={inf.resumen} onChange={(e) => setInf({ ...inf, resumen: e.target.value })} placeholder="Resumen" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} /><Btn onClick={() => { if (inf.resumen.trim()) { add("pieInformes", inf); setInf({ fecha: "", profesional: "", resumen: "" }); } }}><Plus size={14} /> Agregar</Btn></div>}
          </ExpBlock>
          <ExpBlock icon={CheckCircle2} title={`Adecuaciones (${(s.pieAdecuaciones || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">{(s.pieAdecuaciones || []).map((x) => <div key={x.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs"><span style={{ color: C.ink }}>{x.descripcion}</span> <span style={{ color: C.textSoft }}>· {x.fecha}</span></div>)}</div>
            {!readOnly && <div className="flex flex-wrap gap-2 print:hidden"><input type="date" value={ade.fecha} onChange={(e) => setAde({ ...ade, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} /><input value={ade.descripcion} onChange={(e) => setAde({ ...ade, descripcion: e.target.value })} placeholder="Adecuación implementada" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} /><Btn onClick={() => { if (ade.descripcion.trim()) { add("pieAdecuaciones", ade); setAde({ fecha: "", descripcion: "" }); } }}><Plus size={14} /> Agregar</Btn></div>}
          </ExpBlock>
          <ExpBlock icon={Sparkles} title={`Estrategias de apoyo — PAEC (${(s.pieEstrategias || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">{(s.pieEstrategias || []).map((x) => <div key={x.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs flex items-center justify-between gap-2"><span style={{ color: C.ink }}>{x.descripcion}</span>{x.paec && <span style={{ background: C.primary + "22", color: C.primary }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">PAEC</span>}</div>)}</div>
            {!readOnly && <div className="flex flex-wrap gap-2 items-center print:hidden"><input value={est.descripcion} onChange={(e) => setEst({ ...est, descripcion: e.target.value })} placeholder="Estrategia de apoyo" className="rounded-md p-2 text-sm flex-1 min-w-[180px]" style={inp} /><label className="flex items-center gap-1.5 text-xs" style={{ color: C.textSoft }}><input type="checkbox" checked={est.paec} onChange={(e) => setEst({ ...est, paec: e.target.checked })} /> Vincular a PAEC</label><Btn onClick={() => { if (est.descripcion.trim()) { add("pieEstrategias", est); setEst({ descripcion: "", paec: true }); } }}><Plus size={14} /> Agregar</Btn></div>}
          </ExpBlock>
          <ExpBlock icon={Users} title={`Reuniones interdisciplinarias y acuerdos (${(s.pieReuniones || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">{(s.pieReuniones || []).map((x) => <div key={x.id} style={{ background: C.paper }} className="rounded-md p-2.5 text-xs"><span style={{ color: C.ink }} className="font-medium">{x.fecha} · {x.participantes}</span><div style={{ color: C.textSoft }}>Acuerdos: {x.acuerdos}</div></div>)}</div>
            {!readOnly && <div className="flex flex-wrap gap-2 print:hidden"><input type="date" value={reu.fecha} onChange={(e) => setReu({ ...reu, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} /><input value={reu.participantes} onChange={(e) => setReu({ ...reu, participantes: e.target.value })} placeholder="Participantes" className="rounded-md p-2 text-sm" style={inp} /><input value={reu.acuerdos} onChange={(e) => setReu({ ...reu, acuerdos: e.target.value })} placeholder="Acuerdos" className="rounded-md p-2 text-sm flex-1 min-w-[140px]" style={inp} /><Btn onClick={() => { if (reu.participantes.trim()) { add("pieReuniones", reu); setReu({ fecha: "", participantes: "", acuerdos: "" }); } }}><Plus size={14} /> Agregar</Btn></div>}
          </ExpBlock>
        </>
      )}
    </div>
  );
}

/* =================== MÓDULO 8 — REDES EXTERNAS (GESTIONES) ======== */
function GestionRedesPage({ gestiones, setGestiones, institutions, cases, role }) {
  const readOnly = role.scope === "audit";
  const [g, setG] = useState({ tipo: "Oficio enviado", institucion: institutions[0]?.label || "", caso: "", fecha: "", detalle: "", estado: "Pendiente" });
  const [festado, setFestado] = useState("");
  const rows = gestiones.filter((x) => !festado || x.estado === festado);
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const estadoColor = { Pendiente: C.warn, "En curso": C.admin, Respondido: C.ok, Cumplido: C.ok };
  const nOficios = gestiones.filter((x) => x.tipo === "Oficio enviado").length;
  const nDeriv = gestiones.filter((x) => x.tipo === "Derivación").length;
  const nPend = gestiones.filter((x) => x.estado === "Pendiente").length;
  const nJud = gestiones.filter((x) => x.tipo === "Medida judicial").length;

  function add() { if (g.detalle.trim()) { orgAdd(setGestiones, "gestion", g); setG({ tipo: "Oficio enviado", institucion: institutions[0]?.label || "", caso: "", fecha: "", detalle: "", estado: "Pendiente" }); } }

  return (
    <div className="max-w-4xl">
      <PageHead title="Redes externas — gestiones" subtitle="Registro de oficios, derivaciones, informes, respuestas, audiencias, medidas judiciales y cumplimiento de resoluciones con organismos externos." right={<Toolbar onPrint={printView} onExport={() => exportJSON(gestiones, "gestiones.json")} />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Oficios enviados" value={nOficios} color={C.ink} />
        <StatCard label="Derivaciones" value={nDeriv} color={C.ink} />
        <StatCard label="Pendientes" value={nPend} color={C.warn} />
        <StatCard label="Medidas judiciales" value={nJud} color={C.urgent} />
      </div>
      {!readOnly && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-5 print:hidden">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Registrar gestión</div>
          <div className="flex flex-wrap gap-2">
            <select value={g.tipo} onChange={(e) => setG({ ...g, tipo: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>{GESTION_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            <select value={g.institucion} onChange={(e) => setG({ ...g, institucion: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>{institutions.map((i) => <option key={i.id}>{i.label}</option>)}</select>
            <select value={g.caso} onChange={(e) => setG({ ...g, caso: e.target.value })} className="rounded-md p-2 text-sm" style={inp}><option value="">Sin caso vinculado</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}</select>
            <input type="date" value={g.fecha} onChange={(e) => setG({ ...g, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
            <select value={g.estado} onChange={(e) => setG({ ...g, estado: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>{GESTION_ESTADOS.map((t) => <option key={t}>{t}</option>)}</select>
            <input value={g.detalle} onChange={(e) => setG({ ...g, detalle: e.target.value })} placeholder="Detalle de la gestión" className="rounded-md p-2 text-sm flex-1 min-w-[200px]" style={inp} />
            <Btn onClick={add}><Plus size={14} /> Registrar</Btn>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-3 print:hidden">
        <select value={festado} onChange={(e) => setFestado(e.target.value)} className="rounded-md p-2 text-sm" style={inp}><option value="">Todos los estados</option>{GESTION_ESTADOS.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: C.paper, color: C.textSoft }} className="text-xs uppercase"><th className="text-left p-3">Tipo</th><th className="text-left p-3">Institución</th><th className="text-left p-3">Caso</th><th className="text-left p-3">Fecha</th><th className="text-left p-3">Detalle</th><th className="text-left p-3">Estado</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <td style={{ color: C.ink }} className="p-3">{x.tipo}</td>
                <td style={{ color: C.textSoft }} className="p-3 text-xs">{x.institucion}</td>
                <td style={{ ...mono, color: C.textSoft }} className="p-3 text-xs">{x.caso || "—"}</td>
                <td style={{ color: C.textSoft }} className="p-3 text-xs">{x.fecha || "—"}</td>
                <td style={{ color: C.textSoft }} className="p-3 text-xs">{x.detalle}</td>
                <td className="p-3"><span style={{ background: (estadoColor[x.estado] || C.textSoft) + "22", color: estadoColor[x.estado] || C.textSoft }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{x.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =================== MÓDULO 12 — ALERTAS INTELIGENTES ============ */
function AlertsPage({ cases, students, gestiones, onOpenCase, onOpenStudent, onGo }) {
  const alerts = [];
  cases.filter((c) => !c.closed).forEach((c) => {
    const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
    const dl = daysLeft(step.due);
    if (dl < 0) alerts.push({ sev: "alta", tipo: "Plazo vencido", msg: `${c.id} — ${c.type.label}: vencido hace ${-dl} días (${step.title})`, action: () => onOpenCase(c.id) });
    const last = c.log && c.log[c.log.length - 1]?.at;
    if (last) { const d = Math.floor((Date.now() - new Date(last).getTime()) / 86400000); if (d > 14) alerts.push({ sev: "media", tipo: "Sin seguimiento", msg: `${c.id}: sin acciones registradas hace ${d} días`, action: () => onOpenCase(c.id) }); }
  });
  students.forEach((s) => {
    const n = cases.filter((c) => caseHasStudent(c, s.id)).length;
    if (n > 1) alerts.push({ sev: "media", tipo: "Estudiante reincidente", msg: `${s.name} (${s.curso}): ${n} casos registrados`, action: () => onOpenStudent(s.id) });
    const neg = (s.anotaciones || []).filter((a) => a.tipo === "negativa").length;
    if (neg >= 2) alerts.push({ sev: "media", tipo: "Registros negativos acumulados", msg: `${s.name}: ${neg} anotaciones negativas en hoja de vida`, action: () => onOpenStudent(s.id) });
    const at = (s.atrasos || []).reduce((b, t) => b + (Number(t.cantidad) || 1), 0);
    if (at >= 3) alerts.push({ sev: "media", tipo: "Asistencia crítica", msg: `${s.name}: ${at} atrasos acumulados`, action: () => onOpenStudent(s.id) });
    const na = (s.citaciones || []).filter((c) => c.estado === "No asiste").length;
    if (na >= 1) alerts.push({ sev: "media", tipo: "Apoderado ausente del proceso", msg: `${s.name}: ${na} citación(es) sin asistencia del apoderado`, action: () => onOpenStudent(s.id) });
  });
  (gestiones || []).filter((x) => x.tipo === "Medida judicial" && x.estado !== "Cumplido").forEach((x) => {
    alerts.push({ sev: "alta", tipo: "Medida judicial pendiente", msg: `${x.institucion}: ${x.detalle} (${x.estado})`, action: () => onGo("gestion") });
  });
  const altas = alerts.filter((a) => a.sev === "alta");
  const medias = alerts.filter((a) => a.sev === "media");

  const card = (a, i) => (
    <button key={i} onClick={a.action} className="text-left w-full">
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${a.sev === "alta" ? C.urgent : C.warn}` }} className="rounded-lg p-3.5 flex items-start gap-3 hover:shadow-sm transition">
        <AlertTriangle size={16} style={{ color: a.sev === "alta" ? C.urgent : C.warn }} className="mt-0.5 shrink-0" />
        <div><div style={{ color: C.ink }} className="text-sm font-medium">{a.tipo}</div><div style={{ color: C.textSoft }} className="text-xs mt-0.5">{a.msg}</div></div>
      </div>
    </button>
  );

  return (
    <div className="max-w-3xl">
      <PageHead title="Alertas inteligentes" subtitle="Situaciones que requieren atención, detectadas automáticamente a partir de los datos." right={<Toolbar onPrint={printView} />} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Alertas totales" value={alerts.length} color={C.ink} />
        <StatCard label="Prioridad alta" value={altas.length} color={C.urgent} />
        <StatCard label="Prioridad media" value={medias.length} color={C.warn} />
      </div>
      {alerts.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">Sin alertas por ahora. 🎉</div>}
      {altas.length > 0 && <div style={{ color: C.urgent }} className="text-xs font-medium uppercase tracking-wide mb-2">Prioridad alta</div>}
      <div className="flex flex-col gap-2 mb-6">{altas.map(card)}</div>
      {medias.length > 0 && <div style={{ color: C.warn }} className="text-xs font-medium uppercase tracking-wide mb-2">Prioridad media</div>}
      <div className="flex flex-col gap-2">{medias.map(card)}</div>
    </div>
  );
}

/* =================== MÓDULO 7 — COMUNICACIÓN APODERADOS ========== */
function ApoderadosPage({ students, setStudents, role }) {
  const readOnly = role.scope === "audit";
  const [sid, setSid] = useState("");
  const [q, setQ] = useState("");
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [letra, setLetra] = useState("");
  const s = students.find((x) => x.id === sid);
  const [cita, setCita] = useState({ fecha: "", hora: "", motivo: "" });
  const [acu, setAcu] = useState({ fecha: "", acuerdo: "" });
  const [doc, setDoc] = useState("");
  function add(kind, record) { addStudentRec(setStudents, sid, kind, record); }
  function updItem(kind, id, patch) { updStudentRec(setStudents, sid, kind, id, patch); }
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const citColor = { Pendiente: C.warn, Confirmada: C.ok, Reagendar: C.admin };
  const firmar = (kind, id) => updItem(kind, id, { firma: { por: s.apoderadoNombre, at: new Date().toISOString().slice(0, 10), via: "presencial" } });
  const firmaTag = (f) => f ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"><PenLine size={11} /> Confirmado por {f.por} · {f.at}{f.via === "enlace" ? " · por enlace" : " · presencial"}</span> : null;

  const enriched = students.map((x) => ({ x, ...courseParts(x) }));
  const uniqA = (a) => [...new Set(a.filter(Boolean))];
  const niveles = uniqA(enriched.map((e) => e.nivel));
  const grados = uniqA(enriched.filter((e) => e.nivel === nivel).map((e) => e.grado)).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  const letras = uniqA(enriched.filter((e) => e.nivel === nivel && e.grado === grado).map((e) => e.letra)).sort();
  const query = q.trim().toLowerCase();
  const matches = enriched.filter((e) => (!nivel || e.nivel === nivel) && (!grado || e.grado === grado) && (!letra || e.letra === letra) && (!query || `${e.x.name} ${e.x.rut || ""} ${e.x.curso || ""}`.toLowerCase().includes(query))).slice(0, 60);
  const Sel = ({ value, onChange, children, disabled }) => (
    <select value={value} onChange={onChange} disabled={disabled} className="rounded-md p-2 text-sm" style={{ ...inp, opacity: disabled ? 0.5 : 1 }}>{children}</select>
  );

  return (
    <div className="max-w-3xl">
      <PageHead title="Comunicación con apoderados" subtitle="Citaciones con confirmación y reagendamiento, entrevistas y acuerdos con seguimiento, firma digital y documentos enviados. Todo queda en el historial del apoderado." right={<Toolbar onPrint={printView} onExport={() => exportJSON(students, "apoderados.json")} />} />
      {!s && (
        <div className="print:hidden">
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 mb-3 flex flex-col gap-3">
            <div className="relative">
              <Search size={15} color={C.textSoft} className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar estudiante por nombre, RUT o curso…" className="w-full rounded-md p-2.5 pl-9 text-sm" style={inp} />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Sel value={nivel} onChange={(e) => { setNivel(e.target.value); setGrado(""); setLetra(""); }}><option value="">Todos los niveles</option>{niveles.map((n) => <option key={n} value={n}>{LEVELS[n] || n}</option>)}</Sel>
              <Sel value={grado} onChange={(e) => { setGrado(e.target.value); setLetra(""); }} disabled={!nivel}><option value="">Todos los grados</option>{grados.map((g) => <option key={g} value={g}>{g}</option>)}</Sel>
              <Sel value={letra} onChange={(e) => setLetra(e.target.value)} disabled={!grado}><option value="">Todas las letras</option>{letras.map((l) => <option key={l} value={l}>{l || "(sin letra)"}</option>)}</Sel>
              {(q || nivel || grado || letra) && <button onClick={() => { setQ(""); setNivel(""); setGrado(""); setLetra(""); }} style={{ color: C.primary }} className="text-xs flex items-center gap-1"><X size={13} /> Limpiar</button>}
              <span style={{ color: C.textSoft }} className="text-xs ml-auto">{matches.length} de {students.length}</span>
            </div>
          </div>
          {students.length === 0 ? (
            <div style={{ color: C.textSoft }} className="text-sm text-center py-6">Aún no hay estudiantes. Impórtalos en “Cursos”.</div>
          ) : (
            <>
              <div style={{ color: C.textSoft }} className="text-xs mb-2">Selecciona un estudiante para gestionar la comunicación con su apoderado:</div>
              <div className="flex flex-col gap-2">
                {matches.map(({ x }) => (
                  <button key={x.id} onClick={() => setSid(x.id)} className="text-left">
                    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 flex items-center gap-3 hover:shadow-sm transition">
                      <div style={{ background: C.primary }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"><UserCircle size={16} color="#fff" /></div>
                      <span style={{ color: C.ink }} className="text-sm flex-1">{x.name}<span style={{ color: C.textSoft }} className="text-xs"> · {x.curso || "sin curso"}</span></span>
                      <span style={{ color: x.apoderadoEmail ? C.ok : C.textSoft }} className="text-[11px]">{x.apoderadoEmail ? "con correo" : "sin correo"}</span>
                      <ChevronRight size={15} color={C.textSoft} />
                    </div>
                  </button>
                ))}
                {matches.length === 0 && <div style={{ color: C.textSoft }} className="text-sm text-center py-4">Sin coincidencias.</div>}
              </div>
            </>
          )}
        </div>
      )}
      {s && (
        <>
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 mb-4 flex items-center gap-3">
            <div style={{ background: C.primary }} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"><UserCircle size={20} color="#fff" /></div>
            <div><div style={{ color: C.ink }} className="text-sm font-medium">{s.apoderadoNombre || "Apoderado/a"}</div><div style={{ color: C.textSoft }} className="text-xs">{s.apoderadoEmail || "sin correo"} · apoderado/a de {s.name}</div></div>
            <button onClick={() => setSid("")} style={{ color: C.primary }} className="text-xs ml-auto print:hidden flex items-center gap-1 shrink-0">← Cambiar estudiante</button>
          </div>

          <ExpBlock icon={CalendarClock} title={`Citaciones (${(s.citacionesApo || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">
              {(s.citacionesApo || []).map((c) => (
                <div key={c.id} style={{ background: C.paper }} className="rounded-md p-3 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div><span style={{ color: C.ink }} className="font-medium">{c.motivo}</span> <span style={{ color: C.textSoft }}>· {c.fecha} {c.hora}{c.nuevaFecha ? ` → reagenda: ${c.nuevaFecha}` : ""}</span></div>
                    <span style={{ background: (citColor[c.estado] || C.textSoft) + "22", color: citColor[c.estado] || C.textSoft }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{c.estado}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    {c.firma && firmaTag(c.firma)}
                    {c.emailSent && !c.firma && <span style={{ background: C.adminSoft, color: C.admin }} className="text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Mail size={11} /> Correo enviado · esperando confirmación</span>}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap print:hidden">
                      <select value={c.estado} onChange={(e) => updItem("citacionesApo", c.id, { estado: e.target.value })} className="rounded-md p-1.5 text-xs" style={inp}><option>Pendiente</option><option>Confirmada</option><option>Reagendar</option></select>
                      {c.estado === "Reagendar" && <input type="date" value={c.nuevaFecha || ""} onChange={(e) => updItem("citacionesApo", c.id, { nuevaFecha: e.target.value })} className="rounded-md p-1.5 text-xs" style={inp} />}
                      {!c.firma && <button onClick={() => firmar("citacionesApo", c.id)} className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}><PenLine size={12} /> Registrar conformidad (presencial)</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="print:hidden">
                <div className="flex flex-wrap gap-2">
                  <input type="date" value={cita.fecha} onChange={(e) => setCita({ ...cita, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                  <input type="time" value={cita.hora} onChange={(e) => setCita({ ...cita, hora: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                  <input value={cita.motivo} onChange={(e) => setCita({ ...cita, motivo: e.target.value })} placeholder="Motivo de la citación" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} />
                  <Btn onClick={() => { if (cita.motivo.trim()) { add("citacionesApo", { ...cita, estado: "Pendiente", nuevaFecha: "", firma: null }); setCita({ fecha: "", hora: "", motivo: "" }); } }}><Send size={14} /> Citar</Btn>
                </div>
                <div style={{ color: s.apoderadoEmail ? C.textSoft : C.warn }} className="text-[11px] mt-2">
                  {s.apoderadoEmail
                    ? `Al citar se enviará un correo a ${s.apoderadoEmail} con un enlace para que el apoderado confirme su asistencia.`
                    : "Este estudiante no tiene correo de apoderado registrado: no se enviará correo (agrégalo en el expediente para habilitarlo)."}
                </div>
              </div>
            )}
          </ExpBlock>

          <ExpBlock icon={CheckCircle2} title={`Entrevistas y acuerdos (${(s.acuerdosApo || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">
              {(s.acuerdosApo || []).map((a) => (
                <div key={a.id} style={{ background: C.paper }} className="rounded-md p-3 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={a.cumplido} onChange={() => !readOnly && updItem("acuerdosApo", a.id, { cumplido: !a.cumplido })} /><span style={{ color: a.cumplido ? C.textSoft : C.ink, textDecoration: a.cumplido ? "line-through" : "none" }}>{a.acuerdo}</span></label>
                    <span style={{ color: C.textSoft }}>{a.fecha}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    {a.firma ? firmaTag(a.firma) : (!readOnly && <button onClick={() => firmar("acuerdosApo", a.id)} className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1 print:hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}><PenLine size={12} /> Registrar conformidad (presencial)</button>)}
                  </div>
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <input type="date" value={acu.fecha} onChange={(e) => setAcu({ ...acu, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input value={acu.acuerdo} onChange={(e) => setAcu({ ...acu, acuerdo: e.target.value })} placeholder="Acuerdo con el apoderado" className="rounded-md p-2 text-sm flex-1 min-w-[180px]" style={inp} />
                <Btn onClick={() => { if (acu.acuerdo.trim()) { add("acuerdosApo", { ...acu, cumplido: false, firma: null }); setAcu({ fecha: "", acuerdo: "" }); } }}><Plus size={14} /> Agregar</Btn>
              </div>
            )}
          </ExpBlock>

          <ExpBlock icon={FileText} title={`Documentos enviados (${(s.docsApo || []).length})`}>
            <div className="flex flex-col gap-1.5 mb-3">{(s.docsApo || []).map((d) => <div key={d.id} style={{ color: C.textSoft }} className="text-xs flex items-center gap-1.5"><Paperclip size={11} /> <span style={{ color: C.ink }}>{d.nombre}</span> · {d.fecha}</div>)}</div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Nombre del documento a enviar" className="rounded-md p-2 text-sm flex-1 min-w-[200px]" style={inp} />
                <Btn onClick={() => { if (doc.trim()) { add("docsApo", { nombre: doc, fecha: new Date().toISOString().slice(0, 10) }); setDoc(""); } }}><Send size={14} /> Enviar</Btn>
              </div>
            )}
          </ExpBlock>
        </>
      )}
    </div>
  );
}

/* =================== CONVIVENCIA POSITIVA (RECONOCIMIENTOS) =============== */
function ReconocimientosPage({ students, setStudents, role, roleKey, onOpenStudent, customCats, setCustomCats }) {
  const readOnly = role.scope === "audit";
  const canManageCats = ["superadmin", "coordinador", "director"].includes(roleKey);
  const CATS = [...RECON_CATEGORIES, ...(customCats || [])];
  const [newCat, setNewCat] = useState({ label: "", emoji: "⭐", color: "#1A73E8" });
  const [showCats, setShowCats] = useState(false);
  const [sid, setSid] = useState("");
  const [q, setQ] = useState("");
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [letra, setLetra] = useState("");
  const [cat, setCat] = useState(RECON_CATEGORIES[0].key);
  const [desc, setDesc] = useState("");
  const [avisar, setAvisar] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const s = students.find((x) => x.id === sid);
  const catOf = (k) => CATS.find((c) => c.key === k) || {};
  const badgeFor = (n) => RECON_BADGES.find((b) => n >= b.min);

  // Todos los reconocimientos (aplanados) para estadísticas.
  const all = [];
  students.forEach((st) => (st.reconocimientos || []).forEach((r) => all.push({ ...r, studentId: st.id, studentName: st.name, curso: st.curso })));
  const total = all.length;
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = all.filter((r) => String(r.fecha || "").startsWith(month));
  const byCat = CATS.map((c) => ({ ...c, n: all.filter((r) => r.categoria === c.key).length })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
  const cntStudentMonth = {};
  thisMonth.forEach((r) => { cntStudentMonth[r.studentId] = (cntStudentMonth[r.studentId] || 0) + 1; });
  const topMonth = Object.entries(cntStudentMonth).map(([id, n]) => ({ id, n, name: students.find((x) => x.id === id)?.name, curso: students.find((x) => x.id === id)?.curso })).sort((a, b) => b.n - a.n).slice(0, 5);
  const recent = all.slice().reverse().slice(0, 10);
  const cntByStudent = (id) => students.find((x) => x.id === id)?.reconocimientos?.length || 0;

  // Buscador de estudiante (mismo patrón que otros apartados).
  const enriched = students.map((x) => ({ x, ...courseParts(x) }));
  const uniqA = (a) => [...new Set(a.filter(Boolean))];
  const niveles = uniqA(enriched.map((e) => e.nivel));
  const grados = uniqA(enriched.filter((e) => e.nivel === nivel).map((e) => e.grado)).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  const letras = uniqA(enriched.filter((e) => e.nivel === nivel && e.grado === grado).map((e) => e.letra)).sort();
  const query = q.trim().toLowerCase();
  const matches = enriched.filter((e) => (!nivel || e.nivel === nivel) && (!grado || e.grado === grado) && (!letra || e.letra === letra) && (!query || `${e.x.name} ${e.x.rut || ""} ${e.x.curso || ""}`.toLowerCase().includes(query))).slice(0, 40);
  const Sel = ({ value, onChange, children, disabled }) => (
    <select value={value} onChange={onChange} disabled={disabled} className="rounded-md p-2 text-sm" style={{ ...inp, opacity: disabled ? 0.5 : 1 }}>{children}</select>
  );

  async function guardar() {
    if (!sid || !desc.trim() || saving) return;
    setSaving(true); setNotice(null);
    const c = catOf(cat);
    const willEmail = avisar && !!s?.apoderadoEmail;
    const rec = { categoria: cat, categoriaLabel: c.label, categoriaEmoji: c.emoji, categoriaColor: c.color, descripcion: desc.trim(), fecha: new Date().toISOString().slice(0, 10), otorgadoPor: role.label, avisarFamilia: willEmail };
    try {
      const r = await api.addStudentRecord(sid, "reconocimiento", rec);
      setStudents((prev) => prev.map((x) => (x.id === sid ? { ...x, reconocimientos: [...(x.reconocimientos || []), { id: r.id, ...(r.data || rec) }] } : x)));
      setNotice({ ok: true, text: `🎉 Reconocimiento registrado para ${s.name}.` + (r.emailSent ? " Se felicitó a la familia por correo." : willEmail ? " (No se pudo enviar el correo)." : "") });
      setDesc("");
    } catch (e) { setNotice({ ok: false, text: "No se pudo registrar: " + (e?.error || e?.message || "error") }); }
    setSaving(false);
  }
  async function addCategoria() {
    const label = newCat.label.trim();
    if (!label) return;
    const key = "c_" + label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "").slice(0, 18) + "_" + Math.floor(Math.random() * 900 + 100);
    await orgAdd(setCustomCats, "reconCategory", { key, label, emoji: (newCat.emoji || "⭐").trim() || "⭐", color: newCat.color || "#1A73E8" }, { prepend: false });
    setNewCat({ label: "", emoji: "⭐", color: "#1A73E8" });
  }
  const delCategoria = (id) => orgDelete(setCustomCats, id);

  return (
    <div className="max-w-3xl">
      <PageHead title="Convivencia positiva" subtitle="Reconoce las acciones positivas de los estudiantes: solidaridad, buen trato, esfuerzo y más. Queda en su expediente y, si quieres, felicitamos a la familia por correo." right={<Toolbar onPrint={printView} />} />

      {canManageCats && (
        <div className="mb-4 print:hidden">
          <button onClick={() => setShowCats(!showCats)} style={{ color: C.primary }} className="text-xs flex items-center gap-1"><Settings size={13} /> {showCats ? "Ocultar categorías propias" : "Gestionar categorías propias del establecimiento"}</button>
          {showCats && (
            <div style={{ background: C.cardBg, border: `1px dashed ${C.cardBorder}` }} className="rounded-lg p-3 mt-2">
              <div style={{ color: C.textSoft }} className="text-xs mb-2">Crea categorías propias (además de las base), según el sello o PEI de tu establecimiento. Se usan al reconocer y en las estadísticas.</div>
              <div className="flex gap-2 flex-wrap items-center mb-3">
                <input value={newCat.emoji} onChange={(e) => setNewCat({ ...newCat, emoji: e.target.value.slice(0, 2) })} placeholder="⭐" className="w-14 text-center rounded-md p-2 text-sm" style={inp} />
                <input value={newCat.label} onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} placeholder="Nombre (ej: Sello Verde, Espíritu deportivo)" className="rounded-md p-2 text-sm flex-1 min-w-[180px]" style={inp} />
                <input type="color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} className="w-10 h-9 rounded-md cursor-pointer" style={{ border: `1px solid ${C.cardBorder}` }} title="Color" />
                <Btn onClick={addCategoria} disabled={!newCat.label.trim()}><Plus size={14} /> Agregar</Btn>
              </div>
              {(customCats || []).length === 0 ? <div style={{ color: C.textSoft }} className="text-xs">Aún no has creado categorías propias.</div>
                : <div className="flex flex-wrap gap-2">
                    {(customCats || []).map((c) => (
                      <span key={c.id} style={{ background: (c.color || C.primary) + "18", color: c.color || C.primary, border: `1px solid ${C.cardBorder}` }} className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">{c.emoji} {c.label}<button onClick={() => delCategoria(c.id)} title="Eliminar" className="ml-0.5"><X size={12} /></button></span>
                    ))}
                  </div>}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div style={{ background: C.ok + "14", border: `1px solid ${C.ok}44` }} className="rounded-lg p-3">
          <div style={{ color: C.ok }} className="text-2xl font-semibold flex items-center gap-1.5"><Award size={20} /> {total}</div>
          <div style={{ color: C.textSoft }} className="text-xs mt-0.5">Reconocimientos</div>
        </div>
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3">
          <div style={{ color: C.ink }} className="text-2xl font-semibold">{thisMonth.length}</div>
          <div style={{ color: C.textSoft }} className="text-xs mt-0.5">Este mes</div>
        </div>
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 col-span-2">
          <div style={{ color: C.textSoft }} className="text-[11px] uppercase tracking-wide mb-1">Por categoría</div>
          <div className="flex flex-wrap gap-1.5">
            {byCat.length === 0 ? <span style={{ color: C.textSoft }} className="text-xs">Aún sin reconocimientos.</span>
              : byCat.map((c) => <span key={c.key} style={{ background: c.color + "18", color: c.color }} className="text-[11px] px-2 py-0.5 rounded-full">{c.emoji} {c.label} · {c.n}</span>)}
          </div>
        </div>
      </div>

      {/* Reconocidos del mes */}
      {topMonth.length > 0 && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 mb-4">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-2 flex items-center gap-1.5"><Star size={15} style={{ color: "#F9AB00" }} /> Reconocidos del mes</div>
          <div className="flex flex-col gap-1.5">
            {topMonth.map((t, i) => (
              <button key={t.id} onClick={() => onOpenStudent && onOpenStudent(t.id)} className="text-left flex items-center gap-2 text-sm">
                <span style={{ color: C.textSoft }} className="w-5">{["🥇", "🥈", "🥉"][i] || "•"}</span>
                <span style={{ color: C.primary }} className="flex-1">{t.name}<span style={{ color: C.textSoft }} className="text-xs"> · {t.curso || ""}</span></span>
                <span style={{ color: C.ok }} className="text-xs font-medium">{t.n} este mes</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <div style={{ background: notice.ok ? C.ok + "18" : "#FCE8E6", color: notice.ok ? C.ok : C.urgent, border: `1px solid ${notice.ok ? C.ok : C.urgent}` }} className="rounded-lg px-3 py-2 mb-4 text-sm flex items-start justify-between gap-2">
          <span>{notice.text}</span><button onClick={() => setNotice(null)}><X size={15} /></button>
        </div>
      )}

      {/* Registrar reconocimiento */}
      {!readOnly && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-4 mb-4">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3 flex items-center gap-1.5"><Heart size={15} style={{ color: "#D81B60" }} /> Registrar un reconocimiento</div>
          {!s ? (
            <>
              <div className="relative mb-2">
                <Search size={15} color={C.textSoft} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar estudiante por nombre, RUT o curso…" className="w-full rounded-md p-2.5 pl-9 text-sm" style={inp} />
              </div>
              <div className="flex gap-2 flex-wrap items-center mb-2">
                <Sel value={nivel} onChange={(e) => { setNivel(e.target.value); setGrado(""); setLetra(""); }}><option value="">Todos los niveles</option>{niveles.map((n) => <option key={n} value={n}>{LEVELS[n] || n}</option>)}</Sel>
                <Sel value={grado} onChange={(e) => { setGrado(e.target.value); setLetra(""); }} disabled={!nivel}><option value="">Grados</option>{grados.map((g) => <option key={g} value={g}>{g}</option>)}</Sel>
                <Sel value={letra} onChange={(e) => setLetra(e.target.value)} disabled={!grado}><option value="">Letras</option>{letras.map((l) => <option key={l} value={l}>{l || "(sin)"}</option>)}</Sel>
                <span style={{ color: C.textSoft }} className="text-xs ml-auto">{matches.length} de {students.length}</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-56 overflow-auto">
                {students.length === 0 ? <div style={{ color: C.textSoft }} className="text-sm">Importa estudiantes en “Cursos”.</div>
                  : matches.map(({ x }) => (
                    <button key={x.id} onClick={() => setSid(x.id)} className="text-left">
                      <div style={{ background: C.paper, border: `1px solid ${C.cardBorder}` }} className="rounded-md p-2.5 flex items-center gap-2 hover:shadow-sm transition text-sm">
                        <UserCircle size={16} color={C.primary} />
                        <span style={{ color: C.ink }} className="flex-1">{x.name}<span style={{ color: C.textSoft }} className="text-xs"> · {x.curso || "sin curso"}</span></span>
                        {cntByStudent(x.id) > 0 && <span style={{ color: C.ok }} className="text-[11px]">{cntByStudent(x.id)} 🏅</span>}
                      </div>
                    </button>
                  ))}
                {matches.length === 0 && students.length > 0 && <div style={{ color: C.textSoft }} className="text-sm">Sin coincidencias.</div>}
              </div>
            </>
          ) : (
            <>
              <div style={{ background: C.paper, border: `1px solid ${C.cardBorder}` }} className="rounded-md p-2.5 mb-3 flex items-center gap-2">
                <UserCircle size={18} color={C.primary} />
                <span style={{ color: C.ink }} className="text-sm flex-1">{s.name}<span style={{ color: C.textSoft }} className="text-xs"> · {s.curso || ""} · {cntByStudent(sid)} reconocimiento(s)</span></span>
                <button onClick={() => setSid("")} style={{ color: C.primary }} className="text-xs flex items-center gap-1">← Cambiar</button>
              </div>
              <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Categoría</label>
              <div className="flex flex-wrap gap-2 mt-1.5 mb-3">
                {CATS.map((c) => (
                  <button key={c.key} onClick={() => setCat(c.key)} className="text-sm px-3 py-1.5 rounded-full transition"
                    style={{ background: cat === c.key ? c.color : "#fff", color: cat === c.key ? "#fff" : C.text, border: `1px solid ${cat === c.key ? c.color : C.cardBorder}` }}>{c.emoji} {c.label}</button>
                ))}
              </div>
              <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">¿Qué hizo? (descripción breve)</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Ej: Ayudó espontáneamente a un compañero que se sentía mal y avisó a un adulto." className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={inp} />
              <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
                <label className="flex items-center gap-2 text-sm" style={{ color: s?.apoderadoEmail ? C.text : C.textSoft }}>
                  <input type="checkbox" checked={avisar && !!s?.apoderadoEmail} disabled={!s?.apoderadoEmail} onChange={(e) => setAvisar(e.target.checked)} />
                  <Mail size={14} /> Felicitar a la familia por correo {s?.apoderadoEmail ? `(${s.apoderadoEmail})` : "(sin correo de apoderado)"}
                </label>
                <Btn onClick={guardar} disabled={!desc.trim() || saving}><Award size={15} /> {saving ? "Guardando…" : "Reconocer"}</Btn>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reconocimientos recientes */}
      {recent.length > 0 && (
        <div>
          <div style={{ color: C.ink }} className="text-sm font-medium mb-2">Reconocimientos recientes</div>
          <div className="flex flex-col gap-2">
            {recent.map((r, i) => {
              const c = catOf(r.categoria);
              return (
                <div key={r.id || i} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ background: (c.color || C.primary) + "18", color: c.color || C.primary }} className="text-[11px] px-2 py-0.5 rounded-full">{c.emoji || "🌟"} {r.categoriaLabel || c.label || "Reconocimiento"}</span>
                    <button onClick={() => onOpenStudent && onOpenStudent(r.studentId)} style={{ color: C.primary }} className="text-sm font-medium">{r.studentName}</button>
                    <span style={{ color: C.textSoft }} className="text-xs">· {r.curso || ""}</span>
                    <span style={{ color: C.textSoft }} className="text-xs ml-auto">{r.fecha}</span>
                  </div>
                  {r.descripcion && <div style={{ color: C.text }} className="text-sm mt-1.5">{r.descripcion}</div>}
                  {r.otorgadoPor && <div style={{ color: C.textSoft }} className="text-[11px] mt-1">Registrado por {r.otorgadoPor}{r.emailSent ? " · familia notificada ✉️" : ""}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =================== MÓDULO 9 — GESTIÓN DOCUMENTAL =============== */
function DocumentalPage({ documents, setDocuments, cases, role }) {
  const readOnly = role.scope === "audit";
  const [d, setD] = useState({ nombre: "", categoria: "Informe", caso: "", fecha: "", url: "" });
  const [fcat, setFcat] = useState("");
  const [q, setQ] = useState("");
  const rows = documents.filter((x) => (!fcat || x.categoria === fcat) && (!q || x.nombre.toLowerCase().includes(q.toLowerCase())));
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  function add() { if (d.nombre.trim()) { orgAdd(setDocuments, "document", d); setD({ nombre: "", categoria: "Informe", caso: "", fecha: "", url: "" }); } }

  return (
    <div className="max-w-4xl">
      <PageHead title="Gestión documental" subtitle="Repositorio de informes, actas, protocolos, oficios, resoluciones, certificados, consentimientos y evidencias. Enlazable a Google Drive." right={<Toolbar onPrint={printView} onExport={() => exportJSON(documents, "documentos.json")} onImport={async (data) => { if (Array.isArray(data)) { const n = await importOrgRecords(setDocuments, "document", data); alert(`${n} documento(s) importado(s) y guardado(s).`); } }} />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Documentos" value={documents.length} color={C.ink} />
        <StatCard label="Actas" value={documents.filter((x) => x.categoria === "Acta").length} color={C.ink} />
        <StatCard label="Consentimientos" value={documents.filter((x) => x.categoria === "Consentimiento").length} color={C.ink} />
        <StatCard label="Protocolos" value={documents.filter((x) => x.categoria === "Protocolo").length} color={C.ink} />
      </div>
      {!readOnly && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-5 print:hidden">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Agregar documento</div>
          <div className="flex flex-wrap gap-2">
            <input value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} placeholder="Nombre del documento" className="rounded-md p-2 text-sm flex-1 min-w-[200px]" style={inp} />
            <select value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>{DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={d.caso} onChange={(e) => setD({ ...d, caso: e.target.value })} className="rounded-md p-2 text-sm" style={inp}><option value="">Sin caso</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}</select>
            <input type="date" value={d.fecha} onChange={(e) => setD({ ...d, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
            <input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="Enlace a Drive (opcional)" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} />
            <label className="text-sm px-4 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5 mbtn-outline" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}><Upload size={14} /> Archivo<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setD({ ...d, nombre: d.nombre || f.name }); e.target.value = ""; }} /></label>
            <Btn onClick={add}><Plus size={14} /> Guardar</Btn>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-3 flex-wrap print:hidden">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="rounded-md p-2 text-sm" style={inp} />
        <select value={fcat} onChange={(e) => setFcat(e.target.value)} className="rounded-md p-2 text-sm" style={inp}><option value="">Todas las categorías</option>{DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: C.paper, color: C.textSoft }} className="text-xs uppercase"><th className="text-left p-3">Documento</th><th className="text-left p-3">Categoría</th><th className="text-left p-3">Caso</th><th className="text-left p-3">Fecha</th><th className="text-left p-3 print:hidden">Acción</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <td style={{ color: C.ink }} className="p-3">{x.nombre}</td>
                <td className="p-3"><span style={{ background: (DOC_CAT_COLOR[x.categoria] || "#5F6368") + "18", color: DOC_CAT_COLOR[x.categoria] || "#5F6368", border: `1px solid ${(DOC_CAT_COLOR[x.categoria] || "#5F6368")}55` }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{x.categoria}</span></td>
                <td style={{ ...mono, color: C.textSoft }} className="p-3 text-xs">{x.caso || "—"}</td>
                <td style={{ color: C.textSoft }} className="p-3 text-xs">{x.fecha || "—"}</td>
                <td className="p-3 print:hidden">
                  {x.url ? <a href={x.url} target="_blank" rel="noreferrer" style={{ color: C.primary }} className="text-xs inline-flex items-center gap-1"><ExternalLink size={12} /> Abrir en Drive</a> : <span style={{ color: C.textSoft }} className="text-xs">—</span>}
                  {!readOnly && <button onClick={() => orgDelete(setDocuments, x.id)} style={{ color: C.textSoft }} className="ml-3"><Trash2 size={13} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ PLAN DE CONVIVENCIA Y PME (documentos + seguimiento) ==== */
function PlanPMEPage({ docs, setDocs, acciones, setAcciones, role }) {
  const readOnly = role.scope === "audit";
  const [a, setA] = useState({ nombre: "", dimension: "Convivencia Escolar", objetivo: "", responsable: "", inicio: "", termino: "", avance: 0 });
  const [fdim, setFdim] = useState("");
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const rows = acciones.filter((x) => !fdim || x.dimension === fdim);
  const avgAvance = acciones.length ? Math.round(acciones.reduce((s, x) => s + (Number(x.avance) || 0), 0) / acciones.length) : 0;
  const completas = acciones.filter((x) => Number(x.avance) >= 100).length;
  function setDocField(id, patch) { setDocs(docs.map((d) => (d.id === id ? { ...d, ...patch } : d))); }
  function updAccion(id, patch) { orgUpdate(setAcciones, id, patch); }
  function addAccion() { if (a.nombre.trim()) { orgAdd(setAcciones, "accion", a); setA({ nombre: "", dimension: "Convivencia Escolar", objetivo: "", responsable: "", inicio: "", termino: "", avance: 0 }); } }
  const dimColor = (d) => (d === "Convivencia Escolar" ? C.ok : d === "Liderazgo Escolar" ? C.primary : d === "Gestión Pedagógica" ? C.warn : C.seal);
  const barColor = (v) => (v >= 100 ? C.ok : v >= 50 ? C.primary : C.warn);

  return (
    <div className="max-w-3xl">
      <PageHead title="Plan de convivencia y PME" subtitle="Seguimiento de las acciones del plan de convivencia y del Plan de Mejoramiento Educacional (PME) por dimensión. Los documentos institucionales se cargan en el Motor normativo." right={<Toolbar onPrint={printView} onExport={() => exportJSON(acciones, "plan-pme.json")} />} />

      <Section icon={Target} title="Seguimiento de acciones — convivencia y PME">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div><div style={{ color: C.ink }} className="text-xl font-semibold">{acciones.length}</div><div style={{ color: C.textSoft }} className="text-[11px]">Acciones</div></div>
          <div><div style={{ color: C.primary }} className="text-xl font-semibold">{avgAvance}%</div><div style={{ color: C.textSoft }} className="text-[11px]">Avance promedio</div></div>
          <div><div style={{ color: C.ok }} className="text-xl font-semibold">{completas}</div><div style={{ color: C.textSoft }} className="text-[11px]">Completadas</div></div>
        </div>
        <div className="flex gap-2 mb-3 print:hidden">
          <select value={fdim} onChange={(e) => setFdim(e.target.value)} className="rounded-md p-2 text-sm" style={inp}><option value="">Todas las dimensiones</option>{PME_DIMENSIONS.map((d) => <option key={d}>{d}</option>)}</select>
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          {rows.map((x) => (
            <div key={x.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div style={{ color: C.ink }} className="text-sm font-medium">{x.nombre}</div>
                <span style={{ background: dimColor(x.dimension) + "22", color: dimColor(x.dimension) }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{x.dimension}</span>
              </div>
              {x.objetivo && <div style={{ color: C.textSoft }} className="text-xs mt-0.5">{x.objetivo}</div>}
              <div style={{ color: C.textSoft }} className="text-[11px] mt-1">Responsable: {x.responsable || "—"} · {x.inicio || "—"} → {x.termino || "—"}</div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-2.5 rounded-full" style={{ background: C.appBg }}><div style={{ width: `${x.avance}%`, background: barColor(Number(x.avance)) }} className="h-2.5 rounded-full" /></div>
                <span style={{ color: C.ink }} className="text-xs font-medium w-10 text-right">{x.avance}%</span>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-2 mt-2 print:hidden">
                  <input type="range" min="0" max="100" step="5" value={x.avance} onChange={(e) => updAccion(x.id, { avance: Number(e.target.value) })} className="flex-1" />
                  <button onClick={() => orgDelete(setAcciones, x.id)} style={{ color: C.textSoft }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div style={{ background: C.paper }} className="rounded-lg p-3 print:hidden">
            <div style={{ color: C.ink }} className="text-xs font-medium mb-2">Nueva acción</div>
            <div className="flex flex-wrap gap-2">
              <input value={a.nombre} onChange={(e) => setA({ ...a, nombre: e.target.value })} placeholder="Nombre de la acción" className="rounded-md p-2 text-sm flex-1 min-w-[180px]" style={inp} />
              <select value={a.dimension} onChange={(e) => setA({ ...a, dimension: e.target.value })} className="rounded-md p-2 text-sm" style={inp}>{PME_DIMENSIONS.map((d) => <option key={d}>{d}</option>)}</select>
              <input value={a.responsable} onChange={(e) => setA({ ...a, responsable: e.target.value })} placeholder="Responsable" className="rounded-md p-2 text-sm" style={inp} />
              <input value={a.objetivo} onChange={(e) => setA({ ...a, objetivo: e.target.value })} placeholder="Objetivo" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} />
              <input type="date" value={a.inicio} onChange={(e) => setA({ ...a, inicio: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
              <input type="date" value={a.termino} onChange={(e) => setA({ ...a, termino: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
              <Btn onClick={addAccion}><Plus size={14} /> Agregar acción</Btn>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ------------------- NUEVO CASO + ANALIZADOR ---------------------- */
function CaseWizard({ students, protocols, onCreate, onCancel }) {
  const [mode, setMode] = useState("predef");
  const [typeKey, setTypeKey] = useState("");
  const [involved, setInvolved] = useState("");
  const [level, setLevel] = useState("basica");
  const [relato, setRelato] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  async function analizar() {
    if (!relato.trim() || analyzing) return;
    setAnalyzing(true);
    try {
      const types = Object.entries(CASE_TYPES).map(([key, v]) => ({ key, label: v.label }));
      const r = await api.analyzeCase(relato, types);
      if (r && r.source === "ai" && r.best) setAnalysis({ hasMatch: true, best: r.best, alternatives: r.alternatives || [], confidence: r.confidence || "media", reason: r.reason || "", source: "ai" });
      else setAnalysis({ ...analyzeSituation(relato), source: "heuristica" });
    } catch {
      setAnalysis({ ...analyzeSituation(relato), source: "heuristica" });
    } finally { setAnalyzing(false); }
  }
  const [f, setF] = useState({ fechaHecho: "", hora: "", lugar: "", curso: "", testigos: "", adultosRef: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stuQuery, setStuQuery] = useState("");
  const [stuOpen, setStuOpen] = useState(false);
  const [parts, setParts] = useState([]); // [{studentId, name, curso, role}]
  const chosenKey = mode === "predef" ? typeKey : analysis?.best?.key;
  const setField = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  const stuQ = stuQuery.trim().toLowerCase();
  const addedIds = new Set(parts.map((p) => p.studentId));
  const stuMatches = students
    .filter((s) => !addedIds.has(s.id))
    .filter((s) => !stuQ || `${s.name} ${s.curso || ""} ${s.rut || ""}`.toLowerCase().includes(stuQ))
    .slice(0, 40);
  function addPart(s) {
    setParts((prev) => (prev.some((p) => p.studentId === s.id) ? prev : [...prev, { studentId: s.id, name: s.name, curso: s.curso || "", role: prev.length === 0 ? "afectado" : "involucrado" }]));
    setStuQuery(""); setStuOpen(false);
    if (parts.length === 0 && s.curso) setField("curso", s.curso);
  }
  function removePart(id) { setParts((prev) => prev.filter((p) => p.studentId !== id)); }
  function setPartRole(id, role) { setParts((prev) => prev.map((p) => (p.studentId === id ? { ...p, role } : p))); }

  async function create() {
    if (!chosenKey || saving) return;
    setError(""); setSaving(true);
    try {
      const id = `RC-2026-${Math.floor(100 + Math.random() * 900)}`;
      const proto = (protocols || []).find((p) => p.typeKey === chosenKey);
      const primary = parts.find((p) => p.role === "afectado") || parts[0] || null;
      const label = [parts.map((p) => p.name).join(", "), involved.trim()].filter(Boolean).join(" · ") || "Estudiante (sin identificar aún)";
      const built = buildCase(id, chosenKey, label, 0, 0, "", { relato, level, ...f, curso: f.curso || primary?.curso || "", studentId: primary?.studentId || null }, proto?.steps || null);
      built.participants = parts.map((p) => ({ studentId: p.studentId, role: p.role }));
      await onCreate(built);
    } catch (err) {
      setError((err && (err.error || err.message)) || "No se pudo guardar el caso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHead title="Nuevo caso de convivencia" subtitle="Elige una situación predefinida o describe un caso nuevo para que el motor lo analice." />
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-6 flex flex-col gap-5">
        <div className="flex gap-2">
          {[["predef", "Situación predefinida"], ["libre", "Describir caso nuevo"]].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`text-sm px-4 py-2 rounded-full ${mode === k ? "mbtn" : "mbtn-outline"}`}
              style={{ background: mode === k ? C.primary : C.cardBg, color: mode === k ? "#fff" : C.textSoft, border: `1px solid ${mode === k ? C.primary : C.cardBorder}` }}>{l}</button>
          ))}
        </div>
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Nivel educativo</label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
            {Object.entries(LEVELS).filter(([k]) => k !== "todos").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {mode === "predef" && (
          <div>
            <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Tipo de caso</label>
            <select value={typeKey} onChange={(e) => setTypeKey(e.target.value)} className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
              <option value="">Selecciona una opción…</option>
              {Object.entries(CASE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        )}
        {mode === "libre" && (
          <div>
            <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Describe la situación</label>
            <textarea value={relato} onChange={(e) => { setRelato(e.target.value); setAnalysis(null); }} rows={4}
              placeholder="Ej: un estudiante trajo un cuchillo y amenazó a un compañero en el recreo…"
              className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            <div style={{ color: C.textSoft }} className="text-[11px] mt-1.5 flex items-start gap-1"><Lock size={12} className="mt-0.5 shrink-0" /> Para analizar el tipo se usa una IA externa: <b className="font-medium">evita nombres completos, usa iniciales</b>. Se seudonimizan RUT, correos y teléfonos automáticamente.</div>
            <div className="mt-2"><Btn onClick={analizar} accent={C.seal} disabled={!relato.trim() || analyzing}><Sparkles size={15} /> {analyzing ? "Analizando…" : "Analizar situación"}</Btn></div>
            {analysis && (
              <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-md p-3 mt-3 text-sm">
                {analysis.hasMatch ? (
                  <>
                    <div style={{ color: C.ink }} className="font-medium flex items-center gap-2 flex-wrap"><Sparkles size={14} style={{ color: C.seal }} /> Calce sugerido (confianza {analysis.confidence})
                      <span style={{ background: analysis.source === "ai" ? C.adminSoft : C.paper, color: analysis.source === "ai" ? C.primary : C.textSoft, border: `1px solid ${C.cardBorder}` }} className="text-[10px] px-2 py-0.5 rounded-full">{analysis.source === "ai" ? "IA" : "palabras clave"}</span>
                    </div>
                    <div style={{ color: C.text }} className="mt-1 font-medium">{analysis.best.label}</div>
                    {analysis.source === "ai" && analysis.reason
                      ? <div style={{ color: C.textSoft }} className="text-xs mt-1">{analysis.reason}</div>
                      : <div style={{ color: C.textSoft }} className="text-xs mt-1">Palabras clave: {(analysis.best.matched || []).join(", ") || "—"}</div>}
                    {analysis.alternatives.length > 0 && <div style={{ color: C.textSoft }} className="text-xs mt-1">Alternativas: {analysis.alternatives.map((a) => a.label).join(" · ")}</div>}
                    <div style={{ color: C.textSoft }} className="text-[11px] mt-2">Se aplicará el tipo <b>{analysis.best.label}</b> al generar el paso a paso. Puedes cambiarlo en “Situación predefinida”.</div>
                  </>
                ) : <div style={{ color: C.textSoft }}>No se detectó un calce claro. Selecciona el tipo manualmente en la pestaña anterior.</div>}
              </div>
            )}
          </div>
        )}
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Estudiantes involucrados</label>
          <p className="text-[11px] mt-0.5 mb-1.5" style={{ color: C.textSoft }}>Agrega uno o varios. A cada uno asígnale su rol; el caso quedará en el expediente de todos.</p>

          {parts.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {parts.map((p) => (
                <div key={p.studentId} className="flex items-center gap-2 rounded-md p-2" style={{ background: C.paper, border: `1px solid ${C.cardBorder}` }}>
                  <span className="flex-1 text-sm" style={{ color: C.ink }}>{p.name}{p.curso ? <span style={{ color: C.textSoft }} className="text-xs"> · {p.curso}</span> : null}</span>
                  <select value={p.role} onChange={(e) => setPartRole(p.studentId, e.target.value)} className="rounded-md p-1.5 text-xs" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
                    {Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <button type="button" onClick={() => removePart(p.studentId)} title="Quitar" className="p-1 rounded" style={{ color: C.urgent }}><X size={15} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              value={stuQuery}
              onChange={(e) => { setStuQuery(e.target.value); setStuOpen(true); }}
              onFocus={() => setStuOpen(true)}
              onBlur={() => setTimeout(() => setStuOpen(false), 150)}
              placeholder={parts.length ? "Agregar otro estudiante (nombre, curso o RUT)…" : "Busca por nombre, curso o RUT…"}
              className="w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            {stuOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-auto rounded-md shadow-lg" style={{ background: "#fff", border: `1px solid ${C.cardBorder}` }}>
                {students.length === 0 ? (
                  <div className="px-3 py-2 text-sm" style={{ color: C.textSoft }}>No hay estudiantes en el repositorio. Importa la nómina SIGE en “Cursos”, o crea el caso sin vincular (queda como texto libre abajo).</div>
                ) : stuMatches.length === 0 ? (
                  <div className="px-3 py-2 text-sm" style={{ color: C.textSoft }}>Sin coincidencias.</div>
                ) : stuMatches.map((s) => (
                  <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addPart(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2" style={{ color: C.ink }}>
                    <span>{s.name}</span>
                    <span className="text-xs shrink-0" style={{ color: C.textSoft }}>{s.curso || ""}{s.rut ? ` · ${s.rut}` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Otras personas involucradas (sin expediente)</label>
          <input value={involved} onChange={(e) => setInvolved(e.target.value)} placeholder="Opcional. Ej: apoderado, docente, o estudiante sin registrar"
            className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
        </div>
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Datos del incidente</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2.5">
            <input type="date" value={f.fechaHecho} onChange={(e) => setField("fechaHecho", e.target.value)} title="Fecha del hecho" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            <input type="time" value={f.hora} onChange={(e) => setField("hora", e.target.value)} title="Hora del hecho" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            <input value={f.lugar} onChange={(e) => setField("lugar", e.target.value)} placeholder="Lugar (ej: patio, sala 12)" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            <input value={f.curso} onChange={(e) => setField("curso", e.target.value)} placeholder="Curso (ej: 7°B)" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            <input value={f.testigos} onChange={(e) => setField("testigos", e.target.value)} placeholder="Testigos" className="rounded-md p-2.5 text-sm col-span-2" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            <input value={f.adultosRef} onChange={(e) => setField("adultosRef", e.target.value)} placeholder="Adultos referentes / programas de protección asociados" className="rounded-md p-2.5 text-sm col-span-2" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
          </div>
        </div>
        {chosenKey && (
          <div style={{ background: C.paper, border: `1px dashed ${C.seal}` }} className="rounded-md p-3 text-xs flex items-start gap-2">
            <Network size={14} style={{ color: C.seal }} className="mt-0.5 shrink-0" />
            <span style={{ color: C.textSoft }}>Redes sugeridas: {CASE_TYPES[chosenKey].network.map((id) => INSTITUTIONS.find((i) => i.id === id)?.label).join(" · ")}</span>
          </div>
        )}
        {error && (
          <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-xs rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onCancel} className="text-sm px-4 py-2 rounded-md" style={{ color: C.textSoft }}>Cancelar</button>
          <Btn onClick={create} disabled={!chosenKey || saving}>{saving ? "Guardando…" : <>Generar paso a paso <ChevronRight size={15} /></>}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ------- PROTOCOLOS POR ESTABLECIMIENTO (paso a paso propio) ------- */
function ProtocolsPage({ protocols, setProtocols, role }) {
  const readOnly = role.scope !== "admin";
  const [typeKey, setTypeKey] = useState(Object.keys(CASE_TYPES)[0]);
  const [steps, setSteps] = useState([]);
  const [saved, setSaved] = useState(false);
  const existing = protocols.find((p) => p.typeKey === typeKey);
  const esPropio = !!existing;

  // Motor de recomendación desde el manual
  const [aiAvailable, setAiAvailable] = useState(false);
  const [manualText, setManualText] = useState("");
  const [recommending, setRecommending] = useState(false);
  const [recoInfo, setRecoInfo] = useState("");
  const [recoError, setRecoError] = useState("");
  useEffect(() => { api.protocolAiStatus().then((s) => setAiAvailable(!!s.ai)).catch(() => {}); }, []);

  const [pdfLoading, setPdfLoading] = useState(false);
  async function onPdf(file) {
    setRecoError(""); setRecoInfo(""); setPdfLoading(true);
    try {
      const text = await extractPdfText(file);
      if (text && text.length > 30) {
        setManualText(text);
        setRecoInfo(`Texto extraído del PDF (${text.length.toLocaleString("es-CL")} caracteres). Revisa y presiona “Recomendar protocolo”.`);
      } else if (window.confirm("El PDF no tiene texto seleccionable (parece escaneado). ¿Ejecutar OCR para reconocerlo? Puede tardar según la cantidad de páginas.")) {
        const ocrText = await ocrPdf(file, (msg) => setRecoInfo(msg));
        if (ocrText && ocrText.length > 10) {
          setManualText(ocrText);
          setRecoInfo(`Texto reconocido por OCR (${ocrText.length.toLocaleString("es-CL")} caracteres). Revísalo (el OCR puede tener errores) y presiona “Recomendar protocolo”.`);
        } else setRecoError("No se pudo reconocer texto en el PDF.");
      } else {
        setRecoError("PDF sin texto. Pega el contenido del manual manualmente.");
      }
    } catch (e) { console.error(e); setRecoError("No se pudo leer el PDF. Prueba pegando el texto."); }
    finally { setPdfLoading(false); }
  }

  async function recomendar() {
    if (!manualText.trim() || recommending) return;
    setRecommending(true); setRecoError(""); setRecoInfo("");
    try {
      const res = await api.recommendProtocol(CASE_TYPES[typeKey].label, CASE_TYPES[typeKey].steps, manualText);
      setSteps((res.steps || []).map((s) => ({ title: s.title, days: s.days ?? 0, role: s.role || "", basis: s.basis || "", legal: s.legal })));
      setRecoInfo(res.source === "ai"
        ? "Borrador generado desde tu manual (IA). Revísalo y guárdalo."
        : "La IA no estaba disponible; se muestra el protocolo legal nacional. Puedes editarlo igual.");
    } catch (err) { setRecoError((err && (err.error || err.message)) || "No se pudo generar la recomendación."); }
    finally { setRecommending(false); }
  }

  useEffect(() => {
    const c = protocols.find((p) => p.typeKey === typeKey);
    const base = (c?.steps && c.steps.length) ? c.steps : CASE_TYPES[typeKey].steps;
    setSteps(base.map((s) => ({ title: s.title, days: s.days ?? 0, role: s.role || "", basis: s.basis || "" })));
    setSaved(false);
  }, [typeKey, protocols]);

  const upd = (i, field, val) => setSteps(steps.map((s, k) => (k === i ? { ...s, [field]: val } : s)));
  const addStep = () => setSteps([...steps, { title: "", days: (steps[steps.length - 1]?.days || 0) + 1, role: "", basis: "" }]);
  const removeStep = (i) => setSteps(steps.filter((_, k) => k !== i));
  const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= steps.length) return; const cp = [...steps]; [cp[i], cp[j]] = [cp[j], cp[i]]; setSteps(cp); };

  async function guardar() {
    const clean = steps.filter((s) => s.title.trim()).map((s) => ({ title: s.title.trim(), days: Number(s.days) || 0, role: s.role, basis: s.basis }));
    if (existing) orgUpdate(setProtocols, existing.id, { typeKey, steps: clean });
    else await orgAdd(setProtocols, "protocol", { typeKey, steps: clean });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }
  function restablecer() {
    if (existing && window.confirm("¿Restablecer al protocolo normativo nacional? Se eliminará la personalización de este tipo de caso.")) orgDelete(setProtocols, existing.id);
  }

  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  return (
    <div className="max-w-3xl">
      <PageHead title="Protocolos del establecimiento" subtitle="Personaliza el paso a paso de cada tipo de caso según tu Reglamento Interno de Convivencia (RICE), sobre la base legal nacional. Se aplica al crear casos nuevos." right={<Toolbar onPrint={printView} />} />

      <div style={{ background: C.adminSoft, color: C.admin }} className="rounded-lg p-3 text-xs mb-4 leading-relaxed">
        La <b>base es la normativa nacional</b> (Ley 21.809, Aula Segura, etc.). Aquí puedes ajustar los pasos, plazos y responsables según el <b>manual de convivencia de tu establecimiento</b>. Si no personalizas un tipo, se usa el protocolo nacional por defecto.
      </div>

      <div className="mb-4">
        <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Tipo de caso</label>
        <select value={typeKey} onChange={(e) => setTypeKey(e.target.value)} className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={inp}>
          {Object.entries(CASE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="mt-1.5">
          {esPropio
            ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">Protocolo propio del establecimiento</span>
            : <span style={{ background: C.textSoft + "22", color: C.textSoft }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">Usando protocolo normativo nacional</span>}
        </div>
      </div>

      {!readOnly && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-4 mb-4">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-1 flex items-center gap-2"><Sparkles size={15} style={{ color: C.seal }} /> Recomendar desde mi manual {aiAvailable ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[10px] px-2 py-0.5 rounded-full">IA activa</span> : <span style={{ background: C.warn + "22", color: C.warn }} className="text-[10px] px-2 py-0.5 rounded-full">IA no disponible</span>}</div>
          <p style={{ color: C.textSoft }} className="text-xs mb-2">Sube el PDF de tu Reglamento Interno de Convivencia (RICE) o pega el texto. El motor propondrá el <b>procedimiento de actuación</b> (qué hacer cuando ocurre el caso) para <b>{CASE_TYPES[typeKey].label}</b>, combinando tu manual con la base legal — <b>ignora las secciones de prevención/promoción</b>. <b>La ley siempre se respeta como mínimo.</b><br />Puedes subir todo el RICE o, para mejor precisión, solo su sección de <b>protocolos de actuación</b>.</p>
          <div className="mb-2">
            <label className="mbtn-outline text-sm px-3.5 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary, opacity: pdfLoading ? 0.5 : 1 }}>
              <FileText size={14} /> {pdfLoading ? "Leyendo PDF…" : "Subir PDF del manual"}
              <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={pdfLoading} onChange={(e) => { const f = e.target.files?.[0]; if (f) onPdf(f); e.target.value = ""; }} />
            </label>
          </div>
          <textarea value={manualText} onChange={(e) => setManualText(e.target.value)} rows={4} placeholder="…o pega aquí el texto de tu manual de convivencia (o la sección relevante)…" className="w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Btn onClick={recomendar} accent={C.seal} disabled={recommending || !manualText.trim()}><Sparkles size={14} /> {recommending ? "Analizando tu manual…" : "Recomendar protocolo"}</Btn>
            {recoInfo && <span style={{ color: C.ok }} className="text-xs">{recoInfo}</span>}
            {recoError && <span style={{ color: C.urgent }} className="text-xs">{recoError}</span>}
          </div>
          <p style={{ color: C.textSoft }} className="text-[11px] mt-2">⚠️ Es un <b>borrador</b> de apoyo: revísalo y ajústalo. No reemplaza la revisión legal ni la decisión del equipo de convivencia. Solo se envía el texto del manual, nunca datos de estudiantes.</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <div key={i} style={{ background: C.cardBg, border: `1px solid ${s.legal === false ? C.seal : C.cardBorder}` }} className="rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ background: s.legal === false ? C.seal : C.primary }} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">{i + 1}</span>
              {s.legal === false
                ? <span style={{ background: C.seal + "22", color: C.seal }} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0">RICE</span>
                : s.legal === true ? <span style={{ background: C.primary + "18", color: C.primary }} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0">Ley</span> : null}
              <input value={s.title} onChange={(e) => upd(i, "title", e.target.value)} disabled={readOnly} placeholder="Título del paso" className="flex-1 rounded-md p-2 text-sm" style={inp} />
              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(i, -1)} title="Subir" style={{ color: C.textSoft }} className="px-1">↑</button>
                  <button onClick={() => move(i, 1)} title="Bajar" style={{ color: C.textSoft }} className="px-1">↓</button>
                  <button onClick={() => removeStep(i)} title="Eliminar" style={{ color: C.urgent }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr] gap-2">
              <div className="flex items-center gap-1.5">
                <input type="number" min="0" value={s.days} onChange={(e) => upd(i, "days", e.target.value)} disabled={readOnly} className="w-16 rounded-md p-1.5 text-xs" style={inp} />
                <span style={{ color: C.textSoft }} className="text-[11px]">días háb.</span>
              </div>
              <input value={s.role} onChange={(e) => upd(i, "role", e.target.value)} disabled={readOnly} placeholder="Responsable" className="rounded-md p-1.5 text-xs" style={inp} />
            </div>
            <input value={s.basis} onChange={(e) => upd(i, "basis", e.target.value)} disabled={readOnly} placeholder="Base legal / referencia (ej: Ley 21.809, art. X del RICE)" className="mt-2 w-full rounded-md p-1.5 text-xs" style={inp} />
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Btn variant="ghost" onClick={addStep}><Plus size={14} /> Agregar paso</Btn>
          <Btn onClick={guardar}><CheckCircle2 size={15} /> Guardar protocolo</Btn>
          {esPropio && <button onClick={restablecer} style={{ color: C.urgent }} className="text-xs underline">Restablecer al nacional</button>}
          {saved && <span style={{ color: C.ok }} className="text-sm flex items-center gap-1"><CheckCircle2 size={15} /> Guardado</span>}
        </div>
      )}
    </div>
  );
}

/* ------------------------- CASE DETAIL ---------------------------- */
function CaseDetail({ c, role, roleKey, setCases, templates, institutions, student, onOpenStudent, onBack }) {
  const isFamily = role.scope === "family";
  const isAudit = role.scope === "audit";
  const canDelete = ["superadmin", "coordinador", "director"].includes(roleKey);
  const [emailOpen, setEmailOpen] = useState(false);
  const [derivOpen, setDerivOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [evType, setEvType] = useState({});
  const [notice, setNotice] = useState(null); // {ok, text}
  const emails = c.emails || [];

  function update(fn) { setCases((prev) => prev.map((x) => (x.id === c.id ? fn(x) : x))); }
  // Restaura el caso a un snapshot previo (para revertir una acción que falló en el servidor).
  function revertTo(snapshot) { setCases((prev) => prev.map((x) => (x.id === c.id ? snapshot : x))); }
  function closeCase(summary) {
    let prev = null;
    update((x) => { prev = x; return { ...x, closed: true, closedAt: new Date(), closeSummary: summary, log: [...x.log, { at: new Date(), who: role.label, text: `Caso cerrado. ${summary}` }] }; });
    setCloseOpen(false);
    if (c._dbId) api.closeCase(c._dbId, summary).catch((e) => { console.error("closeCase", e); toast("No se pudo cerrar el caso. Se revirtió."); if (prev) revertTo(prev); });
  }
  function markDone(stepId) {
    let prev = null;
    update((x) => { prev = x; return { ...x, currentStepIdx: Math.max(x.currentStepIdx, stepId + 1),
      steps: x.steps.map((s) => (s.id === stepId ? { ...s, done: true } : s)),
      log: [...x.log, { at: new Date(), who: role.label, text: `Paso completado: ${x.steps[stepId].title}` }] }; });
    if (c._dbId) api.stepDone(c._dbId, stepId).catch((e) => { console.error("stepDone", e); toast("No se pudo registrar el paso. Se revirtió."); if (prev) revertTo(prev); });
  }
  function addEvidence(stepId, name, type) {
    let prev = null;
    update((x) => { prev = x; return { ...x, steps: x.steps.map((s) => (s.id === stepId ? { ...s, evidence: [...s.evidence, { name, type }] } : s)),
      log: [...x.log, { at: new Date(), who: role.label, text: `Evidencia (${type}): ${name}` }] }; });
    if (c._dbId) api.addEvidence(c._dbId, { type, name, stepOrder: stepId }).catch((e) => { console.error("addEvidence", e); toast("No se pudo adjuntar la evidencia. Se revirtió."); if (prev) revertTo(prev); });
  }
  // Notificar por correo (envío real + registro persistente).
  async function doNotify(mail) {
    setEmailOpen(false);
    update((x) => ({ ...x, notifiedApoderado: true, emails: [...(x.emails || []), { to: mail.to, subject: mail.subject, at: new Date().toISOString().slice(0, 10) }],
      log: [...x.log, { at: new Date(), who: role.label, text: `Correo enviado a ${mail.to}: ${mail.subject}` }] }));
    if (!c._dbId) { setNotice({ ok: false, text: "Este caso no está guardado en la base de datos; el correo no se envió." }); return; }
    try {
      const r = await api.notifyCase(c._dbId, mail);
      setNotice(r.sent ? { ok: true, text: `Correo enviado a ${mail.to}.` } : { ok: false, text: "Se registró el aviso, pero el correo no pudo enviarse. Revisa la configuración de correo." });
    } catch (e) { setNotice({ ok: false, text: "No se pudo enviar el correo: " + (e?.error || e?.message || "error") }); }
  }
  // Derivar a institución (envío del oficio por correo + registro persistente).
  async function doDerive(d) {
    setDerivOpen(false);
    update((x) => ({ ...x, derivations: [...(x.derivations || []), { label: d.label, email: d.email }],
      log: [...x.log, { at: new Date(), who: role.label, text: `Derivación enviada a ${d.label} (${d.email}).` }] }));
    if (!c._dbId) { setNotice({ ok: false, text: "Este caso no está guardado; la derivación no se envió." }); return; }
    try {
      const r = await api.deriveCase(c._dbId, d);
      setNotice(r.sent ? { ok: true, text: `Derivación enviada por correo a ${d.label} (${d.email}).` } : { ok: false, text: `Se registró la derivación a ${d.label}, pero el correo no pudo enviarse.` });
    } catch (e) { setNotice({ ok: false, text: "No se pudo enviar la derivación: " + (e?.error || e?.message || "error") }); }
  }
  // Eliminar el caso (solo dirección/coordinación). Irreversible; queda en auditoría.
  async function removeCase() {
    if (!window.confirm(`¿Eliminar definitivamente el caso ${c.id}?\n\nEsta acción NO se puede deshacer: borra el caso y todos sus pasos, evidencia, derivaciones y correos registrados. Úsala solo si el caso se creó por error.`)) return;
    try {
      if (c._dbId) await api.deleteCase(c._dbId);
      setCases((prev) => prev.filter((x) => x.id !== c.id));
      onBack();
    } catch (e) { setNotice({ ok: false, text: "No se pudo eliminar el caso: " + (e?.error || e?.message || "error") }); }
  }

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} style={{ color: C.textSoft }} className="text-xs mb-4 flex items-center gap-1 print:hidden">← Volver</button>
      {notice && (
        <div style={{ background: notice.ok ? C.ok + "18" : "#FCE8E6", color: notice.ok ? C.ok : C.urgent, border: `1px solid ${notice.ok ? C.ok : C.urgent}` }} className="rounded-lg px-3 py-2 mb-4 text-sm flex items-start justify-between gap-2 print:hidden">
          <span className="flex items-center gap-2">{notice.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}{notice.text}</span>
          <button onClick={() => setNotice(null)} style={{ color: "inherit" }}><X size={15} /></button>
        </div>
      )}
      <div className="flex items-start justify-between mb-1 gap-3 flex-wrap">
        <div className="flex items-stretch gap-3">
          <div style={{ background: caseColor(c.typeKey) }} className="w-1 rounded-full shrink-0" />
          <div>
            <div style={{ ...mono, color: C.textSoft }} className="text-xs">{c.id}</div>
            <div style={{ ...serif, color: C.ink }} className="text-2xl">{c.type.label}</div>
          </div>
        </div>
        {!isFamily && (
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <Btn variant="ghost" onClick={printView}><Printer size={14} /> Imprimir</Btn>
            {!isAudit && <Btn variant="ghost" onClick={() => setDerivOpen(true)}><Network size={14} /> Derivar</Btn>}
            {!isAudit && <Btn variant="ghost" onClick={() => setEmailOpen(true)}><Mail size={14} /> Notificar</Btn>}
            {!isAudit && !c.closed && <Btn variant="ghost" onClick={() => setCloseOpen(true)}><Lock size={14} /> Cerrar caso</Btn>}
            {canDelete && <Btn variant="ghost" onClick={removeCase} accent={C.urgent}><Trash2 size={14} /> Eliminar</Btn>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <span style={{ color: C.textSoft }} className="text-sm">{c.studentLabel} · {LEVELS[c.level] || "Nivel no indicado"}</span>
        {student && onOpenStudent && (!c.participants || c.participants.length === 0) && <button onClick={() => onOpenStudent(student.id)} style={{ color: C.primary }} className="text-xs flex items-center gap-1 print:hidden"><ClipboardList size={13} /> Ver expediente</button>}
      </div>
      {!isFamily && c.participants && c.participants.length > 0 && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 mb-4">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-2">Estudiantes involucrados ({c.participants.length})</div>
          <div className="flex flex-col gap-2">
            {c.participants.map((p) => (
              <div key={p.studentId} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: p.role === "afectado" ? C.urgent + "18" : p.role === "testigo" ? C.paper : C.adminSoft, color: p.role === "afectado" ? C.urgent : p.role === "testigo" ? C.textSoft : C.primary, border: `1px solid ${C.cardBorder}` }}>{ROLE_LABEL[p.role] || p.role}</span>
                <span className="text-sm flex-1" style={{ color: C.ink }}>{p.name}{p.curso ? <span style={{ color: C.textSoft }} className="text-xs"> · {p.curso}</span> : null}</span>
                {onOpenStudent && <button onClick={() => onOpenStudent(p.studentId)} style={{ color: C.primary }} className="text-xs flex items-center gap-1 print:hidden"><ClipboardList size={13} /> Ver expediente</button>}
              </div>
            ))}
          </div>
        </div>
      )}
      {c.closed && (
        <div style={{ background: C.ok + "18", border: `1px solid ${C.ok}` }} className="rounded-lg p-3 mb-4 flex items-start gap-2">
          <Lock size={15} style={{ color: C.ok }} className="mt-0.5 shrink-0" />
          <div><div style={{ color: C.ok }} className="text-sm font-medium">Caso cerrado{c.closedAt ? ` · ${fmt(c.closedAt)}` : ""}</div>{c.closeSummary && <div style={{ color: C.textSoft }} className="text-xs mt-0.5">{c.closeSummary}</div>}</div>
        </div>
      )}

      {!isFamily && (c.fechaHecho || c.hora || c.lugar || c.curso || c.testigos || c.adultosRef) && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 mb-4">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-2">Datos del incidente</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
            {c.fechaHecho && <div><span style={{ color: C.textSoft }}>Fecha: </span><span style={{ color: C.ink }}>{c.fechaHecho}</span></div>}
            {c.hora && <div><span style={{ color: C.textSoft }}>Hora: </span><span style={{ color: C.ink }}>{c.hora}</span></div>}
            {c.curso && <div><span style={{ color: C.textSoft }}>Curso: </span><span style={{ color: C.ink }}>{c.curso}</span></div>}
            {c.lugar && <div className="col-span-2 sm:col-span-1"><span style={{ color: C.textSoft }}>Lugar: </span><span style={{ color: C.ink }}>{c.lugar}</span></div>}
            {c.testigos && <div className="col-span-2 sm:col-span-3"><span style={{ color: C.textSoft }}>Testigos: </span><span style={{ color: C.ink }}>{c.testigos}</span></div>}
            {c.adultosRef && <div className="col-span-2 sm:col-span-3"><span style={{ color: C.textSoft }}>Adultos referentes / programas: </span><span style={{ color: C.ink }}>{c.adultosRef}</span></div>}
          </div>
        </div>
      )}

      {!isFamily && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <Network size={16} style={{ color: C.seal }} className="mt-0.5 shrink-0" />
            <div>
              <div style={{ color: C.ink }} className="text-sm font-medium mb-1">Redes de derivación</div>
              <div className="flex flex-wrap gap-1.5 mt-0.5">{c.type.network.map((id) => <InstChip key={id} id={id} institutions={institutions} />)}</div>
              {c.derivations.length > 0 && <div style={{ color: C.ok }} className="text-xs mt-1">Derivado a: {c.derivations.map((d) => `${d.label} (${d.email})`).join(", ")}</div>}
            </div>
          </div>
          {!isAudit && (
            <label className="flex items-center gap-2 text-xs print:hidden" style={{ color: C.textSoft }}>
              <input type="checkbox" checked={c.autoEmails} onChange={() => update((x) => ({ ...x, autoEmails: !x.autoEmails }))} /> Correos automáticos
            </label>
          )}
        </div>
      )}

      <div style={{ color: C.ink }} className="text-sm font-medium mb-3 uppercase tracking-wide">{isFamily ? "Avance de su caso" : "Paso a paso normado"}</div>
      <div className="flex flex-col">
        {c.steps.map((s, i) => {
          const dl = daysLeft(s.due);
          const isCurrent = i === c.currentStepIdx;
          const isFuture = i > c.currentStepIdx;
          const color = s.done ? C.ok : isCurrent ? urgencyColor(dl, C) : "#B7BEC6";
          return (
            <div key={s.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div style={{ background: s.done ? C.ok : "#fff", border: `2px solid ${color}` }} className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {s.done ? <CheckCircle2 size={14} color="#fff" /> : <span style={{ color }} className="text-[11px] font-semibold">{i + 1}</span>}
                </div>
                {i < c.steps.length - 1 && <div style={{ background: C.cardBorder }} className="w-px flex-1 my-1" />}
              </div>
              <div className={`pb-6 flex-1 ${isFuture ? "opacity-60" : ""}`}>
                <div style={{ color: C.ink }} className="text-sm font-medium">{s.title}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span style={{ ...mono, color: C.textSoft }} className="text-[11px]">Vence {fmt(s.due)}</span>
                  {isCurrent && !s.done && <span style={{ color }} className="text-[11px] font-medium flex items-center gap-1"><Clock size={11} />{dl < 0 ? `Plazo vencido hace ${-dl} días` : `${dl} días restantes`}</span>}
                  {!isFamily && <span style={{ color: C.textSoft }} className="text-[11px]">Responsable: {s.role}</span>}
                </div>
                {!isFamily && <div style={{ color: C.text }} className="text-[12px] mt-1.5 flex items-start gap-1.5"><Sparkles size={11} style={{ color: C.seal }} className="mt-0.5 shrink-0" /> {stepHint(s.title)}</div>}
                <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="mt-2 inline-flex items-start gap-1.5 rounded px-2.5 py-1.5">
                  <Scale size={11} style={{ color: C.seal }} className="mt-0.5 shrink-0" />
                  <span style={{ color: C.textSoft }} className="text-[11px] leading-snug">{s.basis}</span>
                </div>
                {s.evidence.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.evidence.map((ev, k) => <span key={k} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.textSoft }} className="text-[11px] px-2 py-1 rounded flex items-center gap-1"><Paperclip size={10} /> <b style={{ color: C.ink, fontWeight: 600 }}>{ev.type}</b> · {ev.name}</span>)}
                  </div>
                )}
                {!isFamily && !isAudit && !isFuture && (
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap print:hidden">
                    <select value={evType[s.id] || EVIDENCE_TYPES[0]} onChange={(e) => setEvType({ ...evType, [s.id]: e.target.value })} className="text-xs rounded-md p-1.5" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
                      {EVIDENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <label className="mbtn-outline text-xs px-4 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}>
                      <Paperclip size={13} /> Subir evidencia
                      <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addEvidence(s.id, f.name, evType[s.id] || EVIDENCE_TYPES[0]); e.target.value = ""; }} />
                    </label>
                    {isCurrent && !s.done && <button onClick={() => markDone(s.id)} style={{ background: C.primary, color: "#fff" }} className="mbtn flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full"><CheckCircle2 size={13} /> Marcar como completado</button>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isFamily && emails.length > 0 && (
        <div className="mt-4">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-2 uppercase tracking-wide">Correos enviados</div>
          <div className="flex flex-col gap-2">
            {emails.map((m, k) => (
              <div key={k} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 text-xs">
                <div style={{ color: C.textSoft }}>{m.at} · Para: {m.to}</div>
                <div style={{ color: C.ink }} className="font-medium mt-0.5">{m.subject}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {emailOpen && <EmailModal c={c} templates={templates} onClose={() => setEmailOpen(false)} onSend={doNotify} />}
      {derivOpen && <DerivationModal c={c} institutions={institutions} onClose={() => setDerivOpen(false)} onDerive={doDerive} />}
      {closeOpen && <CloseCaseModal onClose={() => setCloseOpen(false)} onConfirm={closeCase} />}
    </div>
  );
}

function CloseCaseModal({ onClose, onConfirm }) {
  const [summary, setSummary] = useState("");
  return (
    <Modal onClose={onClose} title="Cerrar caso">
      <p style={{ color: C.textSoft }} className="text-sm mb-3">Al cerrar el caso se registra la fecha y un resumen de cierre. Queda en el historial y en el expediente del estudiante.</p>
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Resumen de cierre</label>
      <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} placeholder="Medidas cumplidas, acuerdos alcanzados, estado final…" className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
      <div className="flex gap-2 justify-end mt-4"><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn onClick={() => onConfirm(summary)} accent={C.ok}><Lock size={14} /> Cerrar caso</Btn></div>
    </Modal>
  );
}

function EmailModal({ c, templates, onClose, onSend }) {
  const keys = Object.keys(templates);
  const [tk, setTk] = useState(keys[0]);
  const [to, setTo] = useState(c.apoderadoEmail || "");
  const tpl = templates[tk];
  const subject = fillTemplate(tpl.subject, c);
  const body = fillTemplate(tpl.body, c);
  const valid = /\S+@\S+\.\S+/.test(to.trim());
  return (
    <Modal onClose={onClose} title="Enviar correo al apoderado/a">
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Plantilla</label>
      <select value={tk} onChange={(e) => setTk(e.target.value)} className="mt-1.5 mb-3 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
        {keys.map((k) => <option key={k} value={k}>{templates[k].label}</option>)}
      </select>
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Correo del destinatario</label>
      <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="apoderado@correo.cl" className="mt-1.5 mb-3 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${valid || !to ? C.cardBorder : C.urgent}`, color: C.text }} />
      <div style={{ color: C.text }} className="text-sm font-medium mb-3">Asunto: {subject}</div>
      <div style={{ borderTop: `1px solid ${C.cardBorder}`, color: C.text }} className="pt-3 text-sm whitespace-pre-line">{body}</div>
      <div className="flex gap-2 justify-end mt-4">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => valid && onSend({ to: to.trim(), subject, body })} disabled={!valid}><Send size={14} /> Enviar</Btn>
      </div>
    </Modal>
  );
}

function DerivationModal({ c, institutions, onClose, onDerive }) {
  const suggested = c.type.network;
  const [instId, setInstId] = useState(suggested[0] || institutions[0]?.id);
  const [email, setEmail] = useState(institutions.find((i) => i.id === (suggested[0] || institutions[0]?.id))?.email || "");
  const inst = institutions.find((i) => i.id === instId);
  const validEmail = /\S+@\S+\.\S+/.test(email.trim());
  const oficio = `Estimados ${inst?.label || "institución"}:\n\nPor medio del presente, el establecimiento deriva a su institución el siguiente caso de convivencia escolar para su conocimiento y gestión según corresponda:\n\n• Código del caso: ${c.id}\n• Tipo: ${c.type.label}\n• Estudiante(s) / involucrados: ${c.studentLabel || "-"}${c.curso ? `\n• Curso: ${c.curso}` : ""}${c.fechaHecho ? `\n• Fecha del hecho: ${c.fechaHecho}` : ""}${c.lugar ? `\n• Lugar: ${c.lugar}` : ""}\n\nQuedamos atentos a su respuesta.`;
  return (
    <Modal onClose={onClose} title="Derivar a institución">
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Institución</label>
      <select value={instId} onChange={(e) => { setInstId(e.target.value); setEmail(institutions.find((i) => i.id === e.target.value)?.email || ""); }} className="mt-1.5 mb-3 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
        {institutions.map((i) => <option key={i.id} value={i.id}>{i.label}{suggested.includes(i.id) ? " (sugerida)" : ""}</option>)}
      </select>
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Correo de destino</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@institucion.cl" className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${validEmail || !email ? C.cardBorder : C.urgent}`, color: C.text }} />
      <p style={{ color: C.textSoft }} className="text-[11px] mt-2">Se enviará un oficio por correo a la institución con los datos del caso (código, tipo, estudiante/involucrados y fecha), y quedará registrado en el caso.</p>
      <div className="flex gap-2 justify-end mt-4"><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn onClick={() => validEmail && onDerive({ label: inst.label, email: email.trim(), subject: `Derivación de caso ${c.id} · ${c.type.label}`, body: oficio })} disabled={!validEmail} accent={C.seal}><Send size={14} /> Enviar derivación</Btn></div>
    </Modal>
  );
}

/* ------------------------- REPORTES ------------------------------- */
function ReportsPage({ cases, setCases, students = [] }) {
  const [ftype, setFtype] = useState("");
  const [flevel, setFlevel] = useState("");
  const [festado, setFestado] = useState("");
  const enriched = cases.map((c) => {
    const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
    const dl = daysLeft(step.due);
    const estado = c.closed ? "cerrado" : dl < 0 ? "vencido" : dl <= 3 ? "por vencer" : "al día";
    return { c, step, dl, estado };
  });
  const rows = enriched.filter((r) => (!ftype || r.c.typeKey === ftype) && (!flevel || r.c.level === flevel) && (!festado || r.estado === festado));
  const byType = Object.entries(CASE_TYPES).map(([k, v]) => ({ key: k, label: v.label, n: rows.filter((r) => r.c.typeKey === k).length })).filter((x) => x.n > 0);
  const maxT = Math.max(...byType.map((x) => x.n), 1);

  // Indicadores avanzados (Módulo 11)
  const abiertos = cases.filter((c) => !c.closed).length;
  const cerrados = cases.filter((c) => c.closed).length;
  const cursoCount = {};
  cases.forEach((c) => { const k = c.curso || "—"; cursoCount[k] = (cursoCount[k] || 0) + 1; });
  const cursoTop = Object.entries(cursoCount).sort((a, b) => b[1] - a[1])[0];
  const reincidentes = students.filter((s) => cases.filter((c) => caseHasStudent(c, s.id)).length > 1).length;
  const closedWithDates = cases.filter((c) => c.closed && c.closedAt && c.start);
  const tiempoProm = closedWithDates.length ? Math.round(closedWithDates.reduce((a, c) => a + (new Date(c.closedAt) - new Date(c.start)) / 86400000, 0) / closedWithDates.length) : null;
  const totCit = students.reduce((a, s) => a + (s.citaciones || []).length, 0);
  const citAsiste = students.reduce((a, s) => a + (s.citaciones || []).filter((c) => c.estado === "Asiste").length, 0);
  const asistPct = totCit ? Math.round((citAsiste / totCit) * 100) : null;
  const totMedidas = students.reduce((a, s) => a + (s.medidas || []).length, 0);
  const indicadores = [
    { label: "Casos abiertos", value: abiertos },
    { label: "Casos cerrados", value: cerrados },
    { label: "Curso con mayor incidencia", value: cursoTop ? `${cursoTop[0]} (${cursoTop[1]})` : "—" },
    { label: "Estudiantes reincidentes", value: reincidentes },
    { label: "Tiempo prom. de resolución", value: tiempoProm != null ? `${tiempoProm} días` : "—" },
    { label: "Asistencia a entrevistas", value: asistPct != null ? `${asistPct}%` : "—" },
    { label: "Medidas aplicadas", value: totMedidas },
    { label: "Casos totales", value: cases.length },
  ];

  return (
    <div>
      <PageHead title="Reportes y estadísticas" subtitle="Reporte dinámico: filtra por tipo, nivel y estado. Imprime, exporta (JSON/CSV) o importa respaldos."
        right={<Toolbar onPrint={printView} onExport={() => exportJSON(cases, "reporte-casos.json")} onImport={async (data) => { if (Array.isArray(data)) { const n = await importCases(setCases, cases, data); alert(`${n} caso(s) importado(s) y guardado(s) en la base de datos.`); } }} />} />
      <div className="flex gap-3 mb-4 flex-wrap print:hidden">
        <select value={ftype} onChange={(e) => setFtype(e.target.value)} className="rounded-md p-2 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
          <option value="">Todos los tipos</option>
          {Object.entries(CASE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={flevel} onChange={(e) => setFlevel(e.target.value)} className="rounded-md p-2 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
          <option value="">Todos los niveles</option>
          {Object.entries(LEVELS).filter(([k]) => k !== "todos").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={festado} onChange={(e) => setFestado(e.target.value)} className="rounded-md p-2 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
          <option value="">Todos los estados</option>
          <option value="al día">Al día</option><option value="por vencer">Por vencer</option><option value="vencido">Vencido</option>
        </select>
        <Btn variant="ghost" onClick={() => exportCSV(rows.map((r) => ({ ID: r.c.id, Tipo: r.c.type.label, Nivel: LEVELS[r.c.level] || "", Etapa: r.step.title, Estado: r.estado, DiasRestantes: r.dl })), "reporte-casos.csv")}><Download size={15} /> Exportar CSV</Btn>
        <Btn variant="ghost" onClick={() => exportExcel(rows.map((r) => ({ ID: r.c.id, Tipo: r.c.type.label, Nivel: LEVELS[r.c.level] || "", Curso: r.c.curso || "", Etapa: r.step.title, Estado: r.estado })), "reporte-casos.xls", "Reporte de casos — Recupera Convivencia")}><Download size={15} /> Exportar Excel</Btn>
        <Btn variant="ghost" onClick={() => exportReportPDF({
          title: "Reporte de convivencia escolar",
          subtitle: "Reporte generado desde la plataforma Recupera Convivencia. Incluye indicadores y el detalle de casos según los filtros aplicados.",
          indicadores,
          columns: ["ID", "Tipo", "Nivel", "Curso", "Etapa actual", "Estado"],
          rows: rows.map((r) => [r.c.id, r.c.type.label, LEVELS[r.c.level] || "", r.c.curso || "—", r.step.title, r.estado]),
          filename: "reporte-convivencia.pdf",
        })}><Download size={15} /> Descargar PDF</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Casos (filtrados)" value={rows.length} color={C.ink} />
        <StatCard label="Vencidos" value={rows.filter((r) => r.estado === "vencido").length} color={C.urgent} />
        <StatCard label="Al día" value={rows.filter((r) => r.estado === "al día").length} color={C.ok} />
      </div>
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-6">
        <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Indicadores</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {indicadores.map((k) => <div key={k.label}><div style={{ color: C.ink }} className="text-lg font-semibold">{k.value}</div><div style={{ color: C.textSoft }} className="text-[11px] leading-snug">{k.label}</div></div>)}
        </div>
      </div>
      {byType.length > 0 && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-6">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Distribución por tipo de caso</div>
          <div className="flex flex-col gap-2">
            {byType.map((x) => (
              <div key={x.label} className="flex items-center gap-3">
                <div className="text-xs w-56 shrink-0 truncate flex items-center gap-1.5"><span style={{ background: caseColor(x.key) }} className="w-2 h-2 rounded-full inline-block shrink-0" /><span style={{ color: C.textSoft }}>{x.label}</span></div>
                <div className="flex-1 h-3.5 rounded" style={{ background: C.appBg }}><div style={{ width: `${(x.n / maxT) * 100}%`, background: caseColor(x.key) }} className="h-3.5 rounded" /></div>
                <div style={{ color: C.ink }} className="text-xs w-5 text-right">{x.n}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: C.paper, color: C.textSoft }} className="text-xs uppercase">
            <th className="text-left p-3">ID</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Nivel</th><th className="text-left p-3">Etapa</th><th className="text-left p-3">Estado</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.c.id} style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <td style={{ ...mono, color: C.textSoft }} className="p-3 text-xs">{r.c.id}</td>
                <td style={{ color: C.ink }} className="p-3">{r.c.type.label}</td>
                <td style={{ color: C.textSoft }} className="p-3 text-xs">{LEVELS[r.c.level] || "—"}</td>
                <td style={{ color: C.textSoft }} className="p-3 text-xs">{r.step.title}</td>
                <td className="p-3"><StatusPill dl={r.dl} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------- FORMATOS / PLANTILLAS ------------------------ */
function FormatosPage() {
  const [sel, setSel] = useState(INTERVIEW_TEMPLATES[0].id);
  const tpl = INTERVIEW_TEMPLATES.find((t) => t.id === sel);
  return (
    <div className="max-w-3xl">
      <PageHead title="Formatos y plantillas" subtitle="Formatos de entrevista y acta listos para imprimir y completar a mano o en pantalla." right={<Toolbar onPrint={printView} />} />
      <div className="flex gap-2 mb-4 flex-wrap print:hidden">
        {INTERVIEW_TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => setSel(t.id)} className="text-sm px-3 py-2 rounded-md"
            style={{ background: sel === t.id ? C.ink : "transparent", color: sel === t.id ? "#fff" : C.textSoft, border: `1px solid ${sel === t.id ? C.ink : C.cardBorder}` }}>{t.title}</button>
        ))}
      </div>
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1"><FileText size={18} style={{ color: C.seal }} /><div style={{ ...serif, color: C.ink }} className="text-xl">{tpl.title}</div></div>
        <div style={{ color: C.textSoft }} className="text-xs mb-5">Destinatario: {tpl.audience} · Recupera Convivencia</div>
        <div className="flex flex-col gap-4">
          {tpl.fields.map((f) => (
            <div key={f}>
              <div style={{ color: C.ink }} className="text-xs font-medium mb-1.5">{f}</div>
              <div style={{ borderBottom: `1px solid ${C.paperLine}`, height: f.toLowerCase().includes("relato") || f.toLowerCase().includes("declaración") || f.toLowerCase().includes("desarrollo") ? 64 : 24 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------- NORMATIVA / REDES / AUDIT -------------------- */
function NormativaPage({ docs, setDocs, role }) {
  const readOnly = !role || role.scope !== "admin";
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const setDocField = (id, patch) => setDocs(docs.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const feeds = {
    rice: "Alimenta el paso a paso de convivencia: faltas, medidas y plazos internos.",
    pei: "Marco de valores y sello institucional que enmarca cada decisión.",
    eval: "Reglamento de Evaluación (Decreto 67) — ámbito pedagógico.",
    pme: "Plan de Mejoramiento — seguimiento de las acciones de convivencia.",
  };
  return (
    <div className="max-w-3xl">
      <PageHead title="Motor normativo" subtitle="El motor combina dos capas: la normativa nacional (igual para todos) y los documentos propios de tu establecimiento." right={<Toolbar onPrint={printView} />} />

      {/* Principio */}
      <div style={{ background: C.primary + "12", border: `1px solid ${C.primary}55` }} className="rounded-xl p-4 mb-6 flex items-start gap-3">
        <Scale size={18} style={{ color: C.primary }} className="mt-0.5 shrink-0" />
        <div style={{ color: C.text }} className="text-sm">
          <b style={{ color: C.ink }}>El reglamento del establecimiento puede ser más exigente que la ley, nunca menos.</b> El motor toma lo propio de tu colegio y lo valida contra los mínimos nacionales.
        </div>
      </div>

      {/* Capa 1 — Documentos del establecimiento */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ background: C.ok }} className="w-2 h-2 rounded-full" />
        <span style={{ color: C.ink }} className="text-sm font-semibold">Capa 1 · Documentos de tu establecimiento</span>
      </div>
      <div className="flex flex-col gap-2.5 mb-7">
        {(docs || []).map((d) => (
          <div key={d.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${C.ok}` }} className="rounded-lg p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div style={{ color: C.ink }} className="text-sm font-medium">{d.name}</div>
              <span style={{ background: (d.status === "Cargado" ? C.ok : C.warn) + "22", color: d.status === "Cargado" ? C.ok : C.warn }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{d.status} · {d.updated}</span>
            </div>
            {feeds[d.id] && <div style={{ color: C.textSoft }} className="text-xs mt-1">{feeds[d.id]}</div>}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap print:hidden">
              {!readOnly && <input value={d.url || ""} onChange={(e) => setDocField(d.id, { url: e.target.value })} placeholder="Enlace a Drive" className="rounded-md p-1.5 text-xs flex-1 min-w-[160px]" style={inp} />}
              {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ color: C.primary }} className="text-xs inline-flex items-center gap-1"><ExternalLink size={12} /> Abrir</a>}
              {!readOnly && (
                <label className="mbtn-outline text-xs px-3.5 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}>
                  <Upload size={13} /> Cargar
                  <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setDocField(d.id, { status: "Cargado", updated: new Date().toISOString().slice(0, 7) }); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>
        ))}
        {readOnly && <div style={{ color: C.textSoft }} className="text-[11px]">Solo el/la Coordinador/a de Convivencia puede cargar estos documentos.</div>}
      </div>

      {/* Capa 2 — Normativa nacional */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ background: C.primary }} className="w-2 h-2 rounded-full" />
        <span style={{ color: C.ink }} className="text-sm font-semibold">Capa 2 · Normativa nacional</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {NORMATIVA_LIBRARY.map((n) => (
          <div key={n.name} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${C.primary}` }} className="rounded-lg p-4 flex items-start gap-3">
            <Scale size={16} style={{ color: C.primary }} className="mt-0.5 shrink-0" />
            <div><div style={{ color: C.ink }} className="text-sm font-medium">{n.name}</div><div style={{ color: C.textSoft }} className="text-sm mt-0.5">{n.desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstChip({ id, institutions }) {
  const inst = institutions.find((i) => i.id === id);
  const color = INST_TYPE_COLORS[inst?.type] || "#5F6368";
  return (
    <span style={{ background: color + "18", color, border: `1px solid ${color}55` }} className="text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
      <span style={{ background: color }} className="w-1.5 h-1.5 rounded-full inline-block" /> {inst?.label}
    </span>
  );
}

function RedesPage({ institutions }) {
  const types = Object.entries(INST_TYPE_COLORS);
  return (
    <div className="max-w-3xl">
      <PageHead title="Redes de derivación" subtitle="Instituciones disponibles según el tipo de caso. El color indica el tipo de red." right={<Toolbar onPrint={printView} />} />
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
        {types.map(([t, color]) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-[11px] capitalize" style={{ color: C.textSoft }}>
            <span style={{ background: color }} className="w-2.5 h-2.5 rounded-full inline-block" /> {t}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {Object.values(CASE_TYPES).map((t) => {
          const accent = instColor(t.network[0], institutions);
          return (
            <div key={t.label} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${accent}` }} className="rounded-lg p-4">
              <div style={{ color: C.ink }} className="text-sm font-medium mb-2">{t.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {t.network.map((id) => <InstChip key={id} id={id} institutions={institutions} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PermissionsPage({ permset, setPermset, roleKey }) {
  const canEdit = ["coordinador", "director", "superadmin"].includes(roleKey);
  const [selRole, setSelRole] = useState(PERM_ROLES[0]);
  const [levels, setLevels] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const l = {};
    for (const m of PERM_MODULES) l[m.k] = effLevel(selRole, m.k, permset);
    setLevels(l); setSaved(false);
  }, [selRole, permset]);

  const esPropio = !!(permset && permset[selRole]);
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  async function guardar() {
    if (saving) return;
    setSaving(true);
    try {
      const cur = permset ? { ...permset } : {};
      const id = cur.id; delete cur.id;
      cur[selRole] = { ...levels };
      if (id) { await api.updateOrgRecord(id, cur); setPermset({ id, ...cur }); }
      else { const r = await api.addOrgRecord("permset", cur); setPermset({ id: r.id, ...(r.data || {}) }); }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error("guardar permisos", e); }
    finally { setSaving(false); }
  }
  function restablecer() {
    const l = {};
    for (const m of PERM_MODULES) l[m.k] = defaultLevel(selRole, m.k);
    setLevels(l);
  }

  const LEVEL_OPTS = [["", "Sin acceso"], ["ver", "Ver (solo lectura)"], ["editar", "Editar (acceso total)"]];

  if (!canEdit) {
    return <div><PageHead title="Permisos por rol" subtitle="Configuración de accesos por perfil." /><div style={{ color: C.textSoft }} className="text-sm">Tu perfil no puede configurar permisos.</div></div>;
  }

  return (
    <div className="max-w-3xl">
      <PageHead title="Permisos por rol" subtitle="Define qué puede ver y hacer cada perfil en tu establecimiento. Los cambios aplican a todos los usuarios de ese rol." right={<Toolbar onPrint={printView} />} />

      <div style={{ background: C.adminSoft, color: C.admin }} className="rounded-lg p-3 text-xs mb-4 leading-relaxed">
        Elige un rol y ajusta cada módulo: <b>Sin acceso</b> (no aparece en su menú), <b>Ver</b> (solo lectura) o <b>Editar</b> (puede crear y modificar). La gestión de usuarios, permisos y configuración queda reservada a Coordinación y Dirección.
      </div>

      <div className="mb-4">
        <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Perfil / rol</label>
        <select value={selRole} onChange={(e) => setSelRole(e.target.value)} className="mt-1.5 w-full max-w-sm rounded-md p-2.5 text-sm" style={inp}>
          {PERM_ROLES.map((rk) => <option key={rk} value={rk}>{ROLES[rk]?.label || rk}</option>)}
        </select>
        <div className="mt-1.5">
          {esPropio
            ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">Permisos personalizados</span>
            : <span style={{ background: C.textSoft + "22", color: C.textSoft }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">Usando valores por defecto</span>}
        </div>
      </div>

      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg overflow-hidden">
        {PERM_MODULES.map((m, i) => (
          <div key={m.k} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i ? `1px solid ${C.cardBorder}` : "none" }}>
            <span style={{ color: C.ink }} className="text-sm flex-1">{m.label}</span>
            <select value={levels[m.k] ?? ""} onChange={(e) => setLevels({ ...levels, [m.k]: e.target.value })} className="rounded-md p-1.5 text-sm shrink-0" style={{ ...inp, minWidth: 170 }}>
              {LEVEL_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <Btn onClick={guardar} disabled={saving}><CheckCircle2 size={15} /> {saving ? "Guardando…" : "Guardar permisos"}</Btn>
        <button onClick={restablecer} style={{ color: C.textSoft }} className="text-xs underline">Restablecer valores por defecto</button>
        {saved && <span style={{ color: C.ok }} className="text-sm flex items-center gap-1"><CheckCircle2 size={15} /> Guardado</span>}
      </div>
      <p style={{ color: C.textSoft }} className="text-[11px] mt-3">Nota: el resguardo de datos por establecimiento y las acciones sensibles se mantienen protegidos en el servidor, independiente de esta configuración.</p>
    </div>
  );
}

const AUDIT_LABELS = {
  login: "Inicio de sesión", "user.activate": "Activación de cuenta",
  "user.invite": "Invitación de usuario", "user.edit": "Edición de usuario", "user.delete": "Eliminación de usuario",
  "user.2fa_enable": "Activó 2FA", "user.2fa_disable": "Desactivó 2FA",
  "case.create": "Creó caso", "case.close": "Cerró caso", "case.delete": "Eliminó caso",
  "student.create": "Creó expediente", "student.delete": "Eliminó expediente",
};

function AuditPanel({ cases }) {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.listAudit(300).then(setLogs).catch((e) => setError((e && (e.error || e.message)) || "No se pudo cargar la auditoría."));
  }, []);

  const overdue = cases.filter((c) => !c.closed && daysLeft((c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1] || {}).due) < 0);

  return (
    <div>
      <PageHead title="Auditoría y trazabilidad" subtitle="Registro de acciones sobre datos sensibles (Ley 21.719): quién hizo qué y cuándo. Solo lectura." right={<Toolbar onPrint={printView} onExport={() => logs && exportJSON(logs, "auditoria.json")} />} />

      {overdue.length > 0 && (
        <div style={{ background: C.urgent + "12", border: `1px solid ${C.urgent}` }} className="rounded-lg p-3 mb-4 text-xs" >
          <span style={{ color: C.urgent }} className="font-medium flex items-center gap-1.5"><AlertTriangle size={13} /> {overdue.length} caso(s) exceden el plazo normativo</span>
          <span style={{ color: C.textSoft }}>{overdue.map((c) => c.id).join(", ")}</span>
        </div>
      )}

      <div style={{ color: C.ink }} className="text-sm font-medium mb-2">Registro de actividad</div>
      {error && <div style={{ color: C.urgent }} className="text-sm">{error}</div>}
      {!logs && !error && <div style={{ color: C.textSoft }} className="text-sm">Cargando…</div>}
      {logs && logs.length === 0 && <div style={{ color: C.textSoft }} className="text-sm">Sin eventos registrados aún.</div>}
      {logs && logs.length > 0 && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg overflow-hidden">
          {logs.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-xs" style={{ borderTop: i ? `1px solid ${C.cardBorder}` : "none" }}>
              <span style={{ ...mono, color: C.textSoft }} className="shrink-0 w-32">{new Date(e.at).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              <span style={{ color: C.ink }} className="font-medium shrink-0 w-44">{AUDIT_LABELS[e.action] || e.action}</span>
              <span style={{ color: C.textSoft }} className="flex-1 truncate">{e.userName || "—"}{e.detail ? ` · ${e.detail}` : ""}</span>
              {e.userRole && <span style={{ background: C.appBg, color: C.textSoft }} className="text-[10px] px-2 py-0.5 rounded-full shrink-0">{ROLES[e.userRole]?.label || e.userRole}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PerfilesPage({ roleKey }) {
  const canManage = ["superadmin", "coordinador", "director"].includes(roleKey);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", rut: "", role: "profesorJefe", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState(null); // { url, name }
  const [copied, setCopied] = useState(false);

  function reload() {
    if (!canManage) { setLoading(false); return; }
    setLoading(true);
    api.listUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function submit() {
    if (!form.name.trim() || !form.rut.trim() || saving) return;
    setError(""); setSaving(true); setInvite(null); setCopied(false);
    try {
      const res = await api.inviteUser(form);
      setInvite({ url: res.inviteUrl, name: form.name, email: form.email, emailSent: res.emailSent, mailerConfigured: res.mailerConfigured });
      setForm({ name: "", rut: "", role: "profesorJefe", email: "" });
      reload();
    } catch (err) {
      setError((err && (err.error || err.message)) || "No se pudo generar la invitación.");
    } finally { setSaving(false); }
  }

  async function copiar(url) {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  }

  async function reinvitar(u) {
    try { const res = await api.reinviteUser(u.id); setInvite({ url: res.inviteUrl, name: u.name, email: u.email, emailSent: res.emailSent, mailerConfigured: res.mailerConfigured }); setCopied(false); } catch (err) { setError((err && (err.error || err.message)) || "No se pudo regenerar."); }
  }

  async function borrar(u) {
    if (!window.confirm(`¿Eliminar la cuenta de ${u.name}? Esta acción no se puede deshacer.`)) return;
    setError("");
    try { await api.deleteUser(u.id); setUsers((prev) => prev.filter((x) => x.id !== u.id)); }
    catch (err) { setError((err && (err.error || err.message)) || "No se pudo eliminar."); }
  }

  // --- Carga masiva ---
  const [bulkRows, setBulkRows] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  function onBulkFile(file) {
    setBulkResult(null); setError("");
    const reader = new FileReader();
    reader.onload = () => { try { setBulkRows(parseUsersCsv(String(reader.result))); } catch { setError("No se pudo leer el archivo."); } };
    reader.readAsText(file);
  }
  function descargarPlantilla() {
    const csv = "nombre,rut,rol,correo\nJuan Pérez,12.345.678-5,profesorJefe,juan@correo.cl\nAna Soto,7.777.777-6,docente,ana@correo.cl\n";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "plantilla-usuarios.csv"; a.click(); URL.revokeObjectURL(a.href);
  }
  async function confirmarCarga() {
    if (!bulkRows?.length || bulkLoading) return;
    setBulkLoading(true); setError("");
    try {
      const res = await api.bulkInvite(bulkRows);
      setBulkResult(res); setBulkRows(null); reload();
    } catch (err) { setError((err && (err.error || err.message)) || "No se pudo procesar la carga."); }
    finally { setBulkLoading(false); }
  }

  const [editing, setEditing] = useState(null); // { id, name, email, role }
  async function guardarEdicion() {
    if (!editing) return;
    try {
      const upd = await api.updateUser(editing.id, { name: editing.name, email: editing.email, role: editing.role });
      setUsers((prev) => prev.map((x) => (x.id === upd.id ? upd : x)));
      setEditing(null);
    } catch (err) { setError((err && (err.error || err.message)) || "No se pudo guardar."); }
  }

  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  if (!canManage) {
    return <div><PageHead title="Usuarios y accesos" subtitle="Gestión de cuentas del establecimiento." /><div style={{ color: C.textSoft }} className="text-sm">Tu perfil no tiene permisos para gestionar usuarios.</div></div>;
  }

  return (
    <div className="max-w-3xl">
      <PageHead title="Usuarios y accesos" subtitle="Invita a integrantes del establecimiento. Cada persona activa su cuenta con un enlace, define su contraseña y (opcional) su verificación en dos pasos." right={<Toolbar onPrint={printView} />} />

      <Section icon={UserPlus} title="Invitar a un nuevo usuario">
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" className="rounded-md p-2.5 text-sm" style={inp} />
          <input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="RUT (12.345.678-9)" className="rounded-md p-2.5 text-sm" style={inp} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-md p-2.5 text-sm" style={inp}>
            {Object.entries(ROLES).filter(([k]) => k !== "superadmin").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo (opcional)" className="rounded-md p-2.5 text-sm" style={inp} />
        </div>
        {error && <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-xs rounded-lg px-3 py-2 mt-3 flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}
        <div className="mt-3"><Btn onClick={submit} disabled={saving}>{saving ? "Generando…" : <><UserPlus size={15} /> Generar invitación</>}</Btn></div>

        {invite && (
          <div style={{ background: "#E8F0FE", border: `1px solid ${C.sidebarActiveBorder}` }} className="rounded-lg p-3 mt-4">
            <div style={{ color: C.ink }} className="text-sm font-medium mb-1">Enlace de invitación para {invite.name}</div>
            {invite.emailSent ? (
              <div style={{ color: C.ok }} className="text-xs mb-2 flex items-center gap-1.5"><CheckCircle2 size={13} /> Correo enviado a <b>{invite.email}</b>. También puedes compartir el enlace directamente:</div>
            ) : (
              <div style={{ color: C.textSoft }} className="text-[11px] mb-2">
                {invite.mailerConfigured === false
                  ? "El envío automático de correos aún no está configurado. Copia el enlace y compártelo (correo, WhatsApp, etc.)."
                  : "Válido 7 días. Compártelo con la persona. Al abrirlo, definirá su contraseña."}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <input readOnly value={invite.url} className="rounded-md p-2 text-xs flex-1 min-w-[220px]" style={{ ...inp, ...mono }} onFocus={(e) => e.target.select()} />
              <Btn variant="ghost" onClick={() => copiar(invite.url)}><ExternalLink size={14} /> {copied ? "¡Copiado!" : "Copiar enlace"}</Btn>
            </div>
          </div>
        )}
      </Section>

      <Section icon={Upload} title="Carga masiva (varios usuarios a la vez)">
        <p style={{ color: C.textSoft }} className="text-sm mb-3">Sube un archivo <b>CSV</b> con columnas <code>nombre, rut, rol, correo</code>. Se crean todas las cuentas y se envía la invitación por correo a cada una automáticamente. Desde Excel: “Guardar como → CSV”.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={descargarPlantilla} className="mbtn-outline text-sm px-3.5 py-2 rounded-full inline-flex items-center gap-1.5" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}><Download size={14} /> Descargar plantilla</button>
          <label className="mbtn-outline text-sm px-3.5 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}>
            <Upload size={14} /> Elegir archivo CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onBulkFile(f); e.target.value = ""; }} />
          </label>
        </div>

        {bulkRows && bulkRows.length > 0 && (
          <div className="mt-4">
            <div style={{ color: C.ink }} className="text-sm font-medium mb-2">Vista previa ({bulkRows.length} fila{bulkRows.length !== 1 ? "s" : ""})</div>
            <div className="rounded-lg overflow-hidden text-xs" style={{ border: `1px solid ${C.cardBorder}` }}>
              {bulkRows.slice(0, 8).map((r, i) => {
                const bad = !r.name || !r.rut || !r.role;
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ borderTop: i ? `1px solid ${C.cardBorder}` : "none", background: bad ? "#FCE8E6" : C.cardBg }}>
                    <span className="flex-1 truncate" style={{ color: C.ink }}>{r.name || <i style={{ color: C.urgent }}>sin nombre</i>}</span>
                    <span style={{ color: C.textSoft }} className="w-28 shrink-0">{r.rut || "—"}</span>
                    <span style={{ color: r.role ? C.textSoft : C.urgent }} className="w-32 shrink-0">{r.role ? (ROLES[r.role]?.label || r.role) : "rol inválido"}</span>
                    <span style={{ color: C.textSoft }} className="w-40 shrink-0 truncate">{r.email || "—"}</span>
                  </div>
                );
              })}
              {bulkRows.length > 8 && <div className="px-3 py-2 text-center" style={{ color: C.textSoft, borderTop: `1px solid ${C.cardBorder}` }}>… y {bulkRows.length - 8} más</div>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Btn onClick={confirmarCarga} disabled={bulkLoading}>{bulkLoading ? "Procesando…" : <><UserPlus size={15} /> Crear e invitar a {bulkRows.length}</>}</Btn>
              <button onClick={() => setBulkRows(null)} className="text-sm px-3 py-2 rounded-md" style={{ color: C.textSoft }}>Cancelar</button>
            </div>
          </div>
        )}
        {bulkRows && bulkRows.length === 0 && <div style={{ color: C.urgent }} className="text-xs mt-3">El archivo no tiene filas válidas. Revisa las columnas nombre, rut, rol, correo.</div>}

        {bulkResult && (
          <div style={{ background: "#E6F4EA", border: `1px solid ${C.ok}` }} className="rounded-lg p-3 mt-4 text-xs">
            <div style={{ color: C.ok }} className="font-medium flex items-center gap-1.5 mb-1"><CheckCircle2 size={14} /> {bulkResult.created} de {bulkResult.total} cuentas creadas · {bulkResult.emailsSent} correos enviados</div>
            {bulkResult.results.filter((r) => !r.ok).length > 0 && (
              <div style={{ color: C.textSoft }} className="mt-1">
                <b>No creadas:</b>
                {bulkResult.results.filter((r) => !r.ok).slice(0, 10).map((r, i) => <div key={i}>· {r.name || r.rut || "—"}: {r.error}</div>)}
              </div>
            )}
          </div>
        )}
      </Section>

      <div style={{ color: C.ink }} className="text-sm font-medium mb-2 mt-2">Usuarios del establecimiento ({users.length})</div>
      {loading ? <div style={{ color: C.textSoft }} className="text-sm">Cargando…</div> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {users.filter((u) => u.role !== "superadmin").map((u) => {
            const r = ROLES[u.role] || { label: u.role };
            return (
              <div key={u.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 flex items-center gap-3">
                <div style={{ background: u.activated ? C.ok : C.warn }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"><UserCircle size={17} color="#fff" /></div>
                <div className="min-w-0 flex-1">
                  <div style={{ color: C.ink }} className="text-sm font-medium truncate">{u.name}</div>
                  <div style={{ color: C.textSoft }} className="text-xs">{r.label}{u.rut ? ` · ${u.rut}` : ""}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: u.activated ? C.ok : C.warn }}>
                    {u.activated ? (u.totpEnabled ? "Activa · 2FA on" : "Activa") : "Invitación pendiente"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditing({ id: u.id, name: u.name, email: u.email || "", role: u.role })} title="Editar usuario" style={{ color: C.primary }}><PenLine size={14} /></button>
                    <button onClick={() => borrar(u)} title="Eliminar usuario" style={{ color: C.textSoft }}><Trash2 size={14} /></button>
                  </div>
                  {!u.activated && <button onClick={() => reinvitar(u)} title="Regenerar enlace" style={{ color: C.primary }} className="text-[11px] underline">Reenviar</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.35)" }} onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center gap-2.5 mb-4"><PenLine size={17} style={{ color: C.primary }} /><div style={{ ...serif, color: C.ink }} className="text-base flex-1">Editar usuario</div><button onClick={() => setEditing(null)} style={{ color: C.textSoft }}><X size={16} /></button></div>
            <div className="flex flex-col gap-3">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nombre completo" className="rounded-md p-2.5 text-sm" style={inp} />
              <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="Correo" className="rounded-md p-2.5 text-sm" style={inp} />
              <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="rounded-md p-2.5 text-sm" style={inp}>
                {Object.entries(ROLES).filter(([k]) => k !== "superadmin").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="flex justify-end gap-2"><button onClick={() => setEditing(null)} className="text-sm px-4 py-2 rounded-md" style={{ color: C.textSoft }}>Cancelar</button><Btn onClick={guardarEdicion}>Guardar</Btn></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------- CONFIGURACIÓN ----------------------------- */
function ConfigPage({ users, setUsers, emailTemplates, setEmailTemplates, docs, setDocs, session }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("docente");
  const [tpls, setTpls] = useState(emailTemplates);
  const [savedTpl, setSavedTpl] = useState(false);

  return (
    <div className="max-w-2xl">
      <PageHead title="Configuración" subtitle="Usuarios y correos automáticos. Los documentos del establecimiento se cargan en el Motor normativo." />

      <Section icon={UserPlus} title="Usuarios y accesos">
        <p style={{ color: C.textSoft }} className="text-sm">Los usuarios se crean por <b>invitación</b>: se genera un enlace para que cada persona active su cuenta y defina su contraseña. Gestiónalos en la sección <b>“Usuarios y accesos”</b> del menú lateral.</p>
      </Section>

      <Section icon={Mail} title="Personalizar correos automáticos">
        <p style={{ color: C.textSoft }} className="text-xs mb-3">Campos dinámicos: {"{ID}"}, {"{ETAPA}"}, {"{ESTUDIANTE}"}.</p>
        <div className="flex flex-col gap-4">
          {Object.entries(tpls).map(([k, t]) => (
            <div key={k}>
              <div style={{ color: C.ink }} className="text-sm font-medium mb-1.5">{t.label}</div>
              <input value={t.subject} onChange={(e) => setTpls({ ...tpls, [k]: { ...t, subject: e.target.value } })} className="w-full rounded-md p-2 text-sm mb-2" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
              <textarea value={t.body} onChange={(e) => setTpls({ ...tpls, [k]: { ...t, body: e.target.value } })} rows={4} className="w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3"><Btn onClick={() => { setEmailTemplates(tpls); setSavedTpl(true); setTimeout(() => setSavedTpl(false), 2000); }}><CheckCircle2 size={15} /> Guardar plantillas</Btn>{savedTpl && <span style={{ color: C.ok }} className="text-sm">Guardado</span>}</div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-6 mb-4">
      <div style={{ color: C.ink }} className="text-sm font-medium mb-3 flex items-center gap-2"><Icon size={16} /> {title}</div>
      {children}
    </div>
  );
}

/* =================================================================
   SÚPER ADMINISTRADOR
   ================================================================= */
const ADMIN_NAV = {
  dashboard: { label: "Panel global", icon: LayoutGrid },
  facturacion: { label: "Facturación y pagos", icon: Wallet },
  establecimientos: { label: "Establecimientos", icon: Building2 },
  instituciones: { label: "Instituciones", icon: Network },
  difusion: { label: "Difusión", icon: Megaphone },
  metricas: { label: "Métricas por institución", icon: BarChart3 },
  ranking: { label: "Ranking de cumplimiento", icon: Trophy },
  sistema: { label: "Respaldo y estado", icon: Shield },
  configuracion: { label: "Configuración", icon: Settings },
};

function AdminApp(props) {
  const { session, setSession } = props;
  const [view, setView] = useState("dashboard");
  const [sec2fa, setSec2fa] = useState(false);
  return (
    <div style={{ background: C.appBg, minHeight: "100vh" }} className="flex">
      {sec2fa && <Security2FA session={session} setSession={setSession} onClose={() => setSec2fa(false)} />}
      <aside style={{ background: C.adminSoft, borderRight: `1px solid ${C.cardBorder}` }} className="w-72 shrink-0 flex flex-col h-screen sticky top-0 print:hidden">
        <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
          <div style={{ background: C.admin }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"><Building size={17} color="#fff" /></div>
          <div><div style={{ ...serif, color: C.admin }} className="text-base leading-tight">Súper Administrador</div><div style={{ ...mono, color: C.textSoft }} className="text-[10px] tracking-widest uppercase">Panel central</div></div>
        </div>
        <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
          {Object.keys(ADMIN_NAV).map((key) => {
            const item = ADMIN_NAV[key]; const Icon = item.icon; const active = view === key;
            return <button key={key} onClick={() => setView(key)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition text-left"
              style={{ background: active ? "#fff" : "transparent", border: `1px solid ${active ? C.admin : "transparent"}`, color: active ? C.admin : C.text, fontWeight: active ? 600 : 500 }}><Icon size={16} /> {item.label}</button>;
          })}
        </nav>
        <div className="px-3 pb-3 pt-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
          <div className="px-2 pt-3 pb-2"><div style={{ color: C.textSoft }} className="text-[11px] uppercase tracking-widest">Sesión</div><div style={{ color: C.admin }} className="text-sm font-medium">{session.name}</div></div>
          <button onClick={() => setSec2fa(true)} className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm hover:bg-white/60 transition" style={{ color: session.totpEnabled ? C.ok : C.text }}><Shield size={16} /> Seguridad (2FA){session.totpEnabled ? " ✓" : ""}</button>
          <button onClick={props.logout} className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm hover:bg-white/60 transition" style={{ color: C.text }}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </aside>
      <main className="flex-1 p-6 sm:p-10 min-w-0">
        {view === "dashboard" && <AdminDashboard {...props} />}
        {view === "facturacion" && <AdminBilling {...props} />}
        {view === "establecimientos" && <AdminEstablishments {...props} />}
        {view === "instituciones" && <AdminInstitutions {...props} />}
        {view === "difusion" && <AdminBroadcast {...props} />}
        {view === "metricas" && <AdminMetrics {...props} />}
        {view === "ranking" && <AdminRanking {...props} />}
        {view === "sistema" && <AdminSystem />}
        {view === "configuracion" && <AdminConfig {...props} />}
      </main>
    </div>
  );
}

function AdminDashboard({ establishments, notifications, cases }) {
  const totals = establishments.reduce((a, e) => ({ activos: a.activos + e.activos, vencidos: a.vencidos + e.vencidos }), { activos: 0, vencidos: 0 });
  const cumpl = Math.round(establishments.reduce((a, e) => a + e.cumplimiento, 0) / establishments.length);
  const maxAct = Math.max(...establishments.map((e) => e.activos), 1);
  const byLevel = Object.entries(LEVELS).filter(([k]) => k !== "todos").map(([k, v]) => ({ k, label: v, n: establishments.filter((e) => e.type === k).length })).filter((x) => x.n > 0);
  const maxLevel = Math.max(...byLevel.map((x) => x.n), 1);
  const ranked = [...establishments].sort((a, b) => b.cumplimiento - a.cumplimiento).slice(0, 3);
  const difusiones = (notifications || []).filter((n) => n.from === "Súper Administrador").slice(0, 3);

  return (
    <div>
      <PageHead title="Panel global" subtitle="Dashboard consolidado de todas las instituciones." right={<Toolbar onPrint={printView} onExport={() => exportJSON(establishments, "panel-global.json")} />} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Establecimientos" value={establishments.length} color={C.admin} />
        <StatCard label="Casos activos (total)" value={totals.activos} color={C.ink} />
        <StatCard label="Plazos vencidos (total)" value={totals.vencidos} color={C.urgent} />
        <StatCard label="Cumplimiento promedio" value={`${cumpl}%`} color={C.ok} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Casos activos por establecimiento</div>
          <div className="flex flex-col gap-2.5">
            {establishments.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <div style={{ color: C.textSoft }} className="text-xs w-36 shrink-0 truncate">{e.name}</div>
                <div className="flex-1 h-4 rounded" style={{ background: C.appBg }}><div style={{ width: `${(e.activos / maxAct) * 100}%`, background: C.admin }} className="h-4 rounded" /></div>
                <div style={{ color: C.ink }} className="text-xs w-5 text-right">{e.activos}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Cumplimiento por establecimiento</div>
          <div className="flex flex-col gap-2.5">
            {establishments.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <div style={{ color: C.textSoft }} className="text-xs w-36 shrink-0 truncate">{e.name}</div>
                <div className="flex-1 h-4 rounded" style={{ background: C.appBg }}><div style={{ width: `${e.cumplimiento}%`, background: e.cumplimiento >= 85 ? C.ok : e.cumplimiento >= 70 ? C.warn : C.urgent }} className="h-4 rounded" /></div>
                <div style={{ color: C.ink }} className="text-xs w-9 text-right">{e.cumplimiento}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Establecimientos por nivel</div>
          <div className="flex flex-col gap-2.5">
            {byLevel.map((x) => (
              <div key={x.k} className="flex items-center gap-3">
                <div style={{ color: C.textSoft }} className="text-xs w-32 shrink-0 truncate">{x.label}</div>
                <div className="flex-1 h-3.5 rounded" style={{ background: C.appBg }}><div style={{ width: `${(x.n / maxLevel) * 100}%`, background: C.seal }} className="h-3.5 rounded" /></div>
                <div style={{ color: C.ink }} className="text-xs w-4 text-right">{x.n}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3 flex items-center gap-1.5"><Trophy size={15} style={{ color: C.seal }} /> Top cumplimiento</div>
          <div className="flex flex-col gap-2">
            {ranked.map((e, i) => (
              <div key={e.id} className="flex items-center gap-2.5">
                <span style={{ background: i === 0 ? C.seal : C.appBg, color: i === 0 ? "#fff" : C.text }} className="inline-flex w-5 h-5 rounded-full items-center justify-center text-[11px] font-semibold shrink-0">{i + 1}</span>
                <span style={{ color: C.ink }} className="text-xs flex-1 truncate">{e.name}</span>
                <span style={{ color: C.ok }} className="text-xs font-medium">{e.cumplimiento}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3 flex items-center gap-1.5"><Megaphone size={15} style={{ color: C.seal }} /> Últimas difusiones</div>
          <div className="flex flex-col gap-2">
            {difusiones.length === 0 && <div style={{ color: C.textSoft }} className="text-xs">Aún no se han enviado difusiones.</div>}
            {difusiones.map((n) => (
              <div key={n.id}>
                <div style={{ color: C.ink }} className="text-xs font-medium">{n.title}</div>
                <div style={{ color: C.textSoft }} className="text-[11px]">{n.at}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminBilling({ establishments, setEstablishments }) {
  const [ufValue, setUfValue] = useState(UF_VALUE_CLP);
  const rows = establishments.map((e) => ({ e, b: billing(e) }));
  const totalUF = rows.reduce((a, r) => a + r.b.total, 0);
  const paidUF = rows.reduce((a, r) => a + r.b.paid, 0);
  const owedUF = rows.reduce((a, r) => a + r.b.owed, 0);
  const students = establishments.reduce((a, e) => a + (e.students || 0), 0);
  const maxTotal = Math.max(...rows.map((r) => r.b.total), 0.001);
  const maxRev = Math.max(...MONTHLY_REVENUE_UF.map((m) => m.uf), 1);

  const statusColor = { pagado: C.ok, adeudado: C.urgent, parcial: C.warn, "sin tarifa": C.textSoft };
  function persist(id, patch) { if (String(id).length > 12) api.updateEstablishment(id, patch).catch((e) => console.error("establishment", e)); }
  function registrarPago(id) { const e = establishments.find((x) => x.id === id); const paidUF = (e?.students || 0) * (e?.ufPerStudent || 0); setEstablishments(establishments.map((x) => (x.id === id ? { ...x, paidUF } : x))); persist(id, { paidUF }); }
  function marcarImpago(id) { setEstablishments(establishments.map((x) => (x.id === id ? { ...x, paidUF: 0 } : x))); persist(id, { paidUF: 0 }); }
  function setField(id, field, value) { setEstablishments(establishments.map((x) => (x.id === id ? { ...x, [field]: value } : x))); persist(id, { [field]: value }); }
  const cellInput = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };

  return (
    <div>
      <PageHead title="Facturación y pagos" subtitle="Cobro a las instituciones por estudiante, en UF. Estado de lo facturado, pagado y adeudado."
        right={<Toolbar onPrint={printView} onExport={() => exportCSV(rows.map((r) => ({ Establecimiento: r.e.name, Estudiantes: r.e.students, UF_por_estudiante: r.e.ufPerStudent, Total_UF: r.b.total.toFixed(2), Pagado_UF: r.b.paid.toFixed(2), Adeudado_UF: r.b.owed.toFixed(2), Estado: r.b.status })), "facturacion.csv")} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-4">
          <div style={{ color: C.admin }} className="text-2xl font-semibold">{fmtUF(totalUF)}</div>
          <div style={{ color: C.textSoft }} className="text-xs mt-1">Facturado del mes · {fmtCLP(totalUF * ufValue)}</div>
        </div>
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-4">
          <div style={{ color: C.ok }} className="text-2xl font-semibold">{fmtUF(paidUF)}</div>
          <div style={{ color: C.textSoft }} className="text-xs mt-1">Pagado · {fmtCLP(paidUF * ufValue)}</div>
        </div>
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-4">
          <div style={{ color: C.urgent }} className="text-2xl font-semibold">{fmtUF(owedUF)}</div>
          <div style={{ color: C.textSoft }} className="text-xs mt-1">Adeudado · {fmtCLP(owedUF * ufValue)}</div>
        </div>
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-4">
          <div style={{ color: C.ink }} className="text-2xl font-semibold">{students.toLocaleString("es-CL")}</div>
          <div style={{ color: C.textSoft }} className="text-xs mt-1">Estudiantes facturados</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap print:hidden">
        <span style={{ color: C.textSoft }} className="text-xs">Valor UF referencial:</span>
        <input type="number" value={ufValue} onChange={(e) => setUfValue(Number(e.target.value) || 0)} className="rounded-md p-1.5 text-sm w-28" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
        <span style={{ color: C.textSoft }} className="text-xs">CLP</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-3 flex items-center gap-1.5"><TrendingUp size={15} style={{ color: C.seal }} /> Ingresos por mes (UF)</div>
          <div className="flex items-end gap-3 h-40">
            {MONTHLY_REVENUE_UF.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <div style={{ color: C.ink }} className="text-[10px]">{m.uf}</div>
                <div style={{ height: `${(m.uf / maxRev) * 100}%`, background: C.admin }} className="w-full rounded-t" />
                <div style={{ color: C.textSoft }} className="text-[11px]">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5">
          <div style={{ color: C.ink }} className="text-sm font-medium mb-1 flex items-center gap-1.5"><Coins size={15} style={{ color: C.seal }} /> Pagado vs adeudado por institución</div>
          <div className="flex items-center gap-3 mb-3 text-[11px]" style={{ color: C.textSoft }}>
            <span className="flex items-center gap-1"><span style={{ background: C.ok }} className="w-2.5 h-2.5 rounded-sm inline-block" /> Pagado</span>
            <span className="flex items-center gap-1"><span style={{ background: C.urgent }} className="w-2.5 h-2.5 rounded-sm inline-block" /> Adeudado</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {rows.map((r) => (
              <div key={r.e.id}>
                <div className="flex justify-between text-[11px] mb-0.5"><span style={{ color: C.text }}>{r.e.name}</span><span style={{ color: C.textSoft }}>{fmtUF(r.b.total)}</span></div>
                <div className="flex h-3.5 rounded overflow-hidden" style={{ background: C.appBg, width: `${(r.b.total / maxTotal) * 100}%`, minWidth: "8%" }}>
                  <div style={{ width: `${r.b.total ? (r.b.paid / r.b.total) * 100 : 0}%`, background: C.ok }} />
                  <div style={{ width: `${r.b.total ? (r.b.owed / r.b.total) * 100 : 0}%`, background: C.urgent }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: C.paper, color: C.textSoft }} className="text-xs uppercase">
            <th className="text-left p-3">Establecimiento</th><th className="text-right p-3">Estud.</th><th className="text-right p-3">UF/est.</th>
            <th className="text-right p-3">Total</th><th className="text-right p-3">Pagado</th><th className="text-right p-3">Adeudado</th>
            <th className="text-left p-3">Estado</th><th className="text-right p-3 print:hidden">Acción</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.e.id} style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <td style={{ color: C.ink }} className="p-3">{r.e.name}<div style={{ color: C.textSoft }} className="text-xs">{r.e.comuna}</div></td>
                <td className="p-3 text-right">
                  <input type="number" min="0" value={r.e.students || 0} onChange={(ev) => setField(r.e.id, "students", Number(ev.target.value) || 0)} className="w-20 rounded-md p-1 text-sm text-right" style={cellInput} />
                </td>
                <td className="p-3 text-right">
                  <input type="number" min="0" step="0.01" value={r.e.ufPerStudent} onChange={(ev) => setField(r.e.id, "ufPerStudent", Number(ev.target.value) || 0)} className="w-16 rounded-md p-1 text-sm text-right" style={cellInput} />
                </td>
                <td style={{ color: C.ink }} className="p-3 text-right font-medium">{r.b.total.toFixed(2)}</td>
                <td style={{ color: C.ok }} className="p-3 text-right">{r.b.paid.toFixed(2)}</td>
                <td style={{ color: r.b.owed > 0 ? C.urgent : C.textSoft }} className="p-3 text-right">{r.b.owed.toFixed(2)}</td>
                <td className="p-3"><span style={{ background: C.appBg, color: statusColor[r.b.status] }} className="text-xs font-medium px-2 py-1 rounded-full capitalize">{r.b.status}</span></td>
                <td className="p-3 text-right print:hidden">
                  {r.b.status === "pagado"
                    ? <button onClick={() => marcarImpago(r.e.id)} style={{ color: C.textSoft }} className="text-xs">Revertir</button>
                    : <button onClick={() => registrarPago(r.e.id)} style={{ background: C.ok, color: "#fff" }} className="mbtn text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1"><CheckCircle size={12} /> Registrar pago</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminEstablishments({ establishments }) {
  return (
    <div>
      <PageHead title="Establecimientos" subtitle="Instituciones registradas en la plataforma." right={<Toolbar onPrint={printView} onExport={() => exportJSON(establishments, "establecimientos.json")} />} />
      <div className="flex flex-col gap-2">
        {establishments.map((e) => (
          <div key={e.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
            <div><div style={{ color: C.ink }} className="text-sm font-medium">{e.name}</div><div style={{ color: C.textSoft }} className="text-xs">{e.rbd ? `RBD ${e.rbd} · ` : ""}{e.comuna ? `${e.comuna} · ` : ""}{LEVELS[e.type]}{e.sostenedor ? ` · ${e.sostenedor}` : ""}</div></div>
            <div className="flex items-center gap-4 text-xs">
              <span style={{ color: C.textSoft }}>Activos: <b style={{ color: C.ink }}>{e.activos}</b></span>
              <span style={{ color: C.textSoft }}>Vencidos: <b style={{ color: C.urgent }}>{e.vencidos}</b></span>
              <span style={{ color: C.textSoft }}>Cumpl.: <b style={{ color: C.ok }}>{e.cumplimiento}%</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminInstitutions({ institutions, setInstitutions }) {
  const [nueva, setNueva] = useState({ label: "", type: "protección", email: "" });
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const setLocal = (id, patch) => setInstitutions(institutions.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  async function agregar() {
    if (!nueva.label.trim()) return;
    try { const it = await api.createInstitution(nueva); setInstitutions([...institutions, it]); setNueva({ label: "", type: "protección", email: "" }); }
    catch (e) { alert((e && (e.error || e.message)) || "No se pudo agregar."); }
  }
  async function borrar(id) {
    if (!window.confirm("¿Eliminar esta institución del directorio?")) return;
    try { await api.deleteInstitution(id); setInstitutions(institutions.filter((x) => x.id !== id)); }
    catch (e) { alert((e && (e.error || e.message)) || "No se pudo eliminar."); }
  }
  const guardarEmail = (id, email) => api.updateInstitution(id, { email }).catch((e) => console.error("inst", e));

  return (
    <div className="max-w-2xl">
      <PageHead title="Instituciones de derivación" subtitle="Directorio global. Los correos se usan como sugerencia al derivar. Se guardan en la base de datos." right={<Toolbar onPrint={printView} onExport={() => exportJSON(institutions, "instituciones.json")} />} />

      <Section icon={Network} title="Agregar institución">
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={nueva.label} onChange={(e) => setNueva({ ...nueva, label: e.target.value })} placeholder="Nombre de la institución" className="rounded-md p-2.5 text-sm" style={inp} />
          <select value={nueva.type} onChange={(e) => setNueva({ ...nueva, type: e.target.value })} className="rounded-md p-2.5 text-sm" style={inp}>
            {Object.keys(INST_TYPE_COLORS).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={nueva.email} onChange={(e) => setNueva({ ...nueva, email: e.target.value })} placeholder="correo@institucion.cl (opcional)" className="rounded-md p-2.5 text-sm sm:col-span-2" style={inp} />
        </div>
        <div className="mt-3"><Btn accent={C.admin} onClick={agregar}><Plus size={15} /> Agregar</Btn></div>
      </Section>

      <div className="flex flex-col gap-2">
        {institutions.map((i) => (
          <div key={i.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 flex items-center gap-3 flex-wrap">
            <span style={{ background: (INST_TYPE_COLORS[i.type] || "#5F6368") }} className="w-2.5 h-2.5 rounded-full shrink-0" />
            <div className="flex-1 min-w-[160px]"><div style={{ color: C.ink }} className="text-sm font-medium">{i.label}</div><div style={{ color: C.textSoft }} className="text-xs">{i.type}</div></div>
            <input value={i.email || ""} onChange={(e) => setLocal(i.id, { email: e.target.value })} onBlur={(e) => guardarEmail(i.id, e.target.value)} placeholder="correo@institucion.cl" className="rounded-md p-2 text-sm min-w-[200px]" style={inp} />
            <button onClick={() => borrar(i.id)} title="Eliminar" style={{ color: C.textSoft }}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminBroadcast({ establishments, notifications, setNotifications }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("todos");
  const [sent, setSent] = useState(false);
  function send() {
    if (!title.trim()) return;
    const at = new Date().toISOString().slice(0, 10);
    const data = { from: "Súper Administrador", fromRole: "Administración Central", to: "todos", subject: title, body, at, read: false };
    // Persiste como comunicación: global (todos) o dirigida a un establecimiento.
    api.addOrgRecord("message", data, target === "todos" ? { global: true } : { establishmentId: target })
      .catch((e) => console.error("difusion", e));
    setTitle(""); setBody(""); setSent(true); setTimeout(() => setSent(false), 2500);
  }
  return (
    <div className="max-w-2xl">
      <PageHead title="Difusión" subtitle="Envía información a los establecimientos. Aparece en la campana del portal usuario." />
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-6 flex flex-col gap-3">
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
          <option value="todos">Todos los establecimientos</option>
          {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del mensaje" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Contenido…" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
        <div className="flex items-center gap-3"><Btn onClick={send} accent={C.admin}><Megaphone size={15} /> Enviar difusión</Btn>{sent && <span style={{ color: C.ok }} className="text-sm flex items-center gap-1"><CheckCircle2 size={15} /> Enviado</span>}</div>
      </div>
    </div>
  );
}

function AdminMetrics({ establishments }) {
  const max = Math.max(...establishments.map((e) => e.activos), 1);
  return (
    <div>
      <PageHead title="Métricas por institución" subtitle="Tablero comparativo. Cada métrica se puede revisar por establecimiento." right={<Toolbar onPrint={printView} onExport={() => exportJSON(establishments, "metricas.json")} />} />
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-xl p-5 mb-4">
        <div style={{ color: C.ink }} className="text-sm font-medium mb-3">Casos activos por establecimiento</div>
        <div className="flex flex-col gap-2.5">
          {establishments.map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <div style={{ color: C.textSoft }} className="text-xs w-40 shrink-0 truncate">{e.name}</div>
              <div className="flex-1 h-4 rounded" style={{ background: C.appBg }}><div style={{ width: `${(e.activos / max) * 100}%`, background: C.admin }} className="h-4 rounded" /></div>
              <div style={{ color: C.ink }} className="text-xs w-6 text-right">{e.activos}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {establishments.map((e) => (
          <div key={e.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4">
            <div style={{ color: C.ink }} className="text-sm font-medium mb-2">{e.name}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div style={{ color: C.ink }} className="text-lg font-semibold">{e.activos}</div><div style={{ color: C.textSoft }} className="text-[10px]">Activos</div></div>
              <div><div style={{ color: C.urgent }} className="text-lg font-semibold">{e.vencidos}</div><div style={{ color: C.textSoft }} className="text-[10px]">Vencidos</div></div>
              <div><div style={{ color: C.ok }} className="text-lg font-semibold">{e.cumplimiento}%</div><div style={{ color: C.textSoft }} className="text-[10px]">Cumpl.</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminRanking({ establishments }) {
  const ranked = [...establishments].sort((a, b) => b.cumplimiento - a.cumplimiento);
  return (
    <div>
      <PageHead title="Ranking de cumplimiento" subtitle="Establecimientos ordenados por cumplimiento normativo." right={<Toolbar onPrint={printView} onExport={() => exportCSV(ranked.map((e, i) => ({ Posicion: i + 1, Establecimiento: e.name, Comuna: e.comuna, Cumplimiento: e.cumplimiento, Activos: e.activos, Vencidos: e.vencidos })), "ranking.csv")} />} />
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ background: C.paper, color: C.textSoft }} className="text-xs uppercase">
            <th className="text-left p-3">#</th><th className="text-left p-3">Establecimiento</th><th className="text-left p-3">Cumplimiento</th><th className="text-left p-3">Vencidos</th></tr></thead>
          <tbody>
            {ranked.map((e, i) => (
              <tr key={e.id} style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <td className="p-3"><span style={{ background: i === 0 ? C.seal : C.appBg, color: i === 0 ? "#fff" : C.text }} className="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-semibold">{i + 1}</span></td>
                <td style={{ color: C.ink }} className="p-3">{e.name}<span style={{ color: C.textSoft }} className="text-xs"> · {e.comuna}</span></td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-28 h-2.5 rounded" style={{ background: C.appBg }}><div style={{ width: `${e.cumplimiento}%`, background: e.cumplimiento >= 85 ? C.ok : e.cumplimiento >= 70 ? C.warn : C.urgent }} className="h-2.5 rounded" /></div>
                    <span style={{ color: C.ink }} className="text-xs">{e.cumplimiento}%</span>
                  </div>
                </td>
                <td style={{ color: e.vencidos > 0 ? C.urgent : C.textSoft }} className="p-3 text-xs">{e.vencidos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSystem() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");
  const load = () => { setError(""); api.adminStatus().then(setStatus).catch((e) => setError((e && (e.error || e.message)) || "No se pudo cargar el estado.")); };
  useEffect(load, []);

  async function backup() {
    setDownloading(true); setError("");
    try { await api.downloadBackup(); } catch (e) { setError((e && (e.error || e.message)) || "No se pudo generar el respaldo."); }
    finally { setDownloading(false); }
  }

  async function sendBackupNow() {
    setSending(true); setError(""); setSentMsg("");
    try {
      const r = await api.runBackup();
      if (r.sent) setSentMsg(`Respaldo enviado por correo a ${(r.to || []).join(", ")} (${r.sizeKb || "?"} KB).`);
      else setSentMsg(r.reason === "not-configured" ? "El envío de correos no está configurado." : r.reason === "no-recipient" ? "No hay destinatario. Define la variable BACKUP_EMAIL en Railway." : "No se pudo enviar el respaldo.");
    } catch (e) { setError((e && (e.error || e.message)) || "No se pudo enviar el respaldo."); }
    finally { setSending(false); }
  }

  const dot = (ok) => <span style={{ background: ok ? C.ok : C.urgent }} className="w-2.5 h-2.5 rounded-full inline-block" />;

  return (
    <div className="max-w-2xl">
      <PageHead title="Respaldo y estado del sistema" subtitle="Monitoreo de la plataforma y respaldo de los datos (Ley 21.719)." right={<Btn variant="ghost" onClick={load}>Actualizar</Btn>} />

      {error && <div style={{ background: "#FCE8E6", color: C.urgent }} className="text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <Section icon={CheckCircle2} title="Estado del sistema">
        {!status ? <div style={{ color: C.textSoft }} className="text-sm">Cargando…</div> : (
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">{dot(status.db === "ok")} Base de datos: <b>{status.db === "ok" ? "operativa" : "con problemas"}</b></div>
            <div className="flex items-center gap-2">{dot(status.security?.encryption)} Cifrado en reposo: <b>{status.security?.encryption ? "activo" : "inactivo"}</b></div>
            <div className="flex items-center gap-2">{dot(status.security?.email)} Envío de correos: <b>{status.security?.email ? "activo" : "inactivo"}</b></div>
            <div className="flex items-center gap-2" style={{ color: C.textSoft }}>Tiempo activo: {Math.floor((status.uptimeSeconds || 0) / 3600)}h {Math.floor(((status.uptimeSeconds || 0) % 3600) / 60)}m</div>
          </div>
        )}
        {status?.counts && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <StatCard label="Establecimientos" value={status.counts.establishments} color={C.primary} />
            <StatCard label="Usuarios" value={status.counts.users} color={C.ink} />
            <StatCard label="Estudiantes" value={status.counts.students} color={C.ink} />
            <StatCard label="Casos" value={status.counts.cases} color={C.ink} />
          </div>
        )}
      </Section>

      <Section icon={Download} title="Respaldo de datos">
        <p style={{ color: C.textSoft }} className="text-sm mb-3">Descarga una copia completa de todos los datos en formato JSON. No incluye contraseñas ni secretos de 2FA; el relato de los casos va cifrado.</p>
        <div className="flex gap-2 flex-wrap">
          <Btn onClick={backup} disabled={downloading}><Download size={15} /> {downloading ? "Generando…" : "Descargar respaldo (JSON)"}</Btn>
          <Btn variant="ghost" onClick={sendBackupNow} disabled={sending}><Mail size={15} /> {sending ? "Enviando…" : "Enviar respaldo por correo ahora"}</Btn>
        </div>
        {sentMsg && <div style={{ color: sentMsg.startsWith("Respaldo enviado") ? C.ok : C.urgent }} className="text-xs mt-2">{sentMsg}</div>}
        <div style={{ background: C.ok + "18", color: C.ok }} className="rounded-lg p-3 text-xs mt-4 leading-relaxed">
          <b>Respaldo diario automático activo:</b> cada día a las 07:00 UTC (≈03:00 en Chile) se envía este respaldo por correo al administrador. El destinatario se define con la variable <code>BACKUP_EMAIL</code> en Railway.
        </div>
        <div style={{ background: C.adminSoft, color: C.admin }} className="rounded-lg p-3 text-xs mt-3 leading-relaxed">
          <b>Recomendación adicional:</b> activa también los <b>respaldos nativos</b> de la base de datos en el panel de Railway (servicio Postgres → Backups) y un monitor de disponibilidad gratuito (ej. UptimeRobot) apuntando a <code>/health</code>.
        </div>
      </Section>
    </div>
  );
}

function AdminConfig({ establishments, setEstablishments }) {
  const [name, setName] = useState("");
  const [rbd, setRbd] = useState("");
  const [comuna, setComuna] = useState("");
  const [type, setType] = useState("basica");
  const inpS = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  return (
    <div className="max-w-2xl">
      <PageHead title="Configuración" subtitle="Alta de establecimientos en la plataforma." />
      <Section icon={Building2} title="Registrar establecimiento">
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del establecimiento" className="rounded-md p-2.5 text-sm" style={inpS} />
          <div className="grid grid-cols-2 gap-3">
            <input value={rbd} onChange={(e) => setRbd(e.target.value)} placeholder="RBD * (ej: 10251-2)" className="rounded-md p-2.5 text-sm" style={inpS} />
            <input value={comuna} onChange={(e) => setComuna(e.target.value)} placeholder="Comuna" className="rounded-md p-2.5 text-sm" style={inpS} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md p-2.5 text-sm" style={inpS}>
            {Object.entries(LEVELS).filter(([k]) => k !== "todos").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <p style={{ color: C.textSoft }} className="text-[11px]">El RBD (Rol Base de Datos del MINEDUC) es obligatorio y único: identifica oficialmente a cada establecimiento y evita duplicados.</p>
          <div><Btn accent={C.admin} onClick={async () => {
            if (!name.trim()) return;
            if (!rbd.trim()) { alert("El RBD es obligatorio."); return; }
            try {
              const e = await api.createEstablishment({ name, rbd, comuna, type });
              setEstablishments([...establishments, { ...e, activos: 0, vencidos: 0, cumplimiento: e.cumplimiento ?? 100 }]);
              setName(""); setRbd(""); setComuna("");
            } catch (err) { alert((err && (err.error || err.message)) || "No se pudo registrar."); }
          }}><Plus size={15} /> Registrar</Btn></div>
        </div>
      </Section>
    </div>
  );
}
