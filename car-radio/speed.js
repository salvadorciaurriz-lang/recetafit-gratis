/* CAR Radio · Exportación WAV a diferentes velocidades (WSOLA, sin alterar el tono). */
(() => {
  "use strict";
  const RATE_OPTIONS = [0.85, 1, 1.1, 1.2, 1.25, 1.35, 1.5, 1.75, 2];
  const audio = $("audio"), rateSelect = $("exportSpeed");
  const downloadButton = $("download"), shareButton = $("share");
  const hint = $("speedStatus");
  const readyWrap = $("speedReadyWrap"), readyLink = $("speedReadyLink");
  let preparedUrl = null;
  let busy = false;

  function invalidatePrepared() {
    readyWrap.classList.add("hidden");
    readyLink.removeAttribute("href");
    if (preparedUrl) URL.revokeObjectURL(preparedUrl);
    preparedUrl = null;
  }

  function offerPreparedFile(result, name) {
    invalidatePrepared();
    preparedUrl = URL.createObjectURL(new Blob([result], { type: "audio/wav" }));
    readyLink.href = preparedUrl;
    readyLink.download = name;
    readyWrap.classList.remove("hidden");
  }
  const exactRate = x => RATE_OPTIONS.find(v => Math.abs(v - Number(x)) < 0.0001) ?? 1;
  const prettyRate = n => String(n).replace(".", ",") + "x";
  const yieldToUI = () => new Promise(resolve => setTimeout(resolve, 0));

  function setRate(value, persist = true) {
    const rate = exactRate(value);
    rateSelect.value = String(rate);
    if (persist) invalidatePrepared();
    audio.defaultPlaybackRate = rate;
    audio.playbackRate = rate;
    if ("preservesPitch" in audio) audio.preservesPitch = true;
    if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = true;
    downloadButton.textContent = "Descargar WAV · " + prettyRate(rate);
    if (!busy) hint.textContent = "Reproducción y descarga a " + prettyRate(rate) + ". El WAV mantiene el tono original de las voces.";
    if (persist) save("speed", rate);
  }

  // Estiramiento temporal WSOLA para voz, sin dependencias ni cuota Gemini.
  // La entrada de CAR Radio es PCM 16-bit mono a 24 kHz.
  async function stretchWav(inputWav, rate, progress = () => {}) {
    if (rate === 1) return inputWav;
    const bytes = getPcm(inputWav);
    if (bytes.length % 2 !== 0) throw Error("El audio PCM tiene una longitud incorrecta.");
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    if (samples.length < 960) throw Error("El audio es demasiado corto para modificar la velocidad.");
    const destLength = Math.round(samples.length / rate);
    if (!Number.isSafeInteger(destLength) || destLength <= 0 || destLength > 50000000) throw Error("El audio supera el tamaño de exportación admitido.");
    const output = new Float32Array(destLength);
    const HOP = 480, FRAME = HOP * 2, SEARCH = 192, STRIDE = 8;
    const maxStart = samples.length - FRAME;
    const fade = new Float32Array(HOP);
    for (let i = 0; i < HOP; i++) fade[i] = (1 - Math.cos(Math.PI * i / (HOP - 1))) / 2;
    const first = Math.min(FRAME, destLength);
    for (let i = 0; i < first; i++) output[i] = samples[i] / 32768;
    let previousStart = 0, frameIndex = 0;
    const frameCount = Math.max(1, Math.ceil(destLength / HOP) - 1);

    for (let dest = HOP; dest < destLength; dest += HOP) {
      const expected = Math.max(0, Math.min(maxStart, Math.round(dest * rate)));
      let bestStart = expected, bestScore = -Infinity;
      let previousEnergy = 0;
      for (let j = 0; j < HOP; j += STRIDE) {
        const v = samples[previousStart + HOP + j];
        previousEnergy += v * v;
      }
      if (previousEnergy > 300000) {
        const from = Math.max(0, expected - SEARCH), to = Math.min(maxStart, expected + SEARCH);
        const candidates = [];
        for (let start = from; start <= to; start += STRIDE) candidates.push(start);
        if (!candidates.includes(expected)) candidates.push(expected);
        for (const candidate of candidates) {
          let cross = 0, candEnergy = 0;
          for (let j = 0; j < HOP; j += STRIDE) {
            const a = samples[previousStart + HOP + j];
            const b = samples[candidate + j];
            cross += a * b;
            candEnergy += b * b;
          }
          if (candEnergy < 300000) continue;
          const similarity = cross / Math.sqrt(previousEnergy * candEnergy);
          const score = similarity - 0.00009 * Math.abs(candidate - expected);
          if (score > bestScore) { bestScore = score; bestStart = candidate; }
        }
      }
      const overlap = Math.min(HOP, destLength - dest);
      for (let i = 0; i < overlap; i++) {
        const t = fade[i];
        output[dest + i] = output[dest + i] * (1 - t) + samples[bestStart + i] / 32768 * t;
      }
      const tailOffset = dest + HOP;
      const tailCount = Math.min(HOP, Math.max(0, destLength - tailOffset));
      for (let i = 0; i < tailCount; i++) output[tailOffset + i] = samples[bestStart + HOP + i] / 32768;
      previousStart = bestStart;
      frameIndex++;
      if (frameIndex % 110 === 0) {
        progress(Math.min(98, Math.round((frameIndex / frameCount) * 100)));
        await yieldToUI();
      }
    }
    progress(99);
    const pcm = new Uint8Array(destLength * 2);
    const view = new DataView(pcm.buffer);
    for (let i = 0; i < destLength; i++) {
      const sample = Math.max(-1, Math.min(1, output[i]));
      view.setInt16(i * 2, Math.max(-32768, Math.min(32767, Math.round(sample * 32768))), true);
    }
    progress(100);
    return wav(pcm);
  }

  async function exportAtSelectedSpeed(mode) {
    if (!current || busy) return;
    const original = current, rate = exactRate(rateSelect.value);
    busy = true;
    downloadButton.disabled = true;
    shareButton.disabled = true;
    rateSelect.disabled = true;
    try {
      hint.textContent = rate === 1 ? "Preparando WAV original…" : "Preparando WAV a " + prettyRate(rate) + " (0 %)…";
      await yieldToUI();
      const result = await stretchWav(original, rate, pct => {
        hint.textContent = "Preparando WAV a " + prettyRate(rate) + " (" + pct + " %)…";
      });
      const name = "CAR_Radio_" + String(rate).replace(".", "-") + "x.wav";
      offerPreparedFile(result, name);
      if (mode === "share" && navigator.share && navigator.canShare && typeof File !== "undefined") {
        const file = new File([result], name, { type: "audio/wav" });
        if (navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: "CAR Radio · " + prettyRate(rate) }); }
          catch (e) { if (e.name !== "AbortError") hint.textContent = "Usa el enlace «Guardar WAV preparado» para guardar el archivo en Safari."; return; }
        } else download(result, name, "audio/wav");
      } else download(result, name, "audio/wav");
      hint.textContent = "Archivo listo a " + prettyRate(rate) + ". Puedes elegir otra velocidad sin regenerar el audio con Gemini.";
    } catch (e) {
      if (e.name !== "AbortError") {
        hint.textContent = "No se pudo preparar el archivo: " + String(e.message || e);
        alert(hint.textContent);
      }
    } finally {
      busy = false;
      downloadButton.disabled = !current;
      shareButton.disabled = !current;
      rateSelect.disabled = false;
    }
  }

  rateSelect.onchange = () => setRate(rateSelect.value);
  audio.addEventListener("loadedmetadata", () => { invalidatePrepared(); setRate(rateSelect.value, false); });
  downloadButton.onclick = () => exportAtSelectedSpeed("download");
  shareButton.onclick = () => exportAtSelectedSpeed("share");
  setRate(load("speed", 1), false);
  window.CARRadioSpeed = { setRate, exactRate, stretchWav };
})();