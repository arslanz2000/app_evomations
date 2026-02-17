<template>
  <!-- <div class="app-shell"> -->
    <div class="app-shell" :class="{ 'sidebar-closed': !sidebarOpen }">

    <!-- Sidebar (hide on signup/login) -->
    <Sidebar
      v-if="currentView !== 'signup' && currentView !== 'login'"
      :current-view="currentView"
      :open="sidebarOpen"
      :count-doctors="countDoctors"
      @navigate="setView"
      @toggleSidebar="sidebarOpen = !sidebarOpen"
    />


    <!-- Main -->
    <div class="main">
      <!-- Topbar (hide on signup/login) -->
      <Topbar
        v-if="currentView !== 'signup' && currentView !== 'login'"
        :page-title="pageTitle"
        :sidebar-open="sidebarOpen"
        :theme="theme"
        @toggleSidebar="sidebarOpen = !sidebarOpen"
        @toggleTheme="theme = theme === 'light' ? 'dark' : 'light'"
        @navigate="setView"
      />

      <!-- Content -->
      <main class="content">
        <!-- DASHBOARD VIEW -->
        <section v-if="currentView === 'home'" class="home">
          <header class="page-header">
            <div class="title-wrap">
              <span class="eyebrow">Welcome</span>
              <h1>
                Your healthcare, <span class="grad">accelerated</span>
              </h1>
              <p class="subtitle">
                Search, call, and book with board-certified AI physicians across 20 specialties.
              </p>
              <div class="hero-actions">
                <button class="btn primary" @click="setView('doctors')">
                  <i class="fas fa-user-md"></i>
                  Browse AI Physicians
                </button>
                <button class="btn ghost" @click="setView('chatbots')">
                  <i class="fas fa-comments"></i>
                  Browse AI Chatbots
                </button>
              </div>
            </div>
            <div class="title-art">
              <div class="orbit">
                <i class="fas fa-headset"></i>
              </div>
            </div>
          </header>

          <section class="stats">
            <article class="stat">
              <div class="icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="meta">
                <strong>20</strong>
                <span>Available Doctors</span>
              </div>
            </article>

            <article class="stat">
              <div class="icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="meta">
                <strong>99.2%</strong>
                <span>Uptime</span>
              </div>
            </article>

            <article class="stat">
              <div class="icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="meta">
                <strong>~12s</strong>
                <span>Avg Connect Time</span>
              </div>
            </article>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h3>Get started</h3>
              <span class="badge">Quick tips</span>
            </div>
            <ul class="steps">
              <li><i class="fas fa-search"></i> Use the search to find a specialty</li>
              <li><i class="fas fa-phone"></i> Click <em>Call</em> to start a voice session</li>
              <li><i class="fas fa-calendar"></i> Or book a <em>Consultation</em> slot</li>
            </ul>
          </section>
        </section>

        <!-- DOCTORS VIEW -->
        <section v-else-if="currentView === 'doctors'" class="doctors">
          <Suspense>
            <template #default>
              <VapiAssistant />
            </template>
            <template #fallback>
              <div class="loading-card">
                <div class="spinner"></div>
                Loading doctors…
              </div>
            </template>
          </Suspense>
        </section>

        <!-- CHATBOTS VIEW -->
        <section v-else-if="currentView === 'chatbots'" class="doctors">
          <Suspense>
            <template #default>
              <VapiChatBot @navigate="setView" />
            </template>
            <template #fallback>
              <div class="loading-card">
                <div class="spinner"></div>
                Loading chatbots…
              </div>
            </template>
          </Suspense>
        </section>

        <!-- XRAYS VIEW -->
        <section v-else-if="currentView === 'xrays'" class="doctors">
          <Suspense>
            <template #default>
              <XrayMriChat />
            </template>
            <template #fallback>
              <div class="loading-card">
                <div class="spinner"></div>
                Loading X-ray/MRI Assistant…
              </div>
            </template>
          </Suspense>
        </section>

        <!-- SIGNUP VIEW -->
        <section v-else-if="currentView === 'signup'" class="auth">
          <SignupForm @navigate="setView" />
        </section>

        <!-- LOGIN VIEW -->
        <section v-else-if="currentView === 'login'" class="auth">
          <LoginForm @navigate="setView" />
        </section>
      </main>

      <!-- Footer (hide on signup/login) -->
      <FooterBar
        v-if="currentView !== 'signup' && currentView !== 'login'"
        appName="AI Doctors"
        company="Arslan"
        version="v1.0.0"
        status="operational"
        :links="[
          { label: 'Docs', href: '#', icon: 'fa-book' },
          { label: 'Status', href: '#', icon: 'fa-signal' },
          { label: 'Support', href: '#', icon: 'fa-life-ring' },
          { label: 'Privacy', href: '#', icon: 'fa-shield-alt' },
          { label: 'Terms', href: '#', icon: 'fa-file-contract' }
        ]"
      />

      <!-- FAB (hide on signup/login) -->
      <button
        v-if="currentView !== 'signup' && currentView !== 'login'"
        class="fab"
        @click="setView('doctors')"
        aria-label="Open Doctors"
      >
        <i class="fas fa-user-md"></i>
      </button>
    </div>

    <!-- Mobile Overlay (only visible when sidebar is open on mobile) -->
    <div
      v-if="sidebarOpen"
      class="mobile-sidebar-overlay"
      @click="sidebarOpen = false"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, watch, onMounted } from 'vue'
