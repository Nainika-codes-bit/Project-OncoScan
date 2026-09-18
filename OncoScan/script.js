/* ============================================================
   OncoScan — frontend interactivity
   NOTE: There is no real AI model wired up here. analyze()
   below produces a placeholder result so the interface can be
   demoed end-to-end. Swap runFakeAnalysis() for a real call to
   your backend's /api/analyze endpoint (see synopsis, section 5)
   once the model is deployed.
   ============================================================ */

const fileInput   = document.getElementById('fileInput');
const cameraBtn    = document.getElementById('cameraBtn');
const shutterBtn   = document.getElementById('shutterBtn');
const analyzeBtn   = document.getElementById('analyzeBtn');
const viewfinder   = document.getElementById('viewfinder');
const vfEmpty      = document.getElementById('vfEmpty');
const previewImg   = document.getElementById('previewImg');
const cameraFeed   = document.getElementById('cameraFeed');
const captureCanvas= document.getElementById('captureCanvas');
const scanHint     = document.getElementById('scanHint');

const resultsSection = document.getElementById('results');
const resultLabel    = document.getElementById('resultLabel');
const resultDesc     = document.getElementById('resultDesc');
const confidenceValue= document.getElementById('confidenceValue');
const confidenceFill = document.getElementById('confidenceFill');
const speakBtn        = document.getElementById('speakBtn');

let currentStream = null;
let hasImage = false;

/* ---------------- Upload ---------------- */
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  stopCamera();
  const url = URL.createObjectURL(file);
  showPreview(url);
});

/* ---------------- Camera ---------------- */
cameraBtn.addEventListener('click', async () => {
  if (currentStream) { stopCamera(); return; }
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    cameraFeed.srcObject = currentStream;
    vfEmpty.hidden = true;
    previewImg.hidden = true;
    cameraFeed.hidden = false;
    shutterBtn.hidden = false;
    cameraBtn.textContent = 'Stop camera';
    scanHint.textContent = 'Centre the spot in frame, then press Capture.';
  } catch (err) {
    scanHint.textContent = "Couldn't access the camera. You can upload a photo instead.";
  }
});

shutterBtn.addEventListener('click', () => {
  const track = currentStream.getVideoTracks()[0];
  const settings = track.getSettings();
  captureCanvas.width = settings.width || cameraFeed.videoWidth;
  captureCanvas.height = settings.height || cameraFeed.videoHeight;
  captureCanvas.getContext('2d').drawImage(cameraFeed, 0, 0, captureCanvas.width, captureCanvas.height);
  const url = captureCanvas.toDataURL('image/png');
  stopCamera();
  showPreview(url);
});

function stopCamera(){
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    currentStream = null;
  }
  cameraFeed.hidden = true;
  shutterBtn.hidden = true;
  cameraBtn.textContent = 'Use camera';
}

/* ---------------- Preview ---------------- */
function showPreview(url){
  previewImg.src = url;
  previewImg.hidden = false;
  vfEmpty.hidden = true;
  hasImage = true;
  analyzeBtn.disabled = false;
  scanHint.textContent = 'Looks good. Press Analyze photo when you\u2019re ready.';
  resultsSection.hidden = true;
}

/* ---------------- Analyze ---------------- */
analyzeBtn.addEventListener('click', () => {
  if (!hasImage) return;
  runFakeAnalysis();
});

function runFakeAnalysis(){
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing\u2026';
  viewfinder.classList.add('is-analyzing');

  const scanLine = document.createElement('div');
  scanLine.className = 'scan-line';
  viewfinder.appendChild(scanLine);

  setTimeout(() => {
    viewfinder.classList.remove('is-analyzing');
    scanLine.remove();
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze photo';
    showResult(pickPlaceholderResult());
  }, 1600);
}

/* Placeholder classes — replace with real model output */
const PLACEHOLDER_RESULTS = [
  {
    label: 'Likely benign nevus',
    desc: 'The spot shares common traits with an ordinary mole: even colour and a fairly regular border. This is a placeholder read, not a diagnosis.',
    confidence: 0.78
  },
  {
    label: 'Possibly seborrheic keratosis',
    desc: 'The texture and edge pattern resemble a common, non-cancerous growth. Still worth a professional look if it\u2019s new or changed.',
    confidence: 0.64
  },
  {
    label: 'Features worth a closer look',
    desc: 'One or more traits \u2014 uneven colour, an irregular border, or size \u2014 stood out. This is a prompt to get it checked, not a diagnosis.',
    confidence: 0.55
  }
];

function pickPlaceholderResult(){
  return PLACEHOLDER_RESULTS[Math.floor(Math.random() * PLACEHOLDER_RESULTS.length)];
}

function showResult(result){
  resultLabel.textContent = result.label;
  resultDesc.textContent = result.desc;
  confidenceValue.textContent = Math.round(result.confidence * 100) + '%';
  confidenceFill.style.width = '0%';
  resultsSection.hidden = false;
  requestAnimationFrame(() => {
    confidenceFill.style.width = Math.round(result.confidence * 100) + '%';
  });
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------- Spoken result ---------------- */
speakBtn.addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    speakBtn.textContent = 'Speech isn\u2019t supported in this browser';
    return;
  }
  const text = `${resultLabel.textContent}. Confidence: ${confidenceValue.textContent}. ${resultDesc.textContent} This is not a medical diagnosis. Please consult a qualified doctor for any skin concern.`;
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
});
