---
title: '#30 OETV Tennis Analytics Web App'
description: 'A deep dive into the architecture of the OETV Tennis Analytics project, focusing on its core components.'
publishDate: '05 March 2025'
updatedDate: '05 March 2025'
coverImage:
    src: './cover.webp'
    alt: 'Cover image for OETV Tennis Analytics Web App'
tags: ['Python', 'SQLite', 'Docker']
---

## Introduction

The OETV Tennis Analytics project, developed by GitHub user flnzba, represents a sophisticated data pipeline and analytics solution for tennis statistics focused on the Austrian Tennis Federation (OETV) data. The project implements a modern data engineering workflow that extracts, transforms, and visualizes tennis data, providing valuable insights into player performance, rankings, and tournament trends through an interactive dashboard.

This technical article examines the architecture of the project, with a specific focus on the three core components - `load.py`, `transform.py`, and `app.py` - that form the backbone of this analytics solution.

## Project Overview

The OETV Tennis Analytics project is structured as a comprehensive data pipeline with three main components:

1. **Data Extraction and Loading** (`load.py`): Responsible for retrieving data from OETV's API and loading it into a SQLite database.

2. **Data Transformation** (`transform.py`): Handles the processing and transformation of raw tennis data into structured, analysis-ready formats.

3. **Web Application Interface** (`app.py`): A Streamlit-powered dashboard that visualizes the processed data, allowing users to interact with and gain insights from tennis statistics.

The project employs Docker for containerization, ensuring consistent deployment across different environments, and includes checkpointing mechanisms to optimize data processing efficiency.

## Architecture Deep Dive

### Data Flow Architecture

The data flows through the system in the following sequence:

1. **Extraction**: Raw data is extracted from OETV APIs and external sources
2. **Loading**: Data is stored in a SQLite database (`data.db`)
3. **Transformation**: Raw data is processed, cleaned, and transformed
4. **Visualization**: Processed data is presented through an interactive Streamlit dashboard

### Core Components Analysis

Let's examine each core component in detail with actual code examples:

## 1. Data Extraction and Loading (`load.py`)

`load.py` serves as the data ingestion layer, responsible for extracting tennis data from the OETV API and storing it in a structured format. The script uses the `curl_cffi` library for making HTTP requests, which helps with browser impersonation to avoid blocking.

### Key Functions and Mechanisms

#### API Integration

The module implements a function to fetch data from OETV's API, handling authentication, rate limiting, and response parsing:

```python
def get_data_batches(client):
    """Generator function that yields batches of player data as they're fetched.

    Parameters:
    - client: Dictionary containing API client configuration

    Yields:
    - Batch of player records (list of dictionaries)
    """
    start = load_checkpoint()
    total_results = 0
    consecutive_errors = 0
    max_consecutive_errors = 3

    print(f"Starting batch fetching from position {start} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # First request to get total results
        retries = 0
        while retries < client['max_retries']:
            try:
                r = requests.get(
                    client['url'],
                    headers=client['headers'],
                    referer=client['referer'],
                    impersonate="chrome",
                    timeout=client['timeout']
                )
                if r.status_code == 200:
                    rankings_data = json.loads(r.text)
                    all_data = list(rankings_data.values())
                    all_data = list(all_data[1].values())
                    total_results = all_data[0]
                    print(f"Total results to fetch: {total_results}")
                    break
                else:
                    print(f"Error status code: {r.status_code}, retrying...")
                    retries += 1
                    time.sleep(5 * retries)  # Increasing backoff
            except Exception as e:
                print(f"Exception during initial request: {e}")
                retries += 1
                time.sleep(5 * retries)
```

This function acts as a generator that fetches data in batches from the OETV API. It first determines the total number of records available, then systematically retrieves them in chunks of 100.

#### Robust Error Handling

The module includes robust error handling to manage issues with API requests, rate limiting, and response parsing:

```python
def handle_error(status_code):
    print("Error: ", status_code)
    # Get the base directory from environment or use a default
    DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(os.path.abspath(__file__)))
    log_dir = os.path.join(DATA_DIR, "logs")
    os.makedirs(log_dir, exist_ok=True)
    with open(os.path.join(log_dir, "error-last-call.txt"), "a") as file:
        file.write(f"Error: {status_code} \n")
```

Error handling is crucial for maintaining the stability of the pipeline, especially when dealing with external APIs. The function logs errors for later investigation and ensures the process can continue despite temporary failures.

#### Checkpointing System

