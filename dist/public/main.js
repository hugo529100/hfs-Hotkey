(() => {
    'use strict';

    const LOG = '[Hotkey]';

    // ==================== 状态 ====================
    let enabled = true;
    let hiddenFileDialog = null;
    let lastCommentSubmitAt = 0;

    // ==================== 常量 ====================
    const MENU_BUTTON_SELECTOR = [
        '.dialog-backdrop.file-show button[title="Menu"]',
        '.dialog-backdrop.file-show button[aria-label="Menu"]',
        '.dialog-backdrop.file-show button:has(.fa-menu)',
        '.dialog-backdrop.file-dialog button[title="Menu"]',
        '.dialog-backdrop.file-dialog button[aria-label="Menu"]',
        '.dialog-backdrop.file-dialog button:has(.fa-menu)',
    ].join(', ');

    const ITEM_SELECTOR_PREFIX = '#menu-entry-';
    const MENU_CONTAINER_SELECTOR = '.file-menu';
    const FILE_DIALOG_SELECTOR = '.dialog-backdrop.file-dialog';

    const ACTIONS = [
        'comment', 'open', 'download', 'cut', 'rename',
        'delete', 'zoom', 'fullscreen', 'shuffle', 'repeat',
        'copy-link',
    ];

    const SHORTCUTS = {
        m: 'menu',
        c: 'comment',
        o: 'open',
        d: 'download',
        x: 'cut',
        r: 'rename',
        Delete: 'delete',
        z: 'zoom',
        f: 'fullscreen',
        s: 'shuffle',
        p: 'repeat',
        l: 'copy-link',
    };

    const HIDE_MENU_FOR_ACTIONS = new Set([
        'cut', 'rename', 'delete',
    ]);

    const NATIVE_SCROLL_KEYS = new Set([
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'PageUp', 'PageDown', 'Home', 'End', ' ',
    ]);

    const FILE_SHOW_SELECTOR = [
        '.dialog-backdrop.file-show',
        '.dialog-backdrop.file-dialog',
        '.dialog-backdrop > div[role="dialog"].contain',
        '.dialog-backdrop div[role="dialog"].contain',
        '.dialog-backdrop [role="dialog"].contain',
    ].join(', ');

    const SUB_DIALOG_SELECTOR = [
        '.dialog-backdrop.dialog-prompt',
        '.dialog-backdrop.dialog-alert',
        '.dialog-backdrop.dialog-confirm',
    ].join(', ');

    // ==================== 上下文判断 ====================
    const Context = {
        isLogin() {
            const d = document.querySelector('[role="dialog"]');
            return !!d && !!d.querySelector('.fa-user');
        },
        isSearch() {
            const d = document.querySelector('[role="dialog"]');
            return !!d && d.id === 'search-dialog';
        },
        isFileShow() {
            const el = document.querySelector(FILE_SHOW_SELECTOR);
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            return el.getClientRects().length > 0;
        },
        getVisibleSubDialog() {
            const list = document.querySelectorAll(SUB_DIALOG_SELECTOR);
            for (const el of list) {
                const style = getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                if (el.getClientRects().length === 0) continue;
                return el;
            }
            return null;
        },
        hasSubDialog() {
            return !!this.getVisibleSubDialog();
        },
        isFormInput() {
            const el = document.activeElement;
            if (!el) return false;
            const tag = el.tagName.toLowerCase();
            if (tag === 'input') {
                const type = (el.type || '').toLowerCase();
                if (['checkbox','radio','button','submit','reset','image','range'].includes(type)) {
                    return false;
                }
                return true;
            }
            if (tag === 'textarea' || tag === 'select') return true;
            return !!el.isContentEditable;
        },
        isMenuOpen() {
            return !!document.querySelector(MENU_CONTAINER_SELECTOR);
        },
        isPlainUI() {
            return !this.hasSubDialog() && !this.isFileShow() && !this.isMenuOpen();
        },
    };

    // ==================== 评论提交：拦截 submit + 点击 Continue ====================
    function submitCommentWithoutReload(sub, form) {
        let intercepted = false;
        const onSubmit = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            intercepted = true;
        };
        form.addEventListener('submit', onSubmit, true);

        const continueBtn = findButtonIn(sub, /^(continue|继续|保存|ok|确定|确认)$/i);
        if (continueBtn) {
            continueBtn.click();
        } else {
            try { form.requestSubmit(); } catch (_) {}
        }

        const closer = sub.querySelector('.dialog-closer');
        if (closer) closer.click();
        else sub.remove();

        setTimeout(() => {
            form.removeEventListener('submit', onSubmit, true);
        }, 0);

        return intercepted;
    }

    // ==================== A：对话框按键逻辑 ====================
    function findButtonIn(root, re) {
        if (!root) return null;
        const nodes = [
            ...root.querySelectorAll('button'),
            ...root.querySelectorAll('[role="button"]'),
        ];
        return nodes.find(el => re.test((el.textContent || '').trim()));
    }
    function clickYes(root) {
        const scope = root || Context.getVisibleSubDialog() || document;
        const b = findButtonIn(scope, /^(yes|确定|确认|保存|ok)$/i);
        if (!b) return false;
        b.click(); return true;
    }
    function clickNo(root) {
        const scope = root || Context.getVisibleSubDialog() || document;
        const b = findButtonIn(scope, /^(no|取消|cancel)$/i);
        if (!b) return false;
        b.click(); return true;
    }
    function clickContinue(root) {
        const scope = root || Context.getVisibleSubDialog() || document;
        const b = findButtonIn(scope, /^(continue|继续|保存|ok|确定|确认)$/i);
        if (!b) return false;
        b.click(); return true;
    }

    function handleDialogKeys(e) {
        const sub = Context.getVisibleSubDialog();

        if (e.key === 'Enter') {
            if (Context.isFormInput()) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                const now = Date.now();
                if (now - lastCommentSubmitAt < 300) return true;
                lastCommentSubmitAt = now;

                const form = document.activeElement &&
                    document.activeElement.closest('form');
                if (form) {
                    submitCommentWithoutReload(sub, form);
                    return true;
                }
                clickYes(sub) || clickContinue(sub);
                return true;
            }
            if (clickContinue(sub) || clickYes(sub)) { swallow(e); return true; }
        }

        if (e.key === 'Escape' && clickNo(sub)) { swallow(e); return true; }
        if (e.key === 'Backspace' && !Context.isFormInput() && clickNo(sub)) {
            swallow(e); return true;
        }
        return false;
    }

    // ==================== B：文件预览按键逻辑 ====================
    function getMenuItem(action) {
        if (!ACTIONS.includes(action)) return null;
        return document.querySelector(`${ITEM_SELECTOR_PREFIX}${action}`);
    }
    function getMenuButton() {
        return document.querySelector(MENU_BUTTON_SELECTOR);
    }
    function getAllMenuContainers() {
        return Array.from(document.querySelectorAll(MENU_CONTAINER_SELECTOR));
    }
    function getFileDialog() {
        return document.querySelector(FILE_DIALOG_SELECTOR);
    }

    function hideFileDialog() {
        const d = getFileDialog();
        if (!d) return;
        if (hiddenFileDialog && hiddenFileDialog !== d) {
            hiddenFileDialog.style.display = '';
        }
        hiddenFileDialog = d;
        d.style.display = 'none';
    }
    function restoreFileDialog() {
        if (!hiddenFileDialog) return;
        hiddenFileDialog.style.display = '';
        hiddenFileDialog = null;
    }

    function closeAllMenus() {
        const menus = getAllMenuContainers();
        if (menus.length === 0) return false;
        const closer = document.querySelector(
            '.dialog-backdrop.file-show .dialog-closer, ' +
            '.dialog-backdrop.file-dialog .dialog-closer'
        );
        if (closer) closer.click();
        const remaining = getAllMenuContainers();
        if (remaining.length > 1) {
            remaining.slice(1).forEach(m => m.remove());
        }
        return true;
    }

    function clickMenuButton(options = {}) {
        const { toggle = true } = options;
        if (Context.isMenuOpen()) {
            if (toggle) { closeAllMenus(); return true; }
            closeAllMenus();
        }
        const btn = getMenuButton();
        if (!btn) return false;
        btn.click();
        return true;
    }

    function waitForMenuItem(action, timeoutMs = 1500, intervalMs = 50) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const item = getMenuItem(action);
                if (item) return resolve(item);
                if (Date.now() - start >= timeoutMs) return resolve(null);
                setTimeout(check, intervalMs);
            })();
        });
    }

    async function clickFileMenuItem(action, options = {}) {
        const { openMenuIfNeeded = true, timeoutMs = 1500, intervalMs = 50 } = options;

        let item = getMenuItem(action);
        if (item) { item.click(); return true; }
        if (!openMenuIfNeeded) return false;

        closeAllMenus();
        if (!clickMenuButton({ toggle: false })) return false;

        item = await waitForMenuItem(action, timeoutMs, intervalMs);
        if (!item) return false;

        const shouldHide = HIDE_MENU_FOR_ACTIONS.has(action);
        item.click();

        if (shouldHide) {
            requestAnimationFrame(() => {
                if (Context.hasSubDialog()) hideFileDialog();
                else requestAnimationFrame(() => {
                    if (Context.hasSubDialog()) hideFileDialog();
                });
            });
        }
        return true;
    }

    function listAvailableMenuItems() {
        const items = Array.from(
            document.querySelectorAll('.file-menu a[id^="menu-entry-"]')
        ).map(item => ({
            id: item.id,
            label: item.querySelector('label div')?.textContent?.trim() || '',
            href: item.getAttribute('href') || '',
        }));
        console.table(items);
        return items;
    }

    function handleFileShowKeys(e) {
        if (Context.isFormInput()) return false;

        if (e.key === 'Escape') {
            if (Context.isMenuOpen()) { closeAllMenus(); swallow(e); return true; }
            return false;
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
            e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            endScroll();
            return false;
        }

        if (e.key === 'Enter' || e.key === 'Backspace') return false;

        const action = SHORTCUTS[e.key];
        if (!action) return false;

        swallow(e);
        if (action === 'menu') clickMenuButton({ toggle: true });
        else clickFileMenuItem(action);
        return true;
    }

    // ==================== 工具 ====================
    function swallow(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    function shouldSkipAll() {
        return Context.isLogin() || Context.isSearch();
    }

    // ==================== 平滑滚动引擎 ====================
    const ScrollEngine = {
        active: false, rafId: 0, target: null, velocity: 0,
        maxVelocity: 100, accelerate: 6, friction: 0.9, stopThreshold: 0.8,
        start(target, direction) {
            this.target = target;
            this.active = true;
            const sign = direction === 'down' ? 1 : -1;
            if (this.velocity * sign <= 0) this.velocity = sign * 4;
            this.ensureLoop();
        },
        keepPressing(direction) {
            this.active = true;
            const sign = direction === 'down' ? 1 : -1;
            if (this.velocity * sign < 0) this.velocity = 0;
            this.velocity += sign * this.accelerate;
            if (Math.abs(this.velocity) > this.maxVelocity) this.velocity = sign * this.maxVelocity;
            this.ensureLoop();
        },
        release() { this.active = false; },
        ensureLoop() {
            if (this.rafId) return;
            const step = () => {
                const t = this.target;
                if (!t) { this.rafId = 0; return; }
                if (!this.active) {
                    this.velocity *= this.friction;
                    if (Math.abs(this.velocity) < this.stopThreshold) {
                        this.velocity = 0; this.rafId = 0; return;
                    }
                }
                const maxTop = Math.max(0, t.scrollHeight - t.clientHeight);
                const before = t.scrollTop;
                let next = before + this.velocity;
                if (next < 0) { next = 0; this.velocity = 0; }
                else if (next > maxTop) { next = maxTop; this.velocity = 0; }
                if (typeof t.scrollTo === 'function') {
                    try { t.scrollTo({ top: next, behavior: 'auto' }); }
                    catch (_) { t.scrollTop = next; }
                } else t.scrollTop = next;
                if ((next === 0 && this.velocity < 0) || (next === maxTop && this.velocity > 0)) {
                    this.velocity = 0; this.rafId = 0; return;
                }
                this.rafId = requestAnimationFrame(step);
            };
            this.rafId = requestAnimationFrame(step);
        },
    };

    let pressedDirection = null;
    function beginScroll(target, direction, e) {
        if (!target) return false;
        pressedDirection = direction;
        ScrollEngine.start(target, direction);
        ScrollEngine.keepPressing(direction);
        if (e) swallow(e);
        return true;
    }
    function repeatScroll(direction, e) {
        if (!ScrollEngine.target) return false;
        if (pressedDirection !== direction) {
            ScrollEngine.velocity = 0;
            pressedDirection = direction;
        }
        ScrollEngine.keepPressing(direction);
        if (e) swallow(e);
        return true;
    }
    function endScroll() { pressedDirection = null; ScrollEngine.release(); }

    function findScrollableAncestor(from, axis = 'y') {
        let el = from;
        while (el && el !== document.body && el !== document.documentElement) {
            const style = getComputedStyle(el);
            const overflow = axis === 'y' ? style.overflowY : style.overflowX;
            if (/(auto|scroll|overlay)/.test(overflow)) {
                const size = axis === 'y' ? el.scrollHeight : el.scrollWidth;
                const view = axis === 'y' ? el.clientHeight : el.clientWidth;
                if (size > view + 1) return el;
            }
            el = el.parentElement;
        }
        return document.scrollingElement || document.documentElement;
    }
    function getPageScrollTarget() {
        const doc = document.scrollingElement || document.documentElement;
        if (doc && doc.scrollHeight > doc.clientHeight + 1) return doc;
        const list = document.querySelector('.list-wrapper, ul.dir');
        if (list) {
            const s = getComputedStyle(list);
            if (/(auto|scroll|overlay)/.test(s.overflowY) &&
                list.scrollHeight > list.clientHeight + 1) return list;
        }
        return doc;
    }
    function getPreviewScrollTarget() {
        const dialog = document.querySelector(FILE_SHOW_SELECTOR);
        if (!dialog) return getPageScrollTarget();
        const candidates = dialog.querySelectorAll(
            '.dialog-content, .file-preview, .preview-container, .preview, ' +
            '.file-content, textarea, .scrollable'
        );
        for (const el of candidates) {
            const style = getComputedStyle(el);
            if (/(auto|scroll|overlay)/.test(style.overflowY) &&
                el.scrollHeight > el.clientHeight + 1) return el;
        }
        return findScrollableAncestor(
            dialog.querySelector('.dialog-content') || dialog, 'y'
        );
    }
    function blurActiveButton() {
        const el = document.activeElement;
        if (!el) return;
        const tag = el.tagName.toLowerCase();
        if (tag === 'button' ||
            (tag === 'a' && el.getAttribute('role') === 'button') ||
            tag === 'input' || tag === 'select' || tag === 'textarea') {
            try { el.blur(); } catch (_) {}
        }
    }
    function startHoldScroll(targetGetter, direction, e) {
        blurActiveButton();
        const target = targetGetter();
        if (!target) return false;
        ScrollEngine.target = target;
        beginScroll(target, direction, e);
        return true;
    }

    // ==================== 分页导航 ====================
    function getPagingNav() {
        const paging = document.getElementById('paging');
        if (!paging) return null;
        const middle = paging.querySelector('#paging-middle');
        if (!middle) return null;
        const buttons = Array.from(middle.querySelectorAll('button'));
        if (buttons.length === 0) return null;
        const first = paging.querySelector('button[title="Go to first item"]');
        const last = paging.querySelector('button[title="Go to last item"]');
        return { paging, middle, buttons, first, last };
    }
    function buildPagingSequence() {
        const nav = getPagingNav();
        if (!nav) return null;
        const seq = [];
        if (nav.first) seq.push({ kind: 'first', el: nav.first });
        nav.buttons.forEach((b, i) => seq.push({ kind: 'middle', el: b, index: i }));
        if (nav.last) seq.push({ kind: 'last', el: nav.last });
        return { nav, seq };
    }
    function isCurrentPagingButton(el) {
        if (!el) return false;
        if (el.classList.contains('toggled') ||
            el.classList.contains('current') ||
            el.classList.contains('active')) return true;
        if (el.getAttribute('aria-current') === 'page' ||
            el.getAttribute('aria-current') === 'true') return true;
        if (el.getAttribute('aria-selected') === 'true') return true;
        return false;
    }
    function getCurrentPagingPos(seq) {
        for (let i = 0; i < seq.length; i++) {
            if (isCurrentPagingButton(seq[i].el)) return i;
        }
        const highlighted = document.querySelector('#paging button.hotkey-paging-focused');
        if (highlighted) {
            const idx = seq.findIndex(s => s.el === highlighted);
            if (idx >= 0) return idx;
        }
        const active = document.activeElement;
        if (active) {
            const idx = seq.findIndex(s => s.el === active);
            if (idx >= 0) return idx;
        }
        const firstMiddle = seq.findIndex(s => s.kind === 'middle');
        return firstMiddle >= 0 ? firstMiddle : 0;
    }
    function highlightPagingItem(el) {
        document.querySelectorAll('#paging button.hotkey-paging-focused')
            .forEach(b => b.classList.remove('hotkey-paging-focused'));
        if (el) el.classList.add('hotkey-paging-focused');
    }
    function navigatePaging(direction, e) {
        const built = buildPagingSequence();
        if (!built) return false;
        const { seq } = built;
        blurActiveButton();
        let pos = getCurrentPagingPos(seq);
        if (direction === 'right') pos = Math.min(seq.length - 1, pos + 1);
        else pos = Math.max(0, pos - 1);
        const target = seq[pos];
        highlightPagingItem(target.el);
        target.el.click();
        if (e) swallow(e);
        return true;
    }
    function navigatePagingStep(kind, e) {
        const direction = (kind === 'pageUp') ? 'left' : 'right';
        return navigatePaging(direction, e);
    }
    function navigatePagingEdge(kind, e) {
        const built = buildPagingSequence();
        if (!built) return false;
        const { nav, seq } = built;
        let target = null;
        if (kind === 'home') {
            target = nav.first
                ? seq.find(s => s.kind === 'first')
                : seq.find(s => s.kind === 'middle');
        } else if (kind === 'end') {
            if (nav.last) {
                target = seq.find(s => s.kind === 'last');
            } else {
                for (let i = seq.length - 1; i >= 0; i--) {
                    if (seq[i].kind === 'middle') { target = seq[i]; break; }
                }
            }
        }
        if (!target) return false;
        blurActiveButton();
        highlightPagingItem(target.el);
        target.el.click();
        if (e) swallow(e);
        return true;
    }
    function demotePagingFocus() {
        document.querySelectorAll('#paging button').forEach(b => {
            if (!b.hasAttribute('data-hotkey-tabindex')) {
                b.setAttribute('tabindex', '-1');
                b.setAttribute('data-hotkey-tabindex', '1');
            }
        });
    }

    // ==================== 统一路由 ====================
    function routeKey(e) {
        if (!enabled) return;
        if (shouldSkipAll()) return;

        if (Context.hasSubDialog()) return handleDialogKeys(e);
        if (Context.isFileShow())  return handleFileShowKeys(e);

        if (Context.isPlainUI()) {
            if (e.key === 'ArrowDown') {
                if (Context.isFormInput()) return;
                return startHoldScroll(getPageScrollTarget, 'down', e);
            }
            if (e.key === 'ArrowUp') {
                if (Context.isFormInput()) return;
                return startHoldScroll(getPageScrollTarget, 'up', e);
            }
            if (e.key === 'ArrowRight') return navigatePaging('right', e);
            if (e.key === 'ArrowLeft')  return navigatePaging('left', e);
            if (e.key === 'PageUp') {
                if (Context.isFormInput()) return;
                if (navigatePagingStep('pageUp', e)) return;
                return;
            }
            if (e.key === 'PageDown') {
                if (Context.isFormInput()) return;
                if (navigatePagingStep('pageDown', e)) return;
                return;
            }
            if (e.key === 'Home') {
                if (Context.isFormInput()) return;
                if (navigatePagingEdge('home', e)) return;
                return;
            }
            if (e.key === 'End') {
                if (Context.isFormInput()) return;
                if (navigatePagingEdge('end', e)) return;
                return;
            }
            if (NATIVE_SCROLL_KEYS.has(e.key)) return;
            return;
        }
        return handleDialogKeys(e);
    }

    function handleRepeatKey(e) {
        if (!enabled) return;
        if (shouldSkipAll()) return;
        if (Context.isFileShow()) return;
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        if (Context.isFormInput()) return;
        if (e.repeat) {
            const dir = e.key === 'ArrowDown' ? 'down' : 'up';
            if (ScrollEngine.target) repeatScroll(dir, e);
        }
    }
    function handleKeyUp(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') endScroll();
    }

    function handleSubmit(e) {
        if (!enabled) return;
        if (shouldSkipAll()) return;
        if (Context.isFileShow()) return;
        const sub = Context.getVisibleSubDialog();
        if (!sub) return;
        if (Context.isFormInput()) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return;
        }
        const c = findButtonIn(sub, /^(continue|继续)$/i);
        const y = findButtonIn(sub, /^(yes|确定|确认)$/i);
        if (c || y) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            (c || y).click();
        }
    }

    // ==================== Tile mode memory + 快捷键 ====================
    const config = (typeof HFS !== 'undefined' && HFS.pluginConfig) ? HFS.pluginConfig : {};
    const ENABLE_TILE_MODE_MEMORY = config.enableTileModeMemory !== false;
    const EXPIRE_HOURS = config.expireHours ?? 24;
    const EXPIRE = EXPIRE_HOURS === 0 ? Infinity : EXPIRE_HOURS * 60 * 60 * 1000;
    const SERVER_TILE_SIZE = config.serverTileSize;

    const TILE_STORAGE_KEY = 'short-folder-tile-mode';
    const TILE_MIN = 0;
    const TILE_MAX = 10;

    let tileChanging = false;
    let currentTileUri = '';
    let saveTimeout = null;
    let lastSavedTileSize = undefined;
    let isNavigating = false;

    function loadTileData() {
        try {
            const raw = localStorage.getItem(TILE_STORAGE_KEY);
            if (!raw) return {};
            return JSON.parse(raw);
        } catch { return {}; }
    }
    function saveTileData(data) {
        localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(data));
    }
    function getTileModeKey(path) {
        const cleanPath = path.split('?')[0];
        return cleanPath.endsWith('/') ? cleanPath : cleanPath + '/';
    }
    function getTileSizeFromState() {
        if (typeof HFS !== 'undefined' && HFS.state &&
            HFS.state.tile_size !== undefined) return HFS.state.tile_size;
        return undefined;
    }
    function setTileSize(value) {
        if (typeof HFS !== 'undefined' && HFS.state) {
            tileChanging = true;
            HFS.state.tile_size = value;
            tileChanging = false;
        }
    }
    function applyTileSizeToDOM(size) {
        try {
            const listWrapper = document.querySelector('.list-wrapper');
            if (listWrapper) listWrapper.style.setProperty('--tile-size', size);
        } catch (e) {}
    }
    function getServerDefaultTileSize() { return SERVER_TILE_SIZE; }
    function cleanExpiredTileData() {
        if (EXPIRE === Infinity) return;
        const now = Date.now();
        const data = loadTileData();
        let changed = false;
        for (const key in data) {
            if (now - data[key].time > EXPIRE) {
                delete data[key]; changed = true;
            }
        }
        if (changed) saveTileData(data);
    }
    function scheduleSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            if (currentTileUri) {
                const currentSize = getTileSizeFromState();
                if (currentSize !== undefined && currentSize !== lastSavedTileSize) {
                    saveTileModeForPath(currentTileUri);
                    lastSavedTileSize = currentSize;
                }
            }
            saveTimeout = null;
        }, 300);
    }
    function immediateSave() {
        if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
        if (currentTileUri) {
            const currentSize = getTileSizeFromState();
            if (currentSize !== undefined && currentSize !== lastSavedTileSize) {
                saveTileModeForPath(currentTileUri);
                lastSavedTileSize = currentSize;
            }
        }
    }
    function loadTileModeForPath(path) {
        if (!ENABLE_TILE_MODE_MEMORY) return;
        if (typeof HFS === 'undefined' || !HFS.state) return;
        cleanExpiredTileData();
        const key = getTileModeKey(path);
        const data = loadTileData();
        const saved = data[key];
        const defaultSize = getServerDefaultTileSize() || 2;
        if (saved !== undefined && saved.size !== undefined) {
            if (EXPIRE !== Infinity && Date.now() - saved.time > EXPIRE) {
                delete data[key]; saveTileData(data);
                setTileSize(defaultSize); applyTileSizeToDOM(defaultSize);
                lastSavedTileSize = defaultSize; return;
            }
            if (ENABLE_TILE_MODE_MEMORY) {
                data[key].time = Date.now(); saveTileData(data);
            }
            setTileSize(saved.size); applyTileSizeToDOM(saved.size);
            lastSavedTileSize = saved.size; return;
        }
        setTileSize(defaultSize); applyTileSizeToDOM(defaultSize);
        lastSavedTileSize = defaultSize;
    }
    function saveTileModeForPath(path) {
        if (!ENABLE_TILE_MODE_MEMORY) return;
        if (typeof HFS === 'undefined' || !HFS.state) return;
        const key = getTileModeKey(path);
        const currentSize = getTileSizeFromState();
        if (currentSize === undefined) return;
        const data = loadTileData();
        data[key] = { size: currentSize, time: Date.now() };
        saveTileData(data);
        lastSavedTileSize = currentSize;
    }
    function applyTileSizeViaShortcut(size) {
        const clamped = Math.max(TILE_MIN, Math.min(TILE_MAX, size));
        setTileSize(clamped);
        applyTileSizeToDOM(clamped);
        try {
            const panel = document.getElementById('option-tile-size');
            if (panel) {
                const range = panel.querySelector('input[type="range"]');
                if (range) {
                    range.value = String(clamped);
                    range.dispatchEvent(new Event('input', { bubbles: true }));
                    range.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const label = panel.querySelector('div');
                if (label) label.textContent = 'Tiles mode: ' + clamped;
            }
        } catch (e) {}
        if (ENABLE_TILE_MODE_MEMORY && currentTileUri) {
            saveTileModeForPath(currentTileUri);
            lastSavedTileSize = clamped;
        }
    }
    function isInEditableField(el) {
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        if (tag === 'input') {
            const type = (el.type || '').toLowerCase();
            if (['checkbox','radio','button','submit','reset','image','range'].includes(type)) return false;
            return true;
        }
        if (tag === 'textarea' || tag === 'select') return true;
        return !!el.isContentEditable;
    }
    function handleTileShortcut(e) {
        const mod = e.ctrlKey || e.metaKey;
        if (!mod) return;
        if (e.altKey || e.shiftKey) return;

        if (e.key.startsWith('Arrow') ||
            e.key === 'PageUp' || e.key === 'PageDown' ||
            e.key === 'Home' || e.key === 'End' || e.key === ' ') {
            return;
        }
        const active = document.activeElement;
        if (isInEditableField(active)) return;

        if (e.key === '0') {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            applyTileSizeViaShortcut(10);
            return;
        }
        if (/^[1-9]$/.test(e.key)) {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            applyTileSizeViaShortcut(parseInt(e.key, 10));
            return;
        }
        if (e.key === '·' || e.key === '`' || e.key === '.' ||
            e.code === 'Backquote' || e.code === 'IntlBackslash' || e.code === 'Period') {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            applyTileSizeViaShortcut(0);
            return;
        }
        if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            applyTileSizeViaShortcut(0);
            return;
        }
        if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            applyTileSizeViaShortcut(10);
            return;
        }
    }

    function initTileModeModule() {
        if (!ENABLE_TILE_MODE_MEMORY) return;
        if (typeof HFS === 'undefined' || !HFS.watchState) return;

        setTimeout(function() {
            const currentUri = HFS.state ? HFS.state.uri : location.pathname;
            if (currentUri) {
                const path = currentUri.split('?')[0];
                currentTileUri = getTileModeKey(path);
                loadTileModeForPath(path);
                const currentSize = getTileSizeFromState();
                if (currentSize !== undefined) lastSavedTileSize = currentSize;
            }
        }, 100);

        HFS.watchState('uri', function(uri) {
            if (!uri) return;
            const path = uri.split('?')[0];
            const newKey = getTileModeKey(path);
            if (currentTileUri === newKey) return;
            isNavigating = true;
            immediateSave();
            currentTileUri = newKey;
            loadTileModeForPath(path);
            const currentSize = getTileSizeFromState();
            if (currentSize !== undefined) lastSavedTileSize = currentSize;
            setTimeout(() => { isNavigating = false; }, 300);
        });

        HFS.watchState('tile_size', function(value) {
            if (!ENABLE_TILE_MODE_MEMORY) return;
            if (tileChanging) return;
            if (!currentTileUri) return;
            if (isNavigating) return;
            if (value !== undefined) applyTileSizeToDOM(value);
            scheduleSave();
        });

        window.addEventListener('beforeunload', () => immediateSave());
    }

    // ==================== Help 懒加载 + User panel 按钮 ====================
    const HELP_JS_PATH = '/~/plugins/Hotkey/help.js';
    const HELP_SCRIPT_ID = 'hotkey-help-script';
    const HELP_BUTTON_ID = 'hotkey-help-button';

    function loadHelpScript() {
        if (document.getElementById(HELP_SCRIPT_ID)) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.id = HELP_SCRIPT_ID;
            s.src = HELP_JS_PATH + '?v=' + Date.now();
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load help.js'));
            document.head.appendChild(s);
        });
    }
    async function openHelp() {
        try {
            await loadHelpScript();
            if (window.HotkeyHelp && typeof window.HotkeyHelp.open === 'function') {
                window.HotkeyHelp.open();
            } else {
                console.error('[Hotkey] Help module loaded but API missing');
            }
        } catch (err) {
            console.error('[Hotkey] Failed to load help:', err);
        }
    }
    function injectUserPanelStyle() {
        if (document.getElementById('hotkey-user-panel-style')) return;
        const st = document.createElement('style');
        st.id = 'hotkey-user-panel-style';
        st.textContent = `
.hotkey-user-button {
    width: 100%;
    margin-top: 0.5em;
    padding: 0.5em;
    border-radius: 4px;
    border: 1px solid var(--button-text);
    background-color: var(--button-bg);
    color: var(--button-text);
    cursor: pointer;
    box-sizing: border-box;
    display: block;
}
.hotkey-user-button:disabled { opacity: 0.7; cursor: not-allowed; }
div.dialog[aria-modal="true"] .hotkey-user-button { margin-top: 1em; }
`;
        document.head.appendChild(st);
    }
    function findUserPanelDialog() {
        const dialogs = document.querySelectorAll('div[role="dialog"][aria-modal="true"].dialog');
        for (const dialog of dialogs) {
            const hasUserPanel = dialog.querySelector('#user-panel');
            const hasDialogTitle = dialog.querySelector('.dialog-title');
            const titleText = hasDialogTitle?.textContent?.trim();
            if (hasUserPanel && titleText === 'User panel') return dialog;
        }
        return null;
    }
    function createHelpButton(id) {
        const button = document.createElement('button');
        button.id = id;
        button.className = 'hotkey-user-button';
        button.textContent = 'Hotkey Help';
        button.addEventListener('click', () => { openHelp(); });
        return button;
    }
    function injectUserPanelButton() {
        const userPanelDialog = findUserPanelDialog();
        if (!userPanelDialog) return;
        const existingHelp = document.querySelector('#' + HELP_BUTTON_ID);
        if (existingHelp) return;
        const userPanel = userPanelDialog.querySelector('#user-panel');
        if (!userPanel) return;
        const button = createHelpButton(HELP_BUTTON_ID);
        userPanel.appendChild(button);
    }
    const userPanelObserver = new MutationObserver(() => injectUserPanelButton());
    userPanelObserver.observe(document.body, { childList: true, subtree: true });
    injectUserPanelStyle();
    setTimeout(injectUserPanelButton, 1000);

    // ==================== 监听 ====================
    document.addEventListener('keydown', handleTileShortcut, true);
    document.addEventListener('keydown', routeKey, true);
    document.addEventListener('keydown', handleRepeatKey, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('blur', endScroll);

    // ==================== Observer（合并） ====================
    let lastState = '';
    function computeState() {
        return [
            Context.isLogin(),
            Context.isSearch(),
            Context.isFileShow(),
            Context.hasSubDialog(),
            Context.isMenuOpen(),
        ].join('|');
    }
    const observer = new MutationObserver(() => {
        demotePagingFocus();
        const s = computeState();
        if (s !== lastState) {
            lastState = s;
            if (hiddenFileDialog && !Context.hasSubDialog()) {
                restoreFileDialog();
            }
        }
    });
    observer.observe(document.body, {
        childList: true, subtree: true,
        attributes: true,
        attributeFilter: ['role', 'id', 'class', 'style', 'hidden'],
    });
    demotePagingFocus();

    // ==================== 聚焦样式 ====================
    (function injectFocusStyle() {
        if (document.getElementById('hotkey-focus-style')) return;
        const s = document.createElement('style');
        s.id = 'hotkey-focus-style';
        s.textContent = `
.file-menu a.hotkey-focused {
    outline: 2px solid var(--accent-color, #4a90d9);
    outline-offset: -2px;
    background: rgba(74,144,217,0.15);
}
#paging button.hotkey-paging-focused {
    outline: 2px solid var(--accent-color, #4a90d9);
    outline-offset: -2px;
    background: rgba(74,144,217,0.15);
}
`;
        (document.head || document.documentElement).appendChild(s);
    })();

    // ==================== 初始化 ====================
    function init() {
        initTileModeModule();
        if (typeof HFS !== 'undefined') {
            HFS.short = {
                tile: {
                    save: function() { if (ENABLE_TILE_MODE_MEMORY && currentTileUri) immediateSave(); },
                    load: function(path) { if (ENABLE_TILE_MODE_MEMORY) loadTileModeForPath(path || location.pathname); },
                    cleanExpired: cleanExpiredTileData,
                    getStorage: function() { return loadTileData(); },
                    getServerDefault: function() { return getServerDefaultTileSize(); },
                    refresh: function() { if (currentTileUri) loadTileModeForPath(currentTileUri); },
                    getCurrentSize: function() { return getTileSizeFromState(); },
                    setSize: applyTileSizeViaShortcut,
                },
            };
        }
    }
    let initialized = false;
    function safeInit() {
        if (initialized) return;
        initialized = true;
        init();
    }
    safeInit();

    // ==================== Console 工具 ====================
    window.hotkey = {
        openMenu:   () => clickMenuButton({ toggle: false }),
        closeMenu:  closeAllMenus,
        toggleMenu: () => clickMenuButton({ toggle: true }),
        clickItem:  clickFileMenuItem,
        listItems:  listAvailableMenuItems,
        navigatePaging: dir => {
            const fake = { preventDefault(){}, stopPropagation(){}, stopImmediatePropagation(){} };
            return dir === 'left' ? navigatePaging('left', fake) : navigatePaging('right', fake);
        },
        navigatePagingStep,
        navigatePagingEdge,
        scrollPage: dir => {
            const fake = { preventDefault(){}, stopPropagation(){}, stopImmediatePropagation(){} };
            if (!dir || dir === 'down') return startHoldScroll(getPageScrollTarget, 'down', fake);
            return startHoldScroll(getPageScrollTarget, 'up', fake);
        },
        scrollPreview: dir => {
            const fake = { preventDefault(){}, stopPropagation(){}, stopImmediatePropagation(){} };
            const target = getPreviewScrollTarget();
            if (!target) return false;
            return beginScroll(target, dir === 'up' ? 'up' : 'down', fake);
        },
        openHelp,
        stopScroll: endScroll,
        engine: ScrollEngine,
        setEnabled: v => { enabled = !!v; },
        isEnabled:  () => enabled,
        context:    () => ({
            login:    Context.isLogin(),
            search:   Context.isSearch(),
            fileShow: Context.isFileShow(),
            subDialog:Context.hasSubDialog(),
            menuOpen: Context.isMenuOpen(),
            input:    Context.isFormInput(),
            plainUI:  Context.isPlainUI(),
            paging:   !!getPagingNav(),
        }),
    };

    console.log(LOG, 'installed');
})();