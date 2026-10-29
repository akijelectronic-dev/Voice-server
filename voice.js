// Universal Voice Server – frontend helper
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
  stopCloud(); // stop anything already playing

  const res = await fetch(VOICE_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang: langCode }),
  });

  if (!res.ok) {
    let msg = `Voice server error ${res.status}`;
    try { msg = (await res.json()).error || msg; } catch (_) {}
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  _currentAudio = audio;
  _currentUrl = url;

  // Resolves when playback finishes (handy for chaining translations)
  return new Promise((resolve, reject) => {
    audio.onended = () => { if (_currentUrl === url) stopCloud(); resolve(); };
    audio.onerror = () => { if (_currentUrl === url) stopCloud(); reject(new Error("Audio playback failed")); };
    audio.play().catch((e) => { stopCloud(); reject(e); }); // must be triggered by a user tap/click on first use
  });
}
