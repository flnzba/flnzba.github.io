---
title: '#34 50 Advanced SQL Queries Every Developer Should Know'
description: 'Master SQL with these 50 advanced queries covering window functions, CTEs, pivoting, performance optimization...'
publishDate: '01 April 2025'
updatedDate: '01 April 2025'
coverImage:
    src: './cover.webp'
    alt: '50 Advanced SQL Queries'
tags: ['sql']
---

SQL is a powerful language for managing and querying relational databases. While basic queries like `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are essential, mastering advanced SQL techniques can significantly enhance your ability to analyze data, optimize performance, and solve complex problems.

In this article, we’ll explore **50 advanced SQL queries** that cover window functions, recursive CTEs, pivoting, performance optimization, and more.

## **1. Window Functions (Analytical Queries)**

Window functions allow computations across a set of table rows related to the current row.

### **1.1. ROW_NUMBER() – Assign a Unique Row Number**

```sql
SELECT
    employee_id,
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS rank
FROM employees;
```

### **1.2. RANK() – Rank with Gaps for Ties**

```sql
SELECT
    employee_id,
    name,
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;
```

### **1.3. DENSE_RANK() – Rank Without Gaps**

```sql
SELECT
    employee_id,
    name,
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;
```

### **1.4. NTILE() – Divide Rows into Buckets**

```sql
SELECT
    employee_id,
    name,
    salary,
    NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

### **1.5. LEAD() – Access Next Row’s Value**

```sql
SELECT
    employee_id,
    name,
    salary,
    LEAD(salary, 1) OVER (ORDER BY salary DESC) AS next_salary
FROM employees;
```

### **1.6. LAG() – Access Previous Row’s Value**

```sql
SELECT
    employee_id,
    name,
    salary,
    LAG(salary, 1) OVER (ORDER BY salary DESC) AS prev_salary
FROM employees;
```

### **1.7. FIRST_VALUE() – Get First Value in a Window**

```sql
SELECT
    employee_id,
    name,
    salary,
    FIRST_VALUE(salary) OVER (PARTITION BY department ORDER BY salary DESC) AS highest_in_dept
FROM employees;
```

### **1.8. LAST_VALUE() – Get Last Value in a Window**

```sql
SELECT
    employee_id,
    name,
    salary,
    LAST_VALUE(salary) OVER (
        PARTITION BY department
        ORDER BY salary DESC
        RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_in_dept
FROM employees;
```

### **1.9. Running Total with SUM() OVER**

```sql
SELECT
    date,
    revenue,
    SUM(revenue) OVER (ORDER BY date) AS running_total
FROM sales;
```

### **1.10. Moving Average**

```sql
SELECT
    date,
    revenue,
    AVG(revenue) OVER (ORDER BY date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg
FROM sales;
```

---

## **2. Common Table Expressions (CTEs) and Recursive Queries**

CTEs improve readability and allow recursive operations.

### **2.1. Basic CTE**

```sql
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 100000
)
SELECT * FROM high_earners;
```

### **2.2. Recursive CTE (Hierarchical Data)**

```sql
WITH RECURSIVE employee_hierarchy AS (
    -- Base case: CEO (no manager)
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: Employees with managers
    SELECT e.id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.id
)
SELECT * FROM employee_hierarchy;
```

### **2.3. Multiple CTEs in a Single Query**

```sql
WITH
    dept_stats AS (
        SELECT department, AVG(salary) AS avg_salary
        FROM employees
        GROUP BY department
    ),
    high_paying_depts AS (
        SELECT department
        FROM dept_stats
        WHERE avg_salary > 80000
    )
SELECT e.*
FROM employees e
JOIN high_paying_depts hpd ON e.department = hpd.department;
```

---

## **3. Pivoting and Unpivoting Data**

### **3.1. Pivot with CASE**

```sql
SELECT
    product_id,
    SUM(CASE WHEN region = 'North' THEN sales ELSE 0 END) AS north_sales,
    SUM(CASE WHEN region = 'South' THEN sales ELSE 0 END) AS south_sales,
    SUM(CASE WHEN region = 'East' THEN sales ELSE 0 END) AS east_sales,
    SUM(CASE WHEN region = 'West' THEN sales ELSE 0 END) AS west_sales
FROM sales
GROUP BY product_id;
```

### **3.2. Pivot with PIVOT (SQL Server, Oracle)**

```sql
SELECT *
FROM (
    SELECT product_id, region, sales
    FROM sales
) AS src
PIVOT (
    SUM(sales) FOR region IN ([North], [South], [East], [West])
) AS pvt;
```

### **3.3. Unpivot Data**

