// Universal Voice Server v2 – frontend helper
// Usage: await speakCloud("আসসালামু আলাইকুম", "bn");

const VOICE_WORKER_URL = "https://voice-server.akijelectronic.workers.dev/tts";

let _currentAudio = null;
let _currentUrl = null;

function stopCloud() {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
  }
  if (_currentUrl) {
    URL.revokeObjectURL(_currentUrl);
    _currentUrl = null;
  }
}

async function speakCloud(text, langCode = "en") {
  if (!text || !text.trim()) return;
  stopCloud();

  let res;
  try {
    res = await fetch(VOICE_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: langCode }),
    });
  } catch (e) {
    throw new Error("Cannot reach voice server. Check Worker URL / internet.");
  }

  if (!res.ok) {
    let msg = `Voice server error ${res.status}`;
    try {
      const j = await res.json();
      msg = (j.error || msg) + (j.detail ? " – " + j.detail : "");
    } catch (_) {}
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  _currentAudio = audio;
  _currentUrl = url;

  return new Promise((resolve, reject) => {
    audio.onended = () => { if (_currentUrl === url) stopCloud(); resolve(); };
    audio.onerror = () => { if (_currentUrl === url) stopCloud(); reject(new Error("Audio playback failed")); };
    audio.play().catch((e) => { stopCloud(); reject(e); });
  });
}
