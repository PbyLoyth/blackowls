// Açılış: amblem karanlıktan çıkar, gözler imleci izler, kaydırınca göz bebeğinden sahaya girilir.
// WebGL2 yoksa veya hareket azaltılmışsa <img> kalır; sayfa bu dosya olmadan da tam çalışır.

const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uEm;
uniform vec2 uRes, uPupil, uTarget, uLook, uSize;
uniform vec4 uRect;
uniform float uZoom, uBlink, uLight, uEyes, uHole, uTime;
out vec4 o;
const vec3 AMBER = vec3(1., .6, .05);
const vec2 EYE_L = vec2(.4225, .2905);
const vec2 EYE_R = vec2(.6755, .2868);
const vec2 PUP_L = vec2(.4235, .2850);
const vec2 PUP_R = vec2(.6722, .2822);
const float R_L = .054;
const float R_R = .047;
const float PUPIL = .0245;

vec4 em(vec2 e){
  if (e.x < 0. || e.x > 1. || e.y < 0. || e.y > 1.) return vec4(0.);
  return texture(uEm, e);
}
float dist(vec2 e, vec2 c){ return length((e - c) * uRect.zw) / uRect.w; }

// Yakın planda doku pikselleri görünmesin diye Catmull-Rom ile örneklenir
vec4 cubic(vec2 e){
  if (e.x < 0. || e.x > 1. || e.y < 0. || e.y > 1.) return vec4(0.);
  vec2 q = e * uSize - .5;
  vec2 i = floor(q), f = q - i;
  vec2 w0 = f * (-.5 + f * (1. - .5 * f));
  vec2 w1 = 1. + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (.5 + f * (2. - 1.5 * f));
  vec2 w3 = f * f * (-.5 + .5 * f);
  vec2 w12 = w1 + w2;
  vec2 a = (i - .5) / uSize, b = (i + .5 + w2 / w12) / uSize, c = (i + 2.5) / uSize;
  return (textureLod(uEm, vec2(a.x, a.y), 0.) * w0.x + textureLod(uEm, vec2(b.x, a.y), 0.) * w12.x + textureLod(uEm, vec2(c.x, a.y), 0.) * w3.x) * w0.y
       + (textureLod(uEm, vec2(a.x, b.y), 0.) * w0.x + textureLod(uEm, vec2(b.x, b.y), 0.) * w12.x + textureLod(uEm, vec2(c.x, b.y), 0.) * w3.x) * w12.y
       + (textureLod(uEm, vec2(a.x, c.y), 0.) * w0.x + textureLod(uEm, vec2(b.x, c.y), 0.) * w12.x + textureLod(uEm, vec2(c.x, c.y), 0.) * w3.x) * w3.y;
}

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}

// Büyütmede kaybolan iris dokusu matematikle çizilir, her yakınlıkta keskin kalır
vec3 iris(vec3 c, vec2 e, vec2 pup, float radius, float amount){
  vec2 d = (e - pup) * uRect.zw / uRect.w;
  float r = length(d);
  float zone = smoothstep(PUPIL * .96, PUPIL * 1.14, r) * (1. - smoothstep(radius * .84, radius, r));
  if (zone <= 0.) return c;
  vec2 u = d / max(r, 1e-5);
  float hair = noise(u * 430. + r * 90.);
  float fine = noise(u * 150. + r * 40.);
  float mid = noise(u * 58. - r * 22.);
  float wide = noise(u * 17. + r * 70.);
  float k = zone * amount;
  c *= 1. + (hair * .26 + fine * .42 + mid * .32 - .5) * 1.05 * k;
  c *= 1. - .3 * k * smoothstep(.54, .8, wide);
  c += c * k * pow(fine, 6.) * .6;
  return c + AMBER * k * .08 * (1. - smoothstep(PUPIL, PUPIL * 1.5, r));
}

// Dış tüyler göz bebeğinden dışarı doğru akar, dokunun yumuşaması hız izine dönüşür
vec4 streak(vec2 e, vec2 pup, float len, float seed){
  vec4 sum = vec4(0.);
  for (int i = 0; i < 10; i++) sum += em(pup + (e - pup) * (1. - len * (float(i) + seed) / 10.));
  return sum / 10.;
}

