# TTS 核心代码解析 / Core Code Analysis

## 核心实现 / Core Implementation

本文档展示 Web-TTS 项目中 TTS 功能的核心代码及其工作原理。

---

## 1. TTS 实现代码 (App.tsx 第 76-108 行)

### 完整代码

```typescript
const handlePlay = async () => {
  setError(null);
  stopAudio();

  if (!text.trim()) {
    setError("Please enter some text to speak.");
    return;
  }

  try {
    // 1️⃣ 创建语音合成对象
    const utter = new SpeechSynthesisUtterance(text);
    
    // 2️⃣ 获取所有可用语音
    const voices = window.speechSynthesis.getVoices();
    
    // 3️⃣ 查找用户选择的语音
    const voice = voices.find(v => v.name === selectedVoice);
    
    // 4️⃣ 设置语音
    if (voice) utter.voice = voice;
    
    // 5️⃣ 设置事件监听器
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    utter.onerror = (e) => {
      setIsPlaying(false);
      console.error(e);
      // 忽略取消和中断错误
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        setError(`System TTS error: ${e.error}`);
      }
    };

    // 6️⃣ 开始朗读！
    window.speechSynthesis.speak(utter);
  } catch (e: any) {
    setError("Failed to use system speech.");
  }
};
```

### 代码解析

#### 步骤 1: 创建 SpeechSynthesisUtterance 对象
```typescript
const utter = new SpeechSynthesisUtterance(text);
```
- `SpeechSynthesisUtterance` 是 W3C Web Speech API 的核心类
- 用于封装要朗读的文本
- **这是标准浏览器 API，不是逆向接口！**

#### 步骤 2-3: 获取和选择语音
```typescript
const voices = window.speechSynthesis.getVoices();
const voice = voices.find(v => v.name === selectedVoice);
```
- `getVoices()` 返回浏览器/系统所有可用的语音
- 在 Edge + Windows 中，这里会包含 Microsoft Natural 语音
- 语音列表由操作系统和浏览器提供，不是从云端下载

#### 步骤 4: 应用语音设置
```typescript
if (voice) utter.voice = voice;
```
- 将用户选择的语音应用到 utterance 对象
- 如果不设置，将使用系统默认语音

#### 步骤 5: 事件监听
```typescript
utter.onstart = () => setIsPlaying(true);
utter.onend = () => setIsPlaying(false);
utter.onerror = (e) => { /* 错误处理 */ };
```
- 监听朗读开始、结束和错误事件
- 用于更新 UI 状态（播放按钮、错误提示等）

#### 步骤 6: 开始朗读
```typescript
window.speechSynthesis.speak(utter);
```
- **这是关键！调用浏览器的朗读功能**
- 浏览器内部会调用操作系统的 TTS 引擎
- 完全本地处理，无网络请求

---

## 2. 语音加载代码 (App.tsx 第 29-67 行)

```typescript
useEffect(() => {
  const loadVoices = () => {
    // 获取所有可用语音
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) return;

    // 格式化并排序语音列表
    const formatted: VoiceOption[] = voices.map(v => ({
      id: v.name,
      name: `${v.name} (${v.lang})`,
      lang: v.lang,
      default: v.default
    })).sort((a, b) => {
      // 🎯 优先显示 Microsoft 语音
      const aIsEdge = a.id.includes('Microsoft');
      const bIsEdge = b.id.includes('Microsoft');
      if (aIsEdge && !bIsEdge) return -1;
      if (!aIsEdge && bIsEdge) return 1;
      return a.name.localeCompare(b.name);
    });
    
    setSystemVoices(formatted);

    // 自动选择默认语音
    if (!selectedVoice && formatted.length > 0) {
      const edgeVoice = formatted.find(v => 
        v.id.includes('Microsoft') && v.lang?.startsWith('en')
      );
      const defaultVoice = formatted.find(v => v.default);
      setSelectedVoice(
        edgeVoice ? edgeVoice.id : (defaultVoice ? defaultVoice.id : formatted[0].id)
      );
    }
  };

  loadVoices();
  
  // 某些浏览器异步加载语音，需要监听变化
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}, [selectedVoice]);
```

### 关键点

1. **语音来源**: `window.speechSynthesis.getVoices()`
   - 这是浏览器提供的标准 API
   - 返回的语音来自操作系统

2. **Microsoft 语音优先**
   - 代码检查语音名称是否包含 "Microsoft"
   - 这些语音在 Edge/Windows 中自然可用
   - 不是通过逆向或特殊方法获取的

3. **异步加载处理**
   - 监听 `onvoiceschanged` 事件
   - 因为某些浏览器异步加载语音列表

---

## 3. 停止播放代码

```typescript
const stopAudio = useCallback(() => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  setIsPlaying(false);
}, []);
```

- `window.speechSynthesis.cancel()` 立即停止朗读
- 也是标准 Web Speech API 的一部分

---

## 4. Web Speech API 对象结构

### SpeechSynthesis (window.speechSynthesis)

```typescript
interface SpeechSynthesis {
  // 属性
  pending: boolean;        // 是否有待处理的朗读
  speaking: boolean;       // 是否正在朗读
  paused: boolean;         // 是否已暂停
  
  // 方法
  speak(utterance: SpeechSynthesisUtterance): void;  // 开始朗读
  cancel(): void;                                    // 取消朗读
  pause(): void;                                     // 暂停朗读
  resume(): void;                                    // 恢复朗读
  getVoices(): SpeechSynthesisVoice[];              // 获取语音列表
  
  // 事件
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
}
```

### SpeechSynthesisUtterance

