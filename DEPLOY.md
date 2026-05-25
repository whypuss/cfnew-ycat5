# ⚠️ Deploy 規則 — 必須遵守

## 正確版本
- Repo: whypuss/cfnew-ycat
- 本地路徑: /tmp/cfnew-ycat-deploy
- Worker: cfnew
- KV NS ID: 1d8d85c982a141ada33098ff80cee3bc

## 絕對禁止
- 不可 deploy /tmp/cfnew-ycat-v103
- 不可 deploy /tmp/cfnew-cat
- 以上兩個路徑會覆蓋定製 UI

## Deploy 前必做
```bash
bash /tmp/cfnew-ycat-deploy/deploy.sh
```

## 部署流程
1. 先讀 DEPLOY.md + deploy.sh 恢復記憶
2. 確認 pwd = /tmp/cfnew-ycat-deploy
3. 確認 wrangler.toml 的 KV id = 1d8d85c982a141ada33098ff80cee3bc
4. 確認 worker.js 有 "訂閱中心" UI marker
5. 執行 deploy.sh
6. 驗證：curl https://cfnew.agooxo.workers.dev/qaws/sub > 100KB