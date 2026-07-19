from __future__ import annotations

from pydantic import BaseModel, Field


class UserHealthProfile(BaseModel):
    diseases: str | None = None
    sleep_schedule: str | None = None
    daily_routine: str | None = None
    eating_habits: str | None = None
    goals: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    profile: UserHealthProfile | None = None
    recent_report_summary: str | None = None
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
