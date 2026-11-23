exports.repo = "hugo529100/hfs-Hotkey"
exports.version = 2.4
exports.apiRequired = 8.87
exports.hasConfig = true
exports.frontend_js = 'main.js'
exports.description = "Unified keyboard helper for HFS (Enter/Esc, comment Enter saves without closing preview, file-show shortcuts, smooth arrow scrolling, paging navigation incl. PageUp/PageDown/Home/End, and Ctrl+0..9 tile size). Tile-size memory (per folder, expiry, server default) is provided by the Tiles-plus plugin."

exports.config = {

    enabled: {
        type: 'boolean',
        label: 'Enable Hotkey',
        defaultValue: true,
        frontend: true,
        helperText: `
Unified keyboard helper. Shortcuts only: remembering a tile size per
folder is handled by the Tiles-plus plugin.

Dialog keys:
  Enter      Confirm (OK / Continue)
             In a comment box, Enter saves the comment without
             closing the preview and without reloading the page.
  Escape     Cancel / close
  Backspace  Cancel (when not typing)

File-show keys (preview open):
  M  Menu       C  Comment    O  Open      D  Download
  X  Cut        R  Rename     Del Delete   Z  Zoom
  F  Fullscreen S  Select     P  Repeat    L  Copy link
  (Select toggles selection mode; Zip / Delete become available.)

Arrow keys:
  Plain UI (no dialog / no preview / no menu):
    Up / Down        Smooth continuous scroll (press and hold)
    Left / Right     Walk through the paging bar (#paging) one step at a time:
                     first-button -> 25/50/100/... -> last-button
                     (only when the paging bar exists)
    PageUp / PageDown  Same as Left / Right: step through the paging bar
    Home             Jump to the first paging button
    End              Jump to the last paging button
    Space            native behavior
  File preview, menu closed:
    Up / Down / Left / Right   Handled by the built-in image / video
                               viewer (album navigation, video seek, etc.)
  File preview, menu open:
    Up / Down / Left / Right   Move focus between menu items

Tile size (apply only):
  Ctrl + 1..9      Set tile size to 1..9
  Ctrl + 0         Set tile size to 10 (largest tiles)
  Ctrl + =         Set tile size to 10 (largest tiles)
  Ctrl + -         Set tile size to 0  (list mode)
  Ctrl + .  or  ·  Set tile size to 0  (list mode)
  (Cmd on macOS works the same as Ctrl.)
  The shortcut writes HFS.state.tile_size and refreshes the
  #option-tile-size control. Whether the value is remembered per
  folder and how long it is kept are settings of the Tiles-plus
  plugin (tile mode memory); folders without a remembered value use
  HFS's own config.yaml tile_size.

Scrolling uses a rAF-based velocity engine, so holding an arrow key
produces a smooth ramp-up / glide-to-stop instead of discrete jumps.

Shortcuts are ignored while typing in an input field.
Combinations with Ctrl / Cmd / Alt are never intercepted by the
file-show shortcuts, so browser-native Ctrl+C / Ctrl+X / Ctrl+V
(copy / cut / paste) keep working normally.
When disabled, no hotkey will be triggered.
        `
    }

}
