import os
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

load_dotenv(dotenv_path=_root_env, override=True)
load_dotenv(dotenv_path=_backend_env, override=True)


def get_groq_config():
    load_dotenv(dotenv_path=_root_env, override=True)
    load_dotenv(dotenv_path=_backend_env, override=True)
    api_key = (os.getenv("GROQ_API_KEY") or "").strip().strip('"').strip("'")
    base_url = (os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1").strip().strip('"').strip("'")
    model = (os.getenv("GROQ_MODEL") or "openai/gpt-oss-120b").strip().strip('"').strip("'")
    return api_key, base_url, model


def get_groq_client():
    api_key, base_url, _ = get_groq_config()
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is missing or empty in backend/.env. Please configure GROQ_API_KEY."
        )

    # 1. Prefer Groq official SDK
    if Groq is not None:
        try:
            kwargs = {"api_key": api_key}
            if base_url and base_url != "https://api.groq.com/openai/v1":
                kwargs["base_url"] = base_url
            return Groq(**kwargs)
        except Exception:
            pass

    # 2. Fallback to OpenAI SDK
    if OpenAI is not None:
        return OpenAI(
            api_key=api_key,
            base_url=base_url,
        )

    raise ValueError("Neither 'groq' nor 'openai' package is installed.")


def ask_groq(message, stream_callback=None):
    client = get_groq_client()
    _, _, model = get_groq_config()

    system_prompt = (
        "You are DisasterAssist, an AI emergency assistant for a disaster management platform. "
        "Help citizens with disaster safety information, flood, cyclone, heatwave, earthquake, and severe weather guidelines. "
        "Be concise, clear, and actionable. "
        "For emergencies, prioritize immediate safety. "
        "Do not claim that an official warning exists unless the application provides that warning from an authorized source."
    )

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            temperature=0.7,
            max_tokens=2048,
        )
        answer = completion.choices[0].message.content or ""
        if stream_callback:
            stream_callback(answer)
        return answer.strip()
    except Exception as chat_err:
        print(f"[Chatbot] chat.completions error, trying responses fallback: {chat_err}")
        try:
            if hasattr(client, "responses"):
                response = client.responses.create(
                    input=message,
                    instructions=system_prompt,
                    model=model,
                )
                answer = getattr(response, "output_text", None)
                if not answer and hasattr(response, "output") and response.output:
                    answer = response.output[0].text
                if answer:
                    if stream_callback:
                        stream_callback(answer)
                    return answer.strip()
        except Exception as e:
            print(f"[Chatbot] responses fallback failed: {e}")
        raise chat_err


# Backward compatibility alias
ask_featherless = ask_groq