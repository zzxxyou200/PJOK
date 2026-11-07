SET @stock_column_missing = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_items'
      AND COLUMN_NAME = 'stock_quantity'
);
SET @stock_column_ddl = IF(
    @stock_column_missing = 0,
    'ALTER TABLE product_items ADD COLUMN stock_quantity INT NOT NULL DEFAULT 1',
    'SELECT 1'
);
PREPARE stock_column_stmt FROM @stock_column_ddl;
EXECUTE stock_column_stmt;
DEALLOCATE PREPARE stock_column_stmt;

SET @stock_backfill = IF(
    @stock_column_missing = 0,
    'UPDATE product_items SET stock_quantity = CASE WHEN item_status = ''AVAILABLE'' THEN 1 ELSE 0 END',
    'SELECT 1'
);
PREPARE stock_backfill_stmt FROM @stock_backfill;
EXECUTE stock_backfill_stmt;
DEALLOCATE PREPARE stock_backfill_stmt;

SET @unit_column_missing = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_items'
      AND COLUMN_NAME = 'unit_type'
);
SET @unit_column_ddl = IF(
    @unit_column_missing = 0,
    'ALTER TABLE product_items ADD COLUMN unit_type VARCHAR(50) DEFAULT ''UNIT''',
    'SELECT 1'
);
PREPARE unit_column_stmt FROM @unit_column_ddl;
EXECUTE unit_column_stmt;
DEALLOCATE PREPARE unit_column_stmt;

ALTER TABLE product_items MODIFY COLUMN images MEDIUMTEXT;
