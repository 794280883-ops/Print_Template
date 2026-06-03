ALTER TABLE print_template
ADD COLUMN field_preview_values JSON DEFAULT NULL
AFTER remark;
