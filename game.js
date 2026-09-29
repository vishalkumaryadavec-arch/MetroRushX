/* =========================================================
   METRO RUSH X
   Complete Game Engine
   ========================================================= */

const $ = (id) => document.getElementById(id);

const state = {
  running: false,
  paused: false,
  score: 0,
  coins: 0,
  bank: Number(localStorage.getItem("metroRushBank") || 0),
  best: Number(localStorage.getItem("metroRushBest") || 0),
  distance: 0,
  combo: 1,
  speed: 7,
  lane: 0,
  targetLane: 0,
  playerY: 0,
  velocityY: 0,
  sliding: false,
  shield: false,
  magnet: false,
  boost: false,
  sound: true,
  music: false,
  selectedCharacter: "runner",
  objects: [],
  particles: [],
  lastTime: 0,
  spawnTimer: 0,
  coinTimer: 0,
  world: "METRO CITY"
};

const characters = {
  runner: { name: "Runner", icon: "🏃", price: 0 },
  girl: { name: "Street Girl", icon: "👩", price: 300 },
  robot: { name: "Robo-X", icon: "🤖", price: 600 },
  ninja: { name: "Night Ninja", icon: "🥷", price: 900 },
  skater: { name: "Street Skater", icon: "🛹", price: 1200 },
  racer: { name: "Turbo Racer", icon: "🏎️", price: 1500 },
  dj: { name: "Neon DJ", icon: "🎧", price: 1800 },
  explorer: { name: "Explorer", icon: "🧑‍🚀", price: 2200 },
  cyber: { name: "Cyber Scout", icon: "🦾", price: 2600 },
  biker: { name: "Metro Biker", icon: "🏍️", price: 3000 }
};

const worlds = [
  "METRO CITY",
  "NEON NIGHT",
  "DESERT LINE",
  "SNOW RUN",
  "JUNGLE RAIL",
  "SKY BRIDGE",
  "BEACH EXPRESS",
  "FUTURE LOOP"
];

const missions = [
  { text: "Collect 25 coins", target: 25, type: "coins" },
  { text: "Run 1000 meters", target: 1000, type: "distance" },
  { text: "Score 5000 points", target: 5000, type: "score" },
  { text: "Survive for 60 seconds", target: 60, type: "time" }
];

const missionProgress = {
  coins: 0,
  distance: 0,
  score: 0,
  time: 0
};

/* =========================================================
   CANVAS
   ========================================================= */

const game = $("game");

const canvas = document.createElement("canvas");
canvas.id = "metroCanvas";
canvas.style.position = "absolute";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.touchAction = "none";

game.appendChild(canvas);

const ctx = canvas.getContext("2d");

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

function sound(freq = 500, duration = 0.08) {
  if (!state.sound) return;

  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = freq;
    oscillator.type = "square";

    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {}
}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {
  $("score").textContent = Math.floor(state.score);
  $("coins").textContent = state.coins;
  $("bank").textContent = state.bank;
  $("best").textContent = state.best;
  $("combo").textContent = "x" + state.combo.toFixed(1);
  $("distance").textContent = Math.floor(state.distance) + "m";

  const powerups = [];

  if (state.shield) powerups.push("🛡️");
  if (state.magnet) powerups.push("🧲");
  if (state.boost) powerups.push("⚡");

  $("powerups").textContent = powerups.join(" ");
}

/* =========================================================
   BACKGROUND
   ========================================================= */

