<template>
  <div class="skin-wrap">

    <!-- ═══════════════════ UPLOAD / CAMERA STATE ═══════════════════ -->
    <template v-if="!result && !analyzing">

      <!-- Full-width Hero Banner -->
      <div class="hero-banner">
        <span class="eyebrow">AI - Powered Skin Dermatology</span>
        <h1>Skin Analysis</h1>
        <p>Get an Instant, AI - Powered skin diagnostic report. Identify 10+ skin concerns under 30 seconds.</p>
      </div>

      <!-- Three-column layout: Face Image left, Controls center, Info right -->
      <div class="three-col">

        <!-- LEFT: Face image -->
        <div class="face-col">
          <img src="/skin-face.png" alt="Skin Analysis" class="face-img" @error="onFaceImgError" ref="faceImgRef" />
        </div>

        <!-- CENTER: Capture Controls -->
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
                <img src="/Email-Attachment-Image Streamline Core.png" class="upload-placeholder-img" alt="Upload" />
                <h3>Upload Your Selfie</h3>
                <p>Drag & Drop or click to browser</p>
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
                <canvas ref="detectCanvasEl" class="detect-canvas"></canvas>
                <div v-if="!cameraActive" class="camera-idle">
                  <div class="upload-icon"><i class="fas fa-camera"></i></div>
                  <h3>Camera Ready</h3>
                  <p>Click below to start</p>
                </div>
                <div v-if="cameraActive" class="face-guide">
                  <div class="face-oval" :class="faceQuality.ovalColor"></div>
                  <div class="guide-badge" :class="faceQuality.badgeClass">
                    <i :class="faceQuality.icon"></i> {{ faceQuality.message }}
                  </div>
                </div>
                <!-- Quality checks HUD -->
                <div v-if="cameraActive" class="quality-hud">
                  <div class="q-check" :class="{ pass: faceQuality.checks.faceFound, fail: !faceQuality.checks.faceFound }">
                    <span class="q-dot"></span> Face
                  </div>
                  <div class="q-check" :class="{ pass: faceQuality.checks.faceSize, fail: !faceQuality.checks.faceSize }">
                    <span class="q-dot"></span> Size
                  </div>
                  <div class="q-check" :class="{ pass: faceQuality.checks.centered, fail: !faceQuality.checks.centered }">
                    <span class="q-dot"></span> Center
                  </div>
                  <div class="q-check" :class="{ pass: faceQuality.checks.lighting, fail: !faceQuality.checks.lighting }">
                    <span class="q-dot"></span> Light
                  </div>
                </div>
              </div>
              <div class="camera-controls">
                <button v-if="!cameraActive" class="cam-btn start" @click="startCamera">
                  <i class="fas fa-video"></i> Start Camera
                </button>
                <template v-if="cameraActive">
                  <button class="cam-btn flip" @click="flipCamera" title="Flip camera"><i class="fas fa-sync-alt"></i></button>
                  <button class="cam-btn capture" @click="capturePhoto"
                    :disabled="!faceQuality.allPass"
                    :title="faceQuality.allPass ? 'Capture' : faceQuality.message">
                    <i class="fas fa-circle"></i>
                  </button>
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
            <div class="info-card-title">
              <img src="/Bulb-1 Streamline Ultimate.png" class="tip-img-title" alt="" />
              Photo Tips
            </div>
            <div class="tip-list">
              <div class="tip-item">
                <img src="/Union.png" class="tip-img" alt="" />
                <div class="tip-text"><strong>Good Brightness</strong><span>Natural daylight gives best results</span></div>
              </div>
              <div class="tip-item">
                <img src="/Single-Man-Actions Streamline Ultimate.png" class="tip-img" alt="" />
                <div class="tip-text"><strong>Natural Expression</strong><span>Relax your face, look straight ahead</span></div>
              </div>
              <div class="tip-item">
                <img src="/glasses--vision-sunglasses-protection-spectacles-correction-sun-eye-glasses.png" class="tip-img" alt="" />
                <div class="tip-text"><strong>Remove Glasses</strong><span>Frames can obscure skin analysis</span></div>
              </div>
              <div class="tip-item">
                <img src="/Line-Arrow-Horizontal Streamline Flex.png" class="tip-img" alt="" />
                <div class="tip-text"><strong>Fill the Frame</strong><span>Your face should fill 60–80% of the photo</span></div>
              </div>
              <div class="tip-item">
                <img src="/Water-Drop Streamline Core-Remix.png" class="tip-img" alt="" />
                <div class="tip-text"><strong>No Heavy Makeup</strong><span>Clean skin yields more accurate results</span></div>
              </div>
            </div>
          </div>

          <div class="info-card concerns-card">
            <div class="info-card-title">
              <img src="/Check-Circle Streamline Core-Remix.png" class="tip-img-title" alt="" />
              What We Analyze
            </div>
            <div class="concern-grid">
              <span>Wrinkles</span><span>Pores</span><span>Texture</span>
              <span>Acne</span><span>Dark Circles</span><span></span>
              <span>Oiliness</span><span>Radiance</span><span></span>
              <span>Firmness</span><span>Moisture</span><span>Redness</span>
            </div>
          </div>
        </div>

      </div><!-- /three-col -->
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
        <!-- Overall Score -->
        <div class="sm-score-row">
          <div class="sm-score-circle" :style="{ background: `conic-gradient(${overallScoreColor} ${overallScore}%, #e5eaf3 0%)` }">
            <div class="sm-score-inner">
              <span class="sm-score-num">{{ overallScore }}</span>
              <span class="sm-score-label">{{ overallScoreLabel }}</span>
            </div>
          </div>
          <div class="sm-score-info">
            <p class="sm-summary-text">{{ aiSummary }}</p>
          </div>
        </div>

        <!-- Detailed Results -->
        <div class="sm-results">
          <div class="sm-results-title">Detailed Results</div>
          <div class="sm-results-grid">
            <div v-for="item in result" :key="item.type" class="sm-result-row">
              <span class="sm-result-name">{{ CONCERN_LABELS[item.type] || item.type }}</span>
              <div class="sm-result-bar-bg">
                <div class="sm-result-bar-fill" :style="{ width: item.ui_score + '%', background: scoreLabel(item.ui_score).color }"></div>
              </div>
              <span class="sm-result-score" :style="{ color: scoreLabel(item.ui_score).color }">{{ item.ui_score }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="sm-footer">
        <button class="sm-dismiss" @click="showSummaryModal = false">
          <i class="fas fa-times"></i> Dismiss
        </button>
        <button class="sm-download-btn" @click="downloadReport">
          <i class="fas fa-download"></i> Download PDF
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
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { jsPDF } from 'jspdf'
import { analyzeSkin, scoreLabel, CONCERN_LABELS } from '../services/skinAnalysis.js'

const emit = defineEmits(['navigate', 'startDermCall'])

const filePicker   = ref(null)
const preview      = ref('')
const selectedFile = ref(null)
const analyzing    = ref(false)
const result       = ref(null)
const error        = ref('')

// Face image ref
const faceImgRef = ref(null)
function onFaceImgError() {
  if (faceImgRef.value) faceImgRef.value.style.display = 'none'
}

// Camera state
const mode            = ref('upload')
const videoEl         = ref(null)
const canvasEl        = ref(null)
const detectCanvasEl  = ref(null)
const cameraActive    = ref(false)
const facingMode      = ref('user')
let   stream          = null

// Face detection
let faceDetector      = null
let detectionLoop     = null
let lastDetectionTime = 0
const DETECTION_INTERVAL = 500 // run every 500ms instead of every frame (~2fps)

const faceQuality = ref({
  checks: { faceFound: false, faceSize: false, centered: false, lighting: false },
  allPass: false,
  message: 'Position your face in the oval',
  icon: 'fas fa-user',
  ovalColor: '',
  badgeClass: '',
})

async function initFaceDetector() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    )
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    })
  } catch (e) {
    console.warn('[FaceDetector] init failed:', e)
  }
}

