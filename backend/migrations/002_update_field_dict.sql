UPDATE print_field_dict
SET field_name = '区域仓编码',
    example_value = 'JP-TYO-01',
    is_required = 1,
    description = '区域仓编码',
    sort_no = 70
WHERE template_type = 'LOCATION' AND field_code = 'warehouseCode';

UPDATE print_field_dict
SET field_name = '物理仓编码',
    example_value = 'JP01',
    is_required = 0,
    description = '物理仓编码',
    sort_no = 80
WHERE template_type = 'LOCATION' AND field_code = 'areaCode';

DELETE FROM print_field_dict
WHERE template_type = 'LOCATION' AND field_code = 'fullLocationName';

DELETE FROM print_field_dict
WHERE template_type = 'CONTAINER'
  AND field_code <> 'containerCode';

INSERT INTO print_field_dict
  (template_type, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled)
VALUES
  ('CONTAINER','warehouseCode','区域仓编码','string','JP-TYO-01',0,'区域仓编码',20,1),
  ('CONTAINER','areaCode','物理仓编码','string','JP01',0,'物理仓编码',30,1),
  ('CONTAINER','purpose','用途','string','入库周转',0,'容器标签用途',40,1),
  ('CONTAINER','usageScene','使用场景','string','入库收货',0,'容器标签适用的业务使用场景',50,1)
ON DUPLICATE KEY UPDATE
  field_name = VALUES(field_name),
  field_type = VALUES(field_type),
  example_value = VALUES(example_value),
  is_required = VALUES(is_required),
  description = VALUES(description),
  sort_no = VALUES(sort_no),
  enabled = VALUES(enabled);

UPDATE print_template_element
SET element_uid = 'container_warehouse',
    bind_field = 'warehouseCode'
WHERE element_uid = 'container_type'
  AND NOT EXISTS (
    SELECT 1
    FROM (
      SELECT template_id
      FROM print_template_element
      WHERE element_uid = 'container_warehouse'
    ) existing
    WHERE existing.template_id = print_template_element.template_id
  );

DELETE FROM print_template_element
WHERE element_uid = 'container_type';

UPDATE print_template_element
SET element_uid = 'container_area',
    bind_field = 'areaCode'
WHERE element_uid = 'container_time'
  AND NOT EXISTS (
    SELECT 1
    FROM (
      SELECT template_id
      FROM print_template_element
      WHERE element_uid = 'container_area'
    ) existing
    WHERE existing.template_id = print_template_element.template_id
  );

DELETE FROM print_template_element
WHERE element_uid = 'container_time';

UPDATE print_template_element
SET element_uid = 'picking_purpose',
    bind_field = 'purpose'
WHERE element_uid = 'picking_qty'
  AND NOT EXISTS (
    SELECT 1
    FROM (
      SELECT template_id
      FROM print_template_element
      WHERE element_uid = 'picking_purpose'
    ) existing
    WHERE existing.template_id = print_template_element.template_id
  );

DELETE FROM print_template_element
WHERE element_uid = 'picking_qty';