function drawBackground() {
  const w = innerWidth;
  const h = innerHeight;

  let gradient = ctx.createLinearGradient(0, 0, 0, h);

  if (state.world === "NEON NIGHT") {
    gradient.addColorStop(0, "#05051c");
    gradient.addColorStop(1, "#101a45");
  } else if (state.world === "DESERT LINE") {
    gradient.addColorStop(0, "#4a260e");
    gradient.addColorStop(1, "#d07b30");
  } else if (state.world === "SNOW RUN") {
    gradient.addColorStop(0, "#8bb8d8");
    gradient.addColorStop(1, "#dcecff");
  } else if (state.world === "JUNGLE RAIL") {
    gradient.addColorStop(0, "#062713");
    gradient.addColorStop(1, "#16633c");
  } else if (state.world === "BEACH EXPRESS") {
    gradient.addColorStop(0, "#32a7d6");
    gradient.addColorStop(1, "#f5d987");
  } else if (state.world === "FUTURE LOOP") {
    gradient.addColorStop(0, "#080018");
    gradient.addColorStop(1, "#28104c");
  } else {
    gradient.addColorStop(0, "#07111d");
    gradient.addColorStop(1, "#162c43");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  /* moon / sun */
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.15, 45, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,220,.8)";
  ctx.fill();

  /* buildings */
  for (let i = 0; i < 14; i++) {
    const bw = 45 + (i % 4) * 15;
    const bh = 80 + (i % 5) * 30;
    const x = i * (w / 12) - 30;

    ctx.fillStyle = "rgba(10,20,30,.8)";
    ctx.fillRect(x, h * 0.45 - bh, bw, bh);

    for (let y = h * 0.45 - bh + 15; y < h * 0.45; y += 20) {
      ctx.fillStyle = "rgba(255,220,90,.55)";
      ctx.fillRect(x + 8, y, 6, 8);
      ctx.fillRect(x + 24, y, 6, 8);
    }
  }
}

/* =========================================================
   TRACK
   ========================================================= */

