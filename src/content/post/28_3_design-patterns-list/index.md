---
title: '#28.3 Part 3/3 Basics of Software Architecture and Design Patterns'
description: 'Explore design patterns in software development, their benefits, and how to start implementing them.'
publishDate: '20 February 2025'
updatedDate: '20 February 2025'
coverImage:
    src: './cover.webp'
    alt: 'Design Patterns in Software Development'
tags: ['architecture', 'design-pattern']
---

## Intro 3

The last part of the design pattern series is all about examples and practical implementations. We will dive into the different types and principles of design patterns and how they can be used in your projects.

## **Design Patterns in Software Development**

### **1. Creational Patterns (Object Creation Mechanisms)**

- **Singleton**: Ensures only one instance of a class is created and provides a global point of access to it.
- **Factory Method**: Creates objects without specifying the exact class to create.
- **Abstract Factory**: Provides an interface for creating families of related or dependent objects without specifying their concrete classes.
- **Builder**: Separates the construction of a complex object from its representation.
- **Prototype**: Creates new objects by copying an existing object, known as the prototype.

### **2. Structural Patterns (Composition of Classes or Objects)**

- **Adapter (Wrapper)**: Allows incompatible interfaces to work together.
- **Bridge**: Separates an object’s abstraction from its implementation.
- **Composite**: Composes objects into tree structures to represent part-whole hierarchies.
- **Decorator**: Adds new functionality to an object dynamically.
- **Facade**: Provides a simplified interface to a complex system.
- **Flyweight**: Reduces memory usage by sharing common parts of state between multiple objects.
- **Proxy**: Provides a placeholder for another object to control access to it.

### **3. Behavioral Patterns (Communication Between Objects)**

- **Chain of Responsibility**: Passes requests along a chain of handlers.
- **Command**: Encapsulates a request as an object, allowing for parameterization of requests.
- **Interpreter**: Defines a grammar for interpreting sentences in a language.
- **Iterator**: Provides a way to access elements of a collection sequentially.
- **Mediator**: Reduces coupling between classes by centralizing communication.
- **Memento**: Captures and restores an object’s internal state.
- **Observer (Publish-Subscribe)**: Defines a dependency between objects so that when one changes state, all dependents are notified.
- **State**: Allows an object to alter its behavior when its internal state changes.
- **Strategy**: Defines a family of algorithms, encapsulates each one, and makes them interchangeable.
- **Template Method**: Defines the skeleton of an algorithm, deferring steps to subclasses.
- **Visitor**: Adds new operations to a class hierarchy without modifying the classes.

### **4. Concurrency Patterns (Managing Multi-threaded Applications)**

- **Active Object**: Decouples method execution from method invocation.
- **Balking**: Prevents an operation from being executed if the object is in an improper state.
- **Double-Checked Locking**: Reduces overhead when initializing resources in a multithreaded environment.
- **Guarded Suspension**: Manages operations that require preconditions to be met.
- **Monitor Object**: Synchronizes access to an object across multiple threads.
- **Read-Write Lock**: Allows multiple readers or one writer at a time.
- **Thread Pool**: Manages a pool of worker threads to efficiently handle multiple tasks.

### **5. Architectural Patterns (High-Level Structures of Software Systems)**

- **Layered Architecture (n-tier)**: Organizes the system into layers with specific responsibilities.
- **Client-Server**: Separates the client and server roles.
- **Master-Slave**: Separates distributed processes into masters and slaves.
- **Pipe and Filter**: Breaks down processes into a sequence of processing stages.
- **Model-View-Controller (MVC)**: Separates concerns into Model, View, and Controller.
- **Model-View-ViewModel (MVVM)**: Separates logic and UI, common in frameworks like WPF.
- **Microservices Architecture**: Structures an application as a collection of small, independent services.
- **Event-Driven Architecture**: Uses events to trigger communication between decoupled services.
- **Space-Based Architecture**: Reduces the load on databases by using in-memory data grids.
- **Service-Oriented Architecture (SOA)**: Builds systems from reusable services.

### **6. Cloud-Native and Distributed Systems Patterns**

