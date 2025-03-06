---
title: '#29 Migrating a Fintech Investment Platform from PHP to Java (Spring Boot)'
description: 'Transforming a fintech investment platform from PHP to Java to improve performance, security, and scalability.'
publishDate: '21 February 2025'
updatedDate: '21 February 2025'
coverImage:
    src: './cover.webp'
    alt: 'Migrating a Fintech Investment Platform from PHP to Java (Spring Boot)'
tags: ['business case', 'php', 'java', 'spring boot', 'fintech']
---

## Project Overview

Legacy code can be a major challenge for fintech platforms, particularly when dealing with aging PHP systems that are difficult to maintain and scale. To address these issues, we refactored an investment platform from PHP to Java, leveraging Spring Boot and SOAP-based APIs for improved reliability, performance, and maintainability.

In this article, we will walk through the design patterns used, the project structure, and key code examples—all in a way that even those without deep software development experience can understand.

## **Key Objectives**

Why Refactor from PHP to Java?

PHP is widely used for web applications but can present challenges when scaling enterprise-grade financial platforms. The main reasons for refactoring include:

✔️ Improved Maintainability – Java's object-oriented nature makes managing large codebases easier.

✔️ Performance Optimization – Java is better suited for high-performance applications with large-scale transactions.

✔️ Better Security – Java provides strong security features, which are crucial in fintech applications.

✔️ Scalability – Spring Boot enables microservice architecture, allowing for better modularity and scaling.

To facilitate a smooth transition, we designed a new platform structure incorporating design patterns that promote clean, reusable, and scalable code. Also the API's are designed in Java using SOAP protocol.

## **Full Project Template with SOAP API Implementation (Java + Spring Boot)**

This comprehensive manual will guide you through building the **new investment platform** using **Java (Spring Boot)** with **SOAP API endpoints** and the design patterns we discussed.

## 📂 **Project Structure**

```text
investment-platform/
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── investment/
│                   ├── adapter/
│                   │   ├── BankAAdapter.java
│                   │   └── BankBAdapter.java
│                   ├── config/
│                   │   └── SOAPConfig.java
│                   ├── controller/
│                   │   └── InvestmentController.java
│                   ├── facade/
│                   │   └── BankServiceFacade.java
│                   ├── model/
│                   │   └── Client.java
│                   ├── repository/
│                   │   └── ClientRepository.java
│                   ├── service/
│                   │   ├── InvestmentService.java
│                   │   └── MarketDataService.java
│                   ├── soap/
│                   │   ├── BankAPI.java
│                   │   └── SOAPClient.java
│                   ├── strategy/
│                   │   ├── CompoundInterestStrategy.java
│                   │   └── SimpleInterestStrategy.java
│                   └── InvestmentPlatformApplication.java
└── pom.xml
```

## **The project structure explained:**

The **investment-platform** project follows a structured **layered architecture** where each folder serves a specific purpose. This approach **separates concerns**, making the system more **scalable, maintainable, and testable**.

Here’s what each folder does and **why** it exists:

### **1️⃣ `adapter/` – Bank API Integration (Adapter Pattern)**

📌 **Purpose:** Contains classes that allow the platform to interact with different banks' APIs by converting their responses into a standard format.

📌 **Why is it needed?**

- Different banks have **different API structures** (some return XML, some JSON).
- The **Adapter Pattern** standardizes these interactions so the main system doesn't need to change when adding a new bank.

📌 **Example Files:**

- `BankAAdapter.java` – Handles API calls to Bank A.
- `BankBAdapter.java` – Handles API calls to Bank B.

### **2️⃣ `config/` – Configuration Settings**

📌 **Purpose:** Contains configuration-related files, such as SOAP API settings and database connection properties.

📌 **Why is it needed?**

- Centralizes configuration, keeping it **separate** from the main business logic.
- Allows for **easy modifications** without affecting core application code.

📌 **Example Files:**

- `SOAPConfig.java` – Configures the SOAP API client.

### **3️⃣ `controller/` – REST API Endpoints**

📌 **Purpose:** Defines **REST API endpoints** that external clients (web apps, mobile apps) interact with.

📌 **Why is it needed?**

