---
title: '#17 Using K-Nearest Neighbors (KNN) in Business Settings'
description: 'Learn how to apply K-Nearest Neighbors in customer segmentation, recommendation systems, fraud detection and more'
publishDate: '06 January 2025'
updatedDate: '06 January 2025'
coverImage:
  src: './cover.webp'
  alt: 'kNN in Business'
tags: ['Machine Learning', 'KNN', 'AI']
---

# An Extensive Guide to Using K-Nearest Neighbors (KNN) in Business Settings

## Understanding K-Nearest Neighbors (KNN)

K-Nearest Neighbors (KNN) is a simple yet versatile supervised machine learning algorithm. It is primarily used for classification and regression problems by finding the \( k \)-closest data points (neighbors) to a query point in a feature space. 

The core idea behind KNN is the principle of similarity: points with similar features are often close to each other. The algorithm identifies the neighbors and uses their attributes or labels to predict the query point's outcome.

### How KNN Works
1. **Feature Representation**: Represent data points in an \( n \)-dimensional feature space.
2. **Distance Measurement**: Calculate the distance between points using a metric like Euclidean, Manhattan, or Minkowski.
3. **Neighbor Selection**: Choose the \( k \) nearest neighbors.
4. **Prediction**:
   - **Classification**: Assign the majority class among the neighbors.
   - **Regression**: Compute the average (or weighted average) of the neighbors' values.

### Advantages
- Simple and intuitive.
- Non-parametric (no assumptions about data distribution).
- Versatile for both classification and regression.

### Challenges
- Computationally expensive with large datasets.
- Sensitive to noise and irrelevant features.
- Performance depends on choosing \( k \) and the distance metric.

## Applications of KNN in Business Settings

Below are specific business cases where KNN can provide value. Each case includes a practical implementation with Python code.

### 1. Customer Segmentation

**Scenario**: A retail store wants to group customers based on behavior such as age, income, and purchase frequency to target marketing efforts.

**Approach**:
- Use KNN to classify customers into segments (e.g., high-spending, frequent shoppers).
- Normalize features (e.g., income, purchase frequency) to ensure equal contribution to distance metrics.

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier

# Sample customer data
data = {
    "Age": [25, 45, 35, 23, 41],
    "Income": [50000, 80000, 65000, 48000, 72000],
    "Purchases": [15, 40, 25, 12, 30],
    "Segment": [0, 1, 0, 0, 1]  # 0: Regular, 1: High-spending
}
df = pd.DataFrame(data)