To optimize performance and prevent redundant data fetching, `load.py` implements a checkpointing mechanism. The system tracks the last successful data load, enabling incremental updates:

```python
def get_checkpoint_file():
    # Get the base directory from environment or use a default
    # This allows configuration in Docker environments
    DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(os.path.abspath(__file__)))
    checkpoint_dir = os.path.join(DATA_DIR, "checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)
    return os.path.join(checkpoint_dir, "checkpoint.txt")


def save_checkpoint(start, all_rankings=None):
    with open(get_checkpoint_file(), "w") as f:
        f.write(str(start))

    # Optionally save the current rankings as backup
    if all_rankings:
        # Get the base directory from environment or use a default
        DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(os.path.abspath(__file__)))
        checkpoint_dir = os.path.join(DATA_DIR, "checkpoints")
        os.makedirs(checkpoint_dir, exist_ok=True)
        temp_path = os.path.join(checkpoint_dir, "rankings_checkpoint.json")
        try:
            with open(temp_path, "w") as file:
                json.dump(all_rankings, file)
        except Exception as e:
            print(f"Error saving rankings checkpoint: {e}")


def load_checkpoint():
    if os.path.exists(get_checkpoint_file()):
        with open(get_checkpoint_file(), "r") as f:
            return int(f.read().strip())
    return 0
```

The checkpointing mechanism allows the system to resume data collection from where it left off, which is especially useful for large datasets or when handling interruptions.

#### Dynamic Backoff Strategy

The module implements a sophisticated backoff strategy to handle API rate limits and server load:

```python
# Dynamically adjust delay based on success pattern
if consecutive_errors > 0:
    consecutive_errors = 0
    # Increase delay slightly after recovering from errors
    base_delay = min(base_delay * 1.2, 5.0)
else:
    # Gradually decrease delay on consistent success
    base_delay = max(base_delay * 0.9, 0.5)

# Add some randomness to the delay
time.sleep(base_delay + random.uniform(0.1, 1.0))
```

This adaptive approach adjusts request timing based on the API's response pattern, reducing delays when the server is responsive and increasing them when encountering errors.

## 2. Data Transformation (`transform.py`)

`transform.py` forms the processing layer of the pipeline, converting raw data from the API into a structured SQLite database. This module is responsible for creating the database schema and populating it with the fetched data.

### Key Functions and Mechanisms

#### Database Initialization

The module initializes the SQLite database with the appropriate schema for storing player data:

```python
def init_database():
    """Initialize the database with the players table"""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Drop table if it exists
    c.execute("DROP TABLE IF EXISTS players")

    # Create table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS players (
            playerId TEXT,
            licenceNr TEXT,
            natRank INTEGER,
            natRankFed INTEGER,
            firstname TEXT,
            lastname TEXT,
            nationality TEXT,
            clubName TEXT,
            clubNr TEXT,
            fedNickname TEXT,
            fedRank REAL,
            birthYear INTEGER,
            atpPoints INTEGER,
            points INTEGER
        )
        """
    )

    conn.commit()

    return conn, c
```

This function establishes the database structure, defining the schema for player data with fields for identifiers, rankings, personal information, and performance metrics.

#### Batch Processing

The module implements a batch processing approach to efficiently handle large amounts of data:

```python
def save_batch(batch, conn, cursor):
    """Save a batch of player data to the database"""
    try:
        # Insert data into the table
        for player in batch:
            cursor.execute(
                """
                INSERT INTO players (playerId, licenceNr, natRank, natRankFed, firstname, lastname, nationality, clubName, clubNr, fedNickname, fedRank, birthYear, atpPoints, points) VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    player["playerId"],
                    player["licenceNr"],
                    player["natRank"],
                    player["natRankFed"],
                    player["firstname"],
                    player["lastname"],
                    player["nationality"],
                    player["clubName"],
                    player["clubNr"],
                    player["fedNickname"],
                    player["fedRank"],
                    player["birthYear"],
                    player["atpPoints"],
                    player["points"],
                ),
            )

        # Commit this batch
        conn.commit()
        return True
    except Exception as e:
        print(f"Error saving batch to database: {e}")
        # Rollback on error
        conn.rollback()
        return False
```

This function handles the insertion of batches of player data into the database, with transaction management to ensure data integrity.

#### Continuous Processing Pipeline

The module orchestrates a continuous processing pipeline that transforms data as it's received:

