<?php

// CORS‑Preflight behandeln: bei OPTIONS nur die erlaubten Header/Methoden
// zurückgeben und sofort beenden – kein weiterer Code wird ausgeführt.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0); // Browser wollte nur die CORS‑Info, mehr nicht.
}

// Standard‑Header für alle Antworten setzen (JSON‑API & CORS)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Datenbank‑Verbindungsdaten 
$host = 'localhost'; 
$dbname = 'pbt3h24aea_learnplan_db'; 
$username = 'root'; 
$password = 'root';

try {
    // PDO‑Objekt anlegen und Fehlerausgabe auf Exception stellen
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Verbindungsfehler als JSON zurückgeben und Skript beenden
    echo json_encode(['error' => 'DB-Verbindung fehlgeschlagen: ' . $e->getMessage()]);
    exit;
}

// Methode und JSON‑Körper einlesen (PUT/POST senden per php://input)
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// je nach HTTP‑Methode unterschiedliche Aktionen ausführen
switch ($method) {
    case 'GET':
        // alle Tasks abfragen, nach Deadline sortiert
        $stmt = $pdo->query('SELECT * FROM tasks ORDER BY deadline ASC');
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($tasks);
        break;

    case 'POST':
        // neue Aufgabe anlegen; Werte aus dem JSON‑Body verwenden
        $stmt = $pdo->prepare('INSERT INTO tasks (title, description, deadline, priority) VALUES (?, ?, ?, ?)');
        $stmt->execute([$input['title'], $input['description'], $input['deadline'], $input['priority']]);
        echo json_encode(['id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        // Task aktualisieren – ID kommt als Query‑Parameter, neues
        // completed‑Flag aus JSON
        $id = $_GET['id'];
        $stmt = $pdo->prepare('UPDATE tasks SET completed = ? WHERE id = ?');
        $stmt->execute([$input['completed'], $id]);
        echo json_encode(['success' => true]);
        break;

    default:
        // alle anderen Methoden sind ungültig, Fehlermeldung ausgeben
        echo json_encode(['error' => 'Ungültige Methode']);
        break;
}

?>