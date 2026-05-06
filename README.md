# 企业抽奖系统

一个精美、现代化的企业级抽奖系统，基于 Vue 3 + Element Plus 构建。

**在线地址**: https://LYANG0613.github.io/lottery-system/

## 功能特性

- **Excel导入参与者**：支持拖拽或点击上传 Excel 文件，自动解析姓名、手机号、部门等字段
- **精美的抽奖动画**：3D 旋转光环 + 粒子效果 + 彩带庆祝动画
- **灵活的奖品配置**：支持多轮抽奖（特等奖到参与奖），可自定义名额数量
- **获奖名单管理**：实时展示中奖者，按奖品分组显示
- **一键导出 Excel**：获奖名单可导出为规范的 Excel 表格
- **企业主题定制**：使用 CSS 变量，便于更换企业品牌色和 Logo

## 技术栈

- Vue 3 + Composition API + TypeScript
- Vite 构建工具
- Element Plus UI 组件库
- xlsx (SheetJS) Excel 处理
- SCSS 样式
- Vitest 单元测试
- Playwright E2E 测试

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录

## 使用指南

### 1. 导入参与者

- 准备 Excel 文件，包含 `姓名` 列（其他列如手机号、部门可选）
- 点击左侧「参与者管理」区域，上传 Excel 文件
- 支持搜索、删除单个参与者、清空列表

### 2. 配置奖品

- 在右侧「奖品配置」区域点击「添加奖品」
- 设置奖品名称、等级（特等奖/一等奖/...）、名额数量
- 点击奖品行的「抽奖」按钮选择当前抽奖奖项

### 3. 开始抽奖

- 确保已导入参与者、已配置奖品
- 点击中央「开始抽奖」按钮
- 抽奖动画结束后，中奖者会高亮显示并添加到右侧名单

### 4. 导出获奖名单

- 在「获奖名单」区域点击「导出 Excel」
- 文件名格式：`抽奖获奖名单_YYYY-MM-DD.xlsx`

## 自定义企业主题

编辑 `src/styles/variables.scss` 中的 CSS 变量：

```scss
:root {
  --primary-color: #1a5caa;      // 企业主色（蓝）
  --accent-color: #f5a623;        // 强调色（金色）
  --bg-gradient-start: #0f0f23;   // 背景渐变起始
  --bg-gradient-end: #1a1a3e;     // 背景渐变结束
}
```

## 项目结构

```
lottery-system/
├── src/
│   ├── main.ts                    # 入口
│   ├── App.vue                    # 根组件
│   ├── router/index.ts            # 路由
│   ├── stores/lottery.ts          # 状态管理（reactive 单例）
│   ├── types/index.ts             # TypeScript 类型定义
│   ├── composables/               # 组合式函数
│   │   ├── useLottery.ts         # 抽奖逻辑 + 动画
│   │   ├── useExcel.ts           # Excel 导入导出
│   │   ├── useAudio.ts           # Web Audio 音效合成
│   │   ├── useLargeStorage.ts    # IndexedDB 降级存储
│   │   └── useConstants.ts       # 常量 + 标题工具
│   ├── components/                # 通用组件
│   │   ├── ParticipantImport.vue  # Excel 导入
│   │   ├── LotteryMachine.vue     # 抽奖转盘
│   │   ├── PrizeConfig.vue        # 奖品配置
│   │   └── WinnerList.vue        # 获奖名单
│   ├── views/                     # 页面
│   │   ├── EntryPage.vue         # / 入口页
│   │   ├── LotteryPage.vue       # /lottery 抽奖页
│   │   ├── AdminPage.vue         # /admin 管理页
│   │   └── WinnersPage.vue       # /winners 获奖公示页
│   └── styles/
│       ├── variables.scss         # CSS 变量（主题）
│       └── global.scss            # 全局样式
├── .github/workflows/deploy.yml   # CI/CD 自动部署
├── deploy.cjs                     # 本地发布脚本
├── vite.config.ts                 # Vite 配置
├── vitest.config.ts               # Vitest 配置
├── playwright.config.ts           # Playwright 配置
└── tests/                         # 测试文件
    ├── unit/                      # 单元测试
    └── e2e/                       # E2E 测试
```

