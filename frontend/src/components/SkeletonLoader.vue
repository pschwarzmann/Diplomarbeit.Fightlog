<template>
    <div class="skeleton-loader" :class="type">
        <div v-for="i in lines" :key="i" class="skeleton-line" :style="getLineStyle(i)"></div>
    </div>
</template>

<script>
export default {
    name: 'SkeletonLoader',
    props: {
        lines: {
            type: Number,
            default: 3
        },
        type: {
            type: String,
            default: 'default', // 'default', 'card', 'list', 'table'
            validator: (value) => ['default', 'card', 'list', 'table'].includes(value)
        }
    },
    methods: {
        getLineStyle(index) {
            const styles = {
                default: { width: index === this.lines ? '60%' : '100%', height: '16px' },
                card: { width: index === 1 ? '80%' : index === this.lines ? '40%' : '100%', height: '20px' },
                list: { width: index === this.lines ? '70%' : '100%', height: '18px' },
                table: { width: index === 1 ? '30%' : index === 2 ? '50%' : '40%', height: '16px' }
            };
            return styles[this.type] || styles.default;
        }
    }
};
</script>

<style scoped>
.skeleton-loader {
    padding: 1rem;
}

.skeleton-line {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 4px;
    margin-bottom: 0.75rem;
}

.dark-mode .skeleton-line {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
    background-size: 200% 100%;
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.skeleton-loader.card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.dark-mode .skeleton-loader.card {
    background: rgba(30, 30, 30, 0.95);
}

.skeleton-loader.list .skeleton-line {
    margin-bottom: 0.5rem;
}

.skeleton-loader.table {
    display: table-row;
}

.skeleton-loader.table .skeleton-line {
    display: table-cell;
    padding: 0.5rem;
    margin-bottom: 0;
}
</style>
