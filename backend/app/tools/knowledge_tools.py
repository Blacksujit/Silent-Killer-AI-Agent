"""
Knowledge Base Tools for Ambient Intelligence
Provides contextual knowledge about productivity, workflows, and best practices
"""

import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ProductivityKnowledgeBase:
    """Knowledge base for productivity patterns and best practices"""
    
    def __init__(self):
        self.knowledge = self._load_knowledge_base()
        self.user_patterns = {}  # user_id -> learned patterns
    
    def _load_knowledge_base(self) -> Dict[str, Any]:
        """Load productivity knowledge base"""
        return {
            "work_patterns": {
                "deep_work": {
                    "optimal_duration": 90,  # minutes
                    "break_interval": 15,
                    "best_times": ["morning", "late_night"],
                    "indicators": ["single_app_focus", "low_notifications", "minimal_context_switching"]
                },
                "context_switching": {
                    "cost_per_switch": 23,  # minutes
                    "threshold": 10,  # switches per hour
                    "mitigation": ["batch_similar_tasks", "time_blocking", "notification_management"]
                },
                "meeting_efficiency": {
                    "optimal_daily": 3,  # meetings
                    "max_duration": 45,  # minutes
                    "prep_time": 5,  # minutes
                    "follow_up_time": 10
                }
            },
            "productivity_signals": {
                "high_focus": {
                    "indicators": ["single_window_active", "low_process_count", "minimal_notifications"],
                    "suggested_actions": ["maintain_environment", "block_distractions", "schedule_break"]
                },
                "distraction_detected": {
                    "indicators": ["high_process_switching", "social_media_active", "high_notification_volume"],
                    "suggested_actions": ["close_unnecessary_apps", "enable_focus_mode", "schedule_deep_work"]
                },
                "fatigue_detected": {
                    "indicators": ["repeated_errors", "decreased_typing_speed", "increased_break_frequency"],
                    "suggested_actions": ["take_break", "hydrate", "switch_task", "end_work_session"]
                }
            },
            "workflow_optimizations": {
                "development": {
                    "common_inefficiencies": ["context_switching", "interruptions", "tool_switching"],
                    "optimizations": ["ide_automation", "snippet_management", "debugging_techniques"],
                    "tools": ["git_automation", "test_automation", "documentation_generation"]
                },
                "communication": {
                    "batch_processing": "process_messages_in_batches",
                    "async_first": "prefer_async_communication",
                    "meeting_optimization": "clear_agendas_timeboxed"
                },
                "task_management": {
                    "prioritization": "eisenhower_matrix",
                    "time_estimation": "historical_data_based",
                    "breakdown": "large_tasks_to_small_chunks"
                }
            },
            "best_practices": {
                "morning_routine": ["review_priorities", "plan_deep_work", "minimize_morning_meetings"],
                "energy_management": ["ultradian_rhythms", "strategic_breaks", "hydration_reminders"],
                "digital_hygiene": ["notification_management", "app_organization", "file_system_structure"]
            }
        }
    
    async def query_knowledge(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Query knowledge base with context
        """
        try:
            # Analyze the query and context
            query_type = self._classify_query(query, context)
            
            # Retrieve relevant knowledge
            relevant_knowledge = self._retrieve_relevant_knowledge(query_type, context)
            
            # Generate contextual advice
            advice = self._generate_contextual_advice(relevant_knowledge, context)
            
            return {
                "query_type": query_type,
                "knowledge": relevant_knowledge,
                "advice": advice,
                "confidence": self._calculate_confidence(relevant_knowledge, context),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error querying knowledge base: {e}")
            return {"error": str(e)}
    
    def _classify_query(self, query: str, context: Dict[str, Any]) -> str:
        """Classify the type of query/request"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["focus", "concentrate", "deep work"]):
            return "focus_optimization"
        elif any(word in query_lower for word in ["distraction", "interrupt", "noise"]):
            return "distraction_management"
        elif any(word in query_lower for word in ["meeting", "call", "collaboration"]):
            return "meeting_optimization"
        elif any(word in query_lower for word in ["workflow", "process", "efficiency"]):
            return "workflow_optimization"
        elif any(word in query_lower for word in ["energy", "fatigue", "break"]):
            return "energy_management"
        else:
            return "general_productivity"
    
    def _retrieve_relevant_knowledge(self, query_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve knowledge relevant to the query type and context"""
        base_knowledge = self.knowledge
        
        # Get base knowledge for query type
        if query_type == "focus_optimization":
            relevant = {
                "work_patterns": base_knowledge["work_patterns"]["deep_work"],
                "productivity_signals": base_knowledge["productivity_signals"]["high_focus"]
            }
        elif query_type == "distraction_management":
            relevant = {
                "work_patterns": base_knowledge["work_patterns"]["context_switching"],
                "productivity_signals": base_knowledge["productivity_signals"]["distraction_detected"]
            }
        elif query_type == "meeting_optimization":
            relevant = {
                "work_patterns": base_knowledge["work_patterns"]["meeting_efficiency"],
                "workflow_optimizations": base_knowledge["workflow_optimizations"]["communication"]
            }
        elif query_type == "workflow_optimization":
            relevant = {
                "workflow_optimizations": base_knowledge["workflow_optimizations"],
                "best_practices": base_knowledge["best_practices"]
            }
        elif query_type == "energy_management":
            relevant = {
                "best_practices": base_knowledge["best_practices"]["energy_management"]
            }
        else:
            relevant = base_knowledge
        
        # Add user-specific learned patterns
        user_id = context.get("user_id")
        if user_id and user_id in self.user_patterns:
            relevant["user_patterns"] = self.user_patterns[user_id]
        
        return relevant
    
    def _generate_contextual_advice(self, knowledge: Dict[str, Any], context: Dict[str, Any]) -> List[str]:
        """Generate contextual advice based on knowledge and current context"""
        advice = []
        
        # Analyze current state from context
        system_state = context.get("system", {})
        active_windows = system_state.get("active_windows", [])
        notifications = system_state.get("notifications", [])
        processes = system_state.get("running_processes", [])
        
        # Generate advice based on patterns
        if len(active_windows) > 5:
            advice.append("Consider closing unused windows to reduce cognitive load")
        
        if len(notifications) > 3:
            advice.append("High notification volume detected - enable focus mode")
        
        # Check for specific apps
        process_names = [p.get("name", "").lower() for p in processes]
        
        if any("slack" in name or "teams" in name for name in process_names):
            advice.append("Communication apps active - consider batching message checks")
        
        if any("chrome" in name or "firefox" in name for name in process_names):
            advice.append("Browser detected - limit tabs to essential ones for focus")
        
        # Add knowledge-based advice
        work_patterns = knowledge.get("work_patterns", {})
        
        if "deep_work" in work_patterns:
            optimal_duration = work_patterns["deep_work"].get("optimal_duration", 90)
            advice.append(f"Optimal deep work sessions are {optimal_duration} minutes")
        
        if "context_switching" in work_patterns:
            switch_cost = work_patterns["context_switching"].get("cost_per_switch", 23)
            advice.append(f"Each context switch costs ~{switch_cost} minutes of productivity")
        
        return advice
    
    def _calculate_confidence(self, knowledge: Dict[str, Any], context: Dict[str, Any]) -> float:
        """Calculate confidence in the knowledge retrieval"""
        base_confidence = 0.7
        
        # Increase confidence if we have user patterns
        if "user_patterns" in knowledge:
            base_confidence += 0.2
        
        # Increase confidence if context is rich
        if context.get("system") and len(context["system"]) > 5:
            base_confidence += 0.1
        
        return min(1.0, base_confidence)
    
    def learn_user_pattern(self, user_id: str, pattern: Dict[str, Any]):
        """Learn user-specific patterns"""
        if user_id not in self.user_patterns:
            self.user_patterns[user_id] = {}
        
        pattern_type = pattern.get("type", "unknown")
        self.user_patterns[user_id][pattern_type] = {
            "pattern": pattern,
            "learned_at": datetime.now().isoformat(),
            "confidence": pattern.get("confidence", 0.5)
        }
    
    def get_user_patterns(self, user_id: str) -> Dict[str, Any]:
        """Get learned patterns for a user"""
        return self.user_patterns.get(user_id, {})

# Global knowledge base instance
_knowledge_base = None

def get_knowledge_base() -> ProductivityKnowledgeBase:
    """Get or create the knowledge base instance"""
    global _knowledge_base
    if _knowledge_base is None:
        _knowledge_base = ProductivityKnowledgeBase()
    return _knowledge_base

# Tool functions for LangChain
async def query_knowledge_base(query: str, context: Dict[str, Any]) -> str:
    """Query the knowledge base - LangChain tool function"""
    kb = get_knowledge_base()
    result = await kb.query_knowledge(query, context)
    return json.dumps(result, indent=2)

async def learn_user_pattern(user_id: str, pattern: Dict[str, Any]) -> str:
    """Learn a user pattern - LangChain tool function"""
    kb = get_knowledge_base()
    kb.learn_user_pattern(user_id, pattern)
    return json.dumps({"success": True, "message": "Pattern learned"})

async def get_user_patterns(user_id: str) -> str:
    """Get user patterns - LangChain tool function"""
    kb = get_knowledge_base()
    patterns = kb.get_user_patterns(user_id)
    return json.dumps(patterns, indent=2)
