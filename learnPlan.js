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
    const description = document.getElementById('task-description').value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('task-priority').value;
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
        taskList.innnerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item'+(task.completed ? ' completed' : '') ;
            li.innerHTML = `
            <div class="task-details">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <strong>${task.title}</strong> -${task.description} <br>
            Deadline: ${task.deadline} | Priorität: <span class="task-priority ${task.priority}</span>
            </div> `;
            taskList.appendChild(li);
        });
    }
    function toggleTask(id){
        const task = tasks.find(t => t.id === id);
        task.comleted = !task.completed;
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
        document.getElementById('progress-bar').style.width = percentage + '%';
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
                li.innerText = task.title + (task.completed ? ' completed' : '');
                li.innerHTML = `
                <div class="task-details">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                <strong>${task.title}</strong> -${task.description} <br>
                Priority: <span class="task-priority ${task.priority}</span>
                </div> `;
                dailyList.appendChild(li);
            });


    