## Excel 文件格式

| 姓名 | 手机号 | 部门 |
|------|--------|------|
| 张三 | 13800138000 | 技术部 |
| 李四 | 13900139000 | 市场部 |

支持多种列名变体（姓名/Name/名称、手机/Mobile/电话 等）。

## 测试

本项目使用 Vitest 进行单元测试，Playwright 进行 E2E 端到端测试。

### 测试概览

| 指标 | 数值 |
|------|------|
| 测试用例总数 | 78 |
| 通过 | 78 |
| 失败 | 0 |
| 单元测试 | 23 |
| E2E 测试 | 55 |

### 运行测试

```bash
# 单元测试
npm run test:unit

# E2E 测试（需先启动 dev server）
npm run dev         # 终端 1：启动开发服务器
npm run test:e2e   # 终端 2：运行 E2E 测试

# 全部测试
npm test
```

### 覆盖的模块

| 模块 | 文件 | 测试类型 |
|------|------|---------|
| 抽奖逻辑 | `src/composables/useLottery.ts` | 单元测试 |
| Excel 解析 | `src/composables/useExcel.ts` | 单元测试 |
| 奖品常量 | `src/composables/useConstants.ts` | 单元测试 |
| 状态存储 | `src/stores/lottery.ts` | E2E 测试 |
| 入口页面 | `src/views/EntryPage.vue` | E2E 测试 |
| 管理后台 | `src/views/AdminPage.vue` | E2E 测试 |
| 抽奖页面 | `src/views/LotteryPage.vue` | E2E 测试 |
| 中奖公示 | `src/views/WinnersPage.vue` | E2E 测试 |

详细测试报告请查看 [TEST_REPORT.md](./TEST_REPORT.md)。

## 自动化部署流程

本项目使用 GitHub Actions 实现 push 后自动构建并部署到 GitHub Pages。

### 流程图

```
代码修改  →  git add / git commit
     ↓
  node deploy.cjs
     ↓
  ┌─ 本地构建验证（npm run build，强制类型检查）
  │     ❌ 构建失败 → 停在本地，不推送到 GitHub
  │     ✅ 构建成功 → 继续
  ├─ git push origin main
  │     ↓
  └─ GitHub Actions 自动触发
        ↓
     ┌─ npm ci（安装依赖）
     ├─ npm run build（类型检查 + Vite 构建）
     ├─ cp dist/index.html dist/404.html（SPA fallback）
     └─ peaceiris/actions-gh-pages 部署到 gh-pages 分支
           ↓
     https://LYANG0613.github.io/lottery-system/ 自动更新
```

### 发布命令

```bash
# 首次需要设置 GitHub Token（只需设置一次）
export GITHUB_TOKEN=ghp_your_personal_access_token_here

# 标准发布（构建 + 提交 + 推送 + 等待 CI 结果）
node deploy.cjs

# 带自定义 commit message
node deploy.cjs "fix: 修复获奖名单样式"

# 仅检查最近一次 CI 状态（不提交不构建）
node deploy.cjs --check-only
```

> Token 需要 `repo` 权限。可在 GitHub → Settings → Developer settings → Personal access tokens 生成。

### 手动触发

如果 CI 意外失败，修复后可在 GitHub Actions 页面手动触发：

https://github.com/LYANG0613/lottery-system/actions → "Deploy to GitHub Pages" → Run workflow

### 常见失败原因

| 错误 | 原因 | 解决 |
|------|------|------|
| Cannot find module | 有文件未提交到 GitHub | 检查 `git status`，确保 `composables/` 等新文件已 commit |
| vue-tsc error | TypeScript 类型错误 | 本地运行 `npm run build` 先修复 |
| Deploy 404 | 路由页面刷新 404 | 检查 `dist/404.html` 是否生成 |

## License

MIT
