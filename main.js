const ICONS = ['🎯', '📌', '🔧', '💡', '📊', '🚀', '📋', '🎨', '⚙️', '🔑'];
const DAYS_UK = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'п\'ятниця', 'субота'];
const MONTHS_UK = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

const LS_KEY = 'neo_tasks_v2';

/* ── localStorage ── */
function saveToLS() {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify({ tasks, nextId, todayMarks, lastSyncDate }));
        showToast('💾 Збережено');
    } catch (e) { console.warn('localStorage недоступний', e); }
}

function loadFromLS() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) { return null; }
}

/* ── Get Today's Date String ── */
function getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getFormattedDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(year, month - 1, day);
    return `${day} ${MONTHS_UK[month - 1]} ${year}`;
}

/* ── Toast ── */
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

/* ── Sidebar mobile ── */
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const hb = document.getElementById('hamburger');
    const ov = document.getElementById('sidebarOverlay');
    sb.classList.toggle('open');
    hb.classList.toggle('open');
    ov.classList.toggle('open');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('hamburger').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

/* ── Статистика ── */
function updateStats() {
    const total = tasks.length;
    const done = tasks.reduce((s, t) => s + t.completedCount, 0);
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statDone').textContent = done;
    document.getElementById('statPct').textContent = pct + '%';
}

/* ── Update Today's Date Display ── */
function updateTodayDate() {
    const now = new Date();
    const formatted = `${now.getDate()} ${MONTHS_UK[now.getMonth()]} (${DAYS_UK[now.getDay()]})`;
    document.getElementById('todayDate').textContent = formatted;
}

/* ── Render Progress Cards ── */
function renderTasks() {
    const list = document.getElementById('taskList');
    if (!tasks.length) {
        list.innerHTML = '<div class="empty-state">Немає задач. Додайте першу!</div>';
        updateStats();
        renderTodayChecklist();
        return;
    }
    list.innerHTML = tasks.map(t => {
        const pct = t.completedCount > 0 ? Math.round(t.completedCount / 30 * 100) : 0;
        const allDone = t.completedCount >= 30;
        const todayMarked = todayMarks[t.id] ? '✓' : '';
        return `<div class="task-card ${allDone ? 'task-completed' : ''}" id="card-${t.id}">
<div class="task-header" onclick="toggleTask(${t.id})">
    <div class="task-title-row">
        <div class="task-icon">${t.icon}</div>
        <div class="task-name">${t.name}</div>
        ${todayMarked ? `<div class="today-mark-badge">${todayMarked}</div>` : ''}
    </div>
    <div class="task-meta">
        <div class="progress-pill ${allDone ? 'done' : ''}">${t.completedCount}/30</div>
        <div class="chevron" style="transform:rotate(${t.open ? '180deg' : '0deg'})">▼</div>
        <button class="delete-task-btn" onclick="deleteTask(event,${t.id})" title="Видалити">✕</button>
    </div>
</div>
<div class="progress-track">
    <div class="progress-fill" style="width:${pct}%"></div>
</div>
${t.open ? `
<div class="task-info">
    <div class="task-detail">Завершено: <strong>${t.completedCount}/30</strong></div>
    ${t.completedDate ? `<div class="task-detail">Остання дата: <strong>${getFormattedDate(t.completedDate)}</strong></div>` : ''}
</div>
` : ''}
</div>`;
    }).join('');
    updateStats();
    renderTodayChecklist();
}

/* ── Render Today's Checklist ── */
function renderTodayChecklist() {
    const checklist = document.getElementById('todayChecklist');
    if (!tasks.length) {
        checklist.innerHTML = '<div class="empty-today">Немає задач для сьогодні</div>';
        document.getElementById('todayCount').textContent = '0';
        return;
    }

    const todayChecked = Object.values(todayMarks).filter(Boolean).length;
    document.getElementById('todayCount').textContent = todayChecked;

    checklist.innerHTML = tasks.map(t => `
        <label class="today-item">
            <input type="checkbox" ${todayMarks[t.id] ? 'checked' : ''} onchange="toggleTodayMark(${t.id})"/>
            <div class="today-check-box"></div>
            <span class="today-task-icon">${t.icon}</span>
            <span class="today-task-name">${t.name}</span>
        </label>
    `).join('');
}

/* ── Toggle Today's Mark ── */
function toggleTodayMark(id) {
    todayMarks[id] = !todayMarks[id];
    renderTasks();
    saveToLS();
}

/* ── Reset Today's Marks ── */
function resetTodayMarks() {
    if (confirm('Ви впевнені? Всі позначки на сьогодні буде очищено.')) {
        todayMarks = {};
        renderTasks();
        saveToLS();
        showToast('🔄 Позначки очищено');
    }
}

/* ── Sync Today's Marks to Progress ── */
function syncTodayMarksToProgress() {
    const today = getTodayDateString();
    if (lastSyncDate === today) return; // Already synced today

    // Add today's marks to completed count
    Object.keys(todayMarks).forEach(taskId => {
        if (todayMarks[taskId]) {
            const task = tasks.find(t => t.id === parseInt(taskId));
            if (task && task.completedCount < 30) {
                task.completedCount++;
                task.completedDate = today;
            }
        }
    });

    lastSyncDate = today;
    todayMarks = {}; // Clear today's marks for next day
    saveToLS();
    renderTasks();
    showToast('📊 Прогрес оновлено!');
}

/* ── Дії ── */
function toggleTask(id) {
    const t = tasks.find(x => x.id === id);
    if (t) { t.open = !t.open; renderTasks(); saveToLS(); }
}

function deleteTask(e, id) {
    e.stopPropagation();
    tasks = tasks.filter(x => x.id !== id);
    delete todayMarks[id];
    renderTasks();
    saveToLS();
}

function toggleAddForm() {
    const f = document.getElementById('addForm');
    f.classList.toggle('open');
    if (f.classList.contains('open')) document.getElementById('newTaskInput').focus();
}

function addTask() {
    const inp = document.getElementById('newTaskInput');
    const name = inp.value.trim();
    if (!name) return;
    tasks.push({
        id: nextId++,
        name,
        icon: ICONS[Math.floor(Math.random() * ICONS.length)],
        completedCount: 0,
        completedDate: null,
        open: true
    });
    inp.value = '';
    toggleAddForm();
    renderTasks();
    saveToLS();
}

document.getElementById('newTaskInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
    if (e.key === 'Escape') toggleAddForm();
});

/* ── Ініціалізація ── */
const DEFAULT_TASKS = [
    { id: 1, name: 'Ранкова медитація', icon: '📌', completedCount: 0, completedDate: null, open: true },
    { id: 2, name: 'Масаж обличчя', icon: '💡', completedCount: 0, completedDate: null, open: false },
    { id: 3, name: 'Фізкультура', icon: '📊', completedCount: 0, completedDate: null, open: false },
];

const saved = loadFromLS();
let tasks = saved ? saved.tasks : DEFAULT_TASKS;
let nextId = saved ? saved.nextId : 4;
let todayMarks = saved ? saved.todayMarks : {};
let lastSyncDate = saved ? saved.lastSyncDate : null;

// Check if we need to sync (new day started)
const today = getTodayDateString();
if (lastSyncDate !== today) {
    syncTodayMarksToProgress();
}

updateTodayDate();
renderTasks();
