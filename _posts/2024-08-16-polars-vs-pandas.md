---
layout: post
title: Polars vs Pandas
date: 2024-08-16 23:03 +0300
categories: data rust python
tags: data rust python polars pandas
pin: true
description: A comparison between Polars and Pandas
---

# Polars vs Pandas

## Introduction

Handling vast datasets often feels like an epic quest, especially when waiting for your Pandas code to churn through rows and columns.
Enter Polars—a new champion claiming to revolutionize how we handle data frames with unprecedented speed and efficiency.

Recently, both Pandas and Polars have had significant updates boasting impressive performance improvements.
Pandas 2.0 now supports Apache Arrow, pushing the limits of its capabilities.
Meanwhile, Polars, written in Rust, promises enhanced performance that's turning heads everywhere

Let's dive into a head-to-head comparison, examining these two titans in speed, syntax, and usability.

## Speed

### Simple Operations

We'll start with a simple operation:

- reading a CSV file and filtering rows based on a condition.

  #### 01-Pandas

  ```python
  from pandas import read_csv
  import pyperf
  runner = pyperf.Runner()

  # Load the dataset
  def load_dataset(filename):
      df = read_csv(filename)
      return df

  runner.bench_func('load_dataset', load_dataset, 'data/dataset.csv')
  ```
  `load_dataset: Mean +- std dev: 1.75 ms +- 0.31 ms`


  #### 01-Polars

  ```python
  import polars as pl
  import pyperf
  runner = pyperf.Runner()

  # Load the dataset
  def load_dataset(filename):
      df = pl.read_csv(filename)
      return df

  runner.bench_func('load_dataset', load_dataset, 'data/dataset.csv')
  ```
  `load_dataset: Mean +- std dev: 541 us +- 54 us`

  - **Pandas**: 1.75 milliseconds on average
  - **Polars**: 541 microseconds on average

  Polars is approximately 3 times faster than Pandas in this simple operation.


- Filtering the data

  #### 02-Pandas

  ```python
  from pandas import read_csv
  import pyperf

  runner = pyperf.Runner()

  def filter_dataset(filename):
      df = read_csv(filename)
      df = df[df['Daily Max 8-hour CO Concentration'] > 0.5]
      return df

  runner.bench_func('filter_dataset', filter_dataset, 'data/dataset.csv')
  ```
  `filter_dataset: Mean +- std dev: 2.32 ms +- 0.47 ms`

  #### 02-Polars

  ```python
  import polars as pl
  import pyperf

  runner = pyperf.Runner()

  def filter_dataset(filename):
      df = pl.read_csv(filename)
      df = df.filter(pl.col('Daily Max 8-hour CO Concentration') > 0.5)
      return df

  runner.bench_func('filter_dataset', filter_dataset, 'data/dataset.csv')
  ```
  `filter_dataset: Mean +- std dev: 1.06 ms +- 0.15 ms`

  - **Pandas**: 2.32 milliseconds on average
  - **Polars**: 1.06 milliseconds on average

  Polars is approximately 2 times faster than Pandas in this operation.

- Rename Column

  #### 03-Pandas

  ```python
  from pandas import read_csv
  import pyperf

  runner = pyperf.Runner()

  def rename_col(filename):
      df = read_csv(filename)
      col = 'Daily Max 8-hour CO Concentration'
      df = df.rename(columns={col: 'CO'})
      return df

  runner.bench_func('rename_col', rename_col, 'data/dataset.csv')
  ```
  `rename_col: Mean +- std dev: 2.11 ms +- 0.39 ms`

  #### 03-Polars

  ```python
  import polars as pl
  import pyperf


  runner = pyperf.Runner()

  def rename_col(filename):
      df = pl.read_csv(filename)
      col = 'Daily Max 8-hour CO Concentration'
      df = df.with_columns(pl.col(col).alias('CO'))
      return df

  runner.bench_func('rename_col', rename_col, 'data/dataset.csv')
  ```
  `rename_col: Mean +- std dev: 567 us +- 44 us`

  - **Pandas**: 2.11 milliseconds on average
  - **Polars**: 567 microseconds on average

  Polars is approximately 4 times faster than Pandas in this operation.

- Save to CSV

  #### 04-Pandas

  ```python
  from pandas import read_csv
  import pyperf

  runner = pyperf.Runner()

  def save_rename_col(filename):
      df = read_csv(filename)
      col = 'Daily Max 8-hour CO Concentration'
      df = df.rename(columns={col: 'CO'})
      df.to_csv('data/dataset_renamed.csv')

  runner.bench_func('save_rename_col', save_rename_col, 'data/dataset.csv')
  ```
  `save_rename_col: Mean +- std dev: 4.72 ms +- 1.11 ms`

  #### 04-Polars

  ```python
  import polars as pl
  import pyperf


  runner = pyperf.Runner()

  def save_rename_col(filename):
      df = pl.read_csv(filename)
      col = 'Daily Max 8-hour CO Concentration'
      df = df.with_columns(pl.col(col).alias('CO'))
      df.write_csv('data/dataset_renamed_polars.csv')

  runner.bench_func('save_rename_col', save_rename_col, 'data/dataset.csv')
  ```
  `save_rename_col: Mean +- std dev: 1.49 ms +- 1.13 ms`

  - **Pandas**: 4.72 milliseconds on average
  - **Polars**: 1.49 milliseconds on average

  Polars is approximately 3 times faster than Pandas in this operation.


