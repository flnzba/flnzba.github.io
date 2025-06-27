---
title: '#40 Understanding Backpropagation in Deep Learning Networks'
description: 'Explaining Backpropagation algorithm, its significance in training neural networks, and how it optimizes weights.'
publishDate: '27 June 2025'
updatedDate: '27 June 2025'
# coverImage:
#     src: ''
#     alt: ''
tags: ['Deep Learning', 'Neural Networks', 'Machine Learning']
---

## Understanding Backpropagation in Deep Learning Networks

Deep learning networks, with their layers of interconnected "neurons," are incredibly powerful for tasks like image recognition, natural language processing, and complex decision-making. But how do these networks _learn_? The answer lies in a fundamental algorithm called **backpropagation**.

At its core, backpropagation is the engine that allows neural networks to adjust their internal parameters (weights and biases) to minimize the difference between their predicted output and the desired output. It's an efficient way to compute the **gradient** of the loss function with respect to the network's weights, enabling the network to learn through gradient descent.

### The Challenge of Training

Imagine a simple neural network. When you feed it an input, it produces an output. If this output is wrong, how do you know which specific connections (weights) and neuron biases were responsible for the error, and by how much should each be adjusted? Intuitively, connections that contributed more to the error should be changed more. Backpropagation provides a systematic, mathematical way to do this.

### The Core Idea: Gradient Descent and the Chain Rule

Training a neural network is an optimization problem: we want to find the set of weights and biases that minimizes a chosen **loss function** (e.g., mean squared error). Gradient descent is an iterative optimization algorithm that moves parameters in the direction opposite to the gradient of the loss function, effectively "downhill" towards the minimum.

Backpropagation leverages the **chain rule** from calculus to efficiently compute these gradients. The chain rule allows us to calculate the derivative of a composite function. In a neural network, the error depends on the output, the output depends on the net input, and the net input depends on the weights and previous layer's outputs. By working backward from the output error, we can determine each weight's contribution to that error.

Let's illustrate backpropagation with the network example we discussed, which has one input neuron (1), one hidden neuron (2), and one output neuron (3), all using logistic activation functions.

### Step 1: The Forward Pass (Prediction)

Before we can correct errors, the network must first make a prediction. This is the "forward pass," where input signals propagate through the network, layer by layer, to produce an output.

For each neuron \(j\), its **net input** \(net_j\) is the weighted sum of its inputs plus its bias:

$$
net_j = \sum_i (w_{j,i} \cdot o_i) + w_{j,0}
$$

where \(o*i\) is the output of the preceding neuron \(i\), and \(w*{j,0}\) is the bias.

The neuron's **output** \(o_j\) is then calculated by applying the activation function \(f\) to its net input:

$$
o_j = f(net_j) = \frac{1}{1 + e^{-net_j}}
$$

**Example: Forward Pass Calculation**

Given: Input \(o*1 = 0.2\), Desired Output \(T = 0.7\).
Weights: \(w*{2,1} = 0.2\), \(w*{2,0} = 0.1\), \(w*{3,2} = 0.3\), \(w\_{3,0} = 0.1\).

1.  **Neuron 2 (Hidden Layer):**

    -   Net Input: \(net*2 = (w*{2,1} \cdot o*1) + w*{2,0} = (0.2 \cdot 0.2) + 0.1 = 0.04 + 0.1 = 0.14\)
    -   Output: \(o_2 = \frac{1}{1 + e^{-0.14}} \approx 0.5349\)

2.  **Neuron 3 (Output Layer):**
    -   Net Input: \(net*3 = (w*{3,2} \cdot o*2) + w*{3,0} = (0.3 \cdot 0.5349) + 0.1 = 0.16047 + 0.1 = 0.26047\)
    -   Output: \(o_3 = \frac{1}{1 + e^{-0.26047}} \approx 0.5647\)

So, the network's output for this input is approximately \(0.5647\). The error is \(E = \frac{1}{2}(0.7 - 0.5647)^2\).

### Step 2: The Backward Pass (Error Attribution)

This is where backpropagation gets its name. The error is propagated backward from the output layer through the hidden layers. For each neuron, we calculate an "error term" or "delta value" (\(\delta\)), which quantifies how much a change in that neuron's net input would affect the total error.

