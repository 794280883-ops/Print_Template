# API Reference

Base URL:

```text
/api/v1
```

Response format:

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

Error codes:

```text
40000 参数错误
40001 模板编码重复
40002 DSL 校验失败
40400 数据不存在
50000 系统异常
```

Implemented endpoints:

```text
GET    /health
GET    /templates
GET    /templates/:id
POST   /templates
PUT    /templates/:id
POST   /templates/:id/publish
POST   /templates/:id/disable
POST   /templates/:id/copy
POST   /templates/import
GET    /templates/:id/export
GET    /template/fields/:templateType
POST   /print/preview
POST   /print/submit
GET    /print/logs
POST   /ai/templates/generate
```

Template payload shape follows the frontend DSL:

```json
{
  "templateCode": "TPL_LOCATION_10050",
  "templateName": "库位标签-100x50",
  "templateType": "LOCATION",
  "areaWarehouseCodes": ["JP-TYO-01"],
  "size": { "width": 100, "height": 50, "unit": "mm", "dpi": 203 },
  "version": "V0",
  "status": "draft",
  "isDefault": false,
  "remark": "",
  "elements": []
}
```
