"use strict";
/* ===== Konfigurasi (ubah di sini) ===== */
const siteConfig = { name: "Sehatin", shortName: "SEHATIN", tagline: "Kenali tubuhmu, satu langkah kecil pada satu waktu.", description: "Screening kesehatan edukatif", version: "1.0.0", language: "id-ID", emergencyNumber: "119" };
const projectConfig = { siteName: siteConfig.name, className: "XI-F1", schoolName: "MAN 2 KLATEN", teamName: "1", academicYear: "2026/2027", emergencyNumber: siteConfig.emergencyNumber };

/* ===== Util ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const num = v => typeof v === "number" && isFinite(v);
const get = (o, p) => p.split(".").reduce((a, k) => a?.[k], o);
const set = (o, p, v) => { const [a, b] = p.split("."); o[a][b] = v; };
const avg = a => { const v = a.filter(num); return v.length ? v.reduce((x, y) => x + y) / v.length : null; };
const nf1 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) k.startsWith("on") ? (e[k] = v) : e.setAttribute(k, v);
  e.append(...kids); return e;
}

/* ===== Definisi field ===== */
const YN = [{ v: 0, l: "Tidak" }, { v: 1, l: "Ya" }];
const F = {
  "profile.age": { l: "Usia", u: "tahun", min: 1, max: 120 },
  "profile.sex": { l: "Jenis kelamin", o: [{ v: "f", l: "Perempuan" }, { v: "m", l: "Laki-laki" }] },
  "profile.heightCm": { l: "Tinggi badan", u: "cm", min: 50, max: 250 },
  "profile.weightKg": { l: "Berat badan", u: "kg", min: 10, max: 300 },
  "lifestyle.activity": { l: "Seberapa aktif kamu dalam seminggu biasa?", o: [{ v: 0, l: "Hampir tidak aktif" }, { v: 1, l: "Sedikit aktif" }, { v: 2, l: "Aktif" }, { v: 3, l: "Sangat aktif" }] },
  "lifestyle.sleepHours": { l: "Rata-rata tidur per malam", o: [{ v: 5, l: "Kurang dari 6 jam" }, { v: 6.5, l: "6–7 jam" }, { v: 8, l: "7–9 jam" }, { v: 10, l: "Lebih dari 9 jam" }] },
  "lifestyle.sugaryDrinks": { l: "Seberapa sering minuman manis?", o: [{ v: 0, l: "Jarang" }, { v: 1, l: "Beberapa kali seminggu" }, { v: 2, l: "Hampir tiap hari" }, { v: 3, l: "Beberapa kali sehari" }] },
  "lifestyle.smoking": { l: "Apakah kamu merokok?", o: YN },
  "lifestyle.stress": { l: "Tingkat stres akhir-akhir ini", opt: 1, o: [{ v: 0, l: "Rendah" }, { v: 1, l: "Sedang" }, { v: 2, l: "Tinggi" }] },
  "history.diabetesFamilyHistory": { l: "Keluarga dekat punya diabetes?", o: YN },
  "history.cardiovascularFamilyHistory": { l: "Keluarga dekat punya penyakit jantung atau stroke?", o: YN },
  "history.hypertensionHistory": { l: "Pernah dikatakan punya tekanan darah tinggi?", o: YN },
  "history.diabetesHistory": { l: "Sudah diketahui punya diabetes?", o: YN },
  "measurements.systolic": { l: "Tekanan darah atas (sistolik)", u: "mmHg", min: 50, max: 300 },
  "measurements.diastolic": { l: "Tekanan darah bawah (diastolik)", u: "mmHg", min: 30, max: 200 },
  "measurements.restingHeartRate": { l: "Detak jantung istirahat", u: "bpm", min: 20, max: 250, opt: 1 },
  "measurements.cholesterol": { l: "Kolesterol total", u: "mg/dL", min: 100, max: 500, opt: 1 },
  "measurements.hdl": { l: "Kolesterol HDL", u: "mg/dL", min: 20, max: 150, opt: 1 },
  "x.warn": { l: "Sedang ada nyeri dada, sesak berat, lemah atau kebas mendadak, atau sulit bicara?", o: YN, x: 1 }
};
const STEPS = [
  { t: "Kenalan dulu", f: ["profile.age", "profile.sex"] },
  { t: "Tubuh", f: ["profile.heightCm", "profile.weightKg"] },
  { t: "Rutinitas", f: ["lifestyle.activity", "lifestyle.sleepHours", "lifestyle.sugaryDrinks", "lifestyle.smoking", "lifestyle.stress"] },
  { t: "Riwayat", f: ["history.diabetesFamilyHistory", "history.cardiovascularFamilyHistory", "history.hypertensionHistory", "history.diabetesHistory"] },
  { t: "Tekanan darah", f: ["measurements.systolic", "measurements.diastolic", "measurements.restingHeartRate"] }
];
const REQUIRED = STEPS.flatMap(s => s.f).filter(k => !F[k].opt);