function analyzeLighting(video) {
  try {
    const c = document.createElement('canvas')
    c.width = 128; c.height = 128
    const ctx = c.getContext('2d')
    ctx.drawImage(video, 0, 0, 128, 128)
    const data = ctx.getImageData(0, 0, 128, 128).data
    const total = data.length / 4

    let sum = 0, darkPixels = 0, brightPixels = 0
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
      sum += lum
      if (lum < 60)  darkPixels++
      if (lum > 230) brightPixels++
    }

    const avg = sum / total
    const darkRatio   = darkPixels / total    // % of very dark pixels
    const brightRatio = brightPixels / total  // % of very bright pixels

    return { avg, darkRatio, brightRatio }
  } catch { return { avg: 128, darkRatio: 0, brightRatio: 0 } }
}

function checkLighting(video) {
  const { avg, darkRatio, brightRatio } = analyzeLighting(video)
  // Fail if average too low OR too many dark pixels (>40% of frame is very dark)
  if (avg < 85 || darkRatio > 0.40) return false
  if (avg > 215 || brightRatio > 0.35) return false
  return true
}

function getLightingMessage(video) {
  const { avg, darkRatio, brightRatio } = analyzeLighting(video)
  if (avg < 85 || darkRatio > 0.40) return 'Too dark — move to brighter light'
  if (avg > 215 || brightRatio > 0.35) return 'Too bright — avoid direct sunlight'
  return null
}

