<template>
  <section class="history-section">
    <header class="history-header">
      <div class="history-heading">
        <div class="history-icon"><i class="fas fa-notes-medical"></i></div>
        <div>
          <h2>Consultation History</h2>
          <p>A record of every AI consultation you've had</p>
        </div>
      </div>
      <div class="history-actions">
        <div v-if="!loading && summaries.length" class="history-count">
          <strong>{{ doctorGroups.length }}</strong>
          <span>{{ doctorGroups.length === 1 ? "Doctor" : "Doctors" }}</span>
        </div>
        <button
          v-if="!loading && summaries.length"
          type="button"
          class="reset-btn"
          @click="showResetConfirm = true"
        >
          <i class="fas fa-trash-alt"></i> Reset
        </button>
      </div>
    </header>

    <div v-if="loading" class="state-card">
      <div class="spinner"></div>
      <p>Loading your history…</p>
    </div>

    <!-- DOCTOR CARDS (one per doctor) -->
    <div v-else-if="!activeGroup && summaries.length" class="history-grid">
      <article
        v-for="group in doctorGroups"
        :key="group.key"
        class="history-card doctor-group-card"
        :class="{ 'is-last-talked': lastTalkedTo && group.key === lastTalkedTo.key }"
        @click="activeGroup = group"
      >
        <div class="card-top">
          <div class="doctor-avatar"><i class="fas fa-user-md"></i></div>
          <div class="doctor-id">
            <span v-if="lastTalkedTo && group.key === lastTalkedTo.key" class="last-talked-badge">
              <i class="fas fa-comment-dots"></i> Last talked to
            </span>
            <h3>{{ group.name }}</h3>
            <span v-if="group.specialty" class="specialty">{{ group.specialty }}</span>
          </div>
          <span class="date-pill">
            <i class="fas fa-calendar-alt"></i>
            {{ formatDate(group.latestDate) }}
          </span>
        </div>

        <div class="card-footer">
          <span class="visit-count-badge">
            <i class="fas fa-notes-medical"></i>
            {{ group.visits.length }} {{ group.visits.length === 1 ? "Appointment" : "Appointments" }}
          </span>
          <span class="view-link">View all <i class="fas fa-chevron-right"></i></span>
        </div>
      </article>
    </div>

    <!-- APPOINTMENTS FOR A SELECTED DOCTOR -->
    <div v-else-if="activeGroup" class="appointments-view">
      <button type="button" class="back-link" @click="activeGroup = null">
        <i class="fas fa-arrow-left"></i> Back to doctors
      </button>

      <div class="appointments-doctor-header">
        <div class="doctor-avatar large"><i class="fas fa-user-md"></i></div>
        <div class="doctor-id">
          <h3>{{ activeGroup.name }}</h3>
          <span v-if="activeGroup.specialty" class="specialty">{{ activeGroup.specialty }}</span>
        </div>
      </div>

      <div class="history-grid">
        <article v-for="summary in activeGroup.visits" :key="summary.id" class="history-card">
          <div class="card-top">
            <span class="date-pill">
              <i class="fas fa-calendar-alt"></i>
              {{ formatDate(summary.created_at) }}
            </span>
          </div>

          <div class="card-body">
            <div class="field-row">
              <div class="field-icon symptoms"><i class="fas fa-stethoscope"></i></div>
              <div class="field-text">
                <span class="field-label">Key Symptoms</span>
                <span class="field-value" :class="{ empty: !summary.key_symptoms }">
                  {{ summary.key_symptoms || "Not recorded" }}
                </span>
              </div>
            </div>

            <div class="field-row">
              <div class="field-icon observations"><i class="fas fa-eye"></i></div>
              <div class="field-text">
                <span class="field-label">Observations</span>
                <span class="field-value" :class="{ empty: !summary.observations }">
                  {{ summary.observations || "Not recorded" }}
                </span>
              </div>
            </div>

            <div class="field-row">
              <div class="field-icon recommendations"><i class="fas fa-vials"></i></div>
              <div class="field-text">
                <span class="field-label">Recommendations</span>
                <span class="field-value" :class="{ empty: !summary.recommendations }">
                  {{ summary.recommendations || "Not recorded" }}
                </span>
              </div>
            </div>

            <div class="field-row">
              <div class="field-icon followup"><i class="fas fa-calendar-check"></i></div>
              <div class="field-text">
                <span class="field-label">Follow-up</span>
                <span class="field-value" :class="{ empty: !summary.follow_up }">
                  {{ summary.follow_up || "Not recorded" }}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div v-else class="state-card empty-state">
      <div class="empty-icon"><i class="fas fa-folder-open"></i></div>
      <h3>No consultations yet</h3>
      <p>Your consultation history will show up here once you complete a call with an AI doctor.</p>
    </div>

    <!-- RESET CONFIRMATION MODAL -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="confirm-modal">
        <div class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h3>Clear consultation history?</h3>
        <p>This will permanently delete all {{ summaries.length }} consultation record{{ summaries.length === 1 ? "" : "s" }}. This action cannot be undone.</p>
        <div class="confirm-actions">
          <button type="button" class="confirm-cancel" :disabled="resetting" @click="showResetConfirm = false">
            Cancel
          </button>
          <button type="button" class="confirm-delete" :disabled="resetting" @click="resetHistory">
            <i class="fas" :class="resetting ? 'fa-spinner fa-spin' : 'fa-trash-alt'"></i>
            {{ resetting ? "Clearing…" : "Yes, clear all" }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

const BACKEND_API_KEY = import.meta.env.VITE_API_BASE_URL || "https://dashboard.evomations.com/api";

const summaries = ref([]);
const loading = ref(true);
const showResetConfirm = ref(false);
const resetting = ref(false);
const activeGroup = ref(null);

const doctorGroups = computed(() => {
  const map = new Map();
  for (const summary of summaries.value) {
    const key = summary.doctor_id ?? summary.doctor?.id ?? summary.doctor_name ?? "unknown";
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: summary.doctor?.name || summary.doctor_name || "Unknown Doctor",
        specialty: summary.doctor?.specialty || "",
        visits: [],
        latestDate: summary.created_at,
      });
    }
    const group = map.get(key);
    group.visits.push(summary);
    if (new Date(summary.created_at) > new Date(group.latestDate)) {
      group.latestDate = summary.created_at;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestDate) - new Date(a.latestDate)
  );
});

