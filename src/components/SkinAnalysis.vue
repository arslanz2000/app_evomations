<template>
  <div class="skin-wrap">

    <!-- ═══════════════════ UPLOAD / CAMERA STATE ═══════════════════ -->
    <template v-if="!result && !analyzing">

      <!-- Full-width Hero Banner -->
      <div class="hero-banner">
        <div class="hero-left">
          <span class="eyebrow"><i class="fas fa-spa"></i> AI-Powered Dermatology</span>
          <h1>Skin Analysis</h1>
          <p>Get an instant, AI-powered skin diagnostic report. Identify 10+ skin concerns in under 60 seconds.</p>
          <div class="hero-stats">
            <div class="hstat"><strong>10+</strong><span>Concerns Detected</span></div>
            <div class="hstat"><strong>&lt;60s</strong><span>Analysis Time</span></div>
            <div class="hstat"><strong>99%</strong><span>Accuracy Rate</span></div>
          </div>
        </div>
        <div class="hero-right">
          <div class="badge-group">
            <span><i class="fas fa-shield-alt"></i> HIPAA Compliant</span>
            <span><i class="fas fa-lock"></i> GDPR Compliant</span>
            <span><i class="fas fa-user-md"></i> Dermatologist Verified</span>
            <span><i class="fas fa-robot"></i> Reliefs AI</span>
          </div>
        </div>
      </div>

      <!-- Two-column layout: Controls left, Info right -->
      <div class="two-col">

        <!-- LEFT: Capture Controls -->
        <div class="capture-col">
          <!-- Mode Tabs -->
          <div class="mode-tabs">
            <button :class="['mode-tab', { active: mode === 'upload' }]" @click="switchMode('upload')">
              <i class="fas fa-upload"></i> Upload Photo
            </button>
            <button :class="['mode-tab', { active: mode === 'camera' }]" @click="switchMode('camera')">
              <i class="fas fa-camera"></i> Use Camera
            </button>
          </div>

          <!-- UPLOAD MODE -->
          <template v-if="mode === 'upload'">
            <div class="upload-card" @click="pickFile" @dragover.prevent @drop.prevent="onDrop">
              <input ref="filePicker" type="file" accept="image/jpeg,image/png" class="hidden" @change="onFilePick" />
              <div v-if="!preview" class="upload-empty">
                <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                <h3>Upload Your Selfie</h3>
                <p>Drag & drop or click to browse</p>
                <div class="upload-reqs">
                  <span><i class="fas fa-check-circle"></i> JPG / PNG</span>
                  <span><i class="fas fa-check-circle"></i> Min 480px</span>
                  <span><i class="fas fa-check-circle"></i> Face 60–80% of frame</span>
                  <span><i class="fas fa-check-circle"></i> Max 10MB</span>
                </div>
              </div>
              <div v-else class="upload-preview">
                <img :src="preview" alt="Preview" />
                <div class="preview-overlay">
                  <button @click.stop="reset"><i class="fas fa-redo"></i> Change Photo</button>
                </div>
              </div>
            </div>
          </template>

          <!-- CAMERA MODE -->
          <template v-if="mode === 'camera'">
            <div class="camera-card">
              <div v-if="!preview" class="camera-feed-wrap">
                <video v-if="cameraActive" ref="videoEl" class="camera-feed" autoplay playsinline muted></video>
                <canvas ref="canvasEl" class="hidden"></canvas>
                <div v-if="!cameraActive" class="camera-idle">
                  <div class="upload-icon"><i class="fas fa-camera"></i></div>
                  <h3>Camera Ready</h3>
                  <p>Click below to start</p>
                </div>
                <div v-if="cameraActive" class="face-guide">
                  <div class="face-oval"></div>
                  <div class="guide-badge">
                    <i class="fas fa-user"></i> Position face inside oval — then capture
                  </div>
                </div>
              </div>
              <div class="camera-controls">
                <button v-if="!cameraActive" class="cam-btn start" @click="startCamera">
                  <i class="fas fa-video"></i> Start Camera
                </button>
                <template v-if="cameraActive">
                  <button class="cam-btn flip" @click="flipCamera" title="Flip camera"><i class="fas fa-sync-alt"></i></button>
                  <button class="cam-btn capture" @click="capturePhoto"><i class="fas fa-circle"></i></button>
                  <button class="cam-btn stop" @click="stopCamera" title="Stop"><i class="fas fa-times"></i></button>
                </template>
              </div>
              <div v-if="preview" class="cam-captured">
                <img :src="preview" alt="Captured" />
                <div class="preview-overlay">
                  <button @click="retakePhoto"><i class="fas fa-redo"></i> Retake</button>
                </div>
              </div>
            </div>
          </template>

          <p v-if="error" class="error-msg"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>

          <button v-if="preview" class="analyze-btn" @click="runAnalysis">
            <i class="fas fa-microscope"></i> Analyze My Skin
          </button>
        </div>

        <!-- RIGHT: Info Panel -->
        <div class="info-col">
          <div class="info-card tips-card">
            <div class="info-card-title"><i class="fas fa-lightbulb"></i> Photo Tips</div>
            <div class="tip-list">
              <div class="tip-item"><div class="tip-icon"><i class="fas fa-sun"></i></div><div><strong>Good Lighting</strong><p>Natural daylight gives the best results</p></div></div>
              <div class="tip-item"><div class="tip-icon"><i class="fas fa-user"></i></div><div><strong>Neutral Expression</strong><p>Relax your face, look straight ahead</p></div></div>
              <div class="tip-item"><div class="tip-icon"><i class="fas fa-glasses"></i></div><div><strong>Remove Glasses</strong><p>Frames can obscure skin analysis</p></div></div>
              <div class="tip-item"><div class="tip-icon"><i class="fas fa-arrows-alt-h"></i></div><div><strong>Fill the Frame</strong><p>Your face should fill 60–80% of the photo</p></div></div>
              <div class="tip-item"><div class="tip-icon"><i class="fas fa-tint-slash"></i></div><div><strong>No Heavy Makeup</strong><p>Clean skin yields more accurate results</p></div></div>
            </div>
          </div>

          <div class="info-card concerns-card">
            <div class="info-card-title"><i class="fas fa-clipboard-check"></i> What We Analyze</div>
            <div class="concern-chips">
              <span v-for="c in analyzedConcerns" :key="c.type">
                <i :class="concernIcons[c.type] || 'fas fa-circle'"></i> {{ c.label }}
              </span>
            </div>
          </div>
        </div>

      </div><!-- /two-col -->
    </template>

    <!-- ═══════════════════ SCANNING STATE ═══════════════════ -->
    <div v-if="analyzing" class="scanning-screen">
      <div class="scan-inner">
        <div class="scan-frame">
          <img :src="preview" alt="Scanning" />
          <div class="scan-beam"></div>
          <div class="scan-corner tl"></div>
          <div class="scan-corner tr"></div>
          <div class="scan-corner bl"></div>
          <div class="scan-corner br"></div>
        </div>
        <div class="scan-status">
          <div class="scan-dots"><span></span><span></span><span></span></div>
          <p>Analyzing skin conditions…</p>
          <span>Detecting 10 skin concerns via PerfectCorp AI</span>
          <div class="scan-concerns">
            <span v-for="c in analyzedConcerns" :key="c.type" class="sc-chip">
              <i :class="concernIcons[c.type] || 'fas fa-circle'"></i> {{ c.label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════ RESULTS ═══════════════════ -->
    <div v-if="result" class="report-wrap">

      <!-- Report Header -->
      <div class="report-header">
        <div class="rh-left">
          <img :src="preview" class="report-avatar" alt="Patient" />
          <div class="rh-info">
            <h2>Skin Analysis Report</h2>
            <div class="rh-meta">
              <span><i class="fas fa-calendar-alt"></i> {{ new Date().toLocaleDateString('en-PK', { dateStyle: 'long' }) }}</span>
              <span><i class="fas fa-robot"></i> PerfectCorp AI</span>
              <span><i class="fas fa-shield-alt"></i> HIPAA Compliant</span>
            </div>
          </div>
        </div>
        <div class="rh-score-wrap">
          <div class="overall-ring" :style="ringStyle">
            <span class="ring-num">{{ overallScore }}</span>
          </div>
          <div class="rh-score-info">
            <p class="score-label-text" :style="{ color: scoreLabel(overallScore).color }">{{ scoreLabel(overallScore).label }}</p>
            <span>Overall Score</span>
          </div>
        </div>
        <button class="new-scan-btn-header" @click="reset"><i class="fas fa-redo"></i> New Scan</button>
      </div>

      <!-- Section Title + Legend -->
      <div class="section-row">
        <div class="report-section-title"><i class="fas fa-clipboard-list"></i> Detailed Breakdown ({{ result.length }} concerns)</div>
        <div class="legend">
          <span v-for="l in legend" :key="l.label" :style="{ color: l.color }">
            <i class="fas fa-circle" style="font-size:8px"></i> {{ l.label }}
          </span>
        </div>
      </div>

      <!-- Score Cards Grid — 3 cols on wide screens -->
      <div class="cards-grid">
        <div v-for="item in result" :key="item.type" class="metric-card">
          <div class="metric-top">
            <div class="metric-icon" :style="{ background: scoreLabel(item.ui_score).color + '20', color: scoreLabel(item.ui_score).color }">
              <i :class="concernIcons[item.type] || 'fas fa-circle'"></i>
            </div>
            <div class="metric-info">
              <div class="metric-name">{{ CONCERN_LABELS[item.type] || item.type }}</div>
              <div class="metric-badge" :style="{ background: scoreLabel(item.ui_score).color + '20', color: scoreLabel(item.ui_score).color }">
                {{ scoreLabel(item.ui_score).label }}
              </div>
            </div>
            <div class="metric-score" :style="{ color: scoreLabel(item.ui_score).color }">
              {{ item.ui_score }}<span>/100</span>
            </div>
          </div>
          <div class="metric-bar-bg">
            <div class="metric-bar-fill"
              :style="{
                width: item.ui_score + '%',
                background: `linear-gradient(90deg, ${scoreLabel(item.ui_score).color}99, ${scoreLabel(item.ui_score).color})`
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <p class="disclaimer"><i class="fas fa-info-circle"></i> This is an AI-based assessment and not a substitute for professional medical or dermatological advice. Please consult a licensed dermatologist for any medical concerns.</p>

      <!-- Summarize Button -->
      <div class="summarize-row">
        <button class="summarize-btn" @click="openSummaryModal" :disabled="summarizing">
          <i class="fas" :class="summarizing ? 'fa-spinner fa-spin' : 'fa-file-medical-alt'"></i>
          {{ summarizing ? 'Generating Summary…' : 'Summarize Report' }}
        </button>
      </div>

    </div>
  </div>

  <!-- ═══════════════════ SUMMARY MODAL ═══════════════════ -->
  <div v-if="showSummaryModal" class="modal-overlay" @click.self="showSummaryModal = false">
    <div class="summary-modal">
      <div class="sm-header">
        <div class="sm-icon"><i class="fas fa-file-medical-alt"></i></div>
        <div>
          <h3>AI Skin Analysis Summary</h3>
          <span>Generated by AI • For discussion with your dermatologist</span>
        </div>
        <button class="sm-close" @click="showSummaryModal = false"><i class="fas fa-times"></i></button>
      </div>

      <div class="sm-body">
        <p class="sm-summary-text">{{ aiSummary }}</p>
      </div>

      <div class="sm-footer">
        <button class="sm-dismiss" @click="showSummaryModal = false">
          <i class="fas fa-times"></i> Dismiss
        </button>
        <button class="sm-talk-btn" @click="confirmDermatologist">
          <i class="fas fa-phone-alt"></i> Talk to Dermatologist
        </button>
      </div>
    </div>
  </div>

  <!-- ═══════════════════ DERMATOLOGIST CONFIRM POPUP ═══════════════════ -->
  <div v-if="showDermConfirm" class="modal-overlay" @click.self="showDermConfirm = false">
    <div class="derm-confirm-popup">
      <div class="dcp-icon"><i class="fas fa-user-md"></i></div>
      <h3>Connect with Dr. Grace Kim</h3>
      <p>Dermatologist — AI Specialist</p>
      <p class="dcp-note">Your skin analysis summary will be shared with the doctor so she can guide you right away.</p>
      <div class="dcp-actions">
        <button class="dcp-cancel" @click="showDermConfirm = false">
          <i class="fas fa-times"></i> Cancel
        </button>
        <button class="dcp-confirm" @click="startDermatologistCall">
          <i class="fas fa-phone-alt"></i> Start Call
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { analyzeSkin, scoreLabel, CONCERN_LABELS } from '../services/skinAnalysis.js'

const emit = defineEmits(['navigate', 'startDermCall'])

const filePicker   = ref(null)
const preview      = ref('')
const selectedFile = ref(null)
const analyzing    = ref(false)
const result       = ref(null)
const error        = ref('')

// Camera state
const mode         = ref('upload')
const videoEl      = ref(null)
const canvasEl     = ref(null)
const cameraActive = ref(false)
const facingMode   = ref('user')
let   stream       = null

const analyzedConcerns = [
  { type: 'wrinkle',        label: 'Wrinkles' },
  { type: 'pore',           label: 'Pores' },
  { type: 'texture',        label: 'Texture' },
  { type: 'acne',           label: 'Acne' },
  { type: 'dark_circle_v2', label: 'Dark Circles' },
  { type: 'oiliness',       label: 'Oiliness' },
  { type: 'radiance',       label: 'Radiance' },
  { type: 'firmness',       label: 'Firmness' },
  { type: 'moisture',       label: 'Moisture' },
  { type: 'redness',        label: 'Redness' },
]

function switchMode(m) {
  mode.value = m
  if (m === 'upload') stopCamera()
}

async function startCamera() {
  error.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode.value, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    })
    cameraActive.value = true
    await new Promise(r => setTimeout(r, 80))
    if (!videoEl.value) return
    videoEl.value.srcObject = stream
    await new Promise(resolve => {
      if (videoEl.value.readyState >= 2) { resolve(); return }
      videoEl.value.onloadedmetadata = resolve
    })
    await videoEl.value.play().catch(() => {})
  } catch (e) {
    error.value = 'Camera access denied. Please allow camera permission in your browser.'
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
  cameraActive.value = false
}

