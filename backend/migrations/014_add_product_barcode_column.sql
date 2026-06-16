SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'barcode');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE product ADD COLUMN barcode VARCHAR(128) NULL COMMENT ''商品条码'' AFTER customer_code, ADD INDEX idx_product_barcode (barcode);',
  'SELECT ''Column barcode already exists, skipping.'' AS info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
