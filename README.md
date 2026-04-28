# 异环手账 / NTE Notes

面向 NTE（异环）玩家的非官方轻量资料站。

## 板块

- 海市事务：日常、周常、双周常与周期刷新事项
- Bug 合集：简述有趣 Bug，并链接到原始视频
- 角色合集：轻量角色基础信息索引
- 名词解释：养成系统与玩法术语说明
- 中英互译：中文 / English 对照数据库
- 外部链接：官网、下载、Wiki、社区与工具入口
- 关于：联系方式、贡献说明与免责声明

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

默认按 GitHub Pages 项目页 `/nte-notes/` 构建。仓库名不同的时候可以设置：

```bash
$env:BASE_PATH="/your-repo-name"
npm run build
```

## 数据

结构化资料在 `src/data/` 下维护。第一版以中文展示为主，但数据字段已经预留 `zh` / `en`。
