---
layout: post
title: Ansible Grafana
date: 2024-08-02 17:12 +0300
categories: ansible grafana devops
tags: ansible grafana devops
description: Installing Grafana with Ansible
pin: true
series: Ansible Monitoring Setup
---

# Installing Grafana with Ansible

## Introduction

This is a simple walkthrough on how to install [Grafana](https://grafana.com/) using [Asnsible](https://www.ansible.com/){:target="_blank"}.

## Prerequisites

- Ansible installed on your machine.
  - If not installed
    - On Ubuntu: `sudo apt install ansible`
    - On CentOS: `sudo yum install ansible`
    - On MacOS: `brew install ansible`
    - Verify installation: `ansible --version`
- A target machine with SSH access.

## Setting Up Ansible Inventory