import Sidebar from './components/SideBar.vue'
import Topbar from './components/Topbar.vue'
import FooterBar from './components/FooterBar.vue'
import SignupForm from './components/SignupForm.vue'
import LoginForm from './components/LoginForm.vue'


// Async views/components
const VapiAssistant = defineAsyncComponent(() => import('./components/VapiAssistant.vue')) // voice cards
const VapiChatBot  = defineAsyncComponent(() => import('./components/VapiChatBot.vue'))    // chatbots grid + chat
const XrayMriChat   = defineAsyncComponent(() => import('./components/XrayMriChat.vue')) // 👈 NEW

// Nav + view state
const sidebarOpen = ref(true)
const currentView = ref(localStorage.getItem("currentView") || "signup"); 
// const currentView = ref('home')         // 'home' | 'doctors' | 'chatbots'

// Navigate helper
function setView(view) {
  currentView.value = view;
  localStorage.setItem("currentView", view);

  // ✅ Auto-close sidebar on mobile after navigation
  if (window.innerWidth <= 720) {
    sidebarOpen.value = false;
  }
}

const countDoctors  = 20
const pageTitle = computed(() => {
  switch (currentView.value) {
    case 'doctors':  return 'AI Physicians'
    case 'chatbots': return 'AI Chatbots'
    case 'xrays':    return 'Radiology Assistant'
    default:         return 'Dashboard'
  }
})

const theme = ref('light')

onMounted(() => {
  const params = window.location.href;
  const googleToken = params.match(/[\?&]token=([^&]+)/);
  console.log("hiihi",googleToken);

  if (googleToken) {
    localStorage.setItem("authToken", googleToken);
    localStorage.setItem("currentView", "doctors");

    window.history.replaceState({}, "", "/");

    currentView.value = "doctors";
    return;
  }

  const token = localStorage.getItem("authToken");

  if (window.location.pathname.includes("auth/google")) {
    return;
  }

  if (token) {
    currentView.value = "doctors";
  }

  // ✅ Surgically initialize sidebar state for mobile
  if (window.innerWidth <= 720) {
    sidebarOpen.value = false;
  }
});

watch(theme, (val) => {
  document.documentElement.classList.toggle('dark', val === 'dark')
  localStorage.setItem('theme', val)
})
</script>

<style>
:root {
  --bg: linear-gradient(180deg, #f7f9ff 0%, #f9fbff 35%, #f6f8fb 100%);
  --panel: rgba(255,255,255,0.7);
  --panel-solid: #ffffff;
  --glass: saturate(160%) blur(12px);
  --border: #e7ecf3;
  --text: #0f172a;
  --muted: #64748b;

  --brand: #2563eb;
  --brand-2: #1a73e8;
  --accent: #14b8a6;

  --shadow-1: 0 10px 30px rgba(2, 12, 27, .06);
  --shadow-2: 0 22px 50px rgba(2, 12, 27, .10);
  --ring: #d7dde7;

  --ghost-bg: #f8fafc;
  --ghost-bg-hover: #eef2f7;
}

html, body, #app {
  font-family: Arial, Helvetica, "Segoe UI", sans-serif;
  color: var(--text);
}

* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

button, input, select, textarea { font: inherit; }

