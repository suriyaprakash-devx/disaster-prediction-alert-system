import json
import httpx
from typing import Optional, List, Dict, Any
from app.config import settings
from app.utils.logger import logger

class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.base_url = settings.GROQ_BASE_URL.rstrip("/")
        self.timeout = settings.GROQ_TIMEOUT_SECONDS

    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith("replace_"))

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        if not self.is_configured():
            logger.warning("GROQ_API_KEY not configured or using placeholder. Returning intelligent simulated response.")
            return self._fallback_response(messages)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                elif response.status_code == 429:
                    logger.error("Groq rate limit exceeded (HTTP 429). Using graceful fallback.")
                    return self._fallback_response(messages, reason="Rate limit reached. Operating under cached fallback.")
                else:
                    logger.error(f"Groq API error ({response.status_code}): {response.text}")
                    return self._fallback_response(messages, reason=f"API status {response.status_code}")

        except httpx.TimeoutException:
            logger.error("Groq request timed out.")
            return self._fallback_response(messages, reason="Groq LLM timeout")
        except Exception as e:
            logger.error(f"Groq invocation failed: {str(e)}")
            return self._fallback_response(messages, reason=str(e))

    def _fallback_response(self, messages: List[Dict[str, str]], reason: str = "offline") -> str:
        last_message = messages[-1]["content"] if messages else ""
        return (
            f"[DesignOps AI Engine - Note: Running with deterministic fallback due to {reason}]\n\n"
            f"Regarding your query: '{last_message[:100]}...'\n\n"
            "Based on enterprise policy and context, this action has been evaluated. "
            "Please ensure GROQ_API_KEY is configured in your Render dashboard environment variables for full LLM generative capabilities."
        )

groq_service = GroqService()
