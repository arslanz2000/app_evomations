<template>
  <div class="chat">
    <!-- Text area where we send prompt -->
    <textarea v-model="prompt" rows="12" placeholder="Type or upload a PDF…"></textarea>

    <div class="meta">
      <span>Chars: {{ prompt.length.toLocaleString() }}</span>
      <span>~Tokens: {{ estTokens }}</span>
    </div>

    <div class="row">
      <input type="file" accept="application/pdf" @change="handlePdfUpload" />
      <label class="toggle">
        <input type="checkbox" v-model="autoSummarize" />
        Auto-summarize after upload
      </label>
      <span v-if="extracting" class="status">Extracting PDF…</span>
    </div>

    <div class="row">
      <button @click="ask" :disabled="loading || !prompt.trim()">
        {{ loading ? "Thinking…" : "Send" }}
      </button>
      <button class="secondary" @click="copyPrompt" :disabled="!prompt">Copy prompt</button>
      <button class="ghost" @click="clearAll" :disabled="loading && !error && !answer">Clear</button>
    </div>

    <div v-if="error" class="error">Error: {{ error }}</div>

    <div v-if="answer" class="answer">
      <h4>Response</h4>
      <pre style="white-space: pre-wrap; margin: 0">{{ answer }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import * as pdfjsLib from "pdfjs-dist"

// ✅ Tell pdf.js where to find its worker file (no default import!)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString()

const prompt = ref("")
const answer = ref("")
const error = ref("")
const loading = ref(false)
const extracting = ref(false)
const autoSummarize = ref(true)

// Limit how much raw PDF text we paste into the textarea (to avoid giant prompts)
const MAX_CHARS = 120_000  // adjust as you like

// Rough token estimate (OpenAI-ish)
const estTokens = computed(() => Math.ceil(prompt.value.length / 4))

function clearAll() {
  prompt.value = ""
  answer.value = ""
  error.value = ""
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(prompt.value)
  } catch { /* ignore */ }
}

// --- PDF -> text and put it into textarea ---
async function handlePdfUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  extracting.value = true
  error.value = ""

  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let chunks = []
    let totalExtractedChars = 0

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const txt = await page.getTextContent()
      const pageText = txt.items.map(t => t.str).join(" ")
        .replace(/\s+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")

      chunks.push(`\n\n--- Page ${i} of ${pdf.numPages} ---\n${pageText}`)
      totalExtractedChars += pageText.length
    }

    let fullText = chunks.join("")
    if (fullText.length > MAX_CHARS) {
      fullText = fullText.slice(0, MAX_CHARS) + "\n\n[Truncated for length]"
    }

    if (totalExtractedChars < 200) {
      fullText += "\n\n[Note: Very little text was extracted. This PDF might be scanned/images. Consider OCR first.]"
    }

    // Prepend a simple instruction so you can press Send right away.
    prompt.value =
`Summarize the following PDF in 5–8 bullet points and end with a 1-line TL;DR.
If it's a CV/resume, include skills, experience, notable achievements, and tools.

[BEGIN PDF TEXT: ${file.name}]
${fullText}
[END PDF TEXT]`

    if (autoSummarize.value) {
      setTimeout(() => ask(), 0)
    }
  } catch (err) {
    console.error(err)
    error.value = "Failed to read PDF"
  } finally {
    extracting.value = false
  }
}

// --- Responses API helpers ---
function extractOutputText(json) {
  return (
    json.output_text ||
    json.output?.[json.output.length - 1]?.content?.[0]?.text ||
    json.response?.output_text ||
    ""
  )
}

async function ask() {
  if (!prompt.value.trim()) return
  loading.value = true
  answer.value = ""
  error.value = ""
  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",   // or "gpt-4o"
        input: prompt.value,
        max_output_tokens: 900, // optional
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || "Request failed")
    answer.value = extractOutputText(data) || "(no content)"
  } catch (err) {
    error.value = err.message || String(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.chat { display: grid; gap: 12px; max-width: 720px; margin: 24px auto; }
.row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.meta { display: flex; gap: 12px; font-size: 12px; color: #6b7280; }
.status { font-size: 12px; color: #6b7280; }
textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; font: inherit; }
input[type=file] { margin: 6px 0; }
button { width: fit-content; padding: 10px 14px; border: 0; border-radius: 10px; background: #4f46e5; color: #fff; cursor: pointer; }
button.secondary { background: #111827; }
button.ghost { background: #e5e7eb; color: #111827; }
button:disabled { background: #9ca3af; cursor: not-allowed; }
.answer, .error { padding: 12px; border-left: 3px solid; background: #f9fafb; border-radius: 8px; overflow-x: auto; }
.answer { border-left-color: #4f46e5; }
.error { border-left-color: #dc2626; }

@media (max-width: 600px) {
  .chat { margin: 12px; gap: 10px; }
  textarea { font-size: 0.95rem; }
  button { padding: 9px 12px; font-size: 0.9rem; }
}

@media (max-width: 480px) {
  .chat { margin: 8px; }
  .row { gap: 8px; }
  button { padding: 8px 10px; font-size: 0.85rem; }
}
</style>
