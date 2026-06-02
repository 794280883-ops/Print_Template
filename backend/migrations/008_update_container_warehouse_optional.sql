-- 将容器模板的区域仓编码(warehouseCode)改为可选
UPDATE print_field_dict
SET is_required = 0
WHERE template_type = 'CONTAINER' AND field_code = 'warehouseCode';
