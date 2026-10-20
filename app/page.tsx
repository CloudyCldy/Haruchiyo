"use client";

import { FormEvent, useEffect, useState, useRef } from "react";

type ApiResult = {
  success?: boolean;
  data?: {
    token?: string;
    user?: { name?: string; email?: string };
  };
  error?: { message?: string };
};

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ApiCredentials = {
  url: string;
  baseUrl: string;
  token: string;
  apiKey: string;
  endpoints: { method: string; path: string; description: string; auth: string }[];
  curlExamples?: {
    withToken?: string;
    withApiKey?: string;
  };
};

type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  methodologyId?: string;
  methodology?: { name: string };
};

type Methodology = {
  id: string;
  name: string;
  description: string;
};

type ProjectAnalysis = {
  projectId: string;
  methodology: string;
  metrics: {
    progress: number;
    pendingTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    riskCount: number;
    issueCount: number;
    milestoneProgress: number;
  };
  compliance: {
    score: number;
    status: string;
    problems: { description: string }[];
  };
  health: {
    score: number;
    status: string;
    factors?: Record<string, number>;
    weights?: Record<string, number>;
  } | number;
  problems: { description: string }[];
  recommendations: { title?: string; description?: string; suggestedAction?: string }[];
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

type ChatMessageItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: string[];
  warnings?: string[];
  timestamp: string;
};

