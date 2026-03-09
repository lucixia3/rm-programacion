/**
 * Route POST — Guarda feedback de les administratives a Supabase.
 * Usa fetch directa (compatible edge i Node.js). NO usa @supabase/supabase-js.
 */
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nota_radioleg,
      anestesia,
      ia_protocol_n,
      ia_nom_protocol,
      ia_torn,
      ia_equip1,
      ia_equips,
      ia_contrast,
      ia_bomba,
      ia_conf,
      ia_why,
      decisio,
      correccio_protocol_n,
      correccio_nom_protocol,
      correccio_torn,
      correccio_equip1,
      correccio_contrast,
      correccio_bomba,
      correccio_comment,
    } = body;

    if (!nota_radioleg || !decisio) {
      return NextResponse.json({ error: "Falten camps obligatoris" }, { status: 400 });
    }

    if (decisio !== "acceptat" && decisio !== "corregit") {
      return NextResponse.json({ error: "decisio ha de ser 'acceptat' o 'corregit'" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase no configurat");
      return NextResponse.json({ error: "Servei no disponible" }, { status: 503 });
    }

    const payload: Record<string, unknown> = {
      nota_radioleg,
      decisio,
    };

    if (anestesia !== undefined) payload.anestesia = anestesia;
    if (ia_protocol_n !== undefined) payload.ia_protocol_n = ia_protocol_n;
    if (ia_nom_protocol !== undefined) payload.ia_nom_protocol = ia_nom_protocol;
    if (ia_torn !== undefined) payload.ia_torn = ia_torn;
    if (ia_equip1 !== undefined) payload.ia_equip1 = ia_equip1;
    if (ia_equips !== undefined) payload.ia_equips = ia_equips;
    if (ia_contrast !== undefined) payload.ia_contrast = ia_contrast;
    if (ia_bomba !== undefined) payload.ia_bomba = ia_bomba;
    if (ia_conf !== undefined) payload.ia_conf = ia_conf;
    if (ia_why !== undefined) payload.ia_why = ia_why;
    if (correccio_protocol_n !== undefined) payload.correccio_protocol_n = correccio_protocol_n;
    if (correccio_nom_protocol !== undefined) payload.correccio_nom_protocol = correccio_nom_protocol;
    if (correccio_torn !== undefined) payload.correccio_torn = correccio_torn;
    if (correccio_equip1 !== undefined) payload.correccio_equip1 = correccio_equip1;
    if (correccio_contrast !== undefined) payload.correccio_contrast = correccio_contrast;
    if (correccio_bomba !== undefined) payload.correccio_bomba = correccio_bomba;
    if (correccio_comment !== undefined) payload.correccio_comment = correccio_comment;

    const res = await fetch(`${supabaseUrl}/rest/v1/rm_feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Error Supabase:", err);
      return NextResponse.json({ error: "Error en guardar el feedback" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error feedback route:", err);
    return NextResponse.json({ error: "Error intern del servidor" }, { status: 500 });
  }
}
