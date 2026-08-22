# DMD Care Admin Setup (PHP)

The admin panel is server-rendered PHP. It does not require FastAPI, Uvicorn, ASGI, WSGI, or browser API requests.

## Database

The panel uses the original MySQL database through DATABASE_URL. Existing accounts, registrations, content, visitors, and SMS logs are preserved.

On this computer, the original WAMP MySQL database runs on port 3308 because another MySQL80 service occupies port 3306. run-project.bat starts the correct database automatically.

A safety copy of the original database files is stored at C:	mpdmd_care_bangladesh_before_restore_20260822.

## Requirements

- PHP 8.1+ with PDO, pdo_mysql, session, and fileinfo
- MySQL/MariaDB
- Apache with PHP enabled

Open http://DMDCareBangladesh.loc/admin.php. Requests to admin.html redirect automatically.

## cPanel

Upload the project into the PHP document root, enable PHP 8.1 or later, and configure DATABASE_URL in .env with the hosting MySQL credentials. Keep the included .htaccess to protect configuration and database files. Do not configure Passenger.