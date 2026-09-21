# ============================================================
# IMPORTS
# ============================================================

import os
import sys
import math
import requests
import joblib
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv


# ============================================================
# OPENAI / GROQ IMPORT
# ============================================================

try:

    from openai import OpenAI

except ImportError:

    OpenAI = None


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

_backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
_root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")

load_dotenv(dotenv_path=_root_env, override=True)
load_dotenv(dotenv_path=_backend_env, override=True)


# ============================================================
# API KEYS & CONFIGURATION
# ============================================================

OPENWEATHER_API_KEY = (os.getenv("OPENWEATHER_API_KEY") or "").strip().strip('"').strip("'")
GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip().strip('"').strip("'")
GROQ_BASE_URL = (os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1").strip().strip('"').strip("'")
GROQ_MODEL = (os.getenv("GROQ_MODEL") or "openai/gpt-oss-120b").strip().strip('"').strip("'")


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

CORS(app)


# ============================================================
# GROQ AI CLIENT (via OpenAI SDK base_url)
# ============================================================

groq_client = None


def get_or_create_groq_client():
    global groq_client, GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL
    if groq_client is None:
        load_dotenv(dotenv_path=_root_env, override=True)
        load_dotenv(dotenv_path=_backend_env, override=True)
        GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip().strip('"').strip("'")
        GROQ_BASE_URL = (os.getenv("GROQ_BASE_URL") or "https://api.groq.com/openai/v1").strip().strip('"').strip("'")
        GROQ_MODEL = (os.getenv("GROQ_MODEL") or "openai/gpt-oss-120b").strip().strip('"').strip("'")
        if GROQ_API_KEY and OpenAI:
            try:
                groq_client = OpenAI(
                    api_key=GROQ_API_KEY,
                    base_url=GROQ_BASE_URL,
                )
                print("Groq AI client (OpenAI base_url) initialized successfully.")
            except Exception as e:
                print("WARNING: Groq client initialization failed:", e)
    return groq_client


# Initial attempt at startup
get_or_create_groq_client()

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is missing or empty in .env.")
if OpenAI is None:
    print("WARNING: openai package is not installed.")



# ============================================================
# LOAD DISASTER ML MODEL
# ============================================================

MODEL_PATH = "disaster_model.pkl"

model = None


try:

    model = joblib.load(
        MODEL_PATH
    )

    print(
        "AI disaster model loaded successfully."
    )

    # --------------------------------------------------------
    # MODEL INFORMATION
    # --------------------------------------------------------

    if hasattr(model, "n_features_in_"):

        print(
            "Model expects features:",
            model.n_features_in_
        )

    if hasattr(model, "feature_names_in_"):

        print(
            "Model feature names:",
            model.feature_names_in_
        )

    if hasattr(model, "classes_"):

        print(
            "Model classes:",
            model.classes_
        )


except Exception as e:

    print(
        "WARNING: Could not load disaster model."
    )

    print(
        "Reason:",
        e
    )


# ============================================================
# SAFE NUMBER
# ============================================================

def safe_number(
    value,
    default=0
):

    try:

        if value is None:

            return default

        number = float(value)

        if math.isnan(number):

            return default

        if math.isinf(number):

            return default

        return number

    except Exception:

        return default


# ============================================================
# WEATHER API
# ============================================================

def get_weather(city):

    if not OPENWEATHER_API_KEY:

        raise Exception(
            "OPENWEATHER_API_KEY is missing."
        )


    url = (
        "https://api.openweathermap.org/"
        "data/2.5/weather"
    )


    params = {

        "q": city,

        "appid":
            OPENWEATHER_API_KEY,

        "units":
            "metric"

    }


    response = requests.get(

        url,

        params=params,

        timeout=15

    )


    try:

        data = response.json()

    except Exception:

        data = {}


    if response.status_code != 200:

        message = data.get(

            "message",

            "Unable to get weather data."

        )

        raise Exception(

            f"OpenWeather error: {message}"

        )


    # ========================================================
    # WEATHER SECTIONS
    # ========================================================

    main = data.get(
        "main",
        {}
    )


    wind = data.get(
        "wind",
        {}
    )


    rain = data.get(
        "rain",
        {}
    )


    coord = data.get(
        "coord",
        {}
    )


    # ========================================================
    # WEATHER VALUES
    # ========================================================

    temperature = safe_number(

        main.get(
            "temp"
        )

    )


    humidity = safe_number(

        main.get(
            "humidity"
        )

    )


    pressure = safe_number(

        main.get(
            "pressure"
        )

    )


    wind_speed = safe_number(

        wind.get(
            "speed"
        )

    )


    # ========================================================
    # RAINFALL
    # ========================================================

    rainfall = 0


    if "1h" in rain:

        rainfall = safe_number(

            rain.get(
                "1h"
            )

        )


    elif "3h" in rain:

        rainfall = (

            safe_number(

                rain.get(
                    "3h"
                )

            ) / 3

        )


    # ========================================================
    # COORDINATES
    # ========================================================

    latitude = safe_number(

        coord.get(
            "lat"
        ),

        None

    )


    longitude = safe_number(

        coord.get(
            "lon"
        ),

        None

    )


    # ========================================================
    # WEATHER DESCRIPTION
    # ========================================================

    weather_list = data.get(

        "weather",

        []

    )


    description = ""


    if weather_list:

        description = weather_list[0].get(

            "description",

            ""

        )


    # ========================================================
    # RETURN WEATHER
    # ========================================================

    return {

        "city":

            data.get(
                "name",
                city
            ),

        "temperature":

            temperature,

        "humidity":

            humidity,

        "rainfall":

            rainfall,

        "wind_speed":

            wind_speed,

        "pressure":

            pressure,

        "latitude":

            latitude,

        "longitude":

            longitude,

        "description":

            description,

        "coord": {

            "lat":
                latitude,

            "lon":
                longitude

        }

    }


# ============================================================
# ML DISASTER PREDICTION
# ============================================================
def predict_disaster(
    temperature,
    humidity,
    rainfall,
    wind_speed,
    pressure
):

    if model is not None:

        try:

            # ================================================
            # MODEL INPUT
            # ================================================

            features = pd.DataFrame([{
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
                "wind_speed": wind_speed,
                "pressure": pressure
            }])

            # ================================================
            # PREDICTION
            # ================================================

            predicted = model.predict(features)[0]

            predicted_disaster = str(predicted)

            # ================================================
            # PROBABILITIES
            # ================================================

            probabilities = model.predict_proba(features)[0]

            classes = model.classes_

            probability_map = {
                str(cls): float(prob)
                for cls, prob in zip(
                    classes,
                    probabilities
                )
            }

            print("================================")
            print("MODEL PREDICTION")
            print("================================")

            print(
                "Predicted:",
                predicted_disaster
            )

            print(
                "Probabilities:",
                probability_map
            )

            print(
                "================================"
            )

            # ================================================
            # NORMAL CONDITION
            # ================================================

            if predicted_disaster.lower() == "normal":

                # Model is highly confident that conditions
                # are NORMAL.
                #
                # Therefore disaster risk must be LOW.

                probability = 100 - (
                    probability_map.get(
                        "Normal",
                        1.0
                    ) * 100
                )

                probability = max(
                    0,
                    min(
                        100,
                        probability
                    )
                )

                probability = round(
                    probability,
                    2
                )

                risk = "Low"

            # ================================================
            # DISASTER CONDITION
            # ================================================

            else:

                # Get probability of the predicted disaster,
                # NOT the maximum probability blindly.

                probability = (

                    probability_map.get(
                        predicted_disaster,
                        0
                    ) * 100

                )

                probability = round(
                    probability,
                    2
                )

                # ============================================
                # RISK LEVEL
                # ============================================

                if probability >= 80:

                    risk = "Emergency"

                elif probability >= 60:

                    risk = "High"

                elif probability >= 40:

                    risk = "Moderate"

                elif probability >= 20:

                    risk = "Watch"

                else:

                    risk = "Low"

            # ================================================
            # RETURN
            # ================================================

            return {

                "predicted_disaster":
                    predicted_disaster,

                "probability":
                    probability,

                "risk":
                    risk,

                "probabilities":
                    probability_map

            }

        except Exception as e:

            print(
                "ML prediction error:",
                e
            )

    # ========================================================
    # FALLBACK
    # ========================================================

    if rainfall >= 50:

        disaster = "Flood"

        probability = min(
            95,
            60 + rainfall * 0.5
        )

    elif wind_speed >= 20:

        disaster = "Cyclone"

        probability = min(
            95,
            60 + wind_speed
        )

    elif temperature >= 40:

        disaster = "Heatwave"

        probability = min(
            95,
            60 + (
                temperature - 40
            ) * 5
        )

    else:

        disaster = "Normal"

        probability = 0

    # ================================================
    # FALLBACK RISK
    # ================================================

    if disaster == "Normal":

        risk = "Low"

    elif probability >= 80:

        risk = "Emergency"

    elif probability >= 60:

        risk = "High"

    elif probability >= 40:

        risk = "Moderate"

    elif probability >= 20:

        risk = "Watch"

    else:

        risk = "Low"

    return {

        "predicted_disaster":
            disaster,

        "probability":
            round(
                probability,
                2
            ),

        "risk":
            risk,

        "probabilities": {}

    }
    # ========================================================
    # FALLBACK PREDICTION
    # ========================================================

    print(
        "Using fallback disaster prediction."
    )


    if rainfall >= 50:

        disaster = "Flood"


        probability = min(

            95,

            60 + rainfall * 0.5

        )


    elif wind_speed >= 20:

        disaster = "Cyclone"


        probability = min(

            95,

            60 + wind_speed

        )


    elif temperature >= 40:

        disaster = "Heatwave"


        probability = min(

            95,

            60 + (

                temperature - 40

            ) * 5

        )


    else:

        disaster = ""

        probability = 15


    probability = round(

        probability,

        2

    )


    if probability >= 70:

        risk = "High"

    elif probability >= 40:

        risk = "Moderate"

    else:

        risk = "Low"


    return {

        "predicted_disaster":
            disaster,

        "probability":
            probability,

        "risk":
            risk

    }


# ============================================================
# OTHER DISASTER RISKS
# ============================================================

def calculate_other_risks(

    temperature,

    humidity,

    rainfall,

    wind_speed,

    pressure

):

    # ========================================================
    # FLOOD
    # ========================================================

    flood_probability = min(

        100,

        (

            rainfall * 1.5

            +

            humidity * 0.15

        )

    )


    # ========================================================
    # CYCLONE
    # ========================================================

    cyclone_probability = min(

        100,

        wind_speed * 3

    )


    # ========================================================
    # HEATWAVE (IMD Indian Criteria)
    # ========================================================

    heatwave_probability = 0

    if temperature >= 40:
        # IMD Plains Heatwave threshold: >= 40°C
        heatwave_probability = min(
            100,
            60 + (temperature - 40) * 8
        )
    elif temperature >= 37 and humidity >= 45:
        # IMD Coastal / Humid heat index threshold
        heatwave_probability = min(
            85,
            35 + (temperature - 37) * 10 + (humidity - 45) * 0.6
        )
    elif temperature >= 38:
        heatwave_probability = min(
            40,
            15 + (temperature - 38) * 12
        )


    return {

        "flood_probability":

            round(

                flood_probability,

                2

            ),

        "cyclone_probability":

            round(

                cyclone_probability,

                2

            ),

        "heatwave_probability":

            round(

                heatwave_probability,

                2

            )

    }


# ============================================================
# CREATE ALERT
# ============================================================

def create_alert(

    disaster,

    risk,

    probability,

    city

):

    # ========================================================
    # HIGH RISK
    # ========================================================

    if risk == "High":

        return {

            "alert":
                True,

            "alert_level":
                "Emergency",

            "alert_message":

                (

                    f"🚨 High {disaster} risk "
                    f"detected in {city}. "

                    "Please monitor official "
                    "emergency instructions."

                )

        }


    # ========================================================
    # MODERATE RISK
    # ========================================================

    if risk == "Moderate":

        return {

            "alert":
                True,

            "alert_level":
                "Warning",

            "alert_message":

                (

                    f"⚠️ Moderate {disaster} "
                    f"risk detected in {city}. "

                    "Stay alert and monitor "
                    "official weather updates."

                )

        }


    # ========================================================
    # 
    # ========================================================

    return {

        "alert":
            False,

        "alert_level":
            "",

        "alert_message":

            (

                f"No significant disaster "
                f"risk detected in {city}."

            )

    }


# ============================================================
# HOME
# ============================================================

@app.route(

    "/",

    methods=["GET"]

)

def home():

    return jsonify({

        "message":

            "AI Disaster Prediction API is running!",

        "status":

            "online"

    })


# ============================================================
# HEALTH
# ============================================================

@app.route(

    "/health",

    methods=["GET"]

)

def health():

    return jsonify({

        "status":

            "healthy",

        "weather_api":

            bool(

                OPENWEATHER_API_KEY

            ),

        "groq_ai":

            bool(

                get_or_create_groq_client() is not None

            ),

        "groq_model":

            GROQ_MODEL,

        "featherless_ai":

            bool(

                get_or_create_groq_client() is not None

            ),

        "model_loaded":

            model is not None,

        "model_features":

            (

                model.n_features_in_

                if model is not None
                and hasattr(
                    model,
                    "n_features_in_"
                )

                else None

            ),

        "model_feature_names":

            (

                model.feature_names_in_.tolist()

                if model is not None
                and hasattr(
                    model,
                    "feature_names_in_"
                )

                else None

            ),

        "featherless_model":

            GROQ_MODEL

    })


# ============================================================
# WEATHER
# ============================================================

@app.route(

    "/weather",

    methods=["GET"]

)

def weather():

    city = request.args.get(

        "city",

        ""

    ).strip()


    if not city:

        return jsonify({

            "error":

                "City is required."

        }), 400


    try:

        weather_data = get_weather(

            city

        )


        return jsonify(

            weather_data

        )


    except Exception as e:

        print(

            "WEATHER ERROR:",

            e

        )


        return jsonify({

            "error":

                str(e)

        }), 500


# ============================================================
# MANUAL PREDICTION
# ============================================================

@app.route(

    "/predict",

    methods=["POST"]

)

def predict():

    try:

        data = request.get_json(

            silent=True

        ) or {}


        # ====================================================
        # INPUT VALUES
        # ====================================================

        temperature = safe_number(

            data.get(
                "temperature"
            )

        )


        humidity = safe_number(

            data.get(
                "humidity"
            )

        )


        rainfall = safe_number(

            data.get(
                "rainfall"
            )

        )


        wind_speed = safe_number(

            data.get(
                "wind_speed"
            )

        )


        pressure = safe_number(

            data.get(
                "pressure"
            ),

            1013

        )


        # ====================================================
        # ML PREDICTION
        # ====================================================

        prediction = predict_disaster(

            temperature,

            humidity,

            rainfall,

            wind_speed,

            pressure

        )


        # ====================================================
        # OTHER RISKS
        # ====================================================

        other_risks = calculate_other_risks(

            temperature,

            humidity,

            rainfall,

            wind_speed,

            pressure

        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            **prediction,

            **other_risks,

            "temperature":
                temperature,

            "humidity":
                humidity,

            "rainfall":
                rainfall,

            "wind_speed":
                wind_speed,

            "pressure":
                pressure

        })


    except Exception as e:

        print(

            "PREDICTION ERROR:",

            e

        )


        return jsonify({

            "error":

                str(e)

        }), 500


