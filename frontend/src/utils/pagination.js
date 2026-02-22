// frontend/src/utils/pagination.js
// Pagination Utility für Listen

export function usePagination(items, itemsPerPage = 10) {
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
