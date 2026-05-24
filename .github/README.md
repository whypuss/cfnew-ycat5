# cfnew-cat v1.0

> ⚠️ **部署后请将兼容日期设置为 `2025-01-01`**
>
> ⚠️ **KV Namespace 已迁移，使用新的 Namespace ID（见 wrangler.toml）**

**Workers 部署：**
1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 进入 **Workers 和 Pages** → 创建 Worker
3. 点击 **设置** → **运行时** → **兼容性日期** → 选择 `2025-01-01`
4. 粘贴 `worker.js` 的内容作为 Worker 代码

**Pages 部署：**
1. 进入 **Workers 和 Pages** → 创建 Pages 项目
2. 上传 `static` 目录
3. 设置兼容性日期 `2025-01-01`

**KV 配置：**
1. 在 Workers 页面左侧找到 **KV** → 创建命名空间（名称随意，如 `cfnew-cat`）
2. 复制新的 Namespace ID 到 `wrangler.toml`
3. 写入配置 key: `c`，value 为 JSON 配置

## 主要功能

- 多协议支持：VLESS、Trojan、xhttp、ECH
- 自定义路径、订阅转换、延迟测试
- KV 图形化管理，配置实时生效
- 多客户端支持：CLASH、SURGE、SING-BOX、LOON、QUANTUMULT X、V2RAY、Shadowrocket、STASH、NEKORAY、V2RAYNG

## 节点地区（17个）

🇭🇰 香港 · 🇺🇸 美国 · 🇸🇬 新加坡 · 🇯🇵 日本 · 🇰🇷 韩国 · 🇩🇪 德国 · 🇸🇪 瑞典 · 🇳🇱 荷兰 · 🇫🇮 芬兰 · 🇬🇧 英国 · 🇦🇺 澳洲 · 🇧🇷 巴西 · 🇨🇦 加拿大 · 🇫🇷 法国 · 🇨🇭 瑞士 · 🇷🇺 俄罗斯 · 🇮🇳 印度 · 🇹🇼 台湾

**语言：** [中文](../README.md) | [فارسی](../فارسی.md)

[Telegram 交流群](https://t.me/+ft-zI76oovgwNmRh)
