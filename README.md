# Search Agent 🔍

AI 驱动的实时搜索代理，一键 Docker 部署。

## ⚡ 快速开始

### 1️⃣ 克隆项目

```bash
git clone https://github.com/EchoUser005/search-agent.git
cd search-agent
```

### 2️⃣ 配置 API Key

```bash
cp .env.example .env
```

用编辑器打开 `.env`，填入你的 API Key：

```
QWEN_API_KEY=sk-your-key-here
BOCHA_API_KEY=sk-your-key-here
```

**怎么获取 API Key？**

**Qwen API Key：**
- 访问 https://dashscope.aliyuncs.com
- 登录 → API Key 管理 → 创建新的 API Key
- 复制到 `.env`

**Bocha API Key：**
- 访问 https://www.bochaai.com
- 登录 → API Key 管理 → 创建新的 API Key
- 复制到 `.env`

### 3️⃣ 启动

```bash
docker-compose up -d
```

**完成！** 打开浏览器访问：http://localhost:3000

---

## 📋 前置条件

### Mac / Windows

1. 下载安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. 打开应用

### Linux

```bash
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
```

---

## 🆘 常见问题

### Docker 启动不了

**错误：** `Cannot connect to the Docker daemon`

**解决：**
- Mac/Windows：打开 Docker Desktop 应用
- Linux：运行 `sudo systemctl start docker`

### API Key 错误

**错误：** 搜索时报错 `401` 或 `403`

**解决：**
1. 检查 `.env` 文件中的 Key 是否正确粘贴
2. 确保没有多余的空格
3. 确认 API 额度是否充足（登录网站查看）

### 前端无法访问

**错误：** 打开 http://localhost:3000 显示无法连接

**解决：**
```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 需要重启

```bash
docker-compose restart
```

### 完全清理

```bash
docker-compose down -v
```

---

## 📊 系统架构

```
用户输入
    ↓
前端（Next.js）
    ↓ (HTTP/SSE)
后端（FastAPI）
    ↓
LLM（思考）+ 搜索 API（执行）
    ↓
实时流式返回结果
```

---

## 🐛 报告问题

遇到 Bug？提交 [GitHub Issue](https://github.com/EchoUser005/search-agent/issues)

---

## 📄 许可

MIT

---

**有问题？** 查看上面的 [常见问题](#-常见问题) 或 [提交 Issue](https://github.com/EchoUser005/search-agent/issues)