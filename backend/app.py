from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import joblib
import os
import pandas as pd


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# CREATE FLASK APP
# ============================================================

app = Flask(__name__)

CORS(app)


# ============================================================
# LOAD MODEL
# ============================================================

MODEL_PATH = "disaster_model.pkl"

try:
    model = joblib.load(MODEL_PATH)

    print("AI model loaded successfully.")
    print("Model classes:", model.classes_)

except Exception as e:

    model = None

    print("ERROR loading model:", e)


# ============================================================
# OPENWEATHER API KEY
# ============================================================

OPENWEATHER_API_KEY = os.getenv(
    "OPENWEATHER_API_KEY"
)


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "message":
            "Disaster Prediction API is running",

        "status":
            "online"

    })


# ============================================================
# GET WEATHER
# ============================================================

@app.route("/weather", methods=["GET"])
def weather():

    city = request.args.get("city")

    if not city:

        return jsonify({

            "error":
                "City is required"

        }), 400


    if not OPENWEATHER_API_KEY:

        return jsonify({

            "error":
                "OpenWeather API key is missing"

        }), 500


    url = (
        "https://api.openweathermap.org/"
        "data/2.5/weather"
    )


    params = {

        "q":
            city,

        "appid":
            OPENWEATHER_API_KEY,

        "units":
            "metric"

    }


    try:

        response = requests.get(

            url,

            params=params,

            timeout=10

        )


        data = response.json()


        if response.status_code != 200:

            return jsonify({

                "error":
                    "Could not get weather data",

                "details":
                    data

            }), response.status_code


        # ----------------------------------------------------
        # WEATHER VALUES
        # ----------------------------------------------------

        temperature = float(
            data["main"]["temp"]
        )

        humidity = float(
            data["main"]["humidity"]
        )

        pressure = float(
            data["main"]["pressure"]
        )

        wind_speed = float(
            data["wind"]["speed"]
        )


        # ----------------------------------------------------
        # RAINFALL
        # ----------------------------------------------------

        rainfall = 0.0


        if "rain" in data:

            rainfall = float(

                data["rain"].get(

                    "1h",

                    0

                )

            )


        # ----------------------------------------------------
        # LOCATION
        # ----------------------------------------------------

        latitude = float(
            data["coord"]["lat"]
        )

        longitude = float(
            data["coord"]["lon"]
        )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "city":
                data["name"],

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
                longitude

        })


    except requests.exceptions.RequestException as e:

        return jsonify({

            "error":
                "Weather service unavailable",

            "details":
                str(e)

        }), 500


    except Exception as e:

        return jsonify({

            "error":
                str(e)

        }), 500


# ============================================================
# CALCULATE RISK
# ============================================================

def calculate_risk(
    predicted_disaster,
    probability
):

    disaster = str(
        predicted_disaster
    ).strip().lower()


    # --------------------------------------------------------
    # NORMAL = ALWAYS LOW RISK
    # --------------------------------------------------------

    if disaster == "normal":

        return "Low"


    # --------------------------------------------------------
    # DISASTER RISK
    # --------------------------------------------------------

    if probability >= 70:

        return "High"


    elif probability >= 40:

        return "Moderate"


    else:

        return "Low"


# ============================================================
# CREATE ALERT
# ============================================================

def create_alert(
    predicted_disaster,
    risk,
    probability,
    city=None
):

    disaster = str(
        predicted_disaster
    ).strip()


    # Default alert
    alert = False

    alert_level = "None"

    alert_message = ""


    # --------------------------------------------------------
    # NORMAL
    # --------------------------------------------------------

    if disaster.lower() == "normal":

        return {

            "alert":
                False,

            "alert_level":
                "None",

            "alert_message":
                ""

        }


    # --------------------------------------------------------
    # HIGH RISK
    # --------------------------------------------------------

    if risk == "High":

        alert = True

        alert_level = "Emergency"


        location_text = ""

        if city:

            location_text = (
                f" in {city}"
            )


        alert_message = (

            f"🚨 HIGH "
            f"{disaster.upper()} "
            f"RISK DETECTED"
            f"{location_text}. "

            f"Probability: "
            f"{probability}%. "

            "Please monitor official "
            "emergency instructions "
            "and follow guidance "
            "from local authorities."

        )


    # --------------------------------------------------------
    # MODERATE RISK
    # --------------------------------------------------------

    elif risk == "Moderate":

        alert = True

        alert_level = "Warning"


        location_text = ""

        if city:

            location_text = (
                f" in {city}"
            )


        alert_message = (

            f"⚠️ MODERATE "
            f"{disaster.upper()} "
            f"RISK DETECTED"
            f"{location_text}. "

            f"Probability: "
            f"{probability}%. "

            "Please stay alert "
            "and monitor official "
            "updates."

        )


    # --------------------------------------------------------
    # LOW RISK
    # --------------------------------------------------------

    else:

        alert = False

        alert_level = "None"

        alert_message = ""


    return {

        "alert":
            alert,

        "alert_level":
            alert_level,

        "alert_message":
            alert_message

    }