html.dark {
  --bg: linear-gradient(180deg, #0b1220 0%, #0b1324 100%);
  --panel: rgba(17,24,39,0.45);
  --panel-solid: #0b1324;
  --glass: saturate(140%) blur(10px);
  --border: #283549;
  --text: #e5edf9;
  --muted: #97a6bb;

  --brand: #3b82f6;
  --brand-2: #2563eb;
  --accent: #22d3ee;

  --ring: #2a3b54;
  --ghost-bg: #0f172a;
  --ghost-bg-hover: #111827;

  --shadow-1: 0 10px 28px rgba(0,0,0,.35);
  --shadow-2: 0 22px 60px rgba(0,0,0,.45);
}

/* Focus visibility */
:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
  border-radius: 10px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
</style>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { height: 100%; overflow-x: hidden; }

/* Shell */
.app-shell {
  display: grid;
  grid-template-columns: 300px 1fr;
  min-height: 100vh;
  background: var(--bg);
  position: relative;
  transition: grid-template-columns 0.3s ease;
  min-width: 0; /* Prevent grid blowout */
}

/* Main */
.main { 
  display: grid; 
  grid-template-rows: auto 1fr auto;
  min-width: 0; /* Important: prevents grid overflow */
}

/* Content container */
.content {
  padding: 28px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  gap: 22px;
  min-width: 0; /* Prevent content overflow */
}

/* ---------- Header / Hero ---------- */
.page-header {
  display: grid;
  grid-template-columns: 1.1fr .9fr;
  gap: 22px;
  padding: 24px;
  border: 1px solid var(--ring);
  background: var(--panel);
  -webkit-backdrop-filter: var(--glass);
  backdrop-filter: var(--glass);
  border-radius: 18px;
  box-shadow: var(--shadow-1);
  width: 100%;
}

.title-wrap .eyebrow {
  display: inline-block;
  font-size: .78rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
  background: rgba(2,12,27,.04);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--ring);
}
.title-wrap h1 {
  margin: 10px 0 6px;
  font-size: 2rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.title-wrap .grad {
  background: linear-gradient(135deg, var(--brand), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.subtitle {
  margin: 0 0 14px;
  color: var(--muted);
  max-width: 58ch;
}

.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 12px; cursor: pointer;
  transition: transform .15s ease, box-shadow .2s ease, filter .2s ease, background .2s ease, color .2s ease;
  white-space: nowrap; border: 1px solid transparent;
}
.btn.primary {
  border: 0;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #fff; box-shadow: var(--shadow-1);
}
.btn.primary:hover { transform: translateY(-1px); box-shadow: var(--shadow-2); filter: brightness(1.04); }
.btn.ghost {
  border: 1px solid var(--ring);
  background: var(--ghost-bg);
  color: var(--text);
}
.btn.ghost:hover { background: var(--ghost-bg-hover); transform: translateY(-1px); }

/* Illustration */
.title-art {
  display: grid; place-items: center;
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--ring);
  background: radial-gradient(120px 120px at 70% 30%, rgba(229,237,255,.75), transparent);
}
html.dark .title-art {
  background: radial-gradient(120px 120px at 70% 30%, rgba(96,165,250,.25), transparent);
}
.orbit {
  display: grid; place-items: center; font-size: 4rem; color: var(--brand);
  width: 100%; height: 100%;
}
.orbit i { animation: float 6s ease-in-out infinite; }
@keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }

/* ---------- Stats ---------- */
.home {
  display: grid;
  gap: 22px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 18px;
}
.stat {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--ring);
  background: var(--panel);
  -webkit-backdrop-filter: var(--glass);
  backdrop-filter: var(--glass);
  border-radius: 16px;
  box-shadow: var(--shadow-1);
  transform: translateY(0);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); border-color: rgba(37, 99, 235, .25); }

.stat .icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, rgba(37,99,235,.12), rgba(20,184,166,.14));
  border: 1px solid var(--ring);
}
.stat .icon i { font-size: 1.1rem; color: var(--brand); }
.stat .meta strong { font-size: 1.25rem; display: block; line-height: 1.2; }
.stat .meta span { font-size: .86rem; color: var(--muted); }

/* ---------- Panel ---------- */
.panel {
  position: relative;
  padding: 28px 32px;
  border-radius: 18px;
  border: 1px solid rgba(37,99,235,0.12);
  background: linear-gradient(145deg, #ffffff 0%, #f9fbff 100%);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
  backdrop-filter: blur(10px) saturate(150%);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

html.dark .panel {
  background: linear-gradient(145deg, rgba(17,24,39,0.9) 0%, rgba(15,23,42,0.9) 100%);
  border: 1px solid rgba(59,130,246,0.25);
  box-shadow: 0 8px 28px rgba(0,0,0,0.35);
}

.panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(37,99,235,0.12);
}

/* Header */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel h3::before {
  content: "✨";
  font-size: 1.1rem;
}

/* Quick tips badge */
.badge {
  font-size: 0.8rem;
  background: var(--brand);
  color: #fff;
  padding: 6px 12px;
  border-radius: 999px;
  box-shadow: 0 3px 8px rgba(37,99,235,0.3);
  border: none;
}

/* Steps list */
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 0.95rem;
  background: rgba(37,99,235,0.05);
  padding: 10px 14px;
  border-radius: 10px;
  transition: background 0.25s;
}

