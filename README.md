# WMS 打印模板中心

可视化打印模板设计与管理平台，支持库位/容器/商品三种模板类型的拖拽式设计、字段动态绑定、一键发布与打印。

## 核心功能

- **模板管理**：创建、编辑、复制、发布、停用、删除、导入/导出
- **可视化设计器**：拖拽组件（文本/横线/矩形/一维码/二维码/复选框）、属性编辑、字段绑定、画布实时预览
- **字段字典**：库位/容器/商品三类型树形分类，展示名称与存储编码映射
- **业务数据管理**：测试库接入、Excel 导入、搜索与 CRUD
- **打印功能**：预览、提交打印、打印日志追溯
- **操作日志**：模板设计、发布等关键操作全程记录

## 技术栈

| 层 | 技术选型 |
|---|---|
| 前端 | Vite + Vanilla JavaScript + Bootstrap 5 |
| 后端 | Node.js + Express (REST API) |
| 数据库 | MySQL 8.4 |
| 容器化 | Docker + Docker Compose |
| 网关 | Nginx（反向代理 + 静态资源） |
| 部署 | 阿里云 ECS + Shell 部署脚本 |

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
cd /Users/l/Documents/Codex/wms-print-template-center
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

- 地址：http://47.113.118.74
- 健康检查：http://47.113.118.74/api/v1/health

## 目录结构

```text
wms-print-template-center/
├── .env.example              # 环境变量示例
├── .env.production.example   # 生产环境变量示例
├── docker-compose.yml        # Docker 编排配置
├── README.md
├── backend/                  # 后端服务
│   ├── migrations/           # 数据库迁移脚本
│   ├── scripts/              # 后端工具脚本
│   └── src/                  # 源代码
├── docs/                     # 项目文档
├── frontend/                 # 前端工程
│   ├── src/
│   │   ├── api/              # API 封装
│   │   ├── app/              # 主应用逻辑
│   │   ├── data/             # 数据常量
│   │   ├── pages/            # 页面模块
│   │   ├── services/         # 业务服务
│   │   └── styles/           # 样式文件
│   └── index.html
├── nginx/                    # Nginx 配置
└── scripts/                  # 部署脚本
    ├── check-before-push.sh  # 提交前检查
    ├── deploy-server.sh      # 服务器部署
    └── dev-local.sh          # 本地开发启动
```

## 文档

- [本地开发指南](docs/本地开发指南.md)
- [服务器部署指南](docs/服务器部署指南.md)
- [接口文档](docs/接口文档.md)
- [数据库设计](docs/数据库设计.md)
- [项目交接说明](docs/项目交接说明.md)

## 后续计划

- 域名备案和 HTTPS
- 登录鉴权和权限控制
- 操作日志审计增强
- 数据备份策略
- 自动化测试
- 打印模板版本管理
