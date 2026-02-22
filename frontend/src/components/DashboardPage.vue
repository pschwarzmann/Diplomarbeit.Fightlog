<template>
    <div class="dashboard">
        <div class="container">
            <div class="dashboard-header">
                <h1>Willkommen bei <span class="brand-logo">FightLog</span></h1>
                <p>{{ t('subtitle') }}</p>
            </div>
            
            <div class="nav-grid">
                <nav-card
                    icon="fa-user"
                    title="Profil"
                    description="Profil bearbeiten & Passwort ändern"
                    @click="$emit('navigate', 'profile')"
                />
                
                <nav-card
                    icon="fa-certificate"
                    :title="t('certificates')"
                    description="Urkunden verwalten"
                    @click="$emit('navigate', 'certificates')"
                />
                
                <nav-card
                    icon="fa-clipboard-check"
                    :title="t('exams')"
                    description="Prüfungsergebnisse &amp; Bewertungen"
                    @click="$emit('navigate', 'exams')"
                />
                
                <nav-card
                    v-if="currentUser"
                    icon="fa-bullseye"
                    :title="t('goals')"
                    description="Protokoll und Ziele verwalten"
                    @click="$emit('navigate', 'goals')"
                />

                <nav-card
                    icon="fa-list-check"
                    :title="t('courses')"
                    description="Kurse verwalten/sehen"
                    @click="$emit('navigate', 'courses')"
                />

                <nav-card
                    v-if="currentUser && currentUser.role === 'admin'"
                    icon="fa-user-shield"
                    :title="t('adminPanel')"
                    description="Benutzer, Rollen &amp; Rechte verwalten"
                    @click="$emit('navigate', 'admin')"
                />

                <nav-card
                    v-if="currentUser && (currentUser.role === 'admin' || currentUser.role === 'trainer')"
                    icon="fa-sliders"
                    title="Settings"
                    description="Urkunden-Vorlagen &amp; Gruppen"
                    @click="$emit('navigate', 'settings')"
                />
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DashboardPage',
    props: {
        currentUser: Object,
        t: Function
    },
    emits: ['navigate']
}
</script>
