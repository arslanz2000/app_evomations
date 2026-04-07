<template>
  <div class="chat-container">
    <div class="chat">
      <header class="chat__bar">
        <img src="/dr-sophie.png" alt="Dr Sophie" class="doctor-img" />
        <span style="margin-left:15px;">Dr Sophie — General Physician</span>
        <button
          v-if="messages.length > 1"
          class="download-btn"
          @click="downloadSummary"
          :disabled="summarizing"
          title="Download conversation summary"
        >
          <i class="fas" :class="summarizing ? 'fa-spinner fa-spin' : 'fa-file-download'"></i>
          {{ summarizing ? 'Generating…' : 'Download Summary' }}
        </button>
      </header>

      <main class="chat__body" ref="scrollEl">
        <div v-for="(m, i) in messages" :key="i" class="msg" :data-role="m.role">
          <div class="msg__bubble">
            <div class="msg__role">{{ m.role === 'user' ? 'You' : 'Doctor' }}</div>

            <template v-if="Array.isArray(m.content)">
              <template v-for="(part, pi) in m.content" :key="pi">
                <p v-if="part?.type === 'text'" class="msg__text">{{ part.text }}</p>
                <img v-else-if="part?.type === 'image_url' && part?.image_url?.url" class="msg__img"
                  :src="part.image_url.url" alt="uploaded" />
              </template>
            </template>
            <div v-else class="msg__text markdown-body" v-html="renderMarkdown(m.content)"></div>
          </div>
        </div>

        <div v-if="loading" class="msg" data-role="assistant">
          <div class="msg__bubble">
            <div class="dots"><span></span><span></span><span></span></div>
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
      </main>

      <form class="composer new-composer" @submit.prevent="send">
        <input
          v-model="input"
          :disabled="loading"
          class="composer-input"
          placeholder="How can I help you?"
          autocomplete="off"
        />

        <div class="composer-actions">
          <button class="send-btn" :disabled="!canSend || loading" title="Send">
            <i class="fas fa-arrow-right"></i>
          </button>

          <button type="button" class="attach-btn" @click="pickAttach">
            <i class="fas fa-plus"></i>
          </button>

          <input
            ref="filePicker"
            type="file"
            accept="image/*"
            multiple
            class="hidden-input"
            @change="onPickImages"
          />
        </div>
      </form>
    </div>

    <!-- VOICE AGENT CARD -->
    <div class="voice-card">
      <div class="voice-header">
        <div class="voice-info">
          <h3>Talk to Dr. Sophie — General Physician</h3>
          <p>Voice consultation available now</p>
        </div>
        <button class="btn-call" @click="navigateToVoice">
          <i class="fas fa-phone-alt"></i> Start Call
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { marked } from 'marked'
import { jsPDF } from 'jspdf'

const emit = defineEmits(['navigate'])

// -- CHAT LOGIC --
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions'
const model = 'gpt-4o-mini'
const SYSTEM_PROMPT = `You are a licensed general physician. Answer as a doctor would: empathetic, clear, and evidence-based. 
- Ask concise clarifying questions when needed.
- Provide general guidance and red-flag advice; do not diagnose definitively without examination.
- Suggest when to seek urgent care.
- Keep answers concise with short paragraphs or bullet points.`

const messages = ref([
  { role: 'assistant', content: 'Hello—I\'m your virtual general physician. How can I help you today?' }
])

function renderMarkdown(text) {
  if (!text) return '';
  return marked.parse(String(text));
}
const input = ref('')
const loading = ref(false)
const error = ref('')
const scrollEl = ref(null)
const filePicker = ref(null);
function pickAttach() {
  filePicker.value?.click();
}
const pendingImages = ref([])

const canSend = computed(() => input.value.trim().length || pendingImages.value.length)

const scrollToBottom = async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function onPickImages(e) {
  const files = Array.from(e.target?.files || [])
  if (!files.length) return
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    if (f.size > 8 * 1024 * 1024) { continue }
    fileToDataUrl(f).then(url => pendingImages.value.push({ url, file: f }))
  }
  e.target.value = ''
}

function removePending(idx) {
  pendingImages.value.splice(idx, 1)
}