```sql
SELECT product_id, region, sales
FROM (
    SELECT product_id, north_sales, south_sales, east_sales, west_sales
    FROM pivoted_sales
) AS src
UNPIVOT (
    sales FOR region IN (north_sales, south_sales, east_sales, west_sales)
) AS unpvt;
```

---

## **4. Advanced Joins and Subqueries**

### **4.1. Self-Join (Find Employees with Same Manager)**

```sql
SELECT
    e1.name AS employee1,
    e2.name AS employee2,
    e1.manager_id
FROM employees e1
JOIN employees e2 ON e1.manager_id = e2.manager_id AND e1.id < e2.id;
```

### **4.2. Lateral Join (PostgreSQL)**

```sql
SELECT
    d.department_name,
    e.name,
    e.salary
FROM departments d
CROSS JOIN LATERAL (
    SELECT name, salary
    FROM employees
    WHERE department_id = d.id
    ORDER BY salary DESC
    LIMIT 3
) e;
```

### **4.3. Correlated Subquery (Find Employees Earning Above Avg in Dept)**

```sql
SELECT
    e1.name,
    e1.salary,
    e1.department
FROM employees e1
WHERE e1.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department = e1.department
);
```

---

## **5. Performance Optimization**

### **5.1. Index Hinting (Force Index Usage)**

```sql
SELECT * FROM employees WITH (INDEX(idx_salary)) WHERE salary > 50000;
```

### **5.2. Query Plan Analysis (EXPLAIN)**

```sql
EXPLAIN ANALYZE SELECT * FROM employees WHERE department = 'Engineering';
```

### **5.3. Materialized Views (Precompute Expensive Queries)**

```sql
CREATE MATERIALIZED VIEW mv_high_earners AS
SELECT * FROM employees WHERE salary > 100000;

REFRESH MATERIALIZED VIEW mv_high_earners;
```

---

## **6. Advanced Aggregations**

### **6.1. ROLLUP (Hierarchical Grouping)**

```sql
SELECT
    department,
    job_title,
    SUM(salary) AS total_salary
FROM employees
GROUP BY ROLLUP(department, job_title);
```

### **6.2. CUBE (All Possible Groupings)**

```sql
SELECT
    department,
    job_title,
    SUM(salary) AS total_salary
FROM employees
GROUP BY CUBE(department, job_title);
```

### **6.3. GROUPING SETS (Custom Groupings)**

```sql
SELECT
    department,
    job_title,
    SUM(salary) AS total_salary
FROM employees
GROUP BY GROUPING SETS (
    (department, job_title),
    (department),
    (job_title),
    ()
);
```

---

## **7. JSON and XML Handling**

### **7.1. Extract JSON Fields**

```sql
SELECT
    id,
    json_data->>'name' AS name,
    json_data->>'age' AS age
FROM users;
```

### **7.2. Query Nested JSON Arrays**

```sql
SELECT
    id,
    json_array_elements(json_data->'skills') AS skill
FROM users;
```

### **7.3. XML Parsing**

```sql
SELECT
    id,
    xpath('//name/text()', xml_data) AS name,
    xpath('//age/text()', xml_data) AS age
FROM users;
```

---

## **8. Dynamic SQL**

### **8.1. Execute Dynamic Query (SQL Injection Safe)**

```sql
EXECUTE format('SELECT * FROM %I WHERE salary > %L', 'employees', 50000);
```

### **8.2. Generate and Run SQL in a Loop**

```sql
DO $$
DECLARE
    query TEXT;
BEGIN
    FOR i IN 1..10 LOOP
        query := format('INSERT INTO logs (message) VALUES (%L)', 'Log ' || i);
        EXECUTE query;
    END LOOP;
END $$;
```

---

## **9. Advanced Joins and Set Operations**

### **9.1. FULL OUTER JOIN (Find All Matches and Non-Matches)**

```sql
SELECT
    e.employee_id,
    e.name,
    d.department_name
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.department_id;
```

### **9.2. NATURAL JOIN (Join on Columns with Same Name)**

```sql
SELECT * FROM employees NATURAL JOIN departments;
```

### **9.3. INTERSECT (Find Common Records Between Two Queries)**

```sql
SELECT employee_id FROM full_time_employees
INTERSECT
SELECT employee_id FROM high_performers;
```

### **9.4. EXCEPT (Find Records in First Query but Not Second)**

```sql
SELECT employee_id FROM all_employees
EXCEPT
SELECT employee_id FROM terminated_employees;
```

### **9.5. UNION ALL (Combine Results with Duplicates)**

```sql
SELECT name, salary FROM current_employees
UNION ALL
SELECT name, salary FROM former_employees;
```

---

## **10. Advanced Subqueries**

### **10.1. EXISTS (Check for Related Records)**

