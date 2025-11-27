// Lightweight Custom Datepicker Overlay for input[type="date"].form-control
// Renders a rounded, animated dropdown calendar matching the custom select style.
(function(){
    const INPUT_SELECTOR = 'input[type="date"].form-control';

    function pad(n){ return String(n).padStart(2,'0'); }
    function formatDMY(d){ return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`; }
    function parseDMY(s){
        const m = /^\s*(\d{2})\.(\d{2})\.(\d{4})\s*$/.exec(s||'');
        if (!m) return null;
        const d = new Date(Number(m[3]), Number(m[2])-1, Number(m[1]));
        return isNaN(d.getTime()) ? null : d;
    }

    function createPicker(){
        const root = document.createElement('div');
        root.className = 'cdp-root';
        root.innerHTML = `
            <div class="cdp-card">
                <div class="cdp-header">
                    <button type="button" class="cdp-nav cdp-prev-year" aria-label="Vorheriges Jahr">«</button>
                    <button type="button" class="cdp-nav cdp-prev" aria-label="Vorheriger Monat">‹</button>
                    <div class="cdp-title" role="button" tabindex="0" aria-label="Monat und Jahr auswählen"></div>
                    <button type="button" class="cdp-nav cdp-next" aria-label="Nächster Monat">›</button>
                    <button type="button" class="cdp-nav cdp-next-year" aria-label="Nächstes Jahr">»</button>
                </div>
                <div class="cdp-weekdays"></div>
                <div class="cdp-grid" role="grid"></div>
            </div>
        `;
        document.body.appendChild(root);
        return root;
    }

    let openInstance = null; // track open picker

    function enhanceInput(input){
        if (input.__cdpEnhanced) return;
        input.__cdpEnhanced = true;

        let picker = null;
        let current = parseDMY(input.value) || new Date();
        let viewYear = current.getFullYear();
        let viewMonth = current.getMonth();

        // Unterbinde natives Date-UI: wechsle auf Textfeld, behalte ISO-Format
        if (input.type === 'date') {
            input.dataset.originalType = 'date';
            try { input.type = 'text'; } catch(_) {}
            input.classList.add('cdp-enhanced');
            if (!input.placeholder) input.placeholder = 'DD.MM.YYYY';
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('spellcheck', 'false');
            input.setAttribute('inputmode', 'numeric');
            input.setAttribute('pattern', '\\d{2}\\.\\d{2}\\.\\d{4}');
        }

        // Wrap input to place a calendar indicator button
        const wrapper = document.createElement('div');
        wrapper.className = 'cdp-input-wrap';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.className = 'cdp-indicator';
        indicator.setAttribute('aria-label', 'Kalender öffnen');
        wrapper.appendChild(indicator);

        function ensurePicker(){
            if (!picker) picker = createPicker();
        }

        function setPosition(){
            const rect = input.getBoundingClientRect();
            const top = rect.bottom + window.scrollY + 6;
            const left = rect.left + window.scrollX;
            const width = rect.width;
            const card = picker.querySelector('.cdp-card');
            picker.style.position = 'absolute';
            picker.style.left = `${left}px`;
            picker.style.top = `${top}px`;
            const min = Math.max(240, Math.min(340, width));
            card.style.minWidth = `${min}px`;
        }

        function render(){
            const title = picker.querySelector('.cdp-title');
            const weekdays = picker.querySelector('.cdp-weekdays');
            const grid = picker.querySelector('.cdp-grid');
            const monthNames = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
            const weekdayNames = ['Mo','Di','Mi','Do','Fr','Sa','So'];

            title.textContent = `${monthNames[viewMonth]} ${viewYear}`;
            title.setAttribute('aria-label', `${monthNames[viewMonth]} ${viewYear} - Klicken zum Ändern`);
            weekdays.innerHTML = weekdayNames.map(n=>`<div class="cdp-weekday" title="${n}">${n}</div>`).join('');

            // compute first day grid start (Monday as first day)
            const first = new Date(viewYear, viewMonth, 1);
            const startDay = (first.getDay() + 6) % 7; // 0..6 with Monday=0
            const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
            const prevDays = new Date(viewYear, viewMonth, 0).getDate();

            const cells = [];
            // previous month tail
            for (let i = startDay-1; i >= 0; i--){
                const day = prevDays - i;
                cells.push({ day, other:true, date: new Date(viewYear, viewMonth-1, day) });
            }
            // current month
            for (let d=1; d<=daysInMonth; d++){
                cells.push({ day:d, other:false, date:new Date(viewYear, viewMonth, d) });
            }
            // next month head to fill 6 rows x 7 cols = 42 cells
            while (cells.length % 7 !== 0 || cells.length < 42){
                const idx = cells.length - (startDay + daysInMonth);
                const day = idx + 1;
                cells.push({ day, other:true, date: new Date(viewYear, viewMonth+1, day) });
            }

            const selected = parseDMY(input.value);
            grid.innerHTML = '';
            cells.forEach(info=>{
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cdp-cell' + (info.other ? ' other' : '') + (selected && formatDMY(info.date) === formatDMY(selected) ? ' selected' : '');
                btn.textContent = String(info.day);
                btn.addEventListener('click', ()=>{
                    input.value = formatDMY(info.date);
                    input.dispatchEvent(new Event('input', {bubbles:true}));
                    input.dispatchEvent(new Event('change', {bubbles:true}));
                    close();
                });
                grid.appendChild(btn);
            });
        }

        function open(){
            ensurePicker();
            openInstance && openInstance.close();
            openInstance = { close };
            picker.classList.add('open');
            picker.style.display = 'block';
            setPosition();
            render();
            // Navigation-Buttons einrichten
            ensureNav();
            setTimeout(()=> picker.classList.add('visible'), 0);
            // Verzögert registrieren, damit der Öffnen-Klick nicht sofort als Outside-Klick gilt
            setTimeout(()=> document.addEventListener('click', onDocClick), 0);
            window.addEventListener('resize', close);
            window.addEventListener('scroll', close, true);
        }

        function close(){
            if (!picker) return;
            picker.classList.remove('visible');
            setTimeout(()=>{ if (picker) picker.style.display = 'none'; }, 120);
            document.removeEventListener('click', onDocClick);
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close, true);
            openInstance = null;
        }

        function onDocClick(e){
            if (picker && (e.target === input || picker.contains(e.target))) return;
            close();
        }

        // Controls
        function nav(delta){
            const d = new Date(viewYear, viewMonth + delta, 1);
            viewYear = d.getFullYear();
            viewMonth = d.getMonth();
            render();
        }

        function navYear(delta){
            viewYear += delta;
            render();
        }

        // Öffnen NUR über den Indikator-Button; Eingabefeld-Klick öffnet nicht
        input.addEventListener('click', (e)=>{ e.stopPropagation(); });
        indicator.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); open(); input.focus(); });

        // Hook nav buttons after picker creation (nur einmal registrieren)
        let navSetup = false;
        const ensureNav = ()=>{
            if (navSetup) return; // bereits eingerichtet
            ensurePicker();
            const prevBtn = picker.querySelector('.cdp-prev');
            const nextBtn = picker.querySelector('.cdp-next');
            const prevYearBtn = picker.querySelector('.cdp-prev-year');
            const nextYearBtn = picker.querySelector('.cdp-next-year');
            const titleBtn = picker.querySelector('.cdp-title');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', (e)=>{ e.stopPropagation(); nav(-1); });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', (e)=>{ e.stopPropagation(); nav(1); });
            }
            if (prevYearBtn) {
                prevYearBtn.addEventListener('click', (e)=>{ e.stopPropagation(); navYear(-1); });
            }
            if (nextYearBtn) {
                nextYearBtn.addEventListener('click', (e)=>{ e.stopPropagation(); navYear(1); });
            }
            
            // Titel klickbar machen für schnelle Navigation (zurück zum aktuellen Datum)
            if (titleBtn) {
                const handleTitleClick = (e)=>{ 
                    e.stopPropagation(); 
                    // Springe zum aktuellen Monat/Jahr
                    const now = new Date();
                    viewYear = now.getFullYear();
                    viewMonth = now.getMonth();
                    render();
                };
                titleBtn.addEventListener('click', handleTitleClick);
                titleBtn.addEventListener('keydown', (e)=>{
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTitleClick(e);
                    }
                });
            }
            navSetup = true;
        };
    }

    function enhanceAll(root){
        root.querySelectorAll(INPUT_SELECTOR).forEach(enhanceInput);
    }

    document.addEventListener('DOMContentLoaded', ()=> enhanceAll(document));
    const mo = new MutationObserver((muts)=>{
        for (const m of muts){
            if (m.type === 'childList'){
                m.addedNodes.forEach(node=>{
                    if (node.nodeType === 1){
                        if (node.matches && node.matches(INPUT_SELECTOR)) enhanceInput(node);
                        else enhanceAll(node);
                    }
                });
            }
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
})();


