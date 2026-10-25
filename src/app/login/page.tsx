"use client";
import { FormEvent, useState } from "react";
import { ShieldCheck, UserRound, LockKeyhole, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, displayName, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Autentikasi gagal.");
      setSuccess(mode === "login" ? "Login berhasil. Membuka dashboard…" : "Akun berhasil dibuat. Membuka dashboard…");
      window.location.href = "/";
    } catch (e) { setError(e instanceof Error ? e.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page">
    <div className="auth-glow auth-glow-one" /><div className="auth-glow auth-glow-two" />
    <section className="auth-card glass-panel">
      <div className="auth-brand"><div className="auth-logo">V<span>C</span></div><div><b>VALEN CRASH</b><small><i /> BY KYZX DEVS</small></div></div>
      <div className="auth-eyebrow"><ShieldCheck size={13} /> SECURE ACCESS / AUTH REQUIRED</div>
      <h1>{mode === "login" ? <>Welcome <span>back.</span></> : <>Create your <span>identity.</span></>}</h1>
      <p className="auth-subtitle">{mode === "login" ? "Masuk ke workspace Valen Crash untuk melanjutkan." : "Buat akun untuk mengakses workspace Valen Crash."}</p>
      <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Login</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Register</button></div>
      <form onSubmit={submit}>
        {mode === "register" && <label className="auth-label">Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={32} placeholder="Nama tampilan (opsional)" /></label>}
        <label className="auth-label">Username<div className="auth-input-wrap"><UserRound size={16}/><input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" minLength={3} maxLength={24} placeholder="username" required /></div></label>
        <label className="auth-label">Password<div className="auth-input-wrap"><LockKeyhole size={16}/><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={128} placeholder="Minimal 8 karakter" required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
        {error && <div className="auth-alert auth-error">{error}</div>}{success && <div className="auth-alert auth-success">{success}</div>}
        <button className="auth-submit" disabled={busy}>{busy ? <><span className="spinner"/> Memproses…</> : <>{mode === "login" ? "Login ke dashboard" : "Buat akun"} <ArrowRight size={16}/></>}</button>
      </form>
      <div className="auth-foot"><Sparkles size={13}/> Akun tersimpan di private GitHub repository.</div>
      <p className="auth-security">Session terenkripsi · Password di-hash · HTTPS direkomendasikan</p>
    </section>
    <div className="auth-copyright">VALEN CRASH <span>—</span> KYZX DEVS</div>
  </main>;
}