- **Circuit Breaker**: Prevents repeated execution of failed requests.
- **API Gateway**: Acts as a single entry point for all microservices.
- **Service Mesh**: Manages service-to-service communication.
- **Sidecar Pattern**: Attaches additional functionality to a service without modifying it.
- **Saga Pattern**: Manages distributed transactions using compensating transactions.
- **CQRS (Command Query Responsibility Segregation)**: Separates commands from queries.
- **Event Sourcing**: Stores the state changes as a sequence of events.

### **7. Enterprise Integration Patterns**

- **Aggregator**: Combines multiple messages into one.
- **Message Broker**: Routes messages between services.
- **Message Queue**: Manages the delivery of messages between services.
- **Content-Based Router**: Routes messages based on their content.
- **Publish-Subscribe Channel**: Sends messages to multiple subscribers.

Now let's dive into some practical examples of these design patterns in Python!

## **1. Creational Patterns**

### **Singleton Pattern**

Ensures a class has only one instance and provides a global point of access.

#### **Example in Python:**

```python
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Usage
s1 = Singleton()
s2 = Singleton()
print(s1 is s2)  # True
```

### **Factory Method**

Defines an interface for creating objects but lets subclasses alter the type of objects that will be created.

#### **Example:**

```python
from abc import ABC, abstractmethod

class Product(ABC):
    @abstractmethod
    def operation(self):
        pass

class ConcreteProductA(Product):
    def operation(self):
        return "Product A"

class ConcreteProductB(Product):
    def operation(self):
        return "Product B"

class Factory:
    @staticmethod
    def create_product(type_):
        if type_ == "A":
            return ConcreteProductA()
        elif type_ == "B":
            return ConcreteProductB()
        raise ValueError("Unknown product type")

# Usage
product = Factory.create_product("A")
print(product.operation())  # "Product A"
```

### **Abstract Factory**

Provides an interface for creating families of related or dependent objects.

#### **Example:**

```python
class AbstractFactory(ABC):
    @abstractmethod
    def create_product(self):
        pass

class ConcreteFactoryA(AbstractFactory):
    def create_product(self):
        return ConcreteProductA()

class ConcreteFactoryB(AbstractFactory):
    def create_product(self):
        return ConcreteProductB()

# Usage
factory = ConcreteFactoryA()
product = factory.create_product()
print(product.operation())  # "Product A"
```

### **Builder Pattern**

Separates object construction from its representation.

#### **Example:**

```python
class Product:
    def __init__(self):
        self.parts = []

    def add(self, part):
        self.parts.append(part)

    def show(self):
        print(", ".join(self.parts))

class Builder:
    def build_part(self):
        pass

class ConcreteBuilder(Builder):
    def __init__(self):
        self.product = Product()

    def build_part(self):
        self.product.add("Part A")
        self.product.add("Part B")

    def get_result(self):
        return self.product

# Usage
builder = ConcreteBuilder()
builder.build_part()
product = builder.get_result()
product.show()  # "Part A, Part B"
```

### **Prototype Pattern**

Creates objects by cloning an existing object.

#### **Example:**

```python
import copy

class Prototype:
    def clone(self):
        return copy.deepcopy(self)

class ConcretePrototype(Prototype):
    def __init__(self, value):
        self.value = value

# Usage
prototype = ConcretePrototype([1, 2, 3])
clone = prototype.clone()
print(clone.value)  # [1, 2, 3]
```

---

## **2. Structural Patterns**

### **Adapter Pattern**

Allows incompatible interfaces to work together.

#### **Example:**

```python
class OldSystem:
    def specific_request(self):
        return "Old system output"

class Adapter:
    def __init__(self, old_system):
        self.old_system = old_system

    def request(self):
        return self.old_system.specific_request()

# Usage
adapter = Adapter(OldSystem())
print(adapter.request())  # "Old system output"
```

### **Bridge Pattern**

Separates abstraction from implementation.

#### **Example:**

