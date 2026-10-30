(() => {
    'use strict';
    const items = [...document.querySelectorAll('.gallery-item')];
    if (!items.length || typeof HTMLDialogElement === 'undefined') return;
    const dialog = document.createElement('dialog');
    dialog.className = 'viewer';
    dialog.setAttribute('aria-label', 'Gallery photo viewer');
    dialog.innerHTML = `
        <div class="viewer-toolbar">
            <button type="button" data-action="out" aria-label="Zoom out">−</button>
            <button type="button" data-action="reset" aria-label="Reset zoom">100%</button>
            <button type="button" data-action="in" aria-label="Zoom in">+</button>
            <button type="button" data-action="close" autofocus aria-label="Close photo viewer">Close ×</button>
        </div>
        <div class="viewer-stage">
            <img class="viewer-image" alt="" draggable="false" hidden>
            <div class="viewer-status" role="status" aria-live="polite"></div>
        </div>
        <p class="viewer-hint">Drag to move around while zoomed in. Reset to 100% to swipe between photos.</p>
        <div class="viewer-footer">
            <button type="button" data-action="prev" aria-label="Previous photo">←</button>
            <span class="viewer-counter" aria-live="polite"></span>
            <button type="button" data-action="next" aria-label="Next photo">→</button>
            <a class="viewer-original" target="_blank" rel="noopener">Original photo ↗</a>
        </div>`;
    document.body.append(dialog);
    const stage = dialog.querySelector('.viewer-stage');
    const picture = dialog.querySelector('.viewer-image');
    const status = dialog.querySelector('.viewer-status');
    const counter = dialog.querySelector('.viewer-counter');
    const original = dialog.querySelector('.viewer-original');
    const buttons = Object.fromEntries([...dialog.querySelectorAll('[data-action]')].map(b => [b.dataset.action, b]));
    let index = 0, scale = 1, x = 0, y = 0, width = 0, height = 0, request = 0;
    let ready = false, opener, gesture = null, swipe = null, lastTap = null;
    let naturalWidth = 0, naturalHeight = 0, lastPointerType = null;
    const pointers = new Map();
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    function draw() {
        const limitX = Math.max(0, (width * scale - stage.clientWidth) / 2);
        const limitY = Math.max(0, (height * scale - stage.clientHeight) / 2);
        x = clamp(x, -limitX, limitX);
        y = clamp(y, -limitY, limitY);
        picture.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
        buttons.reset.textContent = `${Math.round(scale * 100)}%`;
        buttons.in.disabled = !ready || scale >= 5;
        buttons.out.disabled = !ready || scale <= 1;
        buttons.reset.disabled = !ready;
    }
    function fit() {
        if (!ready) return;
        const ratio = Math.min(stage.clientWidth / naturalWidth, stage.clientHeight / naturalHeight, 1);
        const oldWidth = width;
        width = naturalWidth * ratio;
        height = naturalHeight * ratio;
        if (oldWidth) { x *= width / oldWidth; y *= width / oldWidth; }
        picture.style.width = `${width}px`;
        picture.style.height = `${height}px`;
        draw();
    }
    function reset() { scale = 1; x = y = 0; lastTap = null; draw(); }
    function zoom(next, anchor = {x: 0, y: 0}) {
        if (!ready) return;
        const old = scale;
        scale = clamp(next, 1, 5);
        x = anchor.x - (anchor.x - x) * scale / old;
        y = anchor.y - (anchor.y - y) * scale / old;
        draw();
    }
    function clearGesture() { pointers.clear(); gesture = swipe = lastTap = null; }
    function show(next) {
        index = (next + items.length) % items.length;
        const token = ++request;
        clearGesture();
        ready = false;
        picture.hidden = true;
        reset();
        status.textContent = 'Loading photo…';
        stage.setAttribute('aria-busy', 'true');
        counter.textContent = `${index + 1} / ${items.length}`;
        original.href = items[index].dataset.original;
        const image = new Image();
        image.onload = () => {
            if (request !== token || !dialog.open) return;
            naturalWidth = image.naturalWidth;
            naturalHeight = image.naturalHeight;
            picture.src = image.src;
            picture.alt = items[index].querySelector('img').alt;
            ready = true;
            width = 0;
            fit();
            picture.hidden = false;
            status.textContent = '';
            stage.setAttribute('aria-busy', 'false');
            // Only prefetch one optimized image, and respect data-saving connections.
            const connection = navigator.connection;
            if (!connection?.saveData && !/2g/.test(connection?.effectiveType || '')) {
                const preload = new Image();
                preload.src = items[(index + 1) % items.length].href;
            }
        };
        image.onerror = () => {
            if (request !== token || !dialog.open) return;
            status.textContent = 'The photo could not be loaded. Try another photo or open the original.';
            stage.setAttribute('aria-busy', 'false');
        };
        image.src = items[index].href;
    }
    items.forEach((item, i) => item.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = item;
        dialog.showModal();
        document.body.classList.add('viewer-open');
        show(i);
    }));
    const actions = {close: () => dialog.close(), prev: () => show(index - 1), next: () => show(index + 1), in: () => zoom(scale * 1.5), out: () => zoom(scale / 1.5), reset};
    for (const [name, button] of Object.entries(buttons)) button.addEventListener('click', actions[name]);
    dialog.addEventListener('close', () => {
        ++request;
        clearGesture();
        document.body.classList.remove('viewer-open');
        opener?.focus({preventScroll: true});
    });
    dialog.addEventListener('keydown', event => {
        const action = {'ArrowLeft': 'prev', 'ArrowRight': 'next', '+': 'in', '=': 'in', '-': 'out', '0': 'reset'}[event.key];
        if (action && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); actions[action](); }
    });
    function point(event) {
        const rect = stage.getBoundingClientRect();
        return {x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2};
    }
    function snapshot() {
        const [a, b] = [...pointers.values()];
        if (!a) { gesture = null; return; }
        gesture = {x, y, scale, center: b ? {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2} : a, distance: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0};
    }
    stage.addEventListener('pointerdown', event => {
        if (!ready || (event.pointerType === 'mouse' && event.button !== 0)) return;
        lastPointerType = event.pointerType;
        stage.setPointerCapture(event.pointerId);
        const p = point(event);
        pointers.set(event.pointerId, p);
        if (pointers.size === 1) swipe = {start: p, end: p, time: performance.now(), allowed: scale === 1 && (window.visualViewport?.scale || 1) <= 1.01, moved: false, type: event.pointerType};
        else { if (swipe) swipe.allowed = false; lastTap = null; }
        snapshot();
    });
    stage.addEventListener('pointermove', event => {
        if (!pointers.has(event.pointerId) || !gesture) return;
        pointers.set(event.pointerId, point(event));
        const [a, b] = [...pointers.values()];
        if (b) {
            const center = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
            scale = clamp(gesture.scale * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(gesture.distance, 1), 1, 5);
            x = center.x - (gesture.center.x - gesture.x) * scale / gesture.scale;
            y = center.y - (gesture.center.y - gesture.y) * scale / gesture.scale;
            if (swipe) { swipe.allowed = false; swipe.moved = true; }
        } else {
            if (swipe) { swipe.end = a; if (Math.hypot(a.x - swipe.start.x, a.y - swipe.start.y) > 10) swipe.moved = true; }
            if (scale > 1) { x = gesture.x + a.x - gesture.center.x; y = gesture.y + a.y - gesture.center.y; }
        }
        draw();
    });
    function finish(event, cancelled = false) {
        if (!pointers.has(event.pointerId)) return;
        pointers.delete(event.pointerId);
        if (pointers.size) { if (swipe) { swipe.allowed = false; swipe.moved = true; } snapshot(); return; }
        const completed = swipe;
        gesture = swipe = null;
        if (cancelled || !completed) { lastTap = null; return; }
        const dx = completed.end.x - completed.start.x, dy = completed.end.y - completed.start.y;
        if (completed.allowed && scale === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && performance.now() - completed.time < 900) {
            show(index + (dx < 0 ? 1 : -1));
        } else if (!completed.moved && completed.type !== 'mouse') {
            const now = performance.now();
            if (lastTap && now - lastTap.time < 320 && Math.hypot(lastTap.point.x - completed.end.x, lastTap.point.y - completed.end.y) < 30) {
                zoom(scale > 1 ? 1 : 2.5, completed.end);
                lastTap = null;
            } else lastTap = {time: now, point: completed.end};
        } else lastTap = null;
    }
    stage.addEventListener('pointerup', event => finish(event));
    stage.addEventListener('pointercancel', event => finish(event, true));
    stage.addEventListener('lostpointercapture', event => finish(event, true));
    stage.addEventListener('dblclick', event => { event.preventDefault(); if (lastPointerType === 'mouse') zoom(scale > 1 ? 1 : 2.5, point(event)); });
    stage.addEventListener('wheel', event => {
        event.preventDefault();
        zoom(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), point(event));
    }, {passive: false});
    new ResizeObserver(() => { if (dialog.open) { clearGesture(); fit(); } }).observe(stage);
})();
