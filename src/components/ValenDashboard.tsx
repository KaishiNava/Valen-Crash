 "use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, ArrowUpRight, AudioLines, Check, ChevronRight, CircleUserRound,
  Command, Gauge, LayoutDashboard, Menu, Moon, Settings2, Shield, SlidersHorizontal,
  Sparkles, Terminal, Wrench, X, Clock3, Globe2, LockKeyhole, Play, Pause, ExternalLink
} from "lucide-react";

type Section = "dashboard" | "bug" | "tools" | "profile";
type SiteSettings = {
  bannerUrl: string;
  backgroundUrl: string;
  tickerText: string;
  showEffects: boolean;
};

const defaults: SiteSettings = {
  bannerUrl: "",
  backgroundUrl: "",
  tickerText: "Selamat datang di Valen Crash By KyZX Devs",
  showEffects: true
};

const navItems: { id: Section; label: string; hint: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", hint: "Overview", icon: LayoutDashboard },
  { id: "bug", label: "Bug Menu", hint: "Authorized testing", icon: Shield },
  { id: "tools", label: "Tools Menu", hint: "Utilities", icon: Wrench },
  { id: "profile", label: "Profil", hint: "Your account", icon: CircleUserRound }
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand-mark ${small ? "brand-mark-small" : ""}`} aria-label="Valen Crash logo">
      <span className="brand-monogram">V<span>C</span></span>
      <span className="brand-cut" />
    </div>
  );
}

function VideoLayer({ src, className = "" }: { src: string; className?: string }) {
  if (!src.trim()) return null;
  return <video className={className} src={src} autoPlay muted loop playsInline aria-hidden="true" />;
}

export default function ValenDashboard() {
  const [section, setSection] = useState<Section>("dashboard");
  const [dockOpen, setDockOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [draft, setDraft] = useState<SiteSettings>(defaults);
  const [saved, setSaved] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("valen-crash-settings");
      if (stored) {
        const parsed = { ...defaults, ...JSON.parse(stored) } as SiteSettings;
        setSettings(parsed);
        setDraft(parsed);
      }
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      // Defaults remain available if local storage is disabled or invalid.
    }
  }, []);

  const openSettings = () => {
    setDraft(settings);
    setSaved(false);
    setSettingsOpen(true);
    setDockOpen(false);
  };

  const saveSettings = () => {
    setSettings(draft);
    try {
      localStorage.setItem("valen-crash-settings", JSON.stringify(draft));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  const changeSection = (next: Section) => {
    setSection(next);
    setDockOpen(false);
  };

  return (
    <main className={`app-shell ${settings.showEffects ? "effects-on" : "effects-off"}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <VideoLayer src={settings.backgroundUrl} className="background-video" />
      <div className="background-scrim" />

      <div className="page-wrap">
        <header className="topbar glass-panel">
          <div className="brand-lockup">
            <BrandMark small />
            <div>
              <div className="brand-name">VALEN <span>CRASH</span></div>
              <div className="brand-byline"><span className="status-dot" /> BY KYZX DEVS</div>
            </div>
          </div>
          <button className="icon-button settings-trigger" onClick={openSettings} aria-label="Buka pengaturan" title="Pengaturan">
            <Settings2 size={19} strokeWidth={1.8} />
          </button>
        </header>

        <section className="hero-banner" aria-label="Banner video">
          {settings.bannerUrl ? (
            <VideoLayer src={settings.bannerUrl} className="banner-video" />
          ) : (
            <div className="banner-placeholder">
              <div className="banner-orbit orbit-a" />
              <div className="banner-orbit orbit-b" />
              <div className="banner-sigil"><BrandMark /></div>
              <div className="banner-copy">
                <span className="eyebrow"><span className="status-dot" /> SYSTEM ONLINE</span>
                <h1>ENTER THE <em>UNKNOWN.</em></h1>
                <p>VALEN CRASH <span>/</span> KYZX DEVS</p>
              </div>
              <div className="banner-index">VC—001<br /><span>SECURE CONSOLE</span></div>
            </div>
          )}
          <div className="banner-shade" />
          <div className="banner-badge"><AudioLines size={12} /> VISUAL FEED <span>16:9</span></div>
        </section>

        <div className="ticker" aria-label={settings.tickerText}>
          <div className={`ticker-track ${reducedMotion ? "ticker-static" : ""}`}>
            {[0, 1, 2, 3].map((item) => (
              <span className="ticker-item" key={item}>
                <span className="ticker-star">✳</span>{settings.tickerText}<span className="ticker-divider">/</span>
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={section}
            className="content-section"
            initial={reducedMotion ? false : { opacity: 0, y: 9 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: 0.22 }}
          >
            {section === "dashboard" && <DashboardContent onNavigate={changeSection} />}
            {section === "bug" && <BugContent />}
            {section === "tools" && <ToolsContent />}
            {section === "profile" && <ProfileContent />}
          </motion.section>
        </AnimatePresence>

        <footer className="footer">
          <span><BrandMark small /> VALEN CRASH</span>
          <span>DESIGNED BY <b>KYZX DEVS</b></span>
        </footer>
      </div>

      <div className="floating-dock-zone">
        <AnimatePresence>
          {dockOpen && (
            <>
              <motion.button
                className="dock-backdrop"
                aria-label="Tutup menu navigasi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDockOpen(false)}
              />
              <motion.nav
                className="floating-dock"
                aria-label="Navigasi utama"
                initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 390, damping: 28 }}
              >
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      className={`dock-item ${section === item.id ? "dock-item-active" : ""}`}
                      onClick={() => changeSection(item.id)}
                      aria-label={item.label}
                      title={item.label}
                      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.045 }}
                    >
                      <span className="dock-icon"><Icon size={19} strokeWidth={1.8} /></span>
                      <span className="dock-label">{item.label}</span>
                      {section === item.id && <span className="dock-active-dot" />}
                    </motion.button>
                  );
                })}
              </motion.nav>
            </>
          )}
        </AnimatePresence>
        <motion.button
          className={`floating-logo-button ${dockOpen ? "floating-logo-open" : ""}`}
          onClick={() => setDockOpen((open) => !open)}
          aria-label={dockOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={dockOpen}
          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
          title="Valen Crash menu"
        >
          <span className="logo-button-halo" />
          {dockOpen ? <X size={22} strokeWidth={1.7} /> : <BrandMark />}
          <span className="logo-button-pulse" />
        </motion.button>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}
          >
            <motion.section
              className="settings-modal glass-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
              initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            >
              <div className="modal-heading">
                <div>
                  <span className="eyebrow">SYSTEM CONFIGURATION</span>
                  <h2 id="settings-title">Pengaturan</h2>
                </div>
                <button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Tutup pengaturan"><X size={18} /></button>
              </div>
              <p className="modal-description">Atur visual Valen Crash untuk browser ini. Perubahan disimpan secara lokal.</p>
              <label className="field-label">Banner video URL <span>16:9 recommended</span></label>
              <input className="text-input" type="url" placeholder="https://domain.com/banner.mp4" value={draft.bannerUrl} onChange={(e) => setDraft({ ...draft, bannerUrl: e.target.value })} />
              <label className="field-label">Background video URL <span>Looping background</span></label>
              <input className="text-input" type="url" placeholder="https://domain.com/background.mp4" value={draft.backgroundUrl} onChange={(e) => setDraft({ ...draft, backgroundUrl: e.target.value })} />
              <label className="field-label">Running text</label>
              <input className="text-input" maxLength={120} value={draft.tickerText} onChange={(e) => setDraft({ ...draft, tickerText: e.target.value })} />
              <button className={`setting-toggle ${draft.showEffects ? "toggle-on" : ""}`} onClick={() => setDraft({ ...draft, showEffects: !draft.showEffects })}>
                <span><Sparkles size={16} /> Efek visual <small>Glow dan ambient lighting</small></span>
                <span className="toggle-track"><span /></span>
              </button>
              <div className="modal-actions">
                <button className="button-secondary" onClick={() => setDraft(defaults)}>Reset</button>
                <button className="button-primary" onClick={saveSettings}><Check size={16} /> Simpan pengaturan</button>
              </div>
              {saved && <p className="save-confirmation"><Check size={14} /> Pengaturan berhasil disimpan di browser ini.</p>}
              <p className="settings-note">URL video diterapkan di browser ini saja. Untuk pengaturan global semua akun, sambungkan ke API/backend dengan hak akses admin.</p>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
      <p>{description}</p>
    </div>
  );
}

