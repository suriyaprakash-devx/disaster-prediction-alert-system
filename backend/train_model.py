import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load dataset
data = pd.read_csv("dataset.csv")

# Features
X = data[
    [
        "temperature",
        "humidity",
        "rainfall",
        "wind_speed",
        "pressure"
    ]
]

# Target
y = data["disaster"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Create model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

# Train
model.fit(X_train, y_train)

# Test
predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("Model accuracy:", accuracy)

# Save model
joblib.dump(
    model,
    "disaster_model.pkl"
)

print("disaster_model.pkl created successfully!")