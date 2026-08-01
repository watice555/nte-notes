# 异环手账 / NTE Notes

面向 NTE（异环）玩家的非官方轻量资料站。

## 板块

- 海市事务：日常、周常等周期刷新事项
- 卡池信息：按国服版本整理限定卡池时间线与常驻角色资料
- 好感度：角色赠礼性价比与等级升级需求
- 名词解释：养成系统与玩法术语说明
- 中英对照：中文 / English 对照数据库
- 外部链接：官网、下载、Wiki、社区与工具入口
- 关于：联系方式、贡献说明与免责声明

## 开发

```bash
npm install
npm run dev
```

## 内容编辑器

可以启动本地编辑器修改网站内容：

```bash
npm run editor
```

打开终端里显示的本地地址后，可用表单编辑 `src/data/*.json`。保存前会在 `.content-editor-backups/` 自动备份原文件。

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

结构化资料在 `src/data/` 下维护。`characters.json` 中的限定角色包含国服版本、上下半、棋盘名称和开放时间，常驻角色不设置卡池时间。网站界面和普通板块仅维护中文；`translations.json` 专门保存“中英对照”板块的中英文数据。

`src/data/bugs.json` 为已下线栏目的归档数据，保留在仓库和本地内容编辑器中，不参与公开页面生成。