```python
class Implementation:
    def operation(self):
        pass

class ConcreteImplementationA(Implementation):
    def operation(self):
        return "ConcreteImplementationA"

class Abstraction:
    def __init__(self, implementation):
        self.implementation = implementation

    def operation(self):
        return self.implementation.operation()

# Usage
implementation = ConcreteImplementationA()
abstraction = Abstraction(implementation)
print(abstraction.operation())  # "ConcreteImplementationA"
```

### **Decorator Pattern**

Dynamically adds behavior to objects.

#### **Example:**

```python
class Component:
    def operation(self):
        pass

class ConcreteComponent(Component):
    def operation(self):
        return "ConcreteComponent"

class Decorator(Component):
    def __init__(self, component):
        self.component = component

    def operation(self):
        return f"Decorator({self.component.operation()})"

# Usage
component = ConcreteComponent()
decorated = Decorator(component)
print(decorated.operation())  # "Decorator(ConcreteComponent)"
```

### **Facade Pattern**

Provides a simplified interface to a complex subsystem.

#### **Example:**

```python
class SubsystemA:
    def operation(self):
        return "SubsystemA"

class SubsystemB:
    def operation(self):
        return "SubsystemB"

class Facade:
    def __init__(self):
        self.subsystemA = SubsystemA()
        self.subsystemB = SubsystemB()

    def operation(self):
        return f"{self.subsystemA.operation()} + {self.subsystemB.operation()}"

# Usage
facade = Facade()
print(facade.operation())  # "SubsystemA + SubsystemB"
```

---

## **3. Behavioral Patterns**

### **Observer Pattern**

Allows objects to notify others of state changes.

#### **Example:**

```python
class Subject:
    def __init__(self):
        self._observers = []

    def attach(self, observer):
        self._observers.append(observer)

    def notify(self, message):
        for observer in self._observers:
            observer.update(message)

class Observer:
    def update(self, message):
        print(f"Observer received: {message}")

# Usage
subject = Subject()
observer = Observer()
subject.attach(observer)
subject.notify("Hello, World!")  # "Observer received: Hello, World!"
```

### **Command Pattern**

Encapsulates a request as an object.

#### **Example:**

```python
class Command:
    def execute(self):
        pass

class ConcreteCommand(Command):
    def __init__(self, receiver):
        self.receiver = receiver

    def execute(self):
        self.receiver.action()

class Receiver:
    def action(self):
        print("Action executed")

# Usage
receiver = Receiver()
command = ConcreteCommand(receiver)
command.execute()  # "Action executed"
```

### **State Pattern**

Allows an object to change its behavior when its internal state changes.

#### **Example:**

```python
class State:
    def handle(self):
        pass

class ConcreteStateA(State):
    def handle(self):
        return "State A"

class ConcreteStateB(State):
    def handle(self):
        return "State B"

class Context:
    def __init__(self, state):
        self.state = state

    def request(self):
        return self.state.handle()

# Usage
context = Context(ConcreteStateA())
print(context.request())  # "State A"
context.state = ConcreteStateB()
print(context.request())  # "State B"
```

---

## **3. Behavioral Patterns (continued)**

### **Chain of Responsibility Pattern**

Passes requests along a chain of handlers.

#### **Example:**

```python
class Handler:
    def __init__(self, successor=None):
        self.successor = successor

    def handle_request(self, request):
        if self.successor:
            self.successor.handle_request(request)

class ConcreteHandlerA(Handler):
    def handle_request(self, request):
        if request == "A":
            print("Handled by HandlerA")
        else:
            super().handle_request(request)

class ConcreteHandlerB(Handler):
    def handle_request(self, request):
        if request == "B":
            print("Handled by HandlerB")
        else:
            super().handle_request(request)

# Usage
handler_chain = ConcreteHandlerA(ConcreteHandlerB())
handler_chain.handle_request("B")  # "Handled by HandlerB"
```

### **Mediator Pattern**

Reduces coupling by centralizing communication between objects.

#### **Example:**

