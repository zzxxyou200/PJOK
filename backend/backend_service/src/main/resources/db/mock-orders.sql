SET @add_delivery_status = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'purchese_history'
       AND COLUMN_NAME = 'delivery_status') = 0,
    'ALTER TABLE purchese_history ADD COLUMN delivery_status VARCHAR(32) DEFAULT ''PENDING''',
    'SELECT 1'
);
PREPARE add_delivery_status_stmt FROM @add_delivery_status;
EXECUTE add_delivery_status_stmt;
DEALLOCATE PREPARE add_delivery_status_stmt;

SET @add_payment_status = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'purchese_history'
       AND COLUMN_NAME = 'payment_status') = 0,
    'ALTER TABLE purchese_history ADD COLUMN payment_status VARCHAR(32) DEFAULT ''PENDING''',
    'SELECT 1'
);
PREPARE add_payment_status_stmt FROM @add_payment_status;
EXECUTE add_payment_status_stmt;
DEALLOCATE PREPARE add_payment_status_stmt;

INSERT INTO purchese_history (
    checkout_id, user_id, product_id, product_name, serial_number,
    price, amount, unit_type, total, purchase_date, delivery_status, payment_status
)
SELECT
    'MOCK-ORDER-001', CAST(u.id AS CHAR), 1, 'Dell Latitude 5440', 'MOCK-LAPTOP-001',
    52000.00, 1, 'unit', 52000.00, '2026-11-07 09:00:00', 'PROCESSING', 'PENDING'
FROM app_user u
WHERE u.id = (
    SELECT admin_user.id
    FROM (SELECT id FROM app_user WHERE role = 'ROLE_ADMIN' ORDER BY id LIMIT 1) admin_user
)
AND NOT EXISTS (
    SELECT 1 FROM purchese_history
    WHERE checkout_id = 'MOCK-ORDER-001' AND product_id = 1
);

INSERT INTO purchese_history (
    checkout_id, user_id, product_id, product_name, serial_number,
    price, amount, unit_type, total, purchase_date, delivery_status, payment_status
)
SELECT
    'MOCK-ORDER-001', CAST(u.id AS CHAR), 9, 'Samsung 27 inch Monitor', 'MOCK-MONITOR-001',
    6800.00, 2, 'unit', 13600.00, '2026-11-07 09:00:00', 'PROCESSING', 'PENDING'
FROM app_user u
WHERE u.id = (
    SELECT admin_user.id
    FROM (SELECT id FROM app_user WHERE role = 'ROLE_ADMIN' ORDER BY id LIMIT 1) admin_user
)
AND NOT EXISTS (
    SELECT 1 FROM purchese_history
    WHERE checkout_id = 'MOCK-ORDER-001' AND product_id = 9
);

INSERT INTO purchese_history (
    checkout_id, user_id, product_id, product_name, serial_number,
    price, amount, unit_type, total, purchase_date, delivery_status, payment_status
)
SELECT
    'MOCK-ORDER-002', CAST(u.id AS CHAR), 6, 'Logitech MX Master 3S', 'MOCK-MOUSE-002',
    3500.00, 2, 'unit', 7000.00, '2026-11-06 14:30:00', 'SHIPPED', 'PAID'
FROM app_user u
WHERE u.id = (
    SELECT admin_user.id
    FROM (SELECT id FROM app_user WHERE role = 'ROLE_ADMIN' ORDER BY id LIMIT 1) admin_user
)
AND NOT EXISTS (
    SELECT 1 FROM purchese_history
    WHERE checkout_id = 'MOCK-ORDER-002' AND product_id = 6
);

INSERT INTO purchese_history (
    checkout_id, user_id, product_id, product_name, serial_number,
    price, amount, unit_type, total, purchase_date, delivery_status, payment_status
)
SELECT
    'MOCK-ORDER-002', CAST(u.id AS CHAR), 7, 'Keychron K8 Pro', 'MOCK-KEYBOARD-002',
    6200.00, 1, 'unit', 6200.00, '2026-11-06 14:30:00', 'SHIPPED', 'PAID'
FROM app_user u
WHERE u.id = (
    SELECT admin_user.id
    FROM (SELECT id FROM app_user WHERE role = 'ROLE_ADMIN' ORDER BY id LIMIT 1) admin_user
)
AND NOT EXISTS (
    SELECT 1 FROM purchese_history
    WHERE checkout_id = 'MOCK-ORDER-002' AND product_id = 7
);
