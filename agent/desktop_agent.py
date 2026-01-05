#!/usr/bin/env python3
"""
SILENT KILLER Desktop Agent
Real-time system monitoring and event capture
"""

import os
import sys
import time
import json
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Callable

import psutil
from pynput import mouse, keyboard
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))
from main import SilentKillerAgent

class ActivityMonitor:
    """Monitors user activity and captures events"""
    
    def __init__(self, agent: SilentKillerAgent):
        self.agent = agent
        self.running = False
        self.mouse_listener = None
        self.keyboard_listener = None
        self.file_observer = None
        self.events_sent = 0
        self.start_time = time.time()
        
        # Activity tracking
        self.last_mouse_time = time.time()
        self.last_key_time = time.time()
        self.idle_threshold = 300  # 5 minutes
        
    def start(self) -> None:
        """Start all monitoring"""
        if self.running:
            return
            
        self.running = True
        print("🧠 Starting SILENT KILLER desktop monitoring...")
        
        # Start input monitoring
        self.start_input_monitoring()
        
        # Start file system monitoring
        self.start_file_monitoring()
        
        # Start system monitoring
        self.start_system_monitoring()
        
        print("✅ All monitoring systems active")
    
    def stop(self) -> None:
        """Stop all monitoring"""
        if not self.running:
            return
            
        self.running = False
        print("🛑 Stopping SILENT KILLER monitoring...")
        
        # Stop listeners
        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()
        if self.file_observer:
            self.file_observer.stop()
        
        print("✅ Monitoring stopped")
    
    def start_input_monitoring(self) -> None:
        """Start mouse and keyboard monitoring"""
        def on_mouse_move(x, y):
            if not self.running:
                return
                
            self.last_mouse_time = time.time()
            self.send_event('mouse_move', {
                'x': x, 'y': y,
                'screen': self.get_screen_info()
            })
        
        def on_mouse_click(x, y, button, pressed):
            if not self.running:
                return
                
            self.last_mouse_time = time.time()
            action = 'press' if pressed else 'release'
            self.send_event('mouse_click', {
                'x': x, 'y': y,
                'button': str(button),
                'action': action
            })
        
        def on_key_press(key):
            if not self.running:
                return
                
            self.last_key_time = time.time()
            self.send_event('key_press', {
                'key': str(key),
                'modifiers': self.get_modifiers(key)
            })
        
        def on_key_release(key):
            if not self.running:
                return
            self.send_event('key_release', {
                'key': str(key)
            })
        
        # Start listeners in separate threads
        self.mouse_listener = mouse.Listener(
            on_move=on_mouse_move,
            on_click=on_mouse_click
        )
        self.keyboard_listener = keyboard.Listener(
            on_press=on_key_press,
            on_release=on_key_release
        )
        
        self.mouse_listener.start()
        self.keyboard_listener.start()
    
    def start_file_monitoring(self) -> None:
        """Start file system monitoring"""
        class FileEventHandler(FileSystemEventHandler):
            def __init__(self, monitor):
                self.monitor = monitor
            
            def on_modified(self, event):
                if not self.monitor.running:
                    return
                if not event.is_directory:
                    self.monitor.send_event('file_modified', {
                        'path': event.src_path,
                        'event_type': 'modified'
                    })
            
            def on_created(self, event):
                if not self.monitor.running:
                    return
                if not event.is_directory:
                    self.monitor.send_event('file_created', {
                        'path': event.src_path,
                        'event_type': 'created'
                    })
        
        # Monitor common directories
        paths_to_watch = [
            str(Path.home() / "Documents"),
            str(Path.home() / "Desktop"),
            str(Path.home() / "Downloads"),
            os.getcwd()  # Current working directory
        ]
        
        self.file_observer = Observer()
        handler = FileEventHandler(self)
        
        for path in paths_to_watch:
            if Path(path).exists():
                self.file_observer.schedule(handler, path, recursive=True)
        
        self.file_observer.start()
    
    def start_system_monitoring(self) -> None:
        """Start system resource monitoring"""
        def monitor_system():
            while self.running:
                try:
                    # Get system stats
                    cpu_percent = psutil.cpu_percent(interval=1)
                    memory = psutil.virtual_memory()
                    disk = psutil.disk_usage('/')
                    
                    # Get active processes
                    processes = []
                    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                        try:
                            processes.append({
                                'pid': proc.info['pid'],
                                'name': proc.info['name'],
                                'cpu': proc.info['cpu_percent']
                            })
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass
                    
                    # Send system event
                    self.send_event('system_stats', {
                        'cpu_percent': cpu_percent,
                        'memory_percent': memory.percent,
                        'memory_available': memory.available,
                        'disk_percent': (disk.used / disk.total) * 100,
                        'active_processes': len(processes),
                        'top_processes': sorted(processes, key=lambda x: x['cpu'], reverse=True)[:5]
                    })
                    
                    # Check for idle state
                    self.check_idle_state()
                    
                except Exception as e:
                    print(f"System monitoring error: {e}")
                
                time.sleep(30)  # Monitor every 30 seconds
        
        # Start in background thread
        system_thread = threading.Thread(target=monitor_system, daemon=True)
        system_thread.start()
    
    def check_idle_state(self) -> None:
        """Check if user is idle and send idle events"""
        current_time = time.time()
        time_since_activity = min(
            current_time - self.last_mouse_time,
            current_time - self.last_key_time
        )
        
        if time_since_activity > self.idle_threshold:
            self.send_event('idle_detected', {
                'idle_duration': int(time_since_activity),
                'threshold': self.idle_threshold
            })
    
    def send_event(self, event_type: str, meta: Dict) -> None:
        """Send event to backend"""
        event = {
            'user_id': self.agent.user_id,
            'event_id': f"desktop_{int(time.time() * 1000)}_{self.events_sent}",
            'timestamp': datetime.utcnow().isoformat(),
            'type': event_type,
            'meta': meta
        }
        
        if self.agent.ingest_event(event):
            self.events_sent += 1
    
    def get_screen_info(self) -> Dict:
        """Get screen resolution info"""
        try:
            import pyautogui
            width, height = pyautogui.size()
            return {'width': width, 'height': height}
        except ImportError:
            return {'width': 1920, 'height': 1080}  # Default fallback
    
    def get_modifiers(self, key) -> List[str]:
        """Get modifier keys pressed"""
        modifiers = []
        try:
            if hasattr(key, 'ctrl') and key.ctrl:
                modifiers.append('ctrl')
            if hasattr(key, 'alt') and key.alt:
                modifiers.append('alt')
            if hasattr(key, 'shift') and key.shift:
                modifiers.append('shift')
        except:
            pass
        return modifiers
    
    def get_stats(self) -> Dict:
        """Get monitoring statistics"""
        elapsed = time.time() - self.start_time
        return {
            'events_sent': self.events_sent,
            'uptime_seconds': elapsed,
            'events_per_second': self.events_sent / max(1, elapsed),
            'monitoring_active': self.running
        }