```python
class Mediator:
    def notify(self, sender, event):
        pass

class ConcreteMediator(Mediator):
    def __init__(self, component1, component2):
        self.component1 = component1
        self.component2 = component2
        self.component1.mediator = self
        self.component2.mediator = self

    def notify(self, sender, event):
        if event == "A":
            self.component2.react("A")
        elif event == "B":
            self.component1.react("B")

class Component:
    def __init__(self):
        self.mediator = None

class Component1(Component):
    def do_a(self):
        print("Component1 does A")
        self.mediator.notify(self, "A")

    def react(self, event):
        print(f"Component1 reacts to {event}")

class Component2(Component):
    def do_b(self):
        print("Component2 does B")
        self.mediator.notify(self, "B")

    def react(self, event):
        print(f"Component2 reacts to {event}")

# Usage
component1 = Component1()
component2 = Component2()
mediator = ConcreteMediator(component1, component2)

component1.do_a()
# Component1 does A
# Component2 reacts to A

component2.do_b()
# Component2 does B
# Component1 reacts to B
```

### **Memento Pattern**

Captures and restores an object’s state.

#### **Example:**

```python
class Memento:
    def __init__(self, state):
        self.state = state

class Originator:
    def __init__(self, state):
        self.state = state

    def create_memento(self):
        return Memento(self.state)

    def restore(self, memento):
        self.state = memento.state

class Caretaker:
    def __init__(self):
        self.mementos = []

    def add_memento(self, memento):
        self.mementos.append(memento)

    def get_memento(self, index):
        return self.mementos[index]

# Usage
originator = Originator("State1")
caretaker = Caretaker()

caretaker.add_memento(originator.create_memento())

originator.state = "State2"
originator.restore(caretaker.get_memento(0))

print(originator.state)  # "State1"
```

### **Strategy Pattern**

Encapsulates algorithms into interchangeable modules.

#### **Example:**

```python
class Strategy:
    def execute(self, a, b):
        pass

class AddStrategy(Strategy):
    def execute(self, a, b):
        return a + b

class SubtractStrategy(Strategy):
    def execute(self, a, b):
        return a - b

class Context:
    def __init__(self, strategy):
        self.strategy = strategy

    def execute_strategy(self, a, b):
        return self.strategy.execute(a, b)

# Usage
context = Context(AddStrategy())
print(context.execute_strategy(5, 3))  # 8

context.strategy = SubtractStrategy()
print(context.execute_strategy(5, 3))  # 2
```

### **Template Method Pattern**

Defines the skeleton of an algorithm in a base class but lets subclasses override specific steps.

#### **Example:**

```python
from abc import ABC, abstractmethod

class AbstractClass(ABC):
    def template_method(self):
        self.step_one()
        self.step_two()
        self.hook()

    @abstractmethod
    def step_one(self):
        pass

    @abstractmethod
    def step_two(self):
        pass

    def hook(self):
        pass

class ConcreteClass(AbstractClass):
    def step_one(self):
        print("Step 1 implemented by ConcreteClass")

    def step_two(self):
        print("Step 2 implemented by ConcreteClass")

    def hook(self):
        print("Optional hook executed")

# Usage
obj = ConcreteClass()
obj.template_method()
# Step 1 implemented by ConcreteClass
# Step 2 implemented by ConcreteClass
# Optional hook executed
```

### **Visitor Pattern**

Separates operations from the object structure, allowing new operations without modifying objects.

#### **Example:**

```python
class Visitor:
    def visit_concrete_element_a(self, element):
        pass

    def visit_concrete_element_b(self, element):
        pass

class ConcreteVisitor(Visitor):
    def visit_concrete_element_a(self, element):
        print(f"Visiting {element}")

    def visit_concrete_element_b(self, element):
        print(f"Visiting {element}")

class Element:
    def accept(self, visitor):
        pass

class ConcreteElementA(Element):
    def accept(self, visitor):
        visitor.visit_concrete_element_a(self)

class ConcreteElementB(Element):
    def accept(self, visitor):
        visitor.visit_concrete_element_b(self)

# Usage
visitor = ConcreteVisitor()
elementA = ConcreteElementA()
elementB = ConcreteElementB()

elementA.accept(visitor)  # Visiting <__main__.ConcreteElementA object>
elementB.accept(visitor)  # Visiting <__main__.ConcreteElementB object>
```