```python
def process_data_continuous():
    """Process data continuously as it's fetched, saving in batches"""
    try:
        print(f"Starting data processing at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Initialize database
        conn, cursor = init_database()

        # Set up the API client
        client = setup_api_client()

        # Get batches and process them
        total_processed = 0
        for batch_number, batch in enumerate(get_data_batches(client)):
            # Save this batch to the database
            if save_batch(batch, conn, cursor):
                total_processed += len(batch)
                print(f"Batch {batch_number+1} saved. Total records processed: {total_processed}")
            else:
                print(f"Failed to save batch {batch_number+1}")

        # Get total record count
        cursor.execute("SELECT COUNT(*) FROM players")
        total_records = cursor.fetchone()[0]
        print(f"Total records in database: {total_records}")

        # Close connection
        conn.close()

        print(f"Data processing completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    except Exception as e:
        print(f"Fatal error in data processing: {e}")
        if 'conn' in locals():
            conn.close()
        sys.exit(1)
```

This function serves as the main orchestrator of the transformation process, connecting the data extraction from `load.py` with the database operations, while providing progress updates and summary statistics.

## 3. Web Application Interface (`app.py`)

`app.py` serves as the visualization and interaction layer, implemented as a Streamlit application that presents the processed data in an accessible format through an interactive dashboard.

### Key Functions and Mechanisms

#### Database Connection and Data Loading

The module establishes a connection to the SQLite database and loads the player data:

```python
# Database path - must match the path used in transform.py
# Get the base directory from environment or use a default
# This allows configuration in Docker environments
DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(DATA_DIR, "data.db")

# Check if the database file exists
if not os.path.exists(db_path):
    st.error(f"Database file not found at {db_path}. Please run transform.py first to create the database.")
    st.stop()

# Load data from SQLite database
conn = sqlite3.connect(db_path)
query = "SELECT * FROM players"
data = pd.read_sql_query(query, conn)
conn.close()

df = pd.DataFrame(data)

# Calculate player age from birth year
current_year = pd.Timestamp.now().year
df['age'] = current_year - df['birthYear']
```

This section loads the data from the database into a pandas DataFrame, which is then used for visualization and analysis. It also performs some initial data preprocessing, such as calculating the players' ages.

#### Interactive Filtering

The module implements a comprehensive set of interactive filters in the sidebar to allow users to explore the data based on various dimensions:

```python
# Sidebar Filters
st.sidebar.header("🎾 Tennis Rankings Dashboard")
st.sidebar.markdown("---")

st.sidebar.header("Filter Options")

# Player Search
st.sidebar.subheader("Player Search")
search_query = st.sidebar.text_input("Search by player name")

# Rank Filter
st.sidebar.subheader("Ranking")
# Ensure min and max are different for the inputs
rank_min = float(df["fedRank"].min())
rank_max = float(df["fedRank"].max())
if rank_min == rank_max:
    rank_max = rank_min + 1.0  # Ensure they're different
elif rank_max - rank_min < 0.1:
    rank_max = rank_min + 0.1  # Ensure there's at least 0.1 difference

rank_filter_min = st.sidebar.number_input(
    "Min Rank",
    min_value=rank_min,
    max_value=rank_max,
    value=rank_min,
)
rank_filter_max = st.sidebar.number_input(
    "Max Rank",
    min_value=rank_filter_min,
    max_value=rank_max,
    value=min(rank_filter_min + 9.0, rank_max),  # Default to showing a reasonable range
)
rank_filter = (rank_filter_min, rank_filter_max)

# Apply all filters
df_filtered = df.copy()

# Apply search filter if provided
if search_query:
    df_filtered = df_filtered[
        df_filtered['firstname'].str.contains(search_query, case=False) |
        df_filtered['lastname'].str.contains(search_query, case=False)
    ]

# Apply other filters
df_filtered = df_filtered[
    (df_filtered["fedRank"] >= rank_filter[0]) &
    (df_filtered["fedRank"] <= rank_filter[1]) &
    (df_filtered["birthYear"] >= age_filter[0]) &
    (df_filtered["birthYear"] <= age_filter[1]) &
    (df_filtered["points"] >= points_range[0]) &
    (df_filtered["points"] <= points_range[1])
]
```

The sidebar includes filters for player name search, ranking range, age/birth year, federation, club, and points, enabling users to focus on specific subsets of the data.

#### Tabbed Interface for Analysis Categories

The application organizes the analysis into distinct tabs for different categories of visualizations:

```python
# Create tabs for different categories of visualizations
tabs = st.tabs(["Personal Comparison", "Player Rankings", "Federation Analysis", "Age Analysis", "Club Analysis"])
```