const lastTalkedTo = computed(() => doctorGroups.value[0] || null);

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function timeAgo(value) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

async function fetchHistory() {
  const token = localStorage.getItem("token");
  loading.value = true;
  try {
    const { data } = await axios.get(`${BACKEND_API_KEY}/summaries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    summaries.value = data || [];
  } catch (err) {
    console.error("❌ Failed to fetch history:", err.response?.data || err);
  } finally {
    loading.value = false;
  }
}

async function resetHistory() {
  const token = localStorage.getItem("token");
  resetting.value = true;
  try {
    await axios.delete(`${BACKEND_API_KEY}/summaries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    summaries.value = [];
    activeGroup.value = null;
    showResetConfirm.value = false;
  } catch (err) {
    console.error("❌ Failed to clear history:", err.response?.data || err);
  } finally {
    resetting.value = false;
  }
}

onMounted(fetchHistory);
</script>

<style scoped>
.history-section {
  padding: 8px 4px 32px;
}

.is-last-talked {
  border-color: color-mix(in srgb, var(--brand) 45%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 18%, transparent), var(--shadow-1);
}

.last-talked-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  font-size: 0.64rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  padding: 2px 9px;
  border-radius: 20px;
  margin-bottom: 4px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}

.history-heading {
  display: flex;
  align-items: center;
  gap: 16px;
}

.history-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #fff;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-1);
}

.history-heading h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text);
}

.history-heading p {
  margin: 2px 0 0;
  font-size: 0.88rem;
  color: var(--muted);
}

.history-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 12px;
  background: var(--panel-solid);
  border: 1px solid var(--ring);
  box-shadow: var(--shadow-1);
}

.history-count strong {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--brand);
}

.history-count span {
  font-size: 0.8rem;
  color: var(--muted);
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  background: color-mix(in srgb, #ef4444 10%, transparent);
  border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.reset-btn:hover {
  background: color-mix(in srgb, #ef4444 18%, transparent);
}

/* Reset confirmation modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 30, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.confirm-modal {
  background: var(--panel-solid);
  border: 1px solid var(--ring);
  border-radius: 18px;
  padding: 28px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: var(--shadow-2);
}

.confirm-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, #ef4444 14%, transparent);
  color: #ef4444;
  font-size: 1.3rem;
}

.confirm-modal h3 {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text);
}

.confirm-modal p {
  margin: 0 0 22px;
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-cancel,
.confirm-delete {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.confirm-cancel {
  background: var(--ghost-bg, #f3f4f6);
  color: var(--text);
}
.confirm-cancel:hover {
  background: var(--ghost-bg-hover, #e5e7eb);
}

.confirm-delete {
  background: #ef4444;
  color: #fff;
}
.confirm-delete:hover {
  filter: brightness(1.05);
}

.confirm-cancel:disabled,
.confirm-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.history-grid {
  display: grid;
  gap: 20px 20px;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  margin-top: 6px;
}

.history-card {
  background: var(--panel-solid);
  border: 1px solid var(--ring);
  border-radius: 16px;
  box-shadow: var(--shadow-1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.history-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-2);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  background: color-mix(in srgb, var(--brand) 7%, transparent);
  border-bottom: 1px solid var(--ring);
}

.card-top .doctor-avatar {
  margin-top: 2px;
}

.card-top .date-pill {
  margin-top: 2px;
}

.doctor-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  color: #fff;
  font-size: 1rem;
}

.doctor-avatar.large {
  width: 52px;
  height: 52px;
  font-size: 1.3rem;
}

.doctor-group-card {
  cursor: pointer;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  gap: 10px;
}

.visit-count-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brand);
}

.view-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.doctor-group-card:hover .view-link {
  color: var(--brand);
}

.appointments-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.back-link:hover {
  color: var(--brand);
}

.appointments-doctor-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--panel-solid);
  border: 1px solid var(--ring);
  border-radius: 16px;
  box-shadow: var(--shadow-1);
}

.appointments-doctor-header .doctor-id h3 {
  font-size: 1.1rem;
}

.doctor-id {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.doctor-id h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.specialty {
  font-size: 0.78rem;
  color: var(--muted);
}

.date-pill {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--muted);
  background: var(--panel-solid);
  border: 1px solid var(--ring);
  padding: 5px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 6px 18px 16px;
}

.field-row {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ring) 60%, transparent);
}

.field-row:last-child {
  border-bottom: none;
}

.field-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  margin-top: 1px;
}

.field-icon.symptoms { background: color-mix(in srgb, #f97316 16%, transparent); color: #f97316; }
.field-icon.observations { background: color-mix(in srgb, #0ea5e9 16%, transparent); color: #0ea5e9; }
.field-icon.recommendations { background: color-mix(in srgb, #22c55e 16%, transparent); color: #16a34a; }
.field-icon.followup { background: color-mix(in srgb, #8b5cf6 16%, transparent); color: #8b5cf6; }

.field-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.field-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.field-value {
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--text);
  white-space: pre-line;
}

.field-value.empty {
  color: var(--muted);
  font-style: italic;
}

/* Loading / empty states */
.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  background: var(--panel-solid);
  border: 1px solid var(--ring);
  border-radius: 16px;
  color: var(--muted);
  gap: 10px;
}

.spinner {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 3px solid var(--ring);
  border-top-color: var(--brand);
  animation: history-spin 0.8s linear infinite;
  margin-bottom: 6px;
}

@keyframes history-spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--brand) 10%, transparent);
  color: var(--brand);
  font-size: 1.4rem;
  margin-bottom: 6px;
}

.empty-state h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.empty-state p {
  margin: 0;
  max-width: 360px;
  font-size: 0.88rem;
}

@media (max-width: 600px) {
  .history-grid {
    grid-template-columns: 1fr;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
