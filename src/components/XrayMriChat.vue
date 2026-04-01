<template>
  <div class="chat">
    <header class="chat__bar">
      <span>Radiology Assistant — X-ray / MRI</span>
      <small v-if="model">· {{ model }}</small>
    </header>

    <main class="chat__body" ref="scrollEl">
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="msg"
        :data-role="m.role"
      >
        <div class="msg__bubble">
          <div class="msg__role">{{ m.role === 'user' ? 'You' : 'Radiologist AI' }}</div>

          <template v-if="Array.isArray(m.content)">
            <template v-for="(part, pi) in m.content" :key="pi">
              <p v-if="part?.type === 'text'" class="msg__text">{{ part.text }}</p>
              <img
                v-else-if="part?.type === 'image_url' && part?.image_url?.url"
                class="msg__img"
                :src="part.image_url.url"
                alt="uploaded"
              />
            </template>
          </template>
          <p v-else class="msg__text">{{ m.content }}</p>
        </div>
      </div>

      <div v-if="loading" class="msg" data-role="assistant">
        <div class="msg__bubble">
          <div class="dots"><span></span><span></span><span></span></div>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </main>

    <form class="composer" @submit.prevent="send">
      <div class="attach">
        <label class="attach__btn" title="Upload X-ray/MRI">
          <input type="file" accept="image/*" multiple @change="onPickImages" />
          <i class="fas fa-x-ray" aria-hidden="true"></i>
          <span>X-ray / MRI</span>
        </label>

        <div v-if="pendingImages.length" class="thumbs">
          <div v-for="(p, idx) in pendingImages" :key="idx" class="thumb">
            <img :src="p.url" alt="preview" />
            <button
              type="button"
              class="thumb__x"
              @click="removePending(idx)"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <input
        v-model="input"
        :disabled="loading"
        placeholder="Upload X-rays/MRIs and ask questions about them…"
        autocomplete="off"
      />
      <button class="send" :disabled="!canSend || loading" title="Send">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M2 21l21-9L2 3v7l15 2-15 2v7z"
            fill="currentColor"
          />
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'


const API_KEY = "AIzaSyAPYVhrYExW8E6_LXhIMuiRIMmy0JdT0Kg"
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
  API_KEY
const model = "gemini-2.5-flash"

const messages = ref([
  {
    role: 'assistant',
    content:
      'Hello — I can help analyze X-rays and MRIs. Please upload your scans and describe your concern.'
  }
])


const history = ref([])
const systemPreamble = {
  role: 'user',
parts: [
    {
      text: `You are an expert radiology assistant specializing in X-ray and MRI analysis.
Always respond in a clear, structured format:

1. **Observations** — Describe visible features in the scan (bullet points).
2. **Possible interpretations** — Provide potential explanations in simple terms, without giving a definitive diagnosis.
3. **Safety disclaimer** — Always remind the user: "This is not a medical diagnosis. Please consult a licensed radiologist for confirmation."

Be concise, avoid overconfidence, and highlight if urgent review may be necessary.`
    }
  ]
}

const input = ref('')
const loading = ref(false)
const error = ref('')
const scrollEl = ref(null)
const pendingImages = ref([]) 

const canSend = computed(
  () => input.value.trim().length > 0 || pendingImages.value.length > 0
)

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

async function onPickImages(e) {
  const files = Array.from(e.target?.files || [])
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    if (f.size > 10 * 1024 * 1024) continue
    const url = await fileToDataUrl(f)
    pendingImages.value.push({ url, file: f })
  }
  e.target.value = ''
}

function removePending(idx) {
  pendingImages.value.splice(idx, 1)
}

function dataUrlToInlineData(url, fallbackType = 'image/png') {
  const [meta, b64] = String(url).split(',')
  const mime = meta?.match(/^data:(.*?);base64$/)?.[1] || fallbackType
  return { inline_data: { mime_type: mime, data: b64 } }
}