```typescript
interface SpeechSynthesisUtterance {
  // 属性
  text: string;           // 要朗读的文本
  lang: string;           // 语言代码
  voice: SpeechSynthesisVoice | null;  // 使用的语音
  volume: number;         // 音量 (0-1)
  rate: number;           // 语速 (0.1-10)
  pitch: number;          // 音调 (0-2)
  
  // 事件
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
}
```

### SpeechSynthesisVoice

```typescript
interface SpeechSynthesisVoice {
  name: string;           // 语音名称，如 "Microsoft David - English (United States)"
  lang: string;           // 语言代码，如 "en-US"
  voiceURI: string;       // 语音 URI
  default: boolean;       // 是否为默认语音
  localService: boolean;  // 是否为本地语音（不需要网络）
}
```

---

## 5. 完整工作流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户操作                                  │
│  1. 在 textarea 中输入文本: "Hello World"                         │
│  2. 选择语音: "Microsoft David - English (United States)"        │
│  3. 点击 "Speak Text" 按钮                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React 组件 (App.tsx)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  handlePlay() 函数被调用                                   │  │
│  │  • 创建 SpeechSynthesisUtterance("Hello World")           │  │
│  │  • 获取语音列表 getVoices()                                │  │
│  │  • 设置选中的语音                                          │  │
│  │  • 设置事件监听器 (onstart, onend, onerror)               │  │
│  │  • 调用 window.speechSynthesis.speak(utter)               │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Web Speech API (浏览器层)                        │
│  • 接收 speak() 调用                                             │
│  • 验证参数和语音设置                                             │
│  • 将请求转发给底层 TTS 引擎                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                浏览器 (Edge/Chrome/Firefox)                       │
│  • Edge: 使用 Windows SAPI (Speech API)                         │
│  • Chrome: 使用操作系统提供的 TTS                                 │
│  • Firefox: 使用操作系统提供的 TTS                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   操作系统 TTS 引擎                               │
│  Windows: Microsoft Speech Platform                             │
│    • Microsoft David (英语-美国)                                 │
│    • Microsoft Zira (英语-美国)                                  │
│    • Microsoft HuiHui (中文-中国)                                │
│    • ... 其他系统安装的语音                                       │
│                                                                  │
│  macOS: macOS Speech Synthesis                                  │
│  Linux: eSpeak, Festival 等                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        音频输出                                   │
│  🔊 "Hello World" (使用 Microsoft David 语音)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 关键技术细节

### 为什么在 Edge 中语音质量最好？

```
Microsoft Edge 浏览器
    ↓
直接访问 Windows SAPI
    ↓
使用 Microsoft Neural TTS 引擎
    ↓
高质量语音输出
```

**其他浏览器：**
```
Chrome/Firefox
    ↓
通用 TTS 接口
    ↓
可能使用质量较低的系统默认引擎
    ↓
中等质量语音输出
```

### 为什么不需要网络？

1. **语音引擎在本地**
   - Windows 系统自带 Microsoft TTS 引擎
   - 不需要从云端下载或流式传输

2. **处理全部本地完成**
   - 文本解析: 本地
   - 语音合成: 本地
   - 音频播放: 本地

3. **离线可用**
   - 页面加载后，即使断网也能使用
   - 所有依赖都是本地资源

---

## 7. 与逆向工程的对比

### ❌ 逆向工程方式（本项目没有使用）

```javascript
// 这是逆向工程的例子（本项目没有这样做！）
const reverseEngineeredAPI = async (text) => {
  // 抓包获取 Microsoft Azure TTS API
  const response = await fetch('https://some-microsoft-api.com', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer stolen-token',  // 盗用的令牌
      'X-Secret-Header': 'reverse-engineered'   // 逆向得到的头
    },
    body: JSON.stringify({ text })
  });
  // 这是非法的！
};
```

### ✅ 本项目的合法方式

```javascript
// 使用标准 Web API（完全合法）
const legalWay = (text) => {
  const utter = new SpeechSynthesisUtterance(text);  // W3C 标准
  window.speechSynthesis.speak(utter);               // 公开 API
  // 完全合法，W3C 推荐！
};
```

---

## 8. 实际运行示例

### 在控制台测试

在浏览器控制台中运行以下代码，即可听到语音：

```javascript
// 1. 简单示例
const utter = new SpeechSynthesisUtterance("Hello, World!");
window.speechSynthesis.speak(utter);

// 2. 查看所有可用语音
console.log(window.speechSynthesis.getVoices());

// 3. 使用特定语音
const voices = window.speechSynthesis.getVoices();
const davidVoice = voices.find(v => v.name.includes('David'));
const utter2 = new SpeechSynthesisUtterance("Using Microsoft David voice");
utter2.voice = davidVoice;
window.speechSynthesis.speak(utter2);

// 4. 调整语速和音调
const utter3 = new SpeechSynthesisUtterance("Fast and high pitch");
utter3.rate = 1.5;   // 1.5倍速
utter3.pitch = 1.5;  // 较高音调
window.speechSynthesis.speak(utter3);
```

---

## 9. 浏览器兼容性

| API | Chrome | Edge | Firefox | Safari |
|-----|--------|------|---------|--------|
| `SpeechSynthesis` | ✅ 33+ | ✅ 14+ | ✅ 49+ | ✅ 7+ |
| `getVoices()` | ✅ | ✅ | ✅ | ✅ |
| `speak()` | ✅ | ✅ | ✅ | ✅ |
| 高质量语音 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## 10. 参考资料

- **MDN Web Docs**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **W3C Specification**: https://w3c.github.io/speech-api/
- **Can I Use**: https://caniuse.com/speech-synthesis

---

**最后更新**: 2025-12-28  
**代码来源**: Web-TTS/App.tsx
