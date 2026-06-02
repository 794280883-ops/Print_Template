SET @image_url_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template_element'
    AND column_name = 'image_url'
);

SET @sql := IF(
  @image_url_exists > 0,
  'UPDATE print_template_element
   SET extra_json = JSON_SET(COALESCE(extra_json, JSON_OBJECT()), ''$.imageUrl'', image_url)
   WHERE image_url IS NOT NULL
     AND image_url <> ''''
     AND JSON_EXTRACT(COALESCE(extra_json, JSON_OBJECT()), ''$.imageUrl'') IS NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template_warehouse'
);

SET @sql := IF(@table_exists > 0, 'DROP TABLE print_template_warehouse', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template'
    AND column_name = 'version'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template DROP COLUMN version', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template'
    AND column_name = 'is_default'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template DROP COLUMN is_default', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template'
    AND column_name = 'created_by'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template DROP COLUMN created_by', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template'
    AND column_name = 'updated_by'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template DROP COLUMN updated_by', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template'
    AND column_name = 'created_at'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template DROP COLUMN created_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template_element'
    AND column_name = 'image_url'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template_element DROP COLUMN image_url', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template_element'
    AND column_name = 'created_at'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template_element DROP COLUMN created_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template_element'
    AND column_name = 'updated_at'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_template_element DROP COLUMN updated_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_field_dict'
    AND column_name = 'created_at'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_field_dict DROP COLUMN created_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_field_dict'
    AND column_name = 'updated_at'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE print_field_dict DROP COLUMN updated_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'business_data'
    AND column_name = 'created_at'
);
SET @sql := IF(@col_exists > 0, 'ALTER TABLE business_data DROP COLUMN created_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
