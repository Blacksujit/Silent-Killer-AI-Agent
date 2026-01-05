"""
Silent Ambient Intelligence Agent
Runs in background, observes user behavior, detects inefficiencies, and improves workflows
WITHOUT prompts or chat interface
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from langchain.agents import AgentExecutor
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain.schema import SystemMessage, HumanMessage

from ..core.store import store
from ..tools.system_tools import get_system_context
from ..tools.workflow_tools import analyze_workflow
from ..tools.knowledge_tools import query_knowledge_base

logger = logging.getLogger(__name__)

class SilentAmbientAgent:
    """
    Ambient Intelligence Agent that:
    1. Observes user behavior silently
    2. Detects inefficiencies automatically
    3. Improves workflows without prompts
    4. Learns and adapts over time
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1,
            api_key=api_key
        )
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Build the ambient intelligence chain
        self.chain = self._build_ambient_chain()
        
        # User state tracking
        self.user_states = {}  # user_id -> UserState
        self.last_analysis = {}  # user_id -> timestamp
        
    def _build_ambient_chain(self):
        """Build the ambient intelligence processing chain"""
        
        # System prompt for ambient intelligence
        system_prompt = """
        You are SILENT KILLER, an ambient intelligence system that observes user behavior 
        and automatically improves workflows without prompts or interaction.
        
        Your core principles:
        1. OBSERVE SILENTLY: Never interrupt the user
        2. DETECT PATTERNS: Identify inefficiencies automatically
        3. IMPROVE WORKFLOWS: Make subtle improvements
        4. LEARN CONTINUOUSLY: Adapt to user behavior over time
        
        Analyze the provided context and:
        - Detect workflow inefficiencies
        - Identify patterns that reduce productivity
        - Suggest subtle improvements
        - Learn user preferences
        
        Respond with structured JSON containing:
        {
            "inefficiencies": [{"type": "...", "severity": "high|medium|low", "description": "..."}],
            "patterns": [{"type": "...", "frequency": "...", "impact": "..."}],
            "improvements": [{"action": "...", "priority": "...", "auto_execute": true|false}],
            "learnings": [{"preference": "...", "confidence": "..."}]
        }
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", """
            User Context:
            {context}
            
            Recent Events:
            {events}
            
            System State:
            {system_state}
            
            Analyze and provide ambient intelligence insights.
            """),
        ])
        
        chain = prompt | self.llm
        return chain
    
    async def observe_user(self, user_id: str, context: Dict[str, Any]):
        """
        Main observation loop - called continuously with user context
        """
        try:
            # Get user state or create new
            user_state = self.user_states.get(user_id, self._create_user_state())
            
            # Update context
            user_state["context_history"].append({
                "timestamp": datetime.now(),
                "data": context
            })
            
            # Keep only last 100 context entries
            if len(user_state["context_history"]) > 100:
                user_state["context_history"] = user_state["context_history"][-100:]
            
            # Check if we should analyze (every 5 minutes or significant change)
            now = datetime.now()
            last_analysis = self.last_analysis.get(user_id, datetime.min)
            
            if (now - last_analysis) > timedelta(minutes=5) or self._detect_significant_change(user_state):
                await self._analyze_and_improve(user_id, user_state)
                self.last_analysis[user_id] = now
            
            # Store updated state
            self.user_states[user_id] = user_state
            
        except Exception as e:
            logger.error(f"Error in observe_user for {user_id}: {e}")
    
    async def _analyze_and_improve(self, user_id: str, user_state: Dict):
        """
        Analyze user state and execute improvements automatically
        """
        try:
            # Gather data for analysis
            recent_events = store.get_events(user_id, datetime.now() - timedelta(hours=2))
            system_state = await get_system_context()
            
            # Get recent context
            recent_context = user_state["context_history"][-10:] if user_state["context_history"] else []
            
            # Run ambient intelligence analysis
            result = await self.chain.ainvoke({
                "context": recent_context,
                "events": recent_events,
                "system_state": system_state
            })
            
            # Parse the AI response
            insights = self._parse_insights(result.content)
            
            # Execute improvements automatically
            await self._execute_improvements(user_id, insights)
            
            # Update learnings
            self._update_learnings(user_id, insights)
            
            logger.info(f"Ambient analysis completed for {user_id}: {len(insights.get('improvements', []))} improvements")
            
        except Exception as e:
            logger.error(f"Error in analysis for {user_id}: {e}")
    
    def _parse_insights(self, ai_response: str) -> Dict[str, Any]:
        """Parse AI response into structured insights"""
        try:
            import json
            # Try to extract JSON from response
            start = ai_response.find('{')
            end = ai_response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = ai_response[start:end]
                return json.loads(json_str)
        except:
            pass
        
        # Fallback structure
        return {
            "inefficiencies": [],
            "patterns": [],
            "improvements": [],
            "learnings": []
        }
    
    async def _execute_improvements(self, user_id: str, insights: Dict):
        """Execute improvements automatically based on insights"""
        try:
            for improvement in insights.get("improvements", []):
                if improvement.get("auto_execute", False):
                    await self._execute_action(user_id, improvement)
        except Exception as e:
            logger.error(f"Error executing improvements: {e}")
    
    async def _execute_action(self, user_id: str, action: Dict):
        """Execute a specific improvement action"""
        action_type = action.get("action")
        
        if action_type == "organize_workspace":
            await self._organize_workspace(user_id)
        elif action_type == "suggest_focus_time":
            await self._schedule_focus_blocks(user_id)
        elif action_type == "reduce_notifications":
            await self._minimize_notifications(user_id)
        elif action_type == "group_similar_tasks":
            await self._group_tasks(user_id)
        # Add more actions as needed
    
    async def _organize_workspace(self, user_id: str):
        """Automatically organize user's digital workspace"""
        # Implementation would integrate with OS to organize files, tabs, etc.
        logger.info(f"Auto-organizing workspace for {user_id}")
    
    async def _schedule_focus_blocks(self, user_id: str):
        """Automatically schedule focus blocks in calendar"""
        # Implementation would integrate with calendar APIs
        logger.info(f"Auto-scheduling focus blocks for {user_id}")
    
    async def _minimize_notifications(self, user_id: str):
        """Automatically minimize notifications during focus time"""
        # Implementation would integrate with OS notification settings
        logger.info(f"Auto-minimizing notifications for {user_id}")
    
    async def _group_tasks(self, user_id: str):
        """Automatically group similar tasks"""
        # Implementation would organize task lists
        logger.info(f"Auto-grouping tasks for {user_id}")
    
    def _create_user_state(self) -> Dict:
        """Create initial user state"""
        return {
            "context_history": [],
            "patterns": {},
            "preferences": {},
            "last_actions": [],
            "learned_behaviors": {}
        }
    
    def _detect_significant_change(self, user_state: Dict) -> bool:
        """Detect if there's a significant change in user behavior"""
        # Simple implementation - can be enhanced
        if len(user_state["context_history"]) < 2:
            return False
        
        current = user_state["context_history"][-1]["data"]
        previous = user_state["context_history"][-2]["data"]
        
        # Check for significant changes
        if current.get("active_window") != previous.get("active_window"):
            return True
        
        return False
    
    def _update_learnings(self, user_id: str, insights: Dict):
        """Update learned behaviors and preferences"""
        user_state = self.user_states.get(user_id, self._create_user_state())
        
        for learning in insights.get("learnings", []):
            preference = learning.get("preference")
            confidence = learning.get("confidence", 0.5)
            
            if preference and confidence > 0.7:
                user_state["learned_behaviors"][preference] = {
                    "confidence": confidence,
                    "timestamp": datetime.now()
                }
        
        self.user_states[user_id] = user_state
    
    def get_user_insights(self, user_id: str) -> Dict:
        """Get current insights for a user (for dashboard display)"""
        user_state = self.user_states.get(user_id, {})
        
        return {
            "learned_patterns": list(user_state.get("learned_behaviors", {}).keys()),
            "recent_improvements": user_state.get("last_actions", [])[-5:],
            "ambient_score": self._calculate_ambient_score(user_state)
        }
    
    def _calculate_ambient_score(self, user_state: Dict) -> float:
        """Calculate how well the ambient system understands the user"""
        learned = user_state.get("learned_behaviors", {})
        if not learned:
            return 0.0
        
        # Simple scoring based on number of learned behaviors
        return min(1.0, len(learned) * 0.1)

# Global ambient agent instance
_ambient_agent = None

def get_ambient_agent(api_key: Optional[str] = None) -> SilentAmbientAgent:
    """Get or create the ambient agent instance"""
    global _ambient_agent
    if _ambient_agent is None:
        _ambient_agent = SilentAmbientAgent(api_key)
    return _ambient_agent
