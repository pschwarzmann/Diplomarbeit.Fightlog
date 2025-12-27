// Lightweight Custom Select Enhancer
// Enhances native <select class="form-control"> with a rounded, animated dropdown.
// Keeps original <select> in DOM (display:none), syncing value for forms.

(function(){
    const SELECT_SELECTOR = 'select.form-control';
    
    // Globaler Manager für alle offenen Dropdowns
    const openDropdowns = new Set();
    let globalClickHandler = null;
    let globalScrollHandler = null;
    
    function setupGlobalClickHandler(){
        if (globalClickHandler) return;
        globalClickHandler = (e) => {
            // Schließe alle offenen Dropdowns, wenn Klick außerhalb oder auf ein anderes Element
            const target = e.target;
            const clickedDropdown = target.closest('.cs-select');
            const isCalendarIndicator = target.classList.contains('cdp-indicator') || target.closest('.cdp-indicator');
            const clickedOnFormElement = target.tagName === 'INPUT' || 
                                       target.tagName === 'TEXTAREA' || 
                                       target.closest('.cdp-input-wrap') ||
                                       target.closest('.cdp-root');
            
            // Prüfe ob der Klick auf ein offenes Dropdown war (Trigger, Option oder Menu)
            const clickedOnMenu = target.closest('.cs-menu');
            const clickedOnTrigger = target.closest('.cs-trigger');
            const clickedOnOption = target.closest('.cs-option');
            
            // WICHTIG: Wenn auf Trigger oder Option geklickt wurde, NICHT schließen
            // Der Click-Handler des Elements wird das selbst regeln
            if (clickedOnTrigger || clickedOnOption || clickedOnMenu) {
                return; // Nicht schließen - lasse den Element-Handler arbeiten
            }
            
            // Schließe alle offenen Dropdowns wenn:
            // 1. Auf ein Form-Element geklickt wurde (Textfeld, Kalender, etc.)
            // 2. Außerhalb aller Dropdowns geklickt wurde
            if (clickedOnFormElement || !clickedDropdown) {
                // Bei Kalender-Indikator: Asynchron schließen, damit der Kalender-Event-Handler zuerst ausgeführt wird
                // Der Kalender-Indikator hat stopPropagation, also müssen wir warten bis der Event verarbeitet wurde
                if (isCalendarIndicator) {
                    // Verwende requestAnimationFrame für bessere Kompatibilität
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            openDropdowns.forEach(closeFn => {
                                if (typeof closeFn === 'function') closeFn();
                            });
                            openDropdowns.clear();
                        }, 10);
                    });
                } else {
                    // Sofort schließen für alle anderen Fälle
                    openDropdowns.forEach(closeFn => {
                        if (typeof closeFn === 'function') closeFn();
                    });
                    openDropdowns.clear();
                }
            }
        };
        // Verwende capture phase, damit wir vor anderen Event-Handlern sind
        // ABER: Wir blockieren den Event nicht, damit andere Handler normal funktionieren
        document.addEventListener('click', globalClickHandler, true);
    }
    
    function setupGlobalScrollHandler(){
        if (globalScrollHandler) return;
        globalScrollHandler = () => {
            // Schließe alle offenen Dropdowns beim Scrollen
            openDropdowns.forEach(closeFn => {
                if (typeof closeFn === 'function') closeFn();
            });
            openDropdowns.clear();
        };
        window.addEventListener('scroll', globalScrollHandler, true);
        window.addEventListener('resize', globalScrollHandler, true);
    }

    function enhanceSelect(native){
        if (native.__csEnhanced) return;
        native.__csEnhanced = true;

        const wrapper = document.createElement('div');
        wrapper.className = 'cs-select';

        // Trigger button
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cs-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        // Menu
        const menu = document.createElement('div');
        menu.className = 'cs-menu';
        menu.setAttribute('role', 'listbox');

        // Build options
        const options = Array.from(native.querySelectorAll('option'));
        const optionEls = options.map(opt => {
            const item = document.createElement('div');
            item.className = 'cs-option';
            item.setAttribute('role', 'option');
            item.dataset.value = opt.value;
            item.textContent = opt.textContent;
            if (opt.disabled) item.setAttribute('aria-disabled', 'true');
            if (opt.value === native.value) item.classList.add('selected');
            item.addEventListener('click', (e)=>{
                e.stopPropagation(); // Verhindere, dass der globale Handler das Dropdown schließt bevor der Wert gesetzt wird
                e.preventDefault(); // Verhindere Standard-Verhalten
                if (opt.disabled) return;
                setValue(opt.value, true);
                close();
            });
            return item;
        });
        optionEls.forEach(el=> menu.appendChild(el));

        // Sync trigger label
        function refreshLabel(){
            const current = options.find(o=> o.value === native.value) || options[0];
            trigger.textContent = current ? current.textContent : '';
        }

        function setValue(val, fireChange){
            if (native.value !== val){
                native.value = val;
                const evt = new Event('input', { bubbles: true });
                native.dispatchEvent(evt);
                const evt2 = new Event('change', { bubbles: true });
                native.dispatchEvent(evt2);
            }
            optionEls.forEach(el=> el.classList.toggle('selected', el.dataset.value === val));
            refreshLabel();
        }

        function open(){
            // Schließe alle anderen offenen Dropdowns zuerst
            openDropdowns.forEach(closeFn => {
                if (typeof closeFn === 'function' && closeFn !== close) closeFn();
            });
            openDropdowns.clear();
            
            wrapper.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
            
            // focus selected item if available
            const sel = menu.querySelector('.cs-option.selected');
            if (sel) sel.scrollIntoView({ block: 'nearest' });
            
            // Füge dieses Dropdown zur Liste der offenen hinzu
            openDropdowns.add(close);
            setupGlobalClickHandler();
            setupGlobalScrollHandler();
        }

        function close(){
            wrapper.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            openDropdowns.delete(close);
        }

        trigger.addEventListener('click', (e)=>{
            e.stopPropagation(); // Verhindere, dass der globale Handler sofort schließt
            e.preventDefault(); // Verhindere Standard-Verhalten
            if (wrapper.classList.contains('open')) {
                close();
            } else {
                open();
            }
        });

        // Keyboard support (basic)
        trigger.addEventListener('keydown', (e)=>{
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' '){
                e.preventDefault();
                open();
            }
        });

        // Observe native select changes (external updates)
        native.addEventListener('change', ()=> refreshLabel());

        // Hide native select, insert wrapper
        native.style.display = 'none';
        native.parentNode.insertBefore(wrapper, native);
        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);
        wrapper.appendChild(native); // keep in DOM for forms

        refreshLabel();
    }

    function enhanceAll(root){
        root.querySelectorAll(SELECT_SELECTOR).forEach(enhanceSelect);
    }

    // Initial run
    document.addEventListener('DOMContentLoaded', ()=>{
        enhanceAll(document);
    });

    // Enhance dynamically added selects (Vue renders later)
    const mo = new MutationObserver((muts)=>{
        for (const m of muts){
            if (m.type === 'childList'){
                m.addedNodes.forEach(node=>{
                    if (node.nodeType === 1){
                        if (node.matches && node.matches(SELECT_SELECTOR)) enhanceSelect(node);
                        else enhanceAll(node);
                    }
                });
            }
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
})();