export default function HomePage() {
  // Estado de Tema (Dark por defecto, con soporte Light)
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Estado de Autenticación
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");

  // Estado del Workspace
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"operations" | "inspection" | "ai" | "credentials">("operations");

  // Credenciales y Acceso API
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [rotateLoading, setRotateLoading] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState(false);

  // Formulario de Nueva Operación
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    methodologyId: "SCRUM",
    startDate: "",
    endDate: "",
  });
  const [projectStatus, setProjectStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [projectMessage, setProjectMessage] = useState("");
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);

  // Análisis e Inspección Táctica
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState({ title: "", priority: "MEDIUM", status: "TODO" });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Derivación determinística del índice de salud para evitar [object Object]
  const healthScore = analysis
    ? (typeof analysis.health === "object" && analysis.health !== null
        ? analysis.health.score
        : typeof analysis.health === "number"
        ? analysis.health
        : 100)
    : 100;

  const healthStatus = analysis
    ? (typeof analysis.health === "object" && analysis.health !== null && analysis.health.status
        ? analysis.health.status
        : analysis.compliance?.status || "Óptimo")
    : "Óptimo";

  // Asistente de Inteligencia Estratégica (Chatbot)
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Inicialización de Tema y Sesión
  useEffect(() => {
    const savedTheme = (window.localStorage.getItem("sanzu_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const token = window.localStorage.getItem("sanzu_token");
    if (token) loadWorkspace(token);

    fetch("/api/methodologies")
      .then((res) => res.json())
      .then((payload) => setMethodologies(payload.data || []))
      .catch(() => undefined);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("sanzu_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  async function loadWorkspace(token: string) {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [profileRes, projectsRes, credsRes] = await Promise.all([
        fetch("/api/users/me", { headers }),
        fetch("/api/projects", { headers }),
        fetch("/api/users/me/credentials", { headers }),
      ]);

      if (!profileRes.ok || !projectsRes.ok) {
        window.localStorage.removeItem("sanzu_token");
        setProfile(null);
        return;
      }

      const profilePayload = await profileRes.json();
      const projectsPayload = await projectsRes.json();
      const userProjects: Project[] = projectsPayload.data || [];

      setProfile(profilePayload.data);
      setProjects(userProjects);

      if (credsRes.ok) {
        const credsPayload = await credsRes.json();
        setCredentials(credsPayload.data);
      }

      if (userProjects.length > 0 && !selectedProjectId) {
        selectProject(userProjects[0].id, token);
      }
    } catch {
      window.localStorage.removeItem("sanzu_token");
      setProfile(null);
    }
  }

  async function loadCredentials(token?: string) {
    const activeToken = token || window.localStorage.getItem("sanzu_token");
    if (!activeToken) return;
    setCredentialsLoading(true);
    try {
      const res = await fetch("/api/users/me/credentials", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const payload = await res.json();
        setCredentials(payload.data);
      }
    } catch {
      // error
    } finally {
      setCredentialsLoading(false);
    }
  }

  async function copyToClipboard(text: string, fieldId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  }

  async function rotateApiKey() {
    const token = window.localStorage.getItem("sanzu_token");
    if (!token) return;
    setRotateLoading(true);
    setRotateSuccess(false);
    try {
      const res = await fetch("/api/users/me/credentials", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payload = await res.json();
        if (credentials) {
          setCredentials({
            ...credentials,
            apiKey: payload.data.apiKey,
            curlExamples: {
              ...credentials.curlExamples,
              withApiKey: `curl -X POST "${credentials.url}/projects/PROYECTO_ID/context" -H "X-Api-Key: ${payload.data.apiKey}" -H "Content-Type: application/json" -d '{"project":{"name":"Test","methodology":"SCRUM"}}'`,
            },
          });
        } else {
          await loadCredentials(token);
        }
        setRotateSuccess(true);
        window.setTimeout(() => setRotateSuccess(false), 3000);
      }
    } catch {
      // error
    } finally {
      setRotateLoading(false);
    }
  }

  async function selectProject(projectId: string, existingToken?: string) {
    setSelectedProjectId(projectId);
    const token = existingToken || window.localStorage.getItem("sanzu_token");
    if (!token) return;

    setAnalysisLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [analysisRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/analysis`, { headers }),
        fetch(`/api/projects/${projectId}/tasks`, { headers }),
      ]);

      if (analysisRes.ok) {
        const payload = await analysisRes.json();
        setAnalysis(payload.data);
      }
      if (tasksRes.ok) {
        const payload = await tasksRes.json();
        setTasks(payload.data || []);
      }
    } catch {
      // Manejo silencioso en carga secundaria
    } finally {
      setAnalysisLoading(false);
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as ApiResult;
      if (response.ok && data.data?.token) {
        window.localStorage.setItem("sanzu_token", data.data.token);
        await loadWorkspace(data.data.token);
      }
      setResult(data);
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
      setResult({ error: { message: "Ejecución interrumpida. No se pudo conectar con el servidor." } });
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = (await response.json()) as ApiResult;
      if (response.ok && data.data?.token) {
        window.localStorage.setItem("sanzu_token", data.data.token);
        await loadWorkspace(data.data.token);
      }
      setResult(data);
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
      setResult({ error: { message: "Ejecución interrumpida. Credenciales no autorizadas." } });
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem("sanzu_token");
    if (!token) return;
    setProjectStatus("loading");
    setProjectMessage("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...projectForm,
          startDate: projectForm.startDate || undefined,
          endDate: projectForm.endDate || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message || "Ejecución interrumpida al registrar la operación.");
      }
      const newProj: Project = payload.data;
      setProjects((current) => [newProj, ...current]);
      setSelectedProjectId(newProj.id);
      setProjectForm({
        name: "",
        description: "",
        methodologyId: projectForm.methodologyId,
        startDate: "",
        endDate: "",
      });
      setProjectMessage("Operación completada. Nueva directiva desplegada en el registro.");
      setProjectStatus("success");
      selectProject(newProj.id, token);
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : "Error al registrar la operación.");
      setProjectStatus("error");
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId) return;
    const token = window.localStorage.getItem("sanzu_token");
    if (!token) return;

    setTaskSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskForm),
      });
      if (response.ok) {
        const payload = await response.json();
        setTasks((prev) => [payload.data, ...prev]);
        setTaskForm({ title: "", priority: "MEDIUM", status: "TODO" });
        selectProject(selectedProjectId, token);
      }
    } catch {
      // Manejo de error
    } finally {
      setTaskSubmitting(false);
    }
  }

  async function sendChatMessage(promptText?: string) {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim() || !selectedProjectId) return;
    const token = window.localStorage.getItem("sanzu_token");
    if (!token) return;

    const userMsg: ChatMessageItem = {
      id: "u-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!promptText) setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          message: textToSend,
          conversationId: conversationId || undefined,
        }),
      });

      const payload = await response.json();
      if (response.ok && payload.data) {
        if (payload.data.conversationId) setConversationId(payload.data.conversationId);

        const assistantMsg: ChatMessageItem = {
          id: "a-" + Date.now(),
          role: "assistant",
          content: payload.data.response,
          recommendations: payload.data.recommendations?.map((r: { description?: string; suggestedAction?: string } | string) =>
            typeof r === "string" ? r : r.suggestedAction || r.description || ""
          ),
          warnings: payload.data.warnings?.map((w: { description?: string } | string) =>
            typeof w === "string" ? w : w.description || ""
          ),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChatMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(payload.error?.message || "Inteligencia no disponible");
      }
    } catch (err) {
      const errorMsg: ChatMessageItem = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "Ejecución interrumpida: El canal táctico no pudo procesar la solicitud en este momento.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  function logout() {
    window.localStorage.removeItem("sanzu_token");
    setProfile(null);
    setProjects([]);
    setSelectedProjectId(null);
    setAnalysis(null);
    setTasks([]);
    setChatMessages([]);
    setStatus("idle");
    setMode("login");
  }

  async function copyProjectId(projectId: string) {
    await navigator.clipboard.writeText(projectId);
    setCopiedProjectId(projectId);
    window.setTimeout(() => setCopiedProjectId(null), 1800);
  }

  function switchMode(nextMode: "register" | "login") {
    setMode(nextMode);
    setStatus("idle");
    setResult(null);
    if (nextMode === "login") setForm((current) => ({ ...current, name: "" }));
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  /* =========================================================================
     VISTA AUTENTICADA (CENTRO DE COMANDO ESTRATÉGICO)
     ========================================================================= */
  if (profile) {
    return (
      <main className="workspace-shell">
        {/* Barra Superior Táctica */}
        <header className="command-nav">
          <div className="nav-brand">
            <div className="brand-mark" aria-label="Logo Sanzu">
              <img src="/sanzu.png" alt="Sanzu Logo" className="brand-logo-img" />
            </div>
            <div className="nav-brand-title">
              <strong>HARUCHIYO / SANZU</strong>
              <small>Centro de Comando Estratégico</small>
            </div>
          </div>

          <div className="nav-actions">
            <span className="status-pill">
              <span className="status-dot-pulse" />
              SISTEMA EN LÍNEA
            </span>

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title="Alternar tema"
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className={`btn-pill btn-pill-sm ${activeTab === "credentials" ? "btn-pill-rose" : "btn-pill-ghost"}`}
              onClick={() => setActiveTab("credentials")}
              title="Obtener API Key, URL base y Token de acceso"
            >
              Acceso API
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-accent)",
                  color: "var(--rose-sanzu)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-serif)",
                  fontSize: "17px",
                  fontWeight: 600,
                }}
              >
                {profile.name.slice(0, 1).toUpperCase()}
              </span>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <b style={{ fontSize: "13px", lineHeight: 1.1, color: "var(--text-primary)" }}>{profile.name}</b>
                <span className="kicker-tag" style={{ fontSize: "9px" }}>
                  {profile.role.replace("_", " ")}
                </span>
              </div>

              <button
                type="button"
                className="btn-pill btn-pill-sm btn-pill-ghost"
                onClick={logout}
                style={{ marginLeft: "6px" }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <section className="workspace-content">
          {/* Encabezado del Centro de Comando */}
          <div className="workspace-hero">
            <div>
              <span className="kicker-tag">CENTRO DE COMANDO // CONTROL ESTRATÉGICO</span>
              <h2>
                Bienvenido, <em>{profile.name.split(" ")[0]}</em>.
              </h2>
              <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: "15px" }}>
                Supervisión de operaciones activas, control de contingencias y análisis táctico en tiempo real.
              </p>
            </div>

            {/* Selector de Proyecto Activo */}
            {projects.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="kicker-tag violet">OPERACIÓN EN FOCO:</span>
                <select
                  value={selectedProjectId || ""}
                  onChange={(e) => selectProject(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-pills)",
                    border: "1px solid var(--border-accent)",
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    maxWidth: "240px",
                  }}
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.methodology?.name || proj.status})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Barra de KPIs Tácticos */}
          <div className="kpi-grid">
            <div className="kpi-card corner-accent">
              <span className="kpi-label">Operaciones Activas</span>
              <div className="kpi-number">{projects.length}</div>
              <span className="kpi-badge rose">Desplegadas</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Índice de Salud (Foco)</span>
              <div className="kpi-number" style={{ color: healthScore < 60 ? "var(--status-error)" : "var(--text-primary)" }}>
                {analysis ? `${healthScore}%` : "100%"}
              </div>
              <span className="kpi-badge cyan">
                {healthStatus}
              </span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Amenazas Detectadas</span>
              <div className="kpi-number" style={{ color: analysis && analysis.problems.length > 0 ? "var(--status-warning)" : "var(--status-success)" }}>
                {analysis ? analysis.problems.length : 0}
              </div>
              <span className="kpi-badge green">Bajo Control</span>
            </div>

            <div className="kpi-card">
              <span className="kpi-label">Inteligencia Estratégica</span>
              <div className="kpi-number" style={{ fontSize: "20px", marginTop: "4px" }}>
                Sanzu AI Core
              </div>
              <span className="kpi-badge rose">Determinístico</span>
            </div>
          </div>

          {/* Pestañas de Navegación del Panel */}
          <nav className="view-tabs" aria-label="Vistas del centro de comando">
            <button
              type="button"
              className={`view-tab-btn ${activeTab === "operations" ? "active" : ""}`}
              onClick={() => setActiveTab("operations")}
            >
              Operaciones Activas ({projects.length})
            </button>
            <button
              type="button"
              className={`view-tab-btn ${activeTab === "inspection" ? "active" : ""}`}
              onClick={() => setActiveTab("inspection")}
            >
              Inspección Táctica & Tareas ({tasks.length})
            </button>
            <button
              type="button"
              className={`view-tab-btn ${activeTab === "ai" ? "active" : ""}`}
              onClick={() => setActiveTab("ai")}
            >
              Inteligencia Estratégica (Copiloto)
            </button>
            <button
              type="button"
              className={`view-tab-btn ${activeTab === "credentials" ? "active" : ""}`}
              onClick={() => setActiveTab("credentials")}
            >
              Credenciales y Acceso API
            </button>
          </nav>

          {/* ===============================================================
              PESTAÑA 1: OPERACIONES ACTIVAS & REGISTRO DE NUEVA DIRECTIVA
              =============================================================== */}
          {activeTab === "operations" && (
            <div className="operations-grid">
              {/* Formulario: Nueva Operación */}
              <section className="tactical-card corner-accent" aria-label="Registrar nueva operación">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span className="kicker-tag">NUEVA OPERACIÓN // DIRECTIVA 01</span>
                  <span className="code-mono" style={{ color: "var(--rose-sanzu)" }}>SANZU-OPS</span>
                </div>
                <h3>Registra tu operación</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "6px 0 20px" }}>
                  Define el marco de trabajo, alcance y plazos. La metodología determina las reglas y métricas automáticas.
                </p>

                <form onSubmit={createProject}>
                  <div className="form-group">
                    <label htmlFor="project-name">Nombre de la operación</label>
                    <input
                      id="project-name"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      placeholder="Ej. Reestructuración de infraestructura core"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="methodology">Marco de trabajo metodológico</label>
                    <select
                      id="methodology"
                      value={projectForm.methodologyId}
                      onChange={(e) => setProjectForm({ ...projectForm, methodologyId: e.target.value })}
                    >
                      {(methodologies.length
                        ? methodologies
                        : [
                            { id: "SCRUM", name: "Scrum (Iterativo y sprints)", description: "" },
                            { id: "KANBAN", name: "Kanban (Flujo continuo y WIP)", description: "" },
                          ]
                      ).map((methodology) => (
                        <option key={methodology.id} value={methodology.id}>
                          {methodology.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="project-description">
                      Directivas & Alcance <span style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>(OPCIONAL)</span>
                    </label>
                    <textarea
                      id="project-description"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      placeholder="¿Cuáles son los objetivos estratégicos y condiciones de éxito?"
                      rows={3}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div className="form-group">
                      <label htmlFor="start-date">Despliegue</label>
                      <input
                        id="start-date"
                        type="date"
                        value={projectForm.startDate}
                        onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="end-date">Plazo límite</label>
                      <input
                        id="end-date"
                        type="date"
                        value={projectForm.endDate}
                        onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <button className="submit-button" type="submit" disabled={projectStatus === "loading"}>
                    {projectStatus === "loading" ? "DESPLEGANDO DIRECTIVA..." : "REGISTRAR OPERACIÓN  →"}
                  </button>
                </form>

                {projectMessage && (
                  <div
                    className={`feedback-box ${projectStatus}`}
                    role={projectStatus === "error" ? "alert" : "status"}
                  >
                    <strong>{projectStatus === "success" ? "Operación completada" : "Ejecución interrumpida"}</strong>
                    <span>{projectMessage}</span>
                  </div>
                )}
              </section>

              {/* Lista: Operaciones Registradas */}
              <section className="tactical-card" aria-label="Listado de operaciones">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span className="kicker-tag">REGISTRO DE OPERACIONES</span>
                  <span className="code-mono" style={{ color: "var(--text-secondary)" }}>
                    TOTAL: {String(projects.length).padStart(2, "0")}
                  </span>
                </div>
                <h3>Operaciones activas</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "6px 0 20px" }}>
                  Selecciona una operación para inspeccionar sus métricas, tareas e inteligencia estratégica.
                </p>

                {projects.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "240px",
                      border: "1px dashed var(--border-subtle)",
                      borderRadius: "var(--radius-cards)",
                      padding: "32px",
                      textAlign: "center",
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--rose-sanzu)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "10px" }} aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="22" y1="12" x2="18" y2="12" />
                      <line x1="6" y1="12" x2="2" y2="12" />
                      <line x1="12" y1="6" x2="12" y2="2" />
                      <line x1="12" y1="22" x2="12" y2="18" />
                    </svg>
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--text-primary)", margin: 0 }}>
                      No hay operaciones activas.
                      <br />
                      <em style={{ color: "var(--rose-sanzu)" }}>Define tu siguiente movimiento.</em>
                    </p>
                  </div>
                ) : (
                  <div>
                    {projects.map((project) => {
                      const isSelected = project.id === selectedProjectId;
                      return (
                        <article
                          key={project.id}
                          className={`operation-row ${isSelected ? "selected" : ""}`}
                          onClick={() => selectProject(project.id)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Seleccionar operación ${project.name}`}
                        >
                          <div className="operation-monogram" aria-hidden="true">
                            {project.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="operation-meta">
                            <strong>{project.name}</strong>
                            <span className="operation-tag">
                              {project.methodology?.name || project.status}
                            </span>
                          </div>
                          <div className="operation-actions">
                            <span className="code-mono" style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                              ID: {project.id.slice(-6)}
                            </span>
                            <button
                              type="button"
                              className={`copy-token-btn ${copiedProjectId === project.id ? "copied" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyProjectId(project.id);
                              }}
                            >
                              {copiedProjectId === project.id ? "Copiado" : "Copiar ID"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ===============================================================
              PESTAÑA 2: INSPECCIÓN TÁCTICA & MOVIMIENTOS (TAREAS)
              =============================================================== */}
          {activeTab === "inspection" && (
            <div className="operations-grid">
              {/* Desglose de Análisis de Salud */}
              <section className="tactical-card corner-accent" aria-label="Diagnóstico de operación">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span className="kicker-tag">DIAGNÓSTICO // {activeProject?.name || "OPERACIÓN"}</span>
                  <span className="status-pill">
                    SALUD: {analysis ? `${healthScore}%` : "100%"}
                  </span>
                </div>
                <h3>Diagnóstico de cumplimiento</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "6px 0 20px" }}>
                  Evaluación determinística basada en las reglas y cadencias de {activeProject?.methodology?.name || "la metodología activa"}.
                </p>

                {analysisLoading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--rose-sanzu)", fontFamily: "var(--font-mono)" }}>
                    ANALIZANDO CONTINGENCIAS Y FLUJO TÁCTICO...
                  </div>
                ) : analysis ? (
                  <div>
                    {/* Barra de progreso de cumplimiento */}
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span>Cumplimiento Metodológico</span>
                        <b style={{ color: "var(--rose-sanzu)" }}>{analysis.compliance.score}% ({analysis.compliance.status})</b>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "var(--bg-base)", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${analysis.compliance.score}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, var(--violet-somber), var(--rose-sanzu))",
                          }}
                        />
                      </div>
                    </div>

                    {/* Amenazas Detectadas */}
                    <div style={{ marginBottom: "20px" }}>
                      <span className="kicker-tag" style={{ color: analysis.problems.length > 0 ? "var(--status-warning)" : "var(--status-success)" }}>
                        {analysis.problems.length > 0 ? "AMENAZAS DETECTADAS" : "SIN AMENAZAS INMEDIATAS"}
                      </span>
                      {analysis.problems.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                          No se han identificado bloqueos ni desviaciones críticas en este ciclo.
                        </p>
                      ) : (
                        <ul style={{ paddingLeft: "20px", margin: "8px 0", fontSize: "13px", color: "var(--text-primary)" }}>
                          {analysis.problems.map((prob, idx) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>{prob.description}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Recomendaciones Estratégicas */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "var(--radius-inputs)", border: "1px solid var(--border-subtle)" }}>
                        <span className="kicker-tag violet">DIRECTIVA ESTRATÉGICA RECOMENDADA:</span>
                        <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: "6px 0 0" }}>
                          {analysis.recommendations[0]?.suggestedAction || analysis.recommendations[0]?.description || "Mantén la cadencia y revisa el backlog priorizado."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                    Selecciona una operación para ejecutar el diagnóstico en tiempo real.
                  </p>
                )}
              </section>

              {/* Tareas / Movimientos Tácticos */}
              <section className="tactical-card" aria-label="Movimientos tácticos">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span className="kicker-tag">MOVIMIENTOS TÁCTICOS ({tasks.length})</span>
                  <span className="code-mono" style={{ color: "var(--status-cyan)" }}>EJECUCIÓN</span>
                </div>
                <h3>Movimientos pendientes</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "6px 0 18px" }}>
                  Asigna y gestiona tareas con prioridad y trazabilidad directa en la operación.
                </p>

                {/* Formulario rápido para nueva tarea */}
                <form onSubmit={createTask} style={{ marginBottom: "22px", display: "grid", gap: "10px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      placeholder="Nuevo movimiento táctico (ej. Validar cifrado JWT)"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      required
                      style={{ flex: 1 }}
                    />
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" })}
                      style={{ width: "130px" }}
                    >
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="CRITICAL">Crítica</option>
                    </select>
                    <button
                      type="submit"
                      disabled={taskSubmitting}
                      className="btn-pill btn-pill-rose btn-pill-sm"
                    >
                      {taskSubmitting ? "..." : "+ Añadir"}
                    </button>
                  </div>
                </form>

                {/* Lista de Tareas */}
                {tasks.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--text-tertiary)", border: "1px dashed var(--border-subtle)", borderRadius: "var(--radius-inputs)" }}>
                    No hay movimientos registrados para esta operación. Define el primer paso.
                  </div>
                ) : (
                  <div className="task-list-panel">
                    {tasks.map((task) => (
                      <div key={task.id} className="task-item-card">
                        <div>
                          <strong style={{ fontSize: "14px", color: "var(--text-primary)", display: "block" }}>
                            {task.title}
                          </strong>
                          <span className="code-mono" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                            ESTADO: {task.status}
                          </span>
                        </div>
                        <span className={`priority-pill ${task.priority}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ===============================================================
              PESTAÑA 3: ASISTENTE DE INTELIGENCIA ESTRATÉGICA (SANZU AI)
              =============================================================== */}
          {activeTab === "ai" && (
            <div className="chat-console-shell corner-accent">
              <div className="chat-console-header">
                <div>
                  <span className="kicker-tag">CONSOLA DE INTELIGENCIA // SANZU CORE</span>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Operación conectada: <b>{activeProject?.name || "Ninguna"}</b> ({activeProject?.methodology?.name || "Ágil"})
                  </div>
                </div>
                <span className="status-pill">
                  <span className="status-dot-pulse" />
                  RESPUESTA DETERMINÍSTICA
                </span>
              </div>

              {/* Mensajes del Asistente */}
              <div className="chat-console-messages">
                {chatMessages.length === 0 && (
                  <div style={{ margin: "auto", textAlign: "center", maxWidth: "520px", padding: "30px 20px" }}>
                    <div style={{ width: "48px", height: "48px", margin: "0 auto 16px", borderRadius: "var(--radius-chips)", background: "var(--bg-elevated)", border: "1px solid var(--border-accent)", display: "grid", placeItems: "center" }}>
                      <img src="/sanzu.png" alt="Sanzu Logo" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
                    </div>
                    <h3 style={{ fontSize: "22px", marginBottom: "8px" }}>Inteligencia Estratégica Lista</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                      «El caos no se tolera: se domina. Consulta sobre cuellos de botella, riesgos abiertos, cadencias de entrega o directivas metodológicas de esta operación.»
                    </p>
                  </div>
                )}

                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                    {msg.role === "assistant" && (
                      <div className="assistant-badge">
                        SANZU AI // RESPUESTA ESTRATÉGICA
                      </div>
                    )}
                    <div>{msg.content}</div>

                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="chat-recommendation-list">
                        <b style={{ color: "var(--rose-sanzu)", display: "block", marginBottom: "4px" }}>Acciones sugeridas:</b>
                        <ul>
                          {msg.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ textAlign: "right", fontSize: "10px", color: "var(--text-tertiary)", marginTop: "6px", fontFamily: "var(--font-mono)" }}>
                      {msg.timestamp}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="chat-bubble assistant">
                    <div className="assistant-badge">
                      <span className="status-dot-pulse" /> PROCESANDO MATRIZ DE RIESGOS...
                    </div>
                    <span style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "13px" }}>
                      Analizando tareas, métricas y reglas del proyecto...
                    </span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Barra de entrada y sugerencias rápidas */}
              <div className="chat-console-input-bar">
                <div className="quick-prompts-bar">
                  <button
                    type="button"
                    className="quick-prompt-btn"
                    onClick={() => sendChatMessage("¿Cuáles son los principales riesgos de este proyecto?")}
                  >
                    Identificar riesgos
                  </button>
                  <button
                    type="button"
                    className="quick-prompt-btn"
                    onClick={() => sendChatMessage("¿Cómo optimizar el flujo de trabajo según la metodología?")}
                  >
                    Sugerir plantillas y procesos
                  </button>
                  <button
                    type="button"
                    className="quick-prompt-btn"
                    onClick={() => sendChatMessage("¿Por qué tenemos tareas bloqueadas o retrasos?")}
                  >
                    Diagnosticar bloqueos
                  </button>
                </div>

                <div className="chat-input-row">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    placeholder="Escribe tu consulta estratégica (ej. ¿Qué tareas tienen mayor impacto?)..."
                    disabled={chatLoading || !selectedProjectId}
                  />
                  <button
                    type="button"
                    onClick={() => sendChatMessage()}
                    disabled={chatLoading || !chatInput.trim() || !selectedProjectId}
                    className="btn-pill btn-pill-rose btn-pill-sm"
                  >
                    Consultar →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              PESTAÑA 4: CREDENCIALES Y ACCESO API (URL, TOKEN, API KEY)
              =============================================================== */}
          {activeTab === "credentials" && (
            <div className="credentials-grid">
              {/* Header Táctico de Credenciales */}
              <section className="credentials-hero-card corner-accent" aria-label="Credenciales de API">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "10px" }}>
                  <div>
                    <span className="kicker-tag rose">CREDENCIALES Y PROTOCOLO // ACCESO PROGRAMÁTICO</span>
                    <h2 style={{ margin: "8px 0 6px", fontFamily: "var(--font-serif)", fontSize: "28px", color: "var(--text-primary)" }}>
                      Credenciales de Integración API
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, maxWidth: "780px", lineHeight: 1.6 }}>
                      Aquí puedes obtener tu <strong>URL base</strong>, tu <strong>Token de sesión (Bearer JWT)</strong> y tu <strong>API Key</strong> personal para conectar servicios, automatizar operaciones o realizar peticiones directas desde herramientas como Postman, cURL o tus propios microservicios.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-pill btn-pill-sm btn-pill-ghost"
                    onClick={() => loadCredentials()}
                    disabled={credentialsLoading}
                  >
                    {credentialsLoading ? "Sincronizando..." : "Actualizar credenciales"}
                  </button>
                </div>
              </section>

              {/* Grid de las 3 Credenciales Principales */}
              <div className="credentials-items-grid">
                {/* 1. URL BASE DE LA API */}
                <div className="credential-card corner-accent">
                  <div className="credential-body">
                    <div className="credential-header">
                      <span className="kicker-tag cyan">CONEXIÓN // HOST ACTIVO</span>
                      <span className="code-mono" style={{ fontSize: "11px", color: "var(--status-cyan)" }}>HTTP REST</span>
                    </div>
                    <h3 style={{ margin: "4px 0 6px", fontSize: "18px" }}>1. URL Base de la API</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 10px", lineHeight: 1.5 }}>
                      Punto de entrada para el consumo de recursos REST (proyectos, tareas, sprints, IA y contexto).
                    </p>

                    <div className="credential-box">
                      <span className="credential-val">
                        {credentials?.url || (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:3000/api")}
                      </span>
                    </div>
                  </div>

                  <div className="credential-actions">
                    <button
                      type="button"
                      className={`copy-btn ${copiedField === "url" ? "copied" : ""}`}
                      onClick={() => {
                        const u = credentials?.url || `${window.location.origin}/api`;
                        copyToClipboard(u, "url");
                      }}
                    >
                      {copiedField === "url" ? "URL Copiada" : "Copiar URL (/api)"}
                    </button>
                    <button
                      type="button"
                      className={`copy-btn ${copiedField === "baseUrl" ? "copied" : ""}`}
                      onClick={() => {
                        const h = credentials?.baseUrl || window.location.origin;
                        copyToClipboard(h, "baseUrl");
                      }}
                    >
                      {copiedField === "baseUrl" ? "Host Copiado" : "Copiar Host Base"}
                    </button>
                  </div>
                </div>

                {/* 2. TOKEN DE SESIÓN (JWT BEARER) */}
                <div className="credential-card corner-accent">
                  <div className="credential-body">
                    <div className="credential-header">
                      <span className="kicker-tag violet">AUTENTICACIÓN // SESIÓN</span>
                      <span className="code-mono" style={{ fontSize: "11px", color: "var(--violet-somber)" }}>JWT · HS256</span>
                    </div>
                    <h3 style={{ margin: "4px 0 6px", fontSize: "18px" }}>2. Token de Sesión (JWT)</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 10px", lineHeight: 1.5 }}>
                      Token temporal firmado para tus peticiones como usuario autenticado. Se envía como <code>Authorization: Bearer &lt;token&gt;</code>.
                    </p>

                    <div className="credential-box">
                      <span className={`credential-val ${!showToken ? "masked" : ""}`}>
                        {showToken
                          ? (credentials?.token || (typeof window !== "undefined" ? window.localStorage.getItem("sanzu_token") : "") || "No disponible")
                          : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                      </span>
                    </div>
                  </div>

                  <div className="credential-actions">
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? "Ocultar" : "Mostrar Token"}
                    </button>
                    <button
                      type="button"
                      className={`copy-btn ${copiedField === "token" ? "copied" : ""}`}
                      onClick={() => {
                        const t = credentials?.token || window.localStorage.getItem("sanzu_token") || "";
                        copyToClipboard(t, "token");
                      }}
                    >
                      {copiedField === "token" ? "Token Copiado" : "Copiar Token"}
                    </button>
                    <button
                      type="button"
                      className={`copy-btn ${copiedField === "authHeader" ? "copied" : ""}`}
                      onClick={() => {
                        const t = credentials?.token || window.localStorage.getItem("sanzu_token") || "";
                        copyToClipboard(`Authorization: Bearer ${t}`, "authHeader");
                      }}
                    >
                      {copiedField === "authHeader" ? "Header Copiado" : "Copiar Header"}
                    </button>
                  </div>
                </div>

                {/* 3. API KEY PERSONAL (X-API-KEY) */}
                <div className="credential-card corner-accent">
                  <div className="credential-body">
                    <div className="credential-header">
                      <span className="kicker-tag rose">SERVICIO A SERVICIO // FIJA</span>
                      <span className="code-mono" style={{ fontSize: "11px", color: "var(--rose-sanzu)" }}>X-API-KEY</span>
                    </div>
                    <h3 style={{ margin: "4px 0 6px", fontSize: "18px" }}>3. API Key Personal</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 10px", lineHeight: 1.5 }}>
                      Clave secreta permanente para sincronización entre sistemas y servicios externos. Se envía en el encabezado <code>X-Api-Key</code>.
                    </p>

                    <div className="credential-box">
                      <span className={`credential-val ${!showApiKey ? "masked" : ""}`}>
                        {showApiKey
                          ? (credentials?.apiKey || "sz_live_...")
                          : "sz_live_••••••••••••••••••••••••••••••••"}
                      </span>
                    </div>
                  </div>

                  <div className="credential-actions">
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? "Ocultar" : "Mostrar Key"}
                    </button>
                    <button
                      type="button"
                      className={`copy-btn ${copiedField === "apiKey" ? "copied" : ""}`}
                      onClick={() => copyToClipboard(credentials?.apiKey || "", "apiKey")}
                    >
                      {copiedField === "apiKey" ? "Key Copiada" : "Copiar API Key"}
                    </button>
                    <button
                      type="button"
                      className={`copy-btn ${rotateSuccess ? "copied" : ""}`}
                      onClick={rotateApiKey}
                      disabled={rotateLoading}
                      title="Generar una nueva API Key y revocar la anterior"
                    >
                      {rotateLoading ? "Generando..." : rotateSuccess ? "Clave Renovada" : "Regenerar Key"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guía Rápida cURL y Catálogo de Endpoints */}
              <div className="tactical-card corner-accent">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span className="kicker-tag">EJECUCIÓN TÁCTICA // COMANDOS DE PRUEBA</span>
                    <h3 style={{ margin: "4px 0", fontSize: "20px" }}>Comandos de Ejecución Inmediata (cURL)</h3>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <b style={{ fontSize: "13px", color: "var(--rose-sanzu)" }}>Ejemplo 1: Petición con Bearer Token</b>
                      <button
                        type="button"
                        className={`copy-btn ${copiedField === "curlToken" ? "copied" : ""}`}
                        onClick={() => {
                          const cmd = credentials?.curlExamples?.withToken ||
                            `curl -X GET "${credentials?.url || `${window.location.origin}/api`}/projects" -H "Authorization: Bearer ${credentials?.token || window.localStorage.getItem("sanzu_token") || "<TOKEN>"}"`;
                          copyToClipboard(cmd, "curlToken");
                        }}
                      >
                        {copiedField === "curlToken" ? "Comando Copiado" : "Copiar cURL"}
                      </button>
                    </div>
                    <div className="code-snippet-box">
                      <pre>{credentials?.curlExamples?.withToken || `curl -X GET "${credentials?.url || "http://localhost:3000/api"}/projects" \\\n  -H "Authorization: Bearer ${credentials?.token || window.localStorage.getItem("sanzu_token") || "<TOKEN>"}"`}</pre>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <b style={{ fontSize: "13px", color: "var(--status-cyan)" }}>Ejemplo 2: Petición con API Key (Servicio a Servicio)</b>
                      <button
                        type="button"
                        className={`copy-btn ${copiedField === "curlApiKey" ? "copied" : ""}`}
                        onClick={() => {
                          const cmd = credentials?.curlExamples?.withApiKey ||
                            `curl -X POST "${credentials?.url || `${window.location.origin}/api`}/projects/${selectedProjectId || "PROYECTO_ID"}/context" -H "X-Api-Key: ${credentials?.apiKey || "<API_KEY>"}" -H "Content-Type: application/json" -d '{"project":{"name":"Demo","methodology":"SCRUM"}}'`;
                          copyToClipboard(cmd, "curlApiKey");
                        }}
                      >
                        {copiedField === "curlApiKey" ? "Comando Copiado" : "Copiar cURL"}
                      </button>
                    </div>
                    <div className="code-snippet-box">
                      <pre>{credentials?.curlExamples?.withApiKey || `curl -X POST "${credentials?.url || "http://localhost:3000/api"}/projects/${selectedProjectId || "PROYECTO_ID"}/context" \\\n  -H "X-Api-Key: ${credentials?.apiKey || "<API_KEY>"}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"project":{"name":"Demo","methodology":"SCRUM"}}'`}</pre>
                    </div>
                  </div>
                </div>

                {/* Directorio de Endpoints */}
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ fontSize: "15px", marginBottom: "10px", color: "var(--text-silver)" }}>Directorio de Endpoints Clave</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table className="endpoint-table">
                      <thead>
                        <tr>
                          <th>Método</th>
                          <th>Ruta</th>
                          <th>Descripción</th>
                          <th>Seguridad Requerida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(credentials?.endpoints || [
                          { method: "GET", path: "/api/projects", description: "Listado de operaciones y proyectos", auth: "Bearer Token" },
                          { method: "POST", path: "/api/projects", description: "Crear una nueva operación", auth: "Bearer Token" },
                          { method: "GET", path: "/api/projects/:id/analysis", description: "Análisis táctico y cumplimiento", auth: "Bearer Token" },
                          { method: "POST", path: "/api/projects/:id/context", description: "Evaluación contextual estratégica", auth: "Token o X-Api-Key" },
                          { method: "POST", path: "/api/chat", description: "Asistente de Inteligencia Estratégica Sanzu", auth: "Bearer Token" },
                          { method: "GET", path: "/api/partner/projects/:externalRef", description: "Sincronización entre plataformas", auth: "X-Api-Key" },
                        ]).map((ep, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className={`endpoint-method ${ep.method.toLowerCase()}`}>{ep.method}</span>
                            </td>
                            <td>
                              <code className="code-mono" style={{ fontSize: "12px", color: "var(--rose-sanzu)" }}>{ep.path}</code>
                            </td>
                            <td style={{ color: "var(--text-secondary)" }}>{ep.description}</td>
                            <td>
                              <span className="kicker-tag" style={{ fontSize: "10px" }}>{ep.auth}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expediente Editorial Confidencial */}
          <aside className="dossier-card corner-accent" style={{ marginTop: "40px" }} aria-label="Directiva de marca">
            <span className="kicker-tag">DIRECTIVA EJECUTIVA // SANZU</span>
            <p className="dossier-quote">
              “El progreso empieza cuando el siguiente paso es evidente. El caos no se tolera: se domina.”
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 12px", lineHeight: "1.6" }}>
              Cada iniciativa en Sanzu se evalúa bajo un régimen de estricta visibilidad. Las métricas eliminan la ambigüedad,
              las alertas señalan contingencias antes de que se vuelvan irreversibles y la estrategia gobierna cada decisión.
            </p>
            <div className="dossier-attribution">
              — PROTOCOLO ESTRATÉGICO SANZU · DIVISIÓN DE GOBERNANZA
            </div>
          </aside>
        </section>
      </main>
    );
  }

  /* =========================================================================
     VISTA PÚBLICA / LANDING (IDENTIDAD ESTRATÉGICA)
     ========================================================================= */
  return (
    <div className="landing-shell">
      {/* Barra Superior Táctica */}
      <header className="command-nav">
        <div className="nav-brand">
          <div className="brand-mark" aria-label="Logo Sanzu">
            <img src="/sanzu.png" alt="Sanzu Logo" className="brand-logo-img" />
          </div>
          <div className="nav-brand-title">
            <strong>HARUCHIYO / SANZU</strong>
            <small>Centro de Comando Estratégico</small>
          </div>
        </div>

        <nav className="nav-center-links" aria-label="Navegación principal">
          <a href="#capacidades">Capacidades</a>
          <a href="#manifiesto">Manifiesto</a>
          <a href="#acceso-api" onClick={(e) => { e.preventDefault(); switchMode("login"); }}>
            Acceso API (Key, Token, URL)
          </a>
          <a href="/api/health" target="_blank" rel="noreferrer">
            Estado API
          </a>
        </nav>

        <div className="nav-actions">
          <span className="status-pill">
            <span className="status-dot-pulse" />
            ONLINE
          </span>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title="Alternar tema"
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="btn-pill btn-pill-sm btn-pill-rose"
            onClick={() => switchMode(mode === "register" ? "login" : "register")}
          >
            {mode === "register" ? "Iniciar sesión" : "Registro"}
          </button>
        </div>
      </header>

      {/* Hero Principal con Eslogan Oficial */}
      <main className="hero-section">
        <div className="page-container">
          <div className="hero-grid">
            {/* Columna Izquierda: Mensaje de Marca & Artefactos Flotantes */}
            <section className="hero-copy" aria-label="Presentación de Sanzu">
              <span className="kicker-tag">CENTRO DE COMANDO · INTELIGENCIA OPERATIVA</span>
              <h1>
                EL CAOS OBEDECE.
                <br />
                <em>LA ESTRATEGIA DECIDE.</em>
              </h1>
              <p className="hero-lead">
                Tu centro de comando inteligente para transformar iniciativas complejas en proyectos bajo control.
                Planifica con metodologías ágiles, anticipa riesgos y ejecuta cada movimiento con precisión estratégica,
                respaldado por inteligencia contextual en tiempo real.
              </p>

              <div className="hero-btn-row">
                <button
                  type="button"
                  className="btn-pill btn-pill-rose"
                  onClick={() => switchMode("register")}
                >
                  Registro →
                </button>
                <button
                  type="button"
                  className="btn-pill btn-pill-ghost"
                  onClick={() => switchMode("login")}
                >
                  Iniciar sesión
                </button>
              </div>

              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="code-mono" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  Acceso programático REST: obtén tu API Key, URL y Token de sesión en el Centro de Comando.
                </span>
              </div>

              {/* Artefactos Tácticos Flotantes */}
              <div className="hero-artifacts-row">
                {/* Artefacto 1: Radar de Salud */}
                <div className="artifact-box corner-accent">
                  <div className="artifact-header">
                    <span className="kicker-tag" style={{ fontSize: "10px" }}>RADAR DE SALUD</span>
                    <span className="status-pill" style={{ fontSize: "9px" }}>ACTIVO</span>
                  </div>
                  <div className="artifact-metric-val">98.4%</div>
                  <div className="artifact-sub">+14.2% Eficiencia táctica</div>
                  <svg className="sparkline-svg" viewBox="0 0 200 40" fill="none" aria-hidden="true">
                    <path
                      d="M2 34 Q 35 30, 65 20 T 115 24 T 155 10 T 198 4"
                      stroke="var(--rose-sanzu)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M2 34 Q 35 30, 65 20 T 115 24 T 155 10 T 198 4 V 40 H 2 Z"
                      fill="url(#sanzu-glow)"
                      opacity="0.25"
                    />
                    <defs>
                      <linearGradient id="sanzu-glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--rose-sanzu)" />
                        <stop offset="100%" stopColor="var(--rose-sanzu)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Artefacto 2: Consola de IA Contextual */}
                <div className="artifact-box">
                  <div className="artifact-header">
                    <span className="kicker-tag violet" style={{ fontSize: "10px" }}>IA CONTEXTUAL</span>
                    <span className="code-mono" style={{ fontSize: "10px", color: "var(--rose-sanzu)" }}>SANZU-CORE</span>
                  </div>
                  <div style={{ background: "var(--bg-elevated)", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", margin: "8px 0" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>«Evaluando cadencia de sprint...»</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                    <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--rose-muted)", color: "var(--rose-sanzu)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: "bold" }}>S</span>
                    <span className="code-mono" style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Nivel: Estratégico</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Columna Derecha: Tarjeta de Acceso Seguro */}
            <div className="auth-panel-wrap">
              <section className="auth-card corner-accent" aria-label="Portal de acceso seguro">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span className="kicker-tag">PORTAL DE AUTENTICACIÓN</span>
                  <span className="status-pill">SEGURO</span>
                </div>

                {/* Pestañas de Cambio de Modo */}
                <div className="mode-tab-pills" role="tablist">
                  <button
                    type="button"
                    className={mode === "register" ? "active" : ""}
                    onClick={() => switchMode("register")}
                    role="tab"
                    aria-selected={mode === "register"}
                  >
                    REGISTRO
                  </button>
                  <button
                    type="button"
                    className={mode === "login" ? "active" : ""}
                    onClick={() => switchMode("login")}
                    role="tab"
                    aria-selected={mode === "login"}
                  >
                    INICIAR SESIÓN
                  </button>
                </div>

                <h2>{mode === "register" ? "Registro" : "Iniciar sesión"}</h2>
                <p className="auth-desc">
                  {mode === "register"
                    ? "Toma el control de tus iniciativas con rigor y claridad metodológica."
                    : "Accede al centro de comando para supervisar tus operaciones activas."}
                </p>

                <form onSubmit={mode === "register" ? register : login}>
                  {mode === "register" && (
                    <div className="form-group">
                      <label htmlFor="name">Nombre completo</label>
                      <input
                        id="name"
                        name="name"
                        autoComplete="name"
                        placeholder="Ej. Haruchiyo Sanzu"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        required
                        minLength={2}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nombre@empresa.com"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Clave de acceso</label>
                    <div className="password-input-wrap">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Clave de acceso"}
                        value={form.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        required
                        minLength={mode === "register" ? 8 : undefined}
                      />
                      <button
                        type="button"
                        className="reveal-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                      >
                        {showPassword ? "OCULTAR" : "MOSTRAR"}
                      </button>
                    </div>
                  </div>

                  <button className="submit-button" type="submit" disabled={status === "loading"}>
                    {status === "loading"
                      ? "VERIFICANDO CREDENCIALES..."
                      : mode === "register"
                      ? "REGISTRARSE  →"
                      : "INICIAR SESIÓN  →"}
                  </button>
                </form>

                {status === "success" && (
                  <div className="feedback-box success" role="status">
                    <strong>Operación completada</strong>
                    <span>Credenciales autorizadas. Accediendo al entorno de mando...</span>
                    <code>{result?.data?.token}</code>
                  </div>
                )}

                {status === "error" && (
                  <div className="feedback-box error" role="alert">
                    <strong>Ejecución interrumpida</strong>
                    <span>{result?.error?.message || "Revisa los datos e inténtalo de nuevo."}</span>
                  </div>
                )}

                <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                  {mode === "register" ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?"}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === "register" ? "login" : "register")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--rose-sanzu)",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    {mode === "register" ? "Inicia sesión" : "Regístrate"}
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* Expediente Editorial Confidencial */}
          <aside className="dossier-card corner-accent" id="manifiesto" style={{ marginTop: "50px" }} aria-label="Manifiesto">
            <span className="kicker-tag">MANIFIESTO // LA DOCTRINA DE CONTROL</span>
            <p className="dossier-quote">
              “El progreso empieza cuando el siguiente paso es evidente. El caos no se tolera: se domina.”
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", margin: "0 0 16px", lineHeight: "1.65" }}>
              Sanzu no concibe la gestión de proyectos como una lista desordenada de tareas, sino como un tablero
              de decisiones inequívocas. Unificamos la exactitud de Scrum y Kanban con la asistencia contextual
              para que tu equipo ejecute con cadencia implacable.
            </p>
            <div className="dossier-attribution">
              — DIRECTIVA ESTRATÉGICA · PROTOCOLO HARUCHIYO SANZU
            </div>
          </aside>

          {/* Capacidades Nativas / Grid */}
          <section id="capacidades" style={{ marginTop: "60px", paddingBottom: "40px" }} aria-label="Capacidades">
            <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 40px" }}>
              <span className="kicker-tag">ARQUITECTURA DE MANDO</span>
              <h2 style={{ marginTop: "8px" }}>Estructura diseñada para la precisión real.</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              <article className="tactical-card">
                <span className="kicker-tag" style={{ color: "var(--rose-sanzu)", marginBottom: "12px" }}>01 // MARCOS DE TRABAJO</span>
                <h4>Metodologías con Criterio</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.55", margin: "8px 0" }}>
                  Scrum, Kanban, XP y Lean adaptativos para asegurar metas de sprint inviolables y cadencias predecibles.
                </p>
              </article>

              <article className="tactical-card">
                <span className="kicker-tag" style={{ color: "var(--status-cyan)", marginBottom: "12px" }}>02 // DIAGNÓSTICO EN VIVO</span>
                <h4>Detección de Amenazas</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.55", margin: "8px 0" }}>
                  Métricas determinísticas de salud que detectan cuellos de botella antes de que afecten la entrega.
                </p>
              </article>

              <article className="tactical-card">
                <span className="kicker-tag" style={{ color: "var(--violet-somber)", marginBottom: "12px" }}>03 // COPILOTO ESTRATÉGICO</span>
                <h4>Inteligencia Contextual</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.55", margin: "8px 0" }}>
                  Asistente IA analítico que evalúa las tareas, dependencias y riesgos del proyecto sin divagaciones.
                </p>
              </article>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}