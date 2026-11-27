# Hotkey

A unified keyboard helper for [HFS](https://github.com/rejetto/hfs) 3 (HTTP File Server).

One plugin, one place for all keyboard shortcuts: dialogs, file preview actions,
smooth arrow scrolling, paging navigation, tile size, and a self-explaining
**Hotkey Help** panel.

---

## Overview

| | |
| --- | --- |
| Plugin folder | `plugins/Hotkey` |
| Entry point | `plugin.js` (server), `public/main.js` (frontend) |
| Minimum HFS API | `8.87` |
| Backend routes | none |
| Data storage | none (stateless) |
| Config entries | `enabled` |

The whole behavior lives in `public/main.js`. `plugin.js` only declares the plugin
and its single on/off switch, so all shortcuts can be disabled from the HFS admin
panel without touching files.

---

## Installation

1. Copy the `Hotkey` folder into your HFS `plugins` directory:

   ```
   <hfs>/plugins/Hotkey/
   ```

2. Restart HFS so the server-side `plugin.js` is loaded.
3. Open the HFS admin panel and keep **Enable Hotkey** turned on.

### Updating a frontend script only

If you only replace `public/main.js` or `public/help.js` (no `plugin.js` change),
a server restart is not required, but the browser must be forced to reload the
script:

- Windows / Linux: `Ctrl + F5`
- macOS: `Cmd + Shift + R`

Otherwise the browser keeps serving the previously cached `main.js` and the new
behavior will not appear.

---

## Configuration

| Key | Type | Default | Frontend | Description |
| --- | --- | --- | --- | --- |
| `enabled` | boolean | `true` | yes | Master switch. When off, no shortcut is handled at all. |

`enabled` is exposed to the frontend through `HFS.getPluginConfig()`, so toggling
it takes effect after a page reload.

---

## Keyboard reference

### Dialogs

| Key | Action |
| --- | --- |
| `Enter` | Confirm (OK / Continue / Save). Inside a comment box, `Enter` saves the comment **without closing the preview and without reloading the page**. |
| `Escape` | Cancel / close the dialog |
| `Backspace` | Cancel (only when not typing) |

The comment behavior is implemented by intercepting the form `submit`, clicking
the dialog's *Continue* button, and removing the dialog — so the file preview
stays exactly where it was.

### File preview (file-show dialog)

| Key | Action |
| --- | --- |
| `M` | Menu |
| `C` | Comment |
| `O` | Open |
| `D` | Download |
| `X` | Cut |
| `R` | Rename |
| `Delete` | Delete |
| `Z` | Zoom |
| `F` | Fullscreen |
| `S` | Select — enter selection mode (`Zip` / `Delete` become available) |
| `P` | Repeat |
| `L` | Copy link |

`Escape` closes an open menu first, and only then reaches HFS's own preview
handler.

**Modifier combinations are never intercepted.** `Ctrl` / `Cmd` / `Alt` +
letter always goes to the browser, so `Ctrl + C`, `Ctrl + X`, `Ctrl + V`,
`Ctrl + D`, `Ctrl + R`, `Ctrl + F` and friends keep their native meaning.

The letters are matched **lowercase**: holding `Shift` or having Caps Lock on
does not trigger a shortcut, the key is simply left to the browser.

While a preview is open, arrow keys are **not** used by this plugin — they are
left to HFS's built-in image / video viewer (album navigation, video seeking,
volume, etc.).

### Plain UI (no dialog, no preview, no menu)

| Key | Action |
| --- | --- |
| `Up` / `Down` | Smooth continuous scroll (press and hold to accelerate) |
| `Left` / `Right` | Walk the paging bar one step at a time: first button → the `25 / 50 / 100 / …` buttons → last button |
| `PageUp` / `PageDown` | Step through the paging bar (same granularity as `Left` / `Right`) |
| `Home` | Jump to the first paging button |
| `End` | Jump to the last paging button |
| `Space` | Left untouched (native browser behavior) |

The paging shortcuts only work when the `#paging` bar exists and contains a
`#paging-middle` element. On folders without pagination the paging keys do
nothing instead of being swallowed, and `Up` / `Down` scrolling still works.

