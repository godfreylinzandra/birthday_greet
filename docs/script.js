/*********************************
 * GLOBAL STATE
 *********************************/
let name = "";
let count = 5;
let countdownInterval = null;

// Candle state
let candles = [];
let blown = 0;

// Mic
let audioCtx, analyser, micStream, dataArray;

// Fireworks
let fireworksInterval = null;
let fallbackSongInterval = null;

/*********************************
 * AUDIO (WEB AUDIO = NO BLOCKING)
 *********************************/
let tickCtx = null;

function playTick() {
  if (!tickCtx) {
    tickCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const osc = tickCtx.createOscillator();
  const gain = tickCtx.createGain();

  osc.type = "square";
  osc.frequency.value = 900;
  gain.gain.value = 0.15;

  osc.connect(gain);
  gain.connect(tickCtx.destination);

  osc.start();
  osc.stop(tickCtx.currentTime + 0.07);
}

function playFallbackSongOnce() {
  if (!tickCtx) {
    tickCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (tickCtx.state === "suspended") {
    tickCtx.resume();
  }

  const notes = [392, 392, 440, 392, 523, 494, null, 392, 392, 440, 392, 587, 523];
  let t = tickCtx.currentTime;

  notes.forEach(freq => {
    if (!freq) {
      t += 0.2;
      return;
    }

    const osc = tickCtx.createOscillator();
    const gain = tickCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.value = 0.06;

    osc.connect(gain);
    gain.connect(tickCtx.destination);
    osc.start(t);
    osc.stop(t + 0.17);
    t += 0.2;
  });
}

function startFallbackSong() {
  if (fallbackSongInterval) return;
  playFallbackSongOnce();
  fallbackSongInterval = setInterval(playFallbackSongOnce, 3200);
}

function stopFallbackSong() {
  if (!fallbackSongInterval) return;
  clearInterval(fallbackSongInterval);
  fallbackSongInterval = null;
}

// Birthday music (HTML audio)
const music = document.getElementById("birthdayMusic");
let musicPrimed = false;

function primeBirthdayMusic() {
  if (!music || musicPrimed) return;

  music.muted = true;
  const primingPlay = music.play();

  if (primingPlay && typeof primingPlay.then === "function") {
    primingPlay
      .then(() => {
        music.pause();
        music.currentTime = 0;
        music.muted = false;
        musicPrimed = true;
      })
      .catch(() => {
        music.muted = false;
      });
  }
}

/*********************************
 * SCREEN CONTROL
 *********************************/
function switchScreen(id) {
  document.querySelectorAll(".screen").forEach(s =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
}

/*********************************
 * COUNTDOWN (FIXED)
 *********************************/
function startCountdown() {
  name = "Kuya";

  // Unlock audio context on user gesture
  playTick();
  primeBirthdayMusic();

  count = 5;
  const countdownEl = document.getElementById("countdown");

  switchScreen("countdownScreen");
  countdownEl.textContent = count;

  // 🔊 FIRST TICK AT 5
  playTick();

  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    count--;

    countdownEl.textContent = count;
    playTick();

    if (count === 0) {
      clearInterval(countdownInterval);

      document.getElementById("birthdayTitle").textContent =
        `Happy Birthday ${name}!!! 🎉🎉🎉`;
        
        

      switchScreen("birthdayScreen");
      createCandles();
    }
  }, 1000);
}

/*********************************
 * CANDLES
 *********************************/
const candleRow = document.getElementById("candles");
const statusBox = document.getElementById("status");
const fireworks = document.getElementById("fireworks");

function renderStatusNote(remaining) {
  const title = remaining > 0 ? `${remaining} candles lit.` : "All candles blown!";
  statusBox.innerHTML =
    "<div class='note-box'>" +
    `<p class='note-title'>${title}</p>` +
    "<p>Kuya open tim mic para mablow it candles. Dida blow hit harani ha mic okay okayyy.</p>" +
    "<p>Pag dire ngadi dumara pindota nala it Blow button HAHAHAHAHA</p>" +
    "</div>";
}

function createCandles() {
  candleRow.innerHTML = "";
  blown = 0;
  statusBox.style.display = "block";

  for (let i = 0; i < 30; i++) {
    const c = document.createElement("div");
    c.className = "candle";
    c.innerHTML = '<div class="flame"></div>';
    candleRow.appendChild(c);

  }
  candles = [...document.querySelectorAll(".candle")];
  renderStatusNote(candles.length - blown);


  fireworks.style.display = "none";
  fireworks.innerHTML = "";

  // ensure cake screen background returns to light state
  const cakeScreen = document.getElementById("birthdayScreen");
  if (cakeScreen) cakeScreen.classList.remove("fireworks-active");

  if (fireworksInterval) clearInterval(fireworksInterval);
  stopFallbackSong();

  music.pause();
  music.currentTime = 0;
}

function blowPair() {
  for (let i = 0; i < 2; i++) {
    const c = candles[blown];
    if (!c) break;
    c.querySelector(".flame").style.opacity = "0";
    blown++;
  }

  const remaining = candles.length - blown;
  renderStatusNote(remaining);

  if (remaining === 0) startFireworks();
}

// Buttons
document.getElementById("blowBtn").onclick = () => {
  primeBirthdayMusic();
  blowPair();
};
document.getElementById("resetBtn").onclick = createCandles;

// Spacebar blow
document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    primeBirthdayMusic();
    blowPair();
  }
});

/*********************************
 * FIREWORKS + MUSIC
 *********************************/
function startFireworks() {
  statusBox.style.display = "none";
  fireworks.style.display = "block";

  // switch cake screen to dark background while fireworks play
  const cakeScreen = document.getElementById("birthdayScreen");
  if (cakeScreen) cakeScreen.classList.add("fireworks-active");

  primeBirthdayMusic();
  music.volume = 0.6;
  music.play().catch(() => {
    startFallbackSong();
  });

  function burst() {
    for (let i = 0; i < 50; i++) {
      const f = document.createElement("div");
      f.className = "firework";
      f.style.top = Math.random() * innerHeight + "px";
      f.style.left = Math.random() * innerWidth + "px";
      f.style.setProperty("--x", Math.random() * 200 - 100 + "px");
      f.style.setProperty("--y", Math.random() * 200 - 100 + "px");
      f.style.background = `hsl(${Math.random() * 360},100%,60%)`;
      fireworks.appendChild(f);
      setTimeout(() => f.remove(), 1000);
    }
  }

  burst();
  fireworksInterval = setInterval(burst, 1200);
}

/*********************************
 * MIC BLOW (WORKING)
 *********************************/
document.getElementById("micBtn").onclick = async () => {
  if (micStream) return;
  primeBirthdayMusic();

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    const source = audioCtx.createMediaStreamSource(micStream);
    source.connect(analyser);

    dataArray = new Uint8Array(analyser.fftSize);
    listenForBlow();

    document.getElementById("micBtn").disabled = true;
    document.getElementById("micBtn").textContent = "Mic Enabled";
  } catch {
    alert("Mic access denied");
  }
};

function listenForBlow() {
  analyser.getByteTimeDomainData(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }

  const volume = Math.sqrt(sum / dataArray.length);
  if (volume > 0.15) blowPair();

  requestAnimationFrame(listenForBlow);
}