# ============================================================
# MANUAL PREDICTION
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        # ----------------------------------------------------
        # CHECK MODEL
        # ----------------------------------------------------

        if model is None:

            return jsonify({

                "error":
                    "AI model is not loaded"

            }), 500


        # ----------------------------------------------------
        # GET DATA
        # ----------------------------------------------------

        data = request.get_json()


        if not data:

            return jsonify({

                "error":
                    "No data received"

            }), 400


        # ----------------------------------------------------
        # INPUT VALUES
        # ----------------------------------------------------

        temperature = float(
            data["temperature"]
        )

        humidity = float(
            data["humidity"]
        )

        rainfall = float(
            data["rainfall"]
        )

        wind_speed = float(
            data["wind_speed"]
        )

        pressure = float(
            data["pressure"]
        )


        # ----------------------------------------------------
        # CREATE DATAFRAME
        # ----------------------------------------------------

        input_data = pd.DataFrame([{

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

        }])


        # ----------------------------------------------------
        # MODEL PREDICTION
        # ----------------------------------------------------

        prediction = model.predict(

            input_data

        )[0]


        probabilities = model.predict_proba(

            input_data

        )[0]


        # ----------------------------------------------------
        # CLASS PROBABILITIES
        # ----------------------------------------------------

        classes = list(
            model.classes_
        )


        probability_map = {}


        for class_name, probability_value in zip(

            classes,

            probabilities

        ):

            probability_map[
                str(class_name)
            ] = round(

                float(
                    probability_value
                ) * 100,

                2

            )


        print(
            "Prediction:",
            prediction
        )

        print(
            "Probability map:",
            probability_map
        )


        # ----------------------------------------------------
        # DISASTER PROBABILITIES
        # ----------------------------------------------------

        flood_probability = (

            probability_map.get(

                "Flood",

                probability_map.get(

                    "flood",

                    0

                )

            )

        )


        cyclone_probability = (

            probability_map.get(

                "Cyclone",

                probability_map.get(

                    "cyclone",

                    0

                )

            )

        )


        heatwave_probability = (

            probability_map.get(

                "Heatwave",

                probability_map.get(

                    "heatwave",

                    0

                )

            )

        )


        # ----------------------------------------------------
        # PREDICTED DISASTER
        # ----------------------------------------------------

        predicted_disaster = str(
            prediction
        )


        # ----------------------------------------------------
        # MAIN PROBABILITY
        # ----------------------------------------------------

        probability = (

            probability_map.get(

                predicted_disaster,

                0

            )

        )


        # ----------------------------------------------------
        # RISK
        # ----------------------------------------------------

        risk = calculate_risk(

            predicted_disaster,

            probability

        )


        # ----------------------------------------------------
        # ALERT
        # ----------------------------------------------------

        alert_data = create_alert(

            predicted_disaster,

            risk,

            probability

        )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "predicted_disaster":
                predicted_disaster,

            "risk":
                risk,

            "probability":
                probability,

            "flood_probability":
                flood_probability,

            "cyclone_probability":
                cyclone_probability,

            "heatwave_probability":
                heatwave_probability,

            "alert":
                alert_data["alert"],

            "alert_level":
                alert_data["alert_level"],

            "alert_message":
                alert_data["alert_message"]

        })


    except KeyError as e:

        return jsonify({

            "error":
                f"Missing field: {str(e)}"

        }), 400


    except Exception as e:

        return jsonify({

            "error":
                str(e)

        }), 400


# ============================================================
# COMBINED CITY PREDICTION
# ============================================================

