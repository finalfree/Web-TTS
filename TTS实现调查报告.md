# Web-TTS 仓库实现调查报告

## 概述

本报告详细分析了 Web-TTS 项目的技术实现，包括其 TTS（文本转语音）实现方式、依赖项以及与 Microsoft API 的关系。

---

## 一、TTS 实现方式

### 1.1 核心技术

**本项目并未使用逆向工程的 Microsoft 接口，而是使用了浏览器原生的 Web Speech API。**

项目使用的是 **Web Speech API** 中的 `SpeechSynthesis` 接口，这是 W3C 标准的一部分，所有现代浏览器都原生支持。

### 1.2 实现细节

在 `App.tsx` 文件中（第 86-104 行），核心实现代码如下：

```typescript
const utter = new SpeechSynthesisUtterance(text);
const voices = window.speechSynthesis.getVoices();
const voice = voices.find(v => v.name === selectedVoice);

if (voice) utter.voice = voice;

// 设置事件监听
utter.onstart = () => setIsPlaying(true);
utter.onend = () => setIsPlaying(false);
utter.onerror = (e) => {
  setIsPlaying(false);
  console.error(e);
  if (e.error !== 'interrupted' && e.error !== 'canceled') {
    setError(`System TTS error: ${e.error}`);
  }
};

window.speechSynthesis.speak(utter);
```

### 1.3 声音加载机制

项目通过浏览器的 `window.speechSynthesis.getVoices()` 获取系统/浏览器可用的所有语音（第 30-67 行）：

```typescript
const loadVoices = () => {
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) return;

  // 优先显示 Microsoft 语音
  const formatted: VoiceOption[] = voices.map(v => ({
    id: v.name,
    name: `${v.name} (${v.lang})`,
    lang: v.lang,
    default: v.default
  })).sort((a, b) => {
    const aIsEdge = a.id.includes('Microsoft');
    const bIsEdge = b.id.includes('Microsoft');
    if (aIsEdge && !bIsEdge) return -1;
    if (!aIsEdge && bIsEdge) return 1;
    return a.name.localeCompare(b.name);
  });
  
  setSystemVoices(formatted);
};
```

**关键点：**
- 使用标准 Web API，完全合法合规
- 依赖操作系统和浏览器提供的语音引擎
- 在 Microsoft Edge 浏览器中可以访问到高质量的 "Microsoft Natural" 语音
- 不需要任何 API 密钥或服务器端调用

---

## 二、项目依赖

### 2.1 核心依赖（package.json）

```json
{
  "dependencies": {
    "react": "^19.2.3",           // React 框架
    "react-dom": "^19.2.3",       // React DOM 渲染
    "lucide-react": "^0.562.0",   // 图标库
    "@google/genai": "^1.34.0"    // Google Gemini AI (未在当前代码中使用)
  },
  "devDependencies": {
    "@types/node": "^22.14.0",          // Node.js 类型定义
    "@vitejs/plugin-react": "^5.0.0",   // Vite React 插件
    "typescript": "~5.8.2",             // TypeScript 编译器
    "vite": "^6.2.0"                    // Vite 构建工具
  }
}
```

### 2.2 依赖说明

| 依赖项 | 用途 | 必要性 |
|--------|------|--------|
| `react` & `react-dom` | 构建用户界面 | 核心必需 |
| `lucide-react` | 提供 UI 图标（Play, Stop, Settings 等） | UI 必需 |
| `@google/genai` | Google AI 集成（当前代码未使用） | 可选 |
| `typescript` | TypeScript 支持 | 开发必需 |
| `vite` | 快速开发构建工具 | 开发必需 |
| `@vitejs/plugin-react` | Vite 的 React 支持 | 开发必需 |

**注意：** `@google/genai` 在当前代码中未被使用，可能是为未来功能预留的。

### 2.3 外部资源

从 `index.html` 可以看出，项目还使用了：

```html
<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">

<!-- ES Module 导入映射 -->
<script type="importmap">
{
  "imports": {
    "react/": "https://esm.sh/react@^19.2.3/",
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "lucide-react": "https://esm.sh/lucide-react@^0.562.0",
    "@google/genai": "https://esm.sh/@google/genai@^1.34.0"
  }
}
</script>
```

---

## 三、与 Microsoft API 的关系

### 3.1 并非逆向工程

**重要结论：本项目没有逆向 Microsoft 的任何接口。**

