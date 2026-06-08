# Claude Code 交接说明：WMS 打印模板中心

更新时间：2026-06-08 15:02 CST

## 1. 项目概况

项目目录：

```text
/Users/l/Documents/Codex/wms-print-template-center
```

GitHub 仓库：

```text
git@github.com:794280883-ops/Print_Template.git
```

当前主分支：

```text
main
```

技术栈：

```text
frontend: Vite + Vanilla JavaScript
backend:  Node.js + Express
database: MySQL
deploy:   Docker Compose + Nginx
```

## 2. 当前 Git 状态

当前本地和 GitHub `origin/main` 一致，最新提交：

```text
bf42747 docs: add local development workflow
```

最近关键提交：

```text
bf42747 docs: add local development workflow
42b6591 fix: 业务数据新增按钮与模板打印按钮位置对调
f72da4e feat: support business data management and deployment
b1ac69a fix: 方向标字段值映射转换，数据库枚举值转为中文显示
9ed473e feat: 接入测试库业务数据只读查询
```

当前只有本交接文档未提交。该文档用于 AI/人工交接，可按需要提交或保留本地。

## 3. 本地开发流程

当前本地开发不再自动下载或启动 MySQL 镜像。约定是：

```text
1. 在 Docker Desktop 手动启动已有 MySQL 容器
2. 用 DataGrip 查看或维护数据库
3. 用脚本启动本地后端和前端
```

本机 MySQL 约定：

```text
Host: 127.0.0.1
Port: 3306
Database: wms_print_template
```

DataGrip 只是数据库客户端，不负责启动 MySQL。

本地启动：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center
./scripts/dev-local.sh
```

脚本行为：

```text
1. 检查 127.0.0.1:3306 是否可连接
2. 执行数据库迁移
3. 启动后端：http://127.0.0.1:3001
4. 启动前端：http://127.0.0.1:5173
```

本地访问：

```text
http://127.0.0.1:5173
http://127.0.0.1:3001/api/v1/health
```

相关文件：

```text
docs/LOCAL_DEVELOPMENT.md
docs/DEPLOYMENT.md
scripts/dev-local.sh
scripts/check-before-push.sh
scripts/deploy-server.sh
```

## 4. 业务数据模块

业务数据模块已经支持：

```text
查询
新增
编辑
删除
业务数据打印选择
业务数据预览
```

业务类型：

```text
LOCATION  库位管理
CONTAINER 容器管理
PRODUCT   商品管理
```

接口：

```text
GET    /api/v1/business-data/types
GET    /api/v1/business-data/warehouses
GET    /api/v1/business-data/search
GET    /api/v1/business-data/detail/:bizType/:bizCode
POST   /api/v1/business-data
PUT    /api/v1/business-data/:bizType/:bizCode
DELETE /api/v1/business-data/:bizType/:bizCode
```

统一响应格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

最近已排查问题：

```text
本地页面新增业务数据报 Failed to fetch。
根因：本地前后端进程已经退出，浏览器请求不到后端。
验证：重启 ./scripts/dev-local.sh 后，直连后端和通过 Vite 代理新增/删除业务数据均成功。
```

## 5. 字段映射

后端映射配置：

```text
backend/src/config/businessDataMapping.js
```

当前映射：

```text
LOCATION -> location
  locationCode   -> location_code       必填
  locationPrefix -> location_prefix
  row            -> location_row
  column         -> location_column
  level          -> location_floor
  directionMark  -> direction_flag
  warehouseCode  -> region_warehouse_code  非必填
  areaCode       -> physics_warehouse_code

CONTAINER -> container
  containerCode  -> container_code      必填
  warehouseCode  -> region_warehouse_code  非必填
  areaCode       -> physics_warehouse_code

PRODUCT -> product
  productCode         -> sku            必填
  customerProductCode -> customer_code
```

方向标规则：

```text
数据库 direction_flag = 1 -> 业务数据显示：向上 -> 打印：↑
数据库 direction_flag = 2 -> 业务数据显示：向下 -> 打印：↓
数据库 direction_flag = 空 -> 业务数据显示空 -> 打印空
```

## 6. 数据库迁移

业务数据本地表迁移：

```text
backend/migrations/011_add_local_business_tables.sql
backend/migrations/012_make_region_warehouse_optional.sql
```

`011` 创建：

```text
product
container
location
```

`012` 调整：

```text
container.region_warehouse_code 允许为空
location.region_warehouse_code 允许为空
print_field_dict 中 LOCATION / warehouseCode 改为非必填
```

注意：迁移脚本不要写真实密码。真实连接信息只放在 `.env` 或服务器 `.env.production`。

## 7. 服务器部署

服务器：

```text
公网 IP：47.113.118.74
主私网 IP：172.16.117.184
```

部署目录：

```text
/opt/wms-print-template-center
```

服务器生产环境变量：

```text
/opt/wms-print-template-center/.env.production
```

该文件包含真实密码，不能提交到 Git。

服务器访问：

```text
http://47.113.118.74
http://47.113.118.74/api/v1/health
```

域名：

```text
customprint.icu
www.customprint.icu
```

域名已解析到服务器，但当前受阿里云 ICP 备案限制，备案完成前建议继续使用公网 IP。

服务器部署脚本：

```bash
./scripts/deploy-server.sh
```

注意：该脚本默认使用：

```text
SSH_KEY=/tmp/wms_deploy_key
```

当前本地该临时 key 可能不存在。若要使用脚本部署，需要恢复 key 或传入：

```bash
SSH_KEY=/path/to/key ./scripts/deploy-server.sh
```

## 8. 安全与敏感信息

不要提交：

```text
.env
.env.test
.env.production
backend/.env
backend/.env.test
backend/.env.production
frontend/.env
frontend/.env.test
frontend/.env.production
真实数据库密码
服务器 root 密码
SSH 私钥
公司内网数据库连接信息
```

提交前执行：

```bash
./scripts/check-before-push.sh
```

该脚本会检查：

```text
后端 JS 语法
前端 production build
常见敏感信息模式
真实 env 文件是否被 Git 跟踪
```

## 9. 当前验证状态

最近一次已验证：

```text
本地前端 http://127.0.0.1:5173 返回 200
本地后端 http://127.0.0.1:3001/api/v1/health 返回 200
本地业务数据新增/删除接口成功
Vite 代理 /api/v1/business-data 新增/删除成功
服务器 http://47.113.118.74/api/v1/health 返回 200
```

## 10. 后续建议

建议优先事项：

```text
1. 若需要让域名正式访问，先完成 customprint.icu ICP 备案。
2. 备案完成后配置 HTTPS。
3. 业务数据新增/编辑/删除后续应加鉴权。
4. 业务数据删除可考虑改成软删除。
5. 迁移脚本目前每次启动会执行全部 SQL，后续可引入 migration history 表。
6. 如果部署脚本要长期使用，建议准备固定 SSH key，不依赖 /tmp/wms_deploy_key。
```

## 11. 交接给 Claude Code 的操作建议

继续开发前先执行：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center
git status --short --branch
```

如果只是本地调试：

```bash
./scripts/dev-local.sh
```

如果准备提交：

```bash
./scripts/check-before-push.sh
git add <files>
git commit -m "<message>"
git push origin main
```

如果准备部署服务器：

```bash
SSH_KEY=/path/to/key ./scripts/deploy-server.sh
```
