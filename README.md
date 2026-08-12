# learning-os
 # Learning OS · 个人博客

这是一个记录学习、构建与复盘的个人博客，使用 Next.js 构建，并通过 GitHub Pages 部署。

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://localhost:3000> 查看博客首页。

## 内容结构

- `app/page.tsx`：博客首页内容与文章卡片
- `app/globals.css`：响应式视觉样式
- `.openai/hosting.json`：Sites 项目绑定配置

远程仓库：<https://github.com/wuhuyixia/learning-os>

线上地址：<https://wuhuyixia.github.io/learning-os/>

## 开启 GitHub Pages

仓库的 GitHub Actions 会在 `main` 分支更新后自动构建并发布。首次使用时，在仓库设置中将 Pages 的构建来源设置为 **GitHub Actions**。
