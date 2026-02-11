<template>
  <div class="container">
    <!-- CALL INTERFACE -->
    <section v-if="callActive && !showAllMode" class="call-surface">
      <div class="call-layout">
        <div class="call-center">
          <div style="display: flex">
            <div class="doctor-name">
              <h2 class="call-title">
                {{ currentDoctorName.replace(/\(.*\)/, "").trim() }}
                <span v-if="/\((.*)\)/.test(currentDoctorName)">
                  {{ currentDoctorName.match(/\((.*)\)/)[0] }}
                </span>
              </h2>
            </div>
            <div class="listening-pill">
              <span>Listening</span>
              <div class="bars">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          <div class="doctor-profile">
            <div class="vid-avatar">
              <img src="/src/assets/image_doc.png" />
            </div>
            <div class="call-timer-big">
              <i class="fas fa-clock"></i> {{ callTimer }}
            </div>
          </div>
          <div class="call-cta-row">
            <button class="round-cta" @click="toggleMute">
              <i
                class="fas"
                :class="isMuted ? 'fa-microphone-slash' : 'fa-microphone'"
              ></i>
            </button>
            <button class="round-cta" @click="toggleSpeaker">
              <i
                class="fas"
                :class="isSpeakerOn ? 'fa-volume-up' : 'fa-volume-mute'"
              ></i>
            </button>
            <button class="round-cta" @click="toggleHold">
              <i class="fas" :class="isOnHold ? 'fa-play' : 'fa-pause'"></i>
            </button>
            <button class="round-cta end" @click="stopCall">
              <i class="fas fa-phone-slash"></i>
            </button>
            <button class="round-cta consult" @click="openConsultation">
              <i class="fas fa-calendar-alt"></i>
            </button>
          </div>
        </div>

        <div class="call-sidebar">
          <div class="sidebar-content">
            <template v-if="latestSummary">
              <div class="sidebar-item active">
                <i class="fas fa-user-md"></i>
                <span>{{
                  latestSummary.doctor_name || "Recent Consultation"
                }}</span>
              </div>

              <div class="sidebar-item">
                <i class="fas fa-stethoscope"></i>
                <span>{{
                  latestSummary.key_symptoms || "Key symptoms not available"
                }}</span>
              </div>

              <div class="sidebar-item">
                <i class="fas fa-heartbeat"></i>
                <span>{{
                  latestSummary.observations || "Observations not available"
                }}</span>
              </div>

              <div class="sidebar-item">
                <i class="fas fa-vials"></i>
                <span>{{
                  latestSummary.recommendations ||
                  "Recommendations not available"
                }}</span>
              </div>

              <div class="sidebar-item">
                <i class="fas fa-tint"></i>
                <span>{{
                  latestSummary.follow_up || "Follow-up not available"
                }}</span>
              </div>
            </template>

            <template v-else>
              <div class="sidebar-item active">
                <i class="fas fa-stethoscope"></i>
                <span>General Checkup</span>
              </div>
              <div class="sidebar-item">
                <i class="fas fa-heartbeat"></i>
                <span>Cardiogram</span>
              </div>
              <div class="sidebar-item">
                <i class="fas fa-vials"></i>
                <span>Lab Test</span>
              </div>
              <div class="sidebar-item">
                <i class="fas fa-tint"></i>
                <span>Blood Bank</span>
              </div>
            </template>
          </div>

          <button class="view-all" @click="showAllSummaries">Show All</button>
        </div>
      </div>

      <div class="chat-wrap">
        <div
          class="bubble-list"
          ref="captionsEl"
          aria-live="polite"
          aria-atomic="false"
        >
          <div
            v-for="(c, i) in captions"
            :key="c.ts + '-' + i"
            class="bubble"
            :data-role="c.role"
          >
            <div class="bubble-meta">
              {{ c.role === "assistant" ? "Doctor" : "You" }}
            </div>
            <div class="bubble-text">{{ c.text }}</div>
          </div>

          <div class="upload-row">
            <label class="attach-btn">
              <i class="fas fa-file-upload"></i>
              <span>Send PDF or Image(s)</span>
              <input
                type="file"
                accept="application/pdf,image/*"
                multiple
                @change="handleDocsToCall"
              />
            </label>
            <small v-if="uploadingDoc" class="upload-status">{{
              uploadStatus
            }}</small>
          </div>
        </div>

        <form class="chat-composer" @submit.prevent="sendChat">
          <input
            type="text"
            v-model="chatText"
            placeholder="Type a message to the doctor…"
            :disabled="!callActive || sending"
          />
          <button class="btn send-btn" :disabled="!chatText.trim() || sending">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </section>

    <!-- ALL SUMMARIES VIEW -->
    <section v-else-if="showAllMode" class="all-summaries-section">
      <div class="summaries-header">
        <h2><i class="fas fa-notes-medical"></i> All Consultation Summaries</h2>
        <button class="back-btn" @click="backToLatest">
          <i class="fas fa-arrow-left"></i> Back
        </button>
      </div>

      <div v-if="allSummaries.length" class="summaries-grid">
        <div
          v-for="summary in allSummaries"
          :key="summary.id"
          class="summary-card"
        >
          <h3 class="summary-title">
            <i class="fas fa-user-md"></i>
            {{
              summary.doctor?.name || summary.doctor_name || "Unknown Doctor"
            }}
          </h3>

          <div class="summary-info">
            <p>
              <strong>Key Symptoms:</strong> {{ summary.key_symptoms || "—" }}
            </p>
            <p>
              <strong>Observations:</strong> {{ summary.observations || "—" }}
            </p>
            <p>
              <strong>Recommendations:</strong>
              {{ summary.recommendations || "—" }}
            </p>
            <p><strong>Follow-up:</strong> {{ summary.follow_up || "—" }}</p>
          </div>

          <div class="summary-meta">
            <i class="fas fa-calendar-alt"></i>
            {{ new Date(summary.created_at).toLocaleDateString() }}
          </div>
        </div>
      </div>

      <div v-else class="no-summaries">
        <i class="fas fa-folder-open"></i>
        <p>No summaries found yet.</p>
      </div>
    </section>

    <!-- DOCTORS LIST (DEFAULT VIEW) -->
    <template v-else>
      <h2 class="section-title">
        <i class="fas fa-user-md"></i>
        Meet Your AI Doctors
      </h2>
      <p class="new-c">
        Expert care, powered by AI. Get instant guidance from specialists across
        every major field; ready to answer your health questions anytime.
      </p>
      <section class="doctor-grid">
        <div
          v-for="(doctor, index) in filteredDoctors"
          :key="doctor.id"
          class="doctor-card fade-in"
          :style="{ 'animation-delay': `${index * 0.05}s` }"
        >
          <header class="doctor-header">
            <div class="doctor-avatar">
              <img
                :src="`/${doctor.id}.png`"
                :alt="doctor.name"
                @error="$event.target.src = '/default-doctor.png'"
              />
            </div>
          </header>

          <div class="doctor-details">
            <div class="detail-item">
              <span>{{ doctor.specialty }}</span>
            </div>
            <div class="availability">
              <span class="availability-dot" />
              <span>{{
                specialtyDescriptions[doctor.specialty] ||
                "Available for consultation"
              }}</span>
            </div>
          </div>

          <footer class="doctor-actions">
            <button
              class="btn btn--call"
              @click="startCall(doctor)"
              :disabled="callActive && activeDoctorId === doctor.id"
            >
              <i class="fas fa-phone-alt"></i>
              {{
                callActive && activeDoctorId === doctor.id
                  ? "In Call..."
                  : "Start AI Consultation"
              }}
            </button>
          </footer>
        </div>
      </section>
    </template>

    <!-- STATUS AND POPUP (ALWAYS AVAILABLE) -->
    <p v-if="status && !callActive" class="status">
      <span v-if="statusLoading" class="loading">
        <span>{{ status }}</span>
        <span class="loading-dots">
          <span></span><span></span><span></span>
        </span>
      </span>
      <span v-else>{{ status }}</span>
    </p>

    <div
      v-if="showTranscriptPrompt"
      class="call-popup-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="call-popup">
        <div class="call-header">
          <div class="call-avatar"><i class="fas fa-file-alt"></i></div>
          <div class="call-info">
            <h3>Download summary?</h3>
            <p>
              We compiled your call with
              <strong>{{ currentDoctorName }}</strong> ({{ lastCallTimer }}).
            </p>
          </div>
        </div>
        <div class="call-actions" style="gap: 12px">
          <button
            class="end-call-btn"
            @click="downloadPdfReport"
            :disabled="summarizing"
            aria-label="Summarize & Download"
          >
            <i
              class="fas"
              :class="summarizing ? 'fa-spinner fa-spin' : 'fa-file-download'"
            ></i>
          </button>
          <button class="cancel-btn" @click="showTranscriptPrompt = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from "vue";
