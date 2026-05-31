# cfnew-cat v1.08

> ⚠️ **部署后请将兼容日期设置为 `2026-01-20`**
>
> ⚠️ **KV Namespace 已迁移，使用新的 Namespace ID（见 wrangler.toml）**

---

## ⚠️ 重要：部署方式

**请勿直接部署 `worker.js` / `plain.js` / `obfuscated.js`！**

**正确方式：使用 `少年你相信光吗`（混淆后的 deploy artifact）**

`少年你相信光吗` = 经过完整三层混淆的 worker 文件，大小 634KB，已通过 CF 检测。

---

## v1.08 更新内容（2026-05）

### 部署方式更新
- **强调使用 `少年你相信光吗` 作为唯一 deploy artifact**
- 新增 Wrangler 部署指南（推荐方式）
- 新增完整环境变量说明（`d`/`D`/`C` binding）
- 新增文件说明表格——每个文件的用途
- 强调 `build/mappings.json` 是你自己保留的，勿泄露

### 新增
- **混淆 Pipeline（build.js）**：三阶段自动化（Terser 压缩 → javascript-obfuscator 字符串数组 → Logic Lock 环境完整性检测）
- **stringArray base64 编码**：80% 字符串进入 stringArray 并以 base64 编码
- **mangled-shuffled 标识符**：全局/局部变量名双重混淆策略
- **`/refresh` endpoint**：清除订阅缓存（`sub:*` keys），返回 `{"success":true,"message":"订阅缓存已刷新"}`
- **`?refresh=1` / `?__refresh=1`**：绕过订阅缓存，直接从 KV 重新生成
- **MIME 多态**：User-Agent 自动识别客户端格式（Clash→yaml, Stash→yaml, Surge→surge, SingBox→singbox, Loon→txt, QuantumultX→base64）
- **双协议节点**：每个 YX IP 生成 `WS-TLS` 和 `xhttp` 两种节点
- **`?yx=0` 调试参数**：绕过 KV YX，强制返回完整 fallback 链（~266 节点）

### 修覆
- **YX cache 分离**：加入 `yxMode`（yx-on/yx-off/no-yx）到 cacheFingerprint，防止 yxby=no 和 `?yx=0` 缓存冲突
- **KV yx 解析 bug**：`split(',')` 改为 `split(/[\n,]/)`，支持 `\n` 分隔的 yx 格式
- **renameGlobals: false**：修复 `renameGlobals: true` 导致 string array accessor 全局撞名，变量变 undefined → TypeError

### 性能
- Upload: 649 KB / 197 KB gzip
- Worker Startup Time: 292 ms

---

## ✅ 已完成功能

**核心基础设施**
- Route 随机化（build.js，ROUTE_SEED_VERSION=1）
- Enum/constant name 随机化（vless→ak, ws→ku 等）
- Response key 随机化（ip→a, port→svc 等）
- Header key 随机化（X-Real-IP→cf-uf 等）
- `build/mappings.json` committed as artifact（仅你自己可见，用于调试）
- deterministic build（同一 seed 每次结果一致）

**静态资源**
- `static/` 目录（index.html, robots.txt, favicon.ico）
- 4 个 fake static assets（build 时注入，freeze at 4）
- Random response headers（x-build, x-edge, x-runtime）

**订阅功能**
- 多协议支持：VLESS、Trojan、WS-TLS、xhttp、ECH
- KV 预编译 cache（15min TTL）
- 三层健康检查（TCP→TLS→WS）
- 节点信誉 + quarantine 系统
- 订阅输出过滤（20节点/80%/去重）
- 隐藏订阅 URL
- **KV 优选 IP（YX）模式**：`yxby=yes` 返回 3 个 KV 优选节点；`yxby=no` 返回完整 fallback 链（~266 节点）

**UI**
- 白色暖色调 UI
- 移除 Matrix/FX/HUD 动画
- `/api/config` — KV storage endpoint
- `/api/preferred-ips` — IP lookup endpoint

---

## 🚀 部署指南（Workers）

### 第一步：上传 deploy artifact

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 进入 **Workers 和 Pages** → 创建 Worker（或使用现有 Worker）
3. 点击 **设置** → **运行时** → **兼容性日期** → 选择 `2026-01-20`
4. 上传 `少年你相信光吗` 作为 Worker 代码（直接粘贴文件内容，或用 wrangler deploy）

### 第二步：配置环境变量（Bindings）

在 Worker 设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `d` | `qaws` | 自定义路径前缀 |
| `D` | `qaws` | 同上（兼容） |
| `C` | KV Namespace ID | KV 命名空间绑定 |

**KV Namespace 绑定：**
1. Workers 页面左侧 → **KV** → 创建命名空间（名称随意）
2. 复制 Namespace ID 到 `wrangler.toml` 的 `env.C` 绑定
3. 或在 Workers 设置 → **KV 命名空间绑定** → 添加 `C` 绑定到你的命名空间

### 第三步：获取订阅 URL

格式：`https://<worker-subdomain>.workers.dev/qaws/sub`

---

## 🔧 Wrangler 部署（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 配置 Cloudflare token
export CLOUDFLARE_API_TOKEN='your-token-here'

# 3. 部署（使用混淆后的 worker）
npx wrangler deploy
```

**wrangler.toml 参考：**
```toml
name = "cfnew-cat"
main = "worker.js"
compatibility_date = "2026-01-20"

[vars]
d = "qaws"
D = "qaws"

[[kv_namespaces]]
binding = "C"
id = "你的-KV-Namespace-ID"
```

---

## 📁 文件说明

| 文件 | 说明 | 用途 |
|------|------|------|
| `少年你相信光吗` | **混淆后的 deploy artifact** | ⭐ 唯一需要部署的文件 |
| `worker.js` | 混淆后的 worker（别名） | 部署用 |
| `plain.js` | 明文源代码 | 本地开发参考 |
| `obfuscated.js` | 中间产物（Stage 2 输出） | 调试用 |
| `build.js` | 混淆 Pipeline 脚本 | 本地 build 用 |
| `build/mappings.json` | Route 对照表 | **你自己保留，勿泄露** |
| `static/` | 静态资源目录 | Pages 部署用 |

---

## 主要功能

- 自定义路径、订阅转换、延迟测试
- KV 图形化管理，配置实时生效
- 多客户端支持：CLASH、SURGE、SING-BOX、LOON、QUANTUMULT X、V2RAY、Shadowrocket、STASH、NEKORAY、V2RAYNG

## 节点地区（17个）

🇭🇰 香港 · 🇺🇸 美国 · 🇸🇬 新加坡 · 🇯🇵 日本 · 🇰🇷 韩国 · 🇩🇪 德国 · 🇸🇪 瑞典 · 🇳🇱 荷兰 · 🇫🇮 芬兰 · 🇬🇧 英国 · 🇦🇺 澳洲 · 🇧🇷 巴西 · 🇨🇦 加拿大 · 🇫🇷 法国 · 🇨🇭 瑞士 · 🇷🇺 俄罗斯 · 🇮🇳 印度 · 🇹🇼 台湾

**语言：** [中文](../README.md) | [فارسی](../فارسی.md)

[Telegram 交流群](https://t.me/+ft-zI76oovgwNmRh)