---

## **4. Concurrency Patterns**

### **Thread Pool Pattern**

Manages a pool of threads to execute tasks concurrently.

#### **Example:**

```python
from concurrent.futures import ThreadPoolExecutor
import time

def worker_function(task_id):
    print(f"Task {task_id} is starting")
    time.sleep(1)
    print(f"Task {task_id} is completed")

# Usage
with ThreadPoolExecutor(max_workers=3) as executor:
    for i in range(5):
        executor.submit(worker_function, i)
```

### **Read-Write Lock Pattern**

Allows concurrent reads but exclusive writes.

#### **Example:**

```python
import threading

class ReadWriteLock:
    def __init__(self):
        self.readers = 0
        self.lock = threading.Lock()
        self.read_lock = threading.Lock()

    def acquire_read(self):
        with self.read_lock:
            self.readers += 1
            if self.readers == 1:
                self.lock.acquire()

    def release_read(self):
        with self.read_lock:
            self.readers -= 1
            if self.readers == 0:
                self.lock.release()

    def acquire_write(self):
        self.lock.acquire()

    def release_write(self):
        self.lock.release()

# Usage
lock = ReadWriteLock()

def reader():
    lock.acquire_read()
    print(f"{threading.current_thread().name} is reading")
    lock.release_read()

def writer():
    lock.acquire_write()
    print(f"{threading.current_thread().name} is writing")
    lock.release_write()

threading.Thread(target=reader).start()
threading.Thread(target=writer).start()
```

### **Double-Checked Locking Pattern**

Ensures that only one instance of a resource is created, with minimal synchronization overhead.

#### **Example:**

```python
import threading

class Singleton:
    _instance = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

# Usage
def test_singleton():
    singleton = Singleton.get_instance()
    print(f"Instance: {id(singleton)}")

thread1 = threading.Thread(target=test_singleton)
thread2 = threading.Thread(target=test_singleton)

thread1.start()
thread2.start()

thread1.join()
thread2.join()
```

---

## **5. Architectural Patterns**

### **Layered Architecture Pattern**

Separates concerns into different layers (e.g., Presentation, Business Logic, Data).

#### **Example:**

```python
# Data Layer
class DataLayer:
    def get_data(self):
        return "Data from database"

# Business Logic Layer
class BusinessLogicLayer:
    def __init__(self, data_layer):
        self.data_layer = data_layer

    def process_data(self):
        data = self.data_layer.get_data()
        return data.upper()

# Presentation Layer
class PresentationLayer:
    def __init__(self, business_logic_layer):
        self.business_logic_layer = business_logic_layer

    def display(self):
        result = self.business_logic_layer.process_data()
        print(f"Presentation: {result}")

# Usage
data_layer = DataLayer()
business_layer = BusinessLogicLayer(data_layer)
presentation_layer = PresentationLayer(business_layer)

presentation_layer.display()
# Presentation: DATA FROM DATABASE
```

### **Model-View-Controller (MVC) Pattern**

Separates application logic (Model), user interface (View), and input handling (Controller).

#### **Example:**

```python
class Model:
    def __init__(self):
        self.data = "Hello MVC"

class View:
    def show(self, data):
        print(f"View displaying: {data}")

class Controller:
    def __init__(self, model, view):
        self.model = model
        self.view = view

    def update_view(self):
        data = self.model.data
        self.view.show(data)

# Usage
model = Model()
view = View()
controller = Controller(model, view)

controller.update_view()
# View displaying: Hello MVC
```

### **Microservices Pattern**

Separates functionality into small, independently deployable services.

#### **Example:**

```python
from flask import Flask

app = Flask(__name__)

@app.route('/service1')
def service1():
    return "Service 1: User Management"

@app.route('/service2')
def service2():
    return "Service 2: Order Processing"

if __name__ == '__main__':
    app.run(port=5000)
```

---

## **6. Cloud-Native and Distributed Systems Patterns**

### **Circuit Breaker Pattern**

Prevents a system from trying to execute an operation that is likely to fail.

#### **Example:**