/* ===== State & storage ===== */
const blank = () => ({ completed: false, profile: { age: null, sex: null, heightCm: null, weightKg: null }, lifestyle: { activity: null, sleepHours: null, sugaryDrinks: null, smoking: null, stress: null }, history: { diabetesFamilyHistory: null, cardiovascularFamilyHistory: null, hypertensionHistory: null, diabetesHistory: null }, measurements: { systolic: null, diastolic: null, restingHeartRate: null, cholesterol: null, hdl: null }, results: {} });
const Store = {
  sk: "healthApp:v1:state", hk: "healthApp:v1:history",
  read(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  load() {
    const s = blank(), raw = this.read(this.sk, null);
    if (raw && typeof raw === "object") {
      for (const k of Object.keys(F)) if (!F[k].x) { const v = get(raw, k); if (typeof v === "number" ? isFinite(v) : typeof v === "string") set(s, k, v); }
      s.completed = raw.completed === true && REQUIRED.every(k => get(s, k) !== null);
    }
    return s;
  },
  history() { const h = this.read(this.hk, []); return Array.isArray(h) ? h.filter(x => x && num(x.score) && num(x.t)) : []; }
};
const App = { state: blank(), step: 0, tmp: {} };
const save = () => Store.write(Store.sk, App.state);

/* ===== Kalkulasi (murni, tanpa DOM) ===== */
function calcBMI(hc, w) { return num(hc) && num(w) && hc > 0 && w > 0 ? w / ((hc / 100) ** 2) : null; }
const BMI_CATS = [
  { key: "under", lv: "mid", l: "Berat badan kurang", s: "Kurang", min: 10, max: 18.5 },
  { key: "ok", lv: "ok", l: "Berat badan sehat", s: "Sehat", min: 18.5, max: 25 },
  { key: "over", lv: "mid", l: "Berat badan berlebih", s: "Berlebih", min: 25, max: 30 },
  { key: "obese", lv: "high", l: "Obesitas", s: "Obesitas", min: 30, max: 40 }
];
function classifyBMI(b, age) {
  if (!num(b)) return null;
  if (num(age) && age < 20) return { key: "child", lv: "info", l: "Tidak dikategorikan" };
  const c = BMI_CATS.find(x => b < x.max) || BMI_CATS[BMI_CATS.length - 1];
  return { key: c.key, lv: c.lv, l: c.l };
}
function classifyBP(s, d, age) {
  if (!num(s) || !num(d)) return null;
  if (num(age) && age < 18) return { key: "minor", lv: "info", l: "Tidak dikategorikan" };
  if (s > 180 || d > 120) return { key: "severe", lv: "urgent", l: "Sangat tinggi" };
  if (s >= 140 || d >= 90) return { key: "stage2", lv: "high", l: "Tekanan darah tahap 2" };
  if (s >= 130 || d >= 80) return { key: "stage1", lv: "mid", l: "Tekanan darah tahap 1" };
  if (s >= 120) return { key: "elev", lv: "mid", l: "Meningkat (elevated)" };
  return { key: "normal", lv: "ok", l: "Normal" };
}
const lowAct = l => num(l.activity) && l.activity <= 1;
function scoreLevel(sc, mid, hi, labels) { return sc >= hi ? { lv: "high", l: labels[2] } : sc >= mid ? { lv: "mid", l: labels[1] } : { lv: "ok", l: labels[0] }; }
function calcDiabetes(s) {
  const { profile: p, history: hi, lifestyle: l } = s;
  if (!num(p.age) || p.age < 18) return { na: "Skrining ini ditujukan untuk dewasa (18 tahun ke atas)." };
  const b = calcBMI(p.heightCm, p.weightKg), parts = []; let sc = 0;
  const add = (n, t) => { if (n > 0) { sc += n; parts.push(t); } };
  add(p.age >= 60 ? 3 : p.age >= 50 ? 2 : p.age >= 40 ? 1 : 0, "usia");
  add(hi.diabetesFamilyHistory ? 1 : 0, "riwayat keluarga diabetes");
  add(hi.hypertensionHistory ? 1 : 0, "riwayat tekanan darah tinggi");
  add(lowAct(l) ? 1 : 0, "aktivitas fisik rendah");
  add(b >= 30 ? 2 : b >= 25 ? 1 : 0, "BMI di atas rentang sehat");
  return { sc, max: 8, parts, ...scoreLevel(sc, 3, 5, ["Sedikit faktor risiko", "Beberapa faktor risiko", "Lebih banyak faktor risiko"]) };
}
function calcHypertension(s, bp) {
  const { profile: p, history: hi, lifestyle: l } = s;
  if (!bp || bp.key === "minor") return { na: "Isi tekanan darah dewasa (usia 18+) agar skrining ini bisa dibaca." };
  const b = calcBMI(p.heightCm, p.weightKg), parts = []; let sc = 0;
  const add = (n, t) => { if (n > 0) { sc += n; parts.push(t); } };
  add({ normal: 0, elev: 1, stage1: 2, stage2: 3, severe: 3 }[bp.key], "angka tekanan darah");
  add(num(p.age) && p.age >= 45 ? 1 : 0, "usia");
  add(lowAct(l) ? 1 : 0, "aktivitas fisik rendah");
  add(l.smoking ? 1 : 0, "merokok");
  add(b >= 25 ? 1 : 0, "BMI di atas rentang sehat");
  add(hi.hypertensionHistory ? 1 : 0, "riwayat tekanan darah tinggi");
  add(num(l.sleepHours) && l.sleepHours < 6 ? 1 : 0, "tidur kurang");
  return { sc, max: 10, parts, ...scoreLevel(sc, 3, 5, ["Perhatian rendah", "Perlu perhatian", "Perhatian tinggi"]) };
}
function calcCardio(s, bp) {
  const { profile: p, history: hi, lifestyle: l } = s;
  if (!num(p.age) || p.age < 18 || !bp || bp.key === "minor") return { na: "Indeks ini ditujukan untuk dewasa dan memerlukan tekanan darah." };
  const b = calcBMI(p.heightCm, p.weightKg), parts = []; let sc = 0;
  const add = (n, t) => { if (n > 0) { sc += n; parts.push(t); } };
  add(p.age >= 60 ? 4 : p.age >= 50 ? 3 : p.age >= 40 ? 2 : p.age >= 30 ? 1 : 0, "usia");
  add({ normal: 0, elev: 1, stage1: 2, stage2: 3, severe: 3 }[bp.key], "tekanan darah");
  add(l.smoking ? 2 : 0, "merokok");
  add(hi.diabetesHistory ? 2 : 0, "diabetes");
  add(lowAct(l) ? 1 : 0, "aktivitas fisik rendah");
  add(hi.cardiovascularFamilyHistory ? 1 : 0, "riwayat keluarga jantung/stroke");
  add(b >= 30 ? 2 : b >= 25 ? 1 : 0, "BMI di atas rentang sehat");
  const r = sc >= 12 ? { lv: "urgent", l: "Risiko edukatif sangat tinggi" } : sc >= 8 ? { lv: "high", l: "Risiko edukatif lebih tinggi" } : sc >= 4 ? { lv: "mid", l: "Risiko edukatif sedang" } : { lv: "ok", l: "Risiko edukatif lebih rendah" };
  return { sc, max: 15, parts, ...r };
}
function calcSnapshot(s, bp, bmiC) {
  const l = s.lifestyle, hi = s.history;
  const L = avg([num(l.activity) ? l.activity / 3 : null, { 5: .35, 6.5: .7, 8: 1, 10: .8 }[l.sleepHours], [1, .7, .4, .1][l.sugaryDrinks], l.smoking === null ? null : 1 - l.smoking, num(l.stress) ? [1, .6, .2][l.stress] : null]);
  const M = avg([bp && { normal: 1, elev: .75, stage1: .5, stage2: .2, severe: 0 }[bp.key], bmiC && { under: .7, ok: 1, over: .7, obese: .4 }[bmiC.key]]) ?? .8;
  const R = Math.max(0, 1 - (hi.diabetesFamilyHistory ? .2 : 0) - (hi.cardiovascularFamilyHistory ? .2 : 0) - (hi.hypertensionHistory ? .3 : 0) - (hi.diabetesHistory ? .3 : 0));
  const keys = STEPS.flatMap(x => x.f), C = keys.filter(k => get(s, k) !== null).length / keys.length;
  const score = Math.round(100 * (.35 * (L ?? .5) + .3 * M + .25 * R + .1 * C));
  const cat = score >= 80 ? "Kebiasaan baik" : score >= 60 ? "Bisa ditingkatkan" : score >= 40 ? "Perlu perhatian" : "Prioritaskan tindak lanjut";
  return { score, cat };
}
const BPTXT = {
  normal: ["low", "Tekanan darahmu masuk kategori normal pada klasifikasi dewasa.", "Pertahankan kebiasaanmu dan ukur berkala."],
  elev: ["moderate", "Tekanan darahmu masuk kategori meningkat pada klasifikasi dewasa.", "Ukur lagi di waktu berbeda dalam keadaan tenang."],
  stage1: ["moderate", "Angka tekananmu masuk kategori tahap 1 pada klasifikasi dewasa.", "Ukur ulang di waktu berbeda dan konsultasikan dengan tenaga kesehatan bila tetap tinggi."],
  stage2: ["high", "Angka tekananmu masuk kategori tahap 2 pada klasifikasi dewasa.", "Sebaiknya segera konsultasikan dengan tenaga kesehatan untuk pemeriksaan."],
  severe: ["urgent", "Angkanya sangat tinggi.", "Ukur ulang setelah istirahat. Bila tetap tinggi atau ada gejala berbahaya, segera cari pertolongan medis."]
};
function factors(s, r) {
  const o = [], l = s.lifestyle, hi = s.history, add = (key, label, sev, ex, rec) => o.push({ key, label, sev, ex, rec });
  if (r.bp && BPTXT[r.bp.key]) add("bp", "Tekanan darah", ...BPTXT[r.bp.key]);
  if (num(l.activity)) l.activity >= 2 ? add("act", "Aktivitas", "low", "Kebiasaan bergerakmu terlihat cukup baik.", "Pertahankan ritmenya.") : add("act", "Aktivitas", "moderate", "Aktivitas fisikmu masih rendah.", "Tambahkan aktivitas ringan secara bertahap. Jalan kaki 10–15 menit bisa jadi titik mulai.");
  if (num(l.sleepHours)) l.sleepHours >= 8 ? add("sleep", "Tidur", "low", "Durasi tidurmu terlihat cukup.", "Jaga jadwal tidur yang konsisten.") : add("sleep", "Tidur", "moderate", "Durasi tidurmu di bawah kebutuhan umum orang dewasa.", "Usahakan jadwal tidur yang lebih konsisten.");
  if (num(l.sugaryDrinks)) l.sugaryDrinks >= 2 ? add("sugar", "Minuman manis", "moderate", "Kamu cukup sering minum minuman manis.", "Coba kurangi frekuensinya dan biasakan memilih air putih lebih sering.") : add("sugar", "Minuman manis", "low", "Konsumsi minuman manismu tidak sering.", "Tetap pilih air putih sebagai minuman utama.");
  if (l.smoking) add("smoke", "Merokok", "high", "Merokok berkaitan dengan banyak risiko kesehatan.", "Tanyakan dukungan berhenti merokok ke tenaga kesehatan. Mengurangi pun sudah awal yang baik.");
  if (r.bmiC && r.bmiC.key !== "child") r.bmiC.key === "ok" ? add("bmi", "BMI", "low", "BMI-mu ada di rentang sehat untuk dewasa.", "Pertahankan pola makan dan aktivitasmu.") : add("bmi", "BMI", r.bmiC.key === "obese" ? "high" : "moderate", "BMI-mu di luar rentang sehat untuk dewasa. BMI hanya ukuran saring.", "Fokus pada kebiasaan kecil yang realistis, bukan diet ekstrem.");
  if (hi.diabetesFamilyHistory || hi.cardiovascularFamilyHistory) add("fam", "Riwayat keluarga", "moderate", "Ada riwayat keluarga yang berkaitan dengan risiko.", "Pemeriksaan rutin membantu memantau lebih awal.");
  if (r.dia && !r.dia.na && r.dia.lv !== "ok") add("dia", "Skrining diabetes", r.dia.lv === "high" ? "high" : "moderate", "Ada beberapa faktor yang berkaitan dengan risiko diabetes.", "Pertimbangkan membahas pemeriksaan gula darah dengan tenaga kesehatan.");
  if (r.card && !r.card.na && r.card.lv !== "ok") add("card", "Indeks jantung & stroke", r.card.lv === "mid" ? "moderate" : "high", "Beberapa faktor risiko jantung dan stroke terkumpul.", "Pertimbangkan evaluasi oleh tenaga kesehatan.");
  return o;
}
const ORDER = { urgent: 0, high: 1, moderate: 2, low: 3 }, PRI = { urgent: "Segera", high: "Tinggi", moderate: "Sedang", low: "Baik" };
function computeAll(s) {
  const bmi = calcBMI(s.profile.heightCm, s.profile.weightKg), bmiC = classifyBMI(bmi, s.profile.age);
  const bp = classifyBP(s.measurements.systolic, s.measurements.diastolic, s.profile.age);
  const r = { bmi, bmiC, bp, dia: calcDiabetes(s), htn: calcHypertension(s, bp), card: calcCardio(s, bp) };
  r.snap = calcSnapshot(s, bp, bmiC);
  r.factors = factors(s, r).sort((a, b) => ORDER[a.sev] - ORDER[b.sev]);
  return r;
}

/* ===== UI: komponen kecil ===== */
const ICON = { ok: "✓", mid: "△", high: "▲", urgent: "!", info: "i" };
const badge = b => b ? `<span class="badge lv-${b.lv}"><i aria-hidden="true">${ICON[b.lv]}</i>${b.l}</span>` : "";
const sevLv = s => ({ low: "ok", moderate: "mid", high: "high", urgent: "urgent" }[s]);
function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("show"), 2800); }
function modal(title, body, actions) {
  const d = $("#modal"); d.replaceChildren(h("h2", {}, title), h("p", {}, body), h("div", { class: "row" }, ...actions.map(([t, fn, ghost]) => h("button", { class: "btn" + (ghost ? " ghost" : ""), type: "button", onclick: () => { d.close(); fn && fn(); } }, t))));
  d.onclick = e => { const b = d.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) d.close(); };
  d.showModal();
}
function fieldHTML(k, val, opt) {
  const f = F[k], id = k.replace(".", "-"), o = opt || f.opt, tag = o ? " <small>(opsional)</small>" : "";
  if (f.o) return `<fieldset class="fld" aria-describedby="e-${id}"><legend>${f.l}${tag}</legend><div class="chips">${f.o.map(x => `<label class="chip"><input type="radio" name="${k}" value="${x.v}"${val === x.v ? " checked" : ""}><span>${x.l}</span></label>`).join("")}</div><p class="err" aria-live="polite" id="e-${id}"></p></fieldset>`;
  return `<div class="fld"><label for="${id}">${f.l} <small>(${f.u})${o ? " · opsional" : ""}</small></label><input id="${id}" name="${k}" type="text" inputmode="decimal" autocomplete="off" aria-describedby="e-${id}" value="${val ?? ""}"><p class="err" aria-live="polite" id="e-${id}"></p></div>`;
}
function readFields(form, keys, optional = []) {
  const vals = {}, errs = {};
  for (const k of keys) {
    const f = F[k], opt = f.opt || optional.includes(k);
    if (f.o) {
      const c = form.querySelector(`input[name="${k}"]:checked`);
      if (!c) { vals[k] = null; if (!opt) errs[k] = "Pilih salah satu dulu ya."; } else vals[k] = isNaN(+c.value) ? c.value : +c.value;
    } else {
      const raw = form.elements[k].value.trim().replace(",", "."), n = Number(raw);
      if (raw === "") { vals[k] = null; if (!opt) errs[k] = "Isi bagian ini dulu ya."; }
      else if (!isFinite(n) || n < f.min || n > f.max) errs[k] = `Boleh cek lagi angkanya — ${f.l.toLowerCase()} harus antara ${f.min}–${f.max} ${f.u}.`;
      else vals[k] = n;
    }
  }
  const s = vals["measurements.systolic"], d = vals["measurements.diastolic"];
  if (num(s) && num(d) && s <= d && !errs["measurements.diastolic"]) errs["measurements.diastolic"] = "Boleh cek lagi — angka atas harus lebih besar dari angka bawah.";
  return { vals, errs };
}
function showErrs(form, errs) {
  $$(".err", form).forEach(e => (e.textContent = ""));
  $$("input[aria-invalid]", form).forEach(e => e.removeAttribute("aria-invalid"));
  const ks = Object.keys(errs);
  ks.forEach(k => { const id = k.replace(".", "-"), e = $("#e-" + id, form); if (e) e.textContent = errs[k]; const i = form.elements[k]; if (i && i.nodeType === 1) i.setAttribute("aria-invalid", "true"); });
  if (ks.length) { toast("Cek kembali bagian yang ditandai."); const f = form.elements[ks[0]]; (f && f.nodeType === 1 ? f : $(`input[name="${ks[0]}"]`, form))?.focus(); }
  return ks.length === 0;
}
function apply(vals) { for (const [k, v] of Object.entries(vals)) { if (F[k].x) App.tmp[k] = v; else if (v !== null || F[k].opt) set(App.state, k, v); } save(); }