// Göz bebeği irisin içinde kayar, kenar sabit kalır
vec2 warp(vec2 e, vec2 pup){
  float d = dist(e, pup);
  float fall = 1. - smoothstep(.016, .05, d);
  return e - uLook * vec2(.0105 * uRect.w / uRect.z, .0085) * fall;
}

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = uPupil + (px - uTarget) / uZoom;
  vec2 e = (p - uRect.xy) / uRect.zw + .5;

  float dL = dist(e, EYE_L);
  float dR = dist(e, EYE_R);
  float mL = 1. - smoothstep(R_L - .012, R_L + .012, dL);
  float mR = 1. - smoothstep(R_R - .012, R_R + .012, dR);
  float eye = max(mL, mR);

  vec2 s = e;
  if (mL > 0.) s = mix(s, warp(e, PUP_L), mL);
  if (mR > 0.) s = mix(s, warp(e, PUP_R), mR);

  // Yakınlaştıkça keskin örnekleme, iris çizimi ve dış karartma devreye girer
  float macro = smoothstep(1.5, 6., uZoom);
  float seed = hash(gl_FragCoord.xy * .37 + uTime);
  float far = dist(s, PUP_L);
  vec4 c = uZoom * uRect.w > uSize.y ? clamp(cubic(s), 0., 1.) : em(s);
  if (macro > 0.) {
    float outer = smoothstep(.052, .07, far);
    if (outer > 0.) c = mix(c, streak(s, PUP_L, .05 + .26 * macro, seed), outer * macro);
  }

  vec3 base = c.rgb;
  float warm = smoothstep(.02, .22, base.r - base.b) * eye;
  vec3 lit = mix(base, base * vec3(1.2, 1.06, .9), warm);
  if (macro > 0.) {
    lit = iris(lit, s, PUP_L, R_L, macro * warm);
    lit *= mix(1., mix(.1, 1., 1. - smoothstep(.058, .14, far)) * mix(.16, 1., warm), macro);
  }

  // Işık önce gözlere gelir, sonra amblemin tamamına yayılır
  vec3 col = lit * mix(uLight, 1., eye * uEyes);

  // Göz kapağı
  if (uBlink > .001) {
    float cy = dL < dR ? EYE_L.y : EYE_R.y;
    float r = dL < dR ? R_L : R_R;
    float lid = smoothstep(-.001, .004, (cy - r * .8 + uBlink * r * 1.8) - e.y);
    col = mix(col, vec3(.035), lid * eye);
  }

  // Gözlerden yayılan sıcak ışık
  float glow = exp(-pow(dL / .085, 2.)) + exp(-pow(dR / .075, 2.));
  col += AMBER * glow * .075 * uEyes * (1. - uBlink);

  // Göz bebeğindeki delik: altındaki video buradan görünür, kenarı yumuşak bir gölgeyle biter
  float hole = 0.;
  vec3 rim = vec3(0.);
  if (uHole > .001) {
    float dh = dist(e, PUP_L);
    float edge = PUPIL * uHole;
    float soft = edge * .26 + 1.5 * fwidth(dh);
    col *= smoothstep(PUPIL * .92, PUPIL * 1.4, dh);
    hole = 1. - smoothstep(edge - soft, edge, dh);
    rim = AMBER * exp(-pow((dh - edge) / (edge * .028 + 1e-4), 2.)) * .34 * smoothstep(0., .3, uHole);
  }

  // İnce gren koyu geçişlerdeki bantlaşmayı siler
  col += (seed - .5) * .03 * macro;

  o = vec4(col * (1. - hole) + rim, 1. - hole);
}`;

function program(gl, fs) {
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'a');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name;
    u[name] = gl.getUniformLocation(p, name);
  }
  return { p, u };
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

export async function startHero() {
  const root = document.querySelector('[data-opening]');
  const canvas = root?.querySelector('[data-gl]');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return;

  const stage = root.querySelector('[data-stage]');
  const emblem = root.querySelector('[data-emblem]');
  const copy = root.querySelector('[data-hero]');
  const gap = root.querySelector('[data-dive-gap]');
  const reel = root.querySelector('[data-reel]');
  const wrap = root.querySelector('[data-film-wrap]');
  const ui = root.querySelector('[data-film-ui]');
  const toggle = root.querySelector('[data-film-toggle]');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!emblem.complete) await new Promise((r) => emblem.addEventListener('load', r, { once: true }));
  const img = new Image();
  img.src = emblem.currentSrc || emblem.src;
  await img.decode();

  const P = program(gl, FRAG);
  gl.useProgram(P.p);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(P.u.uEm, 0);
  gl.uniform2f(P.u.uSize, img.naturalWidth, img.naturalHeight);

  const S = { w: 0, h: 0, dpr: 1, rect: [0, 0, 0, 0], pupil: [0, 0], travel: 1 };

  function layout() {
    const r = stage.getBoundingClientRect();
    const b = emblem.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    S.dpr = dpr;
    S.w = Math.round(r.width * dpr);
    S.h = Math.round(r.height * dpr);
    canvas.width = S.w;
    canvas.height = S.h;
    gl.viewport(0, 0, S.w, S.h);
    const ex = (b.left - r.left + b.width / 2) * dpr;
    const ey = (b.top - r.top + b.height / 2) * dpr;
    S.rect = [ex, ey, b.width * dpr, b.height * dpr];
    S.pupil = [ex + (0.4235 - 0.5) * S.rect[2], ey + (0.285 - 0.5) * S.rect[3]];
    S.travel = Math.max(1, gap.offsetHeight);
    gl.uniform2f(P.u.uRes, S.w, S.h);
    gl.uniform4f(P.u.uRect, ...S.rect);
    gl.uniform2f(P.u.uPupil, ...S.pupil);
  }
  layout();

  let progress = 0;
  let goal = 0;
  let drawn = -1;
  let visible = true;
  let last = 0;
  let paused = false;
  let reelLoaded = false;
  const start = performance.now();
  const look = { x: 0, y: 0, tx: 0, ty: 0, next: 2600 };
  const pointer = { x: 0, y: 0, on: false };
  let blinkAt = 2100;
  let blink = 0;

  const onScroll = () => {
    goal = clamp(Math.max(0, -root.getBoundingClientRect().top) / S.travel);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (fine) {
    addEventListener('pointermove', (ev) => {
      pointer.x = ev.clientX * S.dpr;
      pointer.y = ev.clientY * S.dpr;
      pointer.on = true;
    }, { passive: true });
  }

  let resizeT;
  let lastW = innerWidth;
  let lastH = innerHeight;
  addEventListener('resize', () => {
    // Mobil adres çubuğu yüksekliği değiştirir: küçük farkları yok say
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 140) return;
    lastW = innerWidth;
    lastH = innerHeight;
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      layout();
      onScroll();
    }, 140);
  });


  const syncReel = () => {
    if (!reelLoaded && progress > 0.015) {
      reelLoaded = true;
      reel.poster = reel.dataset.poster;
      reel.preload = 'auto';
      reel.load();
    }
    if (reelLoaded) {
      const should = visible && progress > 0.1 && !paused;
      if (should && reel.paused) reel.play().catch(() => {});
      if (!should && !reel.paused) reel.pause();
    }
  };

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    syncReel();
  }).observe(stage);

  toggle?.addEventListener('click', () => {
    paused = !paused;
    toggle.toggleAttribute('data-paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Videoyu oynat' : 'Videoyu duraklat');
    syncReel();
  });

  canvas.dataset.ready = '1';

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = now - start;
    const dt = Math.min(48, now - (last || now));
    last = now;

    // Kritik sönümlü takip: aşma yok, her an yön değiştirilebilir
    progress += (goal - progress) * (1 - Math.exp(-dt / 85));
    if (Math.abs(goal - progress) < 0.0004) progress = goal;
    syncReel();

    const p = progress;
    const rise = sstep(0.02, 0.36, p);
    const dive = sstep(0.1, 0.7, p);
    const zoom = Math.exp(Math.pow(dive, 1.7) * Math.log(72));

    if (p !== drawn) {
      drawn = p;
      copy.style.opacity = String(1 - sstep(0, 0.13, p));
      copy.style.transform = `translate3d(0,${-p * 70}px,0)`;
      reel.style.transform = `scale(${1 + 0.42 * Math.pow(1 - dive, 2)})`;

      const shown = sstep(0.74, 0.82, p);
      ui.style.opacity = String(shown);
      ui.toggleAttribute('data-on', shown > 0.5);

      // Sahne çıkarken görüntü karta dönüşür
      const card = sstep(0.86, 1, p);
      wrap.style.clipPath = card > 0
        ? `inset(${card * 3}svh ${card * 4}vw ${card * 3}svh ${card * 4}vw round ${card * 28}px)`
        : 'none';
    }

    const done = dive >= 0.999;
    canvas.style.visibility = done ? 'hidden' : 'visible';
    if (done) return;

    // Gözler: fare varsa onu, yoksa ara sıra etrafı izler
    if (pointer.on) {
      look.tx = clamp((pointer.x - S.pupil[0] - S.rect[2] * 0.1) / (S.rect[2] * 0.6), -1, 1);
      look.ty = clamp((pointer.y - S.pupil[1]) / (S.rect[3] * 0.4), -1, 1);
    } else if (t > look.next) {
      look.tx = (Math.random() - 0.5) * 1.5;
      look.ty = (Math.random() - 0.5) * 0.9;
      look.next = t + 2400 + Math.random() * 3200;
    }
    const lk = 1 - Math.exp(-dt / 90);
    look.x += (look.tx - look.x) * lk;
    look.y += (look.ty - look.y) * lk;

    if (t > blinkAt) {
      const b = (t - blinkAt) / 200;
      blink = b < 0.5 ? b * 2 : 2 - b * 2;
      if (b >= 1) {
        blink = 0;
        blinkAt = t + 3800 + Math.random() * 5200;
      }
    }

    const eyes = sstep(0, 620, t);
    const light = lerp(0.02, 1, sstep(320, 1500, t));
    // Göz bebeği önce kararır, sonra genişleyerek sahayı açar
    const hole = sstep(0.34, 0.5, p);
    const target = [lerp(S.pupil[0], S.w * 0.5, rise), lerp(S.pupil[1], S.h * 0.5, rise)];

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(P.u.uTarget, target[0], target[1]);
    // Dalış başlayınca gözler sabitlenir, iris çizimi dokuyla örtüşür
    const steady = 1 - sstep(0.06, 0.2, p);
    gl.uniform2f(P.u.uLook, look.x * steady, look.y * steady);
    gl.uniform1f(P.u.uTime, (t * 0.001) % 60);
    gl.uniform1f(P.u.uZoom, zoom);
    gl.uniform1f(P.u.uBlink, blink);
    gl.uniform1f(P.u.uLight, light);
    gl.uniform1f(P.u.uEyes, eyes);
    gl.uniform1f(P.u.uHole, hole);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);
}
