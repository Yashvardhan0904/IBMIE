from __future__ import annotations

from pydantic import BaseModel, Field


class UserHealthProfile(BaseModel):
    full_name: str | None = None
    age: str | None = None
    date_of_birth: str | None = None
    biological_sex: str | None = None
    height: str | None = None
    weight: str | None = None
    diseases: str | None = None
    medications: str | None = None
    allergies: str | None = None
    sleep_schedule: str | None = None
    sleep_hours: str | None = None
    daily_routine: str | None = None
    eating_habits: str | None = None
    water_intake: str | None = None
    exercise_frequency: str | None = None
    goals: str | None = None
    reminder_channels: str | None = None
    preferred_medicine_times: str | None = None
    wants_previous_reports_upload: str | None = None
    google_fit_interest: str | None = None


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