- All Together

  #### 05-Pandas

  ```python
  import pandas as pd
  from typing import Dict,Union
  import pyperf

  runner = pyperf.Runner()

  reanmed = {
      'Date': 'date',
      'Source': 'source',
      'Site ID': 'site_id',
      'POC': 'poc',
      'Daily Max 8-hour CO Concentration': 'co',
      'Units': 'units',
      'Daily AQI Value': 'aqi',
      'Local Site Name': 'local_site_name',
      'Daily Obs Count': 'daily_obs_count',
      'Percent Complete': 'percent_complete',
      'AQS Parameter Code': 'aqs_parameter_code',
      'AQS Parameter Description': 'aqs_parameter_description',
      'Method Code': 'method_code',
      'CBSA Code': 'cbsa_code',
      'CBSA Name': 'cbsa_name',
      'State FIPS Code': 'state_fips_code',
      'State': 'state',
      'County FIPS Code': 'county_fips_code',
      'County': 'county',
      'Site Latitude': 'site_latitude',
      'Site Longitude': 'site_longitude'
  }


  def read_csv(filename: str) -> pd.DataFrame:
      df = pd.read_csv(filename)
      return df


  def rename_cols(df: pd.DataFrame, columns: Dict[str,str]) -> pd.DataFrame:
      df = df.rename(columns=columns)
      return df

  def filter_cols(df: pd.DataFrame) -> Union[pd.DataFrame,pd.Series]:
      return df[df['co'] > 0.5]

  def save_csv(df: pd.DataFrame, filename: str) -> None:
      df.to_csv(filename)


  def process(filename: str) -> None:
      df = read_csv(filename)
      df = rename_cols(df, reanmed)
      df = filter_cols(df)
      if isinstance(df, pd.DataFrame):
          save_csv(df, 'data/dataset_renamed_pandas.csv')


  runner.bench_func('process', process, 'data/dataset.csv')
  ```
  `process: Mean +- std dev: 5.40 ms +- 0.63 ms`

  #### 05-Polars

  ```python
  from typing import Dict
  import pyperf
  import polars as pl

  runner = pyperf.Runner()

  reanmed = {
      'Date': 'date',
      'Source': 'source',
      'Site ID': 'site_id',
      'POC': 'poc',
      'Daily Max 8-hour CO Concentration': 'co',
      'Units': 'units',
      'Daily AQI Value': 'aqi',
      'Local Site Name': 'local_site_name',
      'Daily Obs Count': 'daily_obs_count',
      'Percent Complete': 'percent_complete',
      'AQS Parameter Code': 'aqs_parameter_code',
      'AQS Parameter Description': 'aqs_parameter_description',
      'Method Code': 'method_code',
      'CBSA Code': 'cbsa_code',
      'CBSA Name': 'cbsa_name',
      'State FIPS Code': 'state_fips_code',
      'State': 'state',
      'County FIPS Code': 'county_fips_code',
      'County': 'county',
      'Site Latitude': 'site_latitude',
      'Site Longitude': 'site_longitude'
  }


  def read_csv(filename: str) -> pl.DataFrame:
      df = pl.read_csv(filename)
      return df


  def rename_cols(df: pl.DataFrame, columns: Dict[str,str]) -> pl.DataFrame:
      df = df.with_columns([pl.col(col).alias(new_col) for col,new_col in columns.items()])
      return df

  def filter_cols(df: pl.DataFrame) -> pl.DataFrame:
      return df.filter(pl.col('co') > 0.5)

  def save_csv(df: pl.DataFrame, filename: str) -> None:
      df.write_csv(filename)


  def process(filename: str) -> None:
      df = read_csv(filename)
      df = rename_cols(df, reanmed)
      df = filter_cols(df)
      save_csv(df, 'data/dataset_renamed_polars.csv')


  runner.bench_func('process', process, 'data/dataset.csv')
  ```
  `process: Mean +- std dev: 3.46 ms +- 2.30 ms`

  - **Pandas**: 5.40 milliseconds on average
  - **Polars**: 3.46 milliseconds on average

  Polars is approximately 1.5 times faster than Pandas in this operation.



## Conclusion

Polars is a powerful tool that can handle vast datasets with ease, thanks to its speed and efficiency.
While Pandas is a well-established library with a vast ecosystem, Polars is quickly gaining traction with its impressive performance improvements.
Whether you're working with small or large datasets, Polars is a worthy contender that can help you process data faster and more efficiently.


### Benchmark Results

| Operation                                        | Pandas (ms)       | Polars (ms)       | Speedup          |
|--------------------------------------------------|-------------------|-------------------|------------------|
| Reading CSV file                                 | 1.75              | 0.541             | ~3.2x faster     |
| Filtering rows based on condition                | 2.32              | 1.06              | ~2.2x faster     |
| Renaming a column                                | 2.11              | 0.567             | ~3.7x faster     |
| Saving to CSV                                    | 4.72              | 1.49              | ~3.2x faster     |
| Combined dataset processing operations           | 5.40              | 3.46              | ~1.5x faster     |

## References

- [Polars](https://docs.pola.rs/)
- [Pandas](https://pandas.pydata.org/)
- [Data Set](https://datahub.io/collections/air-pollution)

## Code

- [Pandas vs Polars](https://github.com/khalidelborai/blog_code/tree/main/polars-vs-pandas)