# Prepare features and target
X = df[["Age", "Income", "Purchases"]]
y = df["Segment"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Normalize features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# KNN model
knn = KNeighborsClassifier(n_neighbors=3)
knn.fit(X_train, y_train)

# Predict and evaluate
predictions = knn.predict(X_test)
print(predictions)
```

### 2. Recommendation Systems

**Scenario**: An e-commerce platform recommends products to users based on their preferences or purchase history.

**Approach**:
- Represent users and products in a feature space (e.g., ratings, purchase counts).
- Use KNN to find users with similar profiles and recommend products they liked.

```python
import numpy as np

# Sample user-item matrix (rows: users, columns: products)
user_item_matrix = np.array([
    [5, 0, 0, 4],
    [4, 0, 0, 5],
    [0, 3, 4, 0],
    [0, 5, 0, 3]
])

from sklearn.neighbors import NearestNeighbors

# Train KNN for recommendations
knn = NearestNeighbors(n_neighbors=2, metric="cosine")
knn.fit(user_item_matrix)

# Recommend for user 0
distances, indices = knn.kneighbors([user_item_matrix[0]])
print(f"Recommended neighbors for user 0: {indices}")
```

### 3. Fraud Detection

**Scenario**: A bank wants to identify potentially fraudulent transactions by analyzing past transaction data.

**Approach**:
- Train KNN on labeled transactions (fraudulent or non-fraudulent).
- Predict the likelihood of new transactions being fraudulent.

```python
# Fraud detection data
data = {
    "Transaction_Amount": [200, 5000, 150, 4000, 300],
    "Transaction_Frequency": [5, 2, 10, 1, 7],
    "Fraudulent": [0, 1, 0, 1, 0]
}
df = pd.DataFrame(data)

X = df[["Transaction_Amount", "Transaction_Frequency"]]
y = df["Fraudulent"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Normalize data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# KNN for fraud detection
knn = KNeighborsClassifier(n_neighbors=3)
knn.fit(X_train, y_train)

predictions = knn.predict(X_test)
print(predictions)
```

### 4. Supply Chain Optimization

**Scenario**: A retailer predicts demand to optimize inventory.

**Approach**:
- Use KNN to forecast demand based on historical data.
- Adjust inventory to prevent stockouts or overstocking.

```python
from sklearn.neighbors import KNeighborsRegressor

# Historical sales data
data = {
    "Week": [1, 2, 3, 4, 5],
    "Promotions": [0, 1, 0, 1, 1],
    "Sales": [200, 300, 250, 350, 400]
}
df = pd.DataFrame(data)

X = df[["Week", "Promotions"]]
y = df["Sales"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# KNN regression for demand forecasting
knn = KNeighborsRegressor(n_neighbors=2)
knn.fit(X_train, y_train)

predictions = knn.predict(X_test)
print(predictions)
```

### 5. Credit Risk Assessment

**Scenario**: A bank assesses the risk of loan applicants based on credit scores and financial history.

**Approach**:
- Classify applicants into "High Risk" or "Low Risk" categories.

```python
data = {
    "Credit_Score": [700, 550, 750, 500, 680],
    "Income": [4000, 2500, 5000, 2000, 3800],
    "Risk": [0, 1, 0, 1, 0]  # 0: Low Risk, 1: High Risk
}
df = pd.DataFrame(data)

X = df[["Credit_Score", "Income"]]
y = df["Risk"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Normalize data
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

knn = KNeighborsClassifier(n_neighbors=3)
knn.fit(X_train, y_train)

predictions = knn.predict(X_test)
print(predictions)
```

## Conclusion

The K-Nearest Neighbors (KNN) algorithm is a powerful and versatile tool that can address a wide range of business challenges. Its simplicity and effectiveness in solving classification and regression problems make it a valuable addition to any data-driven strategy. Beware that not every use case is suited for kNN. But if the case is, then businesses can unlock actionable insights and gain a competitive edge by leveraging KNN while tailoring the approach to fit their specific requirements.

To maximize KNN’s potential, practitioners should carefully preprocess data, select the appropriate distance metric, and tune the hyperparameters (kk and weighting schemes). As with any algorithm, understanding its limitations and addressing them effectively is key to achieving meaningful outcomes.

## TL;DR

- **KNN Overview**:
  - K-Nearest Neighbors (KNN) is a simple and versatile machine learning algorithm used for classification and regression.
  - It relies on the principle of similarity, predicting outcomes based on the closest data points.

- **Key Applications in Business**:
  1. **Customer Segmentation**: Groups customers by behavior (e.g., spending, demographics) to target marketing effectively.
  2. **Recommendation Systems**: Suggests products based on user preferences and similarity to others.
  3. **Fraud Detection**: Identifies potentially fraudulent transactions by analyzing past data.
  4. **Supply Chain Optimization**: Forecasts demand to manage inventory efficiently.
  5. **Credit Risk Assessment**: Categorizes loan applicants into risk levels for better decision-making.

- **Strengths and Limitations**:
  - **Strengths**: Simple, non-parametric, and applicable to diverse scenarios.
  - **Limitations**: Computationally intensive for large datasets, sensitive to noise, and requires careful parameter tuning.

- **Best Practices**:
  - Preprocess data carefully (e.g., normalization).
  - Choose appropriate distance metrics and optimize hyperparameters (\(k\), weighting schemes).
  - Tailor implementation to specific business use cases for optimal results.
