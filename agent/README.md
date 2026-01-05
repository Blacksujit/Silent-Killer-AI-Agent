# SILENT KILLER AI Agent

Terminal-based AI agent for productivity monitoring and optimization.

## Features

- **Command Line Interface**: Rich CLI with real-time monitoring
- **Terminal User Interface**: Interactive TUI with live dashboard
- **Desktop Agent**: System-wide activity monitoring
- **Real-time Suggestions**: Get productivity insights instantly
- **Activity Simulation**: Test the system with simulated work patterns

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Install backend dependencies (if not already done)
cd ../backend
pip install -r requirements.txt
```

## Usage

### 1. Command Line Interface

```bash
# Check status
python main.py status

# Get suggestions
python main.py suggestions --count 5

# Simulate activity
python main.py simulate --duration 60 --events 10

# Start real-time monitoring
python main.py monitor
```

### 2. Terminal User Interface

```bash
# Launch interactive TUI
python tui.py
```

### 3. Desktop Agent

```bash
# Start desktop monitoring (requires additional permissions)
python desktop_agent.py
```

## Configuration

Set environment variables:

```bash
export SILENT_KILLER_API_URL="http://localhost:8000"
export SILENT_KILLER_API_KEY="your-api-key"
export USER_ID="your-user-id"
```

Or create a `.env` file:

```env
SILENT_KILLER_API_URL=http://localhost:8000
SILENT_KILLER_API_KEY=dev-key
USER_ID=default_user
```

## Commands

### CLI Commands

- `status` - Check agent and backend connection
- `suggestions` - Get and display productivity suggestions
- `simulate` - Generate test activity data
- `monitor` - Start real-time activity monitoring

### TUI Controls

- `q` - Quit application
- `r` - Refresh statistics
- `s` - Show suggestions
- `m` - Toggle monitoring
- `h` - Show help

## Privacy & Security

- All data is sent to your local backend instance
- PII is hashed and anonymized by default
- No data is sent to external services
- Desktop monitoring requires explicit permission

## Troubleshooting

### Backend Connection Issues

```bash
# Check if backend is running
curl http://localhost:8000/api/health

# Start backend server
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Permission Issues (Desktop Agent)

The desktop agent requires accessibility permissions on some systems:

**macOS:**
```bash
# Add Terminal to Accessibility in System Preferences
# Security & Privacy > Privacy > Accessibility
```

**Windows:**
```bash
# Run as Administrator
python desktop_agent.py
```

**Linux:**
```bash
# May need to install additional packages
sudo apt-get install python3-xlib python3-tk
```

### Missing Dependencies

```bash
# Install all required packages
pip install click rich textual requests psutil pynput watchdog pyautogui pillow python-dotenv

# For desktop monitoring specifically
pip install pynput psutil watchdog
```

## Development

### Adding New Commands

1. Create a new function in `main.py` with the `@cli.command()` decorator
2. Use the `SilentKillerAgent` class to interact with the backend
3. Follow the existing patterns for error handling and user feedback

### Extending the TUI

1. Modify the `SilentKillerTUI` class in `tui.py`
2. Add new widgets or update existing ones
3. Use the `compose()` method to define the layout
4. Add new bindings in the `BINDINGS` list

### Desktop Agent Features

1. Extend the `ActivityMonitor` class in `desktop_agent.py`
2. Add new event types and monitoring capabilities
3. Implement platform-specific features as needed

## Architecture

```
agent/
├── main.py           # CLI interface
├── tui.py            # Terminal UI
├── desktop_agent.py  # Desktop monitoring
├── requirements.txt  # Dependencies
└── README.md        # This file
```

The agent communicates with the backend API via HTTP requests, sending events and receiving suggestions. All processing happens on your local machine.
