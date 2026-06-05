const BASE_URL = 'https://yce-api-01.makeupar.com'
const API_KEY = import.meta.env.VITE_PERFECTCORP_API_KEY

const AUTH_HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
}

// HD group: wrinkle, pore, texture, acne, dark_circle, eye_bag, firmness, moisture
// SD group: spot, redness, radiance, oiliness, evenness
// NOTE: HD aur SD concerns ko mix mat karo ek request mein

// SD concerns — min image short side: 480px (normal phone photos work fine)
// HD concerns — min image short side: 1080px (high-res only)
export async function analyzeSkin(imageFile, concerns = ['wrinkle', 'pore', 'texture', 'acne', 'dark_circle_v2', 'oiliness', 'radiance', 'firmness', 'moisture', 'redness']) {

  // ── Step 1: File metadata register karo ──────────────────────────────────
  const fileRes = await fetch(`${BASE_URL}/s2s/v2.0/file/skin-analysis`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      files: [{
        content_type: imageFile.type,
        file_name: imageFile.name,
        file_size: imageFile.size
      }]
    })
  })

  const fileJson = await fileRes.json()
  console.log('[SkinAPI] Step 1 — file register response:', fileJson)

  if (!fileRes.ok || fileJson.status !== 200) {
    throw new Error(`File register failed: ${fileJson.message || fileJson.status || fileRes.status}`)
  }

  // Handle all possible response structures from YCE API:
  // A. { data: { file_id, requests: [{url, headers}] } }
  // B. { data: [{ file_id, requests: [...] }] }
  // C. { data: { files: [{ file_id, requests: [...] }] } }
  // D. { data: { result: [{ file_id, upload_url }] } }
  let fileEntry = null
  const d = fileJson.data

  if (Array.isArray(d)) {
    fileEntry = d[0]
  } else if (d?.files && Array.isArray(d.files)) {
    fileEntry = d.files[0]
  } else if (d?.result && Array.isArray(d.result)) {
    fileEntry = d.result[0]
  } else {
    fileEntry = d
  }

  console.log('[SkinAPI] Step 1 — fileEntry:', fileEntry)

  // file_id can be under different keys
  const file_id = fileEntry?.file_id || fileEntry?.id || fileEntry?.fileId

  // upload URL can be under requests[].url OR upload_url directly
  let uploadReq = null
  if (Array.isArray(fileEntry?.requests) && fileEntry.requests.length) {
    uploadReq = fileEntry.requests[0]
  } else if (fileEntry?.upload_url) {
    uploadReq = { url: fileEntry.upload_url, method: 'PUT', headers: {} }
  }

  console.log('[SkinAPI] file_id:', file_id, '| upload url:', uploadReq?.url)

  if (!file_id || !uploadReq?.url) {
    throw new Error(`Unexpected API response. file_id: ${file_id}, url: ${uploadReq?.url}. Full response in console.`)
  }

  // ── Step 2: Image S3 par upload karo (API ke diye headers include karo) ──
  // API returns required S3 headers — inhe include karna zaroori hai
  const s3Headers = { 'Content-Type': imageFile.type }
  if (uploadReq.headers && typeof uploadReq.headers === 'object') {
    Object.assign(s3Headers, uploadReq.headers)
  }

  const uploadRes = await fetch(uploadReq.url, {
    method: uploadReq.method || 'PUT',
    headers: s3Headers,
    body: imageFile
  })
  console.log('[SkinAPI] Step 2 — S3 upload status:', uploadRes.status)

  if (!uploadRes.ok) {
    throw new Error(`Image upload failed (S3 ${uploadRes.status}). Check CORS or image size.`)
  }

  // ── Step 3: Analysis task create karo ────────────────────────────────────
  const taskRes = await fetch(`${BASE_URL}/s2s/v2.0/task/skin-analysis`, {
    method: 'POST',
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      src_file_id: file_id,
      dst_actions: concerns,
      format: 'json'
    })
  })

  const taskJson = await taskRes.json()
  console.log('[SkinAPI] Step 3 — task create response (FULL):', JSON.stringify(taskJson, null, 2))

  if (!taskRes.ok || taskJson.status !== 200) {
    const msg = taskJson.message || taskJson.error || taskJson.msg || JSON.stringify(taskJson)
    throw new Error(`Task creation failed (HTTP ${taskRes.status}): ${msg}`)
  }

  const task_id = taskJson.data?.task_id
  if (!task_id) throw new Error('No task_id received from API.')

  // ── Step 4: Poll karo result ke liye (max 60 sec) ────────────────────────
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000))

    const pollRes  = await fetch(
      `${BASE_URL}/s2s/v2.0/task/skin-analysis/${task_id}`,
      { headers: { 'Authorization': `Bearer ${API_KEY}` } }
    )
    const pollJson = await pollRes.json()
    const taskStatus = pollJson.data?.task_status
    console.log(`[SkinAPI] Step 4 — poll #${i + 1} status: ${taskStatus}`, JSON.stringify(pollJson.data))

    if (taskStatus === 'success') {
      const raw = pollJson.data.results.output || []
      // Filter out API metadata fields (all, skin_age, resize_image, etc.)
      // Keep only valid skin concern types with a proper numeric score
      const VALID_CONCERNS = new Set([
        'wrinkle','pore','texture','acne','oiliness','radiance','eye_bag',
        'age_spot','dark_circle_v2','firmness','moisture','redness','tear_trough',
        'skin_type','droopy_upper_eyelid','droopy_lower_eyelid',
        'hd_wrinkle','hd_pore','hd_texture','hd_acne','hd_oiliness','hd_radiance',
        'hd_eye_bag','hd_age_spot','hd_dark_circle','hd_firmness','hd_moisture',
        'hd_redness','hd_tear_trough','hd_skin_type',
        'hd_droopy_upper_eyelid','hd_droopy_lower_eyelid'
      ])
      return raw.filter(item =>
        VALID_CONCERNS.has(item.type) &&
        typeof item.ui_score === 'number' &&
        !isNaN(item.ui_score)
      )
    }

    if (taskStatus === 'failed' || taskStatus === 'error') {
      const reason = pollJson.data?.error_msg
        || pollJson.data?.error
        || pollJson.data?.message
        || pollJson.error
        || taskStatus
      console.error('[SkinAPI] Task failed — full response:', JSON.stringify(pollJson))
      throw new Error(`Analysis error: ${reason}`)
    }
  }

  throw new Error('Analysis timed out — please try again with a clearer photo.')
}