This approach creates a clean, organized interface that groups related visualizations together, improving the user experience.

#### Personal Comparison Feature

One of the most interesting features is the personal comparison, which allows users to compare their own ranking with the database:

```python
# Tab 1: Personal Comparison
with tabs[0]:
    st.header("Compare Your Ranking")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Your Rank Percentile")
        fig, ax = plt.subplots(figsize=(10, 8))

        # Define better colors for pie chart
        colors = ['#4CAF50', '#FF5252']

        # Create pie chart with better styling
        wedges, texts, autotexts = ax.pie(
            [percentile, 100 - percentile],
            labels=None,  # Remove default labels for custom positioning
            autopct='%1.1f%%',
            colors=colors,
            startangle=90,
            shadow=True,
            explode=(0.05, 0),  # Slightly explode the first slice
            wedgeprops={'edgecolor': 'white', 'linewidth': 2}
        )
```

This feature calculates the user's percentile position within the overall player rankings and displays it visually, providing context for their performance level.

#### Advanced Data Visualization

The module implements a variety of sophisticated visualization techniques to present the tennis data:

```python
# Federation Performance Analysis
st.subheader("Federation Performance Analysis")
if len(df_filtered) > 0:
    try:
        # Calculate average stats by federation
        fed_stats = df_filtered.groupby('fedNickname').agg({
            'fedRank': 'mean',
            'points': 'mean',
            'atpPoints': 'mean',
            'playerId': 'count'
        }).rename(columns={'playerId': 'player_count'}).reset_index()

        # Only include federations with significant player count
        fed_stats = fed_stats[fed_stats['player_count'] >= 5]

        if not fed_stats.empty and len(fed_stats) > 1:  # Need at least 2 federations for comparison
            # Check for constant values that would break normalization
            has_variation = True
            for col in ['fedRank', 'points', 'atpPoints', 'player_count']:
                if fed_stats[col].nunique() <= 1:
                    has_variation = False
                    st.warning(f"Not enough variation in {col} across federations for proper normalization")

            if has_variation:
                # Normalize the data for the heatmap
                cols_to_norm = ['fedRank', 'points', 'atpPoints', 'player_count']

                # For ranking, lower is better so we invert it
                fed_stats['fedRank_normalized'] = 1 - ((fed_stats['fedRank'] - fed_stats['fedRank'].min()) /
                                                    (fed_stats['fedRank'].max() - fed_stats['fedRank'].min()))

                # For others, higher is better
                for col in cols_to_norm[1:]:
                    # Check for division by zero
                    if fed_stats[col].max() > fed_stats[col].min():
                        fed_stats[f'{col}_normalized'] = (fed_stats[col] - fed_stats[col].min()) / \
                                                    (fed_stats[col].max() - fed_stats[col].min())
                    else:
                        fed_stats[f'{col}_normalized'] = 0.5  # Neutral value if all values are the same

                # Display the normalized data in a heatmap
                fig, ax = plt.subplots(figsize=(12, len(fed_stats)/2 + 3))

                # Data for heatmap
                heatmap_data = fed_stats[['fedNickname', 'fedRank_normalized',
                                        'points_normalized', 'atpPoints_normalized',
                                        'player_count_normalized']]
```

This example shows the federation performance analysis, which aggregates statistics by tennis federation, normalizes the data, and presents it in a heatmap visualization.

#### Error Handling and Edge Cases

The application includes extensive error handling to manage edge cases and provide helpful feedback to users:

```python
# Check if we have data
if df.empty:
    st.error("No data found in the database. Please run transform.py to populate the database with player data.")
    st.stop()

# Age vs Ranking Scatter Plot
with col2:
    st.subheader("Age vs. Ranking Correlation")
    if len(df_filtered) > 0:
        try:
            # Filter out any rows with NaN or infinite values
            plot_data = df_filtered.copy()
            plot_data = plot_data[np.isfinite(plot_data['age']) & np.isfinite(plot_data['fedRank']) & np.isfinite(plot_data['points'])]

            if len(plot_data) > 1:  # Need at least 2 points for meaningful plot and trend line
                # ... plotting code ...
            else:
                st.info("Not enough valid data points for age correlation analysis")
        except Exception as e:
            st.error(f"Error creating age correlation plot: {e}")
    else:
        st.info("No data available with current filters")
```

The code ensures that visualizations are only attempted when there is sufficient data available, and provides informative messages when conditions are not met.

## Integration and Workflow