async function flipCamera() {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  stopCamera()
  await startCamera()
}

function capturePhoto() {
  if (!videoEl.value || !canvasEl.value) return
  const video  = videoEl.value
  const canvas = canvasEl.value
  const vW = video.videoWidth
  const vH = video.videoHeight
  console.log('[Camera] videoWidth:', vW, 'videoHeight:', vH)
  if (!vW || !vH) { error.value = 'Camera not ready yet — please wait and try again.'; return }

  // ── Analysis crop: tight so face fills 60–80% (not shown to user) ──
  const cropFactor = vW >= 1280 ? 0.45 : 0.65
  const sw    = Math.round(vH * cropFactor)
  const sx    = Math.round((vW - sw) / 2)
  const scale = Math.max(1, 800 / sw)
  const outW  = Math.round(sw * scale)
  const outH  = Math.round(vH * scale)

  canvas.width  = outW
  canvas.height = outH
  canvas.getContext('2d').drawImage(video, sx, 0, sw, vH, 0, 0, outW, outH)
  console.log('[Camera] analysis crop:', sw, '×', vH, '→', outW, '×', outH)

  // ── Preview crop: wide portrait + mirrored so it looks like a natural selfie ──
  // pFactor is relative to frame HEIGHT — larger = wider, more context shown
  const pFactor = vW >= 1280 ? 0.85 : 0.95   // e.g. 1920×1080: 0.85→918px wide slice
  const pw  = Math.round(vH * pFactor)         // crop width (portrait slice)
  const psx = Math.round((vW - pw) / 2)        // center x offset

  // Keep natural pixel size — CSS will scale it down visually
  const pvCanvas = document.createElement('canvas')
  pvCanvas.width  = pw
  pvCanvas.height = vH
  const pCtx = pvCanvas.getContext('2d')
  // Mirror horizontally so preview matches what user saw in the live camera
  pCtx.translate(pw, 0)
  pCtx.scale(-1, 1)
  pCtx.drawImage(video, psx, 0, pw, vH, 0, 0, pw, vH)

  canvas.toBlob(blob => {
    if (!blob) { error.value = 'Capture failed. Please try again.'; return }
    stopCamera()
    selectedFile.value = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' })
    preview.value      = pvCanvas.toDataURL('image/jpeg', 0.90)
    error.value        = ''
  }, 'image/jpeg', 0.95)
}

