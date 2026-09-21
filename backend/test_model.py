import joblib
import pandas as pd

model = joblib.load("disaster_model.pkl")

# Features: temperature, humidity, rainfall, wind_speed, pressure
test_samples = {
    "Delhi Severe Heatwave (45°C)": [[45, 22, 0, 16, 1003]],
    "Nagpur Moderate Heatwave (42°C)": [[42, 28, 0, 12, 1006]],
    "Chennai Coastal Heatwave (39°C, 56% RH)": [[39, 56, 0, 14, 1006]],
    "Bengaluru Pleasant Normal (28°C)": [[28, 55, 2, 10, 1014]],
    "Mumbai Monsoon Flood (180mm rain)": [[29, 92, 180, 15, 1001]],
    "Bay of Bengal Cyclone (48 km/h wind)": [[27, 95, 75, 48, 982]],
}

feature_names = ["temperature", "humidity", "rainfall", "wind_speed", "pressure"]

print("Classes:", list(model.classes_))
print("-" * 60)

for name, sample in test_samples.items():
    df = pd.DataFrame(sample, columns=feature_names)
    prediction = model.predict(df)[0]
    probabilities = dict(zip(model.classes_, [round(p, 3) for p in model.predict_proba(df)[0]]))
    print(f"{name}:")
    print(f"  -> Prediction : {prediction}")
    print(f"  -> Probability: {probabilities}")
    print()