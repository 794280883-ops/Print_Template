-- 003: 去掉 business_record 的编码唯一索引
-- 业务背景：导入业务数据时不再强制编码唯一，允许重复编码导入
ALTER TABLE business_record DROP INDEX uk_module_record;