```python
import time
import random

class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=5):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "CLOSED"

    def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                self.state = "HALF-OPEN"
            else:
                raise Exception("Circuit is open, call blocked")

        try:
            result = func(*args, **kwargs)
            self.failures = 0
            if self.state == "HALF-OPEN":
                self.state = "CLOSED"
            return result
        except Exception as e:
            self.failures += 1
            if self.failures >= self.failure_threshold:
                self.state = "OPEN"
                self.last_failure_time = time.time()
            raise Exception("Request failed, circuit breaker activated")

# Usage
def unstable_service():
    if random.random() < 0.7:
        raise Exception("Service failed")
    return "Success"

breaker = CircuitBreaker()

for i in range(10):
    try:
        print(breaker.call(unstable_service))
    except Exception as e:
        print(e)
    time.sleep(1)
```

### **API Gateway Pattern**

Acts as a single entry point for a set of microservices.

#### **Example:**

```python
from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

MICROSERVICE_1_URL = "http://localhost:5001"
MICROSERVICE_2_URL = "http://localhost:5002"

@app.route('/user/<user_id>')
def get_user_info(user_id):
    response = requests.get(f"{MICROSERVICE_1_URL}/users/{user_id}")
    return response.json()

@app.route('/orders/<user_id>')
def get_user_orders(user_id):
    response = requests.get(f"{MICROSERVICE_2_URL}/orders/{user_id}")
    return response.json()

# Run with: python api_gateway.py
if __name__ == '__main__':
    app.run(port=5000)
```

### **Service Mesh Pattern**

Manages service-to-service communication within a microservices architecture.

#### **Example (Istio/Kubernetes Conceptual Example):**

```yaml
# istio-gateway.yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
    name: service-mesh-gateway
spec:
    selector:
        istio: ingressgateway
    servers:
        - port:
              number: 80
              name: http
              protocol: HTTP
          hosts:
              - '*'
```

### **Sidecar Pattern**

Attaches additional functionality to a service without altering it (e.g., logging, monitoring).

#### **Example (Conceptual Docker Compose):**

```yaml
version: '3'
services:
    app:
        image: my-app
        ports:
            - '5000:5000'
    sidecar:
        image: logging-sidecar
        volumes:
            - /var/log/app:/app/logs
```

### **Saga Pattern**

Manages distributed transactions using compensating actions.

#### **Example (Compensating Transactions):**

```python
class Saga:
    def __init__(self):
        self.transactions = []
        self.compensations = []

    def add_step(self, transaction, compensation):
        self.transactions.append(transaction)
        self.compensations.append(compensation)

    def execute(self):
        for i, transaction in enumerate(self.transactions):
            try:
                transaction()
            except Exception:
                self.compensate(i)
                break

    def compensate(self, index):
        for compensation in reversed(self.compensations[:index]):
            compensation()

# Usage
def reserve_inventory():
    print("Inventory reserved")

def cancel_inventory():
    print("Inventory reservation cancelled")

def charge_payment():
    print("Payment charged")
    raise Exception("Payment failed")

def refund_payment():
    print("Payment refunded")

saga = Saga()
saga.add_step(reserve_inventory, cancel_inventory)
saga.add_step(charge_payment, refund_payment)
saga.execute()

# Output:
# Inventory reserved
# Payment charged
# Payment refunded
# Inventory reservation cancelled
```

### **CQRS (Command Query Responsibility Segregation) Pattern**

Separates read and write operations for better scalability.

#### **Example:**

```python
class CommandHandler:
    def __init__(self):
        self.data_store = {}

    def update(self, user_id, user_data):
        self.data_store[user_id] = user_data
        print(f"Updated user {user_id}: {user_data}")

class QueryHandler:
    def __init__(self, command_handler):
        self.data_store = command_handler.data_store

    def get_user(self, user_id):
        return self.data_store.get(user_id, "User not found")

# Usage
command_handler = CommandHandler()
query_handler = QueryHandler(command_handler)

command_handler.update(1, {"name": "Alice"})
print(query_handler.get_user(1))  # {"name": "Alice"}
```

### **Event Sourcing Pattern**

Stores state changes as a sequence of events.

