"use client";

import { FormEvent, useEffect, useState } from "react";

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

type Project = {
  id: string;
  name: string;
  description?: string;
  status: string;
  methodology?: { name: string };
};

type Methodology = {
  id: string;
  name: string;
  description: string;
};

export default function HomePage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);
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

  useEffect(() => {
    const token = window.localStorage.getItem("sanzu_token");
    if (token) loadWorkspace(token);
    fetch("/api/methodologies")
      .then((response) => response.json())
      .then((payload) => setMethodologies(payload.data || []))
      .catch(() => undefined);
  }, []);

  async function loadWorkspace(token: string) {
    const headers = { Authorization: `Bearer ${token}` };
    const [profileResponse, projectsResponse] = await Promise.all([
      fetch("/api/users/me", { headers }),
      fetch("/api/projects", { headers }),
    ]);
    if (!profileResponse.ok || !projectsResponse.ok) {
      window.localStorage.removeItem("sanzu_token");
      return;
    }
    const profilePayload = await profileResponse.json();
    const projectsPayload = await projectsResponse.json();
    setProfile(profilePayload.data);
    setProjects(projectsPayload.data || []);
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
      setResult({ error: { message: "No se pudo conectar con Sanzu." } });
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
      setResult({ error: { message: "No se pudo conectar con Sanzu." } });
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
        throw new Error(payload.error?.message || "No se pudo crear el proyecto.");
      }
      setProjects((current) => [payload.data, ...current]);
      setProjectForm({
        name: "",
        description: "",
        methodologyId: projectForm.methodologyId,
        startDate: "",
        endDate: "",
      });
      setProjectMessage("Proyecto registrado correctamente.");
      setProjectStatus("success");
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : "No se pudo crear el proyecto.");
      setProjectStatus("error");
    }
  }

  function logout() {
    window.localStorage.removeItem("sanzu_token");
    setProfile(null);
    setProjects([]);
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

  /* -------------------------------------------------------------
     WORKSPACE VIEW (Logged In)
     ------------------------------------------------------------- */
  if (profile) {
    return (
      <main className="workspace-shell">
        <header className="steep-nav">
          <div className="nav-brand">
            <div className="brand-mark">
              <img src="/sanzu.png" alt="Sanzu Logo" className="brand-logo-img" />
            </div>
            <div className="nav-brand-title">
              <strong>SANZU</strong>
              <small>Workspace · Command Center</small>
            </div>
          </div>

          <div className="nav-right">
            <div className="profile-chip">
              <span className="profile-avatar">
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="profile-meta">
                <b>{profile.name}</b>
                <small>{profile.email}</small>
              </span>
              <span className="role-badge">{profile.role.replace("_", " ")}</span>
              <button
                type="button"
                className="btn-pill btn-pill-sm btn-pill-ghost"
                onClick={logout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <section className="workspace-content">
          <div className="workspace-intro">
            <div>
              <p className="eyebrow">CENTRO DE MANDO</p>
              <h2>
                Hola, <em>{profile.name.split(" ")[0]}</em>.
              </h2>
              <p>Monitorea y crea proyectos con directrices metodológicas ágiles.</p>
            </div>
          </div>

          {/* Quick Metrics Floating Artifacts Bar */}
          <div className="workspace-kpi-bar">
            <div className="kpi-artifact-card">
              <div>
                <div className="kpi-label">Proyectos Registrados</div>
                <div className="kpi-val">{projects.length}</div>
              </div>
              <span className="kpi-badge teal">Activo</span>
            </div>

            <div className="kpi-artifact-card">
              <div>
                <div className="kpi-label">Metodología Base</div>
                <div className="kpi-val" style={{ fontSize: "22px" }}>
                  {methodologies.length > 0 ? "Scrum & Kanban" : "Ágil"}
                </div>
              </div>
              <span className="kpi-badge blush">Estandarizado</span>
            </div>

            <div className="kpi-artifact-card">
              <div>
                <div className="kpi-label">Motor de Inteligencia</div>
                <div className="kpi-val" style={{ fontSize: "22px" }}>
                  Sanzu AI
                </div>
              </div>
              <span className="status-dot">Online</span>
            </div>
          </div>

          <div className="workspace-grid">
            {/* Left Card: Form */}
            <section className="project-form-card">
              <div className="section-kicker">
                <span>NUEVO PROYECTO</span>
                <span>01</span>
              </div>
              <h3>Registra tu proyecto</h3>
              <p className="card-copy">
                La metodología define las reglas, métricas y recomendaciones automáticas de Sanzu.
              </p>

              <form onSubmit={createProject}>
                <div className="input-field">
                  <label htmlFor="project-name">Nombre del proyecto</label>
                  <input
                    id="project-name"
                    value={projectForm.name}
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, name: event.target.value })
                    }
                    placeholder="Ej. Plataforma de pagos global"
                    required
                  />
                </div>

                <div className="input-field">
                  <label htmlFor="methodology">Metodología</label>
                  <select
                    id="methodology"
                    value={projectForm.methodologyId}
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, methodologyId: event.target.value })
                    }
                  >
                    {(methodologies.length
                      ? methodologies
                      : [
                          { id: "SCRUM", name: "Scrum", description: "" },
                          { id: "KANBAN", name: "Kanban", description: "" },
                        ]
                    ).map((methodology) => (
                      <option key={methodology.id} value={methodology.id}>
                        {methodology.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-field">
                  <label htmlFor="project-description">
                    Descripción <span className="optional">(OPCIONAL)</span>
                  </label>
                  <textarea
                    id="project-description"
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm({ ...projectForm, description: event.target.value })
                    }
                    placeholder="¿Cuáles son los objetivos y alcances clave?"
                    rows={3}
                  />
                </div>

                <div className="date-grid">
                  <div className="input-field">
                    <label htmlFor="start-date">
                      Inicio <span className="optional">(OPCIONAL)</span>
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={projectForm.startDate}
                      onChange={(event) =>
                        setProjectForm({ ...projectForm, startDate: event.target.value })
                      }
                    />
                  </div>
                  <div className="input-field">
                    <label htmlFor="end-date">
                      Entrega <span className="optional">(OPCIONAL)</span>
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={projectForm.endDate}
                      onChange={(event) =>
                        setProjectForm({ ...projectForm, endDate: event.target.value })
                      }
                    />
                  </div>
                </div>

                <button
                  className="submit-button"
                  type="submit"
                  disabled={projectStatus === "loading"}
                >
                  {projectStatus === "loading" ? "REGISTRANDO..." : "REGISTRAR PROYECTO  →"}
                </button>
              </form>

              {projectMessage && (
                <div
                  className={`feedback ${projectStatus}`}
                  role={projectStatus === "error" ? "alert" : "status"}
                >
                  {projectMessage}
                </div>
              )}
            </section>

            {/* Right Card: Projects List */}
            <section className="projects-card">
              <div className="section-kicker">
                <span>PORTAFOLIO</span>
                <span>{String(projects.length).padStart(2, "0")}</span>
              </div>
              <h3>Proyectos registrados</h3>
              <p className="card-copy">
                Gestiona y consulta identificadores de tus proyectos activos.
              </p>

              {projects.length === 0 ? (
                <div className="empty-projects">
                  <div className="empty-projects-icon">＋</div>
                  <p>
                    Aún no tienes proyectos registrados.
                    <br />
                    Comienza definiendo tu primera iniciativa.
                  </p>
                </div>
              ) : (
                <div className="project-list">
                  {projects.map((project) => (
                    <article className="project-row" key={project.id}>
                      <div className="project-icon" aria-hidden="true">
                        {project.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="project-info">
                        <strong>{project.name}</strong>
                        <span className="project-methodology-tag">
                          {project.methodology?.name || project.status}
                        </span>
                      </div>
                      <div className="project-id-actions">
                        <span className="project-id-code" title={project.id}>
                          ID: {project.id}
                        </span>
                        <button
                          type="button"
                          className={`copy-pill-btn ${
                            copiedProjectId === project.id ? "copied" : ""
                          }`}
                          onClick={() => copyProjectId(project.id)}
                          aria-label={`Copiar ID del proyecto ${project.name}`}
                        >
                          {copiedProjectId === project.id ? "Copiado ✓" : "Copiar ID"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Steep Editorial Kraft Accent Card (Rare, exactly one per page) */}
          <aside className="steep-accent-card" aria-label="Nota editorial Sanzu">
            <div className="accent-card-inner">
              <span className="tag-label">CONSEJO METODOLÓGICO</span>
              <p className="accent-quote">
                “La disciplina ágil no consiste en añadir reuniones, sino en acortar el bucle de retroalimentación.”
              </p>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "var(--ink)" }}>
                Al asignar una metodología como Scrum o Kanban a tu proyecto, el motor de Sanzu supervisa
                automáticamente los límites de trabajo en curso (WIP) y evalúa los entregables según listas de control
                verificables.
              </p>
              <div className="accent-attribution" style={{ marginTop: "12px" }}>
                — Sanzu Project Framework & Intelligence
              </div>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  /* -------------------------------------------------------------
     PUBLIC LANDING VIEW (Steep Editorial Collage)
     ------------------------------------------------------------- */
  return (
    <div className="landing-shell">
      {/* Top Editorial Nav */}
      <header className="steep-nav">
        <div className="nav-brand">
          <div className="brand-mark">
            <img src="/sanzu.png" alt="Sanzu Logo" className="brand-logo-img" />
          </div>
          <div className="nav-brand-title">
            <strong>SANZU</strong>
            <small>Project Command Center</small>
          </div>
        </div>

        <nav className="nav-center" aria-label="Navegación principal">
          <a href="#features">Metodologías</a>
          <a href="#manifiesto">Manifiesto</a>
          <a href="/api/health" target="_blank" rel="noreferrer">
            Estado API
          </a>
        </nav>

        <div className="nav-right">
          <span className="status-dot">API ONLINE</span>
          <button
            type="button"
            className="btn-pill btn-pill-sm btn-pill-filled"
            onClick={() => switchMode(mode === "register" ? "login" : "register")}
          >
            {mode === "register" ? "Entrar" : "Crear cuenta"}
          </button>
        </div>
      </header>

      {/* Hero Section with Editorial Collage */}
      <main className="landing-hero">
        <div className="page-container">
          <div className="hero-layout">
            {/* Left: Editorial Content & Floating Artifacts */}
            <section className="hero-editorial" aria-label="Introducción">
              <p className="eyebrow">PROJECT COMMAND CENTER · v1.0</p>
              <h1>
                Organiza el caos.
                <br />
                <em>Dirige con claridad.</em>
              </h1>
              <p className="hero-lead">
                Tu espacio inteligente para estructurar, auditar y ejecutar iniciativas bajo metodologías
                ágiles comprobadas y asistencia contextual en tiempo real.
              </p>

              {/* Matched Pill Buttons Pair */}
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn-pill btn-pill-filled"
                  onClick={() => switchMode("register")}
                >
                  Empezar ahora →
                </button>
                <button
                  type="button"
                  className="btn-pill btn-pill-ghost"
                  onClick={() => switchMode("login")}
                >
                  Iniciar sesión
                </button>
              </div>

              {/* Floating Product Artifacts Collage (Steep signature) */}
              <div className="artifacts-collage">
                {/* Artifact 1: Stat with Sparkline Line */}
                <div className="floating-artifact">
                  <div className="artifact-kicker">
                    <span>Métrica de Salud</span>
                    <span style={{ color: "var(--hair)" }}>● EN VIVO</span>
                  </div>
                  <div className="artifact-metric">98.4%</div>
                  <div className="artifact-delta">↑ +14.2% vs ciclo anterior</div>
                  <svg
                    className="artifact-sparkline"
                    viewBox="0 0 200 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 34 Q 30 30, 60 22 T 110 26 T 150 10 T 198 4"
                      stroke="var(--hair)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M2 34 Q 30 30, 60 22 T 110 26 T 150 10 T 198 4 V 40 H 2 Z"
                      fill="url(#sparkline-grad)"
                      opacity="0.18"
                    />
                    <defs>
                      <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--hair)" />
                        <stop offset="100%" stopColor="var(--hair)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Artifact 2: AI Composer fragment & Presence */}
                <div className="floating-artifact composer-artifact">
                  <div>
                    <div className="artifact-kicker">
                      <span>Asistente Sanzu</span>
                      <span style={{ color: "var(--teal)" }}>IA Contextual</span>
                    </div>
                    <div className="composer-fake-input">
                      <span>Pregúntale al copiloto…</span>
                      <div className="composer-send-btn">→</div>
                    </div>
                  </div>

                  <div className="avatar-presence">
                    <span className="avatar-circle">CL</span>
                    <span className="avatar-cursor-tag">Modo Scrum activo</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Right: Auth Card (Steep Elevated Soft Card) */}
            <div className="auth-card-wrap">
              <section className="auth-card" aria-label="Acceso al sistema">
                <div className="auth-topline">
                  <span className="tag-label">ACCESO SEGURO</span>
                  <span className="status-dot">LISTO</span>
                </div>

                {/* Mode Switch Pill */}
                <div className="mode-switch-pill" role="tablist">
                  <button
                    type="button"
                    className={mode === "register" ? "active" : ""}
                    onClick={() => switchMode("register")}
                    role="tab"
                    aria-selected={mode === "register"}
                  >
                    Registro
                  </button>
                  <button
                    type="button"
                    className={mode === "login" ? "active" : ""}
                    onClick={() => switchMode("login")}
                    role="tab"
                    aria-selected={mode === "login"}
                  >
                    Iniciar Sesión
                  </button>
                </div>

                <h2>{mode === "register" ? "Crea tu cuenta" : "Entra a Sanzu"}</h2>
                <p className="auth-subtitle">
                  {mode === "register"
                    ? "Empieza a darle dirección y estructura a tus proyectos."
                    : "Continúa supervisando tus iniciativas en progreso."}
                </p>

                <form onSubmit={mode === "register" ? register : login}>
                  {mode === "register" && (
                    <div className="input-field">
                      <label htmlFor="name">Nombre completo</label>
                      <input
                        id="name"
                        name="name"
                        autoComplete="name"
                        placeholder="Tu nombre y apellido"
                        value={form.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        required
                        minLength={2}
                      />
                    </div>
                  )}

                  <div className="input-field">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nombre@empresa.com"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      required
                    />
                  </div>

                  <div className="input-field">
                    <label htmlFor="password">Contraseña</label>
                    <div className="password-field">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={
                          mode === "register" ? "new-password" : "current-password"
                        }
                        placeholder={
                          mode === "register" ? "Mínimo 8 caracteres" : "Tu clave de acceso"
                        }
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        required
                        minLength={mode === "register" ? 8 : undefined}
                      />
                      <button
                        type="button"
                        className="show-password"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? "OCULTAR" : "MOSTRAR"}
                      </button>
                    </div>
                  </div>

                  <button
                    className="submit-button"
                    type="submit"
                    disabled={status === "loading"}
                  >
                    {status === "loading"
                      ? "CONECTANDO..."
                      : mode === "register"
                      ? "CREAR CUENTA  →"
                      : "INICIAR SESIÓN  →"}
                  </button>
                </form>

                {status === "success" && (
                  <div className="feedback success" role="status">
                    <strong>
                      {mode === "register"
                        ? `Cuenta creada, ${result?.data?.user?.name}.`
                        : `Bienvenido, ${result?.data?.user?.name || result?.data?.user?.email}.`}
                    </strong>
                    <span>Token generado con éxito para el entorno de trabajo.</span>
                    <code>{result?.data?.token}</code>
                  </div>
                )}

                {status === "error" && (
                  <div className="feedback error" role="alert">
                    {result?.error?.message || "Revisa los datos e inténtalo de nuevo."}
                  </div>
                )}

                <p className="login-note">
                  {mode === "register" ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?"}{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => switchMode(mode === "register" ? "login" : "register")}
                  >
                    {mode === "register" ? "Inicia sesión" : "Regístrate"}
                  </button>
                </p>

                <p className="legal">
                  Al continuar aceptas las condiciones operativas de Sanzu.
                </p>
              </section>
            </div>
          </div>

          {/* Steep Editorial Accent Card (Single rare highlight) */}
          <aside className="steep-accent-card" id="manifiesto" aria-label="Manifiesto">
            <div className="accent-card-inner">
              <span className="tag-label">MANIFIESTO EDITORIAL</span>
              <p className="accent-quote">
                “El progreso empieza cuando el siguiente paso es evidente.”
              </p>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", color: "var(--ink)" }}>
                Sanzu concibe la gestión de proyectos no como un tablero saturado de tareas, sino como un libro
                de decisiones claras. Unimos la certeza de Scrum y Kanban con la asistencia contextual de la IA
                para que tu equipo se concentre exclusivamente en entregar valor con cadencia sostenida.
              </p>
              <div className="accent-attribution" style={{ marginTop: "16px" }}>
                — Dirección y Filosofía Sanzu
              </div>
            </div>
          </aside>

          {/* Feature Grid - Neutral Cards (24px radius) */}
          <section className="features-section" id="features" aria-label="Características clave">
            <div className="features-header">
              <span className="eyebrow">CAPACIDADES NATIVAS</span>
              <h2>Estructura diseñada para la agilidad real.</h2>
            </div>

            <div className="features-grid">
              <article className="neutral-card">
                <div>
                  <div className="feature-num">01 / MARCOS DE TRABAJO</div>
                  <h4>Metodologías con Criterio</h4>
                  <p>
                    Scrum, Kanban y reglas ágiles adaptativas integradas para alinear metas de sprint y ritmos de entrega.
                  </p>
                </div>
                <a href="#features" className="text-link">
                  Conocer marcos →
                </a>
              </article>

              <article className="neutral-card">
                <div>
                  <div className="feature-num">02 / DIAGNÓSTICO</div>
                  <h4>Salud en Tiempo Real</h4>
                  <p>
                    Detección proactiva de cuellos de botella, desviaciones de velocidad y evaluación de cumplimiento.
                  </p>
                </div>
                <a href="#features" className="text-link">
                  Ver analíticas →
                </a>
              </article>

              <article className="neutral-card">
                <div>
                  <div className="feature-num">03 / COPILOTO IA</div>
                  <h4>Asistente Contextual</h4>
                  <p>
                    Recomendaciones inteligentes que entienden tus tareas, bloqueos y dependencias directas en cada ciclo.
                  </p>
                </div>
                <a href="#features" className="text-link">
                  Descubrir IA →
                </a>
              </article>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}