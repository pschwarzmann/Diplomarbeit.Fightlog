// frontend/src/utils/tableSort.js
// Tabellen-Sortierung Utility

export function useTableSort(items, defaultSortKey = null, defaultSortOrder = 'asc') {
    return {
        sortKey: defaultSortKey,
        sortOrder: defaultSortOrder,
        items,
        
        sort(key) {
            if (this.sortKey === key) {
                // Toggle order
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
                
                // Handle null/undefined
                if (aVal == null) aVal = '';
                if (bVal == null) bVal = '';
                
                // Handle dates
                if (this.sortKey.includes('date') || this.sortKey.includes('Date')) {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                }
                
                // Handle numbers
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return this.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                }
                
                // Handle strings
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