async function send() {
  if (loading.value) return

  const text = input.value.trim()
  if (!text && !pendingImages.value.length) return

  error.value = ''

  const displayParts = []
  if (text) displayParts.push({ type: 'text', text })
  for (const p of pendingImages.value) {
    displayParts.push({ type: 'image_url', image_url: { url: p.url } })
  }
  messages.value.push({ role: 'user', content: displayParts })

  const apiParts = []
  if (text) apiParts.push({ text })
  for (const p of pendingImages.value) {
    apiParts.push(dataUrlToInlineData(p.url, p.file?.type || 'image/png'))
  }

  input.value = ''
  pendingImages.value = []
  loading.value = true
  await scrollToBottom()

  try {
    const contents = history.value.length ? [...history.value] : [systemPreamble]
    contents.push({ role: 'user', parts: apiParts })

    const payload = { contents }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const parts = data?.candidates?.[0]?.content?.parts || []
    const reply = parts.map(p => p.text).filter(Boolean).join('\n').trim()

    messages.value.push({ role: 'assistant', content: reply || '(no reply)' })

    history.value.push({ role: 'user', parts: apiParts })
    history.value.push({ role: 'model', parts: [{ text: reply || '' }] })
  } catch (e) {
    error.value = `Request failed: ${e.message}`
    console.error(e)
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.chat { max-width: 820px; margin: 24px auto; background: var(--panel-solid, #0b1220);
        border: 1px solid var(--ring, #1d263a); border-radius: 16px; display: grid;
        grid-template-rows: auto 1fr auto; height: 76vh; box-shadow: 0 8px 28px rgba(0,0,0,.18); }
.chat__bar { display:flex; align-items:center; gap:8px; padding:12px 16px;
            background: linear-gradient(120deg, #23345a, #1a73e8); color:#fff; font-weight:600; border-top-left-radius:16px; border-top-right-radius:16px; }
.chat__body { overflow:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }

.msg { display:flex; }
.msg[data-role="user"] { justify-content: flex-end; }
.msg__bubble { max-width: 72%; padding: 12px 14px; border-radius: 14px; line-height: 1.4; box-shadow: 0 6px 18px rgba(0,0,0,.12); }
.msg[data-role="assistant"] .msg__bubble { background:#0f2246; border:1px solid rgba(86,144,255,.35); color:#e8f0ff; }
.msg[data-role="user"] .msg__bubble { background:#1a4d2e; border:1px solid rgba(51,225,131,.35); color:#dbffec; }
.msg__role { font-size:.75rem; opacity:.7; margin-bottom:4px; }
.msg__text { white-space: pre-wrap; word-break: break-word; margin: 0 0 8px; }
.msg__img { display:block; max-width: 240px; max-height: 240px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18); margin: 6px 0; }

.dots { display:inline-flex; gap:4px; align-items:center; }
.dots span { width:8px; height:8px; background: currentColor; opacity:.85; border-radius:50%; animation: bounce 1.2s infinite; }
.dots span:nth-child(2){ animation-delay:.2s } .dots span:nth-child(3){ animation-delay:.4s }
@keyframes bounce { 0%, 80%, 100% { transform: translateY(0) } 40% { transform: translateY(-4px) } }

.composer { display:grid; grid-template-columns: auto 1fr auto; gap:10px; align-items:start; padding:12px; border-top:1px solid var(--ring, #1d263a); background: var(--panel, #0f172a); }
.composer input { padding:12px 14px; border-radius:12px; border:1px solid var(--ring, #1d263a); background: var(--panel-solid, #0b1220); color: var(--text, #e6eeff); }
.send { width:46px; height:46px; border:0; border-radius:12px; background:#22c55e; color:#fff; display:grid; place-items:center; cursor:pointer; box-shadow:0 6px 16px rgba(34,197,94,.35); }
.send:disabled { filter: grayscale(.5) brightness(.85); cursor:not-allowed; }

.attach { display:flex; flex-direction:column; gap:8px; }
.attach__btn { display:inline-flex; align-items:center; gap:8px; padding:10px 12px; border-radius:10px; background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#e6eeff; cursor:pointer; font-weight:600; }
.attach__btn input { display:none; }
.thumbs { display:flex; flex-wrap:wrap; gap:8px; max-width: 240px; }
.thumb { position:relative; }
.thumb img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,.18); }
.thumb__x { position:absolute; top:-6px; right:-6px; width:20px; height:20px; border:0; border-radius:50%; background:#ef4444; color:#fff; cursor:pointer; }

.error { grid-column: 1 / -1; color:#ffb4b4; background: rgba(255,0,0,.08); border:1px solid rgba(255,0,0,.22); padding:8px 10px; border-radius:10px; margin: 8px 12px; }

@media (max-width: 768px) {
  .chat { margin: 12px; height: 80vh; min-height: 400px; }
  .msg__bubble { max-width: 85%; }
  .msg__img { max-width: 180px; max-height: 180px; }
  .attach__btn span { display: none; }
  .thumbs { max-width: 160px; }
}

@media (max-width: 480px) {
  .chat { margin: 8px; height: 82vh; border-radius: 12px; }
  .chat__bar { padding: 10px 12px; font-size: 0.9rem; }
  .chat__body { padding: 10px; }
  .composer { gap: 6px; padding: 8px; }
  .composer input { padding: 10px; font-size: 0.9rem; }
  .msg__bubble { max-width: 90%; padding: 10px 12px; }
  .msg__img { max-width: 140px; max-height: 140px; }
  .send { width: 40px; height: 40px; }
  .thumb img { width: 56px; height: 56px; }
}
</style>
  