- **Separates the API layer** from the service logic.
- Handles **HTTP requests** and forwards them to the appropriate service.

📌 **Example Files:**

- `InvestmentController.java` – Handles requests related to investment calculations and bank balances.

### **4️⃣ `facade/` – Simplifying Complex Bank Interactions (Facade Pattern)**

📌 **Purpose:** Acts as a **single point of interaction** for multiple banks.

📌 **Why is it needed?**

- If a user needs account balances from **multiple banks**, instead of calling each bank separately, the **Facade Pattern** provides a **unified method**.
- **Simplifies** interactions between different bank APIs.

📌 **Example Files:**

- `BankServiceFacade.java` – Calls `BankAAdapter` and `BankBAdapter` and returns consolidated balances.

### **5️⃣ `model/` – Data Objects (Entities)**

📌 **Purpose:** Defines **Java objects** that represent database entities.

📌 **Why is it needed?**

- Keeps the **data structure centralized**.
- Helps in mapping database tables to Java objects.

📌 **Example Files:**

- `Client.java` – Represents an **investor** with attributes like `id`, `name`, and `investmentType`.

### **6️⃣ `repository/` – Database Access (Repository Pattern)**

📌 **Purpose:** Defines **database operations** using Spring Data JPA.

📌 **Why is it needed?**

- Encapsulates **database queries** so that other parts of the app don’t need to worry about database logic.
- Uses the **Repository Pattern** for easy database access.

📌 **Example Files:**

- `ClientRepository.java` – Provides methods to fetch **Client** data from the database.

### **7️⃣ `service/` – Business Logic**

📌 **Purpose:** Contains the **core logic** of the investment platform, such as investment calculations and bank interactions.

📌 **Why is it needed?**

- **Separates business logic** from controllers (API layer).
- **Promotes reusability**—controllers and other services can call these methods.

📌 **Example Files:**

- `InvestmentService.java` – Handles **investment calculations** and retrieves **bank balances**.
- `MarketDataService.java` – Tracks market changes (for future real-time updates).

### **8️⃣ `soap/` – SOAP API Clients**

📌 **Purpose:** Handles **SOAP-based API communication** with external bank services.

📌 **Why is it needed?**

- SOAP APIs require **special handling** (e.g., XML parsing).
- The **SOAPClient class** ensures efficient API calls using the **Singleton Pattern**.

📌 **Example Files:**

- `SOAPClient.java` – A **singleton class** that manages SOAP API requests.
- `BankAPI.java` – An **interface** defining methods for interacting with **different banks**.

### **9️⃣ `strategy/` – Investment Calculation Strategies (Strategy Pattern)**

📌 **Purpose:** Contains different investment calculation methods, such as **compound interest** and **simple interest**.

📌 **Why is it needed?**

- Users may want **different investment models**.
- The **Strategy Pattern** allows switching between different calculation strategies **dynamically**.

📌 **Example Files:**

- `InvestmentStrategy.java` – Defines the contract for **all** strategies.
- `CompoundInterestStrategy.java` – Implements **compound interest** calculations.
- `SimpleInterestStrategy.java` – Implements **simple interest** calculations.

### **🔟 `InvestmentPlatformApplication.java` – The Main Entry Point**

📌 **Purpose:** This is the **main class** where the Spring Boot application starts.

📌 **Why is it needed?**

- The `@SpringBootApplication` annotation automatically configures the app.
- It runs the entire platform as a **Spring Boot service**.

📌 **Example File:**

- `InvestmentPlatformApplication.java` – Contains the `main()` method.

By structuring the platform this way, we achieve:

✔ **Separation of Concerns** – Each folder has a clear responsibility.  
✔ **Scalability** – New features can be added without modifying the entire system.  
✔ **Maintainability** – Developers can quickly understand and modify the project.

**Key Takeaways from the Structure**

- Separation of Concerns – Each feature is isolated in its own folder.
- Extensibility – The platform supports multiple banks using an Adapter Pattern.
- Scalability – Future services can be added without disrupting existing functionality.

Let's see how the theory would be used in a real-world scenario.

## **1. Initialize a Spring Boot Project**

Create the project using Spring Initializr:

