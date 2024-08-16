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

Let's dive into a head-to-head comparison, examining these two titans in speed, syntax, and usability using a dataset from a threat intelligence platform.

## Speed

### Simple Operations

We'll start with a simple operation:

- reading a CSV file and filtering rows based on a condition.

  #### Pandas

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


  #### Polars

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

  #### Pandas

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

  #### Polars

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


## Conclusion

Polars is a powerful tool that can handle vast datasets with ease, thanks to its speed and efficiency.
While Pandas is a well-established library with a vast ecosystem, Polars is quickly gaining traction with its impressive performance improvements.
Whether you're working with small or large datasets, Polars is a worthy contender that can help you process data faster and more efficiently.


## References

- [Polars](https://docs.pola.rs/)
- [Pandas](https://pandas.pydata.org/)
- [Data Set](https://datahub.io/collections/air-pollution)

## Code