/* ===== Health Check ===== */
function renderCheck() {
  const box = $("#checkBody"), s = App.state;
  if (s.completed && App.step >= STEPS.length) return renderResults(box);
  if (App.step >= STEPS.length) App.step = 0;
  const st = STEPS[App.step], pct = (App.step / STEPS.length) * 100;
  box.innerHTML = `<h1 tabindex="-1">Health Check</h1><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${STEPS.length}" aria-valuenow="${App.step + 1}" aria-label="Kemajuan"><div style="width:${pct + 100 / STEPS.length * 0.5}%"></div></div><p class="meta">Langkah ${App.step + 1} dari ${STEPS.length}</p>
  <form id="qForm" class="stepwrap" novalidate><h2 tabindex="-1" style="margin-top:var(--s5)">${st.t}</h2>${st.f.map(k => fieldHTML(k, get(s, k))).join("")}
  <div class="navrow"><button class="btn ghost" type="button" id="qBack"${App.step ? "" : " disabled"}>Kembali</button><button class="btn" type="submit">${App.step === STEPS.length - 1 ? "Lihat snapshot" : "Lanjut"}</button></div>
  <p class="note">Bagian opsional boleh dilewati. Jawabanmu hanya tersimpan di perangkat ini.</p>
  <p><button class="btn ghost" type="button" id="qReset">Reset assessment</button></p></form>`;
  const form = $("#qForm");
  form.onchange = () => { const { vals } = readFields(form, st.f); for (const [k, v] of Object.entries(vals)) if (v !== null) set(App.state, k, v); save(); };
  form.onsubmit = e => {
    e.preventDefault();
    const { vals, errs } = readFields(form, st.f);
    if (!showErrs(form, errs)) return;
    apply(vals);
    if (App.step === STEPS.length - 1) {
      const r = computeAll(App.state);
      App.state.completed = true; App.state.results = { bmi: r.bmi, bp: r.bp?.key ?? null, snap: r.snap.score };
      toast(save() && pushHistory(r) ? "Assessment tersimpan." : "Hasil ditampilkan, tetapi penyimpanan di browser tidak tersedia.");
    }
    App.step++; renderCheck(); window.scrollTo(0, 0); $("#checkBody h1, #qForm h2")?.focus({ preventScroll: true });
  };
  $("#qBack").onclick = () => { App.step = Math.max(0, App.step - 1); renderCheck(); $("#qForm h2")?.focus({ preventScroll: true }); };
  $("#qReset").onclick = () => modal("Reset assessment?", "Semua jawaban dan hasil saat ini akan dihapus dari perangkat ini.", [["Cancel", null, 1], ["Reset", () => { App.state = blank(); App.step = 0; save(); renderCheck(); toast("Assessment direset."); }]]);
}
function pushHistory(r) {
  const hs = Store.history();
  hs.push({ t: Date.now(), score: r.snap.score, bmi: num(r.bmi) ? Math.round(r.bmi * 10) / 10 : null, bp: r.bp ? `${App.state.measurements.systolic}/${App.state.measurements.diastolic}` : null, bpl: r.bp?.l ?? null, dia: r.dia.l ?? null, htn: r.htn.l ?? null, card: r.card.l ?? null });
  return Store.write(Store.hk, hs.slice(-20));
}
function renderResults(box) {
  const r = computeAll(App.state), f = r.factors, good = f.filter(x => x.sev === "low"), watch = f.filter(x => x.sev !== "low");
  const row = (n, v, b) => `<tr><td>${n}</td><td>${v ? v + " " : ""}${badge(b)}</td></tr>`;
  const sc = (x, u) => x.na ? `<span class="note">${x.na}</span>` : `${x.sc}/${x.max}`;
  box.innerHTML = `<h1 tabindex="-1">Done. Kamu sudah mengenal beberapa indikator kesehatanmu.</h1>
  ${r.bp?.key === "severe" ? `<div class="alert" role="alert"><b>Tekanan darahmu sangat tinggi.</b> Ukur ulang setelah istirahat. Bila tetap tinggi, atau ada nyeri dada, sesak berat, lemah mendadak, atau sulit bicara, hubungi ${projectConfig.emergencyNumber} atau segera cari pertolongan medis.</div>` : ""}
  <div class="ringwrap"><div class="ring"><svg viewBox="0 0 120 120" width="150" height="150" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" id="ringFg" cx="60" cy="60" r="52" style="stroke-dashoffset:327"/></svg><b id="scoreNum">0</b></div>
  <div><p class="meta" style="margin:0">Health Snapshot</p><h2 style="margin:0">${r.snap.cat}</h2><p class="note">Ini snapshot kesehatanmu, bukan diagnosis atau peluang penyakit.</p></div></div>
  <details><summary>Bagaimana cara menghitungnya?</summary><p>Skor 0–100 (lebih tinggi lebih baik) menggabungkan gaya hidup 35%, pengukuran (tekanan darah dan BMI) 30%, faktor risiko dan riwayat 25%, serta kelengkapan jawaban 10%. Skor ini dibuat untuk edukasi dan bukan prediksi penyakit.</p></details>
  <div class="cols"><div><h2 style="margin-top:var(--s6)">Yang sudah baik</h2>${good.length ? `<ul class="list">${good.map(x => `<li><b>${x.label}</b><span>${x.ex}</span></li>`).join("")}</ul>` : `<p class="note">Belum ada indikator yang menonjol. Mulai dari satu langkah kecil.</p>`}</div>
  <div><h2 style="margin-top:var(--s6)">Layak diperhatikan</h2>${watch.length ? `<ul class="list">${watch.map(x => `<li><b>${x.label}</b> ${badge({ lv: sevLv(x.sev), l: PRI[x.sev] })}<br><span>${x.ex}</span></li>`).join("")}</ul>` : `<p class="note">Tidak ada yang menonjol dari jawabanmu.</p>`}</div></div>
  <h2>Yang paling layak kamu perhatikan</h2>
  ${watch.length ? `<ol class="steps">${watch.slice(0, 3).map(x => `<li><b>${x.label}.</b> ${x.rec}</li>`).join("")}</ol>` : `<p>Pertahankan kebiasaanmu dan ulangi check sesekali.</p>`}
  <h2>Ringkasan indikator</h2><table class="tbl"><tbody>
  ${row("BMI", r.bmi ? nf1.format(r.bmi) : "", r.bmiC)}${row("Tekanan darah", `${App.state.measurements.systolic}/${App.state.measurements.diastolic}`, r.bp)}
  ${row("Skrining diabetes", r.dia.na ? "—" : sc(r.dia), r.dia.na ? null : r.dia)}${row("Skrining hipertensi", r.htn.na ? "—" : sc(r.htn), r.htn.na ? null : r.htn)}${row("Indeks jantung & stroke", r.card.na ? "—" : sc(r.card), r.card.na ? null : r.card)}</tbody></table>
  <p class="note">Kategori tekanan darah memakai klasifikasi dewasa dan satu pengukuran belum tentu menegakkan diagnosis. ${DISC}</p>
  <div class="row"><a class="btn" href="#tools">Explore Tools</a><a class="btn ghost" href="#doctor">Talk to AI Doctor</a><a class="btn ghost" href="#insight">See Insights</a><button class="btn ghost" id="retake" type="button">Retake Check</button></div>`;
  $("#retake").onclick = () => { App.step = 0; App.state.completed = false; save(); renderCheck(); window.scrollTo(0, 0); };
  const ring = $("#ringFg"), n = $("#scoreNum"), target = r.snap.score;
  if (reduced()) { n.textContent = target; ring.style.strokeDashoffset = 327 * (1 - target / 100); return; }
  requestAnimationFrame(() => { ring.style.strokeDashoffset = 327 * (1 - target / 100); });
  const t0 = performance.now(); const tick = t => { const p = Math.min(1, (t - t0) / 900); n.textContent = Math.round(target * (1 - (1 - p) ** 3)); if (p < 1 && n.isConnected) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
}

/* ===== Kalkulator ===== */
const DISC = "Untuk edukasi dan screening awal. Hasilnya bukan diagnosis medis dan tidak menggantikan konsultasi dengan tenaga kesehatan.";
const HOW = "Skor dibuat dari beberapa faktor yang diketahui berkaitan dengan kesehatan. Skor bukan diagnosis dan bukan prediksi pasti seseorang akan terkena penyakit.";
function scoreRes(title, x, how, next) {
  if (x.na) return { title, big: "—", text: x.na, next: "Lengkapi data yang diperlukan atau konsultasikan dengan tenaga kesehatan.", how };
  return { title, big: x.sc, unit: `/ ${x.max}`, badge: x, fill: x.sc / x.max, text: x.parts.length ? `Faktor yang berperan: ${x.parts.join(", ")}.` : "Tidak ada faktor yang menonjol dari data yang kamu isi.", next, how };
}
const TOOLS = [
  { id: "bmi", t: "Hitung BMI", d: "Indeks massa tubuh dari tinggi dan berat.", f: ["profile.heightCm", "profile.weightKg", "profile.age"], opt: ["profile.age"],
    run(s) {
      const b = calcBMI(s.profile.heightCm, s.profile.weightKg), c = classifyBMI(b, s.profile.age);
      const how = "BMI = berat (kg) ÷ tinggi (m)². Untuk usia 20+: <18,5 kurang, 18,5–<25 sehat, 25–<30 berlebih, ≥30 obesitas. BMI hanya ukuran saring dan bukan penilaian kesehatan menyeluruh.";
      if (c.key === "child") return { title: "BMI", big: nf1.format(b), unit: "kg/m²", text: "Untuk usia di bawah 20 tahun, interpretasi BMI menggunakan kurva pertumbuhan berdasarkan usia dan jenis kelamin. Kalkulator ini tidak menerapkan kategori BMI dewasa.", next: "Tanyakan interpretasinya ke tenaga kesehatan.", how };
      return { title: "BMI", big: nf1.format(b), unit: "kg/m²", badge: c, meter: { b, c }, text: { under: "BMI-mu di bawah rentang sehat dewasa.", ok: "BMI-mu ada di rentang sehat untuk dewasa.", over: "BMI-mu di atas rentang sehat dewasa.", obese: "BMI-mu masuk kategori obesitas pada klasifikasi dewasa." }[c.key] + (num(s.profile.age) ? "" : " Usia belum diisi, jadi kategori ini hanya berlaku bila usiamu 20 tahun ke atas."), next: "BMI tidak melihat otot, lemak, atau pola makan. Fokus pada kebiasaan kecil yang realistis dan bicarakan hasilnya dengan tenaga kesehatan bila ragu.", how };
    } },
  { id: "bp", t: "Cek Tekanan Darah", d: "Klasifikasi dewasa dari satu pengukuran.", f: ["measurements.systolic", "measurements.diastolic", "profile.age", "x.warn"], opt: ["profile.age", "x.warn"],
    run(s, x) {
      const c = classifyBP(s.measurements.systolic, s.measurements.diastolic, s.profile.age), how = "Dewasa: normal <120 dan <80; elevated 120–129 dan <80; tahap 1 130–139 atau 80–89; tahap 2 ≥140 atau ≥90; di atas 180 atau 120 sangat tinggi. Diagnosis memerlukan penilaian profesional.";
      const big = `${s.measurements.systolic}/${s.measurements.diastolic}`;
      if (c.key === "minor") return { title: "Tekanan darah", big, unit: "mmHg", text: "Kategori tekanan darah dewasa tidak digunakan untuk usia di bawah 18 tahun. Hasil pengukuran perlu dinilai sesuai usia oleh tenaga kesehatan.", next: "Bawa hasil ini ke tenaga kesehatan.", how };
      const em = c.key === "severe" && x["x.warn"] === 1;
      return { title: "Tekanan darah", big, unit: "mmHg", badge: c, text: `Angkamu masuk kategori ${c.l.toLowerCase()} pada klasifikasi dewasa. Satu pengukuran belum cukup untuk menegakkan diagnosis.`, alert: em ? EMTXT : c.key === "severe" ? "Ukur ulang setelah istirahat beberapa menit. Bila tetap tinggi, segera cari pertolongan medis." : "", next: c.key === "normal" ? "Pertahankan kebiasaanmu dan ukur berkala." : "Ukur lagi di waktu berbeda dalam keadaan tenang, duduk, dan istirahat dulu. Konsultasikan dengan tenaga kesehatan bila tetap tinggi.", how };
    } },
  { id: "dia", t: "Tes Risiko Diabetes", d: "Skor edukatif dari faktor risiko.", f: ["profile.age", "profile.heightCm", "profile.weightKg", "history.diabetesFamilyHistory", "history.hypertensionHistory", "lifestyle.activity"], opt: [],
    run: s => scoreRes("Skor risiko diabetes (edukatif)", calcDiabetes(s), `Poin dari usia, riwayat keluarga, tekanan darah tinggi, aktivitas rendah, dan BMI. Skor 5 ke atas dianggap lebih banyak faktor risiko, mengacu pada ambang CDC untuk prediabetes, tetapi ini bukan tes resmi. ${HOW}`, "Diagnosis hanya bisa lewat pemeriksaan darah. Bila banyak faktor muncul, pertimbangkan membahasnya dengan tenaga kesehatan.") },
  { id: "htn", t: "Tes Risiko Hipertensi", d: "Faktor yang berkaitan dengan tekanan darah.", f: ["profile.age", "profile.heightCm", "profile.weightKg", "measurements.systolic", "measurements.diastolic", "lifestyle.activity", "lifestyle.smoking", "lifestyle.sleepHours", "history.hypertensionHistory"], opt: [],
    run: s => scoreRes("Skor perhatian hipertensi (edukatif)", calcHypertension(s, classifyBP(s.measurements.systolic, s.measurements.diastolic, s.profile.age)), `Poin dari kategori tekanan darah, usia, aktivitas, merokok, BMI, riwayat, dan tidur. ${HOW}`, "Ukur tekanan darah secara berkala dan jaga kebiasaan sehat. Bicarakan dengan tenaga kesehatan bila tetap tinggi.") },
  { id: "card", t: "Heart & Stroke Check", d: "Indeks edukatif faktor risiko jantung dan stroke.", f: ["profile.age", "profile.sex", "profile.heightCm", "profile.weightKg", "measurements.systolic", "measurements.diastolic", "lifestyle.smoking", "history.diabetesHistory", "lifestyle.activity", "history.cardiovascularFamilyHistory", "measurements.cholesterol", "measurements.hdl"], opt: [],
    run: s => lipid(s, scoreRes("Indeks jantung & stroke (edukatif)", calcCardio(s, classifyBP(s.measurements.systolic, s.measurements.diastolic, s.profile.age)), "Penjumlahan poin: usia, tekanan darah, merokok, diabetes, aktivitas, riwayat keluarga, BMI (maksimum 15). 0–3 lebih rendah, 4–7 sedang, 8–11 lebih tinggi, 12–15 sangat tinggi. Indeks ini dibuat untuk tujuan edukasi dan tidak menggantikan kalkulator risiko klinis atau evaluasi tenaga kesehatan.", "Faktor yang bisa dibenahi: tekanan darah, merokok, aktivitas. Bila indeks tinggi, pertimbangkan evaluasi oleh tenaga kesehatan.")) }
];
function lipid(s, o) {
  const { cholesterol: c, hdl: d } = s.measurements, n = [];
  if (num(c)) n.push(c >= 240 ? "Kolesterol total berada di rentang tinggi (≥240 mg/dL)." : c >= 200 ? "Kolesterol total berada di rentang batas atas (200–239 mg/dL)." : "Kolesterol total di bawah 200 mg/dL.");
  if (num(d)) n.push(d < (s.profile.sex === "f" ? 50 : 40) ? "HDL tergolong rendah." : "HDL tidak tergolong rendah.");
  if (n.length) { o.text += " Catatan kolesterol (tidak masuk skor): " + n.join(" "); o.how += " Kolesterol dan HDL hanya menjadi catatan dan tidak mengubah skor. Rujukan: AHA (HDL rendah <40 mg/dL laki-laki, <50 mg/dL perempuan)."; }
  return o;
}
/* ===== Meter BMI (SVG; geometri diturunkan dari BMI_CATS) ===== */
const MG = { cx: 180, cy: 172, r: 118 }, BMI_MIN = BMI_CATS[0].min, BMI_MAX = BMI_CATS[BMI_CATS.length - 1].max;
const bmiAngle = b => 180 * (Math.min(BMI_MAX, Math.max(BMI_MIN, b)) - BMI_MIN) / (BMI_MAX - BMI_MIN);
const pol = (r, a) => { const t = a * Math.PI / 180; return [MG.cx - r * Math.cos(t), MG.cy - r * Math.sin(t)].map(v => v.toFixed(1)); };
const arc = (a0, a1) => { const [x0, y0] = pol(MG.r, a0), [x1, y1] = pol(MG.r, a1); return `M${x0} ${y0}A${MG.r} ${MG.r} 0 0 1 ${x1} ${y1}`; };
let meterFrom = 0, meterTo = 0;
function meterHTML(bmi, cat) {
  const live = Number.isFinite(bmi) && !!cat, pad = (8 / MG.r) * 180 / Math.PI + 1, on = c => (live && c.key === cat.key ? " on" : "");
  const segs = BMI_CATS.map(c => `<path class="seg seg-${c.key}${on(c)}" d="${arc(bmiAngle(c.min) + pad, bmiAngle(c.max) - pad)}"/>`).join("");
  const thr = BMI_CATS.slice(1).map(c => { const [x, y] = pol(MG.r + 24, bmiAngle(c.min)); return `<text class="thr" x="${x}" y="${y}">${nf1.format(c.min)}</text>`; }).join("");
  const lab = BMI_CATS.map(c => { const [x, y] = pol(MG.r - 30, (bmiAngle(c.min) + bmiAngle(c.max)) / 2); return `<text class="cl${on(c)}" x="${x}" y="${y}">${c.s}</text>`; }).join("");
  if (live) { meterFrom = meterTo; meterTo = bmiAngle(bmi); }
  const x0 = pol(MG.r, 0)[0], dot = live ? `<g id="bmiMk" class="mk" style="transform:rotate(${meterFrom}deg)"><circle class="halo" cx="${x0}" cy="${MG.cy}" r="17"/><circle class="dot" cx="${x0}" cy="${MG.cy}" r="10"/></g>` : "";
  const al = live ? `Meter BMI: ${cat.l}, BMI ${nf1.format(bmi)}` : "Meter BMI, belum ada hasil";
  return `<div class="bmim${live ? " k-" + cat.key : ""}"><p class="bmim-cat" aria-live="polite">${live ? cat.l : "Belum dihitung"}</p><svg viewBox="0 0 360 215" role="img" aria-label="${al}"><g aria-hidden="true">${segs}${thr}${lab}${dot}<text class="mlab" x="180" y="136">BMI</text><text class="mnum" x="180" y="172">${live ? nf1.format(bmi) : "—"}</text></g></svg></div>`;
}
function animateMeter() { const m = $("#bmiMk"); if (m) { void m.getBoundingClientRect(); m.style.transform = `rotate(${meterTo}deg)`; } }
const bmiTable = c => `<table class="tbl"><tbody>${BMI_CATS.map((x, i) => `<tr${x.key === c.key ? ' style="font-weight:600"' : ""}><td>${x.l}</td><td>${i === 0 ? "<" + nf1.format(x.max) : i === BMI_CATS.length - 1 ? "≥" + nf1.format(x.min) : nf1.format(x.min) + " – <" + nf1.format(x.max)}</td></tr>`).join("")}</tbody></table>`;
function resHTML(r) {
  const bar = r.meter ? meterHTML(r.meter.b, r.meter.c) : r.fill != null ? `<div class="fillbar lv-${r.badge.lv}" aria-hidden="true"><div style="width:${r.fill * 100}%"></div></div>` : "";
  return `<article class="res"><p class="meta" style="margin:0">${r.title}</p><p class="big">${r.big}<small>${r.unit || ""}</small></p>${badge(r.badge)}${bar}${r.alert ? `<div class="alert" role="alert"><b>${r.alert}</b></div>` : ""}<p>${r.text}</p>${r.meter ? bmiTable(r.meter.c) : ""}<h3>Langkah berikutnya</h3><p>${r.next}</p><details><summary>Bagaimana cara kerjanya?</summary><p>${r.how}</p></details><p class="note">${DISC}</p></article>`;
}
function renderTools(id) {
  const t = TOOLS.find(x => x.id === id) || TOOLS[0];
  $("#toolTabs").innerHTML = TOOLS.map(x => `<a href="#tools/${x.id}"${x.id === t.id ? ' aria-current="page"' : ""}>${x.t}</a>`).join("");
  $("#toolBody").innerHTML = `<p>${t.d}</p><form id="tForm" novalidate>${t.f.map(k => fieldHTML(k, F[k].x ? App.tmp[k] : get(App.state, k), t.opt.includes(k))).join("")}<button class="btn" type="submit">Hitung</button></form><div id="toolOut" aria-live="polite">${t.id === "bmi" ? `<article class="res">${meterHTML(null)}<p class="note">Masukkan tinggi dan berat badan, lalu tekan Hitung.</p></article>` : ""}</div>`;
  const form = $("#tForm");
  form.onsubmit = e => {
    e.preventDefault();
    const { vals, errs } = readFields(form, t.f, t.opt);
    if (!showErrs(form, errs)) return;
    apply(vals);
    $("#toolOut").innerHTML = resHTML(t.run(App.state, App.tmp)); animateMeter();
  };
}

function analyzeSymptom(sym, c) {
  const crit = sym === "sesak napas" || sym === "nyeri dada";
  if (c.f === 1 || (c.v === 2 && crit)) return { lv: "urgent", l: "Darurat", t: EMTXT };
  if (c.v === 2 || crit) return { lv: "high", l: "Cari bantuan medis segera", t: "Keluhan seperti ini bisa memiliki banyak penyebab. Sebaiknya segera periksakan ke tenaga kesehatan hari ini." };
  if (c.d === 2 || c.v === 1) return { lv: "mid", l: "Pertimbangkan konsultasi", t: "Keluhan seperti ini bisa memiliki banyak penyebab. Pertimbangkan konsultasi rutin dengan dokter bila belum membaik." };
  return { lv: "ok", l: "Pantau dulu", t: "Keluhan ringan seperti ini sering membaik dengan perawatan sederhana. Pantau perkembangannya." };
}
const normText = t => TextNormalizer.run(t);
const EM = { test: t => { const r = TriageEngine.scan(normText(t)); return !!r && !r.ask; } };
/* ===== AI Doctor: asisten edukatif berbasis aturan (tanpa server, tanpa API) ===== */
const EMTXT = `Ini bisa merupakan keadaan darurat. Segera cari pertolongan medis atau hubungi ${projectConfig.emergencyNumber}. Jangan menunggu analisis dari website ini.`;
const EMNOTE = "Ketersediaan layanan dan sistem respons darurat bisa berbeda di tiap daerah. Bila nomor itu tidak tersambung, minta bantuan orang di sekitarmu atau datangi fasilitas kesehatan terdekat.";
const DUR = ["Baru hari ini", "1–3 hari", "Lebih dari 3 hari", "Lebih dari 1 minggu"], SEV = ["Ringan", "Sedang", "Berat"], TREND = ["Membaik", "Tetap sama", "Makin memburuk"];
const RED = { k: "red", q: "Apakah sedang ada salah satu ini: nyeri dada berat, sesak napas berat, lemah atau kebas mendadak di satu sisi, sulit bicara, pingsan, kejang, atau perdarahan hebat?", o: ["Tidak ada", "Ya, ada", "Tidak yakin"] };
const WARN_GEN = "Bila muncul sesak napas berat, nyeri dada, lemah atau kebas mendadak, sulit bicara, pingsan, atau kejang";

/* Basis pengetahuan gejala. q = [pertanyaan khusus, pilihan]; u = indeks pilihan yang menaikkan urgensi; e = indeks yang dianggap darurat.
   Isi bersifat edukasi umum, bukan aturan diagnosis, dan perlu ditinjau tenaga kesehatan sebelum dipakai luas. */
const SYM = {
  kepala: { n: "Sakit kepala", re: /kepala/, w: 1, p: /(sakit|nyeri) kepala|kepala( saya)? (sakit|nyeri)|migrain/, q: ["Bagaimana rasa nyerinya?", ["Seperti tertekan", "Berdenyut", "Sangat hebat dan datang mendadak", "Tidak yakin"]], u: [2], ex: "Sakit kepala sangat umum dan penyebabnya beragam, misalnya kurang tidur, kurang cairan, ketegangan otot, atau stres. Website ini tidak bisa menentukan penyebabnya.", tips: ["Istirahat di tempat yang tenang", "Minum air putih secukupnya", "Kurangi layar dan catat kapan keluhan muncul"], warn: ["Nyeri mendadak dan sangat hebat", "Demam disertai leher kaku", "Muntah terus-menerus", "Gangguan penglihatan atau bicara, atau lemah di satu sisi", "Muncul setelah benturan di kepala"] },
  pusing: { n: "Pusing", re: /pusing/, q: ["Seperti apa rasanya?", ["Melayang atau hampir pingsan", "Berputar", "Hanya tidak seimbang", "Tidak yakin"]], u: [], ex: "Pusing bisa terkait posisi tubuh, kurang cairan atau makan, kurang tidur, dan banyak hal lain. Pusing berputar dan rasa hampir pingsan punya banyak kemungkinan penyebab.", tips: ["Duduk atau berbaring dulu", "Minum air putih", "Bangun dari posisi berbaring secara perlahan"], warn: ["Pingsan", "Nyeri dada atau jantung berdebar kencang", "Sulit bicara atau lemah di satu sisi", "Pandangan ganda"] },
  demam: { n: "Demam", re: /demam|panas/, q: ["Apakah suhu sudah diukur?", ["Belum diukur", "Di bawah 38 °C", "38 °C atau lebih", "39,5 °C atau lebih"]], u: [3], ex: "Demam adalah tanda bahwa tubuh sedang bereaksi terhadap sesuatu, sering karena infeksi. Tinggi suhu saja belum menunjukkan penyebabnya.", tips: ["Istirahat dan perbanyak minum", "Pakai pakaian yang nyaman", "Ukur suhu berkala dan catat"], warn: ["Suhu sangat tinggi atau demam lebih dari 3 hari", "Leher kaku atau ruam menyebar", "Sulit minum atau sangat lemas", "Sesak napas"] },
  batuk: { n: "Batuk", re: /batuk/, q: ["Jenis batuknya?", ["Kering", "Berdahak", "Ada darah di dahak", "Tidak yakin"]], u: [2], ex: "Batuk adalah refleks tubuh untuk membersihkan saluran napas. Bisa dipicu infeksi, alergi, atau iritasi seperti asap.", tips: ["Minum air hangat", "Istirahat", "Hindari asap rokok dan debu"], warn: ["Batuk berdarah", "Sesak napas", "Batuk lebih dari 2–3 minggu", "Demam tinggi yang tidak turun"] },
  pilek: { n: "Pilek atau hidung tersumbat", re: /pilek|hidung|bersin/, q: ["Apa yang paling terasa?", ["Hidung tersumbat atau meler", "Bersin-bersin", "Mata gatal dan berair", "Tidak yakin"]], u: [], ex: "Pilek bisa terkait infeksi virus atau alergi. Keduanya mirip, jadi gejala saja tidak selalu cukup untuk membedakannya.", tips: ["Istirahat dan cukup cairan", "Cuci tangan rutin", "Hindari pemicu seperti debu bila terasa memengaruhi"], warn: ["Demam tinggi", "Nyeri wajah hebat", "Sesak napas", "Keluhan lebih dari 10 hari"] },
  tenggorokan: { n: "Sakit tenggorokan", re: /tenggorok|menelan/, q: ["Apakah sulit menelan atau minum?", ["Tidak", "Sedikit", "Sangat sulit, bahkan air liur sulit tertelan"]], u: [2], ex: "Sakit tenggorokan paling sering terkait infeksi virus atau iritasi. Penyebab pastinya perlu pemeriksaan.", tips: ["Minum air hangat", "Istirahatkan suara", "Hindari asap rokok"], warn: ["Sulit bernapas atau menelan air liur", "Demam tinggi", "Pembengkakan di leher atau wajah", "Lebih dari seminggu"] },
  mual: { n: "Mual atau muntah", re: /mual|muntah/, q: ["Apakah sudah muntah?", ["Belum", "Beberapa kali", "Terus-menerus atau tidak bisa minum", "Ada darah"]], u: [2, 3], ex: "Mual dan muntah punya banyak penyebab, dari makanan hingga infeksi. Risiko utamanya adalah kekurangan cairan.", tips: ["Minum sedikit-sedikit tapi sering", "Makan porsi kecil dan ringan", "Istirahat"], warn: ["Muntah darah", "Tidak bisa minum sama sekali", "Nyeri perut hebat", "Tanda dehidrasi: sangat haus, jarang buang air kecil"] },
  perut: { n: "Sakit perut", re: /perut|mulas|maag/, p: /(sakit|nyeri) perut|perut( saya)? (sakit|nyeri)/, q: ["Di mana lokasinya?", ["Ulu hati atau perut atas", "Sekitar pusar", "Perut kanan bawah", "Seluruh perut"]], u: [2], ex: "Keluhan perut punya banyak kemungkinan penyebab, dari pencernaan hingga hal lain. Lokasi dan perkembangan nyeri membantu tenaga kesehatan menilai.", tips: ["Istirahat", "Makan ringan dan hindari makanan pedas atau berminyak", "Catat kapan nyeri muncul dan apa yang memicunya"], warn: ["Nyeri makin hebat atau perut keras", "Muntah terus-menerus", "Tinja hitam atau berdarah", "Demam"] },
  diare: { n: "Diare", re: /diare|bab cair/, q: ["Apakah masih bisa minum dan buang air kecil seperti biasa?", ["Ya", "Agak berkurang", "Sulit minum atau jarang buang air kecil"]], u: [2], ex: "Diare sering terkait infeksi atau makanan. Yang terpenting adalah mencegah kekurangan cairan.", tips: ["Minum cairan sedikit demi sedikit", "Makan makanan ringan", "Cuci tangan dengan sabun"], warn: ["Tinja berdarah", "Tanda dehidrasi", "Demam tinggi", "Lebih dari 2 hari"] },
  sembelit: { n: "Susah buang air besar", re: /sembelit|konstipasi|susah bab|sulit bab/, q: ["Sudah berapa lama?", ["1–2 hari", "3–6 hari", "Lebih dari seminggu", "Disertai nyeri perut hebat"]], u: [3], ex: "Sembelit sering terkait kurang serat, kurang cairan, atau kurang gerak.", tips: ["Tambah serat dari sayur dan buah", "Minum air putih", "Bergerak ringan"], warn: ["Nyeri perut hebat dan perut kembung keras", "Darah pada tinja", "Muntah", "Berlangsung lebih dari seminggu"] },
  otot: { n: "Nyeri otot", re: /otot|pegal|linu/, q: ["Apa konteksnya?", ["Setelah aktivitas fisik", "Tanpa sebab yang jelas", "Ada bengkak atau kemerahan", "Tidak yakin"]], u: [], ex: "Nyeri otot sering muncul setelah aktivitas, posisi tubuh yang lama, atau kurang istirahat.", tips: ["Istirahat dan peregangan ringan", "Perbaiki posisi duduk", "Bergerak bertahap"], warn: ["Bengkak, merah, dan hangat di satu tungkai", "Urine sangat gelap", "Lemah yang makin parah", "Nyeri hebat setelah cedera"] },
  sendi: { n: "Nyeri sendi", re: /sendi/, q: ["Apakah sendi bengkak atau merah?", ["Tidak", "Sedikit", "Ya, jelas dan terasa hangat"]], u: [2], ex: "Nyeri sendi bisa terkait cedera, penggunaan berlebih, atau kondisi lain yang perlu pemeriksaan.", tips: ["Istirahatkan sendi", "Hindari gerakan yang memicu nyeri", "Catat kapan nyeri paling terasa"], warn: ["Sendi bengkak, merah, dan panas", "Tidak bisa digerakkan", "Demam", "Setelah cedera"] },
  mata: { n: "Keluhan mata", re: /mata/, q: ["Apa yang dirasakan?", ["Perih atau gatal", "Merah dan berair", "Penglihatan kabur atau menurun", "Nyeri hebat"]], u: [2, 3], ex: "Mata lelah, kering, atau iritasi sering terjadi, tetapi perubahan penglihatan perlu diperhatikan.", tips: ["Istirahatkan mata dari layar", "Jangan mengucek", "Jaga kebersihan tangan"], warn: ["Penglihatan menurun mendadak", "Nyeri mata hebat", "Cedera pada mata", "Kelopak sangat bengkak"] },
  kulit: { n: "Gangguan kulit", re: /kulit|ruam|gatal|biduran/, q: ["Bagaimana kondisinya?", ["Gatal ringan", "Ruam menyebar", "Lepuh atau nyeri", "Bengkak di wajah atau bibir"]], u: [1, 2], e: [3], ex: "Iritasi dan ruam bisa dipicu alergi, gigitan serangga, atau kontak dengan bahan tertentu.", tips: ["Hindari menggaruk", "Jauhi pemicu yang dicurigai", "Jaga kulit bersih dan kering"], warn: ["Bengkak di wajah, bibir, atau lidah", "Sesak napas", "Ruam menyebar cepat dengan demam", "Lepuh luas"] },
  lelah: { n: "Badan lemas atau tidak enak", re: /lemas|lelah|capek|letih|badan.{0,12}tidak enak/, q: ["Bagaimana tidur dan makanmu belakangan?", ["Cukup baik", "Kurang tidur", "Nafsu makan turun", "Tidak yakin"]], u: [], ex: "Rasa lelah sering terkait kurang tidur, stres, atau pola makan, tetapi bisa juga tanda kondisi lain bila menetap.", tips: ["Tidur cukup dan konsisten", "Makan teratur dan minum cukup", "Bergerak ringan"], warn: ["Lemas yang makin parah", "Berat badan turun tanpa sebab", "Sesak napas", "Berlangsung lebih dari 2 minggu"] },
  tidur: { n: "Gangguan tidur", re: /tidur|insomnia|begadang|mengantuk/, q: ["Apa masalah tidurnya?", ["Sulit mulai tidur", "Sering terbangun", "Bangun terlalu pagi", "Mengantuk berlebihan"]], u: [], ex: "Gangguan tidur sering terkait jadwal, stres, kafein, dan penggunaan layar malam hari.", tips: ["Jam tidur dan bangun konsisten", "Kurangi layar dan kafein menjelang tidur", "Kamar yang gelap dan tenang"], warn: ["Mengantuk berat saat beraktivitas atau berkendara", "Henti napas saat tidur", "Berlangsung lebih dari 3 minggu"] },
  haid: { n: "Nyeri haid", re: /haid|menstruasi|datang bulan/, q: ["Seperti apa nyerinya?", ["Ringan", "Mengganggu aktivitas", "Sangat hebat atau darah sangat banyak"]], u: [2], ex: "Nyeri ringan hingga sedang saat haid cukup umum, tetapi nyeri yang mengganggu perlu dibicarakan.", tips: ["Istirahat dan kompres hangat di perut bawah", "Minum cukup", "Catat siklus dan keluhanmu"], warn: ["Perdarahan sangat banyak", "Nyeri sangat hebat", "Pingsan", "Haid tidak biasa disertai demam"] },
  sesak: { n: "Sesak napas", re: /sesak|napas/, crit: 1, q: ["Kapan sesak terasa?", ["Saat aktivitas", "Saat istirahat", "Muncul mendadak"]], u: [1], e: [2], ex: "Sesak napas bisa punya banyak penyebab dan sebagian serius. Website ini tidak bisa menilai penyebabnya.", tips: [], warn: ["Sesak saat istirahat", "Bibir atau wajah membiru", "Nyeri dada", "Sulit bicara satu kalimat penuh"] },
  dada: { n: "Nyeri atau tidak nyaman di dada", re: /dada/, crit: 1, q: ["Seperti apa rasanya?", ["Nyeri tajam saat bergerak atau menarik napas", "Tertekan atau berat", "Menjalar ke lengan, rahang, atau punggung", "Berdebar"]], u: [3], e: [1, 2], ex: "Keluhan di dada punya banyak kemungkinan penyebab. Sebagian tidak berbahaya, sebagian serius, dan tidak bisa dibedakan lewat website.", tips: [], warn: ["Rasa tertekan atau berat", "Menjalar ke lengan atau rahang", "Keringat dingin", "Sesak napas"] }
};
const CATS = [["Kepala & otak", "head", ["kepala", "pusing"]], ["Mata", "eye", ["mata"]], ["Hidung & tenggorokan", "nose", ["pilek", "tenggorokan", "batuk"]], ["Dada & pernapasan", "chest", ["sesak", "dada", "batuk"]], ["Perut & pencernaan", "gut", ["perut", "mual", "diare", "sembelit"]], ["Otot & sendi", "joint", ["otot", "sendi"]], ["Kulit", "skin", ["kulit"]], ["Gejala tubuh umum", "body", ["demam", "lelah", "tidur", "haid"]]];
const QUICK = ["kepala", "demam", "batuk", "pusing", "perut", "mual", "tidur"];
const EDU = [
  { q: "Apa itu tekanan darah?", re: /tekanan darah|tensi/, a: "Tekanan darah adalah kekuatan aliran darah terhadap dinding pembuluh. Ditulis dua angka: atas (sistolik) dan bawah (diastolik), dalam mmHg. Pada orang dewasa, di bawah 120/80 tergolong normal. Anak dan remaja memakai acuan yang berbeda sesuai usia.", w: "Bila angkanya tetap tinggi atau disertai nyeri dada, sesak, atau sakit kepala hebat." },
  { q: "Apa penyebab umum sakit kepala?", re: /(penyebab|kenapa|mengapa).*kepala|kepala.*penyebab/, a: "Sakit kepala sering terkait kurang tidur, kurang cairan, ketegangan otot, stres, atau terlalu lama menatap layar. Sebagian bentuk lain, seperti migrain, punya pola khusus.", w: "Bila nyeri mendadak sangat hebat, berulang, atau disertai gangguan penglihatan, bicara, atau lemah di satu sisi." },
  { q: "Mengapa tidur penting?", re: /tidur/, h: 1, a: "Saat tidur, tubuh dan otak memulihkan diri. Tidur yang cukup membantu konsentrasi, suasana hati, dan daya tahan tubuh. Kebutuhan tiap usia berbeda, remaja umumnya butuh lebih banyak daripada dewasa.", w: "Bila sulit tidur berlangsung lebih dari beberapa minggu atau mengganggu aktivitas." },
  { q: "Apa perbedaan flu dan alergi?", re: /flu.*alergi|alergi.*flu|beda.*(flu|pilek)/, a: "Flu biasanya disertai demam, pegal, dan lemas, dan membaik dalam beberapa hari. Alergi lebih sering disertai bersin berulang, mata gatal, dan tanpa demam, serta kambuh saat terpapar pemicu. Gejalanya bisa tumpang tindih.", w: "Bila gejala lebih dari 10 hari, demam tinggi, atau sesak napas." },
  { q: "Bagaimana cara menjaga hidrasi?", re: /hidrasi|cairan|minum air/, h: 1, a: "Biasakan minum air putih sepanjang hari, tidak menunggu sampai haus sekali. Tambah asupan saat panas, berolahraga, atau sakit. Warna urine kuning pucat umumnya tanda cairan cukup.", w: "Bila ada orang dengan penyakit ginjal atau jantung yang dibatasi cairannya, ikuti anjuran tenaga kesehatan." },
  { q: "Apa fungsi BMI?", re: /bmi|indeks massa/, a: "BMI membandingkan berat dengan tinggi badan sebagai ukuran saring. BMI tidak membedakan otot dan lemak. Kategori dewasa (20+) tidak dipakai untuk anak dan remaja, yang memakai kurva pertumbuhan.", w: "Bila ragu dengan hasilnya, atau pada anak dan remaja." },
  { q: "Bagaimana membangun kebiasaan sehat?", re: /kebiasaan sehat/, h: 1, a: "Pilih satu perubahan kecil yang realistis, misalnya jalan kaki 10–15 menit atau mengganti satu minuman manis dengan air putih, lalu jalani dua minggu sebelum menambah yang lain.", w: "Bila punya kondisi kesehatan tertentu sebelum mengubah olahraga atau pola makan." }
];
const QW = /\b(apa|apakah|mengapa|kenapa|bagaimana|gimana|cara|fungsi|perbedaan|beda|penyebab|pentingnya)\b/, RESTART = /\b(mulai ulang|ulangi|reset|mulai lagi|dari awal)\b/;

/* ===== TextNormalizer ===== */
const TextNormalizer = {
  slang: [[/\b(nggak|ngga|gak|enggak|ga|tak)\b/g, "tidak"], [/\b(banget|bgt|bngt)\b/g, "sekali"], [/\b(kliyengan|kleyengan|puyeng|nggliyer)\b/g, "pusing"], [/\bmules\b/g, "mulas"], [/\b(sesek|sesak nafas)\b/g, "sesak napas"], [/\bnafas\b/g, "napas"], [/\bngomong\b/g, "bicara"], [/\blemes\b/g, "lemas"], [/\bpala\b/g, "kepala"], [/\b(mencret)\b/g, "diare"], [/\bpanas dingin\b/g, "demam"], [/\bmeriang\b/g, "demam"], [/\butk\b/g, "untuk"], [/\byg\b/g, "yang"]],
  run(t) {
    let s = String(t).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\b([a-z]{3,})(ku|mu)\b/g, "$1");
    for (const [r, v] of this.slang) s = s.replace(r, v);
    return s.replace(/\s+/g, " ").trim();
  }
};