function DashboardContent({ onNavigate }: { onNavigate: (section: Section) => void }) {
  return (
    <>
      <div className="welcome-row">
        <div>
          <span className="eyebrow"><span className="status-dot" /> PERSONAL CONSOLE</span>
          <h2>Welcome to the <span>dark side.</span></h2>
          <p>Panel kendali Valen Crash. Semua sistem dimulai dari sini.</p>
        </div>
        <div className="welcome-mark"><BrandMark /></div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Globe2} label="Global sender" value="—" meta="Belum terhubung" />
        <StatCard icon={LockKeyhole} label="Private sender" value="—" meta="Belum terhubung" />
        <StatCard icon={Shield} label="Account status" value="DEMO" meta="Mode tampilan awal" status />
        <StatCard icon={Clock3} label="Expiration" value="—" meta="Belum ada data akun" />
      </div>

      <div className="section-heading compact-heading">
        <div><span className="eyebrow">QUICK ACCESS</span><h2>Navigate system</h2></div>
        <span className="section-counter">01 / 04</span>
      </div>
      <div className="quick-grid">
        <QuickCard icon={Shield} number="01" title="Bug Menu" description="Area pengujian yang berizin." onClick={() => onNavigate("bug")} />
        <QuickCard icon={Wrench} number="02" title="Tools Menu" description="Utilitas dan alat pendukung." onClick={() => onNavigate("tools")} />
        <QuickCard icon={CircleUserRound} number="03" title="Profil" description="Informasi akun dan bio." onClick={() => onNavigate("profile")} />
      </div>
      <div className="notice-card">
        <div className="notice-icon"><Activity size={18} /></div>
        <div><b>System overview</b><p>Ini adalah UI awal. Statistik dan status akan menampilkan data nyata setelah backend akun dipasang.</p></div>
        <span className="notice-tag">PREVIEW</span>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, meta, status = false }: { icon: typeof Globe2; label: string; value: string; meta: string; status?: boolean }) {
  return (
    <article className="stat-card glass-panel">
      <div className="stat-top"><span className="stat-icon"><Icon size={17} /></span><span className="stat-label">{label}</span><ArrowUpRight size={15} className="stat-arrow" /></div>
      <div className={`stat-value ${status ? "stat-status" : ""}`}>{status && <span className="status-dot" />}{value}</div>
      <div className="stat-meta">{meta}</div>
    </article>
  );
}

