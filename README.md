# Gesture Rain Controller 使用说明书

Gesture Rain Controller 是一个纯前端互动网页作品。项目通过浏览器摄像头在本地识别用户手势，并将手掌张开程度实时映射为雨量大小：握拳时雨量降低或停止，手掌张开时雨势增强，快速张开手掌会触发雷电闪光。

项目不需要后端服务，不会上传摄像头画面。所有手部识别、手势计算和雨幕渲染都在浏览器本地完成。

## 功能概览

- 使用 MediaPipe Tasks Vision Hand Landmarker 识别手部关键点。
- 使用 Canvas 实时渲染雨滴粒子、风向、拖尾、闪电和未来城市雨夜背景。
- 使用 React、TypeScript 和 Tailwind CSS 构建组件化界面。
- 使用 Framer Motion 增强 HUD、按钮和视觉状态过渡。
- 提供摄像头预览窗口，并在预览画面上绘制手部骨架。
- 提供右侧玻璃拟态 HUD，展示当前手势、雨量百分比、风速、粒子数量、识别置信度和雷电次数。
- 支持无手部检测时自动回到默认中雨状态。

## 环境要求

- Node.js 18 或更高版本。
- npm 9 或更高版本。
- 支持摄像头访问的现代浏览器，推荐 Chrome、Edge 或 Safari。
- 浏览器需要允许摄像头权限。
- 本地开发建议使用 `localhost` 访问，因为浏览器通常只允许在安全上下文中调用摄像头。

## 安装与启动

在项目根目录执行：

```bash
npm install
npm run dev
```

启动后，Vite 会输出本地访问地址，例如：

```text
http://localhost:5173/
```

在浏览器打开该地址后，允许摄像头权限即可开始使用。

## 使用方法

1. 打开页面后，点击右上角的 `Camera` 按钮，或等待页面自动请求摄像头权限。
2. 允许浏览器摄像头权限。
3. 将一只手放在摄像头画面中，保持手部完整可见。
4. 观察左上角摄像头预览窗口中的手部骨架识别效果。
5. 通过手势控制雨量：

| 手势 | HUD 状态 | 雨效表现 |
| --- | --- | --- |
| 握拳 | `FIST` | 雨量降低，背景变暗 |
| 半张开 | `HALF OPEN` | 中等雨量 |
| 手掌张开 | `OPEN PALM` | 雨量增强，光效增强 |
| 完全张开 | `STORM MODE` | 暴雨、强拖尾、雷电概率提升 |
| 快速从握拳张开 | 触发闪电 | 屏幕闪光并轻微震动 |

如果摄像头没有检测到手，系统会逐渐回到默认中雨状态。

## 页面区域说明

### 顶部标题区

显示项目标题 `Gesture Rain Controller` 和本地浏览器识别提示。

### 左上角摄像头预览

摄像头预览窗口用于显示实时画面，并叠加手部关键点和骨架连线。画面只在浏览器本地处理，不会发送到服务器。

### 右侧 HUD 面板

HUD 面板展示当前交互状态：

- 当前手势：`FIST`、`HALF OPEN`、`OPEN PALM` 或 `STORM MODE`。
- 雨量百分比：当前雨量强度。
- Particle Count：当前雨滴粒子数量。
- Wind Vector：风向偏移。
- Drop Speed：雨滴速度倍率。
- Drop Length：雨滴长度。
- Confidence：手势识别置信度。
- Lightning：雷电触发次数。

### 控制按钮

- `Camera`：手动启动摄像头和手势识别。
- `Flash`：手动触发一次雷电闪光，便于测试视觉效果。
- `Reset`：将雨量状态重置为默认中雨。

## 手势识别原理

MediaPipe 会为每只手返回 21 个手部关键点。项目使用这些关键点计算手掌张开程度：

1. 根据手腕和掌根关键点计算手掌中心。
2. 读取食指、中指、无名指和小指的指尖点。
3. 计算 4 个指尖到手掌中心的平均距离。
4. 使用掌宽对距离进行归一化，得到 `openness`。
5. 根据 `openness` 判断手势状态，并映射到 `rainIntensity`。
6. 对雨量进行平滑插值，减少画面抖动。

归一化后的结果会影响：

- 雨滴数量
- 雨滴速度
- 雨滴长度
- 风向偏移
- 背景亮度
- 雷电触发概率

## 项目结构

```text
src/
  App.tsx
  main.tsx
  styles.css
  components/
    CameraHandTracker.tsx
    ControlPanel.tsx
    GestureHUD.tsx
    NeonButton.tsx
    RainCanvas.tsx
    StatusBadge.tsx
  lib/
    gesture.ts
    gesture.test.ts
  types.ts
```

关键文件说明：

- `src/App.tsx`：应用主入口，负责状态编排、雨量平滑、雷电触发和页面布局。
- `src/components/CameraHandTracker.tsx`：摄像头权限、MediaPipe 模型加载、手部检测和骨架绘制。
- `src/components/RainCanvas.tsx`：Canvas 雨滴粒子系统和闪电效果。
- `src/components/GestureHUD.tsx`：右侧数据面板。
- `src/lib/gesture.ts`：手势计算、状态分类、平滑插值和快速张开检测。
- `src/lib/gesture.test.ts`：手势算法单元测试。

## 常用命令

```bash
npm run dev
```

启动本地开发服务器。

```bash
npm test
```

运行单元测试。

```bash
npm run build
```

执行 TypeScript 检查并构建生产版本。

```bash
npm run preview
```

本地预览生产构建结果。

## 隐私说明

本项目没有后端服务，也没有上传逻辑。摄像头画面由浏览器直接传入 MediaPipe Hand Landmarker，在本地完成手部关键点识别。

注意：首次加载时，浏览器需要从公共 CDN 获取 MediaPipe 的 WASM 资源和手部识别模型文件。模型加载完成后，摄像头画面仍然只在本机浏览器中处理。

## 常见问题

### 浏览器没有弹出摄像头授权

请确认使用的是 `http://localhost:5173/`，并检查浏览器地址栏左侧的权限设置。如果权限被拒绝，需要在浏览器站点设置中重新允许摄像头。

### 页面提示 Camera unavailable

可能原因包括：

- 摄像头被其他软件占用。
- 浏览器没有摄像头权限。
- 当前页面不是安全上下文。
- 设备没有可用摄像头。

### 手势识别不稳定

可以尝试：

- 让手部完整出现在摄像头画面中。
- 保持手掌和背景有明显对比。
- 避免强背光或过暗环境。
- 使用单只手进行控制。

### 雨量没有变化

请先确认左上角预览窗口是否已经绘制手部骨架。如果没有骨架，说明 MediaPipe 尚未检测到手部。将手掌靠近画面中央，并保持 1 到 2 秒。

## 二次开发建议

- 调整手势阈值：修改 `src/lib/gesture.ts` 中的 `classifyGesture` 和归一化公式。
- 调整雨效强度：修改 `src/App.tsx` 中的 `mapRainMetrics`。
- 调整粒子视觉：修改 `src/components/RainCanvas.tsx`。
- 调整 HUD 样式：修改 `src/components/GestureHUD.tsx` 和 `src/styles.css`。
- 增加新手势：在 `gesture.ts` 中扩展手势类型，再在 `App.tsx` 中映射新的视觉参数。
