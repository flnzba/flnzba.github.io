---
title: '#19 (Un)Supervised, (Non-)Parametric ML Methods'
description: 'Discussion of machine learning methods supervised, unsupervised, parametric, and non-parametric.'
publishDate: '11 January 2025'
updatedDate: '11 January 2025'
coverImage:
  src: './cover-ml-methods.webp'
  alt: 'Machine Learning Methods'
tags: ['machine-learning', 'AI', statistics']
---

# Understanding the Landscape of Machine Learning: An In-Depth Analysis

Machine learning (ML) continues to evolve, offering innovative ways to analyze data, predict trends, and automate decision-making processes across various industries. This article provides a detailed overview of the different types of machine learning methods, focusing on supervised, unsupervised, parametric, and non-parametric models.

## Supervised Machine Learning

Supervised learning models are trained using labeled datasets where both input and the corresponding output are provided. These models are designed to predict outcomes based on new data. Here’s a brief look at some common supervised learning methods:

1. **Linear and Logistic Regression**: Linear regression predicts continuous values, while logistic regression is used for binary classification tasks.

   - **Linear Regression Example**:
     ```python
     from sklearn.linear_model import LinearRegression
     model = LinearRegression()
     model.fit(X_train, y_train)
     predictions = model.predict(X_test)
     ```

2. **Decision Trees and Random Forests**: These models are used for both classification and regression tasks. Decision trees split data into subsets based on feature values, whereas random forests are ensembles of decision trees.

   - **Decision Tree Example**:
     ```python
     from sklearn.tree import DecisionTreeClassifier
     model = DecisionTreeClassifier()
     model.fit(X_train, y_train)
     predictions = model.predict(X_test)
     ```

3. **Support Vector Machines (SVMs)**: SVMs are effective in high-dimensional spaces and are capable of defining complex higher-order relationships in data.

   - **SVM Example**:
     ```python
     from sklearn.svm import SVC
     model = SVC()
     model.fit(X_train, y_train)
     predictions = model.predict(X_test)
     ```

4. **Neural Networks**: These models are foundations for deep learning and can model highly intricate relationships in data.

   - **Neural Network Example**:
     ```python
     from tensorflow.keras.models import Sequential
     from tensorflow.keras.layers import Dense
     model = Sequential([Dense(10, activation='relu'), Dense(1)])
     model.compile(optimizer='adam', loss='mse')
     model.fit(X_train, y_train, epochs=10)
     ```

5. **Gradient Boosting Machines (GBMs)**: GBMs are another ensemble technique that builds sequential trees to minimize errors.
   - **Gradient Boosting Example**:
     ```python
     from sklearn.ensemble import GradientBoostingClassifier
     model = GradientBoostingClassifier()
     model.fit(X_train, y_train)
     predictions = model.predict(X_test)
     ```

## Unsupervised Machine Learning

Unlike supervised learning, unsupervised learning algorithms infer patterns from a dataset without reference to known or labeled outcomes:

1. **Clustering (e.g., K-means, Hierarchical)**: Used to group a set of objects in such a way that objects in the same group are more similar to each other than to those in other groups.

   - **K-means Clustering Example**:
     ```python
     from sklearn.cluster import KMeans
     model = KMeans(n_clusters=3)
     model.fit(X)
     labels = model.labels_
     ```

2. **Dimensionality Reduction (e.g., PCA, t-SNE)**: Techniques to reduce the number of random variables under consideration.

   - **PCA Example**:
     ```python
     from sklearn.decomposition import PCA
     model = PCA(n_components=2)
     reduced_data = model.fit_transform(X)
     ```

3. **Association Rules (e.g., Apriori, FP-Growth)**: Aim to find interesting relationships between variables in large databases.

   - **Apriori Example**:
     ```python
     from mlxtend.frequent_patterns import apriori, association_rules
     frequent_itemsets = apriori(df, min_support=0.07, use_colnames=True)
     rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5)
     ```

4. **Anomaly Detection (e.g., Isolation Forest)**: Identifies rare items, events, or observations which raise suspicions by differing significantly from the majority of the data.
   - **Isolation Forest Example**:
     ```python
     from sklearn.ensemble import IsolationForest
     model = IsolationForest()
     model.fit(X)
     anomalies = model.predict(X)
     ```

## Parametric vs. Non-Parametric Models

**Parametric models** assume a predefined form for the model. They simplify the complex problem of modeling by making strong assumptions about the data. Examples include linear regression and logistic regression, where the model structure is clearly defined and involves a specific number of parameters.

**Non-parametric models** do not assume an explicit functional form from the data. They are more flexible and have the capacity to fit a large number of possible shapes and patterns. Non-parametric methods include k-Nearest Neighbors, decision trees, and kernel density estimation. These models typically require more data to make accurate predictions without overfitting.

### Comparison Table of Parametric vs. Non-Parametric Models

| Aspect                | Parametric Models          | Non-Parametric Models     |
| --------------------- | -------------------------- | ------------------------- |
| **Assumptions**       | Fixed functional form      | Flexible, data-driven     |
| **Complexity**        | Fixed number of parameters | Grows with data size      |
| **Data Requirements** | Requires less data         | Requires large data       |
| **Flexibility**       | Limited                    | High                      |
| **Interpretability**  | Easier to interpret        | Often harder to interpret |

## Real-World Applications

Machine learning models are deployed in diverse fields such as finance, healthcare, marketing, and beyond:

- **Finance**: Credit scoring, algorithmic trading, and risk management.
- **Healthcare**: Disease diagnosis, medical imaging, and genetic data interpretation.
- **Marketing**: Customer segmentation, recommendation systems, and targeted advertising.
- **Technology**: Speech recognition, image processing, and autonomous vehicles.

## Challenges and Considerations

While machine learning provides powerful tools for predictive analytics, it also presents challenges such as data privacy, algorithmic bias, and the need for massive computational resources. Additionally, the choice between using a parametric or non-parametric model often depends on the size of the dataset, the complexity of the problem, and the transparency required in modeling.

## Conclusion

In conclusion, machine learning represents a significant area of research and application that profoundly influences technological advancement. An understanding of the diverse types of ML models and methods is essential for concrete implementation proceedings in business case applications (in my opinion).
