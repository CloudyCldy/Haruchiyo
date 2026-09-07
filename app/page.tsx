"use client";

import { FormEvent, useState } from "react";

type ApiResult = { success?: boolean; data?: { token?: string; user?: { name?: string; email?: string } }; error?: { message?: string } };

export default function HomePage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");

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
      if (response.ok && data.data?.token) window.localStorage.setItem("sanzu_token", data.data.token);
      setResult(data);
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
      setResult({ error: { message: "No se pudo conectar con Sanzu." } });
    }
  }

  function switchMode(nextMode: "register" | "login") {
    setMode(nextMode);
    setStatus("idle");
    setResult(null);
    if (nextMode === "login") setForm((current) => ({ ...current, name: "" }));
  }

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