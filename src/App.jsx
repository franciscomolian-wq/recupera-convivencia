import React, { useState, useRef } from "react";
import {
  Shield, Users, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Building2, UserCircle, Scale, Plus, X, Mail,
  LayoutGrid, Network, ClipboardCheck, Settings, FolderOpen, Bell,
  Printer, Download, Upload, LogOut, Sparkles, Paperclip,
  Send, BarChart3, Megaphone, Building, UserPlus, FileText, Trophy,
  Wallet, Coins, TrendingUp, CheckCircle, ClipboardList, Lock, CalendarClock,
  MessageSquare, Calendar, Gavel, Trash2, Puzzle, Share2,
  Inbox, Archive, PenLine, ExternalLink, Target, Menu, Camera,
} from "lucide-react";
import {
  NORMATIVA_LIBRARY, LEVELS, INSTITUTIONS, CASE_TYPES, ROLES,
  ESTABLISHMENTS, USERS, INITIAL_NOTIFICATIONS, EVIDENCE_TYPES,
  DEFAULT_EMAIL_TEMPLATES, INTERVIEW_TEMPLATES, DEFAULT_ESTABLISHMENT_DOCS,
  UF_VALUE_CLP, MONTHLY_REVENUE_UF, STUDENTS, MEASURE_TYPES,
  ANOTACION_TYPES, EVENT_TYPES, INITIAL_MESSAGES, INITIAL_EVENTS,
  GESTION_TYPES, GESTION_ESTADOS, INITIAL_GESTIONES,
  DOC_CATEGORIES, INITIAL_DOCUMENTS, PME_DIMENSIONS, INITIAL_ACCIONES,
} from "./data.js";
import {
  fmt, daysLeft, urgencyColor, buildCase, analyzeSituation,
  exportJSON, importJSON, printView, stepHint, fillTemplate, exportCSV,
  fmtUF, fmtCLP, billing, exportExcel,
} from "./engine.js";

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

/* --------------------------- SEED --------------------------------- */
const initialCases = [
  buildCase("RC-2026-014", "bullying", "Estudiante 7°B (iniciales J.M.)", 40, 4, "apoderado.jm@correo.cl", { studentId: "s1", curso: "7°B" }),
  buildCase("RC-2026-021", "agresionGrave", "Estudiante 2°M (iniciales F.T.)", 12, 2, "apoderado.ft@correo.cl", { studentId: "s2", curso: "2°M" }),
  buildCase("RC-2026-009", "discriminacion", "Estudiante 4°B (iniciales C.R.)", 58, 5, "apoderado.cr@correo.cl", { studentId: "s3", curso: "4°B" }),
];

/* =================================================================
   RAÍZ — login + enrutado por rol
   ================================================================= */
