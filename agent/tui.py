#!/usr/bin/env python3
"""
SILENT KILLER Terminal User Interface (TUI)
Rich terminal interface for productivity monitoring
"""

import asyncio
import time
from datetime import datetime
from typing import List, Optional

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import Header, Footer, Static, DataTable, ProgressBar, Button, Input
from textual.reactive import reactive
from textual.binding import Binding
from rich.text import Text

from main import SilentKillerAgent

class SilentKillerTUI(App):
    """Terminal User Interface for SILENT KILLER"""
    
    CSS = """
    .header {
        text-align: center;
        text-style: bold;
        color: $primary;
    }
    
    .stats-container {
        height: 10;
        border: solid $primary;
        padding: 1;
    }
    
    .suggestions-container {
        height: 20;
        border: solid $accent;
        padding: 1;
    }
    
    .controls-container {
        height: 5;
        dock: bottom;
    }
    
    .progress {
        width: 100%;
    }
    
    DataTable {
        height: 15;
    }
    
    Button {
        margin: 1;
    }
    """
    
    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("r", "refresh", "Refresh"),
        Binding("s", "show_suggestions", "Suggestions"),
        Binding("m", "toggle_monitor", "Monitor"),
        Binding("h", "show_help", "Help"),
    ]
    
    agent: reactive[Optional[SilentKillerAgent]] = reactive(None)
    monitoring: reactive[bool] = reactive(False)
    events_sent: reactive[int] = reactive(0)
    start_time: reactive[float] = reactive(time.time())
    
    def compose(self) -> ComposeResult:
        """Compose the UI layout"""
        yield Header()
        
        with Container(id="main"):
            yield Static("🧠 SILENT KILLER", classes="header")
            
            with Vertical():
                # Stats section
                with Container(classes="stats-container"):
                    yield Static("📊 System Statistics", id="stats-title")
                    yield Static("Initializing...", id="stats-content")
                    yield ProgressBar(total=100, show_eta=True, id="progress-bar")
                
                # Suggestions section
                with Container(classes="suggestions-container"):
                    yield Static("💡 Productivity Suggestions", id="suggestions-title")
                    yield DataTable(id="suggestions-table")
                
                # Controls section
                with Horizontal(classes="controls-container"):
                    yield Button("🔄 Refresh", id="refresh-btn")
                    yield Button("📊 Get Suggestions", id="suggestions-btn")
                    yield Button("🎯 Start Monitor", id="monitor-btn")
                    yield Button("❌ Stop Monitor", id="stop-monitor-btn", disabled=True)
        
        yield Footer()
    
    def on_mount(self) -> None:
        """Initialize the app when mounted"""
        self.agent = SilentKillerAgent()
        self.setup_suggestions_table()
        self.set_interval(2.0, self.update_stats)
        
        # Check backend health
        if self.agent.health_check():
            self.query_one("#stats-content").update("✅ Backend connected")
        else:
            self.query_one("#stats-content").update("❌ Backend unavailable")
    
    def setup_suggestions_table(self) -> None:
        """Setup the suggestions data table"""
        table = self.query_one(DataTable)
        table.add_column("Severity", width=10)
        table.add_column("Title", width=40)
        table.add_column("Confidence", width=12)
        table.add_column("Action", width=15)
        
        # Add placeholder row
        table.add_row("Loading...", "Fetching suggestions...", "...", "...")
    
    def update_stats(self) -> None:
        """Update statistics display"""
        if not self.agent:
            return
        
        elapsed = int(time.time() - self.start_time)
        events_per_sec = self.events_sent / max(1, elapsed)
        
        stats_text = (
            f"⏱️  Uptime: {elapsed}s\n"
            f"📊 Events: {self.events_sent}\n"
            f"🎯 Rate: {events_per_sec:.1f}/s\n"
            f"🔗 Status: {'🟢 Connected' if self.agent.health_check() else '🔴 Disconnected'}"
        )
        
        self.query_one("#stats-content").update(stats_text)
        
        # Update progress bar (simulate activity)
        progress = min(100, (elapsed % 60) * 100 / 60)
        self.query_one("#progress-bar").progress = progress
    
    def action_refresh(self) -> None:
        """Refresh data"""
        self.update_stats()
        self.query_one("#stats-content").update("🔄 Refreshed...")
    
    def action_show_suggestions(self) -> None:
        """Show suggestions"""
        if not self.agent:
            return
        
        self.query_one("#suggestions-title").update("💡 Loading suggestions...")
        
        suggestions = self.agent.get_suggestions()
        table = self.query_one(DataTable)
        
        # Clear existing rows
        table.clear()
        
        if not suggestions:
            table.add_row("None", "No suggestions available", "...", "...")
            self.query_one("#suggestions-title").update("💡 No suggestions")
            return
        
        # Add suggestions to table
        severity_colors = {
            'low': 'green',
            'medium': 'yellow',
            'high': 'red'
        }
        
        for suggestion in suggestions[:10]:  # Show top 10
            severity_text = Text(suggestion.severity.upper())
            severity_text.stylize(severity_colors.get(suggestion.severity, 'white'))
            
            table.add_row(
                severity_text,
                suggestion.title,
                f"{suggestion.confidence:.0%}",
                "Accept/Reject"
            )
        
        self.query_one("#suggestions-title").update(f"💡 {len(suggestions)} Suggestions Found")
    
    def action_toggle_monitor(self) -> None:
        """Toggle monitoring state"""
        if self.monitoring:
            self.stop_monitoring()
        else:
            self.start_monitoring()
    
    def start_monitoring(self) -> None:
        """Start activity monitoring"""
        self.monitoring = True
        self.events_sent = 0
        self.start_time = time.time()
        
        self.query_one("#monitor-btn").disabled = True
        self.query_one("#stop-monitor-btn").disabled = False
        self.query_one("#stats-title").update("📊 Monitoring Active")
        
        # Start background monitoring
        asyncio.create_task(self.monitor_activity())
    
    def stop_monitoring(self) -> None:
        """Stop activity monitoring"""
        self.monitoring = False
        
        self.query_one("#monitor-btn").disabled = False
        self.query_one("#stop-monitor-btn").disabled = True
        self.query_one("#stats-title").update("📊 Monitoring Stopped")
    
    async def monitor_activity(self) -> None:
        """Background monitoring task"""
        try:
            import psutil
            
            while self.monitoring:
                # Simulate event generation
                event = {
                    'user_id': self.agent.user_id,
                    'event_id': f"tui_{int(time.time() * 1000)}_{self.events_sent}",
                    'timestamp': datetime.utcnow().isoformat(),
                    'type': 'system_monitor',
                    'meta': {
                        'cpu_percent': psutil.cpu_percent(),
                        'memory_percent': psutil.virtual_memory().percent,
                        'active_processes': len(psutil.pids())
                    }
                }
                
                if self.agent.ingest_event(event):
                    self.events_sent += 1
                
                await asyncio.sleep(5)  # Monitor every 5 seconds
                
        except ImportError:
            self.query_one("#stats-content").update("❌ psutil not available for monitoring")
        except Exception as e:
            self.query_one("#stats-content").update(f"❌ Monitoring error: {e}")
    
    def action_show_help(self) -> None:
        """Show help information"""
        self.app.bell()  # Beep to get attention
        help_text = """
🧠 SILENT KILLER TUI Help:

Commands:
  q - Quit application
  r - Refresh statistics
  s - Show suggestions
  m - Toggle monitoring
  h - Show this help

Features:
  • Real-time activity monitoring
  • Productivity suggestions
  • System statistics
  • Event tracking
        """
        
        # You could show this in a modal or overlay
        self.query_one("#stats-content").update(help_text.strip())
    
    # Button event handlers
    def on_button_pressed(self, event: Button.Pressed) -> None:
        """Handle button presses"""
        button_id = event.button.id
        
        if button_id == "refresh-btn":
            self.action_refresh()
        elif button_id == "suggestions-btn":
            self.action_show_suggestions()
        elif button_id == "monitor-btn":
            self.start_monitoring()
        elif button_id == "stop-monitor-btn":
            self.stop_monitoring()

if __name__ == "__main__":
    app = SilentKillerTUI()
    app.run()
