"""
Advanced AI Agent using LangChain for context-aware productivity analysis
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langchain_core.messages import HumanMessage, AIMessage

from ..core.store import store
from ..api.ingest import normalize_event

# System prompt for productivity analysis
SYSTEM_PROMPT = """
You are SILENT KILLER, an AI productivity assistant that analyzes user behavior patterns 
to provide intelligent, context-aware suggestions. You have access to real-time user activity 
data and can analyze patterns to help users improve their productivity.

Key capabilities:
- Analyze work patterns and identify productivity blockers
- Provide personalized suggestions based on user context
- Understand the difference between deep work and distractions
- Help users optimize their work environment and habits

Always provide actionable, specific advice. Consider the user's current context, 
recent activities, and long-term goals when making suggestions.
"""

class SilentKillerLangChainAgent:
    """Advanced AI agent for productivity analysis using LangChain"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1,
            api_key=api_key or os.getenv("OPENAI_API_KEY")
        )
        self.memory = ConversationBufferWindowMemory(k=10, return_messages=True)
        self.tools = self._create_tools()
        self.agent = self._create_agent()
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=3
        )
    
    def _create_tools(self) -> List:
        """Create tools for the agent to use"""
        
        @tool
        def get_user_events(user_id: str, limit: int = 50) -> str:
            """Get recent events for a user to analyze their activity patterns"""
            try:
                events = store.get_events(user_id, None)
                events = events[:limit]
                
                # Format events for analysis
                formatted_events = []
                for event in events:
                    formatted_events.append({
                        "timestamp": event.get("timestamp"),
                        "type": event.get("type"),
                        "app": event.get("meta", {}).get("app", "Unknown"),
                        "details": event.get("meta", {}).get("details", "")
                    })
                
                return json.dumps(formatted_events, indent=2)
            except Exception as e:
                return f"Error retrieving events: {str(e)}"
        
        @tool
        def get_user_stats(user_id: str) -> str:
            """Get user statistics including event counts and patterns"""
            try:
                events = store.get_events(user_id, None)
                
                # Calculate basic stats
                total_events = len(events)
                app_counts = {}
                event_types = {}
                
                for event in events:
                    app = event.get("meta", {}).get("app", "Unknown")
                    event_type = event.get("type", "unknown")
                    
                    app_counts[app] = app_counts.get(app, 0) + 1
                    event_types[event_type] = event_types.get(event_type, 0) + 1
                
                # Get most recent activity
                recent_events = events[:5]
                
                stats = {
                    "total_events": total_events,
                    "unique_apps": len(app_counts),
                    "top_apps": sorted(app_counts.items(), key=lambda x: x[1], reverse=True)[:5],
                    "event_types": event_types,
                    "recent_activity": [
                        {
                            "timestamp": e.get("timestamp"),
                            "type": e.get("type"),
                            "app": e.get("meta", {}).get("app", "Unknown")
                        }
                        for e in recent_events
                    ]
                }
                
                return json.dumps(stats, indent=2)
            except Exception as e:
                return f"Error retrieving stats: {str(e)}"
        
        @tool
        def analyze_productivity_pattern(user_id: str) -> str:
            """Analyze user's productivity patterns and identify insights"""
            try:
                events = store.get_events(user_id, None)
                
                # Simple pattern analysis
                insights = []
                
                # Check for context switching
                app_switches = 0
                prev_app = None
                for event in events:
                    current_app = event.get("meta", {}).get("app", "Unknown")
                    if prev_app and current_app != prev_app:
                        app_switches += 1
                    prev_app = current_app
                
                if app_switches > 20:
                    insights.append("High context switching detected - consider batching similar tasks")
                
                # Check for deep work periods
                focus_events = [e for e in events if "focus" in e.get("type", "").lower()]
                if len(focus_events) < 5:
                    insights.append("Limited deep work sessions detected - schedule focus time")
                
                # Check for break patterns
                last_hour_events = [
                    e for e in events 
                    if datetime.fromisoformat(e.get("timestamp")).hour == datetime.now().hour
                ]
                
                if len(last_hour_events) > 60:
                    insights.append("High activity detected - consider taking a break")
                
                return json.dumps({
                    "insights": insights,
                    "context_switches": app_switches,
                    "focus_events": len(focus_events),
                    "recent_activity": len(last_hour_events)
                }, indent=2)
            except Exception as e:
                return f"Error analyzing patterns: {str(e)}"
        
        return [get_user_events, get_user_stats, analyze_productivity_pattern]
    
    def _create_agent(self):
        """Create the LangChain agent with tools"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        return create_openai_tools_agent(self.llm, self.tools, prompt)
    
    async def analyze_user(self, user_id: str, query: str = "Analyze my productivity and provide suggestions") -> Dict[str, Any]:
        """Analyze user's productivity and provide intelligent suggestions"""
        try:
            # Prepare the input with user context
            full_query = f"""
            User ID: {user_id}
            Current time: {datetime.now().isoformat()}
            
            {query}
            
            Please analyze the user's activity patterns and provide:
            1. Key productivity insights
            2. Specific, actionable suggestions
            3. Potential productivity blockers
            4. Recommendations for improvement
            """
            
            result = await self.executor.ainvoke({"input": full_query})
            
            return {
                "success": True,
                "analysis": result.get("output", ""),
                "intermediate_steps": result.get("intermediate_steps", []),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def chat(self, user_id: str, message: str) -> Dict[str, Any]:
        """Chat with the AI agent about productivity"""
        try:
            full_message = f"""
            User ID: {user_id}
            Context: Productivity analysis conversation
            Current time: {datetime.now().isoformat()}
            
            User message: {message}
            """
            
            result = await self.executor.ainvoke({"input": full_message})
            
            return {
                "success": True,
                "response": result.get("output", ""),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def clear_memory(self):
        """Clear the agent's conversation memory"""
        self.memory.clear()

# Global agent instance
_agent_instance = None

def get_agent(api_key: Optional[str] = None) -> SilentKillerLangChainAgent:
    """Get or create the agent instance"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = SilentKillerLangChainAgent(api_key)
    return _agent_instance