function buildPayloadMessages() {
  const prior = messages.value.map(m => {
    if (Array.isArray(m.content)) return { role: m.role, content: m.content }
    return { role: m.role, content: [{ type: 'text', text: String(m.content || '') }] }
  })

  return [
    { role: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
    ...prior
  ]
}
async function send() {
  const text = input.value.trim()
  if (!text && !pendingImages.value.length) return
  if (loading.value) return
  error.value = ''

  const userContent = []
  if (text) userContent.push({ type: 'text', text })
  for (const p of pendingImages.value) {
    userContent.push({ type: 'image_url', image_url: { url: p.url } })
  }

  messages.value.push({ role: 'user', content: userContent.length ? userContent : [{ type: 'text', text: '' }] })
  input.value = ''
  pendingImages.value = []
  loading.value = true
  await scrollToBottom()

  try {
    const payload = {
      model,
      messages: [
        ...buildPayloadMessages(),
        { role: 'user', content: userContent }
      ],
      temperature: 0.7,
      max_tokens: 600
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const info = await res.json().catch(() => ({}))
      throw new Error(info?.error?.message || `HTTP ${res.status}`)
    }

    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content
    const replyText = Array.isArray(reply)
      ? reply.filter(p => p?.type === 'text').map(p => p.text).join('\n\n')
      : (reply || '')

    messages.value.push({ role: 'assistant', content: replyText || '(no reply)' })
  } catch (e) {
    console.error(e)
    error.value = `Request failed: ${e.message}`
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

// -- DOWNLOAD SUMMARY --
const summarizing = ref(false)

function getConversationLines() {
  return messages.value.map(m => {
    let text = ''
    if (Array.isArray(m.content)) {
      text = m.content.filter(p => p?.type === 'text').map(p => p.text).join(' ').trim() || '[Image attached]'
    } else {
      text = String(m.content || '').trim()
    }
    return { role: m.role, text }
  }).filter(l => l.text)
}

function toConversationText(lines) {
  return lines.map(l => `${l.role === 'assistant' ? 'Doctor' : 'Patient'}: ${l.text}`).join('\n')
}

function buildHeuristicSections(lines) {
  const dedupe = arr => Array.from(new Set(arr.map(t => String(t).trim()))).filter(Boolean)
  const userU = lines.filter(l => l.role !== 'assistant').map(l => l.text).filter(t => t.split(/\s+/).length > 2)
  const docU = lines.filter(l => l.role === 'assistant').map(l => l.text).filter(t => t.split(/\s+/).length > 2)
  const obsKw = /(seem|observ|finding|exam|likely|stable|normal|abnormal|range|vitals|labs?|scan|imaging|x-?ray|mri|ct)/i
  const recKw = /(should|recommend|advise|consider|monitor|avoid|increase|decrease|start|stop|take|use|apply|dose|dosage)/i
  const nextKw = /(next|follow[- ]?up|schedule|book|test|lab|scan|referr|see|appointment|blood|results|recheck|review)/i
  return {
    key_points: dedupe([...userU.slice(0, 4), ...docU.slice(0, 2)]).slice(0, 8),
    observations: dedupe(docU.filter(t => obsKw.test(t))).slice(0, 10),
    suggestions: dedupe(docU.filter(t => recKw.test(t))).slice(0, 12),
    next_steps: dedupe(docU.filter(t => nextKw.test(t))).slice(0, 10),
    important_notes: [
      'This report is auto-generated from a virtual conversation.',
      'It is not a diagnosis or a substitute for in-person medical care.',
      'Seek urgent care if symptoms worsen or new severe symptoms develop.',
    ],
  }
}

async function generateReportWithGPT(convoText) {
  const sys = `You are a medical scribe. Produce a concise, de-duplicated report from a virtual consultation transcript.
Do NOT invent facts. Use only the transcript content.
Return STRICT JSON with this shape:
{"key_points":string[],"observations":string[],"suggestions":string[],"next_steps":string[],"important_notes":string[]}
Each item should be a short bullet (<= 20 words). Include a generic safety disclaimer inside "important_notes".`

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sys }, { role: 'user', content: `Physician: Dr. Sophie\n\nTranscript:\n${convoText}` }],
      temperature: 0.2,
    }),
  })
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}`)
  const data = await resp.json()
  let json = {}
  try { json = JSON.parse(data?.choices?.[0]?.message?.content || '{}') } catch (_) { }
  const ensure = a => (Array.isArray(a) ? a.filter(Boolean) : [])
  return {
    key_points: ensure(json.key_points),
    observations: ensure(json.observations),
    suggestions: ensure(json.suggestions),
    next_steps: ensure(json.next_steps),
    important_notes: ensure(json.important_notes),
  }
}

async function downloadSummary() {
  if (summarizing.value) return
  summarizing.value = true
  try {
    const lines = getConversationLines()
    const convoText = toConversationText(lines)
    const started = new Date().toLocaleString('en-PK', { dateStyle: 'long', timeStyle: 'short' })

    let sections
    try {
      sections = await generateReportWithGPT(convoText)
    } catch (e) {
      console.error('GPT report failed, using fallback:', e)
      sections = buildHeuristicSections(lines)
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 16
    const maxW = pageW - margin * 2
    let y = margin
    const BRAND = { r: 26, g: 115, b: 232 }
    const MUTED = 120

    // Header
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
    doc.rect(0, 0, pageW, 26, 'F')
    doc.setTextColor(255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Consultation Report', margin, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Auto-generated from your virtual consultation', margin, 22)

    // Info chips
    y = 34
    doc.setTextColor(0);
    ['Physician', 'Date', 'Type'].forEach((label, idx) => {
      const values = { Physician: 'Dr. Sophie', Date: started, Type: 'Text Chat' }
      const chipW = (pageW - margin * 2) / 3 - 4
      const x = margin + idx * (chipW + 6)
      doc.setFontSize(8)
      doc.setTextColor(MUTED)
      doc.text(label.toUpperCase(), x + 3, y + 4)
      doc.setFontSize(11)
      doc.setTextColor(0)
      const vLines = doc.splitTextToSize(values[label], chipW - 6)
      doc.text(vLines, x + 3, y + 8)
    })
    y += 18

    // Divider
    doc.setDrawColor(210)
    doc.setLineWidth(0.4)
    doc.line(margin, y, pageW - margin, y)
    y += 4

    function ensureSpace(n = 1) {
      if (y + n * 6 + 14 > pageH - margin) { doc.addPage(); y = margin + 2 }
    }

    function section(title, bulletsArr) {
      ensureSpace(3)
      doc.setFillColor(240, 244, 255)
      doc.setDrawColor(220)
      doc.roundedRect(margin, y, maxW, 10, 2, 2, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
      doc.text(title, margin + 4, y + 7)
      y += 14
      if (!bulletsArr || !bulletsArr.length) {
        doc.setTextColor(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
        doc.text('— none —', margin, y); doc.setTextColor(0); y += 6
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(0)
        for (const t of bulletsArr) {
          const ls = doc.splitTextToSize(String(t), maxW - 8)
          ensureSpace(ls.length)
          doc.setFont('helvetica', 'bold'); doc.text('•', margin + 1, y)
          doc.setFont('helvetica', 'normal'); doc.text(ls, margin + 6, y)
          y += 6 * Math.max(1, ls.length)
        }
      }
      y += 2
    }

    section('Key Points Discussed', sections.key_points)
    section('Observations', sections.observations)
    section('Suggestions', sections.suggestions)
    section('Next Steps / Follow-up', sections.next_steps)
    section('Important Notes', sections.important_notes?.length ? sections.important_notes : [
      'This report is auto-generated from a virtual conversation.',
      'It is not a diagnosis or a substitute for in-person medical care.',
      'Seek urgent care if symptoms worsen or new severe symptoms develop.',
    ])

    // Page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(MUTED)
      doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 6, { align: 'right' })
    }

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    doc.save(`Dr-Sophie__${stamp}__consultation.pdf`)
  } finally {
    summarizing.value = false
  }
}

// -- NAVIGATION ONLY --
function navigateToVoice() {
    localStorage.setItem("autoStartDoctor", "dr-sophie"); 
    emit('navigate', 'doctors')
}
</script>

<style scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 1150px;
    margin: 0 auto;
    gap: 20px;
}

.chat {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 65vh;
  min-height: 320px;
}

/* Voice Card Styles */
.voice-card {
    background: linear-gradient(135deg, #1a73e8, #0048a8);
    border-radius: 16px;
    padding: 16px 24px;
    color: white;
    box-shadow: 0 8px 20px rgba(26, 115, 232, 0.25);
    transition: all 0.3s ease;
}

.voice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.voice-info h3 { margin: 0; font-size: 1.1rem; }
.voice-info p { margin: 4px 0 0; font-size: 0.9rem; opacity: 0.9; }

.btn-call {
    background: white;
    color: #1a73e8;
    border: none;
    padding: 10px 20px;
    border-radius: 99px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s;
}
.btn-call:hover { transform: scale(1.05); }

.voice-active {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.active-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.timer {
    font-family: monospace;
    font-size: 1.2rem;
    font-weight: 600;
}

.status-badge {
    background: rgba(255,255,255,0.2);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.85rem;
}

.active-controls {
    display: flex;
    gap: 12px;
}

.ctrl-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.2);
    color: white;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 1.1rem;
    transition: background 0.2s;
}
.ctrl-btn:hover { background: rgba(255,255,255,0.3); }
.ctrl-btn.active { background: white; color: #1a73e8; }
.end-btn { background: #fee2e2; color: #ef4444; }
.end-btn:hover { background: #fecaca; }

/* Pulsing animation for active call */
.pulsing-blob {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #4ade80;
	box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
	animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
	0% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
	}

	70% {
		transform: scale(1);
		box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
	}

	100% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
	}
}

/* Existing Chat Styles... keeping them mostly as is but ensuring responsiveness */

.doctor-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.chat__bar {
  background: linear-gradient(135deg, #1a73e8, #0048a8);
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: start;
  padding: 18px 26px;
  letter-spacing: -0.3px;
}

.chat__bar small {
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.85;
}

.download-btn {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 7px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
  white-space: nowrap;
}
.download-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.chat__body {
  padding: 20px 28px;
  overflow-y: auto;
  background: linear-gradient(180deg, #f8faff 0%, #f9fbff 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  scroll-behavior: smooth;
}

.msg {
  display: flex;
  align-items: flex-end;
}

.msg[data-role="user"] {
  justify-content: flex-end;
}

.msg__bubble {
  max-width: 70%;
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  line-height: 1.5;
  transition: transform 0.2s ease;
}

.msg__bubble:hover {
  transform: translateY(-2px);
}

.msg[data-role="assistant"] .msg__bubble {
  background:#F3F3F3;
  color: #000;
  border-top-left-radius: 6px;
}

.msg[data-role="user"] .msg__bubble {
  background: #e3f2ff;
  color: #0a244a;
  border-top-right-radius: 6px;
}

.msg__role {
  font-size: 0.8rem;
  opacity: 0.75;
  margin-bottom: 4px;
  font-weight: 600;
}

.msg__text {
  margin: 0;
  font-size: 0.95rem;
}

.msg__img {
  display: block;
  max-width: 200px;
  border-radius: 10px;
  margin-top: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.dots {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.dots span {
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
  opacity: 0.8;
}

.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
}

.composer {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 12px 16px;
  background: #f8faff;
  border-top: 1px solid #e0e6ef;
  gap: 10px;
}

.attach__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #1a73e8;
  background: #eaf3ff;
  border: 1px solid #bcd9ff;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.attach__btn:hover {
  background: #d9ebff;
}

.attach__btn input {
  display: none;
}

.composer input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
}

.send {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1a73e8, #2563eb);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(26, 115, 232, 0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.send:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(26, 115, 232, 0.5);
}

.send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.thumbs {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.thumb {
  position: relative;
}

.thumb img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #d0d7e2;
}

.thumb__x {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
}

.error {
  background: #ffe5e5;
  color: #a91e1e;
  border: 1px solid #f2b2b2;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  margin: 10px 16px;
}
.new-composer {
  display: flex;
  align-items: center;
  background: #27548B;
  padding: 20px 16px;
  gap: 12px;
  border-radius: 10px;
  margin: 16px;
}

.composer-input {
  flex: 1;
  background:#27548B;
  padding: 12px 16px;
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  border: none;
}

.composer-input::placeholder {
  color: rgba(255, 255, 255, 0.75);
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-btn,
.attach-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  display: grid;
  place-items: center;
  background: #ffffff33;
  color: #fff;
  cursor: pointer;
  transition: 0.2s ease;
  font-size: 1.1rem;
}

.send-btn:hover,
.attach-btn:hover {
  background: #ffffff55;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hidden-input {
  display: none;
}

/* MARKDOWN STYLES */
.markdown-body {
  line-height: 1.5;
}
.markdown-body :deep(strong) {
  font-weight: 700;
  color: inherit;
}
.markdown-body :deep(ul), 
.markdown-body :deep(ol) {
  margin: 4px 0 8px 20px;
  padding: 0;
}
.markdown-body :deep(li) {
  margin-bottom: 4px;
}
.markdown-body :deep(p) {
  margin-bottom: 8px;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}
.markdown-body :deep(h1), 
.markdown-body :deep(h2), 
.markdown-body :deep(h3) {
  font-size: 1.1em;
  font-weight: 700;
  margin: 12px 0 6px;
}

/* MOBILE ADJUSTMENTS */
@media (max-width: 768px) {
  .chat-container {
    gap: 12px;
  }
  .chat {
    height: 70vh;
  }
  .msg__bubble {
    max-width: 85%;
  }
  .voice-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  .btn-call {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .chat__bar {
    padding: 14px 18px;
    font-size: 1.1rem;
  }
  .chat__bar img {
    width: 32px;
    height: 32px;
  }
  .chat__body {
    padding: 16px;
  }
  .new-composer {
    margin: 12px 10px;
    padding: 12px;
  }
  .composer-input {
    font-size: 1rem;
  }
  .send-btn, .attach-btn {
    width: 44px;
    height: 44px;
  }
  .msg__bubble {
    font-size: 1rem;
    padding: 12px 16px;
    max-width: 92%;
  }
}
</style>
