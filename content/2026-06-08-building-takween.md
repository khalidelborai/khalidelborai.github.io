+++
title = "Building takween"
date = 2026-06-08
# Redirect the old /blog/ URL to the new root-level one.
aliases = ["/blog/building-takween/"]

[taxonomies]
tags = ["rust", "takween", "llm-agents", "security"]
categories = ["projects"]

[extra]
mermaid = true
asciinema = true
+++

Most agent tools ask you to trust them first and find out later. You drop in an API key, point it at your repo, and hope the sandbox holds while it runs whatever the model just decided to run. I work in offensive security, and a lot of what I do is research on AI agents: autonomous pentesters that chase and chain vulnerabilities, and intelligence that watches attack surfaces and the dark web for what's already leaking. When an agent like that gets pointed at hostile systems, with real access, "hope the sandbox holds" is how you get breached by your own tool.

So I've spent a while building the agent framework I wish I'd had for exactly that. It's called **takween**, and it started from one rule: never trust the model's output.

## what it is

A Rust workspace, 29 crates, that gives you a CLI called `tk` and an `Agent` you embed in your own program. It talks to any OpenAI- or Anthropic-wire endpoint, checkpoints as it runs, and ships around 833 tests. Here's a small change going from a prompt to a green build:

{{ asciinema(file="takween", poster="npt:11", idle="1.5") }}

## what makes it different

Three things, and the sandbox is just one of them.

**It's a framework, not a product.** You build agents with it and drop them where you need: a component inside a bigger program, or a sidecar that runs next to a service and acts on what it sees, not a chat box you sit in front of. You extend it by filling the slots it defines, a `Tool`, an `Observer`, a provider, a guard, and soon an API and plugins. A run is durable and observable too: it checkpoints as it goes and resumes off disk after a crash, and anything can subscribe to it at once, a terminal UI, an editor, a CI bot. The agent is a process you watch, not a function you call once.

Here's the shape of it. The loop in the middle (`tk-agent`) is the only part you don't swap; the crates around it are the slots you fill and the subsystems it leans on:

{% mermaid() %}
flowchart TB
    Surfaces["<b>drive it from</b><br/>tk-cli · tk-acp (sidecar) · tk-cron · tk-plugin · or embed the crate"]
    Loop["<b>tk-agent, the loop</b><br/>streaming · retries · context compaction · checkpoint &amp; resume · Observers"]
    Gen["<b>generation</b><br/>tk-providers (wire) · tk-context · tk-prompt · tk-auth · tk-telemetry"]
    Tools["<b>tools &amp; extension</b><br/>tk-tools · tk-mcp · tk-search (fff) · tk-memory · tk-skills · tk-rubric (guards) · tk-snapshot"]
    Iso["<b>execution &amp; isolation</b><br/>tk-sandbox · tk-fs (ACL VFS) · tk-subagent · tk-profiles"]
    Dur["<b>durability &amp; orchestration</b><br/>tk-graph (BSP) · tk-graph-sqlite · tk-workflow"]
    Found["<b>foundation</b><br/>tk-core · tk-tower"]

    Surfaces --> Loop
    Loop --> Gen
    Loop --> Tools
    Tools --> Iso
    Loop --> Dur
    Loop --> Found
{% end %}

**It's Rust the whole way down.** The only tool that runs a shell is the one literally named `shell`. grep, search, read, edit, hashing, a jq-style query: all Rust libraries called in-process, no `/bin/sh` in the loop. One static binary, and any OpenAI- or Anthropic-wire model is a line of config.

**A tool's authority is part of its type.** What a tool can touch is declared on the type itself, a `SandboxClass` and a `const PERMISSIONS`, and one gate checks it before the call ever runs, so a read-only agent can't be talked into `write_file` no matter what the model emits. I haven't found another agent library that draws that line.

And to be straight: that OS-level sandbox is the youngest part, rlimits plus a best-effort network deny today, not a VM. The type-level gate is real and shipping; the heavier isolation tiers are designed and next.

## where it's going

The shape I'm building toward is an agent that runs with nobody watching: headless in CI, fixing a flaky test from a `/takween` comment on a pull request; a sidecar beside a live service; and eventually the reason I started, the security work, taking one fixed bug and hunting for the same shape across a codebase. I'll write about each as it lands, in more detail than fits here: the type-level sandbox, the tools that never shell out, and how the whole thing runs headless.

takween isn't public yet. I'd rather open it when it's ready than when it's loud. Follow along here.