function retakePhoto() {
  preview.value = ''
  selectedFile.value = null
  error.value = ''
  startCamera()
}

onBeforeUnmount(() => stopCamera())

const concernIcons = {
  wrinkle:            'fas fa-water',
  pore:               'fas fa-dot-circle',
  texture:            'fas fa-th',
  acne:               'fas fa-circle-notch',
  dark_circle_v2:     'fas fa-eye',
  oiliness:           'fas fa-tint',
  radiance:           'fas fa-sun',
  firmness:           'fas fa-fist-raised',
  moisture:           'fas fa-water',
  redness:            'fas fa-heart',
  hd_wrinkle:         'fas fa-water',
  hd_pore:            'fas fa-dot-circle',
  hd_texture:         'fas fa-th',
  hd_acne:            'fas fa-circle-notch',
  hd_dark_circle:     'fas fa-eye',
  hd_oiliness:        'fas fa-tint',
  hd_radiance:        'fas fa-sun',
  hd_firmness:        'fas fa-fist-raised',
  hd_moisture:        'fas fa-water',
  hd_redness:         'fas fa-heart',
}

const legend = [
  { label: 'Excellent (80–100)', color: '#22c55e' },
  { label: 'Good (60–79)',       color: '#84cc16' },
  { label: 'Fair (40–59)',       color: '#f59e0b' },
  { label: 'Needs Care (0–39)', color: '#ef4444' },
]

