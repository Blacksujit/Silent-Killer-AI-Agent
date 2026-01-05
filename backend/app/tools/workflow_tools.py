"""
Workflow Analysis Tools for Ambient Intelligence
Analyzes user workflows to detect inefficiencies and suggest improvements
"""

import json
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class WorkflowAnalyzer:
    """Analyzes user workflows for inefficiencies and optimization opportunities"""
    
    def __init__(self):
        self.workflow_patterns = {}
        self.inefficiency_thresholds = {
            "context_switches_per_hour": 15,
            "meeting_hours_per_day": 4,
            "notification_volume": 10,
            "task_switching_cost": 23  # minutes
        }
    
    async def analyze_workflow(self, user_id: str, events: List[Dict], context: Dict) -> Dict[str, Any]:
        """
        Comprehensive workflow analysis
        """
        try:
            analysis = {
                "inefficiencies": await self.detect_inefficiencies(events, context),
                "patterns": await self.identify_patterns(events, context),
                "optimizations": await self.suggest_optimizations(events, context),
                "productivity_score": self.calculate_productivity_score(events, context),
                "recommendations": await self.generate_recommendations(events, context),
                "timestamp": datetime.now().isoformat()
            }
            
            # Store learned patterns
            await self.store_workflow_patterns(user_id, analysis["patterns"])
            
            return analysis
        except Exception as e:
            logger.error(f"Error analyzing workflow: {e}")
            return {"error": str(e)}
    
    async def detect_inefficiencies(self, events: List[Dict], context: Dict) -> List[Dict[str, Any]]:
        """Detect workflow inefficiencies"""
        inefficiencies = []
        
        # Detect excessive context switching
        context_switches = self.count_context_switches(events)
        if context_switches > self.inefficiency_thresholds["context_switches_per_hour"]:
            inefficiencies.append({
                "type": "excessive_context_switching",
                "severity": "high",
                "value": context_switches,
                "threshold": self.inefficiency_thresholds["context_switches_per_hour"],
                "impact": f"Costing ~{context_switches * self.inefficiency_thresholds['task_switching_cost']} minutes/day",
                "auto_fix": "group_similar_tasks"
            })
        
        # Detect meeting overload
        meeting_time = self.calculate_meeting_time(events, context)
        if meeting_time > self.inefficiency_thresholds["meeting_hours_per_day"] * 60:
            inefficiencies.append({
                "type": "meeting_overload",
                "severity": "medium",
                "value": meeting_time / 60,
                "threshold": self.inefficiency_thresholds["meeting_hours_per_day"],
                "impact": f"Exceeds optimal meeting time by {meeting_time/60 - self.inefficiency_thresholds['meeting_hours_per_day']} hours",
                "auto_fix": "optimize_meeting_schedule"
            })
        
        # Detect notification overload
        notifications = context.get("system", {}).get("notifications", [])
        if len(notifications) > self.inefficiency_thresholds["notification_volume"]:
            inefficiencies.append({
                "type": "notification_overload",
                "severity": "medium",
                "value": len(notifications),
                "threshold": self.inefficiency_thresholds["notification_volume"],
                "impact": "High interruption frequency reduces deep work",
                "auto_fix": "enable_focus_mode"
            })
        
        # Detect tool switching inefficiency
        tool_switches = self.count_tool_switches(events)
        if tool_switches > 20:
            inefficiencies.append({
                "type": "tool_switching_inefficiency",
                "severity": "medium",
                "value": tool_switches,
                "impact": "Frequent tool switching indicates workflow fragmentation",
                "auto_fix": "organize_workspace"
            })
        
        # Detect energy depletion patterns
        if self.detect_energy_depletion(events):
            inefficiencies.append({
                "type": "energy_depletion",
                "severity": "high",
                "impact": "Productivity declining due to fatigue",
                "auto_fix": "schedule_break"
            })
        
        return inefficiencies
    
    async def identify_patterns(self, events: List[Dict], context: Dict) -> Dict[str, Any]:
        """Identify recurring patterns in user behavior"""
        patterns = {
            "work_sessions": self.identify_work_sessions(events),
            "focus_periods": self.identify_focus_periods(events),
            "interruption_patterns": self.identify_interruption_patterns(events),
            "productivity_rhythms": self.identify_productivity_rhythms(events),
            "tool_preferences": self.identify_tool_preferences(events),
            "time_based_patterns": self.identify_time_based_patterns(events)
        }
        
        return patterns
    
    async def suggest_optimizations(self, events: List[Dict], context: Dict) -> List[Dict[str, Any]]:
        """Suggest specific workflow optimizations"""
        optimizations = []
        
        # Analyze work patterns for optimization opportunities
        work_sessions = self.identify_work_sessions(events)
        
        # Suggest deep work blocks
        if work_sessions:
            avg_session_length = sum(s["duration"] for s in work_sessions) / len(work_sessions)
            if avg_session_length < 60:  # Less than 1 hour
                optimizations.append({
                    "type": "deep_work_blocks",
                    "priority": "high",
                    "description": "Schedule 90-minute deep work blocks",
                    "expected_benefit": "40% increase in focused productivity",
                    "auto_implementable": True
                })
        
        # Suggest notification batching
        notifications = context.get("system", {}).get("notifications", [])
        if notifications:
            optimization = {
                "type": "notification_batching",
                "priority": "medium",
                "description": "Batch notifications to check every 30 minutes",
                "expected_benefit": "Reduce interruptions by 60%",
                "auto_implementable": True
            }
            optimizations.append(optimization)
        
        # Suggest task batching
        context_switches = self.count_context_switches(events)
        if context_switches > 10:
            optimizations.append({
                "type": "task_batching",
                "priority": "high",
                "description": "Group similar tasks to reduce context switching",
                "expected_benefit": "Save ~20 minutes per hour",
                "auto_implementable": False
            })
        
        # Suggest meeting optimization
        meeting_time = self.calculate_meeting_time(events, context)
        if meeting_time > 120:  # More than 2 hours
            optimizations.append({
                "type": "meeting_optimization",
                "priority": "medium",
                "description": "Implement meeting-free blocks and clear agendas",
                "expected_benefit": "Recover 5-10 hours per week",
                "auto_implementable": False
            })
        
        return optimizations
    
    def calculate_productivity_score(self, events: List[Dict], context: Dict) -> float:
        """Calculate overall productivity score (0-100)"""
        score = 50  # Base score
        
        # Adjust for focus time
        focus_periods = self.identify_focus_periods(events)
        total_focus_time = sum(p["duration"] for p in focus_periods)
        if total_focus_time > 240:  # More than 4 hours
            score += 20
        
        # Adjust for inefficiencies
        inefficiencies = [
            self.count_context_switches(events),
            len(context.get("system", {}).get("notifications", [])),
            self.count_tool_switches(events)
        ]
        
        for inefficiency in inefficiencies:
            if inefficiency > 10:
                score -= 10
        
        # Adjust for work session quality
        work_sessions = self.identify_work_sessions(events)
        if work_sessions:
            avg_quality = sum(s.get("quality", 0.5) for s in work_sessions) / len(work_sessions)
            score += avg_quality * 20
        
        return max(0, min(100, score))
    
    async def generate_recommendations(self, events: List[Dict], context: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Analyze current state
        context_switches = self.count_context_switches(events)
        notifications = len(context.get("system", {}).get("notifications", []))
        
        # Generate specific recommendations
        if context_switches > 15:
            recommendations.append("🎯 Use time-blocking to group similar tasks and reduce context switching")
        
        if notifications > 8:
            recommendations.append("🔕 Enable 'Do Not Disturb' during focus hours and batch notifications")
        
        # Check for meeting patterns
        meeting_time = self.calculate_meeting_time(events, context)
        if meeting_time > 180:
            recommendations.append("📅 Implement 'No-Meting Wednesdays' to protect deep work time")
        
        # Check energy patterns
        if self.detect_energy_depletion(events):
            recommendations.append("⚡ Take strategic breaks every 90 minutes to maintain energy")
        
        # Check tool usage
        tool_switches = self.count_tool_switches(events)
        if tool_switches > 25:
            recommendations.append("🛠️ Organize your digital workspace to minimize tool switching")
        
        return recommendations
    
    # Helper methods
    def count_context_switches(self, events: List[Dict]) -> int:
        """Count context switches in events"""
        switches = 0
        last_app = None
        
        for event in events:
            current_app = event.get("meta", {}).get("app", "")
            if last_app and current_app != last_app:
                switches += 1
            last_app = current_app
        
        return switches
    
    def count_tool_switches(self, events: List[Dict]) -> int:
        """Count tool/application switches"""
        tools = set()
        switches = 0
        last_tool = None
        
        for event in events:
            tool = event.get("meta", {}).get("app", "")
            if tool not in tools:
                tools.add(tool)
                if last_tool:
                    switches += 1
                last_tool = tool
        
        return switches
    
    def calculate_meeting_time(self, events: List[Dict], context: Dict) -> int:
        """Calculate total meeting time in minutes"""
        meeting_time = 0
        
        # Check events for meeting indicators
        for event in events:
            if "meeting" in event.get("type", "").lower():
                meeting_time += 30  # Assume 30 minutes per meeting
        
        # Check calendar events
        calendar_events = context.get("system", {}).get("calendar_events", [])
        for event in calendar_events:
            meeting_time += event.get("duration", 30)
        
        return meeting_time
    
    def detect_energy_depletion(self, events: List[Dict]) -> bool:
        """Detect signs of energy depletion"""
        # Simple heuristic: decreasing activity over time
        if len(events) < 10:
            return False
        
        # Compare first half with second half
        mid = len(events) // 2
        first_half_activity = len(events[:mid])
        second_half_activity = len(events[mid:])
        
        return second_half_activity < first_half_activity * 0.7
    
    def identify_work_sessions(self, events: List[Dict]) -> List[Dict[str, Any]]:
        """Identify distinct work sessions"""
        sessions = []
        
        if not events:
            return sessions
        
        current_session = None
        
        for event in events:
            timestamp = datetime.fromisoformat(event.get("timestamp"))
            
            if not current_session:
                current_session = {
                    "start": timestamp,
                    "end": timestamp,
                    "events": [event],
                    "duration": 0,
                    "quality": 0.5
                }
            else:
                # Check if this continues the session (within 30 minutes)
                time_diff = (timestamp - current_session["end"]).total_seconds() / 60
                if time_diff < 30:
                    current_session["end"] = timestamp
                    current_session["events"].append(event)
                else:
                    # Close current session
                    current_session["duration"] = (current_session["end"] - current_session["start"]).total_seconds() / 60
                    sessions.append(current_session)
                    current_session = {
                        "start": timestamp,
                        "end": timestamp,
                        "events": [event],
                        "duration": 0,
                        "quality": 0.5
                    }
        
        # Close last session
        if current_session:
            current_session["duration"] = (current_session["end"] - current_session["start"]).total_seconds() / 60
            sessions.append(current_session)
        
        return sessions
    
    def identify_focus_periods(self, events: List[Dict]) -> List[Dict[str, Any]]:
        """Identify periods of high focus"""
        focus_periods = []
        
        work_sessions = self.identify_work_sessions(events)
        
        for session in work_sessions:
            # Calculate focus quality based on interruptions
            interruptions = 0
            for event in session["events"]:
                if "notification" in event.get("type", "").lower():
                    interruptions += 1
            
            focus_score = max(0, 1 - (interruptions / len(session["events"])))
            
            if focus_score > 0.7:  # High focus
                focus_periods.append({
                    "start": session["start"],
                    "end": session["end"],
                    "duration": session["duration"],
                    "focus_score": focus_score,
                    "interruptions": interruptions
                })
        
        return focus_periods
    
    def identify_interruption_patterns(self, events: List[Dict]) -> Dict[str, Any]:
        """Identify patterns in interruptions"""
        interruptions = [e for e in events if "notification" in e.get("type", "").lower()]
        
        if not interruptions:
            return {"pattern": "low_interruption", "frequency": 0}
        
        # Calculate interruption frequency
        time_span = (datetime.fromisoformat(events[-1]["timestamp"]) - 
                     datetime.fromisoformat(events[0]["timestamp"])).total_seconds() / 3600
        frequency = len(interruptions) / max(time_span, 1)
        
        if frequency > 10:
            return {"pattern": "high_interruption", "frequency": frequency}
        elif frequency > 5:
            return {"pattern": "moderate_interruption", "frequency": frequency}
        else:
            return {"pattern": "low_interruption", "frequency": frequency}
    
    def identify_productivity_rhythms(self, events: List[Dict]) -> Dict[str, Any]:
        """Identify productivity rhythms throughout the day"""
        hourly_activity = {}
        
        for event in events:
            hour = datetime.fromisoformat(event["timestamp"]).hour
            hourly_activity[hour] = hourly_activity.get(hour, 0) + 1
        
        if not hourly_activity:
            return {"pattern": "no_data"}
        
        # Find peak hours
        peak_hours = sorted(hourly_activity.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            "pattern": "daily_rhythm",
            "peak_hours": peak_hours,
            "hourly_activity": hourly_activity
        }
    
    def identify_tool_preferences(self, events: List[Dict]) -> Dict[str, int]:
        """Identify most used tools"""
        tool_usage = {}
        
        for event in events:
            tool = event.get("meta", {}).get("app", "unknown")
            tool_usage[tool] = tool_usage.get(tool, 0) + 1
        
        return tool_usage
    
    def identify_time_based_patterns(self, events: List[Dict]) -> Dict[str, Any]:
        """Identify patterns based on time of day"""
        patterns = {
            "morning_productivity": 0,
            "afternoon_productivity": 0,
            "evening_productivity": 0
        }
        
        for event in events:
            hour = datetime.fromisoformat(event["timestamp"]).hour
            
            if 6 <= hour < 12:
                patterns["morning_productivity"] += 1
            elif 12 <= hour < 18:
                patterns["afternoon_productivity"] += 1
            else:
                patterns["evening_productivity"] += 1
        
        return patterns
    
    async def store_workflow_patterns(self, user_id: str, patterns: Dict[str, Any]):
        """Store learned workflow patterns"""
        # This would integrate with a persistent store
        logger.info(f"Storing workflow patterns for {user_id}")

# Tool functions for LangChain
async def analyze_workflow(events: List[Dict], context: Dict[str, Any]) -> str:
    """Analyze workflow - LangChain tool function"""
    analyzer = WorkflowAnalyzer()
    result = await analyzer.analyze_workflow("default_user", events, context)
    return json.dumps(result, indent=2)

async def detect_inefficiencies(events: List[Dict], context: Dict[str, Any]) -> str:
    """Detect inefficiencies - LangChain tool function"""
    analyzer = WorkflowAnalyzer()
    inefficiencies = await analyzer.detect_inefficiencies(events, context)
    return json.dumps(inefficiencies, indent=2)

async def suggest_optimizations(events: List[Dict], context: Dict[str, Any]) -> str:
    """Suggest optimizations - LangChain tool function"""
    analyzer = WorkflowAnalyzer()
    optimizations = await analyzer.suggest_optimizations(events, context)
    return json.dumps(optimizations, indent=2)