function drawTrack() {
  const w = innerWidth;
  const h = innerHeight;

  const horizon = h * 0.43;

  ctx.fillStyle = "#15181c";

  ctx.beginPath();
  ctx.moveTo(w * 0.25, horizon);
  ctx.lineTo(w * 0.75, horizon);
  ctx.lineTo(w * 0.98, h);
  ctx.lineTo(w * 0.02, h);
  ctx.closePath();
  ctx.fill();

  /* rails */
  ctx.strokeStyle = "#777";
  ctx.lineWidth = 5;

  for (let i = 0; i < 4; i++) {
    const xTop = w * (0.25 + i * 0.166);
    const xBottom = w * (0.02 + i * 0.32);

    ctx.beginPath();
    ctx.moveTo(xTop, horizon);
    ctx.lineTo(xBottom, h);
    ctx.stroke();
  }

  /* sleepers */
  for (let i = 0; i < 18; i++) {
    const p = i / 18;
    const y = horizon + Math.pow(p, 1.7) * (h - horizon);

    const left = w * (0.25 - p * 0.23);
    const right = w * (0.75 + p * 0.23);

    ctx.strokeStyle = "rgba(130,130,130,.45)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

/* =========================================================
   PLAYER
   ========================================================= */

function laneX(lane) {
  return innerWidth / 2 + lane * Math.min(innerWidth * 0.17, 150);
}

function playerPosition() {
  const ground = innerHeight * 0.82;

  return {
    x: laneX(state.lane),
    y: ground - state.playerY
  };
}

function drawPlayer() {
  const p = playerPosition();
  const character = characters[state.selectedCharacter];

  ctx.save();

  ctx.translate(p.x, p.y);

  if (state.sliding) {
    ctx.rotate(-0.08);
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(character.icon, 0, 10);
  } else {
    ctx.font = "55px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(character.icon, 0, 0);
  }

  if (state.shield) {
    ctx.beginPath();
    ctx.arc(0, -25, 38, 0, Math.PI * 2);
    ctx.strokeStyle = "#4ddcff";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.restore();
}

/* =========================================================
   OBJECTS
   ========================================================= */

function spawnObject(type) {
  const lane = Math.floor(Math.random() * 3) - 1;

  state.objects.push({
    type,
    lane,
    z: 1,
    collected: false,
    speed: state.speed
  });
}

function spawnPattern() {
  const r = Math.random();

  if (r < 0.38) {
    spawnObject("obstacle");
  } else if (r < 0.75) {
    spawnObject("coin");
    if (Math.random() > 0.5) spawnObject("coin");
  } else if (r < 0.88) {
    spawnObject("train");
  } else {
    const powers = ["shield", "magnet", "boost"];
    spawnObject(powers[Math.floor(Math.random() * powers.length)]);
  }
}

function objectPosition(o) {
  const horizon = innerHeight * 0.43;
  const ground = innerHeight * 0.82;

  const progress = 1 - o.z;
  const y = horizon + Math.pow(progress, 1.5) * (ground - horizon);

  const center = innerWidth / 2;
  const spread = Math.min(innerWidth * 0.17, 150);

  const x = center + o.lane * spread * (0.25 + progress * 0.75);

  return { x, y, progress };
}

function drawObject(o) {
  const p = objectPosition(o);

  if (p.progress < 0) return;

  const size = 20 + p.progress * 70;

  ctx.save();
  ctx.translate(p.x, p.y);

  if (o.type === "coin") {
    ctx.beginPath();
    ctx.arc(0, -size * 0.3, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd83d";
    ctx.fill();

    ctx.strokeStyle = "#fff0a0";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (o.type === "obstacle") {
    ctx.fillStyle = "#ef3340";
    ctx.fillRect(
      -size * 0.45,
      -size,
      size * 0.9,
      size
    );

    ctx.fillStyle = "#ffb000";
    ctx.fillRect(
      -size * 0.35,
      -size * 0.65,
      size * 0.7,
      size * 0.12
    );
  }

  if (o.type === "train") {
    ctx.fillStyle = "#405b70";
    ctx.fillRect(
      -size * 0.55,
      -size * 1.7,
      size * 1.1,
      size * 1.7
    );

    ctx.fillStyle = "#8bd5ff";
    ctx.fillRect(
      -size * 0.35,
      -size * 1.45,
      size * 0.7,
      size * 0.4
    );
  }

  if (o.type === "shield") {
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("🛡️", 0, 0);
  }

  if (o.type === "magnet") {
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("🧲", 0, 0);
  }

  if (o.type === "boost") {
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("⚡", 0, 0);
  }

  ctx.restore();
}

/* =========================================================
   COLLISION
   ========================================================= */

function checkCollision(o) {
  if (o.collected) return false;

  if (o.z > 0.88) return false;

  if (o.lane !== state.lane) return false;

  if (o.type === "coin") return true;

  if (o.type === "shield" ||
      o.type === "magnet" ||
      o.type === "boost") {
    return true;
  }

  if (state.playerY > 55 && o.type === "obstacle") {
    return false;
  }

  if (state.sliding && o.type === "train") {
    return false;
  }

  return true;
}

/* =========================================================
   COLLECT / HIT
   ========================================================= */

function collect(o) {
  o.collected = true;

  if (o.type === "coin") {
    state.coins++;
    state.bank++;
    state.score += Math.floor(100 * state.combo);

    missionProgress.coins++;

    sound(900, 0.06);
    toast("+ COIN");
  }

  if (o.type === "shield") {
    state.shield = true;
    sound(700);
    toast("🛡️ SHIELD ACTIVATED");
  }

  if (o.type === "magnet") {
    state.magnet = true;
    sound(800);
    toast("🧲 MAGNET ACTIVATED");

    setTimeout(() => {
      state.magnet = false;
    }, 8000);
  }

  if (o.type === "boost") {
    state.boost = true;
    state.speed += 4;
    sound(1100);
    toast("⚡ SPEED BOOST");

    setTimeout(() => {
      state.speed = Math.max(7, state.speed - 4);
      state.boost = false;
    }, 5000);
  }

  updateHUD();
}

function hit(o) {
  if (o.collected) return;

  o.collected = true;

  if (state.shield) {
    state.shield = false;
    state.combo = 1;
    sound(250);
    toast("🛡️ SHIELD SAVED YOU!");
    return;
  }

  gameOver();
}

/* =========================================================
   JUMP / SLIDE / LANES
   ========================================================= */

function moveLeft() {
  if (!state.running || state.paused) return;

  state.targetLane = Math.max(-1, state.targetLane - 1);
  sound(300, 0.04);
}

function moveRight() {
  if (!state.running || state.paused) return;

  state.targetLane = Math.min(1, state.targetLane + 1);
  sound(350, 0.04);
}

function jump() {
  if (!state.running || state.paused) return;

  if (state.playerY <= 1) {
    state.velocityY = 16;
    sound(600, 0.1);
  }
}

function slide() {
  if (!state.running || state.paused) return;

  state.sliding = true;

  setTimeout(() => {
    state.sliding = false;
  }, 650);
}

/* =========================================================
   KEYBOARD
   ========================================================= */

window.addEventListener("keydown", (e) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(
      e.key
    )
  ) {
    e.preventDefault();
  }

  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") moveLeft();
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") moveRight();

  if (
    e.key === "ArrowUp" ||
    e.key.toLowerCase() === "w" ||
    e.key === " "
  ) jump();

  if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") slide();

  if (e.key.toLowerCase() === "p") togglePause();

  if (e.key.toLowerCase() === "m") toggleMusic();
});

/* =========================================================
   MOBILE SWIPE
   ========================================================= */

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener(
  "touchstart",
  (e) => {
    const t = e.changedTouches[0];

    touchStartX = t.clientX;
    touchStartY = t.clientY;
  },
  { passive: true }
);

canvas.addEventListener(
  "touchend",
  (e) => {
    const t = e.changedTouches[0];

    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? moveRight() : moveLeft();
    } else {
      dy < 0 ? jump() : slide();
    }
  },
  { passive: true }
);

/* =========================================================
   GAME LOOP
   ========================================================= */

function update(dt) {
  if (!state.running || state.paused) return;

  state.distance += state.speed * dt * 4;

  state.score += state.speed * dt * state.combo;

  missionProgress.distance = state.distance;
  missionProgress.score = state.score;
  missionProgress.time += dt;

  /* lane movement */
  state.lane += (state.targetLane - state.lane) * Math.min(dt * 12, 1);

  /* gravity */
  state.playerY += state.velocityY * dt;
  state.velocityY -= 36 * dt;

  if (state.playerY < 0) {
    state.playerY = 0;
    state.velocityY = 0;
  }

  /* difficulty */
  state.speed += dt * 0.035;

  state.spawnTimer -= dt;
  state.coinTimer -= dt;

  if (state.spawnTimer <= 0) {
    spawnPattern();

    state.spawnTimer =
      Math.max(0.35, 0.85 - state.distance / 15000) +
      Math.random() * 0.35;
  }

  if (state.coinTimer <= 0) {
    spawnObject("coin");
    state.coinTimer = 0.55;
  }

  /* objects */
  for (const o of state.objects) {
    o.z -= state.speed * dt * 0.055;

    /* magnet */
    if (
      state.magnet &&
      o.type === "coin" &&
      o.lane === state.lane &&
      o.z < 0.8
    ) {
      collect(o);
    }

    if (checkCollision(o)) {
      if (
        o.type === "coin" ||
        o.type === "shield" ||
        o.type === "magnet" ||
        o.type === "boost"
      ) {
        collect(o);
      } else {
        hit(o);
      }
    }
  }

  state.objects = state.objects.filter(
    (o) => o.z > -0.15 && !o.collected
  );

  /* combo */
  state.combo = Math.min(
    5,
    1 + Math.floor(state.distance / 1000) * 0.5
  );

  updateHUD();
}

function draw() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  drawBackground();
  drawTrack();

  for (const o of state.objects) {
    drawObject(o);
  }

  drawPlayer();

  /* speed lines */
  if (state.boost) {
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 2;

    for (let i = 0; i < 12; i++) {
      const x = Math.random() * innerWidth;

      ctx.beginPath();
      ctx.moveTo(x, innerHeight * 0.55);
      ctx.lineTo(
        x + (x - innerWidth / 2) * 0.4,
        innerHeight
      );
      ctx.stroke();
    }
  }

  if (state.paused && state.running) {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", innerWidth / 2, innerHeight / 2);
  }
}

function loop(time) {
  const dt = Math.min((time - state.lastTime) / 1000, 0.05);
  state.lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

/* =========================================================
   START / GAME OVER
   ========================================================= */

function startGame() {
  state.running = true;
  state.paused = false;

  state.score = 0;
  state.coins = 0;
  state.distance = 0;
  state.combo = 1;
  state.speed = 7;
  state.lane = 0;
  state.targetLane = 0;
  state.playerY = 0;
  state.velocityY = 0;
  state.sliding = false;
  state.shield = false;
  state.magnet = false;
  state.boost = false;

  state.objects = [];

  $("startScreen").classList.add("hidden");
  $("gameOver").classList.add("hidden");

  updateHUD();

  sound(700);
  toast("RUN STARTED!");
}

function gameOver() {
  if (!state.running) return;

  state.running = false;

  state.bank += state.coins;

  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    localStorage.setItem("metroRushBest", state.best);
  }

  localStorage.setItem("metroRushBank", state.bank);

  $("finalStats").innerHTML = `
    Score: <b>${Math.floor(state.score)}</b><br>
    Coins: <b>${state.coins}</b><br>
    Distance: <b>${Math.floor(state.distance)}m</b><br>
    Best: <b>${state.best}</b>
  `;

  $("gameOver").classList.remove("hidden");

  sound(120, 0.3);
  updateHUD();
}

/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {
  if (!state.running) return;

  state.paused = !state.paused;

  if (state.paused) {
    toast("PAUSED");
  } else {
    toast("RESUMED");
  }
}

$("pauseBtn")?.addEventListener("click", togglePause);

/* =========================================================
   MODALS
   ========================================================= */

function openModal(id) {
  $(id)?.classList.remove("hidden");
}

function closeModal(id) {
  $(id)?.classList.add("hidden");
}

$("shopBtn")?.addEventListener("click", () => {
  renderShop();
  openModal("shop");
});

$("missionBtn")?.addEventListener("click", () => {
  renderMissions();
  openModal("missions");
});

$("dailyBtn")?.addEventListener("click", () => {
  renderDaily();
  openModal("daily");
});

$("mapBtn")?.addEventListener("click", () => {
  openModal("world");
});

$("settingsBtn")?.addEventListener("click", () => {
  openModal("settings");
});

$("closeShop")?.addEventListener("click", () => closeModal("shop"));
$("closeWorld")?.addEventListener("click", () => closeModal("world"));
$("closeMissions")?.addEventListener("click", () => closeModal("missions"));
$("closeDaily")?.addEventListener("click", () => closeModal("daily"));
$("closeSettings")?.addEventListener("click", () => closeModal("settings"));

/* =========================================================
   START BUTTON
   ========================================================= */

$("startBtn")?.addEventListener("click",startRun);
$("restartBtn")?.addEventListener("click",startRun);
$("pauseBtn")?.addEventListener("click",togglePause);

$("shopBtn")?.addEventListener("click",()=>{
  renderShop();
  openModal("shop");
});

$("missionBtn")?.addEventListener("click",()=>{
  renderMissions();
  openModal("missions");
});

$("dailyBtn")?.addEventListener("click",()=>{
  renderDaily();
  openModal("daily");
});

$("mapBtn")?.addEventListener("click",()=>{
  openModal("world");
});

$("settingsBtn")?.addEventListener("click",()=>{
  openModal("settings");
});

$("closeShop")?.addEventListener("click",closeModals);
$("closeWorld")?.addEventListener("click",closeModals);
$("closeMissions")?.addEventListener("click",closeModals);
$("closeDaily")?.addEventListener("click",closeModals);
$("closeSettings")?.addEventListener("click",closeModals);

$("mute")?.addEventListener("click",toggleSound);
$("musicBtn")?.addEventListener("click",toggleMusic);

$("quality")?.addEventListener("change",e=>{
  save.quality=e.target.value;
  saveGame();
  toast("Graphics: "+e.target.value);
});

$$(".char").forEach(btn=>{
  btn.addEventListener("click",()=>{
    selectCharacter(btn.dataset.char);
  });
});

$$(".worldGrid button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    selectWorld(btn.textContent.trim());
  });
});

$$(".modal").forEach(modal=>{
  modal.addEventListener("click",e=>{
    if(e.target===modal) closeModals();
  });
});

// Initial UI state
if($("quality")) $("quality").value=save.quality||"high";

if($("mute"))
  $("mute").textContent=state.soundOn?"Sound: ON":"Sound: OFF";

if($("musicBtn"))
  $("musicBtn").textContent=state.musicOn?"Music: ON":"Music: OFF";

$$(".char").forEach(x=>{
  x.classList.toggle(
    "active",
    x.dataset.char===save.selectedChar
  );
});

updateHUD();

// Prevent accidental page scrolling while playing.
document.addEventListener("touchmove",e=>{
  if(state.running) e.preventDefault();
},{passive:false});

requestAnimationFrame(loop);
})();
