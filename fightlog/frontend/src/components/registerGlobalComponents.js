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
}


