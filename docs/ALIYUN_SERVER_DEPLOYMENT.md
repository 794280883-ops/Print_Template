# 阿里云服务器部署说明

目标服务器：

```text
公网 IP：47.113.118.74
主私网 IP：172.16.117.184
```

## 1. 阿里云安全组

开放入方向：

```text
22/tcp   SSH 管理
80/tcp   HTTP 访问
443/tcp  后续 HTTPS
```

不要开放：

```text
3306/tcp MySQL
3001/tcp Backend
```

## 2. 服务器初始化

```bash
sudo apt update
sudo apt install -y git ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

## 3. 拉取项目

```bash
sudo mkdir -p /opt/wms-print-template-center
sudo chown -R "$USER":"$USER" /opt/wms-print-template-center

git clone git@github.com:794280883-ops/Print_Template.git /opt/wms-print-template-center
cd /opt/wms-print-template-center
```

如果服务器没有配置 GitHub SSH Key，可临时使用 HTTPS：

```bash
git clone https://github.com/794280883-ops/Print_Template.git /opt/wms-print-template-center
```

## 4. 创建生产环境变量

```bash
cp .env.production.example .env.production
nano .env.production
```

至少替换：

```text
MYSQL_ROOT_PASSWORD=强密码
MYSQL_PASSWORD=强密码
CORS_ORIGIN=http://47.113.118.74
HTTP_PORT=80
```

## 5. 启动服务

```bash
docker compose --env-file .env.production up -d --build
```

查看状态：

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f backend
```

## 6. 验证

服务器本机：

```bash
curl http://127.0.0.1/api/v1/health
curl "http://127.0.0.1/api/v1/templates?page=1&pageSize=1"
curl "http://127.0.0.1/api/v1/business-data/search?bizType=LOCATION&page=1&pageSize=1"
```

浏览器：

```text
http://47.113.118.74
http://47.113.118.74/api/v1/health
```

## 7. Netlify 前端

如果仅使用服务器完整访问，前端已经由服务器 Nginx 承载。

如果使用 Netlify 部署前端：

```text
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

无 HTTPS 域名前，Netlify 只能做页面预览。要完整调用 API，需要先为后端配置 HTTPS，然后设置：

```text
VITE_API_BASE_URL=https://你的后端域名/api/v1
```

## 8. 常用运维命令

更新代码并重启：

```bash
cd /opt/wms-print-template-center
git pull
docker compose --env-file .env.production up -d --build
```

停止：

```bash
docker compose --env-file .env.production down
```

备份 MySQL：

```bash
docker exec wms-print-template-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" wms_print_template' > wms_print_template_$(date +%Y%m%d_%H%M%S).sql
```
