<?php

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost'; 
$dbname = 'pbt3h24aea_learnplan_db'; 
$username = 'root'; 
$password = 'root';  /

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB-Verbindung fehlgeschlagen: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Alle Tasks abrufen
        $stmt = $pdo->query('SELECT * FROM tasks ORDER BY deadline ASC');
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($tasks);
        break;

    case 'POST':
        // Neue Task hinzufügen
        $stmt = $pdo->prepare('INSERT INTO tasks (title, description, deadline, priority) VALUES (?, ?, ?, ?)');
        $stmt->execute([$input['title'], $input['description'], $input['deadline'], $input['priority']]);
        echo json_encode(['id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        // Task aktualisieren (z. B. completed toggeln)
        $id = $_GET['id'];
        $stmt = $pdo->prepare('UPDATE tasks SET completed = ? WHERE id = ?');
        $stmt->execute([$input['completed'], $id]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        // Task löschen (optional)
        $id = $_GET['id'];
        $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['error' => 'Ungültige Methode']);
        break;
}
?>