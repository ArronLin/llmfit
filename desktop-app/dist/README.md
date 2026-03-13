# LLMFit Desktop Application

LLMFit 的 Windows 桌面应用程序，提供免安装的 .exe 包，无需 Python 和 Node.js 环境。

## 系统要求

- Windows 10 或 Windows 11
- 64位操作系统
- 无需安装 Python 或 Node.js

## 快速开始

### 下载预构建版本

1. 从 Releases 页面下载 `LLMFit-Desktop-x64.msi` 或 `LLMFit-Desktop.zip`
2. 运行安装程序或直接解压 ZIP 文件
3. 双击 `LLMFit.exe` 启动应用

### 从源码构建

#### 前置要求

- Python 3.11+
- Node.js 18+
- Rust 1.70+
- Windows SDK

#### 构建步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/llmfit.git
cd llmfit
```

2. 运行构建脚本
```powershell
cd desktop-app
.\build.ps1
```

构建完成后，输出文件位于：
- MSI 安装包: `desktop-app/src-tauri/target/release/bundle/msi/`
- 可执行文件: `desktop-app/src-tauri/target/release/`

## 构建选项

```powershell
# 完整构建
.\build.ps1

# 清理并重新构建
.\build.ps1 -Clean

# 仅构建后端
.\build.ps1 -SkipFrontend -SkipTauri

# 仅构建前端
.\build.ps1 -SkipBackend -SkipTauri

# 仅构建 Tauri（假设前后端已构建）
.\build.ps1 -SkipBackend -SkipFrontend
```

## 项目结构

```
desktop-app/
├── src/                    # 前端资源
├── src-tauri/             # Tauri Rust 代码
│   ├── src/
│   │   └── main.rs        # 主程序入口
│   ├── backend/           # 后端可执行文件（构建时复制）
│   ├── icons/             # 应用图标
│   ├── Cargo.toml         # Rust 依赖
│   └── tauri.conf.json    # Tauri 配置
├── build.ps1              # 构建脚本
└── README.md              # 本文档
```

## 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Python + FastAPI
- **桌面框架**: Tauri (Rust)
- **后端打包**: PyInstaller

## 功能特性

- ✅ 单文件可执行程序，无需安装依赖
- ✅ 自动启动嵌入式后端服务
- ✅ 系统托盘集成（最小化到托盘）
- ✅ 原生 Windows 窗口体验
- ✅ 自动端口检测和切换
- ✅ 支持多语言（中文/英文）

## 故障排除

### 应用无法启动

1. 检查是否有其他程序占用 8000 端口
2. 尝试以管理员身份运行
3. 检查 Windows Defender 是否阻止了程序

### 后端启动失败

1. 查看任务管理器是否有残留的 llmfit-backend 进程
2. 结束相关进程后重新启动应用

### 构建失败

1. 确保已安装所有前置依赖
2. 运行 `build.ps1 -Clean` 清理后重试
3. 检查 Rust 和 Node.js 版本是否符合要求

## 许可证

MIT License