@app.route(
    "/predict-city",
    methods=["GET"]
)
def predict_city():

    try:

        # ----------------------------------------------------
        # CHECK MODEL
        # ----------------------------------------------------

        if model is None:

            return jsonify({

                "error":
                    "AI model is not loaded"

            }), 500


        # ----------------------------------------------------
        # GET CITY
        # ----------------------------------------------------

        city = request.args.get(
            "city"
        )


        if not city:

            return jsonify({

                "error":
                    "City is required"

            }), 400


        # ----------------------------------------------------
        # CHECK API KEY
        # ----------------------------------------------------

        if not OPENWEATHER_API_KEY:

            return jsonify({

                "error":
                    "OpenWeather API key is missing"

            }), 500


        # ----------------------------------------------------
        # OPENWEATHER API
        # ----------------------------------------------------

        url = (

            "https://api.openweathermap.org/"
            "data/2.5/weather"

        )


        params = {

            "q":
                city,

            "appid":
                OPENWEATHER_API_KEY,

            "units":
                "metric"

        }


        response = requests.get(

            url,

            params=params,

            timeout=10

        )


        weather_data = response.json()


        # ----------------------------------------------------
        # WEATHER ERROR
        # ----------------------------------------------------

        if response.status_code != 200:

            return jsonify({

                "error":
                    "Could not get weather data",

                "details":
                    weather_data

            }), response.status_code


        # ----------------------------------------------------
        # GET WEATHER VALUES
        # ----------------------------------------------------

        temperature = float(

            weather_data["main"]["temp"]

        )


        humidity = float(

            weather_data["main"]["humidity"]

        )


        pressure = float(

            weather_data["main"]["pressure"]

        )


        wind_speed = float(

            weather_data["wind"]["speed"]

        )


        # ----------------------------------------------------
        # RAINFALL
        # ----------------------------------------------------

        rainfall = 0.0


        if "rain" in weather_data:

            rainfall = float(

                weather_data["rain"].get(

                    "1h",

                    0

                )

            )


        # ----------------------------------------------------
        # LOCATION
        # ----------------------------------------------------

        latitude = float(

            weather_data["coord"]["lat"]

        )


        longitude = float(

            weather_data["coord"]["lon"]

        )


        # ----------------------------------------------------
        # CREATE DATAFRAME
        # ----------------------------------------------------

        input_data = pd.DataFrame([{

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

        }])


        # ----------------------------------------------------
        # ML PREDICTION
        # ----------------------------------------------------

        prediction = model.predict(

            input_data

        )[0]


        probabilities = model.predict_proba(

            input_data

        )[0]


        # ----------------------------------------------------
        # MODEL CLASSES
        # ----------------------------------------------------

        classes = list(

            model.classes_

        )


        probability_map = {}


        for class_name, probability_value in zip(

            classes,

            probabilities

        ):

            probability_map[
                str(class_name)
            ] = round(

                float(
                    probability_value
                ) * 100,

                2

            )


        print("-----------------------------------")

        print(
            "City:",
            weather_data["name"]
        )

        print(
            "Prediction:",
            prediction
        )

        print(
            "Probability map:",
            probability_map
        )

        print("-----------------------------------")


        # ----------------------------------------------------
        # DISASTER PROBABILITIES
        # ----------------------------------------------------

        flood_probability = (

            probability_map.get(

                "Flood",

                probability_map.get(

                    "flood",

                    0

                )

            )

        )


        cyclone_probability = (

            probability_map.get(

                "Cyclone",

                probability_map.get(

                    "cyclone",

                    0

                )

            )

        )


        heatwave_probability = (

            probability_map.get(

                "Heatwave",

                probability_map.get(

                    "heatwave",

                    0

                )

            )

        )


        # ----------------------------------------------------
        # PREDICTED DISASTER
        # ----------------------------------------------------

        predicted_disaster = str(

            prediction

        )


        # ----------------------------------------------------
        # MAIN PROBABILITY
        # ----------------------------------------------------

        probability = (

            probability_map.get(

                predicted_disaster,

                0

            )

        )


        # ----------------------------------------------------
        # RISK
        # ----------------------------------------------------

        risk = calculate_risk(

            predicted_disaster,

            probability

        )


        # ----------------------------------------------------
        # ALERT
        # ----------------------------------------------------

        alert_data = create_alert(

            predicted_disaster,

            risk,

            probability,

            weather_data["name"]

        )


        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        result = {

            "city":
                weather_data["name"],

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

            "predicted_disaster":
                predicted_disaster,

            "risk":
                risk,

            "probability":
                probability,

            "flood_probability":
                flood_probability,

            "cyclone_probability":
                cyclone_probability,

            "heatwave_probability":
                heatwave_probability,

            # ------------------------------------------------
            # ALERT INFORMATION
            # ------------------------------------------------

            "alert":
                alert_data["alert"],

            "alert_level":
                alert_data["alert_level"],

            "alert_message":
                alert_data["alert_message"]

        }


        return jsonify(result)


    except requests.exceptions.RequestException as e:

        return jsonify({

            "error":
                "Weather service unavailable",

            "details":
                str(e)

        }), 500


    except Exception as e:

        return jsonify({

            "error":
                str(e)

        }), 400


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("")
    print("==========================================")
    print("   AI DISASTER PREDICTION SYSTEM")
    print("==========================================")
    print("")

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )