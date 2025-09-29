const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const applyBtn = document.getElementById('applyBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const resultEl = document.getElementById('result');
const historyEl = document.getElementById('history');

let segments = [];
let isSpinning = false;
let startAngle = 0;
let currentSpeed = 0;
let animationId = null;
const cx = canvas.width / 2, cy = canvas.height / 2, radius = Math.min(cx, cy) - 10;
let history = [];

function loadSegmentsFromInput() {
    const raw = document.getElementById('segmentsInput').value.trim().split('\n').filter(Boolean);
    segments = raw.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return { label: parts[0] || 'Item', color: randomColor() };
    });
    if (segments.length === 0) segments = [{ label: 'Vazio', color: '#999' }];
}

function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20;
    const lightness = 25 + Math.random() * 15;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const segCount = segments.length;
    const arc = 2 * Math.PI / segCount;

    for (let i = 0; i < segCount; i++) {
        const start = startAngle + i * arc;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, start + arc);
        ctx.closePath();
        ctx.fillStyle = segments[i].color;
        ctx.fill();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.max(18, radius / 10);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(segments[i].label, radius - 60, 0);
        ctx.fillText(segments[i].label, radius - 60, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
}

function spin() {
    if (isSpinning) return;
    isSpinning = true;

    const segCount = segments.length;
    const arc = (2 * Math.PI) / segCount;

    // sorteia o índice do segmento vencedor
    const winnerIndex = Math.floor(Math.random() * segCount);

    // calcula ângulo do centro do segmento
    const winnerAngle = (segCount - winnerIndex - 0.5) * arc;

    // adiciona alguns giros completos aleatórios (3 a 6 giros)
    const extraSpins = Math.floor(Math.random() * 3) + 3;
    const targetAngle = (extraSpins * 6 * Math.PI) + winnerAngle;

    const duration = 4000;
    const start = performance.now();

    function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        startAngle = targetAngle * easeOut;
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            const winner = segments[winnerIndex].label;
            announceResult(winner);
        }
    }

    requestAnimationFrame(animate);
}

function announceResult() {
    const normalized = (2 * Math.PI - (startAngle - Math.PI / 2)) % (2 * Math.PI);
    const segCount = segments.length;
    const arc = 2 * Math.PI / segCount;
    let index = Math.floor(normalized / arc) % segCount;
    if (index < 0) index += segCount;
    const seg = segments[index];

    resultEl.textContent = `Resultado: ${seg.label}`;
    pushHistory(seg.label);
}

function pushHistory(label) {
    history.unshift({ label, time: new Date().toLocaleTimeString() });
    if (history.length > 10) history.pop();
    renderHistory();
}

function renderHistory() {
    historyEl.innerHTML = '';
    history.forEach(h => {
        const div = document.createElement('div');
        div.className = 'seg';
        div.innerHTML = `<div style="flex:1">${h.label}</div><div class="small">${h.time}</div>`;
        historyEl.appendChild(div);
    });
}

function emergencyStop() {
    if (!isSpinning) return;
    isSpinning = false;
    cancelAnimationFrame(animationId);
    animationId = null;
    announceResult();
}

function reset() {
    startAngle = 0;
    isSpinning = false;
    cancelAnimationFrame(animationId);
    animationId = null;
    resultEl.textContent = 'Clique em Girar';
    drawWheel();
}

function applyChanges() {
    loadSegmentsFromInput();
    drawWheel();
}

function randomPick() {
    const idx = Math.floor(Math.random() * segments.length);
    const seg = segments[idx];
    resultEl.textContent = `Sorteio aleatório: ${seg.label}`;
    pushHistory(seg.label);
}

spinBtn.addEventListener('click', spin);
stopBtn.addEventListener('click', emergencyStop);
resetBtn.addEventListener('click', reset);
applyBtn.addEventListener('click', applyChanges);
randomizeBtn.addEventListener('click', randomPick);

loadSegmentsFromInput();
drawWheel();

(function fixDPI() {
    const dpr = window.devicePixelRatio || 1;
    if (dpr !== 1) {
        const w = canvas.width;
        const h = canvas.height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
    }
})();

window.addEventListener('keydown', e => {
    if (e.code === 'Ctrl') {
        e.preventDefault();
        spin();
    }
});