"use client";

import { FormEvent, useEffect, useState } from "react";

type ApiResult = { success?: boolean; data?: { token?: string; user?: { name?: string; email?: string } }; error?: { message?: string } };
type Profile = { id: string; name: string; email: string; role: string };
type Project = { id: string; name: string; description?: string; status: string; methodology?: { name: string } };
type Methodology = { id: string; name: string; description: string };

export default function HomePage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", methodologyId: "SCRUM", startDate: "", endDate: "" });
  const [projectStatus, setProjectStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [projectMessage, setProjectMessage] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("sanzu_token");
    if (token) loadWorkspace(token);
    fetch("/api/methodologies").then((response) => response.json()).then((payload) => setMethodologies(payload.data || [])).catch(() => undefined);
  }, []);

  async function loadWorkspace(token: string) {
    const headers = { Authorization: `Bearer ${token}` };
    const [profileResponse, projectsResponse] = await Promise.all([fetch("/api/users/me", { headers }), fetch("/api/projects", { headers })]);
    if (!profileResponse.ok || !projectsResponse.ok) { window.localStorage.removeItem("sanzu_token"); return; }
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
      if (response.ok && data.data?.token) { window.localStorage.setItem("sanzu_token", data.data.token); await loadWorkspace(data.data.token); }
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
      if (response.ok && data.data?.token) { window.localStorage.setItem("sanzu_token", data.data.token); await loadWorkspace(data.data.token); }
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
      const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...projectForm, startDate: projectForm.startDate || undefined, endDate: projectForm.endDate || undefined }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "No se pudo crear el proyecto.");
      setProjects((current) => [payload.data, ...current]);
      setProjectForm({ name: "", description: "", methodologyId: projectForm.methodologyId, startDate: "", endDate: "" });
      setProjectMessage("Proyecto registrado correctamente.");
      setProjectStatus("success");
    } catch (error) { setProjectMessage(error instanceof Error ? error.message : "No se pudo crear el proyecto."); setProjectStatus("error"); }
  }

  function logout() { window.localStorage.removeItem("sanzu_token"); setProfile(null); setProjects([]); setStatus("idle"); setMode("login"); }

  function switchMode(nextMode: "register" | "login") {
    setMode(nextMode);
    setStatus("idle");
    setResult(null);
    if (nextMode === "login") setForm((current) => ({ ...current, name: "" }));
  }

  if (profile) return (
    <main className="workspace-shell">
      <header className="workspace-header"><div className="workspace-brand"><div className="brand-mark"><span>S</span></div><div><p className="eyebrow">SANZU / WORKSPACE</p><strong>Project command center</strong></div></div><div className="profile-chip"><span className="avatar">{profile.name.slice(0, 1).toUpperCase()}</span><span><b>{profile.name}</b><small>{profile.email}</small></span><button type="button" onClick={logout}>SALIR</button></div></header>
      <section className="workspace-content"><div className="workspace-intro"><div><p className="eyebrow">PERFIL DE USUARIO</p><h2>Hola, {profile.name.split(" ")[0]}.</h2><p>Registra un proyecto y empieza a darle dirección.</p></div><span className="role-badge">{profile.role.replace("_", " ")}</span></div>
        <div className="workspace-grid"><section className="project-form-card"><div className="section-kicker">NUEVO PROYECTO <span>01</span></div><h3>Registra tu proyecto</h3><p className="card-copy">La metodología define las reglas, métricas y recomendaciones de Sanzu.</p><form onSubmit={createProject}><label htmlFor="project-name">Nombre del proyecto</label><input id="project-name" value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} placeholder="Ej. Plataforma e-commerce" required /><label htmlFor="methodology">Metodología</label><select id="methodology" value={projectForm.methodologyId} onChange={(event) => setProjectForm({ ...projectForm, methodologyId: event.target.value })}>{(methodologies.length ? methodologies : [{ id: "SCRUM", name: "Scrum", description: "" }, { id: "KANBAN", name: "Kanban", description: "" }]).map((methodology) => <option key={methodology.id} value={methodology.id}>{methodology.name}</option>)}</select><label htmlFor="project-description">Descripción <span className="optional">OPCIONAL</span></label><textarea id="project-description" value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} placeholder="¿Qué quieres construir?" rows={3} /><div className="date-grid"><div><label htmlFor="start-date">Inicio <span className="optional">OPCIONAL</span></label><input id="start-date" type="date" value={projectForm.startDate} onChange={(event) => setProjectForm({ ...projectForm, startDate: event.target.value })} /></div><div><label htmlFor="end-date">Entrega <span className="optional">OPCIONAL</span></label><input id="end-date" type="date" value={projectForm.endDate} onChange={(event) => setProjectForm({ ...projectForm, endDate: event.target.value })} /></div></div><button className="submit-button" type="submit" disabled={projectStatus === "loading"}>{projectStatus === "loading" ? "REGISTRANDO..." : "REGISTRAR PROYECTO  →"}</button></form>{projectMessage && <div className={`feedback ${projectStatus}`} role={projectStatus === "error" ? "alert" : "status"}>{projectMessage}</div>}</section>
          <section className="projects-card"><div className="section-kicker">TUS PROYECTOS <span>{String(projects.length).padStart(2, "0")}</span></div><h3>Proyectos registrados</h3>{projects.length === 0 ? <div className="empty-projects"><span>＋</span><p>Aún no tienes proyectos.<br />El primero empieza aquí.</p></div> : <div className="project-list">{projects.map((project) => <article className="project-row" key={project.id}><div className="project-icon">{project.name.slice(0, 1).toUpperCase()}</div><div><strong>{project.name}</strong><span>{project.methodology?.name || project.status}</span></div><code title={project.id}>{project.id}</code></article>)}</div>}</section></div>
      </section>
    </main>
  );

  return (
    <main className="register-shell">
      <section className="brand-panel" aria-label="Sanzu">
        <div className="brand-mark"><span>S</span></div>
        <p className="eyebrow">PROJECT COMMAND CENTER</p>
        <h1>Organiza el caos.<br /><em>Dirige con claridad.</em></h1>
        <p className="brand-copy">Tu espacio inteligente para convertir grandes ideas en proyectos que avanzan.</p>
        <div className="signal-list" aria-label="Características">
          <span><b>01</b> Metodologías con criterio</span>
          <span><b>02</b> Salud del proyecto en tiempo real</span>
          <span><b>03</b> Un asistente que conoce tu contexto</span>
        </div>
        <div className="decor-line" />
        <p className="quote">“El progreso empieza cuando el siguiente paso es evidente.”</p>
      </section>

      <section className="form-panel">
        <div className="form-wrap">
          <div className="topline"><span>BIENVENIDO A SANZU</span><span className="status-dot">● API ONLINE</span></div>
          <div className="mode-switch" role="tablist" aria-label="Acceso a Sanzu">
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>REGISTRO</button>
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>LOGIN</button>
          </div>
          <h2>{mode === "register" ? "Crea tu cuenta" : "Entra a Sanzu"}</h2>
          <p className="intro">{mode === "register" ? "Empieza a darle dirección a tus proyectos." : "Continúa donde dejaste tus proyectos."}</p>
          <form onSubmit={mode === "register" ? register : login}>
            {mode === "register" && <><label htmlFor="name">Nombre completo</label>
            <input id="name" name="name" autoComplete="name" placeholder="Tu nombre" value={form.name} onChange={(event) => updateField("name", event.target.value)} required minLength={2} /></>}
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Tu contraseña"} value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={mode === "register" ? 8 : undefined} />
              <button type="button" className="show-password" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? "OCULTAR" : "MOSTRAR"}</button>
            </div>
            <button className="submit-button" type="submit" disabled={status === "loading"}>{status === "loading" ? "CONECTANDO..." : mode === "register" ? "CREAR CUENTA  →" : "INICIAR SESIÓN  →"}</button>
          </form>
          {status === "success" && <div className="feedback success" role="status"><strong>{mode === "register" ? `Cuenta creada, ${result?.data?.user?.name}.` : `Bienvenido, ${result?.data?.user?.name || result?.data?.user?.email}.`}</strong><span>Autenticación correcta. Tu token quedó guardado para las peticiones de la API.</span><code>{result?.data?.token}</code></div>}
          {status === "error" && <div className="feedback error" role="alert">{result?.error?.message || "Revisa los datos e inténtalo de nuevo."}</div>}
          <p className="login-note">{mode === "register" ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?"} <button type="button" className="text-button" onClick={() => switchMode(mode === "register" ? "login" : "register")}>{mode === "register" ? "Inicia sesión" : "Regístrate"}</button></p>
          <p className="legal">Al continuar aceptas los términos de uso de Sanzu.</p>
        </div>
      </section>
    </main>
  );
}