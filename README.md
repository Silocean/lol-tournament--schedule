# LPL 2026 赛程页

展示英雄联盟职业联赛 2026 赛季赛程、今日对阵和积分榜。默认聚焦第三赛段组内赛（五城巡回），也可切换第一 / 第二赛段。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

生产预览：

```bash
npm run build
npm start
```

## 部署到 Vercel

1. 把仓库推到 GitHub，在 [Vercel](https://vercel.com) 导入该项目。
2. Framework 选 Vite，构建命令 `npm run build`，输出目录 `dist`。
3. 可选：在 Project Settings → Environment Variables 里配置 `LOLESPORTS_API_KEY`。不填会使用 LoL Esports 公开默认 Key。
4. Deploy 后即可访问。页面请求 `/api/lol/*`，由 Edge Function 代理官方赛程接口，LIVE 和积分榜会实时更新。

也可在本地用 Vercel CLI：

```bash
npx vercel
```

## 数据说明

赛程与积分来自 LoL Esports 公开接口。本地开发走 Vite 代理，Vercel 上走 Edge Function，避免浏览器跨域限制。接口不可用时会回退到本地快照。
