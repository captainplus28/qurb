#!/usr/bin/env python3
"""Fix stedenpagina's: de when/duration-JS uit index/amsterdam ontbrak daar
(commit f1b21ba voegde wel de HTML toe, niet de JS) waardoor de module crasht
op initWhenDuration() en de vergelijker niet werkt. Idempotent."""
import sys
from pathlib import Path

FILES = ["rotterdam.html", "den-haag.html", "utrecht.html", "eindhoven.html",
         "groningen.html", "haarlem.html", "leiden.html"]

OLD_EL = "const el = { form: $('#search-form'), addr: $('#addr'), van: $('#van'), tot: $('#tot'), suggest: $('#suggest'), found: $('#found'), tarief: $('#tarief'), error: $('#error'), results: $('#results') };"
NEW_EL = "const el = { form: $('#search-form'), addr: $('#addr'), whenChoice: $('#when-choice'), whenAtWrap: $('#when-at-wrap'), whenNow: $('#when-now'), whenSpec: $('#when-specific'), whenReset: $('#when-reset'), start: $('#start'), durVal: $('#dur-val'), durMinus: $('#dur-minus'), durPlus: $('#dur-plus'), presets: [...document.querySelectorAll('.dur__preset')], shortcuts: [...document.querySelectorAll('.shortcut[data-min]')], shortcutLonger: $('#shortcut-longer'), suggest: $('#suggest'), found: $('#found'), tarief: $('#tarief'), error: $('#error'), results: $('#results') };"

OLD_INIT = """  function initTimeInputs() {
    el.van.value = toLocalInput(new Date());
    const sync = () => { const from = new Date(el.van.value); if (Number.isNaN(+from)) return; el.tot.min = toLocalInput(from); const to = new Date(el.tot.value); if (Number.isNaN(+to) || to <= from) el.tot.value = toLocalInput(new Date(from.getTime() + 2 * 3600_000)); };
    el.van.addEventListener('input', sync);
    el.van.addEventListener('change', sync);
    sync();
  }"""

NEW_INIT = """  const MIN_DUR = 15, MAX_DUR = 1440, STEP_DUR = 15;
  let durationMin = 60;
  let startMode = 'now';
  const durationLabelFull = (min) => (min >= 1440 ? 'Hele dag' : formatDuration(min));
  function renderDuration() {
    el.durVal.textContent = durationLabelFull(durationMin);
    el.durMinus.disabled = durationMin <= MIN_DUR;
    el.durPlus.disabled = durationMin >= MAX_DUR;
    el.presets.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.min) === durationMin)));
  }
  function stepDuration(dir) { durationMin = Math.min(MAX_DUR, Math.max(MIN_DUR, durationMin + dir * STEP_DUR)); renderDuration(); }
  function setStartMode(mode) {
    startMode = mode;
    const now = mode === 'now';
    el.whenAtWrap.hidden = now;
    el.whenNow.setAttribute('aria-pressed', String(now));
    el.whenNow.classList.toggle('toggle-btn--active', now);
    el.whenSpec.setAttribute('aria-pressed', String(!now));
    el.whenSpec.classList.toggle('toggle-btn--active', !now);
    if (!now) {
      if (!el.start.value) el.start.value = toLocalInput(new Date());
      requestAnimationFrame(() => { el.start.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); el.start.focus(); try { el.start.showPicker(); } catch { /* niet ondersteund in oudere browsers */ } });
    }
  }
  function getStartTime() { if (startMode === 'now') return new Date(); const v = new Date(el.start.value); return Number.isNaN(+v) ? new Date() : v; }
  function updateShortcutActive() { el.shortcuts.forEach((b) => b.classList.toggle('shortcut--active', Number(b.dataset.min) === durationMin)); }
  function initWhenDuration() {
    el.durMinus.addEventListener('click', () => { stepDuration(-1); updateShortcutActive(); });
    el.durPlus.addEventListener('click', () => { stepDuration(1); updateShortcutActive(); });
    el.whenNow.addEventListener('click', () => setStartMode('now'));
    el.whenSpec.addEventListener('click', () => setStartMode('at'));
    el.whenReset?.addEventListener('click', () => setStartMode('now'));
    el.presets.forEach((b) => b.addEventListener('click', () => { durationMin = Number(b.dataset.min); renderDuration(); updateShortcutActive(); }));
    el.shortcuts.forEach((b) => b.addEventListener('click', () => { durationMin = Number(b.dataset.min); renderDuration(); updateShortcutActive(); if (state.place?.rate != null) compare(); }));
    el.shortcutLonger.addEventListener('click', () => setStartMode('at'));
    renderDuration();
    updateShortcutActive();
  }"""

for name in FILES:
    p = Path(name)
    text = p.read_text(encoding="utf-8")
    if "function initWhenDuration" in text:
        print(f"{name}: al gefixt, overgeslagen")
        continue
    for old, new in [(OLD_EL, NEW_EL), (OLD_INIT, NEW_INIT)]:
        n = text.count(old)
        if n != 1:
            sys.exit(f"{name}: anchor {n}x gevonden (verwacht 1): {old[:60]}")
        text = text.replace(old, new)
    p.write_text(text, encoding="utf-8")
    print(f"{name}: gefixt")