项目使用的 `Web Speech API` 是：
- ✅ W3C 标准 API
- ✅ 浏览器原生支持
- ✅ 完全公开且合法
- ✅ 不需要任何认证或密钥

### 3.2 Microsoft 语音的来源

当用户在 **Microsoft Edge 浏览器**（特别是 Windows 系统）中使用该应用时：

1. 浏览器会提供访问操作系统级别的语音引擎
2. Windows 系统本身包含 Microsoft 的高质量 TTS 引擎
3. 这些语音通过标准 Web Speech API 暴露给网页
4. 应用只是调用浏览器提供的标准接口

### 3.3 工作原理图

```
用户输入文本
    ↓
App.tsx (React 组件)
    ↓
Web Speech API (window.speechSynthesis)
    ↓
浏览器 (Chrome/Edge/Firefox 等)
    ↓
操作系统 TTS 引擎
    ↓
音频输出
```

### 3.4 代码证据

在 `App.tsx` 第 198-199 行的提示信息明确说明：

```typescript
<p className="text-[10px] text-zinc-500 leading-relaxed">
  Tip: For the best experience, use Microsoft Edge on Windows to access 
  high-quality "Microsoft Natural" voices.
</p>
```

这说明：
- 项目推荐使用 Edge 浏览器以获得最佳体验
- Microsoft Natural 语音是 Edge/Windows 原生提供的
- 不是通过任何 Microsoft 云服务或 API

---

## 四、技术架构

### 4.1 组件结构

```
App.tsx                    # 主应用组件
├── AudioVisualizer.tsx    # 音频可视化组件（模拟波形显示）
├── types.ts               # TypeScript 类型定义
└── index.tsx              # 应用入口
```

### 4.2 主要功能

1. **文本输入**: 用户在 textarea 中输入要朗读的文本
2. **语音选择**: 通过下拉菜单选择系统可用的语音
3. **语音过滤**: 实时搜索过滤语音列表
4. **播放控制**: 播放/停止按钮
5. **可视化**: 模拟音频波形显示（因为 Web Speech API 不暴露音频流）
6. **错误处理**: 显示 TTS 相关错误

### 4.3 音频可视化

由于 `SpeechSynthesis` API 不提供音频流访问，项目在 `AudioVisualizer.tsx` 中使用了**模拟波形**：

```typescript
// 模拟波形数据
if (analyser) {
  analyser.getByteTimeDomainData(dataArray);
} else {
  // 模拟波形
  const time = Date.now() / 100;
  for (let i = 0; i < bufferLength; i++) {
    const val = 128 + Math.sin(i * 0.2 + time) * 30 + Math.random() * 10;
    dataArray[i] = val;
  }
}
```

---

## 五、运行要求

### 5.1 开发环境

- **Node.js**: 需要安装 Node.js 环境
- **包管理器**: npm（随 Node.js 安装）

### 5.2 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 5.3 浏览器兼容性

支持所有现代浏览器：
- ✅ Google Chrome
- ✅ Microsoft Edge（推荐，语音质量最佳）
- ✅ Firefox
- ✅ Safari
- ⚠️ 移动浏览器（支持但语音质量因设备而异）

---

## 六、总结

### 关键发现

1. **实现方式**: 使用标准 Web Speech API，完全合法合规
2. **依赖项**: 主要依赖 React 生态系统和 Vite 构建工具
3. **Microsoft API**: 未使用任何逆向工程，仅通过浏览器访问系统级 TTS 引擎
4. **技术栈**: React + TypeScript + Vite + Tailwind CSS
5. **部署简单**: 纯前端应用，无需后端服务器

### 优势

- ✅ 无需 API 密钥或认证
- ✅ 完全客户端运行，保护隐私
- ✅ 免费使用，无调用限制
- ✅ 支持多种语言和语音
- ✅ 代码简洁，易于维护

### 局限性

- ⚠️ 依赖浏览器和操作系统提供的语音
- ⚠️ 不同浏览器/系统的语音质量差异较大
- ⚠️ 无法访问实际音频流（只能模拟可视化）
- ⚠️ 功能受 Web Speech API 限制

---

## 附录：相关文档

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechSynthesis Interface](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [W3C Speech API Specification](https://w3c.github.io/speech-api/)

---

**报告生成时间**: 2025-12-28  
**项目版本**: 0.0.0  
**仓库**: finalfree/Web-TTS
