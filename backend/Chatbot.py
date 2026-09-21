import os
from dotenv import load_dotenv
from openai import OpenAI

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
            "GROQ_API_KEY is missing or empty in backend/.env. Please save the file (Ctrl+S)."
        )
    return OpenAI(
        api_key=api_key,
        base_url=base_url,
    )


def ask_groq(message, stream_callback=None):
    client = get_groq_client()
    _, _, model = get_groq_config()

    # Attempt using client.responses.create as requested
    try:
        response = client.responses.create(
            input=message,
            instructions=(
                "You are DisasterAssist, an AI emergency assistant for a disaster management platform. "
                "Help citizens with disaster safety information, flood, cyclone, heatwave, earthquake, and severe weather guidelines. "
                "Be concise, clear, and actionable. "
                "For emergencies, prioritize immediate safety. "
                "Do not claim that an official warning exists unless the application provides that warning from an authorized source."
            ),
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
        print(f"[Chatbot] responses.create fallback triggered: {e}")

    # Fallback to chat completions if responses endpoint fails
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are DisasterAssist, an AI emergency assistant for a disaster management platform. "
                    "Help citizens with disaster safety information, flood, cyclone, heatwave, earthquake, and severe weather guidelines. "
                    "Be concise, clear, and actionable. "
                    "For emergencies, prioritize immediate safety. "
                    "Do not claim that an official warning exists unless the application provides that warning from an authorized source."
                ),
            },
            {
                "role": "user",
                "content": message,
            },
        ],
        temperature=1,
        max_tokens=2048,
    )

    answer = completion.choices[0].message.content or ""
    if stream_callback:
        stream_callback(answer)
    return answer.strip()


# Backward compatibility alias
ask_featherless = ask_groq