class DesktopAgent:
    """Main desktop agent application"""
    
    def __init__(self):
        self.agent = SilentKillerAgent()
        self.monitor = ActivityMonitor(self.agent)
        
    def start(self) -> None:
        """Start the desktop agent"""
        print("🧠 SILENT KILLER Desktop Agent")
        print("=" * 50)
        
        # Check backend connection
        if not self.agent.health_check():
            print("❌ Backend API is not available")
            print("Please start the backend server first:")
            print("  uvicorn backend.app.main:app --host 0.0.0.0 --port 8000")
            return
        
        print("✅ Connected to backend API")
        
        # Start monitoring
        self.monitor.start()
        
        try:
            print("\n📊 Monitoring active. Press Ctrl+C to stop.")
            print("📈 Statistics will be displayed every 30 seconds.")
            
            # Display stats periodically
            while True:
                time.sleep(30)
                stats = self.monitor.get_stats()
                print(f"\n📊 Stats: {stats['events_sent']} events | "
                      f"{stats['events_per_second']:.1f} events/sec | "
                      f"Uptime: {int(stats['uptime_seconds'])}s")
                
        except KeyboardInterrupt:
            print("\n🛑 Stopping by user request")
        finally:
            self.monitor.stop()

if __name__ == "__main__":
    agent = DesktopAgent()
    agent.start()
