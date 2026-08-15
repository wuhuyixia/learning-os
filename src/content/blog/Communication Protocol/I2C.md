---
title: I2C
description: I2C是一种广泛使用的同步串行通信协议，常用于嵌入式系统中连接低速外设
pubDate: 2026-08-02
updated: 2026-08-14
image: /image/STM32/I2C-Bus-Topology.png
categories:
  - 通信协议
tags:
  - I2C
---

# I2C

I2C（Inter-Integrated Circuit）是一种常见的同步串行通信协议，主要用于 MCU 与各种低速外设之间的数据通信。

I2C 最大的特点是：

只需要两根信号线，就可以连接多个设备。
两根信号线分别为：
~~~
SCL：Serial Clock，时钟线
SDA：Serial Data，数据线
~~~

## I2C 总线结构

I2C 总线上通常包含一个主机和多个从机。

## 上拉电阻

I2C 的 SDA 和 SCL 通常采用：`Open-Drain，开漏输出`

设备只能主动把总线拉低，而不能主动输出高电平。因此需要通过上拉电阻将总线拉到高电平：

## 寄存器读写时序

下面用卡片和信号块表示常见的 I²C 寄存器写入、读取流程。`ACK` 表示从机应答，读取最后一个字节时主机发送 `NACK`，表示不再继续读取。

<div class="i2c-card not-prose">

  <div class="i2c-title">WRITE a register:</div>

  <div class="i2c-flow">
    <span class="sig green">START</span>
    <span class="sig blue">ADDRESS (7)</span>
    <span class="sig yellow">W=0</span>
    <span class="sig gray">ACK</span>
    <span class="sig blue">REGISTER</span>
    <span class="sig gray">ACK</span>
    <span class="sig blue">DATA</span>
    <span class="sig gray">ACK</span>
    <span class="sig green">STOP</span>
  </div>

  <div class="i2c-title">READ a register:</div>

  <div class="i2c-flow">
    <span class="sig green">START</span>
    <span class="sig blue">ADDR-W</span>
    <span class="sig gray">ACK</span>
    <span class="sig blue">REGISTER</span>
    <span class="sig gray">ACK</span>
    <span class="sig green">Sr</span>
    <span class="sig blue">ADDR-R</span>
    <span class="sig gray">ACK</span>
    <span class="sig blue">DATA</span>
    <span class="sig red">NACK</span>
    <span class="sig green">STOP</span>
  </div>

</div>

