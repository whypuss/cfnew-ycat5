#!/bin/bash

# 強制切換到正確路徑
cd /tmp/cfnew-ycat-deploy || { echo "❌ 路徑錯誤"; exit 1; }

# 檢查 1：確認路徑
if [[ "$PWD" != "/tmp/cfnew-ycat-deploy" ]]; then
    echo "❌ 錯誤路徑：$PWD"
    exit 1
fi

# 檢查 2：確認 wrangler.toml
if ! grep -q 'name = "cfnew"' wrangler.toml; then
    echo "❌ wrangler.toml name 錯誤"
    exit 1
fi

if ! grep -q '1d8d85c982a141ada33098ff80cee3bc' wrangler.toml; then
    echo "❌ KV Namespace ID 錯誤"
    exit 1
fi

# 檢查 3：確認係 cfnew-ycat（定製 UI）
if ! grep -q '訂閱中心' worker.js; then
    echo "❌ 唔係 cfnew-ycat 定製 UI，停止 deploy"
    exit 1
fi

echo "✅ 所有檢查通過，開始 deploy..."
npx wrangler deploy --name cfnew

# 驗證 deploy 結果
echo "驗證 UI 大小..."
SIZE=$(curl -so /dev/null -w "%{size_download}" "https://cfnew.agooxo.workers.dev/qaws")
if [ "$SIZE" -gt 100000 ]; then
    echo "✅ Deploy 成功，UI 大小：${SIZE} bytes"
else
    echo "❌ Deploy 可能出錯，UI 大小只有：${SIZE} bytes（應該 >100KB）"
fi
