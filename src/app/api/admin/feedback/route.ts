/**
 * Route GET/DELETE protegida — Retorna o elimina feedbacks del dashboard admin.
 * Protegida per header x-admin-password.
 */
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "rm2026";
  const providedPassword = request.headers.get("x-admin-password");

  if (!providedPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Servei no disponible" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/rm_feedback?select=*&order=created_at.desc&limit=200`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Error Supabase admin:", err);
      return NextResponse.json({ error: "Error en obtenir els feedbacks" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error admin feedback route:", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/feedback
 * Body: { id?: string }  — si no hi ha id, elimina tot l'historial (reset)
 */
export async function DELETE(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "rm2026";
  const providedPassword = request.headers.get("x-admin-password");

  if (!providedPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Servei no disponible" }, { status: 503 });
  }

  try {
    let body: { id?: string } = {};
    try { body = await request.json(); } catch { /* body buit = reset total */ }

    // Si ve un id, elimina només aquella fila; si no, elimina tot
    const url = body.id
      ? `${supabaseUrl}/rest/v1/rm_feedback?id=eq.${encodeURIComponent(body.id)}`
      : `${supabaseUrl}/rest/v1/rm_feedback?id=neq.00000000-0000-0000-0000-000000000000`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Error Supabase DELETE:", err);
      return NextResponse.json({ error: "Error en eliminar" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error admin DELETE route:", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/feedback
 * Body: { id: string } — marca una correcció com a 'validat' perquè entri als few-shots
 */
export async function PATCH(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "rm2026";
  const providedPassword = request.headers.get("x-admin-password");

  if (!providedPassword || providedPassword !== adminPassword) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Servei no disponible" }, { status: 503 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

    const res = await fetch(
      `${supabaseUrl}/rest/v1/rm_feedback?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ decisio: "validat" }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Error Supabase PATCH:", err);
      return NextResponse.json({ error: "Error en validar" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error admin PATCH route:", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
