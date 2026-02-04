<template>
  <aside class="sidebar" :class="{ open: !open }" :aria-expanded="String(open)">
    <div class="brand">
      <div class="brand-mark"><i class="fas fa-user-md" aria-hidden="true" /></div>
      <div class="brand-text">
        <h1>AI Doctors</h1>
        <span>AI Health Suite</span>
      </div>
    </div>

    <nav class="nav" aria-label="Primary">
      <p class="nav-label">General</p>

      <button
        type="button"
        class="nav-btn"
        :class="{ active: currentView === 'home' }"
        :aria-current="currentView === 'home' ? 'page' : undefined"
        @click="emit('navigate', 'home')"
      >
        <i class="fas fa-home" aria-hidden="true"></i>
        <span>Dashboard</span>
      </button>

      <button
        type="button"
        class="nav-btn"
        :class="{ active: currentView === 'doctors' }"
        :aria-current="currentView === 'doctors' ? 'page' : undefined"
        @click="emit('navigate', 'doctors')"
      >
        <i class="fas fa-user-nurse" aria-hidden="true"></i>
        <span>Voice Agents</span>
        <span class="chip" :aria-label="`${countDoctors} doctors available`">{{ countDoctors }}</span>
      </button>

      <!-- Chatbots -->
      <button
        type="button"
        class="nav-btn"
        :class="{ active: currentView === 'chatbots' }"
        :aria-current="currentView === 'chatbots' ? 'page' : undefined"
        @click="emit('navigate', 'chatbots')"
      >
        <i class="fas fa-robot" aria-hidden="true"></i>
        <span>Chatbots</span>
      </button>

      <!-- NEW: X-rays & MRI -->
      <!-- <button
        type="button"
        class="nav-btn"
        :class="{ active: currentView === 'xrays' }"
        :aria-current="currentView === 'xrays' ? 'page' : undefined"
        @click="emit('navigate', 'xrays')"
      >
        <i class="fas fa-file-medical" aria-hidden="true"></i>
        <span>X-rays & MRI</span>
        <span
          v-if="typeof countRadiology === 'number'"
          class="chip"
          :aria-label="`${countRadiology} tools available`"
        >{{ countRadiology }}</span>
      </button> -->

      <p class="nav-label">Shortcuts</p>
      <button type="button" class="nav-btn" @click="navigateToConsultant()">
        <i class="fas fa-stethoscope" aria-hidden="true"></i>
        <span>Start Consultation</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="foot-card">
        <i class="fas fa-bolt" aria-hidden="true"></i>
        <div>
          <strong>Quick Access</strong>
          <p>Jump to AI physicians</p>
        </div>
        <button type="button" class="foot-cta" @click="emit('navigate', 'doctors')">Open</button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, watch, onMounted } from 'vue'
const emit = defineEmits<{
  (e:'navigate', v:'home'|'doctors'|'chatbots'|'xrays'): void
}>()

const navigateToConsultant = () => {
    window.location.href = "https://demo.evomations.com/doctor_listing_page/";
};

const props = defineProps<{
  currentView?: 'home' | 'doctors' | 'chatbots' | 'xrays'
  open?: boolean
  countDoctors?: number
  /** optional chip for the new X-rays & MRI item */
  countRadiology?: number
}>()
onMounted(() => {
 console.log("hiiii", props.open);
});
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* Sidebar uses global theme tokens defined in App.vue:
   --panel, --panel-solid, --ring, --text, --muted, --brand, --brand-2,
   --ghost-bg, --ghost-bg-hover, --shadow-1, --shadow-2
*/

.sidebar {
  backdrop-filter: blur(6px);
  background: var(--panel);
  border-right: 1px solid var(--ring);
  padding: 24px 20px;
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
}
.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #fff;
  box-shadow: var(--shadow-1);
}
.brand-text h1 {
  font-size: 1.05rem;
  margin: 0;
  color: var(--text);
}
.brand-text span {
  font-size: .8rem;
  color: var(--muted);
}

.nav {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding: 16px;
}
.nav-label {
  color: var(--muted);
  font-size: .75rem;
  letter-spacing: .04em;
  margin: 40px 8px 8px;
  text-transform: uppercase;
  flex-grow: 1;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  color: var(--text);
  cursor: pointer;
}
.nav-btn .chip {
  margin-left: auto;
  /* brand-tinted chip that works in both themes */
  background: color-mix(in srgb, var(--brand) 18%, transparent);
  color: var(--brand);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: .72rem;
  font-weight: 700;
}

.nav-btn:hover {
  background: var(--ghost-bg);
  border-color: var(--ring);
}

/* Active state: subtle brand tint that still reads in dark mode */
.nav-btn.active {
  background: color-mix(in srgb, var(--brand) 12%, transparent);
  border-color: color-mix(in srgb, var(--brand) 36%, transparent);
  color: var(--brand);
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px;
}

.foot-card {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--ring);
  background: var(--panel-solid);
  border-radius: 12px;
  box-shadow: var(--shadow-1);
}
html.dark .foot-card strong {
  color: #06b6d4; /* aqua shade */
}
.foot-card i {
  color: #F59E0B;
  font-size: 1.1rem;
}
.foot-card p {
  margin: 0;
  color: var(--muted);
  font-size: .85rem;
}
.foot-cta {
  background: #111827; /* default (light theme) */
  color: #fff;
  border: 0;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

/* DARK THEME OVERRIDE */
html.dark .foot-cta {
  background: #06b6d4; /* aqua shade */
  color: #fff;
}

.foot-cta:hover {
  filter: brightness(1.05);
}
.nav-btn.coming-soon {
  position: relative;
  cursor: not-allowed;
  opacity: 0.85;
}

/* The small bubble */
.nav-btn.coming-soon::after {
  content: attr(data-badge);
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 10px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 999px;
  background: #111;      /* adjust to your theme */
  color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  pointer-events: none;   /* bubble itself isn’t interactive */
}
.open {
  display: none;
}
</style>
