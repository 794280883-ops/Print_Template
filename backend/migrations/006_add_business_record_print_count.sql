-- 006: 为业务数据增加系统字段「打印次数」
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
      AND table_name = 'business_record'
      AND column_name = 'print_count'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE business_record ADD COLUMN print_count INT NOT NULL DEFAULT 0 AFTER status',
    'SELECT "business_record.print_count already exists, skip" AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'business_record'
      AND index_name = 'idx_module_print_count'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE business_record ADD INDEX idx_module_print_count (module_code, print_count)',
    'SELECT "idx_module_print_count already exists, skip" AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO print_field_dict
  (module_code, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled, searchable, sortable, bindable_in_template, is_unique)
SELECT
  module_code,
  'printCount',
  '打印次数',
  'integer',
  NULL,
  0,
  '系统字段：统计业务数据成功打印次数',
  9999,
  1,
  0,
  1,
  0,
  0
FROM print_business_module
ON DUPLICATE KEY UPDATE
  field_type = 'integer',
  is_required = 0,
  searchable = 0,
  bindable_in_template = 0,
  is_unique = 0;
