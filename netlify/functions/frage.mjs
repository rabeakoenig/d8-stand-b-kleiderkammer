// der Kleiderkammer Eichgrund: beantwortet eine Frage in höchstens zwei Sätzen.
// Der Schlüssel kommt aus der Umgebung (KLEIDERKAMMER_KEY), nie aus dem Code: lokal aus der Datei .env, auf Netlify aus den Variablen.
// Modellname (laut Google-Doku am 25.11.2026): am Gerät prüfen (oder Variable GEMINI_MODELL setzen).
const MODELL = process.env.GEMINI_MODELL || "gemini-3.1-flash-lite";
const ANWEISUNG = "Du beantwortest Fragen zu der Kleiderkammer Eichgrund (erfundenes Beispiel). Antworte auf Deutsch in höchstens zwei Sätzen. Weißt du etwas nicht, sag es.";

export default async (req) => {
  const schluessel = process.env.KLEIDERKAMMER_KEY;
  if (req.method === "GET") return Response.json({ eingerichtet: Boolean(schluessel) });
  if (req.method !== "POST") return Response.json({ fehler: "Nur GET und POST." }, { status: 405 });
  if (!schluessel) return Response.json({ fehler: "Noch nicht eingerichtet: KLEIDERKAMMER_KEY fehlt." }, { status: 503 });

  let frage;
  try { ({ frage } = await req.json()); } catch { return Response.json({ fehler: "Die Anfrage ist kein gültiges JSON." }, { status: 400 }); }
  if (typeof frage !== "string" || !frage.trim() || frage.length > 200) return Response.json({ fehler: "Bitte einen Frage mit 1 bis 200 Zeichen." }, { status: 400 });

  let antwort;
  try {
    antwort = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": schluessel, "Api-Revision": "2026-05-20", "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELL, input: frage.trim(), system_instruction: ANWEISUNG, generation_config: { max_output_tokens: 200 } }),
    });
  } catch { return Response.json({ fehler: "Keine Verbindung zum KI-Dienst." }, { status: 502 }); }
  if (antwort.status === 400 || antwort.status === 401 || antwort.status === 403) return Response.json({ fehler: "Der Schlüssel ist ungültig, gesperrt oder nicht freigeschaltet." }, { status: 502 });
  if (antwort.status === 429) return Response.json({ fehler: "Das kostenlose Limit ist gerade erreicht. Versuch es gleich noch einmal." }, { status: 429 });
  if (!antwort.ok) return Response.json({ fehler: `Der Dienst hat einen Fehler gemeldet (${antwort.status}).` }, { status: 502 });

  const daten = await antwort.json();
  const text = (daten.steps ?? []).filter((t) => t.type === "model_output").flatMap((t) => t.content ?? [])
    .filter((s) => s.type === "text").map((s) => s.text).join("\n").trim();
  if (!text) return Response.json({ fehler: "Keine Antwort erhalten." }, { status: 502 });
  return Response.json({ antwort: text });
};