- Dependencies: **Spring Web**, **Spring Boot Starter SOAP**, **Spring Boot Starter Data JPA**, **Spring Boot Starter Web Services**, **Lombok**, **MySQL Driver**
    **This setup includes:**
- Spring Boot Web – To build REST APIs.
- Spring Boot Web Services – To handle SOAP-based APIs.
- Spring Data JPA – To manage database transactions with MySQL.

### **pom.xml**

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.investment</groupId>
    <artifactId>investment-platform</artifactId>
    <version>1.0.0</version>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web-services</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

## ⚙️ **2. Configuration**

### **application.properties**

```properties
server.port=8080

spring.datasource.url=jdbc:mysql://localhost:3306/investment_db
spring.datasource.username=root
spring.datasource.password=secret

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

### **SOAPConfig.java**

```java
package com.investment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

@Configuration
public class SOAPConfig {

    @Bean
    public Jaxb2Marshaller marshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setContextPath("com.investment.soap");
        return marshaller;
    }
}
```

## 🟡 **3. SOAP Client with Singleton Pattern**

### **SOAPClient.java**

```java
package com.investment.soap;

import javax.xml.soap.*;

public class SOAPClient {
    private static SOAPClient instance;
    private SOAPConnection connection;

    private SOAPClient() throws SOAPException {
        SOAPConnectionFactory factory = SOAPConnectionFactory.newInstance();
        connection = factory.createConnection();
    }

    public static SOAPClient getInstance() throws SOAPException {
        if (instance == null) {
            synchronized (SOAPClient.class) {
                if (instance == null) {
                    instance = new SOAPClient();
                }
            }
        }
        return instance;
    }

    public SOAPMessage sendRequest(String endpointUrl, SOAPMessage request) throws SOAPException {
        return connection.call(request, endpointUrl);
    }
}
```

**Why Singleton?**

- Ensures only one SOAP connection exists, reducing memory usage.
- Prevents duplicate API requests, improving efficiency.

## 🟠 **4. Adapter Pattern for Bank APIs**

### **SOAP Interface for Banks**

```java
package com.investment.soap;

public interface BankAPI {
    String getAccountBalance(String accountId);
    String transferFunds(String fromAccount, String toAccount, double amount);
}
```

### **Bank A Adapter**

```java
package com.investment.adapter;

import com.investment.soap.BankAPI;

public class BankAAdapter implements BankAPI {
    @Override
    public String getAccountBalance(String accountId) {
        // Simulate SOAP request to Bank A
        return "<balance>10000.00</balance>";
    }

    @Override
    public String transferFunds(String fromAccount, String toAccount, double amount) {
        return "BankA Transfer Successful";
    }
}
```

**Why Adapter Pattern?**

- Allows the system to integrate with multiple bank APIs without modifying the core code.
- Ensures smooth switching between different banks.

## 🟡 **5. Facade Pattern for Multiple Banks**

### **BankServiceFacade.java**

```java
package com.investment.facade;

import com.investment.soap.BankAPI;

public class BankServiceFacade {
    private final BankAPI bankAAdapter;
    private final BankAPI bankBAdapter;

    public BankServiceFacade(BankAPI bankAAdapter, BankAPI bankBAdapter) {
        this.bankAAdapter = bankAAdapter;
        this.bankBAdapter = bankBAdapter;
    }

    public String getConsolidatedBalance(String accountId) {
        String balanceA = bankAAdapter.getAccountBalance(accountId);
        String balanceB = bankBAdapter.getAccountBalance(accountId);
        return "BankA: " + balanceA + ", BankB: " + balanceB;
    }
}
```

Why Facade Pattern?

- Reduces complexity by exposing a single method for fetching balances.
- Improves code readability.

## 🟢 **6. Strategy Pattern for Investment Calculations**

### **InvestmentStrategy.java**

```java
package com.investment.strategy;

public interface InvestmentStrategy {
    double calculateReturn(double principal, double rate, int years);
}
```

### **CompoundInterestStrategy.java**

```java
package com.investment.strategy;

public class CompoundInterestStrategy implements InvestmentStrategy {
    @Override
    public double calculateReturn(double principal, double rate, int years) {
        return principal * Math.pow((1 + rate / 100), years);
    }
}
```

### **SimpleInterestStrategy.java**

```java
package com.investment.strategy;

