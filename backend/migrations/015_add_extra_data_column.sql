-- Add extra_data JSON column for storing dynamically-added fields
-- that don't have dedicated columns in the table

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'location' AND COLUMN_NAME = 'extra_data');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE location ADD COLUMN extra_data JSON NULL COMMENT ''动态字段''',
  'SELECT ''Column extra_data already exists in location, skipping.'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'container' AND COLUMN_NAME = 'extra_data');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE container ADD COLUMN extra_data JSON NULL COMMENT ''动态字段''',
  'SELECT ''Column extra_data already exists in container, skipping.'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'extra_data');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE product ADD COLUMN extra_data JSON NULL COMMENT ''动态字段''',
  'SELECT ''Column extra_data already exists in product, skipping.'' AS info');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
