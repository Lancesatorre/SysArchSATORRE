<?php

function handle_admin_create_announcement(mysqli $db, array $input): void {
    require_admin_access($input);

    $title = esc($db, trim($input['title'] ?? ''));
    $message = esc($db, trim($input['message'] ?? ''));
    $tag = esc($db, trim($input['tag'] ?? 'General'));

    if ($title === '' || $message === '') {
        json_response(400, ['success' => false, 'message' => 'Title and message are required']);
    }

    $allowed_tags = ['General', 'Academic', 'System'];
    if (!in_array($tag, $allowed_tags, true)) {
        $tag = 'General';
    }

    $created_by = esc($db, ADMIN_ID);
    $query = "INSERT INTO announcements (title, message, tag, created_by)
              VALUES ('$title', '$message', '$tag', '$created_by')";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to create announcement']);
    }

    json_response(201, [
        'success' => true,
        'message' => 'Announcement posted successfully',
        'announcementId' => $db->insert_id,
    ]);
}

function handle_admin_announcement_records(mysqli $db, array $input): void {
    require_admin_access($input);

    $query = "SELECT id, title, message, tag, created_by, created_at
              FROM announcements
              ORDER BY created_at DESC, id DESC
              LIMIT 300";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load announcement records']);
    }

    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }

    json_response(200, [
        'success' => true,
        'message' => 'Announcement records loaded',
        'records' => $records,
    ]);
}

function handle_admin_update_announcement(mysqli $db, array $input): void {
    require_admin_access($input);

    $id = intval($input['id'] ?? 0);
    $title = esc($db, trim($input['title'] ?? ''));
    $message = esc($db, trim($input['message'] ?? ''));
    $tag = esc($db, trim($input['tag'] ?? 'General'));

    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid announcement ID']);
    }

    if ($title === '' || $message === '') {
        json_response(400, ['success' => false, 'message' => 'Title and message are required']);
    }

    $allowed_tags = ['General', 'Academic', 'System'];
    if (!in_array($tag, $allowed_tags, true)) {
        $tag = 'General';
    }

    $query = "UPDATE announcements
              SET title = '$title',
                  message = '$message',
                  tag = '$tag'
              WHERE id = $id";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to update announcement']);
    }

    json_response(200, [
        'success' => true,
        'message' => 'Announcement updated successfully',
    ]);
}

function handle_admin_delete_announcement(mysqli $db, array $input): void {
    require_admin_access($input);

    $id = intval($input['id'] ?? 0);
    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid announcement ID']);
    }

    $query = "DELETE FROM announcements WHERE id = $id";
    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to delete announcement']);
    }

    json_response(200, [
        'success' => true,
        'message' => 'Announcement deleted successfully',
    ]);
}
