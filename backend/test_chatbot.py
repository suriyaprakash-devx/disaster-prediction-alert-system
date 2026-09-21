import sys
from Chatbot import ask_groq

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

print("Testing Groq AI Disaster Chatbot...")

try:
    response = ask_groq(
        "What should I do if flood water is entering my house?"
    )
    print("\nAI RESPONSE:\n")
    print(response)
except Exception as e:
    print("\n[Notice]:", e)