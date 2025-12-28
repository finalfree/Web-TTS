# Web-TTS / OmniVoice Studio

A professional-grade Text-to-Speech tool using native Browser Speech API.

## 📚 Documentation

- **[TTS Implementation Analysis (English)](./TTS_IMPLEMENTATION_ANALYSIS.md)** - Comprehensive technical analysis
- **[TTS 实现调查报告 (中文)](./TTS实现调查报告.md)** - 完整的技术分析报告
- **[Quick Reference (快速参考)](./QUICK_REFERENCE.md)** - Bilingual quick reference guide

## 🎯 Key Features

- 🎤 **Browser Native TTS** - Uses W3C Web Speech API
- 🌍 **Multi-language Support** - Access all system/browser voices
- 🔒 **Privacy-Focused** - Runs entirely client-side
- 🆓 **Free & Open Source** - No API keys or server required
- 🎨 **Modern UI** - Built with React and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js (Latest LTS recommended)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
```

## 💻 Tech Stack

- **Frontend**: React 19.2.3
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TTS Engine**: Web Speech API (Browser Native)

## 🌐 Browser Compatibility

| Browser | Support | Voice Quality |
|---------|---------|---------------|
| Microsoft Edge | ✅ Excellent | ⭐⭐⭐⭐⭐ |
| Google Chrome | ✅ Very Good | ⭐⭐⭐⭐ |
| Firefox | ✅ Good | ⭐⭐⭐ |
| Safari | ✅ Good | ⭐⭐⭐ |

**Best Experience**: Use Microsoft Edge on Windows for access to high-quality "Microsoft Natural" voices.

## ❓ FAQ

### Is this using reverse-engineered Microsoft APIs?

**No!** This project uses the standard W3C Web Speech API, which is:
- ✅ Publicly documented and standardized
- ✅ Natively supported by modern browsers
- ✅ Completely legal and compliant
- ✅ Requires no API keys or authentication

### How does it access Microsoft voices?

When running in Microsoft Edge (especially on Windows), the browser provides access to Windows' built-in Microsoft TTS engines through the standard Web Speech API. No reverse engineering or unauthorized API access is involved.

### Does it work offline?

Yes! After the initial page load, the TTS functionality works offline since it uses the browser's native capabilities.

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🔗 Related Links

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [W3C Speech API Specification](https://w3c.github.io/speech-api/)