# ============================================================
# CITY PREDICTION
# ============================================================

@app.route(

    "/predict-city",

    methods=["GET"]

)

def predict_city():

    city = request.args.get(

        "city",

        ""

    ).strip()


    if not city:

        return jsonify({

            "error":

                "City is required."

        }), 400


    try:

        # ====================================================
        # WEATHER
        # ====================================================

        weather_data = get_weather(

            city

        )


        # ====================================================
        # WEATHER VALUES
        # ====================================================

        temperature = safe_number(

            weather_data.get(
                "temperature"
            )

        )


        humidity = safe_number(

            weather_data.get(
                "humidity"
            )

        )


        rainfall = safe_number(

            weather_data.get(
                "rainfall"
            )

        )


        wind_speed = safe_number(

            weather_data.get(
                "wind_speed"
            )

        )


        pressure = safe_number(

            weather_data.get(
                "pressure"
            ),

            1013

        )


        latitude = weather_data.get(

            "latitude"

        )


        longitude = weather_data.get(

            "longitude"

        )


        # ====================================================
        # ML PREDICTION
        # ====================================================

        prediction = predict_disaster(

            temperature,

            humidity,

            rainfall,

            wind_speed,

            pressure

        )


        # ====================================================
        # OTHER RISKS
        # ====================================================

        other_risks = calculate_other_risks(

            temperature,

            humidity,

            rainfall,

            wind_speed,

            pressure

        )


        # ====================================================
        # ALERT
        # ====================================================

        alert = create_alert(

            prediction[

                "predicted_disaster"

            ],

            prediction[

                "risk"

            ],

            prediction[

                "probability"

            ],

            weather_data[

                "city"

            ]

        )


        # ====================================================
        # FINAL RESULT
        # ====================================================

        result = {

            # ------------------------------------------------
            # LOCATION
            # ------------------------------------------------

            "city":

                weather_data[

                    "city"

                ],

            "latitude":

                latitude,

            "longitude":

                longitude,

            "coord": {

                "lat":

                    latitude,

                "lon":

                    longitude

            },


            # ------------------------------------------------
            # WEATHER
            # ------------------------------------------------

            "temperature":

                temperature,

            "humidity":

                humidity,

            "rainfall":

                rainfall,

            "wind_speed":

                wind_speed,

            "pressure":

                pressure,

            "description":

                weather_data.get(

                    "description",

                    ""

                ),


            # ------------------------------------------------
            # AI PREDICTION
            # ------------------------------------------------

            "predicted_disaster":

                prediction[

                    "predicted_disaster"

                ],

            "probability":

                prediction[

                    "probability"

                ],

            "risk":

                prediction[

                    "risk"

                ],


            # ------------------------------------------------
            # OTHER RISKS
            # ------------------------------------------------

            "flood_probability":

                other_risks[

                    "flood_probability"

                ],

            "cyclone_probability":

                other_risks[

                    "cyclone_probability"

                ],

            "heatwave_probability":

                other_risks[

                    "heatwave_probability"

                ],


            # ------------------------------------------------
            # ALERT
            # ------------------------------------------------

            "alert":

                alert[

                    "alert"

                ],

            "alert_level":

                alert[

                    "alert_level"

                ],

            "alert_message":

                alert[

                    "alert_message"

                ]

        }


        # ====================================================
        # DEBUG
        # ====================================================

        print("")

        print(
            "=========================================="
        )

        print(
            "PREDICT CITY"
        )

        print(
            "City:",
            result["city"]
        )

        print(
            "Temperature:",
            result["temperature"]
        )

        print(
            "Humidity:",
            result["humidity"]
        )

        print(
            "Rainfall:",
            result["rainfall"]
        )

        print(
            "Wind:",
            result["wind_speed"]
        )

        print(
            "Pressure:",
            result["pressure"]
        )

        print(
            "Latitude:",
            result["latitude"]
        )

        print(
            "Longitude:",
            result["longitude"]
        )

        print(
            "Disaster:",
            result[
                "predicted_disaster"
            ]
        )

        print(
            "Risk:",
            result["risk"]
        )

        print(
            "Probability:",
            result["probability"]
        )

        print(
            "=========================================="
        )

        print("")


        return jsonify(

            result

        )


    except Exception as e:

        print("")

        print(
            "=========================================="
        )

        print(
            "❌ PREDICT CITY ERROR"
        )

        print(

            str(e)

        )

        print(
            "=========================================="
        )

        print("")


        return jsonify({

            "error":

                str(e)

        }), 500


