SET NAMES utf8mb4;

ALTER TABLE container
  MODIFY COLUMN region_warehouse_code VARCHAR(64) NULL COMMENT '区域仓编码';

ALTER TABLE location
  MODIFY COLUMN region_warehouse_code VARCHAR(64) NULL COMMENT '区域仓编码';

UPDATE print_field_dict
SET is_required = 0,
    description = '区域仓编码'
WHERE template_type = 'LOCATION'
  AND field_code = 'warehouseCode';