function runDetectionLoop() {
  if (!faceDetector || !videoEl.value || !cameraActive.value) return

  const now = performance.now()
  if (now - lastDetectionTime < DETECTION_INTERVAL) {
    detectionLoop = requestAnimationFrame(runDetectionLoop)
    return
  }
  lastDetectionTime = now

  const video = videoEl.value
  if (video.readyState < 2) { detectionLoop = requestAnimationFrame(runDetectionLoop); return }

  const result = faceDetector.detectForVideo(video, performance.now())
  const vW = video.videoWidth
  const vH = video.videoHeight
  const detections = result.detections || []

  const faceFound = detections.length === 1
  let faceSize = false, centered = false

  if (faceFound) {
    const bb = detections[0].boundingBox
    const faceArea = (bb.width * bb.height) / (vW * vH)
    faceSize = faceArea > 0.08 && faceArea < 0.75
    const cx = (bb.originX + bb.width / 2) / vW
    const cy = (bb.originY + bb.height / 2) / vH
    centered = cx > 0.25 && cx < 0.75 && cy > 0.2 && cy < 0.8
  }

  const lighting = checkLighting(video)
  const allPass = faceFound && faceSize && centered && lighting

  let message = 'Position your face in the oval'
  let icon = 'fas fa-user'
  const lightMsg = getLightingMessage(video)
  if (!lighting)       { message = lightMsg || 'Adjust lighting'; icon = 'fas fa-sun' }
  else if (!faceFound) { message = 'No face detected — look at camera'; icon = 'fas fa-user-slash' }
  else if (!faceSize)  { message = (detections[0]?.boundingBox?.width / vW) < 0.3 ? 'Move closer to camera' : 'Move back a little'; icon = 'fas fa-expand-arrows-alt' }
  else if (!centered)  { message = 'Center your face in the oval'; icon = 'fas fa-dot-circle' }
  else                 { message = 'Perfect! Tap capture'; icon = 'fas fa-check-circle' }

  faceQuality.value = {
    checks: { faceFound, faceSize, centered, lighting },
    allPass,
    message,
    icon,
    ovalColor: allPass ? 'oval-green' : faceFound ? 'oval-yellow' : 'oval-red',
    badgeClass: allPass ? 'badge-green' : faceFound ? 'badge-yellow' : '',
  }

  detectionLoop = requestAnimationFrame(runDetectionLoop)
}

function stopDetectionLoop() {
  if (detectionLoop) { cancelAnimationFrame(detectionLoop); detectionLoop = null }
  faceQuality.value = {
    checks: { faceFound: false, faceSize: false, centered: false, lighting: false },
    allPass: false, message: 'Position your face in the oval',
    icon: 'fas fa-user', ovalColor: '', badgeClass: '',
  }
}

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
    // init face detector then start loop
    if (!faceDetector) await initFaceDetector()
    // small delay so video frame is ready
    await new Promise(r => setTimeout(r, 300))
    runDetectionLoop()
  } catch (e) {
    error.value = 'Camera access denied. Please allow camera permission in your browser.'
  }
}

