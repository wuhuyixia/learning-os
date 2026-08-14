---
title: Linux 下的 GDB 调试工具箱
description: GDB是Linux下非常好用且强大的调试工具
pubDate: 2026-08-02
updated: 2026-08-14
image: /image/Linux/linux-gdb-toolbox.png
categories:
  - Embedded Linux
  - Debug
tags:
  - GDB
  - Linux
  - Core Dump
---

# GDB

## 什么是GDB

GDB 是由 GUN 软件系统社区提供的调试工具，同 GCC 配套组成了一套完整的开发环境，GDB 是 Linux 和许多 类Unix系统的标准开发环境。

一般来说，GDB 主要能够提供以下四个方面的帮助：

- 程序启动时，可以按照自定义的要求运行程序，例如设置参数和环境变量；
- 可以让被调试的程序在所指定的代码处暂停运行，并查看当前运行状态 （例如当前变量的值，函数的执行结果），即支持断点调试
- 当程序被停住时，可以检查当前程序的中的变量的状态；
- 在程序执行过程中，可以改变某个变量的值，还可以改变代码的执行顺序，从而尝试修改程序中出现的逻辑错误


## GDB quickstart

| 命令 | 缩写 | 功能描述 |
|---|---|---|
| `run` | `r` | 开始执行程序 |
| `break` | `b` | 设置断点 |
| `continue` | `c` | 继续执行直到下一个断点 |
| `next` | `n` | 执行下一行，不进入函数 |
| `step` | `s` | 执行下一行，进入函数 |
| `print` | `p` | 打印变量或表达式值 |
| `backtrace` | `bt` | 显示调用栈 |
| `frame` | `f` | 选择栈帧 |
| `list` | `l` | 显示源代码 |
| `info` | `i` | 显示各种信息，如断点、变量等 |
| `quit` | `q` | 退出 GDB |