/* ===== TriageEngine: dijalankan lebih dulu pada setiap masukan ===== */
const EMP = [
  ["sulit bernapas berat", /napas (yang )?(berat|sesak sekali)|(sesak|susah|sulit)( napas)? (sekali|berat)|(susah|sulit) sekali( untuk| buat)? napas|tidak bisa (bernapas|napas)/],
  ["nyeri atau tekanan hebat di dada", /(nyeri|sakit|tekan|tertindih|ditekan|remas)\w* (di )?dada.{0,14}(berat|sekali|hebat|menjalar)|dada.{0,10}(nyeri|sakit|sesak|tertekan) (yang )?(berat|sekali|hebat)/],
  ["lemah atau kebas mendadak di satu sisi", /(lemah|lemas|kebas|mati rasa|kesemutan).{0,24}(sebelah|satu sisi)|(sebelah|satu sisi).{0,24}(lemah|lemas|kebas|mati rasa)|wajah (mencong|perot|turun)/],
  ["sulit bicara mendadak", /(susah|sulit|tidak bisa).{0,8}bicara|bicara.{0,6}pelo|\bpelo\b/],
  ["pingsan atau kejang", /pingsan|tidak sadar|hilang kesadaran|kejang/],
  ["perdarahan hebat", /(perdarahan|pendarahan|darah).{0,14}(hebat|banyak|tidak berhenti|deras)/],
  ["bengkak bibir, lidah, atau tenggorokan", /(bengkak|membengkak).{0,12}(bibir|wajah|lidah|tenggorok)|(lidah|tenggorokan).{0,10}bengkak/]
].map(([l, r]) => [l, new RegExp(r.source, "g")]);
const TriageEngine = {
  negated: (t, i) => /\b(tidak|bukan|belum|tanpa)\b/.test(t.slice(0, i).trim().split(" ").slice(-3).join(" ")),
  /* null = tidak ada tanda; {label, ask:true} = pertanyaan hipotetis, perlu konfirmasi; {label} = darurat */
  scan(t) {
    for (const [label, re] of EMP) for (const m of t.matchAll(re)) {
      if (this.negated(t, m.index)) continue;
      const hyp = /^(apa|apakah|bagaimana|gimana|kenapa|mengapa|jika|kalau|bila|misalnya)\b/.test(t) && !/\b(saya|aku|sedang|lagi|sekarang|barusan|tadi|tiba)\b/.test(t);
      return { label, ask: hyp };
    }
    return null;
  },
  /* 0 umum, 1 konsultasi, 2 segera diperiksa, 3 darurat. Ini tingkat urgensi saran, bukan tingkat penyakit. */
  level(C, S) {
    const a = C.a; let u = 0; const up = n => { u = Math.max(u, n); };
    if (S.crit || C.flags.includes("unsure") || a.sev === 2 || S.u?.includes(a.sp)) up(2);
    if (a.sev === 1 || a.trend === 2 || a.dur >= 2) up(1);
    if (C.age === "minor" && (a.sev >= 1 || a.dur >= 1)) up(1);
    const hc = C.ctx ? Doc.hc() : null;
    if (hc?.bpHigh && ["kepala", "pusing", "dada", "sesak"].includes(C.sym)) up(1);
    return u;
  }
};