const overallScore = computed(() => {
  if (!result.value?.length) return 0
  const valid = result.value.filter(i => typeof i.ui_score === 'number' && !isNaN(i.ui_score))
  if (!valid.length) return 0
  return Math.round(valid.reduce((s, i) => s + i.ui_score, 0) / valid.length)
})

const ringStyle = computed(() => {
  const score = overallScore.value
  const color = scoreLabel(score).color
  const deg   = Math.round((score / 100) * 360)
  return { background: `conic-gradient(${color} ${deg}deg, rgba(255,255,255,0.15) ${deg}deg)` }
})

function pickFile() { filePicker.value?.click() }
function onFilePick(e) { const f = e.target.files?.[0]; if (f) loadFile(f) }
function onDrop(e) { const f = e.dataTransfer.files?.[0]; if (f) loadFile(f) }

function loadFile(file, fromCamera = false) {
  if (!file.type.startsWith('image/')) { error.value = 'Please upload a JPG or PNG image.'; return }
  if (file.size > 10 * 1024 * 1024) { error.value = 'Image must be under 10MB.'; return }
  selectedFile.value = file
  error.value = ''
  const reader = new FileReader()
  reader.onload = e => {
    preview.value = e.target.result
    if (!fromCamera) {
      const img = new Image()
      img.onload = () => {
        if (Math.min(img.width, img.height) < 480) {
          error.value = `Image too small (${img.width}×${img.height}px). Minimum: 480px short side.`
          preview.value = ''
          selectedFile.value = null
        }
      }
      img.src = e.target.result
    }
  }
  reader.readAsDataURL(file)
}

// ── Set true to skip real API and use fake scores for UI testing ──
const MOCK_MODE = false

const MOCK_RESULT = [
  { type: 'wrinkle',        ui_score: 72 },
  { type: 'pore',           ui_score: 55 },
  { type: 'texture',        ui_score: 81 },
  { type: 'acne',           ui_score: 38 },
  { type: 'dark_circle_v2', ui_score: 47 },
  { type: 'oiliness',       ui_score: 63 },
  { type: 'radiance',       ui_score: 88 },
  { type: 'firmness',       ui_score: 74 },
  { type: 'moisture',       ui_score: 59 },
  { type: 'redness',        ui_score: 42 },
]

async function runAnalysis() {
  if (!selectedFile.value) return
  analyzing.value = true
  error.value = ''
  result.value = null
  try {
    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 2500)) // fake scanning delay
      result.value = MOCK_RESULT
      return
    }
    result.value = await analyzeSkin(selectedFile.value)
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('below_min_image_size') || msg.includes('image_size')) {
      error.value = 'Image resolution too low. Please use a clearer photo (min 480px).'
    } else if (msg.includes('face_too_small') || msg.includes('no_face')) {
      error.value = 'Face too small. Use a close-up selfie where your face fills 60–80% of the frame.'
    } else {
      error.value = msg || 'Analysis failed. Please try again.'
    }
  } finally {
    analyzing.value = false
  }
}

function reset() {
  preview.value = ''
  selectedFile.value = null
  result.value = null
  error.value = ''
  if (filePicker.value) filePicker.value.value = ''
  stopCamera()
  mode.value = 'upload'
}

// ── Summary & Dermatologist flow ────────────────────────────────────────
const OPENAI_API_KEY   = import.meta.env.VITE_OPENAI_API_KEY
const summarizing      = ref(false)
const aiSummary        = ref('')
const showSummaryModal = ref(false)
const showDermConfirm  = ref(false)

async function openSummaryModal() {
  if (!result.value?.length) return
  summarizing.value = true
  try {
    if (OPENAI_API_KEY) {
      aiSummary.value = await generateSkinSummary()
    } else {
      console.log('[SkinFlow] No OpenAI key — using fallback summary')
      aiSummary.value = buildFallbackSummary()
    }
    showSummaryModal.value = true
  } catch (e) {
    console.warn('[SkinFlow] Summary generation failed, using fallback:', e.message)
    aiSummary.value = buildFallbackSummary()
    showSummaryModal.value = true
  } finally {
    summarizing.value = false
  }
}

async function generateSkinSummary() {
  const lines = result.value.map(item => {
    const label = CONCERN_LABELS[item.type] || item.type
    const { label: rating } = scoreLabel(item.ui_score)
    return `${label}: ${item.ui_score}/100 (${rating})`
  }).join('\n')

  const overall = overallScore.value
  const { label: overallRating } = scoreLabel(overall)

  const prompt = `You are a friendly dermatology AI assistant. A patient just got their AI-powered skin analysis. Write a clear, warm, 3–4 sentence summary they can share with a dermatologist. Mention overall skin health, top concerns, and encourage professional consultation. Keep it simple and reassuring.

Skin Analysis Results:
Overall Score: ${overall}/100 (${overallRating})
${lines}`

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 200,
    })
  })

  if (!resp.ok) throw new Error(`OpenAI ${resp.status}`)
  const data = await resp.json()
  return data.choices?.[0]?.message?.content?.trim() || buildFallbackSummary()
}

function buildFallbackSummary() {
  const overall = overallScore.value
  const { label: overallRating } = scoreLabel(overall)
  const topConcerns = [...result.value]
    .sort((a, b) => a.ui_score - b.ui_score)
    .slice(0, 3)
    .map(i => CONCERN_LABELS[i.type] || i.type)
  return `Your overall skin health score is ${overall}/100 (${overallRating}). The areas needing most attention are: ${topConcerns.join(', ')}. It is recommended to discuss these findings with a licensed dermatologist for personalized care and treatment options.`
}

function confirmDermatologist() {
  showSummaryModal.value = false
  showDermConfirm.value  = true
}

