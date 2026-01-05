"""
System Context Tools for Ambient Intelligence
Gathers real-time system information without interrupting user
"""

import psutil
import subprocess
import json
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def get_system_context() -> Dict[str, Any]:
    """
    Gather comprehensive system context without user interaction
    """
    try:
        context = {
            "timestamp": datetime.now().isoformat(),
            "system": {
                "cpu_usage": psutil.cpu_percent(interval=1),
                "memory_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "network_activity": get_network_activity(),
                "running_processes": get_running_processes(),
                "active_windows": get_active_windows(),
                "browser_tabs": get_browser_tabs(),
                "recent_files": get_recent_files(),
                "notifications": get_notifications(),
                "calendar_events": get_calendar_events(),
                "communication_activity": get_communication_activity()
            }
        }
        
        return context
    except Exception as e:
        logger.error(f"Error getting system context: {e}")
        return {"error": str(e)}

def get_network_activity() -> Dict[str, Any]:
    """Get network activity information"""
    try:
        net_io = psutil.net_io_counters()
        return {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv
        }
    except:
        return {}

def get_running_processes() -> List[Dict[str, Any]]:
    """Get list of running processes with relevant info"""
    processes = []
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processes.append({
                    "pid": proc.info['pid'],
                    "name": proc.info['name'],
                    "cpu": proc.info['cpu_percent'],
                    "memory": proc.info['memory_percent']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    except:
        pass
    
    # Return top processes by CPU usage
    return sorted(processes, key=lambda x: x['cpu'], reverse=True)[:20]

def get_active_windows() -> List[Dict[str, Any]]:
    """Get information about active windows"""
    windows = []
    try:
        if psutil.WINDOWS:
            import win32gui
            import win32process
            
            def window_callback(hwnd, windows_list):
                if win32gui.IsWindowVisible(hwnd):
                    _, pid = win32process.GetWindowThreadProcessId(hwnd)
                    try:
                        process = psutil.Process(pid)
                        windows_list.append({
                            "title": win32gui.GetWindowText(hwnd),
                            "process": process.name(),
                            "pid": pid,
                            "active": win32gui.GetForegroundWindow() == hwnd
                        })
                    except:
                        pass
            
            win32gui.EnumWindows(window_callback, windows)
        elif psutil.MACOS or psutil.LINUX:
            # Implement for macOS/Linux using appropriate system calls
            pass
    except:
        pass
    
    return windows

def get_browser_tabs() -> List[Dict[str, Any]]:
    """Get browser tabs information (requires browser extensions)"""
    # This would require browser extensions to expose tab information
    # For now, return placeholder
    return [
        {
            "browser": "chrome",
            "tabs": [
                {"title": "Example Tab", "url": "https://example.com", "active": True}
            ]
        }
    ]

def get_recent_files() -> List[Dict[str, Any]]:
    """Get recently accessed files"""
    recent_files = []
    try:
        if psutil.WINDOWS:
            # Use Windows shell to get recent documents
            import win32com.client
            shell = win32com.client.Dispatch("WScript.Shell")
            recent_docs = shell.SpecialFolders("Recent")
            
            import os
            for file in os.listdir(recent_docs)[:20]:
                file_path = os.path.join(recent_docs, file)
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    recent_files.append({
                        "name": file,
                        "path": file_path,
                        "last_accessed": stat.st_atime,
                        "size": stat.st_size
                    })
        elif psutil.MACOS:
            # Use macOS recent documents
            pass
        elif psutil.LINUX:
            # Use Linux recent documents
            pass
    except:
        pass
    
    return sorted(recent_files, key=lambda x: x['last_accessed'], reverse=True)

def get_notifications() -> List[Dict[str, Any]]:
    """Get system notifications"""
    # This would require OS-specific notification access
    return [
        {
            "app": "Slack",
            "title": "New message",
            "body": "John: Hey, can you review this?",
            "timestamp": datetime.now().isoformat(),
            "priority": "medium"
        }
    ]

def get_calendar_events() -> List[Dict[str, Any]]:
    """Get upcoming calendar events"""
    # This would integrate with calendar APIs
    return [
        {
            "title": "Team Standup",
            "start": datetime.now().isoformat(),
            "duration": 30,
            "type": "meeting"
        }
    ]

def get_communication_activity() -> Dict[str, Any]:
    """Get communication app activity"""
    return {
        "slack_messages": 5,
        "email_count": 12,
        "teams_calls": 2,
        "last_activity": datetime.now().isoformat()
    }

# Context analysis functions
def analyze_context_patterns(context: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze patterns in system context"""
    patterns = {
        "focus_level": calculate_focus_level(context),
        "distraction_sources": identify_distractions(context),
        "productivity_signals": detect_productivity_signals(context),
        "workflow_efficiency": assess_workflow_efficiency(context)
    }
    
    return patterns

def calculate_focus_level(context: Dict[str, Any]) -> float:
    """Calculate current focus level (0-1)"""
    score = 1.0
    
    # Deduct for high process switching
    processes = context.get("running_processes", [])
    if len(processes) > 10:
        score -= 0.2
    
    # Deduct for high network activity (might indicate distractions)
    net = context.get("network_activity", {})
    if net.get("bytes_recv", 0) > 1024 * 1024:  # 1MB
        score -= 0.1
    
    # Deduct for many notifications
    notifications = context.get("notifications", [])
    if len(notifications) > 5:
        score -= 0.2
    
    return max(0, score)

def identify_distractions(context: Dict[str, Any]) -> List[str]:
    """Identify potential distraction sources"""
    distractions = []
    
    # Check for social media apps
    processes = context.get("running_processes", [])
    social_apps = ["chrome", "firefox", "slack", "discord", "telegram"]
    
    for proc in processes:
        if any(app in proc.get("name", "").lower() for app in social_apps):
            distractions.append(proc["name"])
    
    # Check for high notification volume
    notifications = context.get("notifications", [])
    if len(notifications) > 3:
        distractions.append("high_notification_volume")
    
    return distractions

def detect_productivity_signals(context: Dict[str, Any]) -> List[str]:
    """Detect positive productivity signals"""
    signals = []
    
    # Check for development tools
    processes = context.get("running_processes", [])
    dev_tools = ["code", "sublime", "vim", "emacs", "intellij", "pycharm"]
    
    for proc in processes:
        if any(tool in proc.get("name", "").lower() for tool in dev_tools):
            signals.append("development_active")
            break
    
    # Check for low system load (focused work)
    cpu = context.get("system", {}).get("cpu_usage", 0)
    if cpu < 50:
        signals.append("low_system_load")
    
    return signals

def assess_workflow_efficiency(context: Dict[str, Any]) -> float:
    """Assess workflow efficiency (0-1)"""
    efficiency = 0.5  # Base score
    
    # Increase for focused work
    focus = calculate_focus_level(context)
    efficiency += focus * 0.3
    
    # Increase for productivity signals
    signals = detect_productivity_signals(context)
    efficiency += len(signals) * 0.1
    
    # Decrease for distractions
    distractions = identify_distractions(context)
    efficiency -= len(distractions) * 0.1
    
    return min(1.0, max(0, efficiency))