/* ===== IntentRecognizer ===== */
const Recognizer = {
  symptoms(t) {
    const n = r => (t.match(new RegExp(r.source, "g")) || []).length;
    return Object.entries(SYM).map(([id, s]) => [id, Math.min(n(s.re), 2) * (s.w || 2) + (s.p ? n(s.p) * 3 : 0)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  },
  parse(t) {
    if (RESTART.test(t)) return { intent: "restart" };
    if (!/\b(saya|aku)\b/.test(t) && QW.test(t)) { const i = EDU.findIndex(e => e.re.test(t)); if (i >= 0) return { intent: "education", i }; }
    const s = this.symptoms(t);
    if (s.length) { const top = s[0][1], gap = top - (s[1] ? s[1][1] : 0); return top >= 2 && gap >= 1 ? { intent: "symptom", sym: s[0][0] } : { intent: "ambiguous", cands: s.slice(0, 3).map(x => x[0]) }; }
    return { intent: QW.test(t) ? "general" : "unknown" };
  }
};

/* ===== DoctorUI + ConversationEngine + AssessmentReport + HealthContext ===== */
const P = (...k) => h("p", {}, ...k);
const Doc = {
  C: null, busy: false,
  newConv: () => ({ id: Math.random().toString(36).slice(2), status: "idle", intent: null, sym: null, qs: [], qi: 0, a: {}, flags: [], age: null, ctx: null, urgency: null }),
  /* --- tampilan --- */
  say(content, who = "bot", cls = "") {
    const c = $("#chat"), near = c.scrollHeight - c.scrollTop - c.clientHeight < 80, n = h("div", { class: `msg ${who} ${cls}` });
    n.append(content); c.append(n);
    if (near || who === "me") c.scrollTop = c.scrollHeight;
    return n;
  },
  lock() { const b = $("#chatSend"); if (b) b.disabled = this.busy; },
  reply(fn) {
    const C = this.C; this.busy = true; this.lock();
    const tp = this.say(h("span", { class: "typing", role: "status", "aria-label": "Asisten sedang menyusun jawaban" }, h("i"), h("i"), h("i")));
    setTimeout(() => { tp.remove(); this.busy = false; this.lock(); if (this.C === C && C.status !== "emergency") fn(); }, reduced() ? 0 : 400);
  },
  opts(list, fn, nav = false) {
    const box = $("#chatOpts");
    box.replaceChildren(...list.map((t, i) => h("button", { type: "button", class: "chip", onclick: () => { if (this.busy) return; this.say(t, "me"); box.replaceChildren(); fn(i, t); } }, t)));
    if (nav && this.C.qi > 0) box.append(h("button", { type: "button", class: "chip ghost", onclick: () => this.back() }, "Ubah jawaban sebelumnya"));
    if (nav) box.append(h("button", { type: "button", class: "chip ghost", onclick: () => this.restart() }, "Mulai ulang"));
  },
  /* --- siklus percakapan --- */
  reset() {
    this.C = this.newConv(); this.busy = false; this.lock();
    $("#chat").replaceChildren(); $("#chatOpts").replaceChildren();
    this.say(h("div", {}, P(`Halo! Aku ${siteConfig.shortName} Health Assistant.`), P("Aku bisa membantu memahami keluhan kesehatan umum, menjelaskan faktor yang mungkin berkaitan, dan memberi panduan awal dari informasi yang kamu berikan."), P("Apa yang sedang kamu rasakan hari ini?")));
    this.menu();
  },
  restart() { this.C = this.newConv(); this.say("Baik, kita mulai dari awal."); this.menu(); },
  menu() {
    this.C.status = "idle";
    this.opts(["Ceritakan keluhanku", "Jelajahi gejala", "Tanya tentang kesehatan", "Pelajari kebiasaan sehat"], i => [() => this.quick(), () => this.explorer(), () => this.eduMenu(), () => this.eduMenu(true)][i]());
  },
  quick() {
    this.say("Pilih salah satu, atau tulis keluhanmu dengan kata-katamu sendiri.");
    this.opts([...QUICK.map(k => SYM[k].n), "Keluhan lainnya"], i => i < QUICK.length ? this.start(QUICK[i]) : this.explorer());
  },
  explorer() {
    this.say("Pilih bagian tubuh yang terasa tidak nyaman.");
    this.opts(CATS.map(c => c[0]), i => this.explorerCat(i));
  },
  explorerCat(i) {
    const [name, , ids] = CATS[i];
    this.say(`${name}: yang mana yang paling mendekati?`);
    this.opts([...ids.map(k => SYM[k].n), "Kembali"], j => j < ids.length ? this.start(ids[j]) : this.explorer());
  },
  eduMenu(habits, after) {
    const l = EDU.filter(e => !habits || e.h);
    this.say(after ? "Ada hal lain yang ingin kamu tanyakan?" : habits ? "Topik kebiasaan sehat yang bisa aku jelaskan:" : "Aku hanya bisa menjawab topik edukasi yang sudah disiapkan. Pilih salah satu atau tulis pertanyaanmu.");
    this.opts([...l.map(e => e.q), "Kembali"], i => i < l.length ? this.edu(EDU.indexOf(l[i])) : this.menu());
  },
  edu(i) {
    const e = EDU[i];
    this.reply(() => { this.say(h("div", {}, P(e.a), P(h("b", {}, "Kapan perlu konsultasi: "), e.w), P(h("small", {}, "Informasi edukasi umum, bukan nasihat medis pribadi.")))); this.eduMenu(false, true); });
  },
  emergency(label) {
    const C = this.C; C.status = "emergency"; C.urgency = 3; this.busy = false; this.lock();
    $$(".typing").forEach(e => e.parentNode.remove()); $("#chatOpts").replaceChildren();
    this.say(h("div", { role: "alert" }, h("b", {}, "Kemungkinan keadaan darurat"), P(EMTXT), P("Nomor darurat: ", h("b", {}, projectConfig.emergencyNumber), `. ${EMNOTE}`), P("Website ini tidak dapat menilai atau menyingkirkan keadaan darurat. Bila ada orang di dekatmu, minta ia menemanimu sekarang."), P(`Yang terdeteksi: ${label}.`)), "bot", "urgent");
    this.opts(["Mulai percakapan baru"], () => this.restart());
  },
  /* --- konteks Health Check (butuh persetujuan) --- */
  hc() {
    const s = App.state; if (!s.completed) return null;
    const age = s.profile.age, bp = classifyBP(s.measurements.systolic, s.measurements.diastolic, age), rel = ["kepala", "pusing", "dada", "sesak"].includes(this.C?.sym), useBp = rel && bp && bp.key !== "minor", what = [num(age) ? "usia" : "", useBp ? "tekanan darah" : ""].filter(Boolean);
    if (!what.length) return null;
    const last = Store.history().slice(-1)[0];
    return { age: num(age) ? age : null, bp: useBp ? bp : null, bpHigh: !!useBp && ["stage1", "stage2", "severe"].includes(bp.key), what: what.join(" dan "), when: last ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(last.t) : "tanggal tidak tercatat" };
  },
  start(sym) {
    const C = this.C, S = SYM[sym], hc = (C.sym = sym, this.hc());
    Object.assign(C, { status: "asking", intent: "symptom", a: {}, flags: [], qi: 0, ctx: null, age: null });
    C.qs = [
      ...(hc ? [{ k: "ctx", q: `Pada Health Check sebelumnya (${hc.when}), kamu mengisi ${hc.what}. Apakah kamu ingin memakai informasi itu sebagai konteks percakapan ini? Itu data lama dan bisa saja sudah berubah.`, o: ["Ya, gunakan", "Tidak, lanjut tanpa data"] }] : []),
      { k: "age", q: "Kamu berada di kelompok usia yang mana? Ini membantu aku menyesuaikan saran.", o: ["Di bawah 18 tahun", "18 tahun atau lebih", "Lewati"] },
      RED, { k: "dur", q: "Sudah berapa lama keluhan ini?", o: DUR }, { k: "sev", q: "Seberapa berat rasanya?", o: SEV }, { k: "trend", q: "Apakah keluhannya membaik, tetap, atau memburuk?", o: TREND },
      { k: "sp", q: S.q[0], o: S.q[1] }
    ];
    this.reply(() => { this.say(`Baik, ${S.n.toLowerCase()}. Aku akan menanyakan beberapa hal singkat.`); this.ask(); });
  },
  skipped(q) { return q.k === "age" && this.C.age !== null && this.C.a.age === undefined; },
  ask() {
    const C = this.C;
    while (C.qi < C.qs.length && this.skipped(C.qs[C.qi])) C.qi++;
    if (C.qi >= C.qs.length) return this.finish();
    const q = C.qs[C.qi]; this.say(q.q); this.opts(q.o, i => this.answer(q, i), true);
  },
  answer(q, i) {
    const C = this.C, S = SYM[C.sym]; C.a[q.k] = i;
    if (q.k === "age") C.age = ["minor", "adult", null][i];
    if (q.k === "ctx") { C.ctx = i === 0; const hc = this.hc(); if (C.ctx && hc?.age != null && C.a.age === undefined) C.age = hc.age < 18 ? "minor" : "adult"; }
    if (q.k === "red") { C.flags = C.flags.filter(f => f !== "unsure"); if (i === 1) return this.emergency("tanda bahaya yang kamu pilih"); if (i === 2) C.flags.push("unsure"); }
    if (q.k === "sp" && S.e?.includes(i)) return this.emergency(S.q[1][i].toLowerCase());
    C.qi++; this.reply(() => this.ask());
  },
  back() {
    const C = this.C; if (C.qi < 1) return;
    do C.qi--; while (C.qi > 0 && this.skipped(C.qs[C.qi]));
    this.say("Baik, jawab ulang ya.", "bot"); this.ask();
  },
  /* --- masukan teks bebas --- */
  submit(raw) {
    if (this.busy) return;
    const t = TextNormalizer.run(raw); if (!t) return;
    this.say(raw.trim(), "me");
    const C = this.C, em = TriageEngine.scan(t);
    if (em && !em.ask) return this.emergency(em.label);
    if (em) return this.reply(() => { this.say(`Kamu menyebut “${em.label}”. Apakah itu sedang terjadi padamu atau orang di dekatmu sekarang?`); this.opts(["Ya, sedang terjadi", "Tidak, aku hanya bertanya"], i => i === 0 ? this.emergency(em.label) : this.reply(() => { this.say("Baik. Tanda seperti itu perlu dikenali, dan bila terjadi, segera cari pertolongan medis."); this.menu(); })); });
    if (C.status === "emergency") return this.reply(() => { this.say(`Prioritaskan bantuan medis sekarang. Hubungi ${projectConfig.emergencyNumber} atau minta orang di dekatmu membantu.`, "bot", "urgent"); });
    const r = Recognizer.parse(t); C.intent = r.intent;
    if (C.status === "asking") {
      const q = C.qs[C.qi], k = q.o.findIndex(o => { const n = TextNormalizer.run(o); return n === t || (t.length > 3 && n.includes(t)); });
      if (k >= 0) return this.answer(q, k);
      return this.reply(() => { this.say("Aku perlu jawaban untuk pertanyaan tadi. Pilih salah satu di bawah, atau tulis dengan kata lain."); this.opts(q.o, i => this.answer(q, i), true); });
    }
    if (r.intent === "restart") return this.restart();
    this.reply(() => {
      if (r.intent === "symptom") return this.start(r.sym);
      if (r.intent === "education") return this.edu(r.i);
      if (r.intent === "ambiguous") { this.say("Aku belum yakin maksudmu yang mana. Pilih yang paling sesuai:"); return this.opts([...r.cands.map(k => SYM[k].n), "Bukan salah satunya"], i => i < r.cands.length ? this.start(r.cands[i]) : this.explorer()); }
      this.say(r.intent === "general" ? "Pertanyaan itu di luar bahan edukasi yang aku punya, dan aku tidak ingin menebak. Kamu bisa memilih topik yang tersedia, atau tanyakan ke tenaga kesehatan." : "Aku belum mengenali itu. Coba tulis dengan kata lain, atau pilih salah satu di bawah.");
      this.menu();
    });
  },
  /* --- laporan penilaian --- */
  finish() {
    const C = this.C, S = SYM[C.sym], a = C.a, u = TriageEngine.level(C, S), L = [["ok", "Panduan umum"], ["mid", "Pertimbangkan konsultasi"], ["high", "Perlu pemeriksaan segera"]][u], hc = C.ctx ? this.hc() : null;
    C.status = "done"; C.urgency = u;
    const pick = (arr, i) => (i == null || arr[i] == null ? "Belum diketahui" : arr[i]);
    const rows = [["Keluhan utama", S.n], ["Durasi", pick(DUR, a.dur)], ["Tingkat keberatan", pick(SEV, a.sev)], ["Perkembangan", pick(TREND, a.trend)], [S.q[0].replace(/\?$/, ""), pick(S.q[1], a.sp)], ["Tanda bahaya umum", pick(["Tidak dilaporkan", "Dilaporkan", "Belum yakin"], a.red)], ["Kelompok usia", C.age === "minor" ? "Di bawah 18 tahun" : C.age === "adult" ? "18 tahun atau lebih" : "Belum diketahui"]];
    const sec = (t, ...k) => h("section", { class: "rep-sec" }, h("h4", {}, t), ...k), ul = l => h("ul", { class: "plain" }, ...l.map(x => h("li", {}, x)));
    const badgeEl = h("span", { class: `badge lv-${L[0]}` }, h("i", { "aria-hidden": "true" }, ICON[L[0]]), L[1]);
    const next = u >= 2 ? ["Segera periksakan ke tenaga kesehatan hari ini, jangan menunggu keluhan hilang sendiri.", "Jangan sendirian: minta seseorang menemanimu."] : [...S.tips, "Pantau perkembangannya", u === 1 ? "Rencanakan konsultasi dengan tenaga kesehatan, terutama bila tidak membaik atau memburuk." : "Periksakan bila keluhan menetap atau memburuk."];
    if (C.age === "minor") next.push("Ceritakan keluhanmu kepada orang tua, wali, atau orang dewasa yang kamu percaya.");
    if (C.age === null) next.push("Usiamu belum diketahui, jadi saran ini tetap umum.");
    const card = h("article", { class: "rep" + (u >= 2 ? " hi" : ""), "aria-label": "Hasil penilaian awal" },
      h("h3", {}, "Ringkasan keluhan"), badgeEl,
      P(`Kamu melaporkan ${S.n.toLowerCase()}. Durasi: ${pick(DUR, a.dur).toLowerCase()}; tingkat: ${pick(SEV, a.sev).toLowerCase()}; perkembangan: ${pick(TREND, a.trend).toLowerCase()}.`),
      sec("Informasi yang terkumpul", h("dl", { class: "kv" }, ...rows.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]))),
      sec("Status penilaian", P(`${L[1]}. Ini tingkat urgensi saran, bukan tingkat keparahan penyakit, dan bukan diagnosis.`)),
      sec("Penjelasan edukatif", P(S.ex)),
      ...(hc ? [sec("Dari Health Check sebelumnya", P(`Yang kamu pakai sebagai konteks (${hc.when}): ${[hc.age != null ? `usia ${hc.age} tahun` : "", hc.bp ? `kategori tekanan darah “${hc.bp.l}”` : ""].filter(Boolean).join(", ")}. Ini data lama, bukan pengukuran saat ini.`))] : []),
      sec("Langkah berikutnya", ul(next)),
      sec("Tanda bahaya yang perlu diwaspadai", ul(S.warn), P(`${WARN_GEN}, segera cari pertolongan medis atau hubungi ${projectConfig.emergencyNumber}.`)),
      P(h("small", {}, `${DISC} Aku tidak bisa memastikan penyebab keluhanmu.`)));
    this.reply(() => {
      this.say(card, "bot", "wide" + (u >= 2 ? " urgent" : ""));
      this.opts(["Tanya hal lain", "Jelajahi gejala terkait", "Mulai penilaian baru"], i => {
        if (i === 0) this.eduMenu();
        else if (i === 1) this.explorerCat(Math.max(0, CATS.findIndex(c => c[2].includes(C.sym))));
        else this.restart();
      });
    });
  }
};

