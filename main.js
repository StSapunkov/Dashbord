        const ICONS = ['🎯', '📌', '🔧', '💡', '📊', '🚀', '📋', '🎨', '⚙️', '🔑'];
        const DAYS_UK = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'п\'ятниця', 'субота'];
        const MONTHS_UK = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

        const LS_KEY = 'neo_tasks_v1';

        /* ── localStorage ── */
        function saveToLS() {
            try {
                localStorage.setItem(LS_KEY, JSON.stringify({ tasks, nextId }));
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

        /* ── Дата ── */
        function setDate() {
            const now = new Date();
            document.getElementById('dateValue').textContent =
                `${now.getDate()} ${MONTHS_UK[now.getMonth()]} ${now.getFullYear()}`;
            document.getElementById('dateSub').textContent = DAYS_UK[now.getDay()];
        }

        /* ── Статистика ── */
        function updateStats() {
            const total = tasks.reduce((s, t) => s + t.checks.length, 0);
            const done = tasks.reduce((s, t) => s + t.checks.filter(Boolean).length, 0);
            const pct = total > 0 ? Math.round(done / total * 100) : 0;
            document.getElementById('statTotal').textContent = tasks.length;
            document.getElementById('statDone').textContent = done;
            document.getElementById('statPct').textContent = pct + '%';
        }

        /* ── Рендер ── */
        function renderTasks() {
            const list = document.getElementById('taskList');
            if (!tasks.length) {
                list.innerHTML = '<div class="empty-state">Немає задач. Додайте першу!</div>';
                updateStats(); return;
            }
            list.innerHTML = tasks.map(t => {
                const done = t.checks.filter(Boolean).length;
                const pct = Math.round(done / 30 * 100);
                const allDone = done === 30;
                return `<div class="task-card ${t.open ? '' : 'task-collapsed'}" id="card-${t.id}">
    <div class="task-header" onclick="toggleTask(${t.id})">
        <div class="task-title-row">
        <div class="task-icon">${t.icon}</div>
        <div class="task-name">${t.name}</div>
        </div>
        <div class="task-meta">
        <div class="progress-pill ${allDone ? 'done' : ''}">${done}/30</div>
        <div class="chevron" style="transform:rotate(${t.open ? '180deg' : '0deg'})">▼</div>
        <button class="delete-task-btn" onclick="deleteTask(event,${t.id})" title="Видалити">✕</button>
        </div>
    </div>
    <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
    </div>
    <div class="checkboxes-grid">
        ${t.checks.map((c, i) => `
        <label class="neo-cb">
            <input type="checkbox" ${c ? 'checked' : ''} onchange="toggleCheck(${t.id},${i})"/>
            <div class="check-inner">${c ? '✓' : ''}</div>
            <span class="cb-num">${i + 1}</span>
        </label>`).join('')}
    </div>
    </div>`;
            }).join('');
            updateStats();
        }

        /* ── Дії ── */
        function toggleTask(id) {
            const t = tasks.find(x => x.id === id);
            if (t) { t.open = !t.open; renderTasks(); saveToLS(); }
        }

        function toggleCheck(id, idx) {
            const t = tasks.find(x => x.id === id);
            if (t) { t.checks[idx] = !t.checks[idx]; renderTasks(); saveToLS(); }
        }

        function deleteTask(e, id) {
            e.stopPropagation();
            tasks = tasks.filter(x => x.id !== id);
            renderTasks(); saveToLS();
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
                id: nextId++, name,
                icon: ICONS[Math.floor(Math.random() * ICONS.length)],
                checks: Array(30).fill(false),
                open: true
            });
            inp.value = '';
            toggleAddForm();
            renderTasks(); saveToLS();
        }

        document.getElementById('newTaskInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') addTask();
            if (e.key === 'Escape') toggleAddForm();
        });

        /* ── Ініціалізація ── */
        const DEFAULT_TASKS = [
            { id: 1, name: 'Ранкова медитація', icon: '📌', checks: Array(30).fill(false), open: true },
            { id: 2, name: 'Масаж обличч’я', icon: '💡', checks: Array(30).fill(false), open: false },
            { id: 3, name: 'Фізкультура', icon: '📊', checks: Array(30).fill(false), open: false },
        ];

        const saved = loadFromLS();
        let tasks = saved ? saved.tasks : DEFAULT_TASKS;
        let nextId = saved ? saved.nextId : 4;

        setDate();
        renderTasks();