function QuickCard({ icon: Icon, number, title, description, onClick }: { icon: typeof Shield; number: string; title: string; description: string; onClick: () => void }) {
  return (
    <button className="quick-card glass-panel" onClick={onClick}>
      <span className="quick-number">{number}</span>
      <span className="quick-icon"><Icon size={19} /></span>
      <span className="quick-title">{title}<ChevronRight size={15} /></span>
      <span className="quick-description">{description}</span>
    </button>
  );
}

function BugContent() {
  const [number, setNumber] = useState("");
  const [method, setMethod] = useState("connectivity");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult("");
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setResult("UI demo: belum terhubung ke backend. Gunakan hanya nomor/perangkat milik sendiri atau yang sudah memberi izin.");
    }, 550);
  };

  return (
    <>
      <SectionHeading eyebrow="AUTHORIZED TESTING" title="Bug Menu" description="Form pengujian konektivitas yang aman. Belum mengirim pesan atau menjalankan tindakan eksternal." />
      <form className="form-panel glass-panel" onSubmit={submit}>
        <div className="form-panel-top"><span className="panel-icon"><Shield size={18} /></span><div><b>Testing console</b><p>Local preview · no external action</p></div><span className="demo-chip">DEMO</span></div>
        <label className="field-label" htmlFor="test-number">Nomor uji <span>gunakan nomor dengan izin</span></label>
        <input id="test-number" className="text-input" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+62xxxxxxxxxx" inputMode="tel" required pattern="[+0-9 ()-]{8,20}" />
        <label className="field-label" htmlFor="test-method">Metode pengujian</label>
        <select id="test-method" className="text-input select-input" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="connectivity">Connectivity check</option>
          <option value="format">Number format validation</option>
          <option value="sandbox">Sandbox delivery simulation</option>
        </select>
        <div className="permission-note"><Shield size={15} /><span>Pengujian ini hanya untuk verifikasi konektivitas, format, atau simulasi sandbox yang berizin.</span></div>
        <button className="button-primary submit-button" disabled={busy}>{busy ? <><span className="spinner" /> Memproses demo…</> : <><Play size={16} /> Jalankan pengujian demo</>}</button>
        {result && <div className="inline-result"><Check size={15} />{result}</div>}
      </form>
    </>
  );
}