/* ===== Insight & Riwayat ===== */
const INSIGHTS = [
  ["Tidur", "Tidur membantu tubuh dan pikiran memulihkan diri.", "Tidur dan bangun di jam yang mirip setiap hari."],
  ["Nutrisi", "Pola makan beragam membantu tubuh mendapat berbagai zat gizi.", "Tambahkan satu porsi sayur atau buah di satu waktu makan."],
  ["Aktivitas fisik", "Bergerak rutin baik untuk jantung, otot, dan suasana hati.", "Jalan kaki 10–15 menit setelah makan."],
  ["Stres", "Stres yang berlarut bisa memengaruhi tidur dan kebiasaan makan.", "Coba tarik napas pelan selama satu menit saat tegang."],
  ["Tekanan darah", "Angka tekanan darah bisa naik tanpa gejala yang terasa.", "Ukur dalam keadaan duduk tenang dan catat waktunya."],
  ["Diabetes", "Faktor gaya hidup berkaitan dengan risiko diabetes tipe 2.", "Ganti satu minuman manis per hari dengan air putih."],
  ["Kesehatan jantung", "Merokok, tekanan darah, dan kurang gerak berkaitan dengan risiko jantung.", "Pilih tangga alih-alih lift bila memungkinkan."],
  ["Hidrasi", "Cairan membantu banyak fungsi tubuh sehari-hari.", "Bawa botol minum dan isi ulang saat habis."],
  ["Kebiasaan sehat", "Perubahan kecil yang konsisten lebih mudah dipertahankan.", "Pilih satu kebiasaan dan jalani selama dua minggu."]
];
function spark(a) {
  if (a.length < 2) return "";
  const p = a.map((x, i) => `${(i / (a.length - 1) * 196 + 2).toFixed(1)},${(46 - Math.min(100, Math.max(0, x.score)) / 100 * 44).toFixed(1)}`), l = p[p.length - 1].split(",");
  return `<svg class="spark" viewBox="0 0 200 48" role="img" aria-label="Tren Health Snapshot: dari ${a[0].score} ke ${a[a.length - 1].score} dalam ${a.length} hasil"><polyline points="${p.join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${l[0]}" cy="${l[1]}" r="3.5" fill="var(--accent)"/></svg>`;
}
function renderInsight() {
  $("#insightList").innerHTML = INSIGHTS.map(([t, w, a]) => `<details><summary>${t}</summary><p><b>Mengapa penting:</b> ${w}</p><p><b>Langkah kecil:</b> ${a}</p></details>`).join("");
  const all = Store.history(), hs = [...all].reverse(), box = $("#historyBody");
  if (!hs.length) { box.innerHTML = `<div class="empty">Belum ada hasil yang tersimpan.<br>Mulai dari Health Check untuk melihat snapshot kesehatanmu.<p style="margin-top:var(--s4)"><a class="btn" href="#check">Mulai Health Check</a></p></div>`; return; }
  const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
  box.innerHTML = `<p class="note">Data tersimpan hanya di perangkat ini.</p>${spark(all)}<ul class="list">${hs.map(x => `<li><b>Snapshot ${x.score}</b><span>${fmt.format(new Date(x.t))}${x.bmi ? " · BMI " + nf1.format(x.bmi) : ""}${x.bp ? " · Tekanan darah " + x.bp : ""}</span></li>`).join("")}</ul><p><button class="btn ghost" id="clearHist" type="button">Clear history</button></p>`;
  $("#clearHist").onclick = () => modal("Hapus riwayat?", "Semua riwayat hasil di perangkat ini akan dihapus.", [["Batal", null, 1], ["Hapus", () => { try { localStorage.removeItem(Store.hk); } catch { } renderInsight(); toast("Riwayat dihapus."); }]]);
}

