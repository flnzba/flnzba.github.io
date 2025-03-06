---
title: '#16 Change Power BI Data Source from Local to ADLS Gen2'
description: 'Learn how to transition Power BI data sources from local files to Azure Data Lake Storage Gen2 without disrupting your dashboard.'
publishDate: '31 December 2024'
updatedDate: '31 December 2024'
coverImage:
  src: './cover.webp'
  alt: 'Power BI Data Source'
tags: ['PowerBI', 'DataLake', 'Azure']
---

In Power BI, data transformations are often tailored to specific datasets. Moving from a local data source to Azure Data Lake Storage Gen2 (ADLSv2) can introduce challenges, especially when the JSON files in ADLS have varying structures and must not be combined. In my case there where 4 JSON files in a local folder which were transfered to an ADLS Gen 2. These files then needed to be reconnected to the POWER BI Report.

## Understanding the Problem

When Power BI connects to a folder in ADLS, it lists and combines all files within that folder by default. This behavior is problematic when:

- Files in the folder have different structures.
- Each file requires specific transformations that cannot be uniformly applied.

The solution involves treating each file individually.
Steps:

1. Maintain your existing queries.
2. Connect to ADLS.
3. Apply transformations tailored to each file.
4. Transition seamlessly without disrupting your Power BI dashboard.

## **Step 1: Establish a Connection to ADLSv2**

Before modifying your queries, establish a connection to the ADLS folder.

### **Steps to Connect:**

1. Open Power BI Desktop.
2. Navigate to the **Home** tab and select **Get Data**.
3. Choose **Azure > Azure Data Lake Storage Gen2** from the list of connectors.
4. Enter the storage account URL in the format:

   ```text
   https://<storage-account-name>.dfs.core.windows.net/<container-name>
   ```

5. Authenticate using one of the following:
   - **Account key**: Available in the Azure portal.
   - **Azure Active Directory**: If integrated with your organization's Azure AD.
   - **Shared Access Signature (SAS)**: Limited-permission URL for secure access.
6. Select the folder containing your JSON files.

Power BI will list all the files in the folder, including metadata like file name, size, and last modified date.

## **Step 2: Filter Files to Avoid Unwanted Combining**

Since ADLS combines all files by default, the next step is to filter files individually based on their names, identifiers or suffixes (really anything string related can be filtered).

### **Filtering Files in Power Query**

1. **Open Power Query**:
   - Click on **Transform Data** to enter the Power Query editor.
2. **Add a Custom Column**:
   - Use the following code to extract file names:

     ```dax
     // Power Query Lang
     Table.AddColumn(Source, "FileName", each Text.AfterDelimiter([Name], "/"))
     ```

3. **Filter Files**:
   - Apply a filter for each file using its name:

     ```dax
     // Power Query Lang
     Table.SelectRows(Source, each Text.Contains([FileName], "File1.json"))
     ```

   - Repeat this step for all other files (e.g., `File2.json`, `File3.json`, etc.).

This ensures that each query targets a single file, preventing Power BI from combining the data. You get a separate query for each file, allowing you to apply unique transformations.

## **Step 3: Apply Basic Transformations**

Each file must be transformed to match its counterpart in the local data source. These transformations could include expanding JSON records, renaming columns, or changing data types.

### **Transforming JSON Files**

1. **Expand JSON Data**:
   If the file content is JSON, extract and expand its nested structure:

   ```dax
   // Power Query Lang
   Source = Json.Document(Binary.Load(File.Contents("File1.json"))),
   ExpandedData = Table.ExpandRecordColumn(Source, "Data", {"Field1", "Field2"})
   ```

2. **Rename Columns**:
   Ensure column names match those in the local file:

   ```dax
   // Power Query Lang
   RenamedColumns = Table.RenameColumns(ExpandedData, {{"Field1", "NewField1"}, {"Field2", "NewField2"}})
   ```

3. **Change Data Types**:
   Apply consistent data types:

   ```dax
   // Power Query Lang
   TransformedTypes = Table.TransformColumnTypes(RenamedColumns, {{"NewField1", Int64.Type}, {"NewField2", Text.Type}})
   ```

### **Example Code for Transforming a File**

```dax
// Power Query Lang
let
    Source = AzureStorage.Contents("https://<storage-account-name>.dfs.core.windows.net/<container-name>"),
    FilteredFiles = Table.SelectRows(Source, each Text.Contains([Name], "File1.json")),
    Content = Table.AddColumn(FilteredFiles, "Content", each Text.FromBinary(Binary.Load([Content]))),
    ParsedJson = Table.TransformColumns(Content, {{"Content", Json.Document}}),
    ExpandedData = Table.ExpandRecordColumn(ParsedJson, "Content", {"Field1", "Field2"}),
    RenamedColumns = Table.RenameColumns(ExpandedData, {{"Field1", "NewField1"}, {"Field2", "NewField2"}}),
    TransformedTypes = Table.TransformColumnTypes(RenamedColumns, {{"NewField1", Int64.Type}, {"NewField2", Text.Type}})
in
    TransformedTypes
```

## **Step 4: Copy the Transformation Logic**

Once the transformations for a file in the new data source are complete, copy the logic.

### **How to Copy Transformations**

1. Open the query for the new data source file.
2. Go to the **Advanced Editor**.
3. Copy the entire M code.

## **Step 5: Replace Transformations in Local File Queries**

To transition from local to ADLS without rebuilding your transformations, replace the connection logic in your local file queries with the copied ADLS query.

### **Steps to Replace Logic**

1. Open the query for the local file.
2. In the **Advanced Editor**, identify the connection logic at the beginning of the M code.
3. Replace the local file logic with the ADLS connection code.

### **Example Replacement**

**Original Local Query**:

```dax
// Power Query Lang
Source = Folder.Files("C:\LocalFolder"),
FilteredFiles = Table.SelectRows(Source, each Text.Contains([Name], "File1.json"))
```

**Updated ADLS Query**:

```dax
// Power Query Lang
Source = AzureStorage.Contents("https://<storage-account-name>.dfs.core.windows.net/<container-name>"),
FilteredFiles = Table.SelectRows(Source, each Text.Contains([Name], "File1.json"))
```

## **Step 6: Validate and Debug**

After replacing the query logic:

1. Compare the transformed table with the original local table to ensure data consistency.
2. If discrepancies occur:
   - Verify file names and filters.
   - Check for transformation differences (e.g., column names or data types).
   - Adjust as needed to align with the original queries.

## **Step 7: Refresh and Save**

1. Save your changes in Power Query.
2. Return to Power BI and refresh your dataset.
3. Validate that the visuals and dashboards display accurate and up-to-date data from ADLS.

## **Best Practices for Working with ADLS in Power BI**

- **Folder Organization**: Organize files in subfolders to group related datasets. This simplifies filtering.
- **Access Control**: Use Azure AD authentication for secure access and better management.
- **Version Control**: Maintain a backup of your Power BI file before modifying queries.
- **Incremental Refresh**: Enable incremental refresh for large datasets to improve performance.

I have to recreate this case to make some screenshots. Eventually this article will be updated with screenshots.
