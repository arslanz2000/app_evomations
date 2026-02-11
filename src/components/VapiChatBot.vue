<template>
  <div class="chat-container">
    <div class="chat">
      <header class="chat__bar">
        <img src="/dr-sophie.png" alt="Dr Sophie" class="doctor-img" />
        <span style="margin-left:15px;">Dr Sophie — General Physician</span>
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
import { marked } from 'marked';

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
    max-width: 960px;
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
  height: 65vh; /* Reduced height to make room for voice card */
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
  margin: 30px;
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
</style>
