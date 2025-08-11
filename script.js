/* Main JavaScript for The Creator's Mirror
   This file handles saving reflections, viewing history,
   exporting to PDF, and optional ambient sound. */

// Grab references to important elements on the page
const textarea = document.getElementById('reflection');
const viewPastBtn = document.getElementById('viewPast');
const exportBtn = document.getElementById('exportPDF');
const toggleSoundBtn = document.getElementById('toggleSound');
const modal = document.getElementById('historyModal');
const closeModal = document.getElementById('closeModal');
const historyList = document.getElementById('historyList');

// Load existing reflections from localStorage (if any)
let reflections = JSON.parse(localStorage.getItem('reflections')) || [];
const today = new Date().toISOString().split('T')[0];

// Display today's reflection if it exists
const todayEntry = reflections.find(r => r.date === today);
if (todayEntry) {
  textarea.value = todayEntry.text;
}

// Save the current reflection to localStorage whenever the user types
textarea.addEventListener('input', () => {
  const text = textarea.value.trim();
  const existing = reflections.find(r => r.date === today);
  if (existing) {
    existing.text = text;
  } else {
    reflections.push({ date: today, text });
  }
  localStorage.setItem('reflections', JSON.stringify(reflections));
});

// Show modal with past reflections
viewPastBtn.addEventListener('click', () => {
  historyList.innerHTML = '';
  // Sort entries from newest to oldest
  const sorted = [...reflections].sort((a, b) => b.date.localeCompare(a.date));
  sorted.forEach(entry => {
    const wrapper = document.createElement('div');
    wrapper.className = 'history-entry';
    const title = document.createElement('h3');
    title.textContent = new Date(entry.date).toDateString();
    const text = document.createElement('p');
    text.textContent = entry.text || '(No entry)';
    wrapper.appendChild(title);
    wrapper.appendChild(text);
    historyList.appendChild(wrapper);
  });
  modal.classList.remove('hidden');
});

// Close the modal
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', e => {
  if (e.target === modal) modal.classList.add('hidden');
});

// Export all reflections to a PDF file
exportBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFont('Times', '');
  doc.setFontSize(18);
  doc.text('Reflections', 105, 10, { align: 'center' });
  doc.setFontSize(12);

  // Sort entries by date from oldest to newest for readability
  const sorted = [...reflections].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach(entry => {
    const dateStr = new Date(entry.date).toDateString();
    doc.text(dateStr, 10, y);
    y += 6;
    const lines = doc.splitTextToSize(entry.text, 180);
    doc.text(lines, 10, y);
    y += lines.length * 6 + 4;
    // Add new page if necessary
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });
  doc.save('reflections.pdf');
});

/* Ambient sound using the Web Audio API */
let audioCtx, gainNode;
let oscillators = [];
let playing = false;

function startSound() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0; // start silent
  gainNode.connect(audioCtx.destination);

  // Two gentle sine-wave oscillators for a calming chord
  [220, 440].forEach(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gainNode);
    osc.start();
    oscillators.push(osc);
  });

  // Fade in volume
  gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 2);
  playing = true;
  toggleSoundBtn.textContent = 'Mute Sound';
}

function stopSound() {
  if (!audioCtx) return;
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
  setTimeout(() => {
    oscillators.forEach(o => o.stop());
    oscillators = [];
    audioCtx.close();
    playing = false;
    toggleSoundBtn.textContent = 'Play Sound';
  }, 1200);
}

toggleSoundBtn.addEventListener('click', () => {
  if (!playing) {
    startSound();
  } else {
    stopSound();
  }
});
