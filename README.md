# 🧠 SILENT KILLER  (Under Developement)
  
**Ambient Intelligence for Productivity**

An AI that watches how humans work, detects inefficiencies, and improves workflows — without prompts.

This is not an assistant. This is ambient intelligence.

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture Overview](#-architecture-overview)
- [🛠️ System Requirements](#-system-requirements)
- [📦 Installation](#-installation)
- [🎯 How to Use](#-how-to-use)
- [📱 User Interfaces](#-user-interfaces)
- [⚙️ Configuration](#-configuration)
- [🔧 Commands Reference](#-commands-reference)
- [🧠 Features](#-features)
- [🔒 Privacy & Security](#-privacy--security)
- [🐛 Troubleshooting](#-troubleshooting)
- [📚 Advanced Usage](#-advanced-usage)
- [🤝 Contributing](#-contributing)

---

## 🚀 Quick Start

<!-- ### For Non-Technical Users (One-Command Setup)

**Windows:**
```powershell
# Download and run installer
iwr -useb https://raw.githubusercontent.com/your-repo/silent-killer/main/install.ps1 | iex

# Start everything
.\run.ps1 -Action all
```

**Mac/Linux:**
```bash
# Download and run installer
curl -sSL https://raw.githubusercontent.com/your-repo/silent-killer/main/install.sh | bash

# Start everything
./run.sh all
``` -->


### Project Structure

```
silent-killer/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Business logic
│   │   └── models.py # Data models
│   ├── tests/         # Backend tests
│   └── requirements.txt
├── frontend/          # React web interface
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── agent/            # Terminal and desktop agents
│   ├── main.py      # CLI interface
│   ├── tui.py       # Terminal UI
│   └── desktop_agent.py
├── tests/            # Integration tests
├── docs/             # Documentation
├── scripts/          # Utility scripts
├── docker-compose.yml
├── install.sh        # Installation script
├── run.sh           # Run script
└── README.md        # This file
```

---


### For Technical Users

```bash
# Clone repository
git clone https://github.com/Blacksujit/Silent-Killer-AI-Agent.git
cd silent-killer

# Install dependencies
./install.sh

# Start all services
./run.sh all
```

**🎉 Access your interfaces:**
- **Web Dashboard**: http://localhost:3000
- **Terminal Interface**: Run `./run.sh agent`
- **API Documentation**: http://localhost:8000/docs

---


## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Agent/TUI     │    │   Web Frontend  │    │ Desktop Agent   │
│  (Terminal)     │    │   (Browser)     │    │ (System-wide)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      FastAPI Backend      │
                    │   (Event Processing)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Intelligence Core       │
                    │  • Rules Engine           │
                    │  • Pattern Recognition    │
                    │  • Learning System        │
                    │  • ML Models              │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Data Store           │
                    │   (SQLite/Memory)         │
                    └───────────────────────────┘
```

## Original Arcitecture Diagram :

![Architecture Diagram](./backend/docs/original-arcitectural-digram.png)

## 🛠️ System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher (for frontend only)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 1GB free space
- **Network**: Internet connection for installation only

### Optional Requirements
- **Docker**: 20.10+ (for containerized deployment)
- **Git**: For source code management
- **VS Code**: Recommended for development

### Compatibility Matrix

| System | Python | Node.js | Docker | Status |
|--------|--------|---------|--------|--------|
| Windows 10+ | ✅ | ✅ | ✅ | Fully Tested |
| Windows 11 | ✅ | ✅ | ✅ | Fully Tested |
| macOS 10.15+ | ✅ | ✅ | ✅ | Fully Tested |
| Ubuntu 18.04+ | ✅ | ✅ | ✅ | Fully Tested |
| CentOS 8+ | ✅ | ✅ | ✅ | Fully Tested |

---

## 📦 Installation

<!-- ### Method 1: Automatic Installer (Recommended) -->
<!-- 
**Windows PowerShell:**
```powershell
# Run installer (opens in browser if blocked)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb https://raw.githubusercontent.com/your-repo/silent-killer/main/install.ps1 | iex
``` -->

<!-- **Linux/macOS:**
```bash
# Run installer
curl -sSL https://raw.githubusercontent.com/your-repo/silent-killer/main/install.sh | bash
``` -->

### Manual Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/Blacksujit/Silent-Killer-AI-Agent.git
cd silent-killer
```

#### Step 2: Install Backend Dependencies
```bash
# Create virtual environment
python -m venv .venv

# Activate environment
# Windows:
.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

# Install Python packages
pip install -r backend/requirements.txt
```

#### Step 3: Install Frontend Dependencies
```bash
# Install Node.js dependencies
cd frontend
npm install
cd ..
```

#### Step 4: Install Agent Dependencies
```bash
# Install agent packages
pip install -r agent/requirements.txt
```

#### Step 5: Configure Environment
```bash
# Copy configuration template
cp .env.example .env

# Edit configuration (optional)
nano .env
```

### Method 3: Docker Installation

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individual images
docker build -t silent-killer-backend ./backend
docker build -t silent-killer-frontend ./frontend
```

---

## 🎯 How to Use

### Starting the System

#### Option 1: Use Run Scripts (Easiest)
```bash
# Start all services
./run.sh all          # Mac/Linux
.\run.ps1 -Action all # Windows

# Start individual services
./run.sh backend     # Backend API only
./run.sh frontend    # Web interface only
./run.sh agent       # Terminal interface only
```

#### Option 2: Manual Startup
```bash
# Terminal 1: Start Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Terminal 3: Start Agent
cd agent
python main.py
```

<!-- ### First Time Setup

1. **Start the system** using one of the methods above
2. **Open web interface** at http://localhost:3000
3. **Generate test data** to see suggestions:
   ```bash
   ./run.sh simulate
   ```
4. **Check suggestions** in the web interface or terminal:
   ```bash
   ./run.sh suggestions
   ```

### Daily Usage

#### For Web Users
1. Open http://localhost:3000 in your browser
2. View real-time dashboard with charts and statistics
3. Check "Suggestions" tab for productivity insights
4. Use "Monitor" tab to start/stop activity tracking
5. Configure settings in the "Settings" panel -->

#### For Terminal Users
```bash
# Check system status
./run.sh status

# Get productivity suggestions
./run.sh suggestions

# Simulate work activity
./run.sh simulate --duration 60 --events 10

# Start monitoring
./run.sh monitor

# View action history
./run.sh actions
```

#### For Command Line Users
```bash
# Basic commands
python agent/main.py status
python agent/main.py suggestions --count 5
python agent/main.py simulate --duration 30

# Advanced commands
python agent/main.py --api-url http://localhost:8000 status
python agent/tui.py  # Terminal UI
python agent/desktop_agent.py  # Desktop monitoring
```

---

## 📱 User Interfaces

### 1. Web Dashboard (http://localhost:3000)

**Perfect for:** Visual users, managers, analysts

**Features:**
- 📊 **Real-time Dashboard** - Live activity charts and statistics
- 💡 **Suggestions Panel** - Interactive productivity recommendations
- 🔍 **Monitor Panel** - Start/stop activity tracking with live updates
- ⚙️ **Settings Panel** - Configure API, privacy, and monitoring preferences
- 📈 **System Resources** - CPU, memory, and event rate monitoring

**How to Access:**
1. Start system: `./run.sh all`
2. Open browser: http://localhost:3000
3. No installation required - runs in browser

### 2. Terminal UI (TUI)

**Perfect for:** Developers, power users, terminal enthusiasts

**Features:**
- 🖥️ **Rich Terminal Interface** - Modern terminal UI with colors and layouts
- ⌨️ **Keyboard Navigation** - Full keyboard control (no mouse needed)
- 📊 **Live Statistics** - Real-time system monitoring
- 🔄 **Background Monitoring** - Toggle monitoring on/off
- 📋 **Interactive Suggestions** - Accept/reject suggestions with keyboard

**How to Access:**
```bash
# Launch TUI
python agent/tui.py

# Keyboard shortcuts
q - Quit
r - Refresh statistics  
s - Show suggestions
m - Toggle monitoring
h - Show help
```

### 3. Command Line Interface (CLI)

**Perfect for:** Automation, scripting, quick checks

**Features:**
- ⚡ **Quick Commands** - Fast status checks and actions
- 🤖 **Scriptable** - Perfect for shell scripts and automation
- 📊 **Status Monitoring** - System health and connection status
- 🎯 **Suggestions** - Get productivity insights instantly
- 🔄 **Batch Operations** - Process multiple actions at once

**How to Access:**
```bash
# Basic usage
python agent/main.py status
python agent/main.py suggestions
python agent/main.py simulate

# Advanced usage with options
python agent/main.py --api-url http://localhost:8000 suggestions --count 10
python agent/main.py simulate --duration 120 --events 8
python agent/main.py monitor
```

### 4. Desktop Agent

**Perfect for:** System-wide monitoring, background tracking

**Features:**
- 🖱️ **System Monitoring** - Mouse, keyboard, and application tracking
- 📁 **File Watching** - Document and project activity monitoring
- 💻 **Resource Monitoring** - CPU, memory, and process tracking
- 🔒 **Privacy-First** - Local-only data processing
- ⚡ **Low Resource Usage** - Minimal impact on system performance

**How to Access:**
```bash
# Start desktop monitoring
python agent/desktop_agent.py

# Runs in background, press Ctrl+C to stop
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# API Configuration
SILENT_KILLER_API_URL=http://localhost:8000
SILENT_KILLER_API_KEYS=your-secret-key-1,your-secret-key-2
USER_ID=your-unique-user-id

# Storage & Privacy
SILENT_KILLER_STORE=sqlite
SILENT_KILLER_SQLITE_PATH=./data/store.db
SILENT_KILLER_RETENTION_DAYS=30
SILENT_KILLER_PII_SALT=your-random-salt-64-chars

# Behavior Settings
SILENT_KILLER_AUTO_EXEC_CONF=0.9
SILENT_KILLER_PRUNE_INTERVAL_SECONDS=3600

# Development
LOG_LEVEL=info
```

### Configuration File Locations

| Platform | Config File | Data Directory | Logs |
|----------|-------------|----------------|------|
| Windows | `.env` | `.\data\` | `.\logs\` |
| macOS/Linux | `.env` | `./data` | `./logs` |
| Docker | Environment variables | `/app/data` | `/app/logs` |

### Common Configuration Options

```bash
# Change data retention (days)
SILENT_KILLER_RETENTION_DAYS=90

# Enable auto-execution (confidence threshold 0-1)
SILENT_KILLER_AUTO_EXEC_CONF=0.95

# Change database location
SILENT_KILLER_SQLITE_PATH=/path/to/your/database.db

# Use in-memory storage (for testing)
SILENT_KILLER_STORE=memory
```

---

## 🔧 Commands Reference

### Run Scripts (All Platforms)

| Command | Description | Example |
|---------|-------------|---------|
| `./run.sh all` | Start all services | `./run.sh all` |
| `./run.sh backend` | Start backend API only | `./run.sh backend` |
| `./run.sh frontend` | Start web interface only | `./run.sh frontend` |
| `./run.sh agent` | Start terminal interface | `./run.sh agent` |
| `./run.sh desktop` | Start desktop monitoring | `./run.sh desktop` |
| `./run.sh stop` | Stop all services | `./run.sh stop` |
| `./run.sh status` | Show service status | `./run.sh status` |
| `./run.sh test` | Run test suite | `./run.sh test` |
| `./run.sh install` | Run installation script | `./run.sh install` |

### CLI Commands

| Command | Options | Description |
|---------|---------|-------------|
| `status` | `--api-url <url>` | Check system health |
| `suggestions` | `--count <number>` | Get productivity suggestions |
| `simulate` | `--duration <seconds> --events <rate>` | Generate test activity |
| `monitor` | (none) | Start real-time monitoring |
| `actions` | (none) | View action history |

**Examples:**
```bash
# Basic usage
python agent/main.py status
python agent/main.py suggestions --count 5
python agent/main.py simulate --duration 60 --events 8

# Advanced usage
python agent/main.py --api-url http://localhost:8001 suggestions --count 10
python agent/main.py simulate --duration 300 --events 15
```

### Web Interface Commands

| Action | How to Access | Description |
|--------|---------------|-------------|
| View Dashboard | http://localhost:3000 | Main dashboard with charts |
| Get Suggestions | Suggestions tab | View productivity insights |
| Start Monitoring | Monitor tab | Toggle activity tracking |
| Configure Settings | Settings tab | Adjust system preferences |
| View API Docs | http://localhost:8000/docs | Interactive API documentation |

### Terminal UI Commands

| Key | Action | Description |
|-----|--------|-------------|
| `q` | Quit | Exit the application |
| `r` | Refresh | Update statistics |
| `s` | Suggestions | Show suggestions panel |
| `m` | Monitor | Toggle monitoring |
| `h` | Help | Show help information |
| `Tab` | Navigate | Switch between panels |
| `Enter` | Select | Activate buttons |

---

---

## 🧠 Features

### 🎯 Pattern Detection

| Pattern | Description | Confidence |
|---------|-------------|------------|
| **Context Switching** | Detects frequent app/window changes | High/Medium |
| **Interruptions** | Identifies fragmented work sessions | Medium |
| **Repetitive Sequences** | Finds automatable workflows | Low/Medium |
| **Deep Work Sessions** | Recognizes focused work periods | High |
| **Productivity Rhythms** | Identifies peak performance times | Medium |
| **Burnout Risk** | Monitors work-life balance | High |
| **Anomalies** | Detects unusual behavior patterns | Variable |

### 🤖 Intelligence Features

- **Real-time Analysis** - Processes events as they happen
- **Confidence Scoring** - Ranks suggestions by reliability
- **Learning System** - Improves from user feedback
- **ML Models** - Advanced pattern recognition
- **Auto-execution** - Confident actions can run automatically

### 🔒 Privacy Features

- **Local Processing** - All data stays on your machine
- **PII Hashing** - Personal information automatically anonymized
- **Data Minimization** - Only stores necessary metadata
- **Configurable Retention** - Automatic cleanup of old data
- **No External Dependencies** - Works offline after installation

---

## 🔒 Privacy & Security

### Data Protection

✅ **Local Only Processing** - No data leaves your machine  
✅ **PII Hashing** - Window titles and personal info hashed  
✅ **Encryption** - Sensitive data encrypted at rest  
✅ **Access Control** - API key authentication required  
✅ **Audit Trail** - Complete action logging  

### Privacy Settings

```bash
# Enable maximum privacy
SILENT_KILLER_PRIVACY_MODE=true
HASH_WINDOW_TITLE=true
ANONYMIZE_USER_ID=true
```

### Security Best Practices

1. **Use strong API keys** (minimum 32 characters)
2. **Change default configuration** before production use
3. **Regular updates** - Keep system updated
4. **Network isolation** - Run on trusted networks only
5. **Backup encryption** - Encrypt backup files

---

## 🐛 Troubleshooting

### Common Issues

#### Installation Problems

**Problem:** "Python not found"  
**Solution:** Install Python 3.8+ from python.org

**Problem:** "Node.js not found"  
**Solution:** Install Node.js 16+ from nodejs.org

**Problem:** "Permission denied"  
**Solution:** Run installer as administrator (Windows) or with sudo (Linux)

#### Startup Issues

**Problem:** "Port already in use"  
**Solution:** Change ports in configuration:
```bash
# Use different ports
uvicorn backend.app.main:app --port 8001
cd frontend && npm run dev -- --port 3001
```

**Problem:** "Backend not responding"  
**Solution:** Check if backend is running:
```bash
curl http://localhost:8000/api/health
```

#### Feature Issues

**Problem:** "No suggestions generated"  
**Solution:** Generate test data first:
```bash
python agent/main.py simulate --duration 60
```

**Problem:** "Desktop agent not working"  
**Solution:** Install additional dependencies:
```bash
pip install pynput psutil watchdog pyautogui
```

### Getting Help

1. **Check logs** for error messages
2. **Verify configuration** in `.env` file
3. **Test connectivity** between components
4. **Restart services** if issues persist
5. **Check system resources** (RAM, disk space)

<!-- ### Support Channels

- 📚 **Documentation**: https://docs.silent-killer.com
- 🐛 **Issues**: https://github.com/your-repo/silent-killer/issues
- 💬 **Community**: https://discord.gg/silent-killer
- 📧 **Email**: support@silent-killer.com -->

---

## 📚 Advanced Usage

### Development Setup

```bash
# Clone repository
git clone https://github.com/Blacksujit/Silent-Killer-AI-Agent.git
cd silent-killer

# Setup development environment
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -r agent/requirements.txt
cd frontend && npm install && cd ..

# Run tests
pytest tests/ -v

# Start development servers
./run.sh all
```

### Custom Rules

Add new pattern detection rules in `backend/app/core/rules.py`:

```python
def custom_rule(events: List[dict]):
    # Your custom rule logic
    suggestions = []
    # ... implement rule ...
    return suggestions

# Add to ALL_RULES list
ALL_RULES.append(custom_rule)
```

### API Integration

```python
import requests

# Ingest events
response = requests.post('http://localhost:8000/api/ingest', 
    json={'user_id': 'user1', 'type': 'window_focus', 'meta': {}})
print(response.json())

# Get suggestions
response = requests.get('http://localhost:8000/api/suggestions?user_id=user1')
print(response.json())
```

### Docker Customization

```yaml
# Custom docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - SILENT_KILLER_API_KEYS=your-key
      - SILENT_KILLER_RETENTION_DAYS=90
    volumes:
      - ./data:/app/data
    ports:
      - "8000:8000"
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Quick Start

1. **Fork repository** on GitHub
2. **Create feature branch**: `git checkout -b feature-name`
3. **Make changes** and test thoroughly
4. **Submit pull request** with description

### Development Guidelines

- **Code Style**: Follow PEP 8 for Python, standard for JavaScript
- **Testing**: Add tests for new features
- **Documentation**: Update README and API docs
- **Security**: Ensure no sensitive data in code

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=backend/app

# Run specific test file
pytest tests/test_rules.py -v
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with FastAPI, React, and modern Python/JavaScript ecosystems
- Inspired by productivity research and human-computer interaction
- Privacy-first design principles
- Open source community contributions

---

## 🚀 Ready to Start?

**Choose your path:**

🎯 **Quick Start (Recommended)**: `./install.sh` → `./run.sh all`  
🛠️ **Manual Setup**: Follow installation guide step-by-step  
🐳 **Docker**: `docker-compose up --build`  
📱 **Web Only**: Open http://localhost:3000 after starting backend  

**🧠 SILENT KILLER - Ambient Intelligence for Productivity**

*This is not an assistant. This is ambient intelligence.*