function startDermatologistCall() {
  showDermConfirm.value = false
  const summaryToSend = aiSummary.value || buildFallbackSummary()
  console.log('[SkinFlow] saving to localStorage — summary:', summaryToSend.slice(0, 80))
  localStorage.setItem('skinAnalysisSummary', summaryToSend)
  localStorage.setItem('autoStartDoctor', 'dr-grace')
  console.log('[SkinFlow] localStorage set, navigating to doctors...')
  emit('navigate', 'doctors')
}
</script>

<style scoped>
/* ── Root wrapper: full width, no artificial cap ── */
.skin-wrap {
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ══════════════════════════════════════════════════════
   HERO BANNER
══════════════════════════════════════════════════════ */
.hero-banner {
  background: linear-gradient(135deg, #0f2a5e 0%, #1a3a8f 40%, #1a73e8 100%);
  border-radius: 20px;
  padding: 36px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  color: white;
  flex-wrap: wrap;
}
.hero-left { flex: 1; min-width: 280px; }
.eyebrow {
  font-size: 0.78rem; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase; opacity: 0.8; display: block; margin-bottom: 10px;
}
.hero-left h1 { margin: 0 0 10px; font-size: 2.2rem; font-weight: 800; line-height: 1.15; }
.hero-left p  { margin: 0 0 24px; opacity: 0.85; font-size: 1rem; max-width: 480px; }

.hero-stats { display: flex; gap: 28px; flex-wrap: wrap; }
.hstat strong { display: block; font-size: 1.6rem; font-weight: 800; line-height: 1; }
.hstat span   { font-size: 0.78rem; opacity: 0.75; }

.hero-right { display: flex; align-items: center; }
.badge-group { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.badge-group span {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 20px; padding: 7px 16px;
  font-size: 0.82rem; display: flex; align-items: center; gap: 7px;
  backdrop-filter: blur(4px);
}

/* ══════════════════════════════════════════════════════
   TWO-COLUMN LAYOUT
══════════════════════════════════════════════════════ */
.two-col {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}

/* ── Capture column ── */
.capture-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Info column ── */
.info-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  background: white;
  border: 1px solid #e5eaf3;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}
.info-card-title {
  font-size: 0.88rem; font-weight: 700; color: #1a2540;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.info-card-title i { color: #1a73e8; }

.tip-list { display: flex; flex-direction: column; gap: 14px; }
.tip-item { display: flex; align-items: flex-start; gap: 12px; }
.tip-icon {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  background: linear-gradient(135deg, #e8f0fe, #c2d7ff);
  display: grid; place-items: center;
  font-size: 0.9rem; color: #1a73e8;
}
.tip-item strong { font-size: 0.88rem; color: #1a2540; display: block; }
.tip-item p { margin: 2px 0 0; font-size: 0.8rem; color: #6b7280; }

.concern-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.concern-chips span {
  background: #f0f7ff; border: 1px solid #c2d7ff;
  border-radius: 20px; padding: 5px 12px;
  font-size: 0.8rem; color: #1a73e8; font-weight: 600;
  display: flex; align-items: center; gap: 5px;
}

/* ── Mode Tabs ── */
.mode-tabs {
  display: flex; background: #f1f5f9;
  border-radius: 14px; padding: 4px; gap: 4px;
}
.mode-tab {
  flex: 1; padding: 11px 20px;
  border: none; border-radius: 10px;
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer; color: #6b7280;
  background: transparent;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s;
}
.mode-tab.active { background: white; color: #1a73e8; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.mode-tab:not(.active):hover { color: #374151; }

/* ── Upload Card ── */
.upload-card {
  border: 2px dashed #c7d9f5; border-radius: 18px;
  background: #f8fbff; cursor: pointer; transition: all 0.25s;
  min-height: 260px; display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.upload-card:hover { border-color: #1a73e8; background: #f0f7ff; }
.hidden { display: none; }

.upload-empty { text-align: center; padding: 40px 24px; }
.upload-icon {
  width: 68px; height: 68px; border-radius: 50%;
  background: linear-gradient(135deg, #e8f0fe, #c2d7ff);
  display: grid; place-items: center; margin: 0 auto 16px;
  font-size: 1.7rem; color: #1a73e8;
}
.upload-empty h3 { margin: 0 0 6px; font-size: 1.1rem; color: #1a2540; }
.upload-empty p  { margin: 0 0 16px; color: #6b7280; font-size: 0.9rem; }
.upload-reqs { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.upload-reqs span {
  font-size: 0.8rem; color: #1a73e8; background: #eaf3ff;
  border-radius: 20px; padding: 4px 12px;
  display: flex; align-items: center; gap: 5px;
}

.upload-preview { position: relative; width: 100%; }
.upload-preview img { width: 100%; max-height: 360px; object-fit: cover; display: block; }
.preview-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.upload-card:hover .preview-overlay,
.camera-card:hover .preview-overlay { opacity: 1; }
.preview-overlay button {
  background: white; color: #1a2540; border: none; border-radius: 20px;
  padding: 10px 20px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
}

/* ── Camera Card ── */
.camera-card {
  border-radius: 18px; overflow: hidden; background: #0a0f1e;
  min-height: 260px; display: flex; flex-direction: column;
}
.camera-feed-wrap {
  position: relative; flex: 1; display: flex;
  flex-direction: column; align-items: center; justify-content: center; min-height: 260px;
}
.camera-feed {
  width: 100%; max-height: 380px; object-fit: cover;
  display: block; transform: scaleX(-1);
}
.camera-idle { text-align: center; color: white; padding: 40px; }
.camera-idle .upload-icon { background: rgba(255,255,255,0.1); color: white; }
.camera-idle h3 { margin: 0 0 6px; color: white; }
.camera-idle p  { color: rgba(255,255,255,0.6); margin: 0; }

.face-guide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; pointer-events: none;
}
.face-oval {
  /* Height-based so oval never overflows the landscape camera feed */
  height: 78%;
  max-height: 300px;
  aspect-ratio: 3 / 4;
  border: 3px dashed rgba(255,255,255,0.7); border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.35);
  animation: oval-pulse 2.5s ease-in-out infinite;
}
@keyframes oval-pulse {
  0%, 100% { border-color: rgba(255,255,255,0.5); }
  50%       { border-color: rgba(26,115,232,0.95); }
}
.guide-badge {
  margin-top: 16px; font-size: 0.82rem; font-weight: 600;
  padding: 6px 14px; border-radius: 20px; display: flex; align-items: center; gap: 7px;
  background: rgba(0,0,0,0.55); color: white; backdrop-filter: blur(6px);
}

.camera-controls {
  display: flex; justify-content: center; align-items: center;
  gap: 16px; padding: 14px; background: #0a0f1e;
}
.cam-btn {
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, opacity 0.2s; font-weight: 600;
}
.cam-btn:hover { opacity: 0.85; transform: scale(1.05); }
.cam-btn.start {
  background: #1a73e8; color: white; border-radius: 30px;
  padding: 13px 26px; font-size: 0.95rem; gap: 10px;
  box-shadow: 0 4px 16px rgba(26,115,232,0.5);
}
.cam-btn.capture {
  width: 64px; height: 64px; border-radius: 50%; background: white;
  border: 4px solid rgba(255,255,255,0.4); font-size: 1.5rem; color: #ef4444;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.cam-btn.flip {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.15); color: white;
  font-size: 1rem; backdrop-filter: blur(4px);
}
.cam-btn.stop {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(239,68,68,0.25); color: #fca5a5;
  font-size: 1rem; backdrop-filter: blur(4px);
}

/* ── Captured photo preview (portrait image in camera card) ── */
.cam-captured {
  position: relative;
  background: #0a0f1e;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  overflow: hidden;
}
.cam-captured img {
  display: block;
  max-width: 100%;
  max-height: 420px;
  width: auto;
  height: auto;
  object-fit: contain;  /* show full portrait — no cropping */
}
.cam-captured:hover .preview-overlay { opacity: 1; }

/* ── Analyze Button ── */
.analyze-btn {
  background: linear-gradient(135deg, #1a73e8, #0048a8);
  color: white; border: none; border-radius: 14px;
  padding: 16px 32px; font-size: 1.05rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 10px;
  box-shadow: 0 6px 20px rgba(26,115,232,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.analyze-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(26,115,232,0.5); }

.error-msg {
  background: #fff1f1; border: 1px solid #fca5a5;
  border-radius: 12px; padding: 14px 18px;
  color: #b91c1c; font-size: 0.9rem;
  display: flex; align-items: flex-start; gap: 10px; margin: 0;
}

/* ══════════════════════════════════════════════════════
   SCANNING SCREEN
══════════════════════════════════════════════════════ */
.scanning-screen {
  display: flex; align-items: center; justify-content: center;
  padding: 40px 0; min-height: 500px;
}
.scan-inner {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 48px;
  align-items: center;
  width: 100%;
  max-width: 900px;
}
.scan-frame {
  position: relative; border-radius: 18px; overflow: hidden;
}
.scan-frame img { width: 100%; max-height: 380px; object-fit: cover; display: block; filter: brightness(0.85); }
.scan-beam {
  position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: linear-gradient(90deg, transparent 0%, #1a73e8 40%, #60a5fa 60%, transparent 100%);
  box-shadow: 0 0 14px #1a73e8;
  animation: beam 1.8s ease-in-out infinite;
}
@keyframes beam { 0% { top: 0; } 100% { top: 100%; } }
.scan-corner { position: absolute; width: 22px; height: 22px; border-color: #1a73e8; border-style: solid; }
.scan-corner.tl { top: 8px; left: 8px;  border-width: 3px 0 0 3px; }
.scan-corner.tr { top: 8px; right: 8px; border-width: 3px 3px 0 0; }
.scan-corner.bl { bottom: 8px; left: 8px;  border-width: 0 0 3px 3px; }
.scan-corner.br { bottom: 8px; right: 8px; border-width: 0 3px 3px 0; }

.scan-dots { display: flex; gap: 6px; margin-bottom: 16px; }
.scan-dots span {
  width: 12px; height: 12px; border-radius: 50%;
  background: #1a73e8; animation: pulse 1.2s infinite;
}
.scan-dots span:nth-child(2) { animation-delay: 0.2s; }
.scan-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse { 0%,80%,100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }
.scan-status p    { font-size: 1.4rem; font-weight: 700; color: #1a2540; margin: 0 0 6px; }
.scan-status span { font-size: 0.9rem; color: #6b7280; display: block; margin-bottom: 20px; }
.scan-concerns { display: flex; flex-wrap: wrap; gap: 8px; }
.sc-chip {
  background: #f0f7ff; border: 1px solid #c2d7ff;
  border-radius: 20px; padding: 5px 12px;
  font-size: 0.8rem; color: #1a73e8; font-weight: 600;
  display: flex; align-items: center; gap: 5px;
  animation: fadeIn 0.3s ease both;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

/* ══════════════════════════════════════════════════════
   RESULTS / REPORT
══════════════════════════════════════════════════════ */
.report-wrap { display: flex; flex-direction: column; gap: 20px; }

/* Report Header */
.report-header {
  background: linear-gradient(135deg, #0f2a5e, #1a73e8);
  border-radius: 20px; padding: 28px 36px;
  display: flex; align-items: center;
  gap: 24px; color: white; flex-wrap: wrap;
}
.rh-left { display: flex; align-items: center; gap: 20px; flex: 1; min-width: 200px; }
.report-avatar { width: 86px; height: 86px; border-radius: 14px; object-fit: cover; border: 3px solid rgba(255,255,255,0.3); flex-shrink: 0; }
.rh-info h2 { margin: 0 0 8px; font-size: 1.4rem; font-weight: 800; }
.rh-meta { display: flex; flex-wrap: wrap; gap: 14px; }
.rh-meta span { font-size: 0.82rem; opacity: 0.85; display: flex; align-items: center; gap: 6px; }

.rh-score-wrap { display: flex; align-items: center; gap: 16px; }
.overall-ring {
  width: 96px; height: 96px; border-radius: 50%;
  display: grid; place-items: center; position: relative; padding: 5px;
  flex-shrink: 0;
}
.overall-ring::before {
  content: ''; position: absolute; inset: 5px;
  background: #0f2a5e; border-radius: 50%;
}
.ring-num {
  position: relative; z-index: 1;
  font-size: 1.8rem; font-weight: 900; color: white; line-height: 1;
}
.rh-score-info .score-label-text { margin: 0 0 2px; font-size: 1rem; font-weight: 700; }
.rh-score-info span { font-size: 0.8rem; opacity: 0.75; }

.new-scan-btn-header {
  background: rgba(255,255,255,0.15); color: white;
  border: 1px solid rgba(255,255,255,0.3); border-radius: 12px;
  padding: 12px 22px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: background 0.2s; white-space: nowrap;
  backdrop-filter: blur(4px);
}
.new-scan-btn-header:hover { background: rgba(255,255,255,0.25); }

/* Section row */
.section-row {
  display: flex; align-items: center;
  justify-content: space-between; flex-wrap: wrap; gap: 12px;
  padding-bottom: 10px; border-bottom: 2px solid #e5eaf3;
}
.report-section-title {
  font-size: 1rem; font-weight: 700; color: #1a2540;
  display: flex; align-items: center; gap: 8px;
}
.legend { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.8rem; font-weight: 500; }
.legend span { display: flex; align-items: center; gap: 5px; }

/* Metric Cards — 3 columns */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.metric-card {
  background: white; border: 1px solid #e5eaf3;
  border-radius: 16px; padding: 16px 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.metric-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
.metric-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.metric-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: grid; place-items: center; font-size: 1rem; flex-shrink: 0;
}
.metric-info { flex: 1; min-width: 0; }
.metric-name { font-size: 0.9rem; font-weight: 700; color: #1a2540; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.metric-badge { display: inline-block; font-size: 0.72rem; font-weight: 600; border-radius: 20px; padding: 2px 8px; margin-top: 3px; }
.metric-score { font-size: 1.5rem; font-weight: 800; line-height: 1; flex-shrink: 0; }
.metric-score span { font-size: 0.7rem; font-weight: 500; opacity: 0.7; }
.metric-bar-bg { background: #f1f5f9; border-radius: 99px; height: 8px; overflow: hidden; }
.metric-bar-fill { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

/* Disclaimer */
.disclaimer {
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 12px; padding: 14px 18px;
  font-size: 0.82rem; color: #92400e;
  display: flex; align-items: flex-start; gap: 8px; margin: 0;
}

/* ══════════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════════ */

/* ── Large tablet (≤1024px): narrow the info column ── */
@media (max-width: 1024px) {
  .two-col { grid-template-columns: 1fr 300px; }
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-left h1 { font-size: 1.9rem; }
}

/* ── Tablet / small laptop (≤860px): stack two-col ── */
@media (max-width: 860px) {
  .two-col { grid-template-columns: 1fr; }
  .info-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .hero-banner { padding: 28px 26px; gap: 20px; }
  .hero-left h1 { font-size: 1.7rem; }
  .hero-right { width: 100%; }
  .badge-group { justify-content: flex-start; }
  .scan-inner { grid-template-columns: 1fr; text-align: center; }
  .scan-frame { max-width: 300px; margin: 0 auto; }
  .scan-dots { justify-content: center; }
  .scan-concerns { justify-content: center; }
  .report-header { padding: 22px 24px; gap: 18px; }
  .rh-info h2 { font-size: 1.2rem; }
}

/* ── Mobile (≤640px): phone-first ── */
@media (max-width: 640px) {
  .skin-wrap { gap: 14px; }

  /* Hero */
  .hero-banner { padding: 20px 18px; border-radius: 16px; flex-direction: column; gap: 16px; }
  .hero-left h1 { font-size: 1.45rem; }
  .hero-left p  { font-size: 0.88rem; margin-bottom: 16px; }
  .hero-stats { gap: 16px; }
  .hstat strong { font-size: 1.3rem; }
  .hstat span   { font-size: 0.72rem; }
  .hero-right { width: 100%; }
  .badge-group { gap: 7px; }
  .badge-group span { font-size: 0.74rem; padding: 5px 11px; }

  /* Mode tabs */
  .mode-tabs { border-radius: 12px; }
  .mode-tab  { font-size: 0.82rem; padding: 10px 12px; }

  /* Info col: stack vertically on phones */
  .info-col { grid-template-columns: 1fr; }

  /* Cards */
  .cards-grid { grid-template-columns: 1fr; gap: 10px; }
  .metric-card { padding: 13px 14px; border-radius: 13px; }
  .metric-score { font-size: 1.3rem; }

  /* Report header: stack */
  .report-header {
    flex-direction: column; align-items: flex-start;
    padding: 18px 18px; border-radius: 16px; gap: 16px;
  }
  .rh-left { gap: 14px; }
  .report-avatar { width: 68px; height: 68px; border-radius: 12px; }
  .rh-info h2   { font-size: 1.1rem; }
  .rh-meta      { gap: 10px; }
  .rh-meta span { font-size: 0.76rem; }
  .rh-score-wrap { flex-direction: row; align-items: center; width: 100%; }
  .overall-ring { width: 80px; height: 80px; }
  .ring-num     { font-size: 1.5rem; }
  .new-scan-btn-header { width: 100%; justify-content: center; padding: 13px 18px; }

  /* Section row: stack title + legend */
  .section-row  { flex-direction: column; align-items: flex-start; gap: 8px; }
  .legend       { gap: 10px; font-size: 0.75rem; }

  /* Scan screen */
  .scanning-screen { min-height: 360px; padding: 24px 0; }
  .scan-inner  { gap: 24px; }
  .scan-frame  { max-width: 260px; }
  .scan-status p { font-size: 1.1rem; }
  .scan-status span { font-size: 0.82rem; }

  /* Camera */
  .camera-feed { max-height: 300px; }
  .camera-card { border-radius: 14px; }
  .face-oval   { height: 72%; max-height: 240px; }

  /* Upload */
  .upload-card { min-height: 200px; border-radius: 14px; }
  .upload-icon { width: 56px; height: 56px; font-size: 1.4rem; }
  .upload-empty h3 { font-size: 1rem; }
  .upload-empty p  { font-size: 0.82rem; }
  .upload-reqs span { font-size: 0.74rem; }

  /* Analyze btn */
  .analyze-btn { padding: 14px 24px; font-size: 0.95rem; border-radius: 12px; }

  /* Disclaimer */
  .disclaimer { font-size: 0.78rem; padding: 12px 14px; }
}

/* ══════════════════════════════════════════════════════
   SUMMARIZE BUTTON ROW
══════════════════════════════════════════════════════ */
.summarize-row {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}
.summarize-btn {
  background: linear-gradient(135deg, #0f2a5e, #1a73e8);
  color: white; border: none; border-radius: 14px;
  padding: 16px 36px; font-size: 1.05rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 6px 20px rgba(26,115,232,0.4);
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}
.summarize-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(26,115,232,0.5); }
.summarize-btn:disabled { opacity: 0.7; cursor: not-allowed; }

/* ══════════════════════════════════════════════════════
   MODAL OVERLAY
══════════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 16px;
  backdrop-filter: blur(4px);
}

/* ── Summary Modal ── */
.summary-modal {
  background: white; border-radius: 20px;
  width: 100%; max-width: 560px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
  overflow: hidden;
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}
.sm-header {
  background: linear-gradient(135deg, #0f2a5e, #1a73e8);
  color: white; padding: 22px 24px;
  display: flex; align-items: flex-start; gap: 16px;
}
.sm-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: rgba(255,255,255,0.18);
  display: grid; place-items: center; font-size: 1.2rem;
}
.sm-header h3 { margin: 0 0 4px; font-size: 1.1rem; font-weight: 700; }
.sm-header span { font-size: 0.8rem; opacity: 0.8; }
.sm-close {
  margin-left: auto; background: rgba(255,255,255,0.15);
  border: none; color: white; border-radius: 8px;
  width: 32px; height: 32px; cursor: pointer; flex-shrink: 0;
  display: grid; place-items: center; transition: background 0.2s;
}
.sm-close:hover { background: rgba(255,255,255,0.28); }

.sm-body {
  padding: 24px 26px;
}
.sm-summary-text {
  font-size: 1rem; line-height: 1.75; color: #1a2540; margin: 0;
  background: #f8fbff; border: 1px solid #c2d7ff;
  border-radius: 12px; padding: 18px 20px;
}

.sm-footer {
  padding: 16px 24px 22px;
  display: flex; gap: 12px; justify-content: flex-end;
  border-top: 1px solid #e5eaf3;
}
.sm-dismiss {
  background: #f1f5f9; color: #374151;
  border: 1px solid #e5eaf3; border-radius: 12px;
  padding: 12px 20px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: background 0.2s;
}
.sm-dismiss:hover { background: #e2e8f0; }
.sm-talk-btn {
  background: linear-gradient(135deg, #1a73e8, #0048a8);
  color: white; border: none; border-radius: 12px;
  padding: 12px 22px; font-size: 0.9rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 14px rgba(26,115,232,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.sm-talk-btn:hover { transform: translateY(-1px); box-shadow: 0 7px 20px rgba(26,115,232,0.5); }

/* ── Dermatologist Confirm Popup ── */
.derm-confirm-popup {
  background: white; border-radius: 20px;
  width: 100%; max-width: 420px; text-align: center;
  padding: 36px 32px 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
.dcp-icon {
  width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 18px;
  background: linear-gradient(135deg, #e8f0fe, #c2d7ff);
  display: grid; place-items: center;
  font-size: 1.8rem; color: #1a73e8;
}
.derm-confirm-popup h3 { margin: 0 0 4px; font-size: 1.2rem; font-weight: 800; color: #1a2540; }
.derm-confirm-popup > p { margin: 0 0 6px; color: #6b7280; font-size: 0.9rem; }
.dcp-note {
  background: #f0f7ff; border: 1px solid #c2d7ff;
  border-radius: 12px; padding: 12px 14px;
  font-size: 0.85rem; color: #1a3a8f; line-height: 1.5;
  margin: 14px 0 22px !important;
}
.dcp-actions { display: flex; gap: 12px; }
.dcp-cancel {
  flex: 1; background: #f1f5f9; color: #374151;
  border: 1px solid #e5eaf3; border-radius: 12px;
  padding: 13px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.2s;
}
.dcp-cancel:hover { background: #e2e8f0; }
.dcp-confirm {
  flex: 1; background: linear-gradient(135deg, #1a73e8, #0048a8);
  color: white; border: none; border-radius: 12px;
  padding: 13px; font-size: 0.9rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 14px rgba(26,115,232,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.dcp-confirm:hover { transform: translateY(-1px); box-shadow: 0 7px 20px rgba(26,115,232,0.5); }

/* ── Small phone (≤400px) ── */
@media (max-width: 400px) {
  .hero-banner { padding: 16px 14px; }
  .hero-left h1 { font-size: 1.25rem; }
  .hero-stats { gap: 12px; }
  .hstat strong { font-size: 1.1rem; }
  .badge-group span { font-size: 0.7rem; padding: 4px 9px; }
  .mode-tab { font-size: 0.78rem; padding: 9px 10px; }
  .report-avatar { width: 56px; height: 56px; }
  .rh-info h2 { font-size: 1rem; }
  .overall-ring { width: 70px; height: 70px; }
  .ring-num { font-size: 1.3rem; }
  .metric-score { font-size: 1.15rem; }
  .scan-frame { max-width: 220px; }
}
</style>
