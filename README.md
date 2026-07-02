# 打印模板中心

可视化打印模板设计与管理平台，支持库位/容器/商品三种模板类型的拖拽式设计、字段动态绑定、一键发布与打印。

## 核心功能

- **模板管理**：创建、编辑、复制、启用/停用、删除、批量操作
- **可视化设计器**：拖拽组件（文本/横线/矩形/一维码/二维码/复选框）、属性编辑、字段绑定、画布实时预览
- **字段字典**：库位/容器/商品三类型树形分类，展示名称与存储编码映射
- **业务数据管理**：测试库接入、Excel 导入、搜索与 CRUD
- **打印功能**：预览、提交打印、打印日志追溯
- **操作日志**：模板设计、发布等关键操作全程记录

## 技术栈

| 层 | 技术选型 |
|---|---|
| 前端 | Vite 7 + Vue 3.5 + Ant Design Vue 4.x + Pinia + Vue Router 4 |
| 后端 | Node.js 22 + Express 5.2 (REST API) + JWT鉴权 |
| 数据库 | MySQL 8.4 (Docker) |
| PDF生成 | PDFKit + bwip-js（条码）+ qrcode（二维码） |
| 容器化 | Docker + Docker Compose |
| 网关 | Nginx 1.27（反向代理 + 静态资源 + HTTPS） |
| 部署 | 阿里云 ECS + Shell 一键部署脚本 |

## 本地开发

### 1. 启动 MySQL

```bash
# 启动 Docker Desktop（如果未运行）
open -a "Docker Desktop"

# 启动已有 MySQL 容器
docker start mysql
```

### 2. 启动项目

```bash
cd /Users/l/Documents/Wms_Print/wms-print-template-center
./scripts/dev-local.sh
```

脚本会自动执行数据库迁移并启动前后端服务。

### 3. 访问

```bash
# 自动打开浏览器和 DataGrip
open http://127.0.0.1:5173
open -a "DataGrip" "jdbc:mysql://127.0.0.1:3306/wms_print_template"
```

- 前端：http://127.0.0.1:5173
- 后端健康检查：http://127.0.0.1:3001/api/v1/health

## 服务器部署

### 一键部署

```bash
./scripts/deploy-server.sh
```

脚本会自动连接阿里云服务器，拉取最新代码，构建并启动所有服务。

### 公网访问

- 地址：https://customprint.icu
- 健康检查：https://customprint.icu/api/v1/health

## 目录结构

```text
wms-print-template-center/
├── .env.example              # 本地开发环境变量示例
├── .env.production.example   # 生产环境变量示例
├── .env.test.example        # 测试环境变量示例
├── docker-compose.yml        # Docker 编排配置
├── README.md
├── backend/                  # 后端服务
│   ├── fonts/                # PDF 中文字体
│   ├── migrations/           # 数据库迁移脚本
│   ├── scripts/              # 后端工具脚本（迁移执行等）
│   ├── tests/                # 后端测试
│   ├── src/
│   │   ├── config/           # 数据库、环境变量配置
│   │   ├── controllers/      # 控制器（请求处理）
│   │   ├── middlewares/      # 中间件（认证、错误处理）
│   │   ├── repositories/     # 数据访问层（SQL操作）
│   │   ├── routes/           # 路由定义
│   │   ├── services/         # 业务逻辑层
│   │   ├── utils/            # 工具函数（DSL校验、响应封装）
│   │   ├── app.js            # Express应用配置
│   │   └── server.js         # 服务入口
│   ├── Dockerfile
│   └── package.json
├── docs/                     # 项目文档
├── frontend/                 # 前端工程
│   ├── tests/                # 前端测试
│   ├── src/
│   │   ├── api/              # API 封装（axios请求）
│   │   ├── data/             # 数据常量
│   │   ├── directives/       # 自定义指令（v-permission）
│   │   ├── layouts/          # 布局组件（AppLayout/LoginLayout等）
│   │   ├── router/           # 路由配置+守卫
│   │   ├── services/         # 业务服务（校验、下载、缩放等）
│   │   ├── stores/           # Pinia状态管理（权限session）
│   │   ├── styles/           # 全局样式
│   │   ├── views/            # 页面视图
│   │   │   ├── business/     # 业务数据页
│   │   │   ├── error/        # 403等错误页
│   │   │   ├── fields/       # 模版字段页
│   │   │   ├── home/         # 首页
│   │   │   ├── login/        # 登录页
│   │   │   ├── system/       # 系统管理（用户/角色/菜单）
│   │   │   └── templates/    # 模板列表+设计器
│   │   ├── App.vue           # 根组件
│   │   └── main.js           # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── nginx/                    # Nginx 配置
└── scripts/                  # 部署脚本
    ├── check-before-push.sh  # 提交前检查
    ├── deploy-server.sh      # 服务器部署
    └── dev-local.sh          # 本地开发启动
```

## 文档

- [功能清单](docs/功能清单.md)
- [变更日志](docs/变更日志.md)
- [本地开发指南](docs/本地开发指南.md)
- [服务器部署指南](docs/服务器部署指南.md)
- [接口文档](docs/接口文档.md)
- [数据库设计](docs/数据库设计.md)
- [环境变量说明](docs/环境变量说明.md)
- [系统流程](docs/系统流程.md)
- [用户操作手册](docs/用户操作手册.md)
- [权限系统开发规范](docs/权限系统开发规范.md)
- [测试指南](docs/测试指南.md)
- [项目架构总览](docs/项目架构总览.md)
- [后端服务层说明](docs/后端服务层说明.md)

## 字段映射参考

所有业务数据统一存储在 `business_record` 表中，字段 schema 由 `print_field_dict` + `print_business_module` 运行时动态编译，无需硬编码映射。

系统预置三个业务模块的字段，完整字段定义（含可排序、是否必填、是否启用查询等属性）见 [数据库设计 - 字段字典定义](docs/数据库设计.md#字段字典定义)：

- **库位（8个字段）**：库位编码、库位前缀、排、列、层、方向标、区域仓编码、物理仓编码
- **容器（3个字段）**：容器编码、区域仓编码、物理仓编码
- **商品（3个字段）**：商品编码、商品条码、客户商品编码

> 方向标规则详见 [数据库设计 - 方向标规则](docs/数据库设计.md#方向标规则)

## 给后续开发者

继续开发前先执行：

```bash
cd /Users/l/Documents/Wms_Print/wms-print-template-center
git status --short --branch
./scripts/dev-local.sh    # 本地调试
./scripts/check-before-push.sh  # 提交前检查
```

## 后续计划

- ~~域名备案和 HTTPS~~ ✅ 已配置 Let's Encrypt 证书，customprint.icu
- ~~统一后端平台~~ ✅ business_record 单表 + 运行时 schema
- ~~权限系统~~ ✅ RBAC 五表模型、按钮级权限管控
- ~~登录鉴权和权限控制~~ ✅ JWT 鉴权、路由守卫、v-permission 指令
- 操作日志审计增强
- 数据备份策略
- 自动化测试
- 打印模板版本管理

## 项目规范

### 文件目录约定

| 目录 | 用途 |
|------|------|
| `docs/` | 项目文档 |
| `backend/tests/` | 后端单元测试 |
| `frontend/tests/` | 前端单元测试 |

- 禁止将图片/视频直接放在项目根目录
- 测试截图按步骤顺序命名（如 `step1-xxx.png`）
- 定期清理不再需要的临时测试文件
