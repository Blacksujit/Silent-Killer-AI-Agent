from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from datetime import datetime


class Event(BaseModel):
    user_id: str
    event_id: Optional[str] = None
    timestamp: datetime
    type: str
    meta: Dict[str, str] = Field(default_factory=dict)


class Suggestion(BaseModel):
    id: str
    title: str
    description: str
    severity: str  # low|medium|high
    confidence: float
    evidence: List[str] = Field(default_factory=list)
    suggested_action: Optional[str] = None
    created_ts: datetime = Field(default_factory=datetime.utcnow)


class SuggestionResponse(BaseModel):
    user_id: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    suggestions: List[Suggestion] = Field(default_factory=list)


class Action(BaseModel):
    user_id: str
    suggestion_id: str
    action: str  # accept|reject|auto_execute
    details: Optional[str] = None
    suggestion_title: Optional[str] = None
    suggestion_severity: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ActionResponse(BaseModel):
    status: str
    recorded: int = 1
