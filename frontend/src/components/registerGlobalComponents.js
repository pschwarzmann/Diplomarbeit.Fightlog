// src/components/registerGlobalComponents.js

export function registerGlobalComponents(app) {
    app.component('nav-card', {
        props: {
            icon: { type: String, required: true },
            title: { type: String, required: true },
            description: { type: String, required: true }
        },
        emits: ['click'],
        computed: {
            iconClass() {
                return this.icon.includes('fa-') ? `fas ${this.icon}` : this.icon;
            }
        },
        template: `
            <div class="nav-card" @click="$emit('click')">
                <i :class="iconClass"></i>
                <h3>{{ title }}</h3>
                <p>{{ description }}</p>
            </div>
        `
    });
    
    app.component('SkeletonLoader', {
        props: {
            lines: {
                type: Number,
                default: 3
            },
            type: {
                type: String,
                default: 'default',
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
        },
        template: `
            <div class="skeleton-loader" :class="type">
                <div v-for="i in lines" :key="i" class="skeleton-line" :style="getLineStyle(i)"></div>
            </div>
        `
    });
}


