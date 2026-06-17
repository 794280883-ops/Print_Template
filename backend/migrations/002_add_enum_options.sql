SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'print_field_dict' AND COLUMN_NAME = 'enum_options');

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE print_field_dict ADD COLUMN enum_options JSON NULL COMMENT ''枚举选项'' AFTER sortable',
  'SELECT ''enum_options already exists'' AS info');

PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