export default function App() {
  const [session, setSession] = useState(null);
  const [cases, setCases] = useState(initialCases);
  const [users, setUsers] = useState(USERS);
  const [institutions, setInstitutions] = useState(INSTITUTIONS);
  const [establishments, setEstablishments] = useState(ESTABLISHMENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [emailTemplates, setEmailTemplates] = useState(DEFAULT_EMAIL_TEMPLATES);
  const [docs, setDocs] = useState(DEFAULT_ESTABLISHMENT_DOCS);
  const [students, setStudents] = useState(STUDENTS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [gestiones, setGestiones] = useState(INITIAL_GESTIONES);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [acciones, setAcciones] = useState(INITIAL_ACCIONES);

  if (!session) return <Login users={users} onLogin={setSession} />;

  const shared = {
    session, setSession, cases, setCases, users, setUsers,
    institutions, setInstitutions, establishments, setEstablishments,
    notifications, setNotifications, emailTemplates, setEmailTemplates, docs, setDocs,
    students, setStudents, messages, setMessages, events, setEvents, gestiones, setGestiones,
    documents, setDocuments, acciones, setAcciones,
  };

  const role = ROLES[session.role];
  if (role.scope === "superadmin") return <AdminApp {...shared} />;
  return <PortalApp {...shared} />;
}

/* ---------------------------------------------------------------
   LOGIN
   ---------------------------------------------------------------- */
function Login({ users, onLogin }) {
  return (
    <div style={{ background: C.appBg }} className="min-h-screen flex items-center justify-center p-6">
      <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div style={{ background: C.primary }} className="w-10 h-10 rounded-full flex items-center justify-center">
            <Scale size={19} color="#fff" />
          </div>
          <div>
            <div style={{ ...serif, color: C.ink }} className="text-lg">Recupera Convivencia</div>
            <div style={{ ...mono, color: C.textSoft }} className="text-[10px] tracking-widest uppercase">Ingreso a la plataforma</div>
          </div>
        </div>
        <p style={{ color: C.textSoft }} className="text-sm mb-4">Selecciona un perfil para ingresar (demo):</p>
        <div className="flex flex-col gap-2">
          {users.map((u) => {
            const r = ROLES[u.role];
            return (
              <button key={u.id} onClick={() => onLogin(u)} style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg }}
                className="mbtn-outline flex items-center gap-3 p-3 rounded-xl text-left">
                <div style={{ background: r.scope === "superadmin" ? C.admin : C.ink }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {r.scope === "superadmin" ? <Building size={15} color="#fff" /> : <UserCircle size={15} color="#fff" />}
                </div>
                <div className="min-w-0">
                  <div style={{ color: C.ink }} className="text-sm font-medium">{u.name}</div>
                  <div style={{ color: C.textSoft }} className="text-xs">{r.label}</div>
                </div>
                <ChevronRight size={16} color={C.textSoft} className="ml-auto shrink-0" />
              </button>
            );
          })}
        </div>
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
function NotificationBell({ notifications, setNotifications }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="relative print:hidden">
      <button onClick={() => setOpen(!open)} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="w-9 h-9 rounded-lg flex items-center justify-center relative">
        <Bell size={17} color={C.ink} />
        {unread > 0 && <span style={{ background: C.urgent }} className="absolute -top-1 -right-1 text-[10px] text-white rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="absolute right-0 mt-2 w-80 rounded-xl shadow-xl z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
            <span style={{ color: C.ink }} className="text-sm font-medium">Notificaciones</span>
            <button onClick={() => setNotifications((p) => p.map((n) => ({ ...n, read: true })))} style={{ color: C.seal }} className="text-xs">Marcar leídas</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && <div style={{ color: C.textSoft }} className="p-4 text-sm">Sin notificaciones.</div>}
            {notifications.map((n) => (
              <div key={n.id} className="px-4 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}`, background: n.read ? "transparent" : C.paper }}>
                <div style={{ color: C.textSoft }} className="text-[10px] uppercase tracking-wide">{n.from} · {n.at}</div>
                <div style={{ color: C.ink }} className="text-sm font-medium mt-0.5">{n.title}</div>
                <div style={{ color: C.textSoft }} className="text-xs mt-0.5">{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =================================================================
   PORTAL USUARIO
   ================================================================= */
const PORTAL_NAV_BY_SCOPE = {
  admin: ["dashboard", "alertas", "casos", "expedientes", "inspectoria", "pie", "nuevo", "agenda", "comunicacion", "apoderados", "documental", "reportes", "planpme", "formatos", "normativa", "redes", "gestion", "auditoria", "perfiles", "configuracion"],
  audit: ["dashboard", "alertas", "casos", "expedientes", "inspectoria", "pie", "agenda", "apoderados", "documental", "reportes", "planpme", "gestion", "auditoria", "normativa"],
  limited: ["dashboard", "casos", "expedientes", "pie", "nuevo", "agenda", "comunicacion", "apoderados", "documental", "planpme", "formatos", "normativa"],
  family: ["dashboard", "micaso", "normativa"],
};
const PORTAL_NAV = {
  dashboard: { label: "Panel general", icon: LayoutGrid },
  alertas: { label: "Alertas inteligentes", icon: AlertTriangle },
  casos: { label: "Casos de convivencia", icon: FolderOpen },
  expedientes: { label: "Expedientes de estudiantes", icon: ClipboardList },
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
  redes: { label: "Redes de derivación", icon: Network },
  auditoria: { label: "Panel de auditoría", icon: ClipboardCheck },
  perfiles: { label: "Perfiles de la comunidad", icon: Users },
  configuracion: { label: "Configuración", icon: Settings },
  micaso: { label: "Mi caso", icon: FolderOpen },
};

/* Agrupación del menú por secciones, con color por sección (paleta Google) */
const NAV_GROUPS = [
  { label: "Principal", color: "#1A73E8", keys: ["dashboard", "alertas", "micaso"] },
  { label: "Casos y estudiantes", color: "#1E8E3E", keys: ["casos", "expedientes", "inspectoria", "pie", "nuevo"] },
  { label: "Comunicación y agenda", color: "#E8710A", keys: ["agenda", "comunicacion", "apoderados"] },
  { label: "Documentos y redes", color: "#D93025", keys: ["documental", "gestion", "redes", "formatos"] },
  { label: "Análisis y planificación", color: "#1A73E8", keys: ["reportes", "planpme"] },
  { label: "Referencia y cuenta", color: "#5F6368", keys: ["normativa", "auditoria", "perfiles", "configuracion"] },
];
function initials(name) { return (name || "").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }

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
  const navKeys = PORTAL_NAV_BY_SCOPE[role.scope];
  const { students, setStudents } = props;
  const [view, setView] = useState("dashboard");
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id);
  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const visibleCases = role.scope === "family" ? cases.filter((c) => c.id === "RC-2026-014") : cases;
  const [mobileOpen, setMobileOpen] = useState(false);
  function go(v) { setView(v); setMobileOpen(false); }
  function openCase(id) { setSelectedCaseId(id); setView("caso"); setMobileOpen(false); }
  function openStudent(id) { setSelectedStudentId(id); setView("expediente"); setMobileOpen(false); }

  return (
    <div style={{ background: C.appBg, minHeight: "100vh" }} className="flex">
      <Sidebar navKeys={navKeys} navMap={PORTAL_NAV} view={view} setView={go}
        openCase={openCase} session={session} role={role} onLogout={() => setSession(null)}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 shrink-0 sticky top-0 z-20 print:hidden" style={{ background: C.sidebarBg, borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: C.ink }} aria-label="Abrir menú"><Menu size={22} /></button>
          <div style={{ ...serif, color: C.ink }} className="text-base">Recupera Convivencia</div>
          <div className="ml-auto"><NotificationBell notifications={notifications} setNotifications={setNotifications} /></div>
        </div>
      <main className="flex-1 p-6 sm:p-10 min-w-0">
        <div className="hidden lg:flex justify-end mb-4"><NotificationBell notifications={notifications} setNotifications={setNotifications} /></div>
        {view === "dashboard" && <Dashboard role={role} cases={visibleCases} onOpenCase={openCase} onGo={setView} />}
        {view === "nuevo" && <CaseWizard students={students} setStudents={setStudents} onCreate={(c) => { setCases([c, ...cases]); setSelectedCaseId(c.id); setView("caso"); }} onCancel={() => setView("dashboard")} />}
        {view === "casos" && <CaseList cases={visibleCases} onOpen={openCase} role={role} />}
        {view === "expedientes" && <StudentsPage students={students} cases={cases} onOpen={openStudent} />}
        {view === "expediente" && selectedStudent && <StudentDetail student={selectedStudent} cases={cases} setStudents={setStudents} role={role} onOpenCase={openCase} onBack={() => setView("expedientes")} />}
        {view === "inspectoria" && <InspectoriaPage students={students} setStudents={setStudents} role={role} />}
        {view === "pie" && <PIEPage students={students} setStudents={setStudents} cases={cases} role={role} />}
        {view === "agenda" && <AgendaPage events={props.events} setEvents={props.setEvents} cases={cases} role={role} />}
        {view === "comunicacion" && <MessagesPage messages={props.messages} setMessages={props.setMessages} session={session} role={role} />}
        {view === "apoderados" && <ApoderadosPage students={students} setStudents={setStudents} role={role} />}
        {view === "documental" && <DocumentalPage documents={props.documents} setDocuments={props.setDocuments} cases={cases} role={role} />}
        {view === "gestion" && <GestionRedesPage gestiones={props.gestiones} setGestiones={props.setGestiones} institutions={props.institutions} cases={cases} role={role} />}
        {view === "alertas" && <AlertsPage cases={cases} students={students} gestiones={props.gestiones} onOpenCase={openCase} onOpenStudent={openStudent} onGo={setView} />}
        {view === "caso" && selectedCase && <CaseDetail c={selectedCase} role={role} setCases={setCases} templates={props.emailTemplates} institutions={props.institutions} student={students.find((s) => s.id === selectedCase.studentId)} onOpenStudent={openStudent} onBack={() => setView(role.scope === "family" ? "dashboard" : "casos")} />}
        {view === "reportes" && <ReportsPage cases={cases} setCases={setCases} students={students} />}
        {view === "planpme" && <PlanPMEPage docs={props.docs} setDocs={props.setDocs} acciones={props.acciones} setAcciones={props.setAcciones} role={role} />}
        {view === "formatos" && <FormatosPage />}
        {view === "normativa" && <NormativaPage docs={props.docs} />}
        {view === "redes" && <RedesPage institutions={props.institutions} />}
        {view === "auditoria" && <AuditPanel cases={cases} />}
        {view === "perfiles" && <PerfilesPage users={props.users} cases={cases} />}
        {view === "configuracion" && <ConfigPage {...props} />}
      </main>
      </div>
    </div>
  );
}

function Sidebar({ navKeys, navMap, view, setView, openCase, session, role, onLogout, mobileOpen, setMobileOpen }) {
  const activeFor = (key) =>
    view === key ||
    (key === "casos" && view === "caso") ||
    (key === "expedientes" && view === "expediente") ||
    (key === "micaso" && view === "caso");

  return (
    <aside style={{ background: C.sidebarBg, borderRight: `1px solid ${C.sidebarBorder}` }} className={`w-72 shrink-0 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-40 print:hidden transition-transform duration-200 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}>
      {/* Marca + barra de 4 colores de Google */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div style={{ background: C.primary, boxShadow: "0 2px 6px rgba(26,115,232,.35)" }} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"><Scale size={19} color="#fff" /></div>
          <div>
            <div style={{ ...serif, color: C.ink }} className="text-[17px] leading-tight">Recupera Convivencia</div>
            <div style={{ ...mono, color: C.sidebarTextSoft }} className="text-[9.5px] tracking-widest uppercase">Convivencia educativa</div>
          </div>
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
  return (
    <div>
      <PageHead title="Expedientes de estudiantes" subtitle="Cada estudiante tiene un expediente único que reúne sus casos e historial (entrevistas, citaciones, compromisos y medidas)." right={<Toolbar onPrint={printView} onExport={() => exportJSON(students, "expedientes.json")} />} />
      <div className="flex flex-col gap-2">
        {students.map((s) => {
          const scases = cases.filter((c) => c.studentId === s.id);
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
      </div>
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

function StudentDetail({ student: s, cases, setStudents, role, onOpenCase, onBack }) {
  const readOnly = role.scope === "audit" || role.scope === "family";
  const scases = cases.filter((c) => c.studentId === s.id);
  const [ent, setEnt] = useState({ fecha: "", con: "Apoderado/a", resumen: "", foto: null });
  const [cit, setCit] = useState({ fecha: "", motivo: "", estado: "Asiste", excusa: "" });
  const [com, setCom] = useState("");
  const [med, setMed] = useState({ tipo: "formativa", descripcion: "", fecha: "" });

  function update(fn) { setStudents((prev) => prev.map((x) => (x.id === s.id ? fn(x) : x))); }
  function add(kind, record) { update((x) => ({ ...x, [kind]: [...(x[kind] || []), { id: `${kind}${Date.now()}`, ...record }] })); }
  function toggleCompromiso(cid) { update((x) => ({ ...x, compromisos: x.compromisos.map((k) => (k.id === cid ? { ...k, cumplido: !k.cumplido } : k)) })); }

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

  function update(fn) { setStudents((prev) => prev.map((x) => (x.id === sid ? fn(x) : x))); }
  function add(kind, record) { update((x) => ({ ...x, [kind]: [...(x[kind] || []), { id: `${kind}${Date.now()}`, ...record }] })); }
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

  function add() { if (ev.title.trim() && ev.fecha) { setEvents([...events, { id: "ev" + Date.now(), ...ev }]); setEv({ tipo: "Entrevista", title: "", fecha: "", hora: "", notas: "", recordar: 1 }); } }

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
                {!readOnly && !e.derived && <button onClick={() => setEvents(events.filter((x) => x.id !== e.id))} style={{ color: C.textSoft }} className="print:hidden"><Trash2 size={14} /></button>}
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
    setMessages([{ id: "m" + Date.now(), from: session.name, fromRole: role.label, to, subject, body, at: new Date().toISOString().slice(0, 10), read: false }, ...messages]);
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

  function update(fn) { setStudents((prev) => prev.map((x) => (x.id === sid ? fn(x) : x))); }
  function add(kind, record) { update((x) => ({ ...x, [kind]: [...(x[kind] || []), { id: `${kind}${Date.now()}`, ...record }] })); }
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const scases = cases.filter((c) => c.studentId === sid);

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
        {s && !readOnly && <label className="flex items-center gap-2 text-sm mt-5" style={{ color: C.ink }}><input type="checkbox" checked={!!s.nee} onChange={() => update((x) => ({ ...x, nee: !x.nee }))} /> Tiene NEE</label>}
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

  function add() { if (g.detalle.trim()) { setGestiones([{ id: "g" + Date.now(), ...g }, ...gestiones]); setG({ tipo: "Oficio enviado", institucion: institutions[0]?.label || "", caso: "", fecha: "", detalle: "", estado: "Pendiente" }); } }

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
    const n = cases.filter((c) => c.studentId === s.id).length;
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
  const [sid, setSid] = useState(students[0]?.id);
  const s = students.find((x) => x.id === sid);
  const [cita, setCita] = useState({ fecha: "", hora: "", motivo: "" });
  const [acu, setAcu] = useState({ fecha: "", acuerdo: "" });
  const [doc, setDoc] = useState("");
  function update(fn) { setStudents((prev) => prev.map((x) => (x.id === sid ? fn(x) : x))); }
  function add(kind, record) { update((x) => ({ ...x, [kind]: [...(x[kind] || []), { id: `${kind}${Date.now()}`, ...record }] })); }
  function updItem(kind, id, patch) { update((x) => ({ ...x, [kind]: (x[kind] || []).map((it) => (it.id === id ? { ...it, ...patch } : it)) })); }
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  const citColor = { Pendiente: C.warn, Confirmada: C.ok, Reagendar: C.admin };
  const firmar = (kind, id) => updItem(kind, id, { firma: { por: s.apoderadoNombre, at: new Date().toISOString().slice(0, 10) } });
  const firmaTag = (f) => f ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"><PenLine size={11} /> Firmado por {f.por} · {f.at}</span> : null;

  return (
    <div className="max-w-3xl">
      <PageHead title="Comunicación con apoderados" subtitle="Citaciones con confirmación y reagendamiento, entrevistas y acuerdos con seguimiento, firma digital y documentos enviados. Todo queda en el historial del apoderado." right={<Toolbar onPrint={printView} onExport={() => exportJSON(students, "apoderados.json")} />} />
      <div className="mb-4 print:hidden">
        <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Estudiante</label>
        <select value={sid} onChange={(e) => setSid(e.target.value)} className="mt-1.5 w-full max-w-sm rounded-md p-2.5 text-sm" style={inp}>{students.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.curso}</option>)}</select>
      </div>
      {s && (
        <>
          <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 mb-4 flex items-center gap-3">
            <div style={{ background: C.primary }} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"><UserCircle size={20} color="#fff" /></div>
            <div><div style={{ color: C.ink }} className="text-sm font-medium">{s.apoderadoNombre || "Apoderado/a"}</div><div style={{ color: C.textSoft }} className="text-xs">{s.apoderadoEmail || "sin correo"} · apoderado/a de {s.name}</div></div>
          </div>

          <ExpBlock icon={CalendarClock} title={`Citaciones (${(s.citacionesApo || []).length})`}>
            <div className="flex flex-col gap-2 mb-3">
              {(s.citacionesApo || []).map((c) => (
                <div key={c.id} style={{ background: C.paper }} className="rounded-md p-3 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div><span style={{ color: C.ink }} className="font-medium">{c.motivo}</span> <span style={{ color: C.textSoft }}>· {c.fecha} {c.hora}{c.nuevaFecha ? ` → reagenda: ${c.nuevaFecha}` : ""}</span></div>
                    <span style={{ background: (citColor[c.estado] || C.textSoft) + "22", color: citColor[c.estado] || C.textSoft }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{c.estado}</span>
                  </div>
                  {c.firma && <div className="mt-1.5">{firmaTag(c.firma)}</div>}
                  {!readOnly && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap print:hidden">
                      <select value={c.estado} onChange={(e) => updItem("citacionesApo", c.id, { estado: e.target.value })} className="rounded-md p-1.5 text-xs" style={inp}><option>Pendiente</option><option>Confirmada</option><option>Reagendar</option></select>
                      {c.estado === "Reagendar" && <input type="date" value={c.nuevaFecha || ""} onChange={(e) => updItem("citacionesApo", c.id, { nuevaFecha: e.target.value })} className="rounded-md p-1.5 text-xs" style={inp} />}
                      {!c.firma && <button onClick={() => firmar("citacionesApo", c.id)} className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}><PenLine size={12} /> Firma digital</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <input type="date" value={cita.fecha} onChange={(e) => setCita({ ...cita, fecha: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input type="time" value={cita.hora} onChange={(e) => setCita({ ...cita, hora: e.target.value })} className="rounded-md p-2 text-sm" style={inp} />
                <input value={cita.motivo} onChange={(e) => setCita({ ...cita, motivo: e.target.value })} placeholder="Motivo de la citación" className="rounded-md p-2 text-sm flex-1 min-w-[160px]" style={inp} />
                <Btn onClick={() => { if (cita.motivo.trim()) { add("citacionesApo", { ...cita, estado: "Pendiente", nuevaFecha: "", firma: null }); setCita({ fecha: "", hora: "", motivo: "" }); } }}><Send size={14} /> Citar</Btn>
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
                    {a.firma ? firmaTag(a.firma) : (!readOnly && <button onClick={() => firmar("acuerdosApo", a.id)} className="text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1 print:hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}><PenLine size={12} /> Firma digital</button>)}
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

/* =================== MÓDULO 9 — GESTIÓN DOCUMENTAL =============== */
function DocumentalPage({ documents, setDocuments, cases, role }) {
  const readOnly = role.scope === "audit";
  const [d, setD] = useState({ nombre: "", categoria: "Informe", caso: "", fecha: "", url: "" });
  const [fcat, setFcat] = useState("");
  const [q, setQ] = useState("");
  const rows = documents.filter((x) => (!fcat || x.categoria === fcat) && (!q || x.nombre.toLowerCase().includes(q.toLowerCase())));
  const inp = { background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text };
  function add() { if (d.nombre.trim()) { setDocuments([{ id: "d" + Date.now(), ...d }, ...documents]); setD({ nombre: "", categoria: "Informe", caso: "", fecha: "", url: "" }); } }

  return (
    <div className="max-w-4xl">
      <PageHead title="Gestión documental" subtitle="Repositorio de informes, actas, protocolos, oficios, resoluciones, certificados, consentimientos y evidencias. Enlazable a Google Drive." right={<Toolbar onPrint={printView} onExport={() => exportJSON(documents, "documentos.json")} onImport={(data) => Array.isArray(data) && setDocuments(data)} />} />
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
                  {!readOnly && <button onClick={() => setDocuments(documents.filter((y) => y.id !== x.id))} style={{ color: C.textSoft }} className="ml-3"><Trash2 size={13} /></button>}
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
  function updAccion(id, patch) { setAcciones(acciones.map((x) => (x.id === id ? { ...x, ...patch } : x))); }
  function addAccion() { if (a.nombre.trim()) { setAcciones([{ id: "ac" + Date.now(), ...a }, ...acciones]); setA({ nombre: "", dimension: "Convivencia Escolar", objetivo: "", responsable: "", inicio: "", termino: "", avance: 0 }); } }
  const dimColor = (d) => (d === "Convivencia Escolar" ? C.ok : d === "Liderazgo Escolar" ? C.primary : d === "Gestión Pedagógica" ? C.warn : C.seal);
  const barColor = (v) => (v >= 100 ? C.ok : v >= 50 ? C.primary : C.warn);

  return (
    <div className="max-w-3xl">
      <PageHead title="Plan de convivencia y PME" subtitle="Documentos institucionales (RICE, Reglamento de Evaluación, PEI, PME) y seguimiento de las acciones del plan de convivencia y del Plan de Mejoramiento Educacional." right={<Toolbar onPrint={printView} onExport={() => exportJSON({ docs, acciones }, "plan-pme.json")} />} />

      <Section icon={FileText} title="Documentos institucionales">
        <p style={{ color: C.textSoft }} className="text-xs mb-3">Estos documentos son propios de cada establecimiento y alimentan el motor normativo. Cargá el archivo o enlazá su ubicación en Drive.</p>
        <div className="flex flex-col gap-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg flex-wrap" style={{ background: C.paper }}>
              <div className="min-w-[180px] flex-1">
                <div style={{ color: C.ink }} className="text-sm">{d.name}</div>
                <div style={{ color: d.status === "Cargado" ? C.ok : C.warn }} className="text-[11px]">{d.status} · {d.updated}</div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <input value={d.url || ""} onChange={(e) => setDocField(d.id, { url: e.target.value })} placeholder="Enlace a Drive" className="rounded-md p-1.5 text-xs w-40" style={inp} />
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ color: C.primary }} className="text-xs inline-flex items-center gap-1"><ExternalLink size={12} /> Abrir</a>}
                {!readOnly && (
                  <label className="text-xs px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5 mbtn-outline" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.primary }}>
                    <Upload size={13} /> Cargar
                    <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setDocField(d.id, { status: "Cargado", updated: new Date().toISOString().slice(0, 7) }); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

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
                  <button onClick={() => setAcciones(acciones.filter((y) => y.id !== x.id))} style={{ color: C.textSoft }}><Trash2 size={14} /></button>
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
function CaseWizard({ students, setStudents, onCreate, onCancel }) {
  const [mode, setMode] = useState("predef");
  const [studentId, setStudentId] = useState("");
  const [typeKey, setTypeKey] = useState("");
  const [involved, setInvolved] = useState("");
  const [level, setLevel] = useState("basica");
  const [relato, setRelato] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [f, setF] = useState({ fechaHecho: "", hora: "", lugar: "", curso: "", testigos: "", adultosRef: "" });
  const chosenKey = mode === "predef" ? typeKey : analysis?.best?.key;
  const setField = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  function create() {
    if (!chosenKey) return;
    const id = `RC-2026-${Math.floor(100 + Math.random() * 900)}`;
    let sid = studentId;
    if (!sid) {
      sid = `s${Date.now()}`;
      setStudents((prev) => [...prev, { id: sid, name: involved || "Estudiante sin identificar", curso: f.curso || "", nivel: level, entrevistas: [], citaciones: [], compromisos: [], medidas: [] }]);
    }
    onCreate(buildCase(id, chosenKey, involved || "Estudiante (sin identificar aún)", 0, 0, "", { relato, level, ...f, studentId: sid }));
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
            <div className="mt-2"><Btn onClick={() => setAnalysis(analyzeSituation(relato))} accent={C.seal} disabled={!relato.trim()}><Sparkles size={15} /> Analizar situación</Btn></div>
            {analysis && (
              <div style={{ background: C.paper, border: `1px solid ${C.paperLine}` }} className="rounded-md p-3 mt-3 text-sm">
                {analysis.hasMatch ? (
                  <>
                    <div style={{ color: C.ink }} className="font-medium flex items-center gap-2"><Sparkles size={14} style={{ color: C.seal }} /> Calce sugerido (confianza {analysis.confidence})</div>
                    <div style={{ color: C.text }} className="mt-1">{analysis.best.label}</div>
                    <div style={{ color: C.textSoft }} className="text-xs mt-1">Palabras clave: {analysis.best.matched.join(", ") || "—"}</div>
                    {analysis.alternatives.length > 0 && <div style={{ color: C.textSoft }} className="text-xs mt-1">Alternativas: {analysis.alternatives.map((a) => a.label).join(" · ")}</div>}
                  </>
                ) : <div style={{ color: C.textSoft }}>No se detectó un calce claro. Selecciona el tipo manualmente en la pestaña anterior.</div>}
              </div>
            )}
          </div>
        )}
        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Expediente del estudiante</label>
          <select value={studentId} onChange={(e) => { const v = e.target.value; setStudentId(v); const s = students.find((x) => x.id === v); if (s) { setInvolved(s.name); setField("curso", s.curso); } }}
            className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
            <option value="">➕ Nuevo estudiante (se crea con los datos de abajo)</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.curso}</option>)}
          </select>
        </div>

        <div>
          <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Estudiante(s) / personas involucradas</label>
          <input value={involved} onChange={(e) => setInvolved(e.target.value)} placeholder="Ej: Estudiante 6°A (iniciales R.P.)"
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
        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onCancel} className="text-sm px-4 py-2 rounded-md" style={{ color: C.textSoft }}>Cancelar</button>
          <Btn onClick={create} disabled={!chosenKey}>Generar paso a paso <ChevronRight size={15} /></Btn>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- CASE DETAIL ---------------------------- */
function CaseDetail({ c, role, setCases, templates, institutions, student, onOpenStudent, onBack }) {
  const isFamily = role.scope === "family";
  const isAudit = role.scope === "audit";
  const [emailOpen, setEmailOpen] = useState(false);
  const [derivOpen, setDerivOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [evType, setEvType] = useState({});
  const emails = c.emails || [];

  function update(fn) { setCases((prev) => prev.map((x) => (x.id === c.id ? fn(x) : x))); }
  function closeCase(summary) {
    update((x) => ({ ...x, closed: true, closedAt: new Date(), closeSummary: summary, log: [...x.log, { at: new Date(), who: role.label, text: `Caso cerrado. ${summary}` }] }));
    setCloseOpen(false);
  }
  function markDone(stepId) {
    update((x) => ({ ...x, currentStepIdx: Math.max(x.currentStepIdx, stepId + 1),
      steps: x.steps.map((s) => (s.id === stepId ? { ...s, done: true } : s)),
      log: [...x.log, { at: new Date(), who: role.label, text: `Paso completado: ${x.steps[stepId].title}` }] }));
  }
  function addEvidence(stepId, name, type) {
    update((x) => ({ ...x, steps: x.steps.map((s) => (s.id === stepId ? { ...s, evidence: [...s.evidence, { name, type }] } : s)),
      log: [...x.log, { at: new Date(), who: role.label, text: `Evidencia (${type}): ${name}` }] }));
  }

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} style={{ color: C.textSoft }} className="text-xs mb-4 flex items-center gap-1 print:hidden">← Volver</button>
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
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <span style={{ color: C.textSoft }} className="text-sm">{c.studentLabel} · {LEVELS[c.level] || "Nivel no indicado"}</span>
        {student && onOpenStudent && <button onClick={() => onOpenStudent(student.id)} style={{ color: C.primary }} className="text-xs flex items-center gap-1 print:hidden"><ClipboardList size={13} /> Ver expediente</button>}
      </div>
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

      {emailOpen && <EmailModal c={c} templates={templates} onClose={() => setEmailOpen(false)}
        onSend={(mail) => { update((x) => ({ ...x, notifiedApoderado: true, emails: [...(x.emails || []), mail], log: [...x.log, { at: new Date(), who: role.label, text: `Correo enviado: ${mail.subject}` }] })); setEmailOpen(false); }} />}
      {derivOpen && <DerivationModal c={c} institutions={institutions} onClose={() => setDerivOpen(false)}
        onDerive={(d) => { update((x) => ({ ...x, derivations: [...x.derivations, d], log: [...x.log, { at: new Date(), who: role.label, text: `Derivación enviada a ${d.label} (${d.email}).` }] })); setDerivOpen(false); }} />}
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
  const tpl = templates[tk];
  const subject = fillTemplate(tpl.subject, c);
  const body = fillTemplate(tpl.body, c);
  return (
    <Modal onClose={onClose} title="Enviar correo al apoderado/a">
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Plantilla</label>
      <select value={tk} onChange={(e) => setTk(e.target.value)} className="mt-1.5 mb-3 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
        {keys.map((k) => <option key={k} value={k}>{templates[k].label}</option>)}
      </select>
      <div style={{ color: C.textSoft }} className="text-xs mb-1">Para: {c.apoderadoEmail || "apoderado@correo.cl"}</div>
      <div style={{ color: C.text }} className="text-sm font-medium mb-3">Asunto: {subject}</div>
      <div style={{ borderTop: `1px solid ${C.cardBorder}`, color: C.text }} className="pt-3 text-sm whitespace-pre-line">{body}</div>
      <div className="flex gap-2 justify-end mt-4">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => onSend({ to: c.apoderadoEmail || "apoderado@correo.cl", subject, at: new Date().toISOString().slice(0, 10) })}><Send size={14} /> Enviar</Btn>
      </div>
    </Modal>
  );
}

function DerivationModal({ c, institutions, onClose, onDerive }) {
  const suggested = c.type.network;
  const [instId, setInstId] = useState(suggested[0] || institutions[0]?.id);
  const [email, setEmail] = useState(institutions.find((i) => i.id === (suggested[0] || institutions[0]?.id))?.email || "");
  const inst = institutions.find((i) => i.id === instId);
  return (
    <Modal onClose={onClose} title="Derivar a institución">
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Institución</label>
      <select value={instId} onChange={(e) => { setInstId(e.target.value); setEmail(institutions.find((i) => i.id === e.target.value)?.email || ""); }} className="mt-1.5 mb-3 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
        {institutions.map((i) => <option key={i.id} value={i.id}>{i.label}{suggested.includes(i.id) ? " (sugerida)" : ""}</option>)}
      </select>
      <label style={{ color: C.textSoft }} className="text-xs uppercase tracking-wide font-medium">Correo de destino</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@institucion.cl" className="mt-1.5 w-full rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
      <div className="flex gap-2 justify-end mt-4"><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn onClick={() => email && onDerive({ label: inst.label, email })} accent={C.seal}><Send size={14} /> Enviar derivación</Btn></div>
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
  const reincidentes = students.filter((s) => cases.filter((c) => c.studentId === s.id).length > 1).length;
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
        right={<Toolbar onPrint={printView} onExport={() => exportJSON(cases, "reporte-casos.json")} onImport={(data) => Array.isArray(data) && setCases(data)} />} />
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
        <Btn variant="ghost" onClick={printView}><Printer size={15} /> Exportar PDF</Btn>
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
function NormativaPage({ docs }) {
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
              <div className="flex items-center gap-2">
                <span style={{ background: (d.status === "Cargado" ? C.ok : C.warn) + "22", color: d.status === "Cargado" ? C.ok : C.warn }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">{d.status} · {d.updated}</span>
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ color: C.primary }} className="text-xs inline-flex items-center gap-1"><ExternalLink size={12} /> Abrir</a>}
              </div>
            </div>
            {feeds[d.id] && <div style={{ color: C.textSoft }} className="text-xs mt-1">{feeds[d.id]}</div>}
          </div>
        ))}
        <div style={{ color: C.textSoft }} className="text-[11px]">Carga o enlaza estos documentos en <b style={{ color: C.text }}>Plan de convivencia y PME</b>.</div>
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

function AuditPanel({ cases }) {
  return (
    <div>
      <PageHead title="Panel de auditoría" subtitle="Vista de solo lectura: estado de plazos y cumplimiento de todos los casos." right={<Toolbar onPrint={printView} onExport={() => exportJSON(cases, "auditoria.json")} />} />
      <div className="flex flex-col gap-3">
        {cases.map((c) => {
          const step = c.steps[c.currentStepIdx] || c.steps[c.steps.length - 1];
          const dl = daysLeft(step.due);
          const overdue = dl < 0;
          return (
            <div key={c.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderLeft: `3px solid ${caseColor(c.typeKey)}` }} className="rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5"><span style={{ background: caseColor(c.typeKey) }} className="w-2 h-2 rounded-full shrink-0" /><span style={{ ...mono, color: C.textSoft }} className="text-xs">{c.id}</span><span style={{ color: C.ink }} className="text-sm ml-1">{c.type.label}</span></div>
                {c.closed ? <span style={{ background: C.ok + "22", color: C.ok }} className="text-[11px] font-medium px-2 py-0.5 rounded-full">Cerrado</span> : <StatusPill dl={dl} />}
              </div>
              <div style={{ color: C.textSoft }} className="text-xs mt-2">Etapa actual: {step.title} · Responsable: {step.role}</div>
              {overdue && <div style={{ color: C.urgent }} className="text-xs mt-2 flex items-center gap-1.5"><AlertTriangle size={12} /> Excede el plazo máximo de la normativa vigente.</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerfilesPage({ users, cases }) {
  return (
    <div>
      <PageHead title="Perfiles de la comunidad" subtitle="Integrantes con acceso. Cada perfil ve solo la información de su caso; los relatos y datos sensibles quedan resguardados según el rol." right={<Toolbar onPrint={printView} onExport={() => exportJSON(users, "perfiles.json")} />} />
      <div className="grid sm:grid-cols-2 gap-3">
        {users.filter((u) => u.role !== "superadmin").map((u) => {
          const r = ROLES[u.role];
          const visible = r.scope === "family" ? "Solo su caso" : r.scope === "audit" ? "Todos (solo lectura)" : r.scope === "limited" ? "Casos asignados" : "Todos los casos";
          return (
            <div key={u.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-4 flex items-center gap-3">
              <div style={{ background: C.ink }} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"><UserCircle size={17} color="#fff" /></div>
              <div className="min-w-0">
                <div style={{ color: C.ink }} className="text-sm font-medium">{u.name}</div>
                <div style={{ color: C.textSoft }} className="text-xs">{r.label}</div>
                <div style={{ color: C.seal }} className="text-[11px] mt-0.5">Acceso: {visible}</div>
              </div>
            </div>
          );
        })}
      </div>
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
      <PageHead title="Configuración" subtitle="Usuarios, documentos del establecimiento y correos automáticos." />

      <Section icon={UserPlus} title="Crear usuario">
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del usuario" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
            {Object.entries(ROLES).filter(([k]) => k !== "superadmin").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div><Btn onClick={() => { if (name.trim()) { setUsers([...users, { id: `u${Date.now()}`, name, role, establishmentId: session.establishmentId }]); setName(""); } }}><Plus size={15} /> Agregar usuario</Btn></div>
        </div>
      </Section>

      <Section icon={FileText} title="Documentos del establecimiento">
        <p style={{ color: C.textSoft }} className="text-xs mb-3">Reglamento de Convivencia, PEI y Reglamento de Evaluación. Son propios de cada establecimiento y alimentan el motor junto a la normativa nacional.</p>
        <div className="flex flex-col gap-2">
          {docs.map((d, idx) => (
            <div key={d.id} className="flex items-center justify-between gap-2 p-2 rounded-md" style={{ background: C.paper }}>
              <div><div style={{ color: C.ink }} className="text-sm">{d.name}</div><div style={{ color: d.status === "Cargado" ? C.ok : C.warn }} className="text-[11px]">{d.status} · {d.updated}</div></div>
              <label className="text-xs px-3 py-1.5 rounded-md cursor-pointer flex items-center gap-1.5 shrink-0" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.ink }}>
                <Upload size={13} /> Cargar
                <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setDocs(docs.map((x, k) => (k === idx ? { ...x, status: "Cargado", updated: new Date().toISOString().slice(0, 7) } : x))); e.target.value = ""; }} />
              </label>
            </div>
          ))}
        </div>
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
  configuracion: { label: "Configuración", icon: Settings },
};

function AdminApp(props) {
  const { session, setSession } = props;
  const [view, setView] = useState("dashboard");
  return (
    <div style={{ background: C.appBg, minHeight: "100vh" }} className="flex">
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
          <button onClick={() => setSession(null)} className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm hover:bg-white/60 transition" style={{ color: C.text }}><LogOut size={16} /> Cerrar sesión</button>
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
  function registrarPago(id) { setEstablishments(establishments.map((e) => (e.id === id ? { ...e, paidUF: (e.students || 0) * (e.ufPerStudent || 0) } : e))); }
  function marcarImpago(id) { setEstablishments(establishments.map((e) => (e.id === id ? { ...e, paidUF: 0 } : e))); }
  function setField(id, field, value) { setEstablishments(establishments.map((e) => (e.id === id ? { ...e, [field]: value } : e))); }
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
            <div><div style={{ color: C.ink }} className="text-sm font-medium">{e.name}</div><div style={{ color: C.textSoft }} className="text-xs">{e.comuna} · {LEVELS[e.type]} · {e.sostenedor}</div></div>
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
  return (
    <div>
      <PageHead title="Instituciones de derivación" subtitle="Directorio global. Los correos se usan como sugerencia al derivar." right={<Toolbar onPrint={printView} onExport={() => exportJSON(institutions, "instituciones.json")} onImport={(d) => Array.isArray(d) && setInstitutions(d)} />} />
      <div className="flex flex-col gap-2">
        {institutions.map((i, idx) => (
          <div key={i.id} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }} className="rounded-lg p-3 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]"><div style={{ color: C.ink }} className="text-sm font-medium">{i.label}</div><div style={{ color: C.textSoft }} className="text-xs">{i.type}</div></div>
            <input value={i.email} onChange={(e) => setInstitutions(institutions.map((x, k) => (k === idx ? { ...x, email: e.target.value } : x)))} placeholder="correo@institucion.cl" className="rounded-md p-2 text-sm min-w-[220px]" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
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
    const alcance = target === "todos" ? "Todos los establecimientos" : establishments.find((e) => e.id === target)?.name;
    setNotifications([{ id: `n${Date.now()}`, from: "Súper Administrador", title, body: `${body}${body ? " " : ""}(${alcance})`, at: new Date().toISOString().slice(0, 10), read: false }, ...notifications]);
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

function AdminConfig({ establishments, setEstablishments }) {
  const [name, setName] = useState("");
  const [comuna, setComuna] = useState("");
  const [type, setType] = useState("basica");
  return (
    <div className="max-w-2xl">
      <PageHead title="Configuración" subtitle="Alta de establecimientos en la plataforma." />
      <Section icon={Building2} title="Registrar establecimiento">
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
          <input value={comuna} onChange={(e) => setComuna(e.target.value)} placeholder="Comuna" className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }} />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md p-2.5 text-sm" style={{ background: "#fff", border: `1px solid ${C.cardBorder}`, color: C.text }}>
            {Object.entries(LEVELS).filter(([k]) => k !== "todos").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div><Btn accent={C.admin} onClick={() => { if (name.trim()) { setEstablishments([...establishments, { id: `e${Date.now()}`, name, comuna, type, sostenedor: "—", activos: 0, vencidos: 0, cumplimiento: 100, students: 0, ufPerStudent: 0.05, paidUF: 0 }]); setName(""); setComuna(""); } }}><Plus size={15} /> Registrar</Btn></div>
        </div>
      </Section>
    </div>
  );
}
