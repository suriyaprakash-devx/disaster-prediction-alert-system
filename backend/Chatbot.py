import os
import requests
from dotenv import load_dotenv

try:
    from groq import Groq
except ImportError:
    Groq = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

_backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
_root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")

# NEVER use override=True so Render's system environment variables take precedence
load_dotenv(dotenv_path=_backend_env, override=False)
load_dotenv(dotenv_path=_root_env, override=False)


def resolve_groq_api_key():
    """
    Search for Groq API key across environment variables and .env files.
    Checks multiple common naming variations and strips quotes/whitespace.
    """
    candidate_names = [
        "GROQ_API_KEY",
        "GROQ_KEY",
        "GROQ_APIKEY",
        "GROQ_API",
        "GROQ_TOKEN",
        "GROQ_SECRET",
        "VITE_GROQ_API_KEY",
        "REACT_APP_GROQ_API_KEY",
        "groq_api_key",
        "groq_key",
    ]

    # 1. Check os.environ directly first (Render injected variables)
    for var in candidate_names:
        val = os.environ.get(var)
        if val and val.strip():
            clean = val.strip().strip('"').strip("'").strip()
            if clean and clean.lower() not in ("none", "null", "undefined"):
                return clean, var

    # 2. Try loading .env without overriding
    load_dotenv(dotenv_path=_backend_env, override=False)
    load_dotenv(dotenv_path=_root_env, override=False)

    for var in candidate_names:
        val = os.environ.get(var)
        if val and val.strip():
            clean = val.strip().strip('"').strip("'").strip()
            if clean and clean.lower() not in ("none", "null", "undefined"):
                return clean, var

    return "", None


def get_groq_config():
    api_key, var_name = resolve_groq_api_key()
    base_url = (os.environ.get("GROQ_BASE_URL") or "https://api.groq.com/openai/v1").strip().strip('"').strip("'")
    model = (os.environ.get("GROQ_MODEL") or "openai/gpt-oss-120b").strip().strip('"').strip("'")
    return api_key, base_url, model, var_name


def get_groq_client():
    api_key, base_url, _, _ = get_groq_config()
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is missing or empty. Please configure GROQ_API_KEY in Render Environment Variables."
        )

    # 1. Prefer Groq official SDK with sanitized base_url
    if Groq is not None:
        try:
            return Groq(api_key=api_key, base_url="https://api.groq.com")
        except Exception:
            pass

    # 2. Fallback to OpenAI SDK
    if OpenAI is not None:
        return OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    raise ValueError("Neither 'groq' nor 'openai' package is installed.")


def ask_groq(message, stream_callback=None):
    """
    Queries Groq AI using high-reliability direct HTTP requests first, with fallback to SDKs.
    Handles rate limits, invalid keys, and model fallbacks automatically.
    """
    api_key, base_url, model, var_name = get_groq_config()

    if not api_key:
        return (
            "⚠️ **AI Assistant Notice**: `GROQ_API_KEY` is not configured in the Render Environment Variables.\n\n"
            "**Immediate Emergency Guidelines:**\n"
            "• **Floods**: Move to higher ground, do not walk/drive through flood waters, turn off electricity mains.\n"
            "• **Cyclones**: Stay indoors, keep away from windows, secure loose outdoor objects.\n"
            "• **Heatwaves**: Stay hydrated, avoid direct sun between 12 PM - 3 PM, wear light cotton clothing.\n"
            "• **National Emergency Helpline**: Call **112** or Disaster Control **1070/1077**.\n\n"
            "*To enable real-time AI responses, please add `GROQ_API_KEY` in your Render service's Environment tab.*"
        )

    system_prompt = (
        "You are DisasterAssist, an AI emergency assistant for a disaster management platform. "
        "Help citizens with disaster safety information, flood, cyclone, heatwave, earthquake, and severe weather guidelines. "
        "Be concise, clear, and actionable. "
        "For emergencies, prioritize immediate safety. "
        "Do not claim that an official warning exists unless the application provides that warning from an authorized source."
    )

    # Models to try in order of priority (handles accounts with different model tier access)
    models_to_try = [model]
    for m in ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
        if m not in models_to_try:
            models_to_try.append(m)

    last_error = None

    # -------------------------------------------------------------
    # 1. Primary: Direct HTTP REST Call (Most resilient, zero SDK bugs)
    # -------------------------------------------------------------
    for target_model in models_to_try:
        try:
            endpoint = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": target_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                "temperature": 0.7,
                "max_tokens": 2048,
            }
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=25)

            if resp.status_code == 200:
                result = resp.json()
                answer = result["choices"][0]["message"]["content"] or ""
                answer = answer.strip()
                if answer:
                    if stream_callback:
                        stream_callback(answer)
                    return answer
            elif resp.status_code == 404:
                # Target model unavailable on this tier/account, try next model
                last_error = f"Model {target_model} returned 404 Not Found"
                continue
            elif resp.status_code == 401:
                return (
                    "⚠️ **AI Assistant Notice**: The configured `GROQ_API_KEY` was rejected by Groq (HTTP 401: Invalid API Key).\n\n"
                    "Please check that you copied the complete API key starting with `gsk_` in your Render Environment settings."
                )
            elif resp.status_code == 429:
                return "⚠️ **AI Assistant Notice**: Groq API rate limit reached. Please retry in a few moments."
            else:
                last_error = f"HTTP {resp.status_code}: {resp.text[:150]}"
        except Exception as e:
            last_error = str(e)

    # -------------------------------------------------------------
    # 2. Secondary Fallback: Groq / OpenAI SDK (if HTTP had an issue)
    # -------------------------------------------------------------
    if Groq is not None:
        try:
            sdk_client = Groq(api_key=api_key, base_url="https://api.groq.com")
            completion = sdk_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                temperature=0.7,
                max_tokens=2048,
            )
            answer = (completion.choices[0].message.content or "").strip()
            if answer:
                if stream_callback:
                    stream_callback(answer)
                return answer
        except Exception as sdk_err:
            print(f"[Chatbot] Groq SDK fallback error: {sdk_err}")

    if OpenAI is not None:
        try:
            sdk_client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
            completion = sdk_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                temperature=0.7,
                max_tokens=2048,
            )
            answer = (completion.choices[0].message.content or "").strip()
            if answer:
                if stream_callback:
                    stream_callback(answer)
                return answer
        except Exception as oai_err:
            print(f"[Chatbot] OpenAI SDK fallback error: {oai_err}")

    err_msg = last_error or "Unable to reach Groq AI"
    return (
        f"⚠️ *Notice: Emergency AI assistant is temporarily unreachable ({err_msg}).*\n\n"
        "**Immediate Safety Guidelines:**\n"
        "• **Floods**: Move immediately to higher ground and stay away from power lines.\n"
        "• **Cyclones**: Shelter in a solid interior room away from doors and windows.\n"
        "• **Heatwaves**: Stay hydrated, avoid midday sun (12 PM - 3 PM).\n"
        "• **Emergency Number**: Call **112** for emergency assistance."
    )


# Backward compatibility alias
ask_featherless = ask_groq
