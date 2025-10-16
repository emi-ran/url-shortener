# 🔗 URL Shortener

A modern Chrome extension that shortens URLs with automatic QR code generation. Built with a beautiful dark theme interface.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=google-chrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

## ✨ Features

- 🚀 **One-Click Shortening** - Automatically shortens the current page URL
- 📱 **QR Code Generation** - Instant QR code creation for shortened URLs
- 📋 **Easy Copy** - Copy shortened URL to clipboard with one click
- 🌙 **Dark Theme** - Beautiful dark mode interface with neon accents
- 💾 **Download QR Code** - Save QR codes as PNG images
- ♾️ **Permanent Links** - URLs never expire (using is.gd API)

## 🎨 Screenshots

```
┌─────────────────────────────┐
│    🔗 URL Shortener         │
├─────────────────────────────┤
│ Shortened URL:              │
│ https://is.gd/abc123        │
│                             │
│ [QR Code Preview]           │
│                             │
│ Short Code: abc123          │
│ Expires: Permanent          │
│                             │
│ [📋 Copy] [🌐 Open]        │
│ [📥 Download QR] [🔄 New]  │
└─────────────────────────────┘
```

## 📦 Installation

### From Source

1. **Clone the repository:**

   ```bash
   git clone https://github.com/emi-ran/url-shortener.git
   cd url-shortener
   ```

2. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the project folder
   - Done! The extension icon will appear in your toolbar

## 🚀 Usage

1. Navigate to any webpage you want to shorten
2. Click the extension icon in your toolbar
3. The URL is automatically shortened with a QR code
4. Click "📋 Copy" to copy the shortened URL
5. Click "📥 Download QR" to download the QR code

## 🛠️ Tech Stack

- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No frameworks, pure performance
- **is.gd API** - Reliable URL shortening service
- **QR Server API** - Free QR code generation
- **Modern CSS** - Dark theme with glassmorphism effects

## 📂 Project Structure

```
url-shortener/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup UI
├── popup.css          # Dark theme styles
├── popup.js           # Main logic
├── icon.png           # Extension icon
├── .gitignore         # Git ignore rules
└── README.md          # Documentation
```

## 🔧 Configuration

The extension uses the following APIs:

- **URL Shortening:** [is.gd](https://is.gd/)
- **QR Code Generation:** [QR Server](https://goqr.me/api/)

No API keys required!

## 🔧 Development

To modify or contribute to this extension:

1. Clone the repository
2. Make your changes to the source files
3. Load the extension in Chrome using "Load unpacked"
4. Test your changes
5. Submit a pull request

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**emi-ran**

- GitHub: [@emi-ran](https://github.com/emi-ran)

## 🙏 Acknowledgments

- is.gd for the free URL shortening API
- QR Server for QR code generation
- Chrome Extension community

---

⭐ If you find this useful, please star the repository!
