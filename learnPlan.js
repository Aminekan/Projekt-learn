document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateProgress();
    renderDailyOverview();
    renderCalendar();
    checkReminders();
    document.getElementById('task-form').addEventListener('submit', addTask);
});

let tasks =JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTask(event) {
    event.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('Task-priority').value;
    const task = {
        id: Date.now(),
        title,
        description,
        deadline,
        priority,
        completed: false
    };
    tasks.push(task);
    saveTasks();
    renderTasks();
    updateProgress();
    renderDailyOverview();
    renderCalendar();
    document.getElementById('task-form').reset();
    }

    function renderTasks(){
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item'+(task.completed ? ' completed' : '') ;
            li.innerHTML = `
            <div class="task-details">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <strong>${task.title}</strong> - ${task.description} <br>
            Deadline: ${task.deadline} | Priorität: <span class="task-priority ${task.priority}"></span>
            </div> `;
            taskList.appendChild(li);
        });
    }
    function toggleTask(id){
        const task = tasks.find(t => t.id === id);
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateProgress();
        renderDailyOverview();
        renderCalendar();
    }

    function updateProgress(){ 
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        document.getElementById('progress-fill').style.width = percentage + '%';
        document.getElementById('progress-text').innerText = `Fortschritt: ${completed} / ${total} Aufgaben erledigt`;
    }

    function renderDailyOverview(){
        const today = new Date().toISOString().split('T')[0];
        const dailyTasks = tasks.filter(t => t.deadline === today);
        const dailyList = document.getElementById('daily-tasks');
        dailyList.innerHTML = '';
        if (dailyTasks.length === 0){
            dailyList.innerHTML = '<li>Keine Aufgaben für heute!</li>';
        } else {
            dailyTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item' + (task.completed ? ' completed' : '');
                li.innerHTML = `
                <div class="task-details">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                <strong>${task.title}</strong> - ${task.description} <br>
                Priority: <span class="task-priority ${task.priority}</span>
                </div> `;
                dailyList.appendChild(li);
            });
        }
    }
    function renderCalendar(){
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const daysOfWeek = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        daysOfWeek.forEach(day => {
            const div = document.createElement('div');
            div.textContent = day;
            div.style.fontWeight = 'bold';
            calendar.appendChild(div);
        });

        for (let i= 0; i < firstDay; i++){
            const div = document.createElement('div');
            calendar.appendChild(div);
        }

        for (let day =1; day <= daysInMonth; day++){
            const div = document.createElement('div');
            div.textContent = day;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => t.deadline === dateStr);
            if (dayTasks.length > 0){
                div.classList.add('tasks');
                div.innerHTML += `<br>${dayTasks.length} Aufgabe(n)`;
            }
            calendar.appendChild(div);
        }
    }
function checkReminders(){
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const upcomingTasks = tasks.filter(t => !t.completed &&  (t.deadline === tomorrowStr || new Date(t.deadline) < today));
    if (upcomingTasks.length > 0){
        alert( `Erinnerung: ${upcomingTasks.length} Aufgabe(n) sind überfällig oder fällig morgen!`);
    }
}
function loadTasks(){
    renderTasks();
}
    