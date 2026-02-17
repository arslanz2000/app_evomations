<template>
  <header class="topbar">
    <!-- Sidebar toggle (only shows when sidebar is closed) -->
    <button v-if="!sidebarOpen" class="icon-btn" @click="$emit('toggleSidebar')" aria-label="Open sidebar">
      <i class="fas fa-bars"></i>
    </button>

    <!-- Breadcrumb / page title -->
    <div class="breadcrumbs">
      <i class="fas fa-layer-group" aria-hidden="true"></i>
      <span>AI Doctors</span>
    </div>

    <div class="spacer"></div>

    <!-- Theme toggle -->
    <button
      class="ghost icon-only"
      @click="$emit('toggleTheme')"
      :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <i :class="theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </button>

    <!-- Quick actions -->
    <div class="top-actions">
      <button class="ghost" @click="$emit('navigate','doctors')">
        <i class="fas fa-user-md"></i>
        All Doctors
      </button>
      <button class="primary" @click="$emit('navigate','doctors')">
        <i class="fas fa-calendar-check"></i>
        New Consultation
      </button>
    </div>

    <!-- User chip -->
    <div v-if="user" class="user-chip" aria-label="Account">
      <img :src="avatarUrl" alt="User avatar" />
      <span>{{ initials }}</span>
      <button class="ghost small" @click="logout">Logout</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  pageTitle: { type: String, default: '' },
  sidebarOpen: { type: Boolean, default: true },
  theme: { type: String, default: 'light' }
})

const emit = defineEmits(['toggleSidebar', 'toggleTheme', 'navigate'])

// ✅ Get user object from localStorage
const user = JSON.parse(localStorage.getItem("user") || "{}")

// Compute initials
const initials = computed(() => {
  if (!user?.name) return "U"
  return user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
})

// Avatar with Dicebear initials
const avatarUrl = computed(() =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${initials.value}`
)

// ✅ Logout clears storage and navigates back
function logout() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("user")
  localStorage.removeItem("currentView")
  emit("navigate", "login")
}
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(6px);
}

/* Buttons */
.icon-btn {
  background: transparent;
  border: 0;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--text);
}

.ghost,
.primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
}

.ghost {
  border: 1px solid var(--ring);
  background: var(--ghost-bg);
  color: var(--text);
}
.ghost:hover { background: var(--ghost-bg-hover); }

.icon-only {
  padding: 8px 10px;
  line-height: 0;
}

.primary {
  border: 0;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #fff;
  box-shadow: var(--shadow-1);
}
.primary:hover { filter: brightness(1.05); box-shadow: var(--shadow-2); }

.breadcrumbs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-weight: 700;
}

.spacer { flex: 1; }

.top-actions { display: flex; gap: 10px; }

/* User chip */
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--ring);
  background: var(--panel-solid);
  color: var(--text);
  margin-left: 8px;
}
.user-chip img { width: 24px; height: 24px; border-radius: 50%; }

.user-chip button.small {
  font-size: 0.8rem;
  padding: 4px 8px;
  margin-left: 6px;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .topbar {
    padding: 8px 12px;
  }
  .breadcrumbs, .top-actions button span, .top-actions button i + span {
    display: none;
  }
  /* If buttons are icons + text, hiding text */
  .top-actions button {
    padding: 8px 10px;
    font-size: 0; /* Hide text if no span */
  }
  .top-actions button i {
    font-size: 1.1rem;
    margin: 0;
  }
  .user-chip span {
    display: none;
  }
}
</style>
