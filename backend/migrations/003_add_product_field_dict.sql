INSERT INTO print_field_dict
  (template_type, field_code, field_name, field_type, example_value, is_required, description, sort_no, enabled)
VALUES
  ('PRODUCT','productCode','商品编码','string','SKU-10001',1,'商品编码',10,1),
  ('PRODUCT','ProductBarcode','商品条码','string','TM001,TM002',0,'商品条码',15,1),
  ('PRODUCT','customerProductCode','客户商品编码','string','CUST-SKU-10001',0,'客户商品编码',20,1)
ON DUPLICATE KEY UPDATE
  field_name = VALUES(field_name),
  field_type = VALUES(field_type),
  example_value = VALUES(example_value),
  is_required = VALUES(is_required),
  description = VALUES(description),
  sort_no = VALUES(sort_no),
  enabled = VALUES(enabled);
