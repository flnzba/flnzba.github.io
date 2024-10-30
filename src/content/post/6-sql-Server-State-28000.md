---
title: "#6 Find logged Microsoft SQL Server Messages"
description: "Navigating SQL Server Error Codes: A Guide to Understanding 28000 to 30999 and searching the logs for information"
publishDate: "28 October 2024"
updatedDate: "28 October 2024"
# coverImage:
#   src: "./cover.png"
#   alt: "Astro build wallpaper"
tags: ["SQL", "Microsoft sql server"]
---

# Navigating SQL Server Error Codes: A Guide to Understanding 28000 to 30999

Today I encounterd an Error when creating an ODBC Connection. It stated the “SQL State Error: 28000”. 

The Microsoft documentation provides a comprehensive list and explanation of SQL Server error codes from 28000 to 30999. This range includes errors related to authentication issues, permissions, and configuration problems, which are common when setting up or managing SQL Server databases. There you can find the SQL Code to search for all possible Error Codes, the description and if the error exists in the logs.

I modified the code slightly to just search for the error code “28000”.

```sql
SELECT message_id AS Error,
    severity AS Severity,
    [Event Logged] = CASE is_event_logged
        WHEN 0 THEN 'No' ELSE 'Yes'
        END,
    [text] AS [Description]
FROM sys.messages
WHERE language_id = 1033 AND message_id = 28000 /* replace 1040 with the desired language ID, such as 1033 for US English */
ORDER BY [Event Logged], message_id DESC;
```

Link to Documentation: [Microsoft Learn](https://learn.microsoft.com/de-de/sql/relational-databases/errors-events/database-engine-events-and-errors-28000-to-30999?view=sql-server-ver16)