#### **Example:**

```python
class EventStore:
    def __init__(self):
        self.events = []

    def add_event(self, event):
        self.events.append(event)

    def get_events(self):
        return self.events

class Account:
    def __init__(self, event_store):
        self.event_store = event_store
        self.balance = 0

    def deposit(self, amount):
        self.event_store.add_event(f"Deposited {amount}")
        self.balance += amount

    def withdraw(self, amount):
        if self.balance >= amount:
            self.event_store.add_event(f"Withdrew {amount}")
            self.balance -= amount
        else:
            print("Insufficient funds")

    def replay_events(self):
        for event in self.event_store.get_events():
            print(event)

# Usage
event_store = EventStore()
account = Account(event_store)

account.deposit(100)
account.withdraw(50)
account.replay_events()

# Output:
# Deposited 100
# Withdrew 50
```

---

## **7. Enterprise Integration Patterns (EIP)**

### **Aggregator Pattern**

Collects messages and combines them into a single message.

#### **Example:**

```python
class Aggregator:
    def __init__(self):
        self.messages = []

    def add_message(self, message):
        self.messages.append(message)

    def aggregate(self):
        return " | ".join(self.messages)

# Usage
aggregator = Aggregator()
aggregator.add_message("Message 1")
aggregator.add_message("Message 2")
print(aggregator.aggregate())  # "Message 1 | Message 2"
```

### **Message Broker Pattern**

Routes messages between services.

#### **Example (Using RabbitMQ):**

```python
import pika

# Publisher
connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='hello')

channel.basic_publish(exchange='', routing_key='hello', body='Hello RabbitMQ!')
print("Sent 'Hello RabbitMQ!'")
connection.close()

# Consumer
def callback(ch, method, properties, body):
    print(f"Received {body}")

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()
channel.queue_declare(queue='hello')

channel.basic_consume(queue='hello', on_message_callback=callback, auto_ack=True)
print('Waiting for messages...')
channel.start_consuming()
```

### **Content-Based Router Pattern**

Routes messages based on content.

#### **Example:**

```python
class ContentBasedRouter:
    def route(self, message):
        if "order" in message:
            self.handle_order(message)
        elif "payment" in message:
            self.handle_payment(message)
        else:
            self.handle_default(message)

    def handle_order(self, message):
        print(f"Order Handler: {message}")

    def handle_payment(self, message):
        print(f"Payment Handler: {message}")

    def handle_default(self, message):
        print(f"Default Handler: {message}")

# Usage
router = ContentBasedRouter()
router.route("This is an order request")
router.route("This is a payment notification")

# Output:
# Order Handler: This is an order request
# Payment Handler: This is a payment notification
```

### **Publish-Subscribe Channel Pattern**

Broadcasts messages to multiple subscribers.

#### **Example:**

```python
from collections import defaultdict

class PubSub:
    def __init__(self):
        self.subscribers = defaultdict(list)

    def subscribe(self, event_type, handler):
        self.subscribers[event_type].append(handler)

    def publish(self, event_type, message):
        for handler in self.subscribers[event_type]:
            handler(message)

# Usage
def log_event(message):
    print(f"Logging: {message}")

def alert_event(message):
    print(f"Alert: {message}")

pubsub = PubSub()
pubsub.subscribe("error", log_event)
pubsub.subscribe("error", alert_event)

pubsub.publish("error", "Disk space low")

# Output:
# Logging: Disk space low
# Alert: Disk space low
```

## Conclusion

You now have a comprehensive guide to **software architecture design patterns**, complete with:

- **Creational Patterns:** Singleton, Factory, Builder, Prototype
- **Structural Patterns:** Adapter, Bridge, Composite, Decorator, Facade
- **Behavioral Patterns:** Observer, Command, Strategy, State, Visitor
- **Concurrency Patterns:** Thread Pool, Read-Write Lock, Circuit Breaker
- **Cloud-Native Patterns:** API Gateway, Saga, CQRS, Event Sourcing
- **Enterprise Integration Patterns (EIP):** Aggregator, Message Broker, Content-Based Router, Pub-Sub
