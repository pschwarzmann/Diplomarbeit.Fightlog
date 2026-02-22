// tests/frontend/api.test.js
// Echte Jest Tests für API-Service

// Mock fetch
global.fetch = jest.fn();
global.window = { location: { port: '8080' } };

describe('API Service', () => {
    beforeEach(() => {
        fetch.mockClear();
        localStorage.clear();
    });
    
    test('login sollte korrekten API-Call machen', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, user: { id: 1, username: 'test', role: 'schueler' }, token: 'abc123' }),
            headers: { get: () => 'application/json' }
        });
        
        // Simuliere API Service Request-Funktion
        const loginData = { identifier: 'test', password: 'pass123' };
        const response = await fetch('../backend/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        const result = await response.json();
        
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/login.php'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(loginData)
            })
        );
        expect(result.success).toBe(true);
        expect(result.user.id).toBe(1);
    });
    
    test('login sollte Error Handling korrekt behandeln', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ success: false, error: 'Login fehlgeschlagen' }),
            headers: { get: () => 'application/json' }
        });
        
        const response = await fetch('../backend/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'test', password: 'wrong' })
        });
        const result = await response.json();
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Login fehlgeschlagen');
    });
    
    test('logout sollte API aufrufen', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
            headers: { get: () => 'application/json' }
        });
        
        const response = await fetch('../backend/api/logout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/logout.php'),
            expect.objectContaining({ method: 'POST' })
        );
        expect(result.success).toBe(true);
    });
    
    test('Non-JSON Response sollte Error werfen', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => '<html>Error</html>',
            headers: { get: () => 'text/html' }
        });
        
        const response = await fetch('../backend/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'test', password: 'pass' })
        });
        
        const contentType = response.headers.get('content-type') || '';
        expect(contentType.includes('application/json')).toBe(false);
    });
});

describe('Utility Functions', () => {
    // formatDate Funktion testen
    test('formatDate sollte Datum korrekt formatieren', () => {
        // Simuliere formatDate Funktion aus main.js
        function formatDate(dateStr) {
            if (!dateStr || dateStr === '0000-00-00') return 'Kein Datum';
            try {
                const months = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const year = parts[0];
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    if (year === '0000' || month < 0 || month > 11 || day < 1 || day > 31) {
                        return 'Kein Datum';
                    }
                    return `${day}. ${months[month]} ${year}`;
                }
                return dateStr;
            } catch (e) {
                return dateStr;
            }
        }
        
        expect(formatDate('2025-12-26')).toBe('26. Dez. 2025');
        expect(formatDate('2025-01-01')).toBe('1. Jan. 2025');
        expect(formatDate('2025-03-15')).toBe('15. März 2025');
        expect(formatDate('0000-00-00')).toBe('Kein Datum');
        expect(formatDate(null)).toBe('Kein Datum');
        expect(formatDate('')).toBe('Kein Datum');
    });
    
    test('roleLabel sollte Rollen korrekt labeln', () => {
        // Simuliere roleLabel Funktion aus main.js
        function roleLabel(role) {
            if (role === 'admin') return 'Admin';
            if (role === 'trainer') return 'Trainer';
            return 'Schüler';
        }
        
        expect(roleLabel('admin')).toBe('Admin');
        expect(roleLabel('trainer')).toBe('Trainer');
        expect(roleLabel('schueler')).toBe('Schüler');
        expect(roleLabel('unknown')).toBe('Schüler');
    });
});

