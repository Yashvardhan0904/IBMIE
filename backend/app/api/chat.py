from __future__ import annotations

import os

import httpx
from fastapi import APIRouter

from app.core.exceptions import ParserServiceError
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


def _profile_context(request: ChatRequest) -> str:
    if not request.profile:
        return "No user health profile has been provided yet."

    profile = request.profile
    return "\n".join(
        [
            f"Full name: {profile.full_name or 'not provided'}",
            f"Age: {profile.age or 'not provided'}",
            f"Date of birth: {profile.date_of_birth or 'not provided'}",
            f"Biological sex: {profile.biological_sex or 'not provided'}",
            f"Height: {profile.height or 'not provided'}",
            f"Weight: {profile.weight or 'not provided'}",
            f"Known diseases/conditions: {profile.diseases or 'not provided'}",
            f"Current medications: {profile.medications or 'not provided'}",
            f"Allergies: {profile.allergies or 'not provided'}",
            f"Sleep schedule: {profile.sleep_schedule or 'not provided'}",
            f"Sleep hours: {profile.sleep_hours or 'not provided'}",
            f"Daily routine: {profile.daily_routine or 'not provided'}",
            f"Eating habits: {profile.eating_habits or 'not provided'}",
            f"Water intake: {profile.water_intake or 'not provided'}",
            f"Exercise frequency: {profile.exercise_frequency or 'not provided'}",
            f"User goals: {profile.goals or 'not provided'}",
            f"Reminder channels: {profile.reminder_channels or 'not provided'}",
            f"Preferred medicine reminder times: {profile.preferred_medicine_times or 'not provided'}",
            f"Wants previous report upload: {profile.wants_previous_reports_upload or 'not provided'}",
            f"Google Fit interest: {profile.google_fit_interest or 'not provided'}",
        ]
    )


@router.post("", response_model=ChatResponse)
async def health_chat(request: ChatRequest) -> ChatResponse:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ParserServiceError("GROQ_API_KEY is not set in the environment")

    system_prompt = (
        "You are Vitalis, a careful AI health companion. Explain reports and routine-health "
        "signals in simple language. Use the user's profile when available. Give practical, "
        "general wellness suggestions, but do not diagnose, prescribe, or replace a doctor. "
        "For red-flag symptoms or emergency concerns, advise urgent medical care."
    )
    user_context = (
        f"User profile:\n{_profile_context(request)}\n\n"
        f"Recent report context: {request.recent_report_summary or 'not provided'}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_context},
    ]
    for item in request.history[-8:]:
        if item.role in {"user", "assistant"}:
            messages.append({"role": item.role, "content": item.content})
    messages.append({"role": "user", "content": request.message})

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            GROQ_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.3,
            },
        )

    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise ParserServiceError(f"Groq chat failed: {response.text}") from exc

    reply = response.json()["choices"][0]["message"]["content"]
    return ChatResponse(reply=str(reply))
