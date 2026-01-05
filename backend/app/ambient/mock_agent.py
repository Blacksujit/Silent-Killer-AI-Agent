"""
Mock Ambient Intelligence Agent
Works without any external dependencies for immediate testing
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from ..core.store import store

logger = logging.getLogger(__name__)

class MockAmbientAgent:
    """
    Mock ambient intelligence that simulates AI analysis
    Provides realistic insights without requiring external APIs
    """
    
    def __init__(self):
        self.user_states = {}  # user_id -> UserState
        self.insight_templates = {
            "focus_patterns": [
                "High focus detected between 9-11 AM",
                "Energy levels peak in late morning",
                "Minimal distractions during deep work blocks"
            ],
            "inefficiencies": [
                "Excessive context switching reduces productivity",
                "High notification volume breaking focus",
                "Too many applications causing cognitive load",
                "Meeting overload detected"
            ],
            "improvements": [
                "Group similar tasks to reduce context switching",
                "Enable focus mode during deep work",
                "Schedule 90-minute work blocks",
                "Minimize notifications during focus time",
                "Organize workspace to reduce distractions"
            ],
            "productivity_tips": [
                "Take a 5-minute break every 90 minutes",
                "Batch email checks to 3 times per day",
                "Use time-blocking for important tasks",
                "Keep a distraction-free workspace"
            ]
        }
    
    async def observe_user(self, user_id: str, context: Dict[str, Any]):
        """
        Mock observation - simulates AI analysis
        """
        try:
            # Get or create user state
            user_state = self.user_states.get(user_id, self._create_user_state())
            
            # Update context history
            user_state["context_history"].append({
                "timestamp": datetime.now(),
                "data": context
            })
            
            # Keep only last 20 entries
            if len(user_state["context_history"]) > 20:
                user_state["context_history"] = user_state["context_history"][-20:]
            
            # Generate mock insights
            insights = self._generate_mock_insights(user_id, user_state)
            
            # Store updated state
            self.user_states[user_id] = user_state
            
            return insights
            
        except Exception as e:
            logger.error(f"Error in observe_user for {user_id}: {e}")
            return {"error": str(e)}
    
    def _generate_mock_insights(self, user_id: str, user_state: Dict) -> Dict[str, Any]:
        """
        Generate realistic mock insights based on context
        """
        import random
        
        recent_context = user_state["context_history"][-5:] if user_state["context_history"] else []
        
        # Calculate simple metrics
        context_switches = random.randint(5, 20)
        notification_count = random.randint(0, 8)
        focus_level = max(0.3, min(0.9, 1.0 - (context_switches / 30)))
        
        # Select random insights
        selected_patterns = random.sample(self.insight_templates["focus_patterns"], 2)
        selected_inefficiencies = random.sample(self.insight_templates["inefficiencies"], 2)
        selected_improvements = random.sample(self.insight_templates["improvements"], 3)
        
        # Calculate ambient score
        ambient_score = min(1.0, focus_level + (0.2 if context_switches < 10 else -0.1))
        
        return {
            "metrics": {
                "context_switches": context_switches,
                "notification_count": notification_count,
                "focus_level": focus_level,
                "data_points": len(recent_context)
            },
            "inefficiencies": [
                {
                    "type": "excessive_context_switching" if context_switches > 15 else "moderate_context_switching",
                    "severity": "high" if context_switches > 15 else "medium",
                    "description": f"Context switching detected ({context_switches} switches)",
                    "impact": "Reduces deep work and productivity",
                    "auto_fix": "group_similar_tasks"
                }
            ] + ([{
                "type": "notification_overload",
                "severity": "medium",
                "description": f"High notification volume ({notification_count} notifications)",
                "impact": "Frequent interruptions break focus",
                "auto_fix": "enable_focus_mode"
            }] if notification_count > 5 else []),
            "improvements": [
                {
                    "action": "schedule_focus_blocks",
                    "description": "Schedule 90-minute deep work blocks",
                    "priority": "high",
                    "auto_execute": False
                },
                {
                    "action": "group_similar_tasks",
                    "description": "Group similar tasks to reduce context switching",
                    "priority": "high",
                    "auto_execute": True
                }
            ] + ([{
                "action": "enable_focus_mode",
                "description": "Enable focus mode to minimize notifications",
                "priority": "medium",
                "auto_execute": True
            }] if notification_count > 5 else []),
            "patterns": selected_patterns,
            "ambient_score": ambient_score,
            "productivity_tips": random.sample(self.insight_templates["productivity_tips"], 2),
            "timestamp": datetime.now().isoformat()
        }
    
    def _create_user_state(self) -> Dict:
        """Create initial user state"""
        return {
            "context_history": [],
            "learned_patterns": [],
            "last_improvements": [],
            "ambient_score": 0.0
        }
    
    def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """Get current insights for a user"""
        user_state = self.user_states.get(user_id, {})
        
        if not user_state:
            return {
                "learned_patterns": [],
                "recent_improvements": [],
                "ambient_score": 0.0,
                "message": "No data available"
            }
        
        return {
            "learned_patterns": user_state.get("learned_patterns", []),
            "recent_improvements": user_state.get("last_improvements", []),
            "ambient_score": user_state.get("ambient_score", 0.0),
            "data_points": len(user_state.get("context_history", [])),
            "message": "Ambient intelligence active"
        }

# Global mock agent instance
_mock_agent = None

def get_mock_agent() -> MockAmbientAgent:
    """Get or create mock ambient agent instance"""
    global _mock_agent
    if _mock_agent is None:
        _mock_agent = MockAmbientAgent()
    return _mock_agent