```sql
SELECT e.name
FROM employees e
WHERE EXISTS (
    SELECT 1 FROM sales s
    WHERE s.employee_id = e.employee_id AND s.amount > 10000
);
```

### **10.2. NOT EXISTS (Find Records Without Related Data)**

```sql
SELECT d.department_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1 FROM employees e
    WHERE e.department_id = d.department_id
);
```

### **10.3. IN with Subquery (Filter Based on Another Query)**

```sql
SELECT name, salary
FROM employees
WHERE department_id IN (
    SELECT department_id
    FROM departments
    WHERE location = 'New York'
);
```

### **10.4. ALL (Compare Against All Values in Subquery)**

```sql
SELECT name, salary
FROM employees
WHERE salary > ALL (
    SELECT salary
    FROM employees
    WHERE department = 'Intern'
);
```

### **10.5. ANY/SOME (Compare Against Any Value in Subquery)**

```sql
SELECT name, salary
FROM employees
WHERE salary > ANY (
    SELECT salary
    FROM employees
    WHERE department = 'Management'
);
```

---

## **11. Advanced Data Modification**

### **11.1. UPSERT (INSERT or UPDATE on Conflict)**

```sql
INSERT INTO employees (id, name, salary)
VALUES (101, 'John Doe', 75000)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, salary = EXCLUDED.salary;
```

### **11.2. MERGE (Conditional INSERT/UPDATE/DELETE)**

```sql
MERGE INTO employees e
USING updated_employees ue
ON e.id = ue.id
WHEN MATCHED THEN
    UPDATE SET e.name = ue.name, e.salary = ue.salary
WHEN NOT MATCHED THEN
    INSERT (id, name, salary) VALUES (ue.id, ue.name, ue.salary);
```

### **11.3. DELETE with JOIN**

```sql
DELETE FROM employees
USING departments
WHERE employees.department_id = departments.department_id
AND departments.location = 'Remote';
```

### **11.4. UPDATE from Another Table**

```sql
UPDATE employees e
SET salary = e.salary * 1.1
FROM departments d
WHERE e.department_id = d.department_id
AND d.budget > 1000000;
```

---

## **12. Database Administration & Meta-Queries**

### **12.1. List All Tables in a Database**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### **12.2. Find Column Names in a Table**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'employees';
```

### **12.3. Check Table Size (PostgreSQL)**

```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name)) AS size
FROM information_schema.tables
WHERE table_schema = 'public';
```

### **12.4. Find Long-Running Queries**

```sql
SELECT
    pid,
    query,
    now() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

### **12.5. Kill a Running Query**

```sql
SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE query LIKE '%long_running_query%';
```

---

## **13. Advanced Date & Time Operations**

### **13.1. Generate Date Series**

```sql
SELECT generate_series(
    '2023-01-01'::date,
    '2023-12-31'::date,
    '1 day'::interval
) AS date;
```

### **13.2. Calculate Business Days Between Dates**

```sql
SELECT
    date1,
    date2,
    COUNT(*) FILTER (WHERE EXTRACT(DOW FROM day) BETWEEN 1 AND 5) AS business_days
FROM (
    SELECT
        '2023-01-01'::date AS date1,
        '2023-01-31'::date AS date2,
        generate_series(
            '2023-01-01'::date,
            '2023-01-31'::date,
            '1 day'::interval
        ) AS day
) t;
```

### **13.3. Find Last Day of Month**

```sql
SELECT
    date_trunc('month', current_date) + INTERVAL '1 month - 1 day' AS last_day_of_month;
```

---

## **14. Advanced String Manipulation**

### **14.1. Regex Extract**

```sql
SELECT
    regexp_matches(email, '([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+)\.([A-Za-z]{2,})')
FROM users;
```

### **14.2. Split String into Rows**

```sql
SELECT
    id,
    unnest(string_to_array(tags, ',')) AS tag
FROM products;
```

### **14.3. Concatenate Rows into String**

```sql
SELECT
    department_id,
    string_agg(name, ', ') AS employees
FROM employees
GROUP BY department_id;
```

---

## **15. Advanced Security & Permissions**

### **15.1. Grant Column-Level Permissions**

```sql
GRANT SELECT (name, email) ON employees TO analyst_role;
```

### **15.2. Create a Read-Only User**

```sql
CREATE USER readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
```

---

## **Conclusion**

With these **20 additional advanced SQL queries**, we now have a **complete list of 50 essential SQL techniques** covering:  
✅ **Window Functions**  
✅ **CTEs & Recursive Queries**  
✅ **Pivoting & Unpivoting**  
✅ **Advanced Joins & Subqueries**  
✅ **Performance Optimization**  
✅ **JSON/XML Handling**  
✅ **Dynamic SQL**  
✅ **Database Administration**