The three core components - `load.py`, `transform.py`, and `app.py` - work together in a cohesive workflow:

1. **Initial Setup**:

    - The `load.py` script connects to the OETV API and fetches player ranking data
    - Checkpoints are created to track the data processing state

2. **Data Processing**:

    - `transform.py` initializes the SQLite database schema
    - It processes the data fetched by `load.py` and stores it in the database
    - The process is designed to handle data in batches for efficiency

3. **User Interface**:
    - `app.py` creates a Streamlit dashboard that connects to the database
    - It provides interactive filters and visualizations for data exploration
    - Multiple analysis tabs offer different perspectives on the tennis data

## Docker Infrastructure

The project uses Docker for containerization, as evidenced by the `Dockerfile` in the root directory. This containerization provides several advantages:

1. **Environment Consistency**: Ensures that the application runs in the same environment regardless of where it's deployed
2. **Dependency Management**: Simplifies handling of Python packages and other dependencies
3. **Deployment Automation**: Facilitates deployment to various hosting platforms
4. **Scaling Capability**: Enables easy scaling of the application if needed

The implementation uses environment variables to maintain flexibility in configuration:

```python
# Get the base directory from environment or use a default
DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(DATA_DIR, "data.db")
```

This approach allows the application to adapt to different deployment environments while maintaining the same codebase.

## Advanced Features and Technical Considerations

### Robust Error Handling and Recovery

The project implements sophisticated error handling mechanisms to deal with API inconsistencies, network issues, and unexpected data formats:

```python
try:
    # Try alternative parsing: find any list with player data
    for key, value in rankings_data.items():
        if isinstance(value, dict):
            for subkey, subvalue in value.items():
                if isinstance(subvalue, list) and len(subvalue) > 0 and isinstance(subvalue[0], dict) and "playerId" in subvalue[0]:
                    rankings_data = subvalue
                    break
except Exception as parse_error:
    consecutive_errors += 1

    # Save the problematic response for debugging
    # Get the base directory from environment or use a default
    DATA_DIR = os.environ.get('DATA_DIR', os.path.dirname(os.path.abspath(__file__)))
    debug_dir = os.path.join(DATA_DIR, "debug")
    os.makedirs(debug_dir, exist_ok=True)
    error_path = os.path.join(debug_dir, f"error_response_{start}.json")
    with open(error_path, "w") as f:
        f.write(r.text)
```

This code demonstrates the project's approach to handling unexpected API response formats, saving problematic responses for debugging while allowing the process to continue.

### Adaptive Backoff Strategy

The project uses an adaptive backoff strategy to handle rate limiting and server load issues:

```python
# Exponentially increase delay on consecutive errors
retry_delay = base_delay * (2 ** retries)
print(f"Backing off for {retry_delay:.2f} seconds before retry {retries+1}/{client['max_retries']}")
time.sleep(retry_delay)
```

This exponential backoff approach helps manage API request rates, reducing the risk of being blocked while maintaining data collection progress.

### Data Visualization Robustness

The visualization code includes extensive checks to ensure that visualizations are only attempted when the data supports them:

```python
# Check if there's enough variation in the data
if df_nonzero['atpPoints'].nunique() > 1 and df_nonzero['points'].nunique() > 1:
    # ... visualization code ...
else:
    st.info("Not enough variation in points data for correlation analysis")
```

These checks prevent errors from occurring when trying to create visualizations with insufficient or unsuitable data.

## Conclusion

The OETV Tennis Analytics project represents a well-architected data pipeline and analytics solution specifically designed for tennis statistics. Through its three core components - `load.py`, `transform.py`, and `app.py` - it implements a complete ETL (Extract, Transform, Load) workflow with an interactive visualization layer.

The project demonstrates several best practices in data engineering and application development:

1. **Modular Architecture**: Clear separation of concerns between data loading, transformation, and presentation
2. **Robust Error Handling**: Comprehensive error management and recovery strategies
3. **Adaptive Processing**: Dynamic approaches to API interaction and data processing
4. **Interactive Visualization**: User-friendly interface with multiple analysis perspectives
5. **Containerization**: Deployment-ready packaging with Docker

The OETV Tennis Analytics project showcases how modern data engineering techniques can be applied to sports analytics, creating valuable insights from raw data while maintaining a robust and maintainable codebase.

## Links

- [GitHub Repository](https://github.com/flnzba/oetv-tennis-analytics)
- [Live Demo](https://oetv-tennis-analytics.streamlit.app/)
