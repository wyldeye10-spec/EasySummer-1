# EasySummer v2.5.0 更新日志

> 2026-08-05

---

## ✨ 新功能

### 🌡️ 热力图日历重构
- 采用 CSS Grid 均匀排布每日单元格，告别 flex 布局导致的大小不一
- 鼠标悬停时通过 Portal 渲染精美毛玻璃浮窗，显示当日完成数量
- 图例颜色根据实际数据动态计算，夜间模式同步适配

### 🌙 19:00 自动切换夜间模式
- 新增 `useAutoDarkMode` hook，每 60 秒检测时间
- 晚 19:00 后自动开启夜间模式，早 7:00 后自动切回日间模式
- 设置页新增自动夜间模式开关，用户手动切换后当日不再自动调整
- 跨越时间边界时自动重置手动覆盖状态

### 🔔 番茄钟完成提醒
- Web Audio API 合成清脆双音铃声（A5 + D6），无需外部音频文件
- 浏览器通知弹出，即使切到后台也能看到
- 网页标题闪烁 "🔔 时间到！"，30 秒后自动停止
- 同会话内通知权限仅请求一次，不再反复弹窗

### 🗑️ 回收站一键清空
- 新增「一键清空」按钮，直接删除回收站全部内容
- 原有「清理过期」按钮仅删除 30 天前的内容
- 清空前弹出确认对话框，防止误操作
- 全存储层支持：IndexedDB + localStorage 回退

### 📋 子任务体验优化
- 父任务右侧常驻显示子任务数量徽章（如 `2/5`）
- 全部完成时徽章变为翠绿色 `📋 5`
- 子任务复选框加大（`w-5 h-5`），hover 有视觉反馈
- 子任务不计入总任务数和进度统计

---

## 🐛 Bug 修复

| 问题 | 修复 |
|------|------|
| 番茄钟显示 25 分钟但实际倒计时 10 分钟 | `usePomodoro` 加 `useEffect` 同步设置变更到 `secondsLeft` |
| 21:33 仍未自动切换夜间模式 | 移除 TopBar 中与 auto-dark hook 冲突的 localStorage 初始化 effect |
| 通知权限弹窗反复弹出关不掉 | 加 `permissionRequested` 会话标记，同页面生命周期仅请求一次 |
| 今日进度显示 16/14（完成数 > 总数） | 进度条 numerator 补 `t.mode === mode` 筛选，与分母保持一致 |
| 进度条只有 100% 时才显示填充 | `.stripe-progress` 改用 `::after` 伪元素渲染条纹，不再覆盖渐变背景 |
| 日间模式进度条轨道看不清 | 回退到原始 `bg-warm-200/60` 配色，加 `border` 细边框勾勒轮廓 |
| 热力图浮窗定位偏移 | 改用 `createPortal` 挂载到 `document.body`，绕过 `backdrop-filter` 包含块问题 |

---

## 🛠️ 改进

- 热力图空白天用 `aspect-square` 占位，与真实单元格尺寸一致
- 热力图移除 `weeks` 分块逻辑，简化渲染结构
- 进度条夜间模式保持原有外观（`dark:border-warm-700/30`）

---

## 📦 涉及文件

```
新增:
  src/hooks/useAutoDarkMode.ts
  src/utils/notification.ts

修改:
  src/components/dashboard/PomodoroTimer.tsx
  src/components/dashboard/SubTaskList.tsx
  src/components/dashboard/TodoItem.tsx
  src/components/dashboard/TodoList.tsx
  src/components/journal/HeatmapCalendar.tsx
  src/components/layout/TopBar.tsx
  src/components/settings/Settings.tsx
  src/components/settings/Trash.tsx
  src/constants/index.ts
  src/db/operations.ts
  src/db/storage.ts
  src/hooks/usePomodoro.ts
  src/index.css
  src/store/todoStore.ts
  src/types/index.ts
  src/utils/storageAdapter.ts
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
