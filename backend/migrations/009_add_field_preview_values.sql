SET @field_preview_values_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'print_template'
    AND column_name = 'field_preview_values'
);

SET @field_preview_values_sql := IF(
  @field_preview_values_exists = 0,
  'ALTER TABLE print_template ADD COLUMN field_preview_values JSON DEFAULT NULL AFTER remark',
  'SELECT 1'
);

PREPARE field_preview_values_stmt FROM @field_preview_values_sql;
EXECUTE field_preview_values_stmt;
DEALLOCATE PREPARE field_preview_values_stmt;
