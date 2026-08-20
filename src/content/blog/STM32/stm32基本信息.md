---
title: Linux 下的串口调试工具箱
description: 整理 stty、minicom、screen 和 hexdump，在开发板上快速定位通信问题。
pubDate: 2026-08-02
image: /image/linux-serial-toolbox.png
draft: true
categories:
  - STM32
tags:
  - STM32
---

开发板上的串口问题，很多时候不需要复杂工具。先用系统自带命令建立一条可重复的验证路径，效率通常更高。


# 四大主流芯片架构(XE、ARM, RISC-V和MIPS)