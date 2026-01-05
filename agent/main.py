#!/usr/bin/env python3
"""
SILENT KILLER AI Agent
Terminal-based AI agent for productivity monitoring and optimization
"""

import os
import sys
import time
import json
import asyncio
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

import click
import requests
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.live import Live
from rich.layout import Layout
from rich.text import Text
from dotenv import load_dotenv

# Add backend to path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Load environment
load_dotenv()

console = Console()

class SilentKillerAgent:
    """Main AI Agent class for SILENT KILLER"""
    
    def __init__(self, api_url: str = "http://localhost:8000", api_key: str = None, user_id: str = None):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key or os.getenv('SILENT_KILLER_API_KEY', 'dev-key')
        self.user_id = user_id or self._get_or_generate_device_id()
        self.session = requests.Session()
        self.session.headers.update({'X-API-Key': self.api_key})
        
    def _get_or_generate_device_id(self) -> str:
        """Get or generate a per-device ID stored in ~/.silent-killer-device-id"""
        device_file = Path.home() / '.silent-killer-device-id'
        if device_file.exists():
            return device_file.read_text().strip()
        else:
            import uuid
            device_id = f'device-{uuid.uuid4()}'
            device_file.write_text(device_id)
            return device_id
        
    def health_check(self) -> bool:
        """Check if backend API is healthy"""
        try:
            response = self.session.get(f"{self.api_url}/api/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def ingest_event(self, event: Dict) -> bool:
        """Send event to backend"""
        try:
            response = self.session.post(
                f"{self.api_url}/api/ingest",
                json=event,
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            console.print(f"[red]Error ingesting event: {e}[/red]")
            return False
    
    def get_suggestions(self, since: Optional[datetime] = None) -> List[Dict]:
        """Get suggestions from backend"""
        try:
            params = {'user_id': self.user_id}
            if since:
                params['since'] = since.isoformat()
            
            response = self.session.get(
                f"{self.api_url}/api/suggestions",
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('suggestions', [])
            else:
                console.print(f"[red]Error getting suggestions: {response.status_code}[/red]")
                return []
        except Exception as e:
            console.print(f"[red]Error getting suggestions: {e}[/red]")
            return []
    
    def record_action(self, suggestion_id: str, action: str, details: str = None) -> bool:
        """Record user action on suggestion"""
        try:
            action_data = {
                'user_id': self.user_id,
                'suggestion_id': suggestion_id,
                'action': action,
                'details': details
            }
            
            response = self.session.post(
                f"{self.api_url}/api/actions",
                json=action_data,
                timeout=10
            )
            
            return response.status_code == 200
        except Exception as e:
            console.print(f"[red]Error recording action: {e}[/red]")
            return False

@click.group()
@click.option('--api-url', default='http://localhost:8000', help='Backend API URL')
@click.option('--api-key', help='API key for authentication')
@click.option('--user-id', help='Per-device user ID (auto-generated if not provided)')
@click.pass_context
def cli(ctx, api_url, api_key, user_id):
    """SILENT KILLER AI Agent - Ambient Intelligence for Productivity"""
    ctx.ensure_object(dict)
    ctx.obj['agent'] = SilentKillerAgent(api_url, api_key, user_id)

@cli.command()
@click.pass_context
def status(ctx):
    """Check agent and backend status"""
    agent = ctx.obj['agent']
    
    console.print(Panel.fit("[bold blue]SILENT KILLER Agent Status[/bold blue]"))
    
    # Backend health
    with Progress() as progress:
        task = progress.add_task("Checking backend...", total=None)
        healthy = agent.health_check()
        progress.update(task, completed=True)
    
    if healthy:
        console.print("✅ [green]Backend API is healthy[/green]")
    else:
        console.print("❌ [red]Backend API is not responding[/red]")
        return
    
    # Connection info
    console.print(f"🔗 API URL: {agent.api_url}")
    console.print(f"👤 User ID: {agent.user_id}")
    console.print(f"🔑 API Key: {'*' * len(agent.api_key)}")

@cli.command()
@click.option('--count', default=10, help='Number of suggestions to show')
@click.pass_context
def suggestions(ctx, count):
    """Get and display productivity suggestions"""
    agent = ctx.obj['agent']
    
    if not agent.health_check():
        console.print("❌ [red]Backend is not healthy[/red]")
        return
    
    console.print(Panel.fit("[bold blue]Productivity Suggestions[/bold blue]"))
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Analyzing your patterns...", total=None)
        suggestions = agent.get_suggestions()
        progress.update(task, completed=True)
    
    if not suggestions:
        console.print("[yellow]No suggestions available. Keep working to generate insights![/yellow]")
        return
    
    # Display suggestions
    table = Table(title="Your Productivity Insights")
    table.add_column("Severity", style="bold")
    table.add_column("Suggestion", style="cyan")
    table.add_column("Confidence", justify="right")
    table.add_column("Action", justify="center")
    
    severity_colors = {
        'low': 'green',
        'medium': 'yellow', 
        'high': 'red'
    }
    
    for i, suggestion in enumerate(suggestions[:count]):
        severity_color = severity_colors.get(suggestion.get('severity'), 'white')
        table.add_row(
            f"[{severity_color}]{suggestion.get('severity', 'unknown').upper()}[/{severity_color}]",
            suggestion.get('title', 'No title'),
            f"{suggestion.get('confidence', 0):.0%}",
            "Accept/Reject"
        )
    
    console.print(table)
    
    # Interactive actions
    console.print("\n[bold]Actions:[/bold]")
    for i, suggestion in enumerate(suggestions[:3]):
        action = click.prompt(
            f"Accept suggestion '{suggestion.get('title', 'No title')}'? (y/n/skip)",
            type=click.Choice(['y', 'n', 'skip'], case_sensitive=False),
            default='skip'
        )
        
        if action == 'y':
            if agent.record_action(suggestion.get('id'), 'accept'):
                console.print(f"✅ [green]Accepted: {suggestion.get('title')}[/green]")
        elif action == 'n':
            if agent.record_action(suggestion.get('id'), 'reject'):
                console.print(f"❌ [red]Rejected: {suggestion.get('title')}[/red]")

@cli.command()
@click.option('--duration', default=60, help='Monitoring duration in seconds')
@click.option('--events', default=5, help='Events to generate per minute')
@click.pass_context
def simulate(ctx, duration, events):
    """Simulate work activity for testing"""
    agent = ctx.obj['agent']
    
    if not agent.health_check():
        console.print("❌ [red]Backend is not healthy[/red]")
        return
    
    console.print(Panel.fit(f"[bold blue]Simulating Work Activity[/bold blue]\nDuration: {duration}s | Events: {events}/min"))
    
    import random
    
    event_types = ['window_focus', 'app_switch', 'command_run', 'file_open', 'notification']
    apps = ['VSCode', 'Browser', 'Terminal', 'Slack', 'Email', 'IDE']
    actions = ['coding', 'debugging', 'meeting', 'documentation', 'review']
    
    start_time = time.time()
    events_sent = 0
    
    with Live(console=console, refresh_per_second=2) as live:
        while time.time() - start_time < duration:
            # Generate random event
            event = {
                'user_id': agent.user_id,
                'event_id': f"sim_{int(time.time() * 1000)}_{events_sent}",
                'timestamp': datetime.utcnow().isoformat(),
                'type': random.choice(event_types),
                'meta': {
                    'app': random.choice(apps),
                    'action': random.choice(actions),
                    'window_title': f"{random.choice(apps)} - {random.choice(actions)}"
                }
            }
            
            if agent.ingest_event(event):
                events_sent += 1
            
            # Update display
            elapsed = int(time.time() - start_time)
            remaining = duration - elapsed
            layout = Layout()
            
            layout.split_column(
                Layout(name="header", size=3),
                Layout(name="stats", size=5),
                Layout(name="log")
            )
            
            layout["header"].update(Panel("🧠 SILENT KILLER - Activity Simulation"))
            layout["stats"].update(
                Panel(
                    f"⏱️  Time: {elapsed}s / {duration}s\n"
                    f"📊 Events Sent: {events_sent}\n"
                    f"🎯 Rate: {events_sent / max(1, elapsed):.1f} events/sec",
                    title="Statistics"
                )
            )
            layout["log"].update(
                Panel(f"Last event: {event['type']} - {event['meta']['app']}", title="Recent Activity")
            )
            
            live.update(layout)
            time.sleep(60 / events)  # Maintain events per minute rate
    
    console.print(f"\n✅ [green]Simulation complete! Sent {events_sent} events[/green]")

@cli.command()
@click.pass_context
def monitor(ctx):
    """Start real-time activity monitoring"""
    agent = ctx.obj['agent']
    
    if not agent.health_check():
        console.print("❌ [red]Backend is not healthy[/red]")
        return
    
    console.print(Panel.fit("[bold blue]Real-time Activity Monitoring[/bold blue]\nPress Ctrl+C to stop"))
    
    try:
        import psutil
        import threading
        from pynput import mouse, keyboard
        
        events_sent = 0
        start_time = time.time()
        
        def on_mouse_move(x, y):
            nonlocal events_sent
            event = {
                'user_id': agent.user_id,
                'event_id': f"mouse_{int(time.time() * 1000)}",
                'timestamp': datetime.utcnow().isoformat(),
                'type': 'mouse_move',
                'meta': {'x': x, 'y': y}
            }
            agent.ingest_event(event)
            events_sent += 1
        
        def on_key_press(key):
            nonlocal events_sent
            event = {
                'user_id': agent.user_id,
                'event_id': f"key_{int(time.time() * 1000)}",
                'timestamp': datetime.utcnow().isoformat(),
                'type': 'key_press',
                'meta': {'key': str(key)}
            }
            agent.ingest_event(event)
            events_sent += 1
        
        # Start listeners
        mouse_listener = mouse.Listener(on_move=on_mouse_move)
        keyboard_listener = keyboard.Listener(on_press=on_key_press)
        
        mouse_listener.start()
        keyboard_listener.start()
        
        # Display stats
        with Live(console=console, refresh_per_second=1) as live:
            while True:
                elapsed = int(time.time() - start_time)
                cpu_percent = psutil.cpu_percent()
                memory_percent = psutil.virtual_memory().percent
                
                layout = Layout()
                layout.split_column(
                    Layout(name="header", size=3),
                    Layout(name="stats", size=8),
                    Layout(name="footer", size=3)
                )
                
                layout["header"].update(Panel("🧠 SILENT KILLER - Real-time Monitoring"))
                layout["stats"].update(
                    Panel(
                        f"⏱️  Uptime: {elapsed}s\n"
                        f"📊 Events Captured: {events_sent}\n"
                        f"💻 CPU Usage: {cpu_percent:.1f}%\n"
                        f"🧠 Memory Usage: {memory_percent:.1f}%\n"
                        f"🎯 Capture Rate: {events_sent / max(1, elapsed):.1f} events/sec",
                        title="System Activity"
                    )
                )
                layout["footer"].update(Panel("Press Ctrl+C to stop monitoring"))
                
                live.update(layout)
                time.sleep(1)
                
    except KeyboardInterrupt:
        console.print("\n🛑 [yellow]Monitoring stopped by user[/yellow]")
    except ImportError:
        console.print("[red]Missing dependencies for monitoring. Install with: pip install pynput psutil[/red]")

if __name__ == '__main__':
    cli()
