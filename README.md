# WMS 打印模板中心

第一阶段已将单文件 HTML 原型迁移为 Vite 前端工程。第二阶段已新增 Node.js + Express 后端、MySQL 连接、初始化 SQL、种子数据和 REST API。第三阶段已将前端主流程切换为后端 API。第四阶段已补齐 Docker Compose、Nginx 和环境变量示例。

## 当前范围

- 已创建 `frontend` 工程。
- 已抽离样式到 `frontend/src/styles/wms.css`。
- 已拆出 mock 数据、DSL 服务、校验服务、AI mock 服务、请求封装和模板 API。
- 已保留模板列表、设计器、标准模板库、字段字典、业务打印模拟、打印日志等原型能力。
- 尚未实现生产鉴权、日志归档、备份和自动化测试。

## 本地启动

前端：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/frontend
npm install
npm run dev
```

构建检查：

```bash
npm run build
```

后端：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

默认后端地址为 `http://127.0.0.1:3001`，健康检查为 `GET /api/v1/health`。

前端 API 默认请求 `/api/v1`，本地 Vite 会代理到 `http://127.0.0.1:3001`。如需指定后端地址，可设置：

```bash
VITE_API_BASE_URL=http://127.0.0.1:3001/api/v1 npm run dev
```

## 后端 API

统一响应格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

已实现接口：

```text
GET    /api/v1/health
GET    /api/v1/templates
GET    /api/v1/templates/:id
POST   /api/v1/templates
PUT    /api/v1/templates/:id
POST   /api/v1/templates/:id/publish
POST   /api/v1/templates/:id/disable
POST   /api/v1/templates/:id/copy
POST   /api/v1/templates/import
GET    /api/v1/templates/:id/export
GET    /api/v1/template/fields/:templateType
POST   /api/v1/print/preview
POST   /api/v1/print/submit
GET    /api/v1/print/logs
POST   /api/v1/ai/templates/generate
```

## MySQL 初始化

`backend/migrations/001_init.sql` 会创建以下表，并写入原型中的 3 个模板、LOCATION/CONTAINER 字段字典和仓库种子数据：

```text
print_template
print_template_element
print_template_warehouse
print_field_dict
print_log
operation_log
```

执行：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center/backend
cp .env.example .env
npm run migrate
```

## Docker 启动

```bash
cd /Users/l/Documents/Codex/wms-print-template-center
cp .env.example .env
docker compose up -d --build
```

默认访问地址：

```text
前端入口：http://127.0.0.1:8080
后端健康检查：http://127.0.0.1:8080/api/v1/health
MySQL：127.0.0.1:3306
```

## 目录说明

```text
wms-print-template-center/
├── .env.example
├── README.md
├── backend/
│   ├── migrations/
│   ├── scripts/
│   └── src/
├── docker-compose.yml
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── api/
        ├── app/
        ├── data/
        ├── pages/
        ├── services/
        ├── styles/
        └── main.js
```

## 后续阶段

下一阶段建议补充发布文档、鉴权、结构化日志、备份策略和自动化测试。
