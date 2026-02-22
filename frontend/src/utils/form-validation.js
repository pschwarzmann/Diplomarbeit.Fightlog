// Formular-Validierung mit schönen roten Fehlermeldungen
(function(){
    'use strict';

    // Fehlermeldungen unter Feldern anzeigen
    function showFieldError(field, message) {
        // Entferne vorherige Fehlermeldung
        removeFieldError(field);
        
        // Für Custom-Selects und Datepicker: Finde den sichtbaren Trigger-Button
        let targetField = field;
        let fieldContainer = null;
        
        if (field.tagName === 'SELECT' && field.style.display === 'none') {
            // Custom-Select: Finde den cs-select Wrapper
            const customSelect = field.closest('.cs-select');
            if (customSelect) {
                const trigger = customSelect.querySelector('.cs-trigger');
                if (trigger) {
                    // Füge Error-Klasse zum Trigger hinzu
                    trigger.classList.add('error');
                    fieldContainer = customSelect;
                }
            }
        } else if (field.type === 'date' || field.classList.contains('cdp-enhanced')) {
            // Custom-Datepicker: Finde den cdp-input-wrap
            const dateWrapper = field.closest('.cdp-input-wrap');
            if (dateWrapper) {
                field.classList.add('error');
                fieldContainer = dateWrapper;
            } else {
                field.classList.add('error');
            }
        } else {
            // Normales Feld
            field.classList.add('error');
        }
        
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
            
            // Erstelle Fehlermeldung
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = message;
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('aria-live', 'polite');
            
            // Finde den richtigen Container für die Fehlermeldung
            if (!fieldContainer) {
                fieldContainer = field.closest('.cdp-input-wrap') || 
                               field.closest('.password-field') || 
                               field.closest('.password-container') ||
                               field.closest('.cs-select') ||
                               field.parentElement;
            }
            
            // Füge Fehlermeldung direkt nach dem Feld-Element ein (nicht am Ende der form-group)
            // So erscheint sie direkt unter dem Feld
            if (fieldContainer && fieldContainer !== formGroup) {
                // Wenn es einen Container gibt (z.B. cs-select, cdp-input-wrap), füge nach diesem ein
                fieldContainer.insertAdjacentElement('afterend', errorDiv);
            } else {
                // Sonst füge direkt nach dem Feld ein
                field.insertAdjacentElement('afterend', errorDiv);
            }
            
            // Scroll zu Fehler, wenn außerhalb des Viewports
            setTimeout(() => {
                const rect = errorDiv.getBoundingClientRect();
                if (rect.bottom > window.innerHeight || rect.top < 0) {
                    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }

    // Fehlermeldung entfernen
    function removeFieldError(field) {
        field.classList.remove('error');
        
        // Für Custom-Selects: Entferne auch Error-Klasse vom Trigger
        if (field.tagName === 'SELECT' && field.style.display === 'none') {
            const customSelect = field.closest('.cs-select');
            if (customSelect) {
                const trigger = customSelect.querySelector('.cs-trigger');
                if (trigger) {
                    trigger.classList.remove('error');
                }
            }
        }
        
        // Für Datepicker: Error-Klasse bleibt am Input-Feld (ist sichtbar)
        
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
            const existingError = formGroup.querySelector('.form-error');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    // Validiere ein einzelnes Feld
    function validateField(field) {
        // Entferne vorherige Fehler
        removeFieldError(field);
        
        // Prüfe ob Feld leer ist (wenn required)
        // Für Select-Felder: value === '' oder value === null
        // Für Input-Felder: value.trim() === ''
        let isEmpty = false;
        if (field.tagName === 'SELECT') {
            isEmpty = !field.value || field.value === '';
        } else if (field.type === 'date') {
            isEmpty = !field.value || field.value === '';
        } else {
            isEmpty = !field.value || field.value.trim() === '';
        }
        
        if (field.hasAttribute('required') && isEmpty) {
            const label = field.closest('.form-group')?.querySelector('label');
            const fieldName = label ? label.textContent.trim().replace(':', '') : 'Dieses Feld';
            showFieldError(field, `${fieldName} ist erforderlich.`);
            return false;
        }
        
        // E-Mail-Validierung
        if (field.type === 'email' && field.value && !field.validity.valid) {
            showFieldError(field, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            return false;
        }
        
        // URL-Validierung
        if (field.type === 'url' && field.value && !field.validity.valid) {
            showFieldError(field, 'Bitte geben Sie eine gültige URL ein.');
            return false;
        }
        
        // Zahl-Validierung
        if (field.type === 'number') {
            if (field.hasAttribute('min') && field.value && parseFloat(field.value) < parseFloat(field.min)) {
                showFieldError(field, `Der Wert muss mindestens ${field.min} sein.`);
                return false;
            }
            if (field.hasAttribute('max') && field.value && parseFloat(field.value) > parseFloat(field.max)) {
                showFieldError(field, `Der Wert darf höchstens ${field.max} sein.`);
                return false;
            }
        }
        
        // Pattern-Validierung
        if (field.hasAttribute('pattern') && field.value && !field.validity.valid) {
            const patternTitle = field.getAttribute('title') || 'Das Format ist ungültig.';
            showFieldError(field, patternTitle);
            return false;
        }
        
        // Datum-Validierung
        if (field.type === 'date' && field.value) {
            const date = new Date(field.value);
            if (isNaN(date.getTime())) {
                showFieldError(field, 'Bitte geben Sie ein gültiges Datum ein.');
                return false;
            }
        }
        
        return true;
    }

    // Validiere gesamtes Formular
    function validateForm(form) {
        let isValid = true;
        // Suche nach allen required Feldern (auch in Custom-Selects)
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        fields.forEach(field => {
            // Für Custom-Selects: Validiere das native select-Element
            if (field.tagName === 'SELECT' && field.style.display === 'none') {
                // Custom-Select: Das native select ist versteckt, aber wir validieren es trotzdem
                if (!validateField(field)) {
                    isValid = false;
                }
            } else {
                // Normales Feld
                if (!validateField(field)) {
                    isValid = false;
                }
            }
        });
        
        // Validiere "Schüler zuordnen" Felder (Vue.js spezifisch)
        // Diese haben kein required Attribut, aber müssen userIds haben
        // AUSNAHME: Wenn das Label "(optional)" enthält, ist die Validierung nicht erforderlich
        const studentAssignmentGroups = form.querySelectorAll('.form-group');
        studentAssignmentGroups.forEach(formGroup => {
            const label = formGroup.querySelector('label');
            if (label && label.textContent.trim().includes('Schüler zuordnen')) {
                // Prüfe ob das Feld als optional markiert ist
                const isOptional = label.textContent.toLowerCase().includes('optional');
                if (isOptional) {
                    // Optional - keine Validierung erforderlich
                    return;
                }
                
                // Finde das zugehörige Input-Feld
                const input = formGroup.querySelector('input[type="text"]');
                if (input) {
                    // Prüfe ob ausgewählte Schüler vorhanden sind
                    // Suche nach div mit ausgewählten Schülern (Buttons mit btn-secondary und btn-danger)
                    const selectedStudentsContainer = Array.from(formGroup.querySelectorAll('div')).find(div => {
                        const hasButtons = div.querySelector('.btn-secondary') && div.querySelector('.btn-danger');
                        const hasFlex = div.style.display === 'flex' || div.style.display.includes('flex');
                        return hasButtons && (hasFlex || div.style.display === '');
                    });
                    
                    // Alternative: Prüfe nach "Ausgewählt:" Text
                    const hasSelectedText = Array.from(formGroup.querySelectorAll('div')).some(div => 
                        div.textContent.includes('Ausgewählt:') && div.textContent.trim() !== 'Ausgewählt:'
                    );
                    
                    // Wenn keine ausgewählten Schüler gefunden wurden
                    if (!selectedStudentsContainer && !hasSelectedText) {
                        // Prüfe ob bereits ein Fehler angezeigt wird
                        const existingError = formGroup.querySelector('.form-error');
                        if (!existingError) {
                            showFieldError(input, 'Bitte wählen Sie mindestens einen Schüler aus.');
                            isValid = false;
                        } else if (!input.classList.contains('error')) {
                            // Fehler existiert, aber Input hat keine Error-Klasse
                            input.classList.add('error');
                            isValid = false;
                        }
                    } else {
                        // Schüler wurden ausgewählt - entferne Fehler falls vorhanden
                        if (input.classList.contains('error')) {
                            removeFieldError(input);
                        }
                    }
                }
            }
        });
        
        return isValid;
    }

    // Event-Listener für alle Formulare
    function setupFormValidation() {
        // Deaktiviere native Browser-Validierung für alle Formulare
        function disableNativeValidation() {
            document.querySelectorAll('form').forEach(form => {
                if (!form.hasAttribute('novalidate')) {
                    form.setAttribute('novalidate', 'novalidate');
                }
            });
        }
        
        // Initial deaktivieren
        disableNativeValidation();
        
        // Beobachte neue Formulare
        const formObserver = new MutationObserver(() => {
            disableNativeValidation();
        });
        formObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Entferne Fehler bei Input/Change (während Eingabe/Auswahl) - nur wenn bereits ein Fehler angezeigt wurde
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                if (e.target.classList.contains('error')) {
                    // Prüfe ob Feld jetzt gültig ist
                    if (validateField(e.target)) {
                        removeFieldError(e.target);
                    }
                }
            }
        }, true);
        
        // Auch bei Change-Event für Select-Felder und Date-Felder
        document.addEventListener('change', (e) => {
            if (e.target.matches('input, select, textarea')) {
                // Für Custom-Selects: Prüfe auch den Trigger
                if (e.target.tagName === 'SELECT' && e.target.style.display === 'none') {
                    const customSelect = e.target.closest('.cs-select');
                    if (customSelect) {
                        const trigger = customSelect.querySelector('.cs-trigger');
                        if (trigger && trigger.classList.contains('error')) {
                            if (validateField(e.target)) {
                                removeFieldError(e.target);
                            }
                        }
                    }
                } else if (e.target.classList.contains('error')) {
                    // Prüfe ob Feld jetzt gültig ist
                    if (validateField(e.target)) {
                        removeFieldError(e.target);
                    }
                }
            }
        }, true);
        
        // Für Custom-Selects: Höre auf Clicks auf Optionen
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cs-option')) {
                const customSelect = e.target.closest('.cs-select');
                if (customSelect) {
                    const nativeSelect = customSelect.querySelector('select');
                    if (nativeSelect) {
                        // Prüfe ob Error-Klasse am Trigger oder Select vorhanden ist
                        const trigger = customSelect.querySelector('.cs-trigger');
                        if ((trigger && trigger.classList.contains('error')) || nativeSelect.classList.contains('error')) {
                            // Warte kurz, damit der Wert gesetzt wird
                            setTimeout(() => {
                                if (validateField(nativeSelect)) {
                                    removeFieldError(nativeSelect);
                                }
                            }, 10);
                        }
                    }
                }
            }
            
            // Für Datepicker: Höre auf Clicks auf Datums-Zellen
            if (e.target.classList.contains('cdp-cell') && !e.target.classList.contains('other')) {
                const datePicker = e.target.closest('.cdp-root');
                if (datePicker) {
                    // Finde das zugehörige Input-Feld
                    const allDateInputs = document.querySelectorAll('input[type="date"].form-control, input.cdp-enhanced');
                    allDateInputs.forEach(input => {
                        if (input.classList.contains('error')) {
                            // Warte kurz, damit der Wert gesetzt wird
                            setTimeout(() => {
                                if (validateField(input)) {
                                    removeFieldError(input);
                                }
                            }, 10);
                        }
                    });
                }
            }
            
            // Für "Schüler zuordnen": Wenn ein Schüler ausgewählt wird, entferne Fehler
            if (e.target.closest('.form-group')) {
                const formGroup = e.target.closest('.form-group');
                const label = formGroup.querySelector('label');
                if (label && label.textContent.trim().includes('Schüler zuordnen')) {
                    const input = formGroup.querySelector('input[type="text"]');
                    if (input && input.classList.contains('error')) {
                        // Prüfe nach kurzer Verzögerung, ob Schüler ausgewählt wurden
                        setTimeout(() => {
                            const selectedContainer = Array.from(formGroup.querySelectorAll('div')).find(div => {
                                const hasButtons = div.querySelector('.btn-secondary') && div.querySelector('.btn-danger');
                                return hasButtons;
                            });
                            const hasSelectedText = Array.from(formGroup.querySelectorAll('div')).some(div => 
                                div.textContent.includes('Ausgewählt:') && div.textContent.trim() !== 'Ausgewählt:'
                            );
                            
                            if (selectedContainer || hasSelectedText) {
                                removeFieldError(input);
                            }
                        }, 50);
                    }
                }
            }
        }, true);
        
        // Validiere NUR bei Submit (nicht bei Blur)
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                // Deaktiviere native Browser-Validierung
                form.setAttribute('novalidate', 'novalidate');
                
                // Entferne alle vorherigen Fehler
                form.querySelectorAll('.form-error').forEach(err => err.remove());
                form.querySelectorAll('.form-control.error').forEach(field => {
                    field.classList.remove('error');
                    const formGroup = field.closest('.form-group');
                    if (formGroup) formGroup.classList.remove('has-error');
                });
                
                // Validiere alle Felder
                if (!validateForm(form)) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Fokussiere erstes Feld mit Fehler
                    const firstError = form.querySelector('.form-control.error');
                    if (firstError) {
                        setTimeout(() => firstError.focus(), 100);
                    }
                }
            }
        }, true);
    }

    // Initialisiere wenn DOM bereit ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFormValidation);
    } else {
        setupFormValidation();
    }
    
    // Beobachte DOM-Änderungen für dynamisch hinzugefügte Formulare (Vue.js)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // Prüfe ob neue Formulare hinzugefügt wurden
                    if (node.tagName === 'FORM' || node.querySelector('form')) {
                        // Formulare werden automatisch durch Event-Delegation abgedeckt
                    }
                }
            });
        });
    });
    
    function startObserver(){const target=document.body;if(!target)return;observer.observe(target,{childList:true,subtree:true});}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',startObserver);}else{startObserver();}

    // Exportiere Funktionen für manuelle Nutzung
    window.formValidation = {
        showError: showFieldError,
        removeError: removeFieldError,
        validateField: validateField,
        validateForm: validateForm
    };
})();