// ui_score (0–100) ko label aur color mein convert karo
export function scoreLabel(score) {
  if (score >= 80) return { label: 'Excellent', color: '#22c55e' }
  if (score >= 60) return { label: 'Good',      color: '#84cc16' }
  if (score >= 40) return { label: 'Fair',       color: '#f59e0b' }
  return             { label: 'Needs Care',      color: '#ef4444' }
}

export const CONCERN_LABELS = {
  // HD variants
  hd_wrinkle:              'Wrinkles',
  hd_pore:                 'Pores',
  hd_texture:              'Skin Texture',
  hd_acne:                 'Acne',
  hd_dark_circle:          'Dark Circles',
  hd_eye_bag:              'Eye Bags',
  hd_firmness:             'Firmness',
  hd_moisture:             'Moisture',
  hd_oiliness:             'Oiliness',
  hd_radiance:             'Radiance',
  hd_redness:              'Redness',
  hd_age_spot:             'Age Spots',
  hd_skin_type:            'Skin Type',
  hd_tear_trough:          'Tear Trough',
  hd_droopy_upper_eyelid:  'Droopy Upper Eyelid',
  hd_droopy_lower_eyelid:  'Droopy Lower Eyelid',
  // SD variants
  wrinkle:             'Wrinkles',
  pore:                'Pores',
  texture:             'Skin Texture',
  acne:                'Acne',
  dark_circle_v2:      'Dark Circles',
  eye_bag:             'Eye Bags',
  firmness:            'Firmness',
  moisture:            'Moisture',
  oiliness:            'Oiliness',
  radiance:            'Radiance',
  redness:             'Redness',
  age_spot:            'Age Spots',
  skin_type:           'Skin Type',
  tear_trough:         'Tear Trough',
}
