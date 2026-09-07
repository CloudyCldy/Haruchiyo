"use client";

import { FormEvent, useState } from "react";

type ApiResult = { success?: boolean; data?: { token?: string; user?: { name?: string } }; error?: { message?: string } };

export default function HomePage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
          <h2>Crea tu cuenta</h2>
          <p className="intro">Empieza a darle dirección a tus proyectos.</p>
          <form onSubmit={register}>
            <label htmlFor="name">Nombre completo</label>
            <input id="name" name="name" autoComplete="name" placeholder="Tu nombre" value={form.name} onChange={(event) => updateField("name", event.target.value)} required minLength={2} />
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={8} />
              <button type="button" className="show-password" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? "OCULTAR" : "MOSTRAR"}</button>
            </div>
            <button className="submit-button" type="submit" disabled={status === "loading"}>{status === "loading" ? "CREANDO CUENTA..." : "CREAR CUENTA  →"}</button>
          </form>
          {status === "success" && <div className="feedback success" role="status"><strong>Cuenta creada, {result?.data?.user?.name}.</strong><span>Tu token está listo para usar en las peticiones de la API.</span><code>{result?.data?.token}</code></div>}
          {status === "error" && <div className="feedback error" role="alert">{result?.error?.message || "Revisa los datos e inténtalo de nuevo."}</div>}
          <p className="login-note">¿Ya tienes una cuenta? <a href="/api/auth/login">Inicia sesión vía API</a></p>
          <p className="legal">Al continuar aceptas los términos de uso de Sanzu.</p>
        </div>
      </section>
    </main>
  );
}