---
title: OTA
description: MCU 通过无线连接（BLE / Wi‑Fi）从云端服务器获取固件更新，Bootloader 校验并写入 Flash，完成远程升级
pubDate: 2025-12-26
updated: 2026-08-14
image: /image/STM32/OTA.png
categories:
  - 物联网
tags:
  - 物联网
---

# Flash结构

# Flash的读写

![RMW机制](/learning-os/image/STM32/OTA1.png)

# Ymodem协议

YMODEM 是一种基于块传输的串口文件传输协议，使用 1K 数据块和 CRC16 校验来提高速度与可靠性，并通过块 0 发送文件名与大小实现多文件传输，常用于嵌入式设备的固件升级。

<div class="protocol-card not-prose">

  <div class="protocol-title">YMODEM 数据包结构:</div>

  <div class="protocol-flow">
    <span class="sig blue">数据包开始信号 SOH/STX</span>
    <span class="sig gray">1 Byte</span>
    <span class="sig blue">发送序号</span>
    <span class="sig gray">1 Byte</span>
    <span class="sig blue">发送序号反码</span>
    <span class="sig gray">1 Byte</span>
    <span class="sig blue">数据区</span>
    <span class="sig gray">128 / 1024 Byte</span>
    <span class="sig blue">CRC 高字节</span>
    <span class="sig gray">1 Byte</span>
    <span class="sig blue">CRC 低字节</span>
    <span class="sig gray">1 Byte</span>
  </div>

</div>

## Ymodem协议全景解析

![文件传输会话](/learning-os/image/STM32/OTA2.png)
