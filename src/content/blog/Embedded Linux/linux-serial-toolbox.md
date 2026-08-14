---
title: Linux 下的串口调试工具箱
description: 整理 stty、minicom、screen 和 hexdump，在开发板上快速定位通信问题。
pubDate: 2026-08-02
image: /image/linux-serial-toolbox.png
categories:
  - Embedded Linux
  - Tools
tags:
  - Linux
  - UART
  - Shell
  - Debug
---

开发板上的串口问题，很多时候不需要复杂工具。先用系统自带命令建立一条可重复的验证路径，效率通常更高。

## 配置和观察串口

```bash
stty -F /dev/ttyUSB0 115200 cs8 -cstopb -parenb raw -echo
cat /dev/ttyUSB0 | hexdump -C
```

如果需要交互式终端，可以使用 `minicom` 或 `screen`：

```bash
screen /dev/ttyUSB0 115200
minicom -D /dev/ttyUSB0 -b 115200
```

## 常见故障判断

| 现象 | 优先检查 |
| --- | --- |
| 没有任何输出 | 设备节点、供电、GND 和 TX/RX |
| 输出乱码 | 波特率、时钟误差和电平 |
| 偶发丢帧 | 缓冲区、流控和读取端阻塞 |
| 只能发送不能接收 | TX/RX 交叉、方向配置和驱动状态 |

> **DEBUG**：先用 `dmesg -w` 观察 USB 串口设备是否反复断连，再查看应用层日志。