public class SimpleInterestStrategy implements InvestmentStrategy {
    @Override
    public double calculateReturn(double principal, double rate, int years) {
        return principal + (principal * rate * years / 100);
    }
}
```

**Why Strategy Pattern?**

- Users can choose between compound interest or simple interest dynamically.
- Simplifies adding new investment strategies in the future.

## 🟤 **7. Observer Pattern for Real-Time Market Updates**

### **MarketDataService.java**

```java
package com.investment.service;

import java.util.ArrayList;
import java.util.List;

interface Observer {
    void update(String marketUpdate);
}

interface MarketData {
    void addObserver(Observer observer);
    void removeObserver(Observer observer);
    void notifyObservers(String update);
}

public class MarketDataService implements MarketData {
    private final List<Observer> observers = new ArrayList<>();

    @Override
    public void addObserver(Observer observer) {
        observers.add(observer);
    }

    @Override
    public void removeObserver(Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers(String update) {
        for (Observer observer : observers) {
            observer.update(update);
        }
    }
}
```

## 🟠 **8. Repository Pattern for Database Operations**

### **Client Entity**

```java
package com.investment.model;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
@Data
public class Client {
    @Id
    private String id;
    private String name;
    private String investmentType;
}
```

### **Client Repository Interface**

```java
package com.investment.repository;

import com.investment.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, String> {
}
```

## 🟢 **9. Service Layer**

### **InvestmentService.java**

```java
package com.investment.service;

import com.investment.facade.BankServiceFacade;
import com.investment.strategy.InvestmentStrategy;
import org.springframework.stereotype.Service;

@Service
public class InvestmentService {
    private final BankServiceFacade bankServiceFacade;
    private InvestmentStrategy strategy;

    public InvestmentService(BankServiceFacade bankServiceFacade) {
        this.bankServiceFacade = bankServiceFacade;
    }

    public void setStrategy(InvestmentStrategy strategy) {
        this.strategy = strategy;
    }

    public double calculateReturn(double principal, double rate, int years) {
        return strategy.calculateReturn(principal, rate, years);
    }

    public String getAccountBalances(String accountId) {
        return bankServiceFacade.getConsolidatedBalance(accountId);
    }
}
```

## 🟡 **10. REST Controller**

### **InvestmentController.java**

```java
package com.investment.controller;

import com.investment.service.InvestmentService;
import com.investment.strategy.CompoundInterestStrategy;
import com.investment.strategy.SimpleInterestStrategy;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/investment")
public class InvestmentController {
    private final InvestmentService investmentService;

    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    @GetMapping("/returns")
    public double calculateReturns(
            @RequestParam String type,
            @RequestParam double principal,
            @RequestParam double rate,
            @RequestParam int years) {

        if ("compound".equalsIgnoreCase(type)) {
            investmentService.setStrategy(new CompoundInterestStrategy());
        } else {
            investmentService.setStrategy(new SimpleInterestStrategy());
        }

        return investmentService.calculateReturn(principal, rate, years);
    }

    @GetMapping("/balances")
    public String getBalances(@RequestParam String accountId) {
        return investmentService.getAccountBalances(accountId);
    }
}
```

## **Running the Platform**

### **Step 1:** Start MySQL

```bash
docker run --name mysql-investment -e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=investment_db -p 3306:3306 -d mysql:5.7
```

### **Step 2:** Build and Run Spring Boot Application

```bash
./mvnw clean install
./mvnw spring-boot:run
```

### **Step 3:** Test Endpoints

- **Calculate Returns:**  
    `http://localhost:8080/api/investment/returns?type=compound&principal=10000&rate=5&years=10`

- **Get Account Balances:**  
    `http://localhost:8080/api/investment/balances?accountId=12345`

## **Conclusion**

- 🟡 **Scalable Architecture:** Layered design with separation of concerns.
- 🟠 **Flexible Patterns:** Easy to extend or change logic.
- 🟢 **Reusable Components:** Adapters for multiple bank integrations.
- 🟤 **Efficient Design:** Singleton for shared resources.
- 🟡 **Real-Time Updates:** Observer pattern for market changes.