.steps li:hover {
  background: rgba(37,99,235,0.12);
}

.steps i {
  color: var(--brand);
  font-size: 1rem;
}

.steps em {
  font-weight: 600;
  color: var(--brand-2);
  font-style: normal;
}

/* Loading card */
.loading-card {
  display: flex; align-items: center; gap: 10px; padding: 16px;
  border: 1px solid var(--ring); border-radius: 14px;
  background: var(--panel); box-shadow: var(--shadow-1);
}
.spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid #e5e7eb; border-top-color: var(--brand);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Floating action button (mobile) */
.fab {
  position: fixed; right: 18px; bottom: 18px; border: 0;
  width: 54px; height: 54px; border-radius: 50%;
  display: grid; place-items: center;
  background: linear-gradient(135deg,var(--brand),var(--brand-2));
  color: #fff; box-shadow: var(--shadow-2); 
  z-index: 100;
  display: none;
}

/* Desktop / laptop sidebar collapse */
.app-shell.sidebar-closed {
  grid-template-columns: 1fr;
}

/* ========== RESPONSIVE DESIGN ========== */

/* Large desktop */
@media (max-width: 1200px) {
  .app-shell { grid-template-columns: 260px 1fr; }
  .app-shell.sidebar-closed { grid-template-columns: 1fr; }
  .content { padding: 24px; }
}

/* Desktop */
@media (max-width: 1024px) {
  .page-header { grid-template-columns: 1fr; }
  .title-art { min-height: 160px; }
}

/* Tablet */
@media (max-width: 960px)  { 
  .app-shell { grid-template-columns: 76px 1fr; }
  .app-shell.sidebar-closed { grid-template-columns: 1fr; }
  .content { padding: 20px; }
}

/* Small tablet */
@media (max-width: 768px)  {
  .stats { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .content { padding: 18px; gap: 20px; }
}

/* Mobile - FIXED SIDEBAR ISSUES */
@media (max-width: 720px)  {
  .app-shell { 
    grid-template-columns: 1fr !important; /* Force single column */
  }
  
  .app-shell.sidebar-closed {
    grid-template-columns: 1fr !important; /* Ensure consistency */
  }
  
  /* Improved mobile sidebar */
  :deep(.sidebar) {
    position: fixed; 
    left: 0; 
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    transition: transform .3s ease; 
    z-index: 1000; 
    width: 280px;
    background: var(--panel-solid);
    border-right: 1px solid var(--border);
    -webkit-backdrop-filter: var(--glass);
    backdrop-filter: var(--glass);
    box-shadow: var(--shadow-2);
  }
  
  :deep(.sidebar.open) { 
    transform: translateX(0); 
  }
  
  /* Show FAB on mobile */
  .fab { 
    display: grid; 
  }
  
  /* Mobile content adjustments */
  .content {
    padding: 16px;
    gap: 18px;
    width: 100%;
  }
  
  .page-header {
    padding: 20px;
  }
  
  .title-wrap h1 {
    font-size: 1.75rem;
  }
  
  .hero-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }
  
  .stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .content {
    padding: 12px;
    gap: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .title-wrap h1 {
    font-size: 1.5rem;
  }
  
  .panel {
    padding: 20px;
  }
  
  .stats {
    gap: 12px;
  }
  
  .stat {
    padding: 14px;
  }
}

/* Extra small mobile */
@media (max-width: 360px) {
  .content {
    padding: 10px;
  }
  
  .page-header {
    padding: 14px;
  }
  
  .title-wrap h1 {
    font-size: 1.35rem;
  }
  
  .hero-actions .btn {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
}

/* Ensure content area doesn't get squeezed on very small screens */
.main {
  min-width: 0;
  overflow-x: hidden;
}

.content {
  max-width: 100%;
  width: 100%;
  min-width: 0;
}

/* Stats responsive behavior */
.stats {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

/* Mobile Overlay (Surgical Fix) - Global scope */
.mobile-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
}

@media (min-width: 721px) {
  .mobile-sidebar-overlay {
    display: none !important;
  }
}

.app-shell::before {
  display: none !important;
}
</style>