Scrolling is driven by a `requestAnimationFrame` velocity engine: holding an
arrow key ramps the speed up and glides to a stop on release, instead of jumping
in fixed increments. The focused paging button gets a visible outline while you
walk through the bar.

### Tile size

| Key | Result |
| --- | --- |
| `Ctrl + 1` … `Ctrl + 9` | Tile size `1` … `9` |
| `Ctrl + 0` | Tile size `10` (largest tiles) |
| `Ctrl + =` | Tile size `10` |
| `Ctrl + -` | Tile size `0` (list mode) |
| `Ctrl + .` or `Ctrl + ·` | Tile size `0` (list mode) |

On macOS, `Cmd` works exactly like `Ctrl`.

The shortcut applies the size (clamped to `0..10`) and updates the tile-size
state and the visible `#option-tile-size` control so the UI and the layout stay
in sync. Remembering the size per folder is not part of this plugin; folders
without a remembered value simply use HFS's own `config.yaml` `tile_size`.
Backquote (`` ` ``) is also accepted for list mode.

---

## Typing and IME safety

Shortcuts pause **automatically** whenever the keyboard focus belongs to an
editable control, or while an input method is composing text. This is not a
setting; it is always on.

The plugin treats the following as "someone is typing, hands off":

- `<input>` elements, except `checkbox`, `radio`, `button`, `submit`, `reset`,
  `image`, `range`, `color`, `file`, `hidden`
- `<textarea>` and `<select>`
- `contenteditable` elements (including descendants — inherited editability)
- any key event with `isComposing`, `keyCode === 229`, or `key === 'Process'`

While typing, the page and preview shortcuts are suspended: `Up` / `Down` /
`Left` / `Right`, `PageUp` / `PageDown`, `Home` / `End`, the file-preview
letters, and `Ctrl + 0..9`. The keys go back to the input control, so the caret
moves inside the text instead of scrolling the page or changing the page.

The one deliberate exception is an open HFS dialog: `Enter` inside a dialog's
comment box still triggers *save without closing the preview* (see
[Dialogs](#dialogs)), because that is the whole point of the feature. `Escape`
and `Backspace` in dialogs are likewise unaffected by typing.

### Side-panel editors

Some plugins render their editor as a fixed overlay on `document.body` rather
than as an HFS dialog (for example the Notes plugin's `.note-panel` with its
`textarea.note-edit-input`). Those need special care, because the dialog and
preview checks do not apply to them.

The plugin therefore also suspends shortcuts when:

- the focused element is inside `.note-panel` / `.note-fullscreen` /
  `.note-mobile`, or matches `.note-edit-input` / `.note-input`, or
- the Notes edit-mode banner (`.note-editing-mode-banner`) is visible.

The second rule closes a data-loss gap: during an edit session the user may
temporarily click a toolbar button or an image, so the `textarea` is no longer
`document.activeElement`. Without this rule a single `Left` press would walk the
paging bar and replace the whole page while an unsaved note is open.

> If a future version of a side-panel plugin renames those classes, the generic
> typing rule still keeps the caret keys working; only the "edit mode but focus
> elsewhere" safety net would need its selectors updated.

---

## Precedence

`keydown` is captured once on `document` and routed in this order:

1. **Disabled** — plugin switched off, nothing happens.
2. **Login / search dialog** — Hotkey stays completely out of the way.
3. **Input method composing** — the event is ignored entirely.
4. **Sub-dialog open** — dialog keys (`Enter`, `Escape`, `Backspace`) apply.
5. **File preview open** — file-show keys apply; typing bails out first.
6. **Plain UI** — typing / side-panel editing is checked first; otherwise arrow,
   paging and scroll handling apply.
7. **Fallback** — dialog key handling.

Every handler uses `preventDefault()` plus `stopImmediatePropagation()` only on
keys it actually consumes, so unrelated native behavior (text selection, form
navigation, browser shortcuts) is preserved.

---

## Hotkey Help panel

Open the **User panel** from the top menu. A **Hotkey Help** button is injected
there; clicking it lazily loads `public/help.js` and shows a formatted shortcut
reference with a light and dark theme.

`help.js` is loaded on demand as:

```
/~/plugins/Hotkey/help.js?v=<timestamp>
```

so it never suffers from cache staleness.

---

## Console API

Everything is also reachable from the browser devtools through `window.hotkey`:

| Method | Description |
| --- | --- |
| `hotkey.openMenu()` | Open the preview menu |
| `hotkey.closeMenu()` | Close all preview menus |
| `hotkey.toggleMenu()` | Toggle the preview menu |
| `hotkey.clickItem(action)` | Trigger a preview action by name (`open`, `download`, `rename`, …) |
| `hotkey.listItems()` | Print the currently available menu items as a table |
| `hotkey.select()` | Enter selection mode (same as `S`) |
| `hotkey.navigatePaging(dir)` | `'left'` / `'right'` — one paging step |
| `hotkey.navigatePagingStep(kind)` | `'pageUp'` / `'pageDown'` |
| `hotkey.navigatePagingEdge(kind)` | `'home'` / `'end'` |
| `hotkey.scrollPage(dir)` | `'up'` / `'down'` — page scrolling |
| `hotkey.scrollPreview(dir)` | `'up'` / `'down'` — preview scrolling |
| `hotkey.stopScroll()` | Stop the scroll engine immediately |
| `hotkey.engine` | The raw `ScrollEngine` object (`velocity`, `target`, …) |
| `hotkey.setEnabled(bool)` | Runtime on/off switch (not persisted) |
| `hotkey.isEnabled()` | Current runtime state |
| `hotkey.context()` | Snapshot of the routing context |
| `hotkey.isTyping()` | `true` when a text control currently has focus |
| `hotkey.isNoteEditing()` | `true` when a side-panel editor is active |
| `hotkey.openHelp()` | Open the Hotkey Help dialog |

`hotkey.context()` returns:

```js
{
  login: false,       // login dialog visible
  search: false,      // search dialog visible
  fileShow: false,    // file preview visible
  subDialog: false,   // prompt / alert / confirm dialog visible
  menuOpen: false,    // preview menu open
  input: false,       // activeElement is a text control
  typing: false,      // same, also checks the event target / composedPath
  notesEditing: false,// side-panel editor focused, or edit mode active
  plainUI: true,      // none of the above
  paging: true        // #paging bar present
}
```

When a shortcut "does not work", check `typing` and `notesEditing` first — one of
them being `true` means the plugin is intentionally staying out of the way.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Shortcuts behave like the previous version | Browser cache — hard refresh (`Ctrl + F5`) |
| Arrow keys do nothing | Focus is in a text field (`hotkey.context().typing === true`) |
| `Left` / `Right` navigate pages instead of moving the caret | An editor inside a side panel is not recognized as editable — check `hotkey.isNoteEditing()` and update the panel selectors if a plugin renamed its classes |
| `Ctrl + 1..9` switches browser tabs | Focus is in a text field, so the plugin steps back and lets the browser handle it |
| Paging keys do nothing | The folder has no `#paging` bar (only one page) |
| Nothing at all works | `enabled` is off in the plugin configuration, or `apiRequired` is not met |

---

## Files

```
plugins/Hotkey/
├── plugin.js          # plugin declaration + `enabled` config
├── README.md          # this file
├── CHANGELOG.md       # behavior changes, root-cause notes, verification
└── public/
    ├── main.js        # all runtime keyboard logic
    └── help.js        # lazily loaded Hotkey Help dialog
```

---

## Notes and limitations

- The plugin is **stateless** on the server: no database, no stored files, no
  server routes, no analytics. The only network activity is the browser loading
  the plugin's own static assets (`main.js`, `help.js`).
- Dialog and preview detection is based on HFS's own CSS classes and buttons
  (`#paging`, `#select-button`, `#menu-entry-*`, `.dialog-backdrop`,
  `.file-menu`, …). A major HFS markup change may require selector updates.
- The preview menu arrow behavior belongs to HFS's built-in viewer, not to this
  plugin; Hotkey deliberately does not consume arrow keys while a preview is
  open.
- Keyboard-only: no pointer gestures, no touch gestures, no mobile-specific UI.

---

## Version history

See [CHANGELOG.md](CHANGELOG.md). Current version: **2.6** — shortcuts pause
while typing, during IME composition, and while a side-panel editor (Notes) is
active.
