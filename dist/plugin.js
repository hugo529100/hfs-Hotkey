exports.repo = "Hug3O/Hotkey"
exports.version = 1.7
exports.apiRequired = 8.87
exports.hasConfig = true
exports.frontend_js = 'main.js'
exports.description = "Unified keyboard helper for HFS (Enter/Esc, comment Enter saves without closing preview, file-show shortcuts, smooth arrow scrolling, paging navigation incl. PageUp/PageDown/Home/End, and Ctrl+0..9 tile size)"

exports.config = {

    enabled: {
        type: 'boolean',
        label: 'Enable Hotkey',
        defaultValue: true,
        helperText: `
Unified keyboard helper.

Dialog keys:
  Enter      Confirm (OK / Continue)
             In a comment box, Enter saves the comment without
             closing the preview and without reloading the page.
  Escape     Cancel / close
  Backspace  Cancel (when not typing)

File-show keys (preview open):
  M  Menu       C  Comment    O  Open      D  Download
  X  Cut        R  Rename     Del Delete   Z  Zoom
  F  Fullscreen S  Shuffle    P  Repeat    L  Copy link

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

Tile size (tile mode memory):
  Ctrl + 0..9      Set tile size to 0..9 (0 = list mode)
  Ctrl + -         Set tile size to 0  (list mode)
  Ctrl + =         Set tile size to 10 (largest tiles)
  (Cmd on macOS works the same as Ctrl.)
  The shortcut writes to HFS.state.tile_size, updates the
  #option-tile-size range UI, and saves per-folder memory.

Scrolling uses a rAF-based velocity engine, so holding an arrow key
produces a smooth ramp-up / glide-to-stop instead of discrete jumps.

Shortcuts are ignored while typing in an input field.
When disabled, no hotkey will be triggered.
        `
    },

    enableTileModeMemory: {
        type: 'boolean',
        label: 'Remember tile size per folder',
        defaultValue: true,
        helperText: 'Stores the tile size for each folder path in localStorage and restores it on revisit.'
    },

    expireHours: {
        type: 'number',
        label: 'Tile memory expiry (hours)',
        defaultValue: 24,
        helperText: 'How long to keep per-folder tile sizes. Set to 0 to keep forever.'
    },

    serverTileSize: {
        type: 'number',
        label: 'Server default tile size',
        defaultValue: 2,
        helperText: 'Default tile size used when a folder has no remembered value.'
    }

}