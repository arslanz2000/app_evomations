<template>
  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="left">
        <div class="brand">
          <i class="fas fa-heartbeat"></i>
          <span>{{ appName }}</span>
        </div>
        <div class="meta">
          <span class="version">{{ version }}</span>
          <span class="dot">•</span>
          <span class="status">
            <span class="status-dot" :class="statusClass" aria-hidden="true"></span>
            {{ statusText }}
          </span>
        </div>
      </div>

      <nav class="links" aria-label="Footer">
        <a v-for="(l, i) in safeLinks" :key="i" class="link" :href="l.href" target="_blank" rel="noopener">
          <i v-if="l.icon" :class="['fas', l.icon]"></i>
          <span>{{ l.label }}</span>
        </a>
      </nav>

      <div class="right">
        <span>© {{ year }} {{ company }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  appName: { type: String, default: 'AI Doctors' },
  company: { type: String, default: 'Arslan' },
  version: { type: String, default: 'v1.0.0' },
  status: { type: String, default: 'operational' }, // 'operational' | 'degraded' | 'outage'
  links: {
    type: Array,
    default: () => ([
      { label: 'Docs', href: '#', icon: 'fa-book' },
      { label: 'Status', href: '#', icon: 'fa-signal' },
      { label: 'Support', href: '#', icon: 'fa-life-ring' },
      { label: 'Privacy', href: '#', icon: 'fa-shield-alt' },
      { label: 'Terms', href: '#', icon: 'fa-file-contract' },
    ])
  }
})

const year = new Date().getFullYear()

const statusText = computed(() => {
  switch ((props.status || '').toLowerCase()) {
    case 'degraded': return 'Degraded Performance'
    case 'outage': return 'Partial Outage'
    default: return 'Operational'
  }
})

const statusClass = computed(() => {
  switch ((props.status || '').toLowerCase()) {
    case 'degraded': return 'warn'
    case 'outage': return 'error'
    default: return 'ok'
  }
})

// sanitize/normalize links a bit
const safeLinks = computed(() => (props.links || []).filter(l => l && l.label && l.href))
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

:root {
  /* palette (inherits parent if set) */
  --panel: var(--panel, rgba(255,255,255,0.9));
  --panel-solid: var(--panel-solid, #ffffff);
  --border: var(--border, #e6eaf1);
  --text-900: var(--text-900, #0f172a);
  --text-600: var(--text-600, #475569);
  --muted: var(--muted, #6b7280);
  --brand-700: var(--brand-700, #155EEF);
  --ok: #16a34a;
  --warn: #f59e0b;
  --error: #ef4444;
  --shadow-1: var(--shadow-1, 0 10px 25px rgba(0,0,0,.06));
}

.footer {
  margin-top: 24px;
  border-top: 1px solid var(--border);
  background: var(--panel);
  backdrop-filter: blur(6px);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 18px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
}

.left { display: grid; grid-auto-flow: row; gap: 4px; }
.brand { display: inline-flex; align-items: center; gap: 8px; color: var(--text-900); font-weight: 700; }
.brand i { color: var(--brand-700); }
.meta { color: var(--muted); display: inline-flex; align-items: center; gap: 8px; font-size: .9rem; }
.version { font-variant-numeric: tabular-nums; }
.dot { opacity: .5; }
.status { display: inline-flex; align-items: center; gap: 6px; }
.status-dot { width: 8px; height: 8px; border-radius: 999px; }
.status-dot.ok { background: var(--ok); box-shadow: 0 0 0 3px rgba(22,163,74,.15); }
.status-dot.warn { background: var(--warn); box-shadow: 0 0 0 3px rgba(245,158,11,.15); }
.status-dot.error { background: var(--error); box-shadow: 0 0 0 3px rgba(239,68,68,.15); }

.links { display: inline-flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.link { display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; color: var(--text-600); text-decoration: none; border: 1px solid transparent; }
.link:hover { background: var(--panel-solid); border-color: var(--border); box-shadow: var(--shadow-1); }

.right { color: var(--muted); font-size: .9rem; }

/* Responsive */
@media (max-width: 900px) {
  .container { grid-template-columns: 1fr; text-align: center; }
  .left { place-items: center; }
  .right { order: 3; }
}

@media (max-width: 480px) {
  .container { padding: 12px 14px; gap: 8px; }
  .links { gap: 6px; }
  .link span { display: none; }
  .link { padding: 8px; }
  .meta { font-size: 0.8rem; }
  .right { font-size: 0.8rem; }
}
html.dark .footer {
  background:
    linear-gradient(180deg, rgba(6,182,212,0.16) 0%, rgba(6,182,212,0.08) 100%),
    var(--panel);
  border-top-color: color-mix(in srgb, #06b6d4 45%, var(--border));
}

html.dark .brand {
  color: #e6faff;                 
}
html.dark .brand i {
  color: #06b6d4;                 
  text-shadow: 0 0 12px rgba(6, 182, 212, .35);
}

html.dark .meta,
html.dark .right {
  color: color-mix(in srgb, #06b6d4 24%, var(--muted)); 
}

html.dark .links .link {
  color: color-mix(in srgb, #06b6d4 40%, var(--text-600));
  border-color: transparent;
}
html.dark .links .link:hover {
  background: color-mix(in srgb, #06b6d4 14%, var(--panel-solid));
  border-color: color-mix(in srgb, #06b6d4 42%, var(--border));
  box-shadow: 0 10px 25px rgba(6, 182, 212, .18);
}

html.dark .status-dot.ok    { box-shadow: 0 0 0 4px rgba(34,197,94,.18); }
html.dark .status-dot.warn  { box-shadow: 0 0 0 4px rgba(245,158,11,.20); }
html.dark .status-dot.error { box-shadow: 0 0 0 4px rgba(239,68,68,.20); }
</style>
