// @ts-nocheck
// Radio CAR: Supabase Edge Function. Misma interfaz que el Worker de Cloudflare.
// Requiere secretos ELEVENLABS_API_KEY y CAR_RADIO_ACCESS_TOKEN en Supabase.
/**
 * CAR Radio · ElevenLabs proxy (Cloudflare Workers Free).
 * Publish this Worker in your own Cloudflare account. NEVER put API keys here.
 * Configure encrypted secrets in the Worker dashboard:
 *   ELEVENLABS_API_KEY, CAR_RADIO_ACCESS_TOKEN
 */
const ORIGIN = "https://salvadorciaurriz-lang.github.io";
const MODELS = new Set(["eleven_v3", "eleven_v4", "eleven_flash_v2_5", "eleven_multilingual_v2"]);
const VOICE_ID = /^[A-Za-z0-9_-]{8,70}$/;
const MAX_TEXT = 2000;
function headers(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ORIGIN ? ORIGIN : ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Car-Radio-Token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}
function json(body, status = 200, origin = ORIGIN) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers(origin), "Content-Type": "application/json;charset=utf-8" }
  });
}
function validInput(v) {
  return v && typeof v.text === "string" && v.text.trim().length > 0
    && v.text.length <= MAX_TEXT && typeof v.voice_id === "string" && VOICE_ID.test(v.voice_id);
}
const proxy = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const h = headers(origin);
    if (origin && origin !== ORIGIN) return json({ error: "Origen no autorizado." }, 403, origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    const url = new URL(request.url);
    if (!env.ELEVENLABS_API_KEY || !env.CAR_RADIO_ACCESS_TOKEN)
      return json({ error: "Debes añadir los secretos del Worker antes de utilizarlo." }, 503, origin);
    const provided = request.headers.get("X-Car-Radio-Token") || "";
    if (provided.length < 16 || provided !== env.CAR_RADIO_ACCESS_TOKEN)
      return json({ error: "Código de acceso de Radio CAR no válido." }, 401, origin);
    const upstreamHeaders = { "xi-api-key": env.ELEVENLABS_API_KEY };
    try {
      if (request.method === "GET" && url.pathname.endsWith("/health"))
        return json({ ok: true, service: "CAR Radio ElevenLabs" }, 200, origin);
      if (request.method === "GET" && url.pathname.endsWith("/voices")) {
        const upstream = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", { headers: upstreamHeaders });
        if (!upstream.ok) return await upstreamError(upstream, origin);
        const data = await upstream.json();
        const voices = Array.isArray(data.voices) ? data.voices
          .filter(v => v && VOICE_ID.test(v.voice_id || ""))
          .map(v => ({ id: v.voice_id, name: String(v.name || "Voz sin nombre").slice(0, 100) })) : [];
        return json({ voices, hasMore: !!data.has_more }, 200, origin);
      }
      if (request.method === "POST" && url.pathname.endsWith("/speak")) {
        const size = Number(request.headers.get("Content-Length") || 0);
        if (size > 28000) return json({ error: "Petición demasiado grande." }, 413, origin);
        let params;
        try { params = await request.json(); }
        catch { return json({ error: "JSON inválido." }, 400, origin); }
        if (!MODELS.has(params?.model))
          return json({ error: "Modelo no compatible." }, 400, origin);
        let upstream, body;
        if (params.model === "eleven_v3" || params.model === "eleven_v4") {
          if (!Array.isArray(params.inputs) || params.inputs.length < 1 || params.inputs.length > 32 ||
              params.inputs.some(v => !validInput(v)) ||
              params.inputs.reduce((sum, v) => sum + v.text.length, 0) > MAX_TEXT)
            return json({ error: "Diálogo inválido. Máximo 2.000 caracteres por fragmento." }, 400, origin);
          upstream = "https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128";
          body = { model_id: params.model, inputs: params.inputs.map(v => ({ text: v.text, voice_id: v.voice_id })) };
        } else {
          if (!validInput(params.input))
            return json({ error: "Intervención inválida. Máximo 2.000 caracteres." }, 400, origin);
          const st = params.settings || {};
          const number = (v, fallback, min, max) =>
            typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
          const settings = {
            stability: number(st.stability, 0.5, 0, 1),
            similarity_boost: number(st.similarity_boost, 0.8, 0, 1),
            style: number(st.style, 0.1, 0, 1),
            use_speaker_boost: true
          };
          upstream = "https://api.elevenlabs.io/v1/text-to-speech/" +
            encodeURIComponent(params.input.voice_id) + "?output_format=mp3_44100_128";
          body = { model_id: params.model, text: params.input.text, voice_settings: settings };
        }
        const upstreamRes = await fetch(upstream, {
          method: "POST",
          headers: { ...upstreamHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!upstreamRes.ok) return await upstreamError(upstreamRes, origin);
        return new Response(upstreamRes.body, {
          status: 200,
          headers: { ...h, "Content-Type": "audio/mpeg", "X-Content-Type-Options": "nosniff" }
        });
      }
      return json({ error: "Ruta no encontrada." }, 404, origin);
    } catch (error) {
      return json({ error: "Error conectando con ElevenLabs: " + String(error?.message || "desconocido").slice(0, 160) }, 502, origin);
    }
  }
};
async function upstreamError(response, origin) {
  const text = await response.text().catch(() => "");
  let message = "ElevenLabs HTTP " + response.status;
  try {
    const parsed = JSON.parse(text);
    const detail = parsed.detail?.message || parsed.detail?.status || parsed.error?.message;
    if (typeof detail === "string") message += ": " + detail.slice(0, 220);
  } catch {}
  return json({ error: message }, response.status >= 500 ? 502 : response.status, origin);
}

Deno.serve((req) => proxy.fetch(req, {
  ELEVENLABS_API_KEY: Deno.env.get("ELEVENLABS_API_KEY") || "",
  CAR_RADIO_ACCESS_TOKEN: Deno.env.get("CAR_RADIO_ACCESS_TOKEN") || ""
}));
