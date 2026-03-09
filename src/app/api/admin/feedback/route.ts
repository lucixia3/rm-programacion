/**
 * Route GET protegida — Retorna tots els feedbacks per al dashboard admin.
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
