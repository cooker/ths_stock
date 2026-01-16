# 选股平台 - Stock Selector Platform

基于 [stock-sdk](https://github.com/chengzuopeng/stock-sdk) 构建的现代化选股平台，支持实时行情、技术指标分析、板块分析等功能。

## 功能特性

- 📊 **实时行情展示** - 支持 A 股实时行情数据
- 🔍 **智能搜索** - 支持股票代码、名称、拼音搜索
- 🎯 **多维度筛选** - 按涨跌幅、成交量、成交额等条件筛选
- 📈 **K 线图分析** - 完整的 K 线图和技术指标可视化
- 🏢 **板块分析** - 行业板块行情和成分股查看
- 💹 **技术指标** - 内置 MA、MACD、BOLL 等常用技术指标
- 🎨 **现代化 UI** - 基于 Tailwind CSS 的响应式设计

## 技术栈

- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **ECharts** - 数据可视化
- **stock-sdk** - 股票数据 SDK

## 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

## 使用说明

1. **加载数据**：点击右上角"刷新数据"按钮加载股票行情
2. **搜索股票**：在顶部搜索框输入股票代码、名称或拼音进行搜索
3. **筛选股票**：使用左侧筛选面板设置筛选条件
4. **查看详情**：点击股票列表中的任意股票查看详细信息和 K 线图
5. **板块分析**：切换到"板块分析"标签页查看行业板块行情

## 项目结构

```
ths_stock/
├── src/
│   ├── components/       # React 组件
│   │   ├── Header.tsx    # 顶部导航栏
│   │   ├── StockList.tsx # 股票列表
│   │   ├── FilterPanel.tsx # 筛选面板
│   │   ├── StockDetail.tsx # 股票详情
│   │   └── IndustryPanel.tsx # 板块分析
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # 入口文件
│   └── index.css         # 全局样式
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 注意事项

- stock-sdk 依赖第三方数据接口，可能存在延迟或限制
- 建议合理控制请求频率，避免过度请求
- 数据仅供参考，不构成投资建议

## License

ISC
