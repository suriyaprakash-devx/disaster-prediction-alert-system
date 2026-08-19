import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_URL = "http://127.0.0.1:5000";

// ============================================================
// FIX LEAFLET DEFAULT MARKER ICON
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


// ============================================================
// MAIN APP
// ============================================================

function App() {

  const [city, setCity] = useState("");

  const [prediction, setPrediction] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notificationEnabled, setNotificationEnabled] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  // ============================================================
  // ENABLE BROWSER NOTIFICATIONS
  // ============================================================

  const enableNotifications = async () => {

    if (!("Notification" in window)) {

      alert(
        "Your browser does not support notifications."
      );

      return;
    }

    try {

      const permission =
        await Notification.requestPermission();

      if (permission === "granted") {

        setNotificationEnabled(true);

        new Notification(
          "🔔 Disaster Alerts Enabled",
          {
            body:
              "You will receive emergency alerts from this application.",
          }
        );

      } else {

        setNotificationEnabled(false);

        alert(
          "Notification permission was not granted."
        );
      }

    } catch (err) {

      console.error(
        "Notification error:",
        err
      );
    }
  };


  // ============================================================
  // SEND BROWSER NOTIFICATION
  // ============================================================

  const sendBrowserNotification = (data) => {

    if (!data) {
      return;
    }

    if (!data.alert) {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    if (
      Notification.permission !==
      "granted"
    ) {
      return;
    }

    let title =
      "⚠️ Weather Warning";

    if (
      data.alert_level ===
      "Emergency"
    ) {

      title =
        "🚨 EMERGENCY ALERT";
    }

    try {

      new Notification(title, {

        body:
          data.alert_message ||
          `${data.predicted_disaster} risk detected in ${data.city}.`,

      });

    } catch (err) {

      console.error(
        "Could not send notification:",
        err
      );
    }
  };


  // ============================================================
  // CHECK RISK
  // ============================================================

  const checkRisk = async () => {

    if (!city.trim()) {

      setError(
        "Please enter a city name."
      );

      return;
    }

    setLoading(true);

    setError("");

    setPrediction(null);

    try {

      const response =
        await fetch(
          `${API_URL}/predict-city?city=${encodeURIComponent(
            city.trim()
          )}`
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Unable to get prediction."
        );
      }

      console.log(
        "Prediction response:",
        data
      );

      setPrediction(data);

      setLastUpdated(
        new Date().toLocaleString()
      );

      sendBrowserNotification(
        data
      );

    } catch (err) {

      console.error(
        "Prediction error:",
        err
      );

      setError(
        err.message ||
        "Unable to connect to the backend."
      );

    } finally {

      setLoading(false);
    }
  };


  // ============================================================
  // HANDLE ENTER KEY
  // ============================================================

  const handleKeyDown = (event) => {

    if (
      event.key ===
      "Enter"
    ) {

      checkRisk();
    }
  };


  // ============================================================
  // GET RISK CLASS
  // ============================================================

  const getRiskClass = (risk) => {

    if (!risk) {
      return "";
    }

    switch (
      risk.toLowerCase()
    ) {

      case "high":
        return "risk-high";

      case "moderate":
        return "risk-moderate";

      case "low":
        return "risk-low";

      default:
        return "";
    }
  };


  // ============================================================
  // GET DISASTER ICON
  // ============================================================

  const getDisasterIcon = (
    disaster
  ) => {

    if (!disaster) {
      return "ℹ️";
    }

    const value =
      disaster.toLowerCase();

    if (
      value.includes("flood")
    ) {

      return "🌊";
    }

    if (
      value.includes("cyclone")
    ) {

      return "🌀";
    }

    if (
      value.includes("heat")
    ) {

      return "🔥";
    }

    if (
      value.includes("normal")
    ) {

      return "✅";
    }

    return "⚠️";
  };


  // ============================================================
  // GET RISK ICON
  // ============================================================

  const getRiskIcon = (
    risk
  ) => {

    if (!risk) {
      return "ℹ️";
    }

    switch (
      risk.toLowerCase()
    ) {

      case "high":
        return "🔴";

      case "moderate":
        return "🟠";

      case "low":
        return "🟢";

      default:
        return "ℹ️";
    }
  };


  // ============================================================
  // MAP RISK COLOR
  // ============================================================

  const getMapColor = (
    risk
  ) => {

    if (!risk) {
      return "green";
    }

    switch (
      risk.toLowerCase()
    ) {

      case "high":
        return "red";

      case "moderate":
        return "orange";

      case "low":
        return "green";

      default:
        return "green";
    }
  };


  // ============================================================
  // MAP
  // ============================================================

  const RiskMap = () => {

    if (
      !prediction ||
      prediction.latitude === undefined ||
      prediction.longitude === undefined
    ) {

      return (
        <div className="map-error">

          📍 Location coordinates
          are not available.

        </div>
      );
    }

    const latitude =
      Number(
        prediction.latitude
      );

    const longitude =
      Number(
        prediction.longitude
      );

    const mapColor =
      getMapColor(
        prediction.risk
      );

    return (

      <div className="map-wrapper">

        <MapContainer

          center={[
            latitude,
            longitude
          ]}

          zoom={10}

          scrollWheelZoom={true}

          style={{
            height: "450px",
            width: "100%"
          }}

        >

          {/* ==================================================
              OPEN STREET MAP
              ================================================== */}

          <TileLayer

            attribution='&copy; OpenStreetMap contributors'

            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

          />


          {/* ==================================================
              CITY MARKER
              ================================================== */}

          <Marker
            position={[
              latitude,
              longitude
            ]}
          >

            <Popup>

              <div className="map-popup">

                <h3>
                  📍 {prediction.city}
                </h3>

                <p>

                  <strong>
                    Disaster:
                  </strong>

                  {" "}

                  {getDisasterIcon(
                    prediction.predicted_disaster
                  )}

                  {" "}

                  {prediction.predicted_disaster}

                </p>

                <p>

                  <strong>
                    Risk:
                  </strong>

                  {" "}

                  {getRiskIcon(
                    prediction.risk
                  )}

                  {" "}

                  {prediction.risk}

                </p>

                <p>

                  <strong>
                    Probability:
                  </strong>

                  {" "}

                  {prediction.probability}%

                </p>

              </div>

            </Popup>

          </Marker>


          {/* ==================================================
              RISK AREA
              ================================================== */}

          <Circle

            center={[
              latitude,
              longitude
            ]}

            radius={5000}

            pathOptions={{
              color: mapColor,
              fillColor: mapColor,
              fillOpacity: 0.25,
              weight: 3
            }}

          />

        </MapContainer>


        {/* ==================================================
            MAP LEGEND
            ================================================== */}

        <div className="map-legend">

          <div className="legend-title">
            Risk Level
          </div>

          <div className="legend-item">

            <span className="legend-dot high"></span>

            High Risk

          </div>

          <div className="legend-item">

            <span className="legend-dot moderate"></span>

            Moderate Risk

          </div>

          <div className="legend-item">

            <span className="legend-dot low"></span>

            Low Risk

          </div>

        </div>

      </div>
    );
  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="app">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="header">

        <div className="header-left">

          <div className="logo">
            🌍
          </div>

          <div>

            <h1>
              AI Disaster Prediction
            </h1>

            <p>
              Real-time weather risk monitoring
            </p>

          </div>

        </div>


        <button

          className="notification-button"

          onClick={
            enableNotifications
          }

        >

          {notificationEnabled
            ? "🔔 Alerts Enabled"
            : "🔕 Enable Alerts"}

        </button>

      </header>


      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="container">


        {/* ====================================================
            SEARCH
            ==================================================== */}

        <section className="search-card">

          <h2>
            Check Disaster Risk
          </h2>

          <p>
            Enter a city to analyze current
            weather conditions using AI.
          </p>


          <div className="search-row">

            <input

              type="text"

              placeholder="Enter city name..."

              value={city}

              onChange={(event) =>
                setCity(
                  event.target.value
                )
              }

              onKeyDown={
                handleKeyDown
              }

            />


            <button

              className="check-button"

              onClick={
                checkRisk
              }

              disabled={loading}

            >

              {loading
                ? "Analyzing..."
                : "🔍 Check Risk"}

            </button>

          </div>

        </section>


        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (

          <div className="error-box">

            <span>
              ❌
            </span>

            <div>

              <strong>
                Error
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>

        )}


        {/* ====================================================
            LOADING
            ==================================================== */}

        {loading && (

          <div className="loading-box">

            <div className="spinner"></div>

            <h3>
              Analyzing weather conditions...
            </h3>

            <p>
              AI is checking the current
              disaster risk.
            </p>

          </div>

        )}


        {/* ====================================================
            ALERT
            ==================================================== */}

        {!loading &&
          prediction?.alert && (

            <section

              className={`alert-box ${
                prediction.alert_level ===
                "Emergency"
                  ? "alert-emergency"
                  : "alert-warning"
              }`}

            >

              <div className="alert-icon">

                {prediction.alert_level ===
                "Emergency"
                  ? "🚨"
                  : "⚠️"}

              </div>


              <div className="alert-content">

                <h2>

                  {prediction.alert_level ===
                  "Emergency"
                    ? "EMERGENCY ALERT"
                    : "WEATHER WARNING"}

                </h2>


                <h3>

                  {getDisasterIcon(
                    prediction.predicted_disaster
                  )}

                  {" "}

                  {prediction.predicted_disaster?.toUpperCase()}

                  {" "}RISK DETECTED

                </h3>


                <div className="alert-details">

                  <span>

                    📍{" "}

                    <strong>
                      Location:
                    </strong>{" "}

                    {prediction.city}

                  </span>


                  <span>

                    📊{" "}

                    <strong>
                      Probability:
                    </strong>{" "}

                    {prediction.probability}%

                  </span>

                </div>


                <p className="alert-message">

                  {prediction.alert_message}

                </p>


                {prediction.alert_level ===
                  "Emergency" && (

                  <div className="emergency-note">

                    🚨 Please follow official
                    emergency instructions and
                    move to a safe location if
                    instructed by authorities.

                  </div>

                )}

              </div>

            </section>

          )}


        {/* ====================================================
            RESULTS
            ==================================================== */}

        {!loading &&
          prediction && (

          <>


            {/* ==================================================
                AI PREDICTION
                ================================================== */}

            <section className="result-card">

              <div className="result-header">

                <div>

                  <p className="section-label">
                    AI PREDICTION
                  </p>

                  <h2>
                    Disaster Risk Analysis
                  </h2>

                </div>


                <div

                  className={`risk-badge ${
                    getRiskClass(
                      prediction.risk
                    )
                  }`}

                >

                  {getRiskIcon(
                    prediction.risk
                  )}

                  {" "}

                  {prediction.risk?.toUpperCase()}

                  {" "}RISK

                </div>

              </div>


              <div className="prediction-main">

                <div className="prediction-icon">

                  {getDisasterIcon(
                    prediction.predicted_disaster
                  )}

                </div>


                <div>

                  <p>
                    Predicted Condition
                  </p>

                  <h3>
                    {prediction.predicted_disaster}
                  </h3>

                </div>


                <div className="probability">

                  <span>
                    Probability
                  </span>

                  <strong>
                    {prediction.probability}%
                  </strong>

                </div>

              </div>

            </section>


            {/* ==================================================
                WEATHER DATA
                ================================================== */}

            <section className="section">

              <div className="section-title">

                <div>

                  <p className="section-label">
                    LIVE DATA
                  </p>

                  <h2>
                    Weather Conditions
                  </h2>

                </div>


                <span className="location">

                  📍 {prediction.city}

                </span>

              </div>


              <div className="weather-grid">


                <div className="weather-card">

                  <div className="weather-icon">
                    🌡️
                  </div>

                  <span>
                    Temperature
                  </span>

                  <strong>
                    {prediction.temperature}°C
                  </strong>

                </div>


                <div className="weather-card">

                  <div className="weather-icon">
                    💧
                  </div>

                  <span>
                    Humidity
                  </span>

                  <strong>
                    {prediction.humidity}%
                  </strong>

                </div>


                <div className="weather-card">

                  <div className="weather-icon">
                    🌧️
                  </div>

                  <span>
                    Rainfall
                  </span>

                  <strong>
                    {prediction.rainfall} mm
                  </strong>

                </div>


                <div className="weather-card">

                  <div className="weather-icon">
                    💨
                  </div>

                  <span>
                    Wind Speed
                  </span>

                  <strong>
                    {prediction.wind_speed} m/s
                  </strong>

                </div>


                <div className="weather-card">

                  <div className="weather-icon">
                    📊
                  </div>

                  <span>
                    Pressure
                  </span>

                  <strong>
                    {prediction.pressure} hPa
                  </strong>

                </div>

              </div>

            </section>


            {/* ==================================================
                DISASTER MAP
                ================================================== */}

            <section className="section">

              <div className="section-title">

                <div>

                  <p className="section-label">
                    LIVE LOCATION
                  </p>

                  <h2>
                    🗺️ Disaster Risk Map
                  </h2>

                </div>


                <span className="location">

                  📍 {prediction.city}

                </span>

              </div>


              <RiskMap />

            </section>


            {/* ==================================================
                OTHER DISASTER RISKS
                ================================================== */}

            <section className="section">

              <div className="section-title">

                <div>

                  <p className="section-label">
                    AI ANALYSIS
                  </p>

                  <h2>
                    Other Disaster Risks
                  </h2>

                </div>

              </div>


              <div className="disaster-grid">


                {/* FLOOD */}

                <div className="disaster-card">

                  <div className="disaster-top">

                    <span className="disaster-icon">
                      🌊
                    </span>

                    <span>
                      Flood
                    </span>

                  </div>


                  <strong>

                    {prediction.flood_probability ?? 0}%

                  </strong>


                  <div className="progress">

                    <div

                      className="progress-fill"

                      style={{
                        width: `${Math.min(
                          prediction.flood_probability ?? 0,
                          100
                        )}%`
                      }}

                    ></div>

                  </div>

                </div>


                {/* CYCLONE */}

                <div className="disaster-card">

                  <div className="disaster-top">

                    <span className="disaster-icon">
                      🌀
                    </span>

                    <span>
                      Cyclone
                    </span>

                  </div>


                  <strong>

                    {prediction.cyclone_probability ?? 0}%

                  </strong>


                  <div className="progress">

                    <div

                      className="progress-fill"

                      style={{
                        width: `${Math.min(
                          prediction.cyclone_probability ?? 0,
                          100
                        )}%`
                      }}

                    ></div>

                  </div>

                </div>


                {/* HEATWAVE */}

                <div className="disaster-card">

                  <div className="disaster-top">

                    <span className="disaster-icon">
                      🔥
                    </span>

                    <span>
                      Heatwave
                    </span>

                  </div>


                  <strong>

                    {prediction.heatwave_probability ?? 0}%

                  </strong>


                  <div className="progress">

                    <div

                      className="progress-fill"

                      style={{
                        width: `${Math.min(
                          prediction.heatwave_probability ?? 0,
                          100
                        )}%`
                      }}

                    ></div>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================================
                SAFETY MESSAGE
                ================================================== */}

            <section className="safety-card">

              <div className="safety-icon">
                🛡️
              </div>


              <div>

                <h2>
                  Safety Information
                </h2>


                {prediction.risk ===
                  "High" && (

                  <p>

                    A high-risk condition has
                    been detected. Follow official
                    emergency instructions and
                    avoid dangerous areas.

                  </p>

                )}


                {prediction.risk ===
                  "Moderate" && (

                  <p>

                    Moderate risk has been
                    detected. Stay alert and
                    continue monitoring official
                    weather updates.

                  </p>

                )}


                {prediction.risk ===
                  "Low" && (

                  <p>

                    No significant disaster risk
                    is currently detected. Continue
                    monitoring weather conditions.

                  </p>

                )}

              </div>

            </section>


            {/* ==================================================
                EMERGENCY CONTACTS
                ================================================== */}

            {prediction.risk ===
              "High" && (

              <section className="contacts-card">

                <h2>
                  📞 Emergency Contacts
                </h2>


                <div className="contacts-grid">


                  <a

                    href="tel:112"

                    className="contact-button"

                  >

                    🚨

                    <span>
                      Emergency
                    </span>

                    <strong>
                      112
                    </strong>

                  </a>


                  <a

                    href="tel:108"

                    className="contact-button"

                  >

                    🚑

                    <span>
                      Ambulance
                    </span>

                    <strong>
                      108
                    </strong>

                  </a>


                  <a

                    href="tel:101"

                    className="contact-button"

                  >

                    🚒

                    <span>
                      Fire & Rescue
                    </span>

                    <strong>
                      101
                    </strong>

                  </a>

                </div>

              </section>

            )}


            {/* ==================================================
                LAST UPDATED
                ================================================== */}

            <div className="last-updated">

              🕒 Last Updated:{" "}

              {lastUpdated ||
                "Just now"}

            </div>

          </>

        )}

      </main>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="footer">

        <p>
          AI Disaster Prediction & Alert System
        </p>

        <span>
          Weather data powered by OpenWeather
        </span>

      </footer>

    </div>
  );
}

export default App;