import Vapi from "@vapi-ai/web";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { jsPDF } from "jspdf";
import axios from "axios";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

const PUBLIC_KEY = "c9773d29-c83b-4903-959a-d40a77793396";
let vapi;

// Voice-only state
const assistantMuted = ref(false);
const canSendControls = ref(false);
const controlQueue = [];
const showAllMode = ref(false);
const allSummaries = ref([]);
const allSummariesSection = ref(null);

function flushControls() {
  if (!vapi) return;
  while (controlQueue.length) {
    const control = controlQueue.shift();
    try {
      vapi.send({ type: "control", control });
    } catch (e) {
      const msg = String(e?.message || e).toLowerCase();
      if (msg.includes("only supported after join")) {
        controlQueue.unshift(control);
        break;
      } else {
        console.error("control send failed:", e);
      }
    }
  }
}

const specialtyDescriptions = {
  "ENT Specialist":
    "Support for ear, nose, and throat issues like allergies, sinus trouble, and infections.",
  Dentistry:
    "Quick guidance on tooth pain, cavities, gum health, and oral hygiene.",
  Urology: "Help with urinary tract concerns, kidney issues, and men’s health.",
  Endocrinology:
    "Advice on hormone health, thyroid conditions, and diabetes management.",
  Cardiology:
    "Heart health insights, from blood pressure concerns to chest discomfort.",
  Neurology:
    "Support for headaches, nerve pain, memory, and neurological conditions.",
  Pulmonology: "Guidance on breathing issues, asthma, and lung health.",
  Gastroenterology:
    "Digestive health support, including stomach pain, reflux, and IBS.",
  Oncology:
    "Information and support related to cancer risks, symptoms, and treatments.",
  Psychiatry:
    "Mental health insights for stress, anxiety, depression, and emotional well-being.",
  Psychologist:
    "Guidance for emotional wellness, behavior, and coping strategies.",
  Orthopedics: "Guidance on bones, joints, and musculoskeletal injuries.",
  Infectology: "Helps treat infections, fevers, and prevent them.",
  Dermatology: "Skin health advice for rashes, acne, and other conditions.",
  Ophthalmology: "Eye care guidance, from vision issues to eye infections.",
  Hematology: "Support for blood-related conditions and clotting concerns.",
  Nutritionist: "Advice on diet, nutrition, and healthy lifestyle choices.",
  Pediatrician: "Care and guidance for infants, children, and adolescents.",
  "General Physician":
    "First contact for common health concerns and overall guidance.",
};

const doctors = ref([
  {
    id: "dr-david",
    name: "Dr. David Chen",
    specialty: "Cardiology",
    assistantId: "ba2f0969-4750-4190-a91f-2c5dc814bced",
  },
  {
    id: "dr-miles",
    name: "Dr. Miles Johnson",
    specialty: "Oncology",
    assistantId: "e225eced-43ba-474c-989e-4497e8f8588c",
  },
  {
    id: "dr-morgan",
    name: "Dr. Morgan Lee",
    specialty: "Hematology",
    assistantId: "6ee484ac-18fb-401c-ba14-67a1a8ffc5d5",
  },
  {
    id: "dr-taylor",
    name: "Dr. Taylor Wilson",
    specialty: "Gynecology",
    assistantId: "6b04a133-3158-4c3c-b5af-9f83b38efd56",
  },
  {
    id: "dr-omaar",
    name: "Dr. Omaar Ahmed",
    specialty: "Ophthalmology",
    assistantId: "e60bcf74-a1ab-4453-9ebc-77e01a90558a",
  },
  {
    id: "dr-grace",
    name: "Dr. Grace Kim",
    specialty: "Dermatology",
    assistantId: "c0c28d30-8e0d-4787-8072-e2cd6a1df032",
  },
  {
    id: "dr-andrew",
    name: "Dr. Andrew Park",
    specialty: "Infectology",
    assistantId: "c25e654b-4ad5-4e72-b6b0-49354fb8c957",
  },
  {
    id: "dr-scarlett",
    name: "Dr. Scarlett Davis",
    specialty: "Orthopedics",
    assistantId: "10b4d79f-9e8a-4b18-b528-a8ff2ca4fb94",
  },
  {
    id: "dr-nova",
    name: "Dr. Nova Rodriguez",
    specialty: "Psychiatry",
    assistantId: "e4608542-a6c0-4517-8df0-72c539ea5014",
  },
  {
    id: "dr-robert",
    name: "Dr. Robert Brown",
    specialty: "Gastroenterology",
    assistantId: "38523be1-eaa4-4f11-a418-4c7cccf20212",
  },
  {
    id: "dr-daniel",
    name: "Dr. Daniel Garcia",
    specialty: "Pulmonology",
    assistantId: "2489de55-7d05-4282-ab89-acd44a1198c7",
  },
  {
    id: "dr-williams",
    name: "Dr. Williams Smith",
    specialty: "Dentistry",
    assistantId: "d43273a6-82e4-4462-ba07-72346e23e6f9",
  },
  {
    id: "dr-susan",
    name: "Dr. Susan Miller",
    specialty: "Endocrinology",
    assistantId: "3ce663b3-2ac9-463e-a943-bac7b7b8ea0f",
  },
  {
    id: "dr-emma",
    name: "Dr. Emma Thompson",
    specialty: "Urology",
    assistantId: "6a266708-6b19-4b92-92ad-832a2e960abd",
  },
  {
    id: "dr-ellie",
    name: "Dr. Ellie Clark",
    specialty: "ENT Specialist",
    assistantId: "16cd535c-8137-40c8-aa94-40e19c103648",
  },
  {
    id: "dr-michael",
    name: "Dr. Michael Wright",
    specialty: "Neurology",
    assistantId: "1c964479-ebe7-4fe7-b446-acb23173664e",
  },
  {
    id: "dr-sophie",
    name: "Dr. Sophie Martinez",
    specialty: "General Physician",
    assistantId: "13e6ca08-cec8-4bff-816e-e5fbad4a633c",
  },
  {
    id: "dr-mark",
    name: "Dr Mark",
    specialty: "Pediatrician",
    assistantId: "f5d3b472-62b7-42da-93e9-945af243dbf8",
  },
  {
    id: "dr-lucy",
    name: "Dr Lucy",
    specialty: "Nutritionist",
    assistantId: "62107efe-3686-4974-80ac-6b61f17fc589",
  },
  // {
  //   id: "dr-anne",
  //   name: "Dr Anne",
  //   specialty: "Psychologist",
  //   assistantId: "e4cb63da-8ae6-4f08-8f78-25ad8cc981df",
  // },
]);

const OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const BACKEND_API_KEY = import.meta.env.VITE_API_BASE_URL;

const callActive = ref(false);
const activeDoctorId = ref(null);
const status = ref("");
const statusLoading = ref(false);
const callTimer = ref("00:00");
const searchQuery = ref("");
const specialtyFilter = ref("");
const sortBy = ref("name");
const callProgress = ref(0);
const chatText = ref("");
const sending = ref(false);

const callState = ref("idle");
const isMuted = ref(false);
const isSpeakerOn = ref(false);
const isOnHold = ref(false);

const captions = ref([]);
const captionsEl = ref(null);

const uploadingDoc = ref(false);
const uploadStatus = ref("");

const finalTranscript = ref([]);
const showTranscriptPrompt = ref(false);
const callStartedAt = ref(null);
const lastCallTimer = ref("00:00");

const summarizing = ref(false);
const CONSULTATION_URL = "https://calendly.com/arslan-khan-icustoms/30min";
const suppressSummaryPopup = ref(false);

const currentDoctorName = computed(() => {
  const doctor = doctors.value.find((d) => d.id === activeDoctorId.value);
  return doctor ? `${doctor.name} (${doctor.specialty})` : "";
});

const uniqueSpecialties = computed(() =>
  [...new Set(doctors.value.map((d) => d.specialty))].sort(),
);

const filteredDoctors = computed(() => {
  let result = [...doctors.value];
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q),
    );
  }
  if (specialtyFilter.value) {
    result = result.filter((d) => d.specialty === specialtyFilter.value);
  }
  if (sortBy.value === "name")
    result.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy.value === "specialty")
    result.sort((a, b) => a.specialty.localeCompare(b.specialty));
  return result;
});

const activeBubbleIdx = ref({ user: null, assistant: null });
const pendingMessages = [];

function flushMessages() {
  if (!vapi) return;
  while (pendingMessages.length) {
    const t = pendingMessages.shift();
    try {
      vapi.send({ type: "add-message", message: { role: "user", content: t } });
    } catch (e) {
      pendingMessages.unshift(t);
      break;
    }
  }
}

async function saveSummary(doctorId, summaryText) {
  const token = localStorage.getItem("token");
  try {
    await axios.post(
      `${BACKEND_API_KEY}/summaries`,
      {
        doctor_id: doctorId,
        summary: summaryText,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log("✅ Summary saved");
  } catch (err) {
    console.error("❌ Failed to save summary:", err.response?.data || err);
  }
}

const latestSummary = ref(null);
const sidebarSections = ref([]);

async function fetchLatestSummary() {
  const token = localStorage.getItem("token");
  try {
    const { data } = await axios.get(`${BACKEND_API_KEY}/summaries/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data) {
      latestSummary.value = data;
      const summaryText = data.summary;

      sidebarSections.value = [
        {
          title: "Key Points",
          icon: "fas fa-stethoscope",
        },
        {
          title: "Observations",
          icon: "fas fa-heartbeat",
        },
        {
          title: "Suggestions",
          icon: "fas fa-vials",
        },
        {
          title: "Next Steps",
          icon: "fas fa-tint",
        },
      ];
    } else {
      latestSummary.value = null;
    }
  } catch (err) {
    console.error(
      "❌ Failed to fetch latest summary:",
      err.response?.data || err,
    );
  }
}

async function sendChat() {
  const text = chatText.value.trim();
  if (!text || !callActive.value) return;

  addCaption("user", text, true);
  finalTranscript.value.push({ role: "user", text });
  chatText.value = "";

  try {
    sending.value = true;
    if (canSendControls.value) {
      await vapi?.send?.({
        type: "add-message",
        message: { role: "user", content: text },
      });
    } else {
      pendingMessages.push(text);
      status.value = "Message queued — connecting…";
      setTimeout(() => (status.value = ""), 3500);
    }
  } catch (e) {
    console.error("sendChat error:", e);
    status.value = "Could not send message.";
    setTimeout(() => (status.value = ""), 4000);
  } finally {
    sending.value = false;
  }
}

function normalizeContent(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => {
        if (!p) return "";
        if (typeof p === "string") return p;
        return p.text || p.content || p.delta || p.transcript || "";
      })
      .join(" ")
      .trim();
  }
  if (typeof content === "object") {
    return (
      content.text ||
      content.content ||
      content.delta ||
      content.transcript ||
      ""
    );
  }
  return "";
}

function addCaption(role, text, final = false) {
  if (!text || !text.trim()) return;
  const key = role === "assistant" ? "assistant" : "user";
  const idx = activeBubbleIdx.value[key];
  if (idx !== null && captions.value[idx] && !captions.value[idx].final) {
    captions.value[idx].text = text;
    captions.value[idx].final = final;
    if (final) activeBubbleIdx.value[key] = null;
  } else {
    const newIdx =
      captions.value.push({
        role: key,
        text,
        ts: Date.now(),
        final,
      }) - 1;
    if (!final) activeBubbleIdx.value[key] = newIdx;
  }
  nextTick(() => {
    if (captionsEl.value)
      captionsEl.value.scrollTop = captionsEl.value.scrollHeight;
  });
}

function setAssistantMuted(flag) {
  const ctrl = flag ? "mute-assistant" : "unmute-assistant";
  assistantMuted.value = !!flag;
  isSpeakerOn.value = !flag;

  if (!canSendControls.value) {
    controlQueue.push(ctrl);
    return;
  }
  try {
    vapi?.send?.({ type: "control", control: ctrl });
  } catch (e) {
    const msg = String(e?.message || e).toLowerCase();
    if (msg.includes("only supported after join")) {
      controlQueue.push(ctrl);
    } else {
      console.error("Failed to control assistant voice:", e);
    }
  }
}

const startCall = async (doctor) => {
  if (!doctor || !doctor.assistantId) {
    status.value = "No doctor selected or missing assistantId.";
    return;
  }
  finalTranscript.value = [];
  showTranscriptPrompt.value = false;
  callStartedAt.value = new Date();

  activeDoctorId.value = doctor.id;
  callState.value = "calling";
  callProgress.value = 0;
  status.value = `Connecting to ${doctor.name}...`;
  statusLoading.value = true;
  captions.value = [];

  canSendControls.value = false;
  controlQueue.length = 0;
  setAssistantMuted(false);

  const interval = setInterval(() => {
    if (callProgress.value < 100) callProgress.value += 10;
    else clearInterval(interval);
  }, 300);

  try {
    await vapi.start(doctor.assistantId, {
      clientMessages: [
        "transcript",
      ],
    });

    callState.value = "active";
    callActive.value = true;
    statusLoading.value = false;
    startCallTimer();
  } catch (err) {
    handleVapiError(err);
    callState.value = "idle";
    callActive.value = false;
    statusLoading.value = false;
  }
};

// const handleCallEnd = () => {
//   callState.value = "idle";
//   callActive.value = false;
//   clearInterval(timerInterval);
//   isMuted.value = false;
//   assistantMuted.value = false;
//   isSpeakerOn.value = false;
//   canSendControls.value = false;
//   controlQueue.length = 0;
//   lastCallTimer.value = callTimer.value;
//   status.value = `Session ended with ${currentDoctorName.value}`;
//   showTranscriptPrompt.value = !suppressSummaryPopup.value;
//   suppressSummaryPopup.value = false;
//   setTimeout(() => (status.value = ""), 5000);
// };
const handleCallEnd = () => {
  callState.value = 'idle'
  callActive.value = false
  showAllMode.value = false  // Add this line
  clearInterval(timerInterval)
  isMuted.value = false
  assistantMuted.value = false
  isSpeakerOn.value = false
  canSendControls.value = false
  controlQueue.length = 0
  lastCallTimer.value = callTimer.value
  status.value = `Session ended with ${currentDoctorName.value}`
  showTranscriptPrompt.value = !suppressSummaryPopup.value
  suppressSummaryPopup.value = false
  setTimeout(() => (status.value = ''), 5000)
}

function openConsultation() {
  suppressSummaryPopup.value = true;
  try {
    vapi?.stop();
  } catch (_) {}
  window.open(CONSULTATION_URL, "_blank", "noopener");
}

const stopCall = () => {
  try {
    vapi?.stop();
  } catch (_) {}
  handleCallEnd();
  const transcript = finalTranscript.value
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n");
  if (activeDoctorId.value && transcript) {
    saveSummary(activeDoctorId.value, transcript).then(() =>
      fetchLatestSummary(),
    );
  }
};

async function downloadPdfReport() {
  summarizing.value = true;
  try {
    const lines = getSanitizedLines();
    const convoText = toConversationText(lines);

    const doctor = currentDoctorName.value || "Doctor";
    const started = callStartedAt.value
      ? callStartedAt.value.toLocaleString()
      : "";
    const duration = lastCallTimer.value || callTimer.value;

    let sections;
    if (OPENAI_API_KEY) {
      try {
        sections = await generateReportWithGPT({
          doctor,
          started,
          duration,
          convoText,
        });
      } catch (e) {
        console.error("GPT report failed, using fallback:", e);
        sections = buildHeuristicSections(lines);
      }
    } else {
      sections = buildHeuristicSections(lines);
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const maxW = pageW - margin * 2;
    let y = margin;

    const BRAND = { r: 26, g: 115, b: 232 };
    const MUTED = 120;

    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(0, 0, pageW, 26, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Consultation Report", margin, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Auto-generated from your virtual consultation", margin, 22);

    y = 34;
    doc.setTextColor(0);
    infoRow("Physician", doctor);
    infoRow("Started", started || "—");
    infoRow("Duration", duration || "—");
    y += 6;
    divider();

    y = section("Key Points Discussed", sections.key_points, y);
    y = section("Observations", sections.observations, y);
    y = section("Suggestions", sections.suggestions, y);
    y = section("Next Steps / Follow-up", sections.next_steps, y);

    const notes = sections.important_notes?.length
      ? sections.important_notes
      : [
          "This report is auto-generated from a virtual conversation.",
          "It is not a diagnosis or a substitute for in-person medical care.",
          "Seek urgent care if symptoms worsen or new severe symptoms develop.",
        ];
    y = section("Important Notes", notes, y);
    addPageNumbers();

    const safeDoc = doctor.replace(/[^\w\-]+/g, "_");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    doc.save(`${safeDoc}__${stamp}__consultation.pdf`);
    showTranscriptPrompt.value = false;

    function infoRow(label, value) {
      const chipH = 10;
      const chipW = (pageW - margin * 2) / 3 - 4;
      const idx = ["Physician", "Started", "Duration"].indexOf(label);
      const x = margin + idx * (chipW + 6);
      doc.setDrawColor(220);
      doc.setFillColor(248, 249, 255);
      doc.setFontSize(8);
      doc.setTextColor(MUTED);
      doc.text(label.toUpperCase(), x + 3, y + 4);
      doc.setFontSize(11);
      doc.setTextColor(0);
      const vLines = doc.splitTextToSize(value || "—", chipW - 6);
      doc.text(vLines, x + 3, y + 8);
      if (label === "Duration") y += chipH + 4;
    }

    function divider() {
      doc.setDrawColor(210);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }

    function ensureSpace(linesNeeded = 1) {
      const need = linesNeeded * 6 + 14;
      if (y + need > pageH - margin) {
        doc.addPage();
        y = margin + 2;
      }
    }

    function section(title, bulletsArr, yy) {
      y = yy;
      ensureSpace(3);
      doc.setFillColor(240, 244, 255);
      doc.setDrawColor(220);
      doc.roundedRect(margin, y, maxW, 10, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text(title, margin + 4, y + 7);
      y += 14;
      bullets(bulletsArr);
      y += 2;
      return y;
    }

    function bullets(list) {
      if (!list || !list.length) {
        doc.setTextColor(MUTED);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("— none —", margin, y);
        doc.setTextColor(0);
        y += 6;
        return;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0);
      for (const t of list) {
        const lines = doc.splitTextToSize(String(t), maxW - 8);
        ensureSpace(lines.length);
        doc.setFont("helvetica", "bold");
        doc.text("•", margin + 1, y);
        doc.setFont("helvetica", "normal");
        doc.text(lines, margin + 6, y);
        y += 6 * Math.max(1, lines.length);
      }
    }

    function addPageNumbers() {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(MUTED);
        doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 6, {
          align: "right",
        });
      }
      doc.setTextColor(0);
    }
  } finally {
    summarizing.value = false;
  }
}

function buildHeuristicSections(lines) {
  const isShort = (s) => (s || "").split(/\s+/).length <= 2;
  const dedupe = (arr) =>
    Array.from(new Set(arr.map((t) => String(t).trim()))).filter(Boolean);
  const userU = lines
    .filter((l) => l.role !== "assistant")
    .map((l) => l.text)
    .filter((t) => !isShort(t));
  const docU = lines
    .filter((l) => l.role === "assistant")
    .map((l) => l.text)
    .filter((t) => !isShort(t));
  const obsKw =
    /(seem|observ|finding|exam|likely|stable|normal|abnormal|range|vitals|labs?|scan|imaging|x-?ray|mri|ct)/i;
  const recKw =
    /(should|recommend|advise|consider|monitor|avoid|increase|decrease|start|stop|take|use|apply|dose|dosage)/i;
  const nextKw =
    /(next|follow[- ]?up|schedule|book|test|lab|scan|referr|see|appointment|blood|results|recheck|review)/i;
  return {
    key_points: dedupe([...userU.slice(0, 4), ...docU.slice(0, 2)]).slice(0, 8),
    observations: dedupe(docU.filter((t) => obsKw.test(t))).slice(0, 10),
    suggestions: dedupe(docU.filter((t) => recKw.test(t))).slice(0, 12),
    next_steps: dedupe(docU.filter((t) => nextKw.test(t))).slice(0, 10),
    important_notes: [
      "This report is auto-generated from a virtual conversation.",
      "It is not a diagnosis or a substitute for in-person medical care.",
      "Seek urgent care if symptoms worsen or new severe symptoms develop.",
    ],
  };
}

function getSanitizedLines() {
  const rawLines = finalTranscript.value.length
    ? finalTranscript.value
    : captions.value.map((c) => ({
        role: c.role === "assistant" ? "assistant" : "user",
        text: (c.text || "").trim(),
      }));

  return rawLines
    .filter((l) => l && l.text)
    .filter((l) => !/^[📄🖼️]\s/i.test(l.text))
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() }));
}

function toConversationText(lines, maxChars = 18000) {
  let s = lines
    .map((l) => `${l.role === "assistant" ? "Doctor" : "Patient"}: ${l.text}`)
    .join("\n");
  if (s.length > maxChars) s = "…\n" + s.slice(-maxChars);
  return s;
}

async function generateReportWithGPT({ doctor, started, duration, convoText }) {
  const sys = `
You are a medical scribe. Produce a concise, de-duplicated report from a virtual consultation transcript.
Do NOT invent facts. Use only the transcript content (attachments were removed).
Return STRICT JSON with this shape:
{
  "key_points": string[],
  "observations": string[],
  "suggestions": string[],
  "next_steps": string[],
  "important_notes": string[]
}
Each item should be a short bullet (<= 20 words).
Include a generic safety disclaimer inside "important_notes" if not present.
`.trim();

  const user = `
Physician: ${doctor || "Doctor"}
Started: ${started || "-"}
Duration: ${duration || "-"}

Transcript:
${convoText}
`.trim();

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.2,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`OpenAI error ${resp.status}: ${t || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  let json;
  try {
    json = JSON.parse(content);
  } catch {
    json = {};
  }

  const ensure = (a) => (Array.isArray(a) ? a.filter(Boolean) : []);
  return {
    key_points: ensure(json.key_points),
    observations: ensure(json.observations),
    suggestions: ensure(json.suggestions),
    next_steps: ensure(json.next_steps),
    important_notes: ensure(json.important_notes),
  };
}
// async function showAllSummaries() {
//   showAllMode.value = true;
//   const token = localStorage.getItem("token");
//   try {
//     const { data } = await axios.get(`${BACKEND_API_KEY}/summaries`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     allSummaries.value = data || [];
//     await nextTick();
//     if (allSummariesSection.value) {
//       allSummariesSection.value.scrollIntoView({
//         behavior: "smooth",
//         block: "start",
//       });
//     }
//   } catch (err) {
//     console.error(
//       "❌ Failed to fetch all summaries:",
//       err.response?.data || err,
//     );
//   }
// }

// function backToLatest() {
//   showAllMode.value = false;
// }
async function showAllSummaries() {
  if (callActive.value) {
    suppressSummaryPopup.value = true;
    try { 
      vapi?.stop() 
    } catch (_) { }
    handleCallEnd();
  }
  showAllMode.value = true; 
  const token = localStorage.getItem("token");
  try {
    const { data } = await axios.get(`${BACKEND_API_KEY}/summaries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    allSummaries.value = data || [];
  } catch (err) {
    console.error("❌ Failed to fetch all summaries:", err.response?.data || err);
  }
}

function backToLatest() {
  showAllMode.value = false;
}
const toggleMute = () => {
  isMuted.value = !isMuted.value;
  isMuted.value ? vapi.mute() : vapi.unmute();
};
const toggleSpeaker = () => {
  const next = !isSpeakerOn.value;
  setAssistantMuted(!next);
};
const toggleHold = () => {
  isOnHold.value = !isOnHold.value;
};

const handleVapiError = (err) => {
  const msg = typeof err === "string" ? err : err?.message || String(err);
  console.error("VAPI error:", msg);
  status.value = `Error: ${msg}`;
};

let timerInterval = null;
let seconds = 0;
const startCallTimer = () => {
  seconds = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    callTimer.value = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, 1000);
};

async function handleDocsToCall(e) {
  const files = Array.from(e.target?.files || []);
  if (!files.length) return;

  uploadingDoc.value = true;
  uploadStatus.value = `Processing ${files.length} file(s)…`;

  for (const file of files) {
    try {
      if (file.type === "application/pdf") {
        uploadStatus.value = `Reading PDF: ${file.name}`;
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;

        let text = "";
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          text += content.items.map((i) => i.str).join(" ") + "\n";
        }
        await sendFileTextToDoctor(text.trim(), `📄 ${file.name}`);
      } else if (file.type.startsWith("image/")) {
        uploadStatus.value = `OCR image: ${file.name}`;
        const dataUrl = await fileToDataURL(file);
        const { data } = await Tesseract.recognize(dataUrl, "eng");
        const text = (data?.text || "").trim();
        await sendFileTextToDoctor(
          text || "(no text detected)",
          `🖼️ ${file.name}`,
        );
      } else {
        uploadStatus.value = `Skipping unsupported type: ${file.name}`;
      }
    } catch (err) {
      console.error("File handling failed:", err);
      uploadStatus.value = `Failed: ${file.name}`;
    }
  }

  uploadingDoc.value = false;
  uploadStatus.value = "Done";
  setTimeout(() => (uploadStatus.value = ""), 2500);

  e.target.value = "";
}

async function sendFileTextToDoctor(text, label) {
  if (!text) return;

  addCaption(
    "user",
    `${label}\n\n${text.slice(0, 5000)}${text.length > 5000 ? "…" : ""}`,
    true,
  );
  finalTranscript.value.push({ role: "user", text: `${label}\n\n${text}` });

  for (const chunk of chunkString(`${label}\n\n${text}`, 1500)) {
    if (canSendControls.value) {
      await vapi?.send?.({
        type: "add-message",
        message: { role: "user", content: chunk },
      });
    } else {
      pendingMessages.push(chunk);
    }
  }
}

function chunkString(str, size = 1500) {
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

onMounted(() => {
  vapi = new Vapi(PUBLIC_KEY);

  vapi.on("status-update", (m) => {
    const blob = JSON.stringify(m).toLowerCase();
    if (
      !canSendControls.value &&
      (blob.includes("join") ||
        blob.includes("joined") ||
        blob.includes("connected") ||
        blob.includes("ready"))
    ) {
      canSendControls.value = true;
      flushControls();
      flushMessages();
    }
  });

  vapi.on("call-start", () => {
    callState.value = "active";
    callActive.value = true;
    startCallTimer();
    if (!canSendControls.value) {
      canSendControls.value = true;
      flushControls();
      flushMessages();
    }
  });

  vapi.on("message", (m) => {
    if (!m || !m.type) return;

    if (m.type === "transcript") {
      const role = m.role === "assistant" ? "assistant" : "user";
      const text = (m.transcript || "").trim();
      const final = m?.transcriptType
        ? m.transcriptType === "final"
        : !!m?.isFinal;
      addCaption(role, text, final);
      if (final && text) finalTranscript.value.push({ role, text });
    }

    if (
      m.type === "conversation-update" &&
      Array.isArray(m.conversation?.messages)
    ) {
      const last = m.conversation.messages[m.conversation.messages.length - 1];
      if (last && last.role) {
        const role = last.role === "assistant" ? "assistant" : "user";
        const text = normalizeContent(last.content);
        if (!text) return;
        addCaption(role, text, true);
        const prev = finalTranscript.value[finalTranscript.value.length - 1];
        if (!prev || prev.text !== text || prev.role !== role) {
          finalTranscript.value.push({ role, text });
        }
      }
    }
  });

  vapi.on("call-end", () => {
    handleCallEnd();
  });
  vapi.on("error", (e) => {
    handleVapiError(e?.error?.message || String(e?.error || e));
  });

  status.value = "Platform initialized. Select a doctor to start a session.";
  setTimeout(() => (status.value = ""), 5000);

  fetchLatestSummary();

  // Check for auto-start intent from ChatBot
  const autoStartDoctorId = localStorage.getItem("autoStartDoctor");
  if (autoStartDoctorId) {
    console.log("Found pending call for doctor ID:", autoStartDoctorId);
    localStorage.removeItem("autoStartDoctor");

    // Find doctor by ID
    const targetDoctor = doctors.value.find(d => d.id === autoStartDoctorId);

    if (targetDoctor) {
      console.log("Auto-starting call with:", targetDoctor.name);
      // Ensure Vapi is ready before starting the call
      // The `canSendControls.value` becoming true indicates Vapi is ready to interact.
      // We can wait for it or rely on the existing `flushControls` logic if `startCall` is called early.
      // For now, we'll just call `startCall` directly, assuming Vapi will handle queuing if not ready.
      startCall(targetDoctor);
    } else {
      console.warn("Could not find doctor with ID:", autoStartDoctorId);
    }
  }
});


onBeforeUnmount(() => {
  try {
    vapi?.stop?.();
  } catch (_) {}
  clearInterval(timerInterval);
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

.container {
  max-width: 1450px;
  margin: 0px auto 24px;
  overflow: hidden;
}

.call-surface {
  display: flex;
  flex-direction: column;
  background: transparent;
  border-radius: 0;
  overflow: visible;
  gap: 20px;
}

.call-center {
  width: 90%;
  background: #0b2038;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  color: #fff;
  height: 670px;
}

.call-layout {
  display: flex;
  gap: 50px;
  justify-content: center;
  align-items: flex-start;
}

.call-sidebar {
  width: 205px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 670px;
  overflow: hidden;
  position: relative;
}
.call-sidebar .sidebar-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.call-sidebar .sidebar-content::-webkit-scrollbar {
  width: 6px;
}
.call-sidebar .sidebar-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}
.call-sidebar .sidebar-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 14px;
  font-size: 13px;
  font-style: italic;
  color: #333;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  flex-direction: column;
  transition: background 0.2s;
  text-align: center;
}

.call-sidebar .sidebar-item i {
  color: #2a66b2;
  font-size: 14px;
}

.call-sidebar .sidebar-item:hover {
  background: #f5f7fb;
}

.call-sidebar .active {
  background: #2a66b2;
  color: #fff;
}

.call-sidebar .active i {
  color: #fff;
}

.call-sidebar .view-all {
  background: #2a66b2;
  color: #fff;
  padding: 20px;
  border: none;
  border-radius: 0 0 8px 8px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}

.call-sidebar .view-all:hover {
  background: #204d89;
}

.vid-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #444;
  margin-bottom: 12px;
  background: #111;
}

.vid-avatar img,
.vid-avatar i {
  width: 100%;
  height: 100%;
  object-fit: cover;
  font-size: 4rem;
  color: #1a73e8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doctor-profile {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.doctor-name {
  background: #000000;
  width: 300px;
  padding: 10px 25px;
  border-radius: 50px;
  margin-top: 15px;
}

.call-title {
  margin: 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: inline-block;
}

.call-title span {
  color: #ffeb3b;
  font-weight: 700;
}

.call-timer-big {
  margin-bottom: 14px;
  font-weight: 600;
  color: #ccc;
}

.call-cta-row {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: auto;
  margin-bottom: 16px;
}

.round-cta span {
  display: none;
}

.round-cta {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  border: none;
  cursor: pointer;
  background: #1f2937;
  color: #fff;
  transition:
    background 0.2s ease,
    transform 0.15s ease;
}

.round-cta i {
  font-size: 1.2rem;
}

.round-cta:hover {
  transform: scale(1.05);
  background: #374151;
}

.round-cta.end {
  background: #ef4444;
}

.round-cta.consult {
  background: #1a73e8;
}

.chat-wrap {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ddd;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  padding: 16px;
  width: 100%;
  margin-top: 20px;
}

.bubble-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
}

.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.bubble[data-role="assistant"] {
  align-self: flex-start;
  background: #e9f2ff;
  color: #111;
}

.bubble[data-role="user"] {
  align-self: flex-end;
  background: #1a73e8;
  color: #fff;
}

.bubble-meta {
  font-size: 0.75rem;
  opacity: 0.65;
  margin-bottom: 2px;
}

.upload-row {
  margin: 10px 0;
}

.attach-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px dashed #1a73e8;
  border-radius: 8px;
  background: #fff;
  color: #1a73e8;
  cursor: pointer;
  font-size: 0.9rem;
}

.attach-btn input {
  display: none;
}

.upload-status {
  font-size: 0.85rem;
  color: #555;
  margin-left: 10px;
}

.chat-composer {
  display: flex;
  gap: 8px;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.chat-composer input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.send-btn {
  background: #1a73e8;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0 16px;
  cursor: pointer;
}

.section-title {
  padding: 18px 24px 10px;
  font-size: 1.4rem;
  font-weight: 600;
  color: #111;
  display: flex;
  align-items: center;
  gap: 10px;
}
.new-c {
  padding: 1px 40px 10px;
}
.doctor-grid {
  display: grid;
  gap: 50px;
  padding: 16px 40px 28px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .doctor-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .doctor-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.doctor-card {
  width: auto;
  height: 360px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 30px;
  transition:
    transform 0.15s,
    box-shadow 0.2s;
}

.doctor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.doctor-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 16px;
}

.doctor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.doctor-details {
  text-align: center;
  margin-bottom: 16px;
}

.doctor-details .detail-item {
  font-family: "Roboto", sans-serif;
  font-weight: 600;
  font-size: 24px;
  line-height: 28px;
  color: #222222;
  margin-bottom: 12px;
}

.doctor-details .availability {
  font-family: "Roboto", sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #868686;
}

.availability-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.doctor-actions {
  display: flex;
  justify-content: center;
  margin-top: auto;
}

.doctor-actions .btn--call {
  width: 220px;
  height: 49px;
  background: #27548b;
  color: #ffffff;
  border-radius: 6px;
  border: none;
  font-family: "Roboto", sans-serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 19px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.doctor-actions .btn--call:hover {
  background: #1d3f68;
}

.status {
  text-align: center;
  padding: 14px;
  font-size: 1rem;
  color: #555;
}

.call-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.call-popup {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 420px;
  max-width: 90%;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.2s ease-in-out;
}

.call-popup .call-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.call-popup .call-avatar {
  font-size: 2rem;
  color: #1a73e8;
}

.call-popup .call-info h3 {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
}

.call-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.end-call-btn {
  background: #1a73e8;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.listening-pill {
  background: #000000;
  color: #fff;
  padding: 10px 25px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  margin-top: 15px;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.bars span {
  display: block;
  width: 3px;
  height: 4px;
  background: #fff;
  border-radius: 2px;
  animation: bounce 1s infinite ease-in-out;
}

.bars span:nth-child(1) {
  animation-delay: 0s;
}

.bars span:nth-child(2) {
  animation-delay: 0.2s;
}

.bars span:nth-child(3) {
  animation-delay: 0.4s;
}

.bars span:nth-child(4) {
  animation-delay: 0.6s;
}

@keyframes bounce {
  0%,
  100% {
    height: 4px;
  }

  50% {
    height: 14px;
  }
}

.all-summaries-section {
  padding: 40px;
  background: #f9fbff;
  min-height: 680px;
}

.summaries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.summaries-header h2 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  background: #2a66b2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}
.back-btn:hover {
  background: #204d89;
}

.summaries-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.summary-card {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}

.summary-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #27548b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.summary-info {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
}

.summary-info p {
  margin: 6px 0;
}

.summary-meta {
  margin-top: 12px;
  font-size: 0.85rem;
  color: #777;
  display: flex;
  align-items: center;
  gap: 6px;
}

.no-summaries {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 1rem;
}

.no-summaries i {
  font-size: 3rem;
  margin-bottom: 10px;
  color: #ccc;
}
</style>