The derivative of the logistic activation function \(f(x) = \frac{1}{1 + e^{-x}}\) is \(f'(x) = f(x)(1 - f(x))\), which can also be written as \(o_j(1 - o_j)\) when evaluated at the neuron's output.

**a. Output Layer \(\delta\) (Neuron 3):**

For an output neuron \(k\), its \(\delta\) value is calculated based on the difference between the desired target output \(T\) and its actual output \(o_k\), scaled by the derivative of its activation function:

$$
\delta_k = (o_k - T) \cdot f'(net_k) = (o_k - T) \cdot o_k (1 - o_k)
$$

_Note: Some conventions define \(\delta_k = (T - o_k) \cdot f'(net_k)\). The sign consistently propagates to the weight updates._

**Example: \(\delta_3\) Calculation**
Using \(o_3 \approx 0.5647\) and \(T = 0.7\):

$$
\delta_3 = (0.5647 - 0.7) \cdot 0.5647 \cdot (1 - 0.5647)
$$

$$
\delta_3 = (-0.1353) \cdot 0.5647 \cdot 0.4353
$$

$$
\delta_3 \approx -0.03326
$$

**b. Hidden Layer \(\delta\) (Neuron 2):**

For a hidden neuron \(j\), its \(\delta\) value depends on the \(\delta\) values of the neurons in the _next_ layer that it connects to, weighted by the strength of those connections. This is how the error propagates backward:

$$
\delta_j = f'(net_j) \sum_k (\delta_k w_{k,j}) = o_j (1 - o_j) \sum_k (\delta_k w_{k,j})
$$

Here, the summation is over all neurons \(k\) in the subsequent layer that neuron \(j\) feeds into.

**Example: \(\delta_2\) Calculation**
Neuron 2 only feeds into Neuron 3.
Using \(o*2 \approx 0.5349\), \(\delta_3 \approx -0.03326\), and \(w*{3,2} = 0.3\):

$$
\delta_2 = 0.5349 \cdot (1 - 0.5349) \cdot (\delta_3 \cdot w_{3,2})
$$

$$
\delta_2 = 0.5349 \cdot 0.4651 \cdot (-0.03326 \cdot 0.3)
$$

$$
\delta_2 = 0.2488 \cdot (-0.009978)
$$

$$
\delta_2 \approx -0.002483
$$

### Step 3: Calculating Weight Gradients

Once the \(\delta\) values are computed for all neurons, we can calculate the **gradient** of the error with respect to each individual weight. This tells us how much changing a specific weight will affect the total error.

The partial derivative of the error \(E\) with respect to a weight \(w\_{j,i}\) (connecting neuron \(i\) to neuron \(j\)) is given by:

$$
\frac{\partial E}{\partial w_{j,i}} = -\delta_j \cdot o_i
$$

For bias weights \(w\_{j,0}\), the input \(o_i\) is implicitly 1:

$$
\frac{\partial E}{\partial w_{j,0}} = -\delta_j \cdot 1 = -\delta_j
$$

**Example: Weight Gradients Calculation**

-   **For \(w\_{3,2}\) (from Neuron 2 to Neuron 3):**

    $$
    \frac{\partial E}{\partial w_{3,2}} = -\delta_3 \cdot o_2 = -(-0.03326) \cdot 0.5349 \approx 0.01779
    $$

-   **For \(w\_{3,0}\) (bias for Neuron 3):**

    $$
    \frac{\partial E}{\partial w_{3,0}} = -\delta_3 = -(-0.03326) = 0.03326
    $$

-   **For \(w\_{2,1}\) (from Neuron 1 to Neuron 2):**

    $$
    \frac{\partial E}{\partial w_{2,1}} = -\delta_2 \cdot o_1 = -(-0.002483) \cdot 0.2 \approx 0.000497
    $$

-   **For \(w\_{2,0}\) (bias for Neuron 2):**
    $$
    \frac{\partial E}{\partial w_{2,0}} = -\delta_2 = -(-0.002483) = 0.002483
    $$

### Step 4: Weight Update

Finally, with the gradients calculated, we can update each weight to reduce the error. The weight update rule is:

$$
w_{new} = w_{old} - \eta \cdot \frac{\partial E}{\partial w_{old}}
$$

where \(\eta\) (eta) is the **learning rate**, a small positive value that controls the step size of the adjustment. A larger learning rate can lead to faster but potentially unstable learning, while a smaller one can be slower but more stable.

**Example: Weight Update for \(w\_{3,2}\)**
Assuming a learning rate \(\eta = 0.1\):

$$
w_{3,2, new} = w_{3,2, old} - \eta \cdot \frac{\partial E}{\partial w_{3,2}}
$$

$$
w_{3,2, new} = 0.3 - 0.1 \cdot (0.01779)
$$

$$
w_{3,2, new} = 0.3 - 0.001779 \approx 0.298221
$$

This updated weight will be slightly different, and when the network performs another forward pass with this new weight, it should ideally produce an output closer to the target \(0.7\).

### Conclusion

Backpropagation is an iterative process. The steps (forward pass, calculate deltas, calculate gradients, update weights) are repeated many times for many input-output pairs (epochs) until the network's error is minimized to an acceptable level. It's the cornerstone algorithm that makes training deep neural networks feasible, allowing them to learn complex patterns and make increasingly accurate predictions. Understanding its mechanics is crucial for anyone working with deep learning.
