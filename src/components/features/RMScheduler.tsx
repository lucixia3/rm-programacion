"use client";

import { useState, useEffect, useCallback } from "react";

interface RMResult {
  nom_protocol: string;
  orientacio: string;
  zona: string;
  contrast: "SI" | "NO" | "DEPENDE";
  bomba: "SI" | "NO" | "DEPENDE";
  equip1: string;
  equips: string;
  huecos: string;
  nota: string | null;
  torn: string;
  maquina_nota: string;
  conf: "ALTA" | "MITJA" | "BAIXA";
  why: string;
  raw?: string;
}

interface HistoryItem {
  text: string;
  result: RMResult;
  ts: number;
}

type StatusState = "idle" | "ok" | "error" | "checking";

const TORN_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  MATI:           { label: "MAÑANA obligatorio",                    icon: "☀",  color: "#4ade80", bg: "rgba(74,222,128,.08)",   border: "rgba(74,222,128,.2)"   },
  TARDA:          { label: "TARDE",                                  icon: "🌙", color: "#fb923c", bg: "rgba(251,146,60,.08)",   border: "rgba(251,146,60,.2)"   },
  FLEXIBLE:       { label: "Flexible — mañana o tarde",              icon: "◎",  color: "#94a3b8", bg: "rgba(148,163,184,.06)",  border: "rgba(148,163,184,.15)" },
  DIMARTS_TARDA:  { label: "Anestesia ≥3 años → Martes tarde",       icon: "💉", color: "#a78bfa", bg: "rgba(167,139,250,.08)",  border: "rgba(167,139,250,.2)"  },
  DIVENDRES_MATI: { label: "Anestesia <3 años → Viernes mañana",     icon: "💉", color: "#60a5fa", bg: "rgba(96,165,250,.08)",   border: "rgba(96,165,250,.2)"   },
  ANESTESIA:      { label: "Anestesia → RM1",                        icon: "💉", color: "#a78bfa", bg: "rgba(167,139,250,.08)",  border: "rgba(167,139,250,.2)"  },
};

const CONF_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ALTA:  { label: "Alta",  color: "#4ade80", dot: "#4ade80" },
  MITJA: { label: "Media", color: "#f7a84f", dot: "#f7a84f" },
  BAIXA: { label: "Baja",  color: "#f76f6f", dot: "#f76f6f" },
};

const BADGE_STYLES = {
  blue:   { bg: "rgba(79,142,247,.12)",  color: "#4f8ef7", border: "rgba(79,142,247,.25)"  },
  green:  { bg: "rgba(62,207,176,.1)",   color: "#3ecfb0", border: "rgba(62,207,176,.2)"   },
  orange: { bg: "rgba(247,168,79,.1)",   color: "#f7a84f", border: "rgba(247,168,79,.2)"   },
  red:    { bg: "rgba(247,111,111,.1)",  color: "#f76f6f", border: "rgba(247,111,111,.2)"  },
};

function Badge({ color, children }: { color: keyof typeof BADGE_STYLES; children: React.ReactNode }) {
  const s = BADGE_STYLES[color] ?? BADGE_STYLES.blue;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {children}
    </span>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", ...style }}>
      {children}
    </p>
  );
}

function DetailRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: last ? "none" : "1px solid rgba(255,255,255,.03)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", minWidth: 120, paddingTop: 1, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export function RMScheduler() {
  const [medInput, setMedInput] = useState("");
  const [anestInput, setAnestInput] = useState("");
  const [result, setResult] = useState<RMResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>("idle");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rm_hist");
    if (saved) setHistory(JSON.parse(saved));
    checkConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = useCallback(async () => {
    setStatus("checking");
    try {
      const r = await fetch("/api/health");
      setStatus(r.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }, []);

  async function analyze() {
    const text = medInput.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, anestesia: anestInput.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error en la solicitud");

      const newResult = data as RMResult;
      setResult(newResult);

      const newHistory: HistoryItem[] = [
        { text: text.substring(0, 80), result: newResult, ts: Date.now() },
        ...history.slice(0, 9),
      ];
      setHistory(newHistory);
      localStorage.setItem("rm_hist", JSON.stringify(newHistory));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    if (!result) return;
    const lines = [
      `PRESTACION: ${result.nom_protocol}`,
      `ORIENTACION: ${result.orientacio}`,
      `TURNO: ${TORN_CONFIG[result.torn]?.label ?? result.torn}`,
      `CONTRASTE: ${result.contrast}`,
      `BOMBA: ${result.bomba}`,
      `EQUIPO: ${result.equip1}`,
      `ORDEN EQUIPOS: ${result.equips}`,
      `HUECOS: ${result.huecos}`,
      result.nota ? `NOTA: ${result.nota}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearInput() {
    setMedInput("");
    setAnestInput("");
    setResult(null);
    setError(null);
  }

  const statusDot = {
    idle:     { color: "var(--text3)", glow: false, pulse: false, label: "—" },
    ok:       { color: "#3ecfb0",      glow: true,  pulse: false, label: "Conectado" },
    error:    { color: "#f76f6f",      glow: false, pulse: false, label: "Sin conexión" },
    checking: { color: "#f7a84f",      glow: false, pulse: true,  label: "Comprobando..." },
  }[status];

  const hasInput = medInput.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <header style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 16, padding: "0 28px", height: 60, borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #4f8ef7 0%, #3ecfb0 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "white", letterSpacing: -0.5, boxShadow: "0 0 20px rgba(79,142,247,.3)" }}>RM</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}>Programación RM</div>
            <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 0.2 }}>Radiología — Asistente de programación</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, background: "var(--surface2)", border: "1px solid var(--border)", fontSize: 11, color: "var(--text2)" }}>
            <span style={{ opacity: 0.6 }}>Modelo</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--accent)", fontWeight: 600 }}>claude-haiku-4-5</span>
          </div>
        </div>

        <button
          onClick={checkConnection}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border)", background: "var(--surface2)", cursor: "pointer", fontSize: 12, color: "var(--text2)" }}
          title="Comprobar conexión"
        >
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusDot.color, boxShadow: statusDot.glow ? `0 0 8px ${statusDot.color}` : undefined, animation: statusDot.pulse ? "pulse 1s infinite" : undefined, flexShrink: 0 }} />
          {statusDot.label}
        </button>
      </header>

      {/* ── MAIN GRID ── */}
      <main style={{ flex: 1, display: "grid", gridTemplateColumns: "420px 1fr", overflow: "hidden" }}>

        {/* ── LEFT — INPUT ── */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Label>Valoración del radiólogo</Label>
              {hasInput && (
                <button onClick={clearInput} style={{ fontSize: 11, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}>
                  Limpiar
                </button>
              )}
            </div>

            <textarea
              value={medInput}
              onChange={(e) => setMedInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(); } }}
              placeholder={"Pega o escribe la valoración médica...\n\nEjemplos:\n· Discopatías L5-S1, lumbalgia severa\n· Adenoma hipofisario, control evolutivo\n· Sospecha metástasis hepática, dinámico\n· Cáncer de próstata, estadificación\n· Schwannoma vestibular derecho\n· Crohn conocido, evaluación actividad\n· Dolor rodilla derecha, sospecha menisco"}
              style={{ flex: 1, width: "100%", minHeight: 220, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.7, padding: "14px 16px", resize: "none", outline: "none", transition: "border-color 0.15s" }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />

            <div>
              <Label style={{ marginBottom: 6 }}>
                Anestesia{" "}
                <span style={{ fontWeight: 400, textTransform: "none", fontSize: 10, color: "var(--text3)", letterSpacing: 0 }}>(opcional)</span>
              </Label>
              <input
                type="text"
                value={anestInput}
                onChange={(e) => setAnestInput(e.target.value)}
                placeholder="p.ej: anest 2, anestesia 3+, anest 5a"
                title="Indica la edad del paciente si necesita anestesia"
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "9px 12px", outline: "none", transition: "border-color 0.15s" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
            </div>

            <button
              onClick={analyze}
              disabled={loading || !hasInput}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 20px", borderRadius: "var(--radius)", border: "none", background: loading || !hasInput ? "var(--surface3)" : "linear-gradient(135deg, #4f8ef7 0%, #3a7de8 100%)", color: loading || !hasInput ? "var(--text3)" : "white", fontSize: 14, fontWeight: 600, cursor: loading || !hasInput ? "not-allowed" : "pointer", transition: "all 0.2s", letterSpacing: -0.2, boxShadow: loading || !hasInput ? "none" : "0 4px 20px rgba(79,142,247,.3)" }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Analizando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  Analizar y Programar
                </>
              )}
            </button>

            <p style={{ fontSize: 10, color: "var(--text3)", textAlign: "center" }}>
              Enter para analizar · Shift+Enter para nueva línea
            </p>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "14px 24px" }}>
              <Label style={{ marginBottom: 10 }}>Historial</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" }}>
                {history.slice(0, 6).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setResult(h.result); setError(null); setShowRaw(false); }}
                    style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", cursor: "pointer", transition: "border-color 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{h.result.equip1} · {h.result.nom_protocol}</span>
                    <span style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT — RESULT ── */}
        <div style={{ overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Loading */}
          {loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 20px" }}>
              <div style={{ position: "relative", width: 48, height: 48 }}>
                <div style={{ position: "absolute", inset: 0, border: "3px solid var(--border)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", inset: 0, border: "3px solid transparent", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>Procesando valoración...</p>
                <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Claude está analizando el caso</p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ background: "rgba(247,111,111,.08)", border: "1px solid rgba(247,111,111,.2)", borderRadius: "var(--radius)", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f76f6f" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#f76f6f" }}>Error</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && !result && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "80px 20px", color: "var(--text3)" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "var(--text3)" }}>RM</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>Listo para analizar</p>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, maxWidth: 260, lineHeight: 1.6 }}>
                  Introduce la valoración del radiólogo y pulsa <strong style={{ color: "var(--text2)" }}>Analizar y Programar</strong>
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {!loading && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.2s ease-out" }}>

              {/* Main card */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

                {/* Card header */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent2)", boxShadow: "0 0 8px var(--accent2)", animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }}>Resultado de programación</span>
                  </div>
                  <button
                    onClick={copyResult}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 12px", borderRadius: "var(--radius-sm)", background: copied ? "rgba(62,207,176,.15)" : "rgba(255,255,255,.05)", border: `1px solid ${copied ? "rgba(62,207,176,.3)" : "var(--border)"}`, color: copied ? "var(--accent2)" : "var(--text2)", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    {copied ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar</>
                    )}
                  </button>
                </div>

                {/* Protocol + equip hero */}
                <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", marginBottom: 4 }}>Prestación</p>
                    <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.3 }}>{result.nom_protocol}</p>
                    <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, lineHeight: 1.5 }}>{result.orientacio}</p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", marginBottom: 6 }}>Equipo</p>
                    <div style={{ width: 72, height: 72, borderRadius: 16, background: "linear-gradient(135deg, rgba(79,142,247,.15), rgba(62,207,176,.1))", border: "2px solid rgba(79,142,247,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "var(--accent)", letterSpacing: -1, boxShadow: "0 0 20px rgba(79,142,247,.15)" }}>
                      {result.equip1}
                    </div>
                  </div>
                </div>

                {/* Turno */}
                {result.torn && TORN_CONFIG[result.torn] && (() => {
                  const t = TORN_CONFIG[result.torn];
                  return (
                    <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: t.bg }}>
                      <span style={{ fontSize: 18 }}>{t.icon}</span>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: t.color, opacity: 0.7, marginBottom: 1 }}>Turno</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Details */}
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column" }}>
                  <DetailRow label="Zona corporal">
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>{result.zona}</span>
                  </DetailRow>

                  <DetailRow label="Contraste / Bomba">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge color={result.contrast === "SI" ? "orange" : result.contrast === "DEPENDE" ? "blue" : "green"}>
                        {result.contrast === "SI" ? "Con contraste" : result.contrast === "DEPENDE" ? "Contraste según caso" : "Sin contraste"}
                      </Badge>
                      <Badge color={result.bomba === "SI" ? "orange" : result.bomba === "DEPENDE" ? "blue" : "green"}>
                        {result.bomba === "SI" ? "Bomba inyectora" : result.bomba === "DEPENDE" ? "Bomba según caso" : "Sin bomba"}
                      </Badge>
                    </div>
                  </DetailRow>

                  <DetailRow label="Orden equipos">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {result.equips.split("/").map((e, i) => (
                        <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "3px 10px", borderRadius: 5, border: i === 0 ? "1px solid rgba(79,142,247,.4)" : "1px solid var(--border)", color: i === 0 ? "var(--accent)" : "var(--text3)", background: i === 0 ? "rgba(79,142,247,.12)" : "transparent", fontWeight: i === 0 ? 700 : 400 }}>
                          {e.trim()}
                        </span>
                      ))}
                    </div>
                  </DetailRow>

                  <DetailRow label="Huecos">
                    <Badge color="blue">{result.huecos} {result.huecos === "1" ? "hueco" : "huecos"}</Badge>
                  </DetailRow>

                  <DetailRow label="Confianza IA">
                    {(() => {
                      const c = CONF_CONFIG[result.conf];
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, boxShadow: `0 0 6px ${c.dot}` }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</span>
                        </div>
                      );
                    })()}
                  </DetailRow>

                  {result.maquina_nota && (
                    <DetailRow label="Nota máquina">
                      <span style={{ fontSize: 12, color: "var(--warn)", fontWeight: 500 }}>{result.maquina_nota}</span>
                    </DetailRow>
                  )}

                  <DetailRow label="Razonamiento" last>
                    <span style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, fontStyle: "italic" }}>{result.why}</span>
                  </DetailRow>
                </div>
              </div>

              {/* Nota importante */}
              {result.nota && (
                <div style={{ display: "flex", gap: 12, background: "rgba(247,168,79,.06)", border: "1px solid rgba(247,168,79,.2)", borderRadius: "var(--radius)", padding: "14px 18px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f7a84f" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#f7a84f", marginBottom: 3 }}>Nota importante</p>
                    <p style={{ fontSize: 12, color: "#c4923a", lineHeight: 1.6 }}>{result.nota}</p>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <p style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.6 }}>
                  Herramienta de apoyo para administrativas. Verificar siempre con el radiólogo responsable en casos de duda o confianza baja.
                </p>
              </div>

              {/* Raw toggle */}
              {result.raw && (
                <div>
                  <button onClick={() => setShowRaw(!showRaw)} style={{ fontSize: 11, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                    {showRaw ? "Ocultar" : "Ver"} respuesta raw del modelo
                  </button>
                  {showRaw && (
                    <div style={{ marginTop: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text3)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 120, overflowY: "auto" }}>
                      {result.raw}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
