import joblib

model = joblib.load("disaster_model.pkl")

data = [[150, 85, 28, 25]]

prediction = model.predict(data)
probability = model.predict_proba(data)

print("Prediction:", prediction)
print("Probability:", probability)