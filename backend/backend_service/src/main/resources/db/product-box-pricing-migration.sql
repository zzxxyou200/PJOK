SET @box_price_column_missing = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_prices'
      AND COLUMN_NAME = 'box_price'
);
SET @box_price_ddl = IF(
    @box_price_column_missing = 0,
    'ALTER TABLE product_prices ADD COLUMN box_price DECIMAL(38,2) NULL',
    'SELECT 1'
);
PREPARE box_price_stmt FROM @box_price_ddl;
EXECUTE box_price_stmt;
DEALLOCATE PREPARE box_price_stmt;

UPDATE product_prices
SET box_price = price * 12
WHERE box_price IS NULL
  AND price IS NOT NULL;