/* ===== Router ===== */
const VIEWS = ["home", "check", "tools", "doctor", "insight", "about"];
function go() {
  let [v, sub] = location.hash.slice(1).split("/");
  if (!VIEWS.includes(v)) v = "home";
  $$("[data-view]").forEach(s => { const on = s.id === v; s.hidden = !on; s.classList.toggle("in", on); });
  $$("#nav a").forEach(a => a.getAttribute("href") === "#" + v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  if (v === "check") { if (!App.state.completed && App.step >= STEPS.length) App.step = 0; renderCheck(); }
  if (v === "tools") renderTools(sub);
  if (v === "doctor" && !$("#chat").children.length) Doc.reset();
  if (v === "insight") renderInsight();
  document.title = `${siteConfig.name} — ${v === "home" ? "Screening kesehatan edukatif" : v}`;
  window.scrollTo(0, 0);
  $("h1", $("#" + v))?.focus({ preventScroll: true });
}
function init() {
  App.state = Store.load();
  App.step = App.state.completed ? STEPS.length : Math.max(0, STEPS.findIndex(s => s.f.some(k => !F[k].opt && get(App.state, k) === null)));
  document.documentElement.lang = siteConfig.language.slice(0, 2);
  $$("[data-brand]").forEach(e => (e.textContent = siteConfig.name));
  $$("[data-tagline]").forEach(e => (e.textContent = "— " + siteConfig.tagline));
  $$("[data-emerg]").forEach(e => (e.textContent = projectConfig.emergencyNumber));
  $$("[data-cfg]").forEach(e => (e.textContent = projectConfig[e.dataset.cfg]));
  $("#toolGrid").innerHTML = [...TOOLS.map(t => [t.t, t.d, "#tools/" + t.id]), ["Tanya AI Doctor", "Asisten keluhan berbasis aturan.", "#doctor"]].map(([t, d, href]) => `<li><a href="${href}"><div><b>${t}</b><span>${d}</span></div><i>Open</i></a></li>`).join("");
  $("#chatForm").onsubmit = e => { e.preventDefault(); const i = $("#chatIn"); if (Doc.busy || !i.value.trim()) return; Doc.submit(i.value); i.value = ""; };
  $("#chatClear").onclick = () => { Doc.reset(); toast("Percakapan dihapus."); };
  addEventListener("hashchange", go);
  go();
}
if (typeof document !== "undefined") init();
if (typeof module !== "undefined") module.exports = { calcBMI, classifyBMI, classifyBP, calcDiabetes, calcHypertension, calcCardio, calcSnapshot, analyzeSymptom, matchSym: t => Recognizer.symptoms(normText(t))[0]?.[0] ?? null, normText, EM, TextNormalizer, TriageEngine, Recognizer, SYM, Doc, blank, computeAll, Store, meterHTML, bmiAngle, BMI_CATS, spark, lipid };
