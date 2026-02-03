/* Lightweight in-page notification/confirm/prompt module
   API:
     notify.alert(message) -> Promise<void>
     notify.confirm(message) -> Promise<boolean>
     notify.prompt(message, defaultValue) -> Promise<string|null>

   Also assigns window.notify and overrides window.alert to use in-page alerts
*/
(function(){
    const root = document.createElement('div');
    root.id = 'notify-root';
    // If body already exists (script loaded late), attach immediately so early alerts are visible.
    if (document.body) {
        document.body.appendChild(root);
    } else {
        document.addEventListener('DOMContentLoaded', ()=>{
            document.body.appendChild(root);
        });
    }

    function createModal(html) {
        const overlay = document.createElement('div');
        overlay.className = 'notify-overlay';

        const box = document.createElement('div');
        box.className = 'notify-box';
        box.innerHTML = html;

        overlay.appendChild(box);
        root.appendChild(overlay);

        return { overlay, box };
    }

    function removeModal(overlay){
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    const notify = {
        alert(message){
            return new Promise(resolve=>{
                const str = String(message);
                const parts = str.split(/\n+/);
                const title = escapeHtml(parts.shift() || '');
                const subtitle = escapeHtml(parts.join('\n')).replace(/\n/g,'<br>');
                const { overlay, box } = createModal(`
                    <div class="notify-content">
                        <div class="notify-message">
                            <div class="notify-title">${title}</div>
                            ${subtitle ? `<div class="notify-subtitle">${subtitle}</div>` : ''}
                        </div>
                        <div class="notify-actions">
                            <button class="notify-btn notify-btn-primary">OK</button>
                        </div>
                    </div>
                `);

                box.querySelector('.notify-btn').focus();
                box.querySelector('.notify-btn').addEventListener('click', ()=>{
                    removeModal(overlay);
                    resolve();
                }, { once: true });
            });
        },

        confirm(message){
            return new Promise(resolve=>{
                const { overlay, box } = createModal(`
                    <div class="notify-content">
                        <div class="notify-message">${escapeHtml(String(message)).replace(/\n/g,'<br>')}</div>
                        <div class="notify-actions">
                            <button class="notify-btn" data-val="false">Abbrechen</button>
                            <button class="notify-btn notify-btn-primary" data-val="true">OK</button>
                        </div>
                    </div>
                `);

                const buttons = box.querySelectorAll('.notify-btn');
                buttons.forEach(btn=> btn.addEventListener('click', (e)=>{
                    const v = btn.getAttribute('data-val') === 'true';
                    removeModal(overlay);
                    resolve(v);
                }, { once: true }));
            });
        },

        prompt(message, defaultValue=''){
            return new Promise(resolve=>{
                const { overlay, box } = createModal(`
                    <div class="notify-content">
                        <div class="notify-message">${escapeHtml(String(message)).replace(/\n/g,'<br>')}</div>
                        <div style="margin:12px 20px;"><input class="notify-input" value="${escapeHtml(String(defaultValue))}"></div>
                        <div class="notify-actions">
                            <button class="notify-btn" data-val="null">Abbrechen</button>
                            <button class="notify-btn notify-btn-primary" data-val="ok">OK</button>
                        </div>
                    </div>
                `);

                const input = box.querySelector('.notify-input');
                input.select();

                box.querySelectorAll('.notify-btn').forEach(btn=> btn.addEventListener('click', ()=>{
                    const v = btn.getAttribute('data-val');
                    if (v === 'ok') {
                        const val = input.value;
                        removeModal(overlay);
                        resolve(val);
                    } else {
                        removeModal(overlay);
                        resolve(null);
                    }
                }, { once: true }));
            });
        }
    };

    // small helper to avoid XSS when injecting messages
    function escapeHtml(str){
        return str.replace(/[&<>\"'`]/g, function(ch){
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;","`":"&#96;"})[ch] || ch;
        });
    }

    // expose
    window.notify = notify;

    // If any alerts were queued before notify loaded, show them now
    try {
        if (Array.isArray(window._notifyQueue) && window._notifyQueue.length) {
            (async () => {
                for (const item of window._notifyQueue) {
                    try {
                        await notify.alert(item);
                    } catch (e) {
                        // ignore individual errors
                    }
                }
            })();
        }
    } catch (e) {
        // ignore
    }

    // override alert to use in-page modal (non-blocking)
    window.alert = function(msg){
        // fire-and-forget
        try { notify.alert(msg); } catch(e){ console.warn('notify.alert failed', e); }
    };

    // append CSS into head if not present
    document.addEventListener('DOMContentLoaded', ()=>{
        const href = './styles/notify.css';
        if (!Array.from(document.styleSheets).some(s=> s.href && s.href.includes('notify.css'))) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            document.head.appendChild(l);
        }
    });

})();