function stopCamera() {
  stopDetectionLoop()
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

  // Hard block — double check before capture
  if (!faceQuality.value.allPass) {
    error.value = faceQuality.value.message
    return
  }

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

onBeforeUnmount(() => { stopDetectionLoop(); stopCamera() })

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

const overallScoreColor = computed(() => scoreLabel(overallScore.value).color)
const overallScoreLabel = computed(() => scoreLabel(overallScore.value).label)

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
    // API quality errors — auto retake in camera mode
    const isQualityError = msg.includes('too dark') || msg.includes('too bright')
      || msg.includes('no face') || msg.includes('face too small')
      || msg.includes('multiple faces') || msg.includes('blurry') || msg.includes('angle')

    error.value = msg || 'Analysis failed. Please try again.'

    // If camera mode was used and it's a quality error — reset to retake
    if (isQualityError && mode.value === 'camera') {
      preview.value = ''
      selectedFile.value = null
      await new Promise(r => setTimeout(r, 200))
      await startCamera()
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

function generatePDF() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const date = new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })
  const summary = aiSummary.value || buildFallbackSummary()

  // Header
  doc.setFillColor(15, 42, 94)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Skin Analysis Report', 20, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${date}  |  Powered by PerfectCorp AI`, 20, 28)
  doc.text('For discussion with your dermatologist only', 20, 35)

  // Overall score
  const scores = (result.value || []).map(r => r.ui_score)
  const overall = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const { label: overallRating } = scoreLabel(overall)

  doc.setTextColor(15, 42, 94)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Overall Score: ${overall}/100 — ${overallRating}`, 20, 55)

  // Summary
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('AI Summary', 20, 67)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(55, 65, 81)
  const lines = doc.splitTextToSize(summary, 170)
  doc.text(lines, 20, 74)

  // Results breakdown
  let y = 74 + lines.length * 5 + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 42, 94)
  doc.text('Detailed Results', 20, y)
  y += 7

  ;(result.value || []).forEach(item => {
    if (y > 270) { doc.addPage(); y = 20 }
    const name = CONCERN_LABELS[item.type] || item.type
    const { label, color } = scoreLabel(item.ui_score)
    const [r2, g2, b2] = color === '#22c55e' ? [34,197,94] : color === '#84cc16' ? [132,204,22] : color === '#f59e0b' ? [245,158,11] : [239,68,68]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(55, 65, 81)
    doc.text(name, 20, y)
    // bar bg
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(65, y - 4, 100, 5, 2, 2, 'F')
    // bar fill
    doc.setFillColor(r2, g2, b2)
    doc.roundedRect(65, y - 4, item.ui_score, 5, 2, 2, 'F')
    // score
    doc.setTextColor(r2, g2, b2)
    doc.setFont('helvetica', 'bold')
    doc.text(`${item.ui_score} — ${label}`, 170, y)
    y += 8
  })

  // Disclaimer
  y += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(150, 150, 150)
  doc.text('This report is AI-generated and not a medical diagnosis. Please consult a licensed dermatologist.', 20, y)

  return doc
}

function downloadReport() {
  const doc = generatePDF()
  doc.save('skin-analysis-report.pdf')
}

function startDermatologistCall() {
  showDermConfirm.value = false
  const summaryToSend = aiSummary.value || buildFallbackSummary()
  localStorage.setItem('skinAnalysisSummary', summaryToSend)

  // Generate PDF and store in localStorage for doctor chat
  const doc = generatePDF()
  const date = new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })
  const pdfBase64 = doc.output('datauristring')
  localStorage.setItem('skinAnalysisPDF', pdfBase64)
  localStorage.setItem('skinAnalysisPDFDate', date)

  localStorage.setItem('autoStartDoctor', 'dr-grace')
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
  padding: 32px 36px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  color: white;
  margin: 0px 150px;
}
.eyebrow {
  font-size: 0.85rem; font-weight: 500; opacity: 0.85; display: block;
}
.hero-banner h1 { margin: 0; font-size: 2rem; font-weight: 800; line-height: 1.15; }
.hero-banner p  { margin: 0; opacity: 0.85; font-size: 0.95rem; }

/* ══════════════════════════════════════════════════════
   THREE-COLUMN LAYOUT
══════════════════════════════════════════════════════ */
.three-col {
  display: grid;
  grid-template-columns: 336px 1fr 270px;
  gap: 60px;
  align-items: start;
  margin-right: 75px;
  margin-top:30px;

}

/* ── Face image column ── */
.face-col { display: flex; flex-direction: column; }
.face-img { width: 100%; display: block; object-fit: contain; border-radius: 16px; }

/* ── Capture column ── */
.capture-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Info column ── */
.info-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.info-card-title {
  font-size: 1rem; font-weight: 900; color: #111827;
  margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
}
.info-card-title i { color: #374151; font-size: 1rem; }

.tip-list { display: flex; flex-direction: column; gap: 10px; }
.tip-item { display: flex; align-items: flex-start; gap: 10px; }
.tip-icon-inline {
  font-size: 0.9rem; color: #374151;
  flex-shrink: 0; width: 18px;
  text-align: center; margin-top: 3px;
}
.tip-img {
  width: 16px; height: 16px;
  flex-shrink: 0; object-fit: contain;
  margin-top: 2px;
}
.tip-img-title {
  width: 18px; height: 18px;
  flex-shrink: 0; object-fit: contain;
}
.tip-text { display: flex; flex-direction: column; }
.tip-text strong { font-size: 0.84rem; color: #111827; font-weight: 800; line-height: 1.3; }
.tip-text span { font-size: 0.69rem; color: #6b7280; line-height: 1.3; margin-top: 1px; }

.concern-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 2px;
  align-items: start;
}
.concern-grid span { font-size: 0.8rem; color: #111827; line-height: 1.35; font-weight: 400; }

/* ── Mode Tabs ── */
.mode-tabs {
  display: flex; background: #e5e7eb;
  border-radius: 50px;  gap: 4px;
  border: 1.5px solid #1e3a8a;
}
.mode-tab {
  flex: 1; padding: 11px 20px;
  border: none; border-radius: 50px;
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer; color: #6b7280;
  background: transparent;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s;
}
.mode-tab.active { background: #1e3a8a; color: white; }
.mode-tab:not(.active):hover { color: #374151; }

/* ── Upload Card ── */
.upload-card {
  border: 1.5px solid #111827; border-radius: 16px;
  background: #fff; cursor: pointer; transition: all 0.25s;
  min-height: 350px; display: flex; align-items: center; justify-content: center;
  overflow: hidden; width: 100%;
}
.upload-card:hover { border-color: #1a73e8; background: #f8fbff; }
.hidden { display: none; }

.upload-empty { text-align: center; padding: 48px 24px; width: 100%; }
.upload-placeholder-img {
  width: 50px; height: 50px;
  object-fit: contain;
  margin: 0 auto 14px;
  display: block;
  opacity: 0.9;
}
.upload-empty h3 { margin: 0 0 6px; font-size: 1.1rem; font-weight: 700; color: #1a2540; }
.upload-empty p  { margin: 0; color: #6b7280; font-size: 0.86rem; }

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
  height: 78%; max-height: 300px; aspect-ratio: 3 / 4;
  border: 3px dashed rgba(255,255,255,0.7); border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.35);
  transition: border-color 0.3s, box-shadow 0.3s;
}
.face-oval.oval-green {
  border: 3px solid #22c55e;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.25), 0 0 20px rgba(34,197,94,0.6);
}
.face-oval.oval-yellow {
  border: 3px dashed #f59e0b;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.35);
}
.face-oval.oval-red {
  border: 3px dashed #ef4444;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
}
.guide-badge {
  margin-top: 16px; font-size: 0.82rem; font-weight: 600;
  padding: 6px 14px; border-radius: 20px; display: flex; align-items: center; gap: 7px;
  background: rgba(0,0,0,0.55); color: white; backdrop-filter: blur(6px);
  transition: background 0.3s;
}
.guide-badge.badge-green { background: rgba(34,197,94,0.75); }
.guide-badge.badge-yellow { background: rgba(245,158,11,0.75); }

/* Quality HUD */
.quality-hud {
  position: absolute;
  top: 12px; right: 12px;
  display: flex; flex-direction: column; gap: 6px;
  pointer-events: none;
}
.q-check {
  font-size: 0.72rem; font-weight: 600;
  padding: 5px 10px 5px 8px;
  border-radius: 8px;
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,0,0,0.45);
  color: rgba(255,255,255,0.45);
  backdrop-filter: blur(6px);
  transition: all 0.25s;
}
.q-check.pass { background: rgba(0,0,0,0.45); color: #4ade80; }
.q-check.fail { background: rgba(0,0,0,0.45); color: rgba(255,255,255,0.35); }
.q-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: currentColor; flex-shrink: 0;
}

/* detect canvas hidden */
.detect-canvas { display: none; }

/* Capture button disabled state */
.cam-btn.capture:disabled {
  opacity: 0.4; cursor: not-allowed; transform: none;
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

/* ── Large tablet (≤1100px): hide face col ── */
@media (max-width: 1100px) {
  .three-col { grid-template-columns: 1fr 210px; gap: 18px; }
  .face-col  { display: none; }
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ── Tablet (≤860px): single column ── */
@media (max-width: 860px) {
  .three-col { grid-template-columns: 1fr; }
  .face-col  { display: none; }
  .info-col  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .hero-banner { padding: 22px 20px; }
  .hero-banner h1 { font-size: 1.7rem; }
  .scan-inner { grid-template-columns: 1fr; text-align: center; }
  .scan-frame { max-width: 280px; margin: 0 auto; }
  .scan-dots  { justify-content: center; }
  .scan-concerns { justify-content: center; }
  .report-header { padding: 20px 22px; gap: 16px; }
  .rh-info h2 { font-size: 1.2rem; }
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
  /* Summary modal */
  .summary-modal { width: 95vw; max-width: 95vw; }
  .sm-score-row { flex-direction: column; align-items: center; }
  .sm-footer { flex-wrap: wrap; }
  .sm-result-row { grid-template-columns: 90px 1fr 32px; }
}

/* ── Mobile (≤640px) ── */
@media (max-width: 640px) {
  .skin-wrap { gap: 12px; padding: 0 12px; }
  .hero-banner { padding: 18px 16px; border-radius: 14px; }
  .hero-banner h1 { font-size: 1.4rem; }
  .hero-banner p  { font-size: 0.85rem; }
  .mode-tabs { border-radius: 50px; }
  .mode-tab  { font-size: 0.8rem; padding: 9px 10px; }
  .upload-card { min-height: 220px; border-radius: 14px; }
  .upload-empty { padding: 32px 16px; }
  .upload-empty h3 { font-size: 1rem; }
  .upload-empty p  { font-size: 0.82rem; }
  .info-col { grid-template-columns: 1fr; }
  .analyze-btn { padding: 13px 20px; font-size: 0.92rem; }
  .scanning-screen { min-height: 320px; padding: 20px 0; }
  .scan-frame { max-width: 240px; }
  .scan-status p { font-size: 1.1rem; }
  .scan-status span { font-size: 0.8rem; }
  .camera-feed { max-height: 280px; }
  .face-oval   { height: 70%; max-height: 220px; }
  .cards-grid { grid-template-columns: 1fr; gap: 10px; }
  .metric-card { padding: 12px 14px; }
  .metric-score { font-size: 1.25rem; }
  .report-header { flex-direction: column; align-items: flex-start; padding: 16px; border-radius: 14px; gap: 14px; }
  .rh-left { gap: 12px; }
  .report-avatar { width: 64px; height: 64px; }
  .rh-info h2 { font-size: 1.05rem; }
  .rh-meta span { font-size: 0.74rem; }
  .overall-ring { width: 76px; height: 76px; }
  .ring-num { font-size: 1.4rem; }
  .new-scan-btn-header { width: 100%; justify-content: center; }
  .section-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .legend { gap: 8px; font-size: 0.74rem; }
  .disclaimer { font-size: 0.76rem; padding: 12px 14px; }
  .summarize-btn { padding: 14px 24px; font-size: 0.95rem; }
  /* Quality HUD — smaller on mobile */
  .quality-hud { top: 8px; right: 8px; gap: 4px; }
  .q-check { font-size: 0.65rem; padding: 4px 7px; }
  .q-dot { width: 6px; height: 6px; }
  /* Summary modal */
  .summary-modal { width: 98vw; border-radius: 16px; }
  .sm-header { padding: 16px 18px; gap: 10px; }
  .sm-header h3 { font-size: 0.95rem; }
  .sm-body { padding: 14px 16px; max-height: 60vh; }
  .sm-score-row { flex-direction: column; align-items: center; gap: 12px; }
  .sm-score-circle { width: 76px; height: 76px; }
  .sm-score-inner { width: 62px; height: 62px; }
  .sm-score-num { font-size: 1.2rem; }
  .sm-footer { padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
  .sm-dismiss, .sm-download-btn, .sm-talk-btn { flex: 1; font-size: 0.82rem; padding: 10px 12px; justify-content: center; }
  .sm-result-row { grid-template-columns: 80px 1fr 28px; gap: 6px; }
  .sm-result-name { font-size: 0.75rem; }
  .sm-result-score { font-size: 0.75rem; }
}

/* ── Small phone (≤400px) ── */
@media (max-width: 400px) {
  .hero-banner { padding: 14px 12px; }
  .hero-banner h1 { font-size: 1.2rem; }
  .hero-banner p  { font-size: 0.8rem; }
  .mode-tab { font-size: 0.76rem; padding: 8px 8px; }
  .report-avatar { width: 54px; height: 54px; }
  .rh-info h2 { font-size: 0.95rem; }
  .overall-ring { width: 68px; height: 68px; }
  .ring-num { font-size: 1.25rem; }
  .metric-score { font-size: 1.1rem; }
  .scan-frame { max-width: 210px; }
  .sm-dismiss, .sm-download-btn { display: none; }
  .sm-talk-btn { width: 100%; justify-content: center; }
  .quality-hud { display: none; }
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
  padding: 20px 26px;
  overflow-y: auto;
  max-height: 65vh;
}

/* Score row */
.sm-score-row {
  display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px;
}
.sm-score-circle {
  width: 90px; height: 90px; border-radius: 50%;
  display: grid; place-items: center; flex-shrink: 0;
  padding: 5px;
}
.sm-score-inner {
  width: 74px; height: 74px; border-radius: 50%;
  background: white; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.sm-score-num { font-size: 1.5rem; font-weight: 900; color: #1a2540; line-height: 1; }
.sm-score-label { font-size: 0.62rem; font-weight: 700; color: #6b7280; margin-top: 2px; }
.sm-score-info { flex: 1; }

.sm-summary-text {
  font-size: 0.9rem; line-height: 1.65; color: #1a2540; margin: 0;
  background: #f8fbff; border: 1px solid #c2d7ff;
  border-radius: 12px; padding: 14px 16px;
}

/* Detailed results */
.sm-results { margin-top: 4px; }
.sm-results-title {
  font-size: 0.82rem; font-weight: 700; color: #6b7280;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 10px;
}
.sm-results-grid { display: flex; flex-direction: column; gap: 8px; }
.sm-result-row {
  display: grid; grid-template-columns: 110px 1fr 36px;
  align-items: center; gap: 10px;
}
.sm-result-name { font-size: 0.82rem; color: #374151; font-weight: 500; }
.sm-result-bar-bg {
  background: #f1f5f9; border-radius: 99px; height: 7px; overflow: hidden;
}
.sm-result-bar-fill {
  height: 100%; border-radius: 99px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}
.sm-result-score { font-size: 0.82rem; font-weight: 700; text-align: right; }

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
.sm-download-btn {
  background: #f0fdf4; color: #16a34a;
  border: 1px solid #bbf7d0; border-radius: 12px;
  padding: 12px 20px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: background 0.2s;
}
.sm-download-btn:hover { background: #dcfce7; }
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
