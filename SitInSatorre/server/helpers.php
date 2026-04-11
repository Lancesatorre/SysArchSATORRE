<?php

function debug_log(string $message): void {
    error_log('[' . date('Y-m-d H:i:s') . '] ' . $message);
}

function json_response(int $statusCode, array $payload): void {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit();
}

function require_admin_access(array $input): void {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        json_response(403, [
            'success' => false,
            'message' => 'Unauthorized admin request',
        ]);
    }
}

function esc(mysqli $db, string $value): string {
    return $db->real_escape_string($value);
}
