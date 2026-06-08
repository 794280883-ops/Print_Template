# 本地开发启动流程

本项目本地开发不需要重新下载 MySQL 镜像。当前约定是复用你已经在 Docker Desktop 手动启动的 MySQL 服务，并用 DataGrip 查看或维护数据库。

## 1. 启动 MySQL

在 Docker Desktop 中启动已有 MySQL 容器。

当前本机约定：

```text
Host: 127.0.0.1
Port: 3306
Database: wms_print_template
```

DataGrip 只作为数据库连接工具使用，它不会启动 MySQL 服务。需要先确认 Docker Desktop 中 MySQL 容器已运行。

## 2. 检查本地环境变量

项目根目录需要有本地 `.env` 文件：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center
cp .env.example .env
```

如果已经存在 `.env`，不要覆盖，检查以下字段即可：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD= # 填写你的本地 MySQL 密码
DB_NAME=wms_print_template
CORS_ORIGIN=http://127.0.0.1:5173
```

`.env` 已在 `.gitignore` 中，不允许提交。

## 3. 启动本地项目

确认 MySQL 已运行后：

```bash
cd /Users/l/Documents/Codex/wms-print-template-center
./scripts/dev-local.sh
```

脚本会执行：

```text
1. 检查 127.0.0.1:3306 是否可连接
2. 执行数据库迁移
3. 启动后端热重载服务：http://127.0.0.1:3001
4. 启动前端 Vite 服务：http://127.0.0.1:5173
```

访问本地页面：

```text
http://127.0.0.1:5173
```

健康检查：

```text
http://127.0.0.1:3001/api/v1/health
```

## 4. 日常开发流程

推荐流程：

```text
本地修改代码
-> 在 http://127.0.0.1:5173 验证
-> ./scripts/check-before-push.sh
-> git commit / git push
-> ./scripts/deploy-server.sh
```

不要为了看页面效果频繁部署服务器。服务器只作为最终验收环境。

## 5. 常见问题

如果提示：

```text
Local MySQL is not reachable on 127.0.0.1:3306.
```

处理方式：

```text
1. 打开 Docker Desktop
2. 启动已有 MySQL 容器
3. 确认端口映射包含 3306 -> 3306
4. 重新执行 ./scripts/dev-local.sh
```

如果 DataGrip 可以连接，但后端不能连接，重点检查 `.env` 中的 `DB_PASSWORD`、`DB_NAME` 是否与 DataGrip 配置一致。
