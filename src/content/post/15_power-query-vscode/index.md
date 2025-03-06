---
title: '#15 Use Power Query SDK in Visual Studio Code for Power BI'
description: 'Learn how to use the Power Query SDK in Visual Studio Code for Power BI integration and standalone applications.'
publishDate: '29 December 2024'
updatedDate: '29 December 2024'
coverImage:
  src: './cover.webp'
  alt: 'data transformation in Power Query SDK'
tags: ['Power Query', 'PowerBI', 'ETL']
---

## Why Use Power Query SDK in VS Code?

### For Power BI Integration

1. **Custom Data Connectors**: Extend Power BI’s capabilities by connecting to unique data sources that aren’t supported natively.
2. **Advanced Data Transformation**: Build reusable queries and logic to clean and structure raw data for dashboards and reports.
3. **Dynamic Data Models**: Create parameterized models that enable real-time user interactions in Power BI visualizations.

### As a Standalone SDK

1. **Cross-Platform Data Processing**: Use Power Query outside of Power BI to integrate, clean, and transform data for other applications.
2. **Integration with APIs**: Build connectors to pull data from REST APIs or custom endpoints for data pipelines.
3. **Automation**: Integrate Power Query processes into automated workflows, CI/CD pipelines, or custom ETL (Extract, Transform, Load) tools.

## Getting Started: Setting Up the Power Query SDK

### Step 1: Install VS Code and Power Query SDK

1. **Download Visual Studio Code**: Install [VS Code](https://code.visualstudio.com/).
2. **Install the Power Query SDK**:
   - Open VS Code and navigate to the Extensions Marketplace.
   - Search for "Power Query SDK" [Power Query SDK](https://marketplace.visualstudio.com/items?itemName=PowerQuery.vscode-powerquery-sdk) (not available for Mac Silicon) and install the extension published by Microsoft.
   - Alternatively, you can install the [Power Query M Language extension](https://marketplace.visualstudio.com/items?itemName=PowerQuery.vscode-powerquery) for VS Code to get syntax highlighting and IntelliSense support. This extension is available for Mac Silicon but does not include the full SDK features.
   - To get the SDK running on Mac Silicon, you can use a Windows VM or try to run your VS Code in Rosetta mode. (Dez 2024 - Running the SDK in Rosetta mode is not working)

### Step 2: Create a New Project

1. Create a folder for your project and open it in VS Code.
2. In the Explorer panel, locate the "Power Query SDK" section.
3. Click "Create a new extension project."
4. Enter a name for your project and let the SDK generate boilerplate files, including a `*.pq` file for writing your connector logic.

## Using Power Query for Power BI Integration

### Step 1: Building a Custom Connector

Custom connectors allow Power BI to interact with data sources not supported out-of-the-box.

#### Example: Connector for an API

```dax
// language: m (Power Query M Language)
section ApiConnector;

[DataSource.Kind="ApiConnector", Publish="ApiConnector.Publish"]
shared ApiConnector.Contents = (endpoint as text) =>
    let
        response = Web.Contents(endpoint),
        jsonResponse = Json.Document(response),
        result = Table.FromList(jsonResponse, Splitter.SplitByNothing(), {"Column1"}),
        expanded = Table.ExpandRecordColumn(result, "Column1", {"Name", "Value"})
    in
        expanded;

ApiConnector = [
    Authentication = [],
    Label = "API Connector"
];
```

- Export the connector as a `.mez` file.
- Place it in `[Documents]\Power BI Desktop\Custom Connectors`.
- Open Power BI Desktop, navigate to `Get Data`, and select your custom connector.

### Step 2: Developing Dynamic Data Models

Dynamic data models allow real-time interactivity in Power BI reports.

#### Example: Regional Sales Analysis

```dax
// language: m (Power Query M Language)
section RegionalSales;

shared RegionalSales.Contents = (region as text, year as number) =>
    let
        salesData = Table.FromRecords({
            [Region = "North", Year = 2023, Sales = 50000],
            [Region = "South", Year = 2023, Sales = 30000],
            [Region = "North", Year = 2022, Sales = 45000],
            [Region = "South", Year = 2022, Sales = 35000]
        }),
        filtered = Table.SelectRows(salesData, each [Region] = region and [Year] = year)
    in
        filtered;
```

- Test this model in Power BI by providing `region` and `year` parameters.
- Generate visualizations that dynamically update based on user inputs.

## Using Power Query SDK Outside Power BI

### Building ETL Pipelines and Automation Workflows

Power Query SDK can be integrated into external data pipelines and workflows without Power BI. For example:

1. **Data Extraction**: Use Power Query to connect to APIs, databases, or files.
2. **Data Transformation**: Clean, merge, and structure data into the desired format.
3. **Export**: Write the processed data to JSON, CSV, or other formats for use in external applications.

#### Example: Using Power Query for an ETL Workflow

```dax
// language: m (Power Query M Language)
section ETLWorkflow;

shared TransformData = (filePath as text) =>
    let
        source = Csv.Document(File.Contents(filePath)),
        cleaned = Table.RemoveRowsWithErrors(source),
        transformed = Table.TransformColumns(cleaned, {{"Date", Date.From}})
    in
        transformed;
```

- Deploy this query in a standalone application to automate CSV file cleaning and transformation.

### Integrating with APIs or Cloud Services

Power Query connectors can be used as middleware between data sources and cloud services.

#### Example: Fetching Cloud Data

```dax
// language: m (Power Query M Language)
section CloudConnector;

shared CloudConnector.Contents = (url as text, apiKey as text) =>
    let
        response = Web.Contents(url, [Headers=[Authorization="Bearer " & apiKey]]),
        parsed = Json.Document(response)
    in
        parsed;
```

- Use this query to connect to cloud APIs like Azure or Google Cloud.
- Integrate it into workflows for data analysis or storage.

## Testing and Debugging in VS Code

1. **Write Test Queries**: Use the `*.query.pq` files to evaluate your connectors.

   ```dax
   // language: m (Power Query M Language)
   let
       result = ApiConnector.Contents("https://api.example.com/data")
   in
       result
   ```

2. **Evaluate Queries**: Right-click on the query file in VS Code and select "Evaluate current Power Query file."
3. **View Results**: Debug and inspect the output in the VS Code console and results panel.

## Conclusion

The Power Query SDK for Visual Studio Code provides a powerful, flexible framework for building data connectors and models. Whether you are enhancing Power BI’s capabilities with custom connectors or using Power Query as a standalone SDK for external applications. Personally I like building locally and having the ability to test and debug my queries in my Code Editor (VS Code) (I will not call it an IDE).

Building custom connectors and data models with the Power Query SDK opens up a lot of possibilities for data integration, transformation, and automation.
