<?php
date_default_timezone_set('Asia/Manila');

define('ADMIN_ID', 'A-0000');
define('ADMIN_PASSWORD', 'admin123!');
define('ADMIN_FIRST_NAME', 'Admin');
define('ADMIN_LAST_NAME', 'User');
define('ADMIN_EMAIL', 'admin@sit-in.local');
define('ADMIN_ROLE', 'admin');

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'sitinsatorre');

function get_allowed_origins(): array {
    return [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];
}