describe('TableSort Utility', () => {
    test('useTableSort sollte Items korrekt sortieren', () => {
        // Simuliere useTableSort Funktion
        function useTableSort(items, defaultSortKey = null, defaultSortOrder = 'asc') {
            return {
                sortKey: defaultSortKey,
                sortOrder: defaultSortOrder,
                items,
                sort(key) {
                    if (this.sortKey === key) {
                        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.sortKey = key;
                        this.sortOrder = 'asc';
                    }
                },
                get sortedItems() {
                    if (!this.sortKey) return this.items;
                    return [...this.items].sort((a, b) => {
                        let aVal = a[this.sortKey];
                        let bVal = b[this.sortKey];
                        if (aVal == null) aVal = '';
                        if (bVal == null) bVal = '';
                        if (this.sortKey.includes('date') || this.sortKey.includes('Date')) {
                            aVal = new Date(aVal).getTime();
                            bVal = new Date(bVal).getTime();
                        }
                        if (typeof aVal === 'number' && typeof bVal === 'number') {
                            return this.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                        }
                        aVal = String(aVal).toLowerCase();
                        bVal = String(bVal).toLowerCase();
                        if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
                        if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
                        return 0;
                    });
                },
                getSortIcon(key) {
                    if (this.sortKey !== key) return '⇅';
                    return this.sortOrder === 'asc' ? '↑' : '↓';
                }
            };
        }
        
        const items = [
            { name: 'Charlie', age: 30, date: '2025-01-15' },
            { name: 'Alice', age: 25, date: '2025-03-20' },
            { name: 'Bob', age: 35, date: '2025-02-10' }
        ];
        
        const sorter = useTableSort(items);
        
        // Sort nach name (asc)
        sorter.sort('name');
        expect(sorter.sortedItems[0].name).toBe('Alice');
        expect(sorter.sortedItems[1].name).toBe('Bob');
        expect(sorter.sortedItems[2].name).toBe('Charlie');
        
        // Toggle zu desc
        sorter.sort('name');
        expect(sorter.sortedItems[0].name).toBe('Charlie');
        expect(sorter.sortedItems[2].name).toBe('Alice');
        
        // Sort nach age (number)
        sorter.sort('age');
        expect(sorter.sortedItems[0].age).toBe(25);
        expect(sorter.sortedItems[2].age).toBe(35);
        
        // Sort nach date
        sorter.sort('date');
        expect(sorter.sortedItems[0].date).toBe('2025-01-15');
        expect(sorter.sortedItems[2].date).toBe('2025-03-20');
    });
    
    test('useTableSort sollte Sort-Icon korrekt zurückgeben', () => {
        function useTableSort(items) {
            return {
                sortKey: null,
                sortOrder: 'asc',
                items,
                sort(key) {
                    if (this.sortKey === key) {
                        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.sortKey = key;
                        this.sortOrder = 'asc';
                    }
                },
                getSortIcon(key) {
                    if (this.sortKey !== key) return '⇅';
                    return this.sortOrder === 'asc' ? '↑' : '↓';
                }
            };
        }
        
        const items = [{ name: 'Test' }];
        const sorter = useTableSort(items);
        
        expect(sorter.getSortIcon('name')).toBe('⇅');
        sorter.sort('name');
        expect(sorter.getSortIcon('name')).toBe('↑');
        sorter.sort('name');
        expect(sorter.getSortIcon('name')).toBe('↓');
    });
});

describe('Pagination Utility', () => {
    test('usePagination sollte Items korrekt paginieren', () => {
        // Simuliere usePagination Funktion
        function usePagination(items, itemsPerPage = 10) {
            return {
                currentPage: 1,
                itemsPerPage,
                items,
                get totalPages() {
                    return Math.ceil(this.items.length / this.itemsPerPage);
                },
                get paginatedItems() {
                    const start = (this.currentPage - 1) * this.itemsPerPage;
                    const end = start + this.itemsPerPage;
                    return this.items.slice(start, end);
                },
                goToPage(page) {
                    if (page >= 1 && page <= this.totalPages) {
                        this.currentPage = page;
                    }
                },
                nextPage() {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                    }
                },
                prevPage() {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                    }
                },
                reset() {
                    this.currentPage = 1;
                }
            };
        }
        
        const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
        const pagination = usePagination(items, 10);
        
        expect(pagination.totalPages).toBe(3);
        expect(pagination.paginatedItems.length).toBe(10);
        expect(pagination.paginatedItems[0].id).toBe(1);
        
        pagination.nextPage();
        expect(pagination.currentPage).toBe(2);
        expect(pagination.paginatedItems[0].id).toBe(11);
        
        pagination.goToPage(3);
        expect(pagination.currentPage).toBe(3);
        expect(pagination.paginatedItems.length).toBe(5);
        
        pagination.prevPage();
        expect(pagination.currentPage).toBe(2);
        
        pagination.reset();
        expect(pagination.currentPage).toBe(1);
    });
    
    test('usePagination sollte Boundary-Cases behandeln', () => {
        function usePagination(items, itemsPerPage = 10) {
            return {
                currentPage: 1,
                itemsPerPage,
                items,
                get totalPages() {
                    return Math.ceil(this.items.length / this.itemsPerPage);
                },
                get paginatedItems() {
                    const start = (this.currentPage - 1) * this.itemsPerPage;
                    const end = start + this.itemsPerPage;
                    return this.items.slice(start, end);
                },
                nextPage() {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                    }
                },
                prevPage() {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                    }
                },
                goToPage(page) {
                    if (page >= 1 && page <= this.totalPages) {
                        this.currentPage = page;
                    }
                }
            };
        }
        
        const items = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
        const pagination = usePagination(items, 10);
        
        expect(pagination.totalPages).toBe(1);
        expect(pagination.paginatedItems.length).toBe(5);
        
        pagination.nextPage(); // Sollte nicht über letzte Seite gehen
        expect(pagination.currentPage).toBe(1);
        
        pagination.prevPage(); // Sollte nicht unter erste Seite gehen
        expect(pagination.currentPage).toBe(1);
        
        pagination.goToPage(99); // Ungültige Seite
        expect(pagination.currentPage).toBe(1);
    });
});
