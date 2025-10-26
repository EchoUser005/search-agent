from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]


class Message(BaseModel):
    role: str
    content: str
    tool_calls: Optional[List[ToolCall]] = None


class AgentStreamEvent(BaseModel):
    type: str
    content: Optional[str] = None
    tool_name: Optional[str] = None
    arguments: Optional[str] = None