# ============================================================
# AI CHATBOT
# ============================================================

@app.route(

    "/chat",

    methods=["POST"]

)

def chat():

    try:

        # ====================================================
        # CHECK AI CLIENT
        # ====================================================

        client = get_or_create_groq_client()

        if client is None:

            return jsonify({

                "error":

                    (

                        "Groq AI is not configured. "
                        "Please set GROQ_API_KEY in backend/.env and save the file (Ctrl+S)."

                    )

            }), 500


        # ====================================================
        # GET MESSAGE
        # ====================================================

        data = request.get_json(

            silent=True

        ) or {}


        message = data.get(

            "message",

            ""

        )


        if not isinstance(

            message,

            str

        ):

            message = str(

                message

            )


        message = message.strip()


        if not message:

            return jsonify({

                "error":

                    "Message is required."

            }), 400


        # ====================================================
        # DEBUG
        # ====================================================

        print("")

        print(
            "=========================================="
        )

        print(
            "CHAT REQUEST (GROQ)"
        )

        print(
            "Message:",
            message
        )

        print(
            "Model:",
            GROQ_MODEL
        )

        print(
            "=========================================="
        )


        # ====================================================
        # GROQ REQUEST (Responses API with fallback)
        # ====================================================

        answer = ""

        try:

            response = client.responses.create(

                input=message,

                instructions=(

                    "You are DisasterAssist, an AI emergency "
                    "assistant for a disaster management platform. "
                    "Help users with floods, cyclones, heatwaves, "
                    "earthquakes, severe weather, emergency "
                    "preparedness and disaster safety. "
                    "Answer the user's question directly. "
                    "Do NOT provide internal reasoning. "
                    "Do NOT describe your analysis process. "
                    "Return only the final actionable answer. "
                    "Keep answers clear, practical and reasonably concise. "
                    "Use bullet points when useful."

                ),

                model=GROQ_MODEL,

            )

            res_text = getattr(response, "output_text", None)

            if not res_text and hasattr(response, "output") and response.output:

                res_text = response.output[0].text

            if res_text:

                answer = str(res_text).strip()

        except Exception as responses_err:

            print(f"[app.py] Groq responses.create fallback: {responses_err}")


        # Fallback to chat completions if responses.create did not return text
        if not answer:

            completion = (

                client.chat.completions.create(

                    model=GROQ_MODEL,

                    messages=[

                        {

                            "role":
                                "system",

                            "content":

                                (

                                    "You are DisasterAssist, an AI emergency "
                                    "assistant for a disaster management platform. "
                                    "Help users with floods, cyclones, heatwaves, "
                                    "earthquakes, severe weather, emergency "
                                    "preparedness and disaster safety. "
                                    "Answer the user's question directly. "
                                    "Do NOT provide internal reasoning. "
                                    "Do NOT describe your analysis process. "
                                    "Return only the final actionable answer. "
                                    "Keep answers clear, practical and reasonably concise. "
                                    "Use bullet points when useful."

                                )

                        },

                        {

                            "role":
                                "user",

                            "content":
                                message

                        }

                    ],

                    temperature=1,

                    max_completion_tokens=2048,

                    top_p=1,

                    reasoning_effort="medium",

                    stream=True,

                    stop=None

                )

            )

            full_content = ""

            for chunk in completion:

                if (

                    chunk.choices

                    and chunk.choices[0].delta

                    and chunk.choices[0].delta.content

                ):

                    full_content += chunk.choices[0].delta.content

            answer = full_content.strip()


        # ====================================================
        # EMPTY RESPONSE CHECK
        # ====================================================

        if not answer:

            print("")

            print(
                "=========================================="
            )

            print(
                "❌ GROQ EMPTY CONTENT"
            )

            print(
                "=========================================="
            )


            return jsonify({

                "error":

                    "Groq AI did not return a response."

            }), 500


        # ====================================================
        # SUCCESS
        # ====================================================

        print("")

        print(
            "=========================================="
        )

        print(
            "✅ GROQ AI RESPONSE"
        )

        print(
            "=========================================="
        )

        print(

            answer

        )

        print(
            "=========================================="
        )

        print("")


        return jsonify({

            "reply":

                answer

        })


    except Exception as e:

        print("")

        print(
            "=========================================="
        )

        print(
            "❌ CHAT ERROR"
        )

        print(

            type(e).__name__,

            ":",

            str(e)

        )

        print(
            "=========================================="
        )

        print("")


        return jsonify({

            "error":

                str(e)

        }), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    print("")

    print(
        "=========================================="
    )

    print(
        "   AI DISASTER MANAGEMENT SYSTEM"
    )

    print(
        "=========================================="
    )

    print("")


    print(
        "Backend: http://127.0.0.1:5000"
    )

    print(
        "Weather: /weather"
    )

    print(
        "Prediction: /predict"
    )

    print(
        "City Prediction: /predict-city"
    )

    print(
        "AI Chatbot: /chat"
    )

    print(
        "Health: /health"
    )

    print("")


    print(
        "Groq Model:",
        GROQ_MODEL
    )


    if GROQ_API_KEY:

        print(
            "Groq AI: CONNECTED"
        )

    else:

        print(
            "Groq AI: API KEY MISSING (Set GROQ_API_KEY in backend/.env)"
        )


    if OPENWEATHER_API_KEY:

        print(
            "OpenWeather: CONNECTED"
        )

    else:

        print(
            "OpenWeather: API KEY MISSING"
        )


    # ========================================================
    # MODEL INFORMATION
    # ========================================================

    if model is not None:

        print("")

        print(
            "ML MODEL INFORMATION"
        )

        print(
            "Model:",
            MODEL_PATH
        )


        if hasattr(

            model,

            "n_features_in_"

        ):

            print(

                "Features expected:",

                model.n_features_in_

            )


        if hasattr(

            model,

            "feature_names_in_"

        ):

            print(

                "Feature names:",

                model.feature_names_in_

            )


        if hasattr(

            model,

            "classes_"

        ):

            print(

                "Classes:",

                model.classes_

            )


    print("")


    # ========================================================
    # START FLASK
    # ========================================================

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )