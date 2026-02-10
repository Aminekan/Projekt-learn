const API_BASE = 'http://localhost/learnplan/api/tasks.php'; // Definiert die Basis-URL für die API, mit der kommuniziert wird


document.addEventListener('DOMContentLoaded', function() {  // Wartet, bis das HTML-Dokument vollständig geladen ist, bevor der Code ausgeführt wird
    loadTasks();
    updateProgress();
    renderDailyOverview();
    renderCalendar();
    checkReminders();
    document.getElementById('task-form').addEventListener('submit', addTask); // Fügt dem Formular einen Event-Listener hinzu, der beim Absenden die addTask-Funktion aufruft
});

let tasks = []; // Array zum Speichern aller Aufgaben

//----------HILFSFUNKTIONEN----------
function priorityLabel(p) {
    if (p === 'low') return 'Niedrig';
    if (p === 'medium') return 'Mittel';    //Übersetzt englische Prioritätswerte in deutsche Bezeichnungen
    if (p === 'high') return 'Hoch';
    return p || '';
}

//Tasks vom Server laden
async function loadTasks(){ //Asynchrone Funktion mit Fehlerbehandlung
    try{
        const response = await fetch(API_BASE); // Sendet eine GET-Anfrage an die API
        tasks = await response.json(); // Konvertiert die Antwort in JSON und speichert sie im tasks-Array
        console.log('Geladene Tasks:', tasks); // Debug
        renderTasks();
    }
    catch (error){ //Fängt Fehler ab und gibt sie in der Konsole aus

        console.error('Fehler beim Laden der Aufgaben:', error);
    }
}
//-----Task hinzufügen-----

async function addTask(event){ //Verhindert das Standard-Formularverhalten (Seiten-Reload)
    event.preventDefault();
    console.log('Add Task gestartet'); // Debug
     const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const deadline = document.getElementById('task-deadline').value;
    const priority = document.getElementById('Task-priority').value;

    try{
        const response = await fetch(API_BASE, { //Sendet eine POST-Anfrage an die API mit den Task-Daten als JSON
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, deadline, priority })
        });
        const result = await response.json();
        console.log('POST Ergebnis:', result); // Debug
        await loadTasks(); //Aktualisiert alle Ansichten nach dem Hinzufügen
        updateProgress();
        renderDailyOverview();
        renderCalendar();
        document.getElementById('task-form').reset(); // Setzt das Formular zurück
    }
    catch (error){
        console.error('Fehler beim Hinzufügen der Aufgabe:', error);
    }

}
//------Task-Status wechseln (erledigt/unerledigt)------

async function toggleTask(id){ 

    const task = tasks.find(t => t.id === id); //Sucht die Aufgabe mit der gegebenen ID, bricht ab wenn nicht gefunden
    if (!task) return;

    try{ //Sendet eine PUT-Anfrage um den completed-Status umzukehren
        await fetch(`${API_BASE}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !task.completed })
        });
        await loadTasks(); // Aktualisiert alle Ansichten
        updateProgress();
        renderDailyOverview();
        renderCalendar();
    }
    catch (error){
        console.error('Fehler beim Aktualisieren der Aufgabe:', error);
    }
}

/*function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/*function addTask(event) {
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
    }*/


 //------AUFGABEN ANZEIGEN--------

    function renderTasks(){ //Leert die Task-Liste
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';
        tasks.forEach(task => { //Durchläuft alle Tasks
            const li = document.createElement('li');
            li.className = 'task-item'+(task.completed ? ' completed' : '') ;//Erstellt ein Listenelement und fügt die Klasse 'completed' hinzu wenn erledigt
            //Füllt das Element mit HTML: Checkbox, Titel, Beschreibung, Deadline und Priorität
            li.innerHTML = ` 
            <div class="task-details">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <strong>${task.title}</strong> - ${task.description} <br>
            Deadline: ${task.deadline} | Priorität: <span class="task-priority ${task.priority}">${priorityLabel(task.priority)}</span>
            </div> `;
            taskList.appendChild(li); //Fügt das Element zur Liste hinzu
        });
    }

//------FORTSCHRITT AKTUALISIEREN-------

    function updateProgress(){ //Zählt erledigte und gesamte Aufgaben
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0; //Berechnet den Prozentsatz (verhindert Division durch 0)
        //Aktualisiert die Fortschrittsanzeige (Balken und Text)
        document.getElementById('progress-fill').style.width = percentage + '%';
        document.getElementById('progress-text').innerText = `Fortschritt: ${completed} / ${total} Aufgaben erledigt`;
    }

//------Tagesübersicht------

    function renderDailyOverview(){
        const today = new Date().toISOString().split('T')[0]; //Holt das heutige Datum im Format YYYY-MM-DD
        const dailyTasks = tasks.filter(t => t.deadline === today); //Filtert Aufgaben mit heutigem Deadline
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
                Priority: <span class="task-priority ${task.priority}">${priorityLabel(task.priority)}</span>
                </div> `;
                dailyList.appendChild(li);
            });
        }
    }

//------Kalender rendern------

    function renderCalendar(){
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear(); //Initialisiert Kalender mit aktuellem Monat und Jahr
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();//Ermittelt ersten Wochentag des Monats und Anzahl der Tage
// Erstellt Wochentag-Header
        const daysOfWeek = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        daysOfWeek.forEach(day => {
            const div = document.createElement('div');
            div.textContent = day;
            div.style.fontWeight = 'bold';
            calendar.appendChild(div);
        });
//Fügt leere Divs für Tage vor dem Monatsbeginn ein
        for (let i= 0; i < firstDay; i++){
            const div = document.createElement('div');
            calendar.appendChild(div);
        }
//Durchläuft alle Tage des Monats und formatiert das Datum
        for (let day =1; day <= daysInMonth; day++){
            const div = document.createElement('div');
            div.textContent = day;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => t.deadline === dateStr);//Zeigt die Anzahl der Aufgaben für jeden Tag an
            if (dayTasks.length > 0){
                div.classList.add('tasks');
                div.innerHTML += `<br>${dayTasks.length} Aufgabe(n)`;
            }
            calendar.appendChild(div);
        }
    }

//------Erinnerungen prüfen------

function checkReminders(){ //Berechnet das morgige Datum
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const upcomingTasks = tasks.filter(t => !t.completed &&  (t.deadline === tomorrowStr || new Date(t.deadline) < today)); //Filtert unerledigte Aufgaben die morgen fällig oder überfällig sind
    if (upcomingTasks.length > 0){ //Zeigt eine Alert-Nachricht wenn es solche Aufgaben gibt
        alert( `Erinnerung: ${upcomingTasks.length} Aufgabe(n) sind überfällig oder fällig morgen!`);
    }
}