function ToolsContent() {
  const tools = [
    { icon: Terminal, title: "JSON Formatter", desc: "Rapikan dan validasi JSON." },
    { icon: Gauge, title: "Latency Notes", desc: "Catat hasil pengukuran latency." },
    { icon: Command, title: "Request Builder", desc: "Susun request untuk sandbox." }
  ];
  return (
    <>
      <SectionHeading eyebrow="UTILITY WORKSPACE" title="Tools Menu" description="Kumpulan utilitas pengembangan. Pilih tool untuk melihat status ketersediaannya." />
      <div className="tools-grid">
        {tools.map(({ icon: Icon, title, desc }, i) => (
          <article className="tool-card glass-panel" key={title}>
            <span className="tool-index">TOOL / 0{i + 1}</span>
            <span className="tool-icon"><Icon size={20} /></span>
            <h3>{title}</h3><p>{desc}</p>
            <span className="tool-status"><span className="status-dot muted-dot" /> READY FOR IMPLEMENTATION</span>
          </article>
        ))}
      </div>
    </>
  );
}

function ProfileContent() {
  const [displayName, setDisplayName] = useState("Valen User");
  const [bio, setBio] = useState("Exploring the unknown.");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const profile = localStorage.getItem("valen-crash-profile");
      if (profile) {
        const parsed = JSON.parse(profile);
        setDisplayName(parsed.displayName ?? "Valen User");
        setBio(parsed.bio ?? "Exploring the unknown.");
      }
    } catch { /* use demo profile */ }
  }, []);

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      localStorage.setItem("valen-crash-profile", JSON.stringify({ displayName, bio }));
      setSaved(true);
    } catch { setSaved(false); }
  };

  return (
    <>
      <SectionHeading eyebrow="IDENTITY FILE" title="Profil" description="Profil demo yang disimpan di browser. Akun dan role sebenarnya memerlukan autentikasi backend." />
      <form className="profile-panel glass-panel" onSubmit={saveProfile}>
        <div className="profile-banner"><div className="profile-emblem"><BrandMark /></div><span className="demo-chip">LOCAL PROFILE</span></div>
        <div className="profile-main">
          <div className="profile-title-row"><div><h3>{displayName || "Valen User"}</h3><p>@demo-user · Valen Crash</p></div><span className="role-pill"><Shield size={13} /> DEMO USER</span></div>
          <label className="field-label" htmlFor="display-name">Display name</label>
          <input id="display-name" className="text-input" value={displayName} maxLength={32} onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }} />
          <label className="field-label" htmlFor="bio">Bio</label>
          <textarea id="bio" className="text-input bio-input" value={bio} maxLength={160} onChange={(e) => { setBio(e.target.value); setSaved(false); }} />
          <div className="profile-meta-grid"><div><span>ACCOUNT STATUS</span><b>DEMO</b></div><div><span>EXPIRES</span><b>NOT SET</b></div><div><span>USER ID</span><b>NOT CONNECTED</b></div></div>
          <button className="button-primary" type="submit"><Check size={16} /> Simpan profil lokal</button>
          {saved && <p className="save-confirmation"><Check size={14} /> Profil tersimpan di browser ini.</p>}
        </div>
      </form>
    </>
  );
}
