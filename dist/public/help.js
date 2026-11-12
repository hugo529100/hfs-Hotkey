// help.js — lazy-loaded by main.js on first click of "Hotkey Help"
'use strict';
(function () {
    if (window.HotkeyHelp) return;

    const STYLE_ID = 'hotkey-help-style';
    const BACKDROP_CLASS = 'hotkey-help-backdrop';
    const HELP_TITLE = 'Hotkey Help';

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = `
.${BACKDROP_CLASS} {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: hotkeyHelpFadeIn .18s ease-out;
}
@keyframes hotkeyHelpFadeIn { from { opacity: 0; } to { opacity: 1; } }

.hotkey-help-dialog {
  background: var(--bg, #fff);
  color: var(--text, #222);
  border-radius: 10px;
  max-width: 720px; width: 100%;
  max-height: 85vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  border-top: 1px solid color-mix(in srgb, var(--text, #222) 8%, transparent);
}

.hotkey-help-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  background: color-mix(in srgb, var(--text, #222) 4%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--text, #222) 12%, transparent);
}
.hotkey-help-title {
  font-size: 16px; font-weight: 700; margin: 0;
  letter-spacing: .2px;
  color: var(--text, #222);
}
.hotkey-help-close {
  background: transparent; border: none; cursor: pointer;
  font-size: 20px; line-height: 1; padding: 4px 10px;
  color: inherit; opacity: .65; border-radius: 4px;
  transition: opacity .15s ease, background .15s ease;
}
.hotkey-help-close:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--text, #222) 10%, transparent);
}

.hotkey-help-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 16px;
  font-size: 13.5px; line-height: 1.55;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--text, #222) 25%, transparent) transparent;
}
.hotkey-help-body::-webkit-scrollbar { width: 8px; }
.hotkey-help-body::-webkit-scrollbar-track { background: transparent; }
.hotkey-help-body::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--text, #222) 25%, transparent);
  border-radius: 4px;
}
.hotkey-help-body::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--text, #222) 40%, transparent);
}

.hotkey-help-section { display: flex; flex-direction: column; gap: 8px; }
.hotkey-help-section-title {
  font-size: 12px; font-weight: 700; letter-spacing: .6px;
  text-transform: uppercase; opacity: .65;
  border-bottom: 1px solid color-mix(in srgb, var(--text, #222) 18%, transparent);
  padding-bottom: 4px; margin-bottom: 2px;
}
.hotkey-help-rows { display: flex; flex-direction: column; gap: 5px; }
.hotkey-help-row {
  display: grid; grid-template-columns: 170px 1fr;
  gap: 10px; align-items: start;
}
.hotkey-help-keys { display: flex; flex-wrap: wrap; gap: 4px; }
.hotkey-help-keys kbd {
  display: inline-block; min-width: 22px; text-align: center;
  padding: 1px 6px; border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--text, #222) 30%, transparent);
  opacity: .9;
  font-family: inherit; font-size: 11.5px;
  background: color-mix(in srgb, var(--text, #222) 8%, transparent);
  color: var(--text, #222);
  line-height: 1.6;
}
.hotkey-help-desc { opacity: .92; }
.hotkey-help-note {
  font-size: 12.5px; line-height: 1.55; opacity: .88;
  padding: 8px 12px; border-radius: 6px;
  background: color-mix(in srgb, var(--text, #222) 6%, transparent);
  border-left: 3px solid var(--good-contrast, #4a9eff);
}
.hotkey-help-divider {
  height: 1px; width: 100%;
  background: color-mix(in srgb, var(--text, #222) 15%, transparent);
  margin: 2px 0;
}

@media (max-width: 540px) {
  .hotkey-help-row { grid-template-columns: 120px 1fr; font-size: 12.5px; }
  .hotkey-help-keys kbd { font-size: 10.5px; padding: 1px 4px; }
  .hotkey-help-dialog { max-height: 90vh; }
  .hotkey-help-header { padding: 12px 16px; }
  .hotkey-help-body { padding: 14px 16px; }
}

/* Dark theme (matches HFS body.theme-dark) */
body.theme-dark .hotkey-help-dialog {
  background: var(--bg, #1a1a1a);
  color: var(--text, #eaeaea);
  box-shadow: 0 20px 60px rgba(0,0,0,.7),
              0 0 0 1px color-mix(in srgb, var(--text, #eaeaea) 12%, transparent);
}
body.theme-dark .hotkey-help-header {
  background: color-mix(in srgb, var(--text, #eaeaea) 5%, transparent);
  border-bottom-color: color-mix(in srgb, var(--text, #eaeaea) 12%, transparent);
}
body.theme-dark .hotkey-help-close:hover {
  background: color-mix(in srgb, var(--text, #eaeaea) 12%, transparent);
}
body.theme-dark .hotkey-help-section-title {
  border-bottom-color: color-mix(in srgb, var(--text, #eaeaea) 20%, transparent);
}
body.theme-dark .hotkey-help-keys kbd {
  border-color: color-mix(in srgb, var(--text, #eaeaea) 32%, transparent);
  background: color-mix(in srgb, var(--text, #eaeaea) 10%, transparent);
  color: var(--text, #eaeaea);
}
body.theme-dark .hotkey-help-note {
  background: color-mix(in srgb, var(--text, #eaeaea) 7%, transparent);
}
body.theme-dark .hotkey-help-divider {
  background: color-mix(in srgb, var(--text, #eaeaea) 15%, transparent);
}
body.theme-dark .hotkey-help-body {
  scrollbar-color: color-mix(in srgb, var(--text, #eaeaea) 30%, transparent) transparent;
}
body.theme-dark .hotkey-help-body::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--text, #eaeaea) 30%, transparent);
}
`;
        document.head.appendChild(st);
    }

    function section(title, rows) {
        return (
            '<div class="hotkey-help-section">' +
                '<div class="hotkey-help-section-title">' + title + '</div>' +
                '<div class="hotkey-help-rows">' + rows.join('') + '</div>' +
            '</div>'
        );
    }
    function row(keys, desc) {
        const k = keys.map(x => '<kbd>' + x + '</kbd>').join(' ');
        return (
            '<div class="hotkey-help-row">' +
                '<div class="hotkey-help-keys">' + k + '</div>' +
                '<div class="hotkey-help-desc">' + desc + '</div>' +
            '</div>'
        );
    }
    function note(text) { return '<div class="hotkey-help-note">' + text + '</div>'; }
    function divider() { return '<div class="hotkey-help-divider"></div>'; }

    function buildHelpHtml() {
        return [
            section('Quick Start', [
                note('Open <b>User panel</b> from the top menu. You will see a <b>Hotkey Help</b> button.'),
                note('Arrow keys work anywhere: Up/Down scrolls smoothly in the list or preview, Left/Right walks the paging bar.'),
            ]),
            divider(),
            section('Dialog keys', [
                row(['Enter'], 'Confirm (OK / Continue). In a comment box, Enter saves the comment without closing the preview.'),
                row(['Escape'], 'Cancel / close'),
                row(['Backspace'], 'Cancel (when not typing)'),
            ]),
            section('File-show keys (preview open)', [
                row(['M'], 'Menu'),
                row(['C'], 'Comment'),
                row(['O'], 'Open'),
                row(['D'], 'Download'),
                row(['X'], 'Cut'),
                row(['R'], 'Rename'),
                row(['Del'], 'Delete'),
                row(['Z'], 'Zoom'),
                row(['F'], 'Fullscreen'),
                row(['S'], 'Shuffle'),
                row(['P'], 'Repeat'),
                row(['L'], 'Copy link'),
                note('Arrow keys inside the preview are left to the image / video viewer (album navigation, video seek, etc.).'),
            ]),
            section('Arrow keys (plain UI)', [
                note('<b>No dialog / no preview / no menu:</b>'),
                row(['Up', 'Down'], 'Smooth continuous scroll (press and hold)'),
                row(['Left', 'Right'], 'Walk through the paging bar (#paging) one step at a time'),
                row(['PageUp', 'PageDown'], 'Same as Left / Right: step through the paging bar'),
                row(['Home'], 'Jump to the first paging button'),
                row(['End'], 'Jump to the last paging button'),
                row(['Space'], 'Native browser behavior'),
            ]),
            section('Arrow keys (file preview)', [
                note('<b>Preview open, menu closed:</b>'),
                row(['Up', 'Down', 'Left', 'Right'], 'Handled by the built-in image / video viewer'),
                note('<b>Preview open, menu open:</b>'),
                row(['Up', 'Down', 'Left', 'Right'], 'Move focus between menu items'),
            ]),
            section('Tile size (Ctrl + number)', [
                row(['Ctrl', '0'], 'Set tile size to 10 (largest tiles)'),
                row(['Ctrl', '1..9'], 'Set tile size to 1..9'),
                row(['Ctrl', '·', '.', '-'], 'Set tile size to 0 (list mode)'),
                row(['Ctrl', '='], 'Set tile size to 10 (largest tiles)'),
                note('On macOS use <kbd>Cmd</kbd> instead of Ctrl. The shortcut also updates the #option-tile-size range UI and saves per-folder memory.'),
            ]),
            section('Tips', [
                note('Shortcuts are ignored while typing in an input field.'),
                note('Scrolling uses a rAF velocity engine, so holding an arrow key ramps up and glides to stop instead of jumping.'),
                note('Press <kbd>Esc</kbd> or click outside to close this help.'),
            ]),
        ].join('');
    }

    let backdrop = null;
    let session = null;

    function isInsideHelp(target) {
        if (!target || !target.closest) return false;
        return !!target.closest('.' + BACKDROP_CLASS);
    }
    function onWheelCapture(e) { if (isInsideHelp(e.target)) e.stopPropagation(); }
    function onKeyCapture(e) {
        if (!session) return;
        if (isInsideHelp(e.target) || isInsideHelp(document.activeElement)) {
            if (e.key !== 'Escape') e.stopPropagation();
        }
    }
    function onTouchCapture(e) { if (isInsideHelp(e.target)) e.stopPropagation(); }

    function enterSession() {
        if (session) return;
        session = {};
        document.addEventListener('wheel', onWheelCapture, { capture: true, passive: true });
        document.addEventListener('keydown', onKeyCapture, true);
        document.addEventListener('touchstart', onTouchCapture, { capture: true, passive: true });
        document.addEventListener('touchmove', onTouchCapture, { capture: true, passive: true });
        document.addEventListener('touchend', onTouchCapture, { capture: true, passive: true });
    }
    function exitSession() {
        if (!session) return;
        session = null;
        document.removeEventListener('wheel', onWheelCapture, { capture: true });
        document.removeEventListener('keydown', onKeyCapture, true);
        document.removeEventListener('touchstart', onTouchCapture, { capture: true });
        document.removeEventListener('touchmove', onTouchCapture, { capture: true });
        document.removeEventListener('touchend', onTouchCapture, { capture: true });
    }

    function open() {
        injectStyle();
        if (backdrop) return;

        enterSession();

        backdrop = document.createElement('div');
        backdrop.className = BACKDROP_CLASS;
        backdrop.innerHTML =
            '<div class="hotkey-help-dialog" role="dialog" aria-modal="true">' +
                '<div class="hotkey-help-header">' +
                    '<h2 class="hotkey-help-title">' + HELP_TITLE + '</h2>' +
                    '<button class="hotkey-help-close" aria-label="Close">\u00D7</button>' +
                '</div>' +
                '<div class="hotkey-help-body">' + buildHelpHtml() + '</div>' +
            '</div>';

        let closed = false;
        const close = () => {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', onEsc, true);
            backdrop.remove();
            backdrop = null;
            exitSession();
        };
        const onEsc = (ev) => {
            if (ev.key === 'Escape') {
                ev.preventDefault();
                ev.stopPropagation();
                close();
            }
        };

        backdrop.querySelector('.hotkey-help-close').addEventListener('click', close);
        backdrop.addEventListener('click', (ev) => {
            if (ev.target === backdrop) close();
        });
        document.addEventListener('keydown', onEsc, true);
        document.body.appendChild(backdrop);
    }

    window.HotkeyHelp = { open };
})();