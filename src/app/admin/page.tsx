"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const AUTO_REFRESH_INTERVAL = 30_000; // 30 seconds

interface FeedbackRow {
  id: string;
  created_at: string;
  nota_radioleg: string;
  anestesia: string | null;
  ia_protocol_n: number | null;
  ia_nom_protocol: string | null;
  ia_torn: string | null;
  ia_equip1: string | null;
  ia_equips: string | null;
  ia_contrast: string | null;
  ia_bomba: string | null;
  ia_conf: string | null;
  ia_why: string | null;
  decisio: string;
  correccio_protocol_n: number | null;
  correccio_nom_protocol: string | null;
  correccio_torn: string | null;
  correccio_equip1: string | null;
  correccio_comment: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ca-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + "…" : text;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset modal state
  const [showReset, setShowReset] = useState(false);
  const [resetPwd, setResetPwd] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Delete single row
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async (pwd: string) => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/admin/feedback", {
        headers: { "x-admin-password": pwd },
      });
      if (res.status === 401) {
        setAuthed(false);
        setAuthError("Contrasenya incorrecta");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setFetchError("Error en obtenir les dades");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRows(data);
      setAuthed(true);
      setAuthError("");
      setLastUpdated(new Date());
    } catch {
      setFetchError("Error de xarxa");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 30 s while logged in
  useEffect(() => {
    if (!authed) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      fetchFeedbacks(password);
    }, AUTO_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authed, password, fetchFeedbacks]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    fetchFeedbacks(password);
  }

  async function deleteRow(id: string) {
    setDeletingId(id);
    await fetch("/api/admin/feedback", {
      method: "DELETE",
      headers: { "x-admin-password": password, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    const res = await fetch("/api/admin/feedback", {
      method: "DELETE",
      headers: { "x-admin-password": resetPwd },
    });
    setResetLoading(false);
    if (res.status === 401) { setResetError("Contrasenya incorrecta"); return; }
    if (!res.ok) { setResetError("Error en el reset"); return; }
    setRows([]);
    setShowReset(false);
    setResetPwd("");
  }

  const total = rows.length;
  const acceptats = rows.filter((r) => r.decisio === "acceptat").length;
  const corregits = rows.filter((r) => r.decisio === "corregit").length;
  const pctAcc = total > 0 ? Math.round((acceptats / total) * 100) : 0;
  const pctCorr = total > 0 ? Math.round((corregits / total) * 100) : 0;

  // ── Login screen ────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 360,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "32px 28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg, #4f8ef7 0%, #3ecfb0 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800, color: "white", letterSpacing: -0.5,
            }}>RM</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3 }}>Dashboard Admin</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Feedback de programació</div>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", marginBottom: 6 }}>
                Contrasenya
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introdueix la contrasenya..."
                autoFocus
                style={{
                  width: "100%",
                  background: "var(--surface2)",
                  border: `1px solid ${authError ? "rgba(247,111,111,.5)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  padding: "10px 12px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.target.style.borderColor = authError ? "rgba(247,111,111,.5)" : "var(--border)"; }}
              />
              {authError && (
                <p style={{ fontSize: 11, color: "#f76f6f", marginTop: 6 }}>{authError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                padding: "11px 20px",
                borderRadius: "var(--radius)",
                border: "none",
                background: loading || !password
                  ? "var(--surface3)"
                  : "linear-gradient(135deg, #4f8ef7 0%, #3a7de8 100%)",
                color: loading || !password ? "var(--text3)" : "white",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading || !password ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Entrant..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 28px",
        height: 60,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #4f8ef7 0%, #3ecfb0 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "white", letterSpacing: -0.5,
            boxShadow: "0 0 20px rgba(79,142,247,.3)",
          }}>RM</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3 }}>Dashboard Admin</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>Feedback de programació</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {lastUpdated && (
          <span style={{ fontSize: 11, color: "var(--text3)" }}>
            Actualitzat: {lastUpdated.toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
        <button
          onClick={() => fetchFeedbacks(password)}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 20,
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 12, color: "var(--text2)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {loading ? "Carregant..." : "Actualitzar"}
        </button>
        <button
          onClick={() => { setShowReset(true); setResetPwd(""); setResetError(""); }}
          style={{
            padding: "6px 14px", borderRadius: 20,
            border: "1px solid rgba(247,111,111,.3)",
            background: "rgba(247,111,111,.07)",
            cursor: "pointer",
            fontSize: 12, color: "#f76f6f",
          }}
        >
          Reset historial
        </button>
        <button
          onClick={() => { setAuthed(false); setRows([]); setPassword(""); }}
          style={{
            padding: "6px 14px", borderRadius: 20,
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            cursor: "pointer",
            fontSize: 12, color: "var(--text3)",
          }}
        >
          Sortir
        </button>
      </header>

      <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

        {fetchError && (
          <div style={{
            background: "rgba(247,111,111,.08)",
            border: "1px solid rgba(247,111,111,.2)",
            borderRadius: "var(--radius)",
            padding: "12px 16px",
            fontSize: 13, color: "#f76f6f",
          }}>
            {fetchError}
          </div>
        )}

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {/* Total */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "20px 24px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>
              Total casos
            </p>
            <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "var(--text)" }}>
              {total}
            </p>
          </div>

          {/* Acceptats */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid rgba(74,222,128,.2)",
            borderRadius: "var(--radius)",
            padding: "20px 24px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#4ade80", opacity: 0.7, marginBottom: 8 }}>
              Acceptats
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#4ade80" }}>
                {acceptats}
              </p>
              {total > 0 && (
                <span style={{ fontSize: 14, fontWeight: 600, color: "#4ade80", opacity: 0.7 }}>
                  {pctAcc}%
                </span>
              )}
            </div>
          </div>

          {/* Corregits */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid rgba(247,168,79,.2)",
            borderRadius: "var(--radius)",
            padding: "20px 24px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#f7a84f", opacity: 0.7, marginBottom: 8 }}>
              Corregits
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: "#f7a84f" }}>
                {corregits}
              </p>
              {total > 0 && (
                <span style={{ fontSize: 14, fontWeight: 600, color: "#f7a84f", opacity: 0.7 }}>
                  {pctCorr}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Taula */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface2)",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }}>
              Historial de feedback
            </p>
          </div>

          {rows.length === 0 ? (
            <div style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--text3)",
              fontSize: 13,
            }}>
              {loading ? "Carregant dades..." : "No hi ha feedback registrat encara."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Data", "Nota radiòleg", "Protocol IA", "Torn IA", "Equip IA", "Decisió", "Correcció", ""].map((h) => (
                      <th key={h} style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: "var(--text3)",
                        whiteSpace: "nowrap",
                        background: "var(--surface2)",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.01)",
                      }}
                    >
                      <td style={{ padding: "10px 16px", color: "var(--text3)", whiteSpace: "nowrap" }}>
                        {formatDate(row.created_at)}
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text2)", maxWidth: 260 }}>
                        <span title={row.nota_radioleg}>{truncate(row.nota_radioleg, 60)}</span>
                      </td>
                      <td style={{ padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text2)", whiteSpace: "nowrap" }}>
                        {row.ia_protocol_n ? `${row.ia_protocol_n} — ` : ""}{truncate(row.ia_nom_protocol ?? "—", 30)}
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text2)", whiteSpace: "nowrap" }}>
                        {row.ia_torn ?? "—"}
                      </td>
                      <td style={{ padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--accent)" }}>
                        {row.ia_equip1 ?? "—"}
                      </td>
                      <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                        {row.decisio === "acceptat" ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", padding: "3px 10px",
                            borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: "rgba(74,222,128,.12)", color: "#4ade80",
                            border: "1px solid rgba(74,222,128,.25)",
                          }}>
                            Acceptat
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex", alignItems: "center", padding: "3px 10px",
                            borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: "rgba(247,168,79,.12)", color: "#f7a84f",
                            border: "1px solid rgba(247,168,79,.25)",
                          }}>
                            Corregit
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text2)", maxWidth: 240 }}>
                        {row.decisio === "corregit" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {row.correccio_nom_protocol && (
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                                {row.correccio_protocol_n ? `${row.correccio_protocol_n} — ` : ""}{truncate(row.correccio_nom_protocol, 28)}
                              </span>
                            )}
                            {row.correccio_torn && (
                              <span style={{ fontSize: 11, color: "var(--text3)" }}>Torn: {row.correccio_torn}</span>
                            )}
                            {row.correccio_equip1 && (
                              <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{row.correccio_equip1}</span>
                            )}
                            {row.correccio_comment && (
                              <span style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>{truncate(row.correccio_comment, 40)}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text3)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "6px 12px" }}>
                        <button
                          onClick={() => deleteRow(row.id)}
                          disabled={deletingId === row.id}
                          title="Eliminar fila"
                          style={{
                            padding: "3px 8px", borderRadius: 6,
                            border: "1px solid rgba(247,111,111,.2)",
                            background: "transparent",
                            color: "#f76f6f",
                            cursor: deletingId === row.id ? "not-allowed" : "pointer",
                            fontSize: 11, opacity: deletingId === row.id ? 0.4 : 0.6,
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.opacity = "1"; }}
                          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = deletingId === row.id ? "0.4" : "0.6"; }}
                        >
                          {deletingId === row.id ? "…" : "✕"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Reset modal */}
      {showReset && (
        <div
          onClick={() => setShowReset(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 360,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "28px 24px",
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Resetar historial</p>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 20 }}>
              S&apos;eliminaran <strong style={{ color: "var(--text)" }}>{total}</strong> registres. Confirma la contrasenya per continuar.
            </p>
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="password"
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
                placeholder="Contrasenya..."
                autoFocus
                style={{
                  width: "100%",
                  background: "var(--surface2)",
                  border: `1px solid ${resetError ? "rgba(247,111,111,.5)" : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  padding: "10px 12px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {resetError && (
                <p style={{ fontSize: 11, color: "#f76f6f", marginTop: -6 }}>{resetError}</p>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--surface2)",
                    color: "var(--text3)", fontSize: 13, cursor: "pointer",
                  }}
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !resetPwd}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "var(--radius)",
                    border: "none",
                    background: resetLoading || !resetPwd ? "var(--surface3)" : "rgba(247,111,111,.85)",
                    color: resetLoading || !resetPwd ? "var(--text3)" : "white",
                    fontSize: 13, fontWeight: 600,
                    cursor: resetLoading || !resetPwd ? "not-allowed" : "pointer",
                  }}
                >
                  {resetLoading ? "Eliminant..." : "Confirmar reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
