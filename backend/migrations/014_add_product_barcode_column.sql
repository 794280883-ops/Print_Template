ALTER TABLE product
  ADD COLUMN barcode VARCHAR(128) NULL COMMENT '商品条码' AFTER customer_code,
  ADD INDEX idx_product_barcode (barcode);
