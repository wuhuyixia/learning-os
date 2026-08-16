---
title: I2C
description: I2C是一种广泛使用的同步串行通信协议，常用于嵌入式系统中连接低速外设
pubDate: 2026-08-02
updated: 2026-08-14
image: /image/STM32/I2C-Bus-Topology.jpg
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

I2C 的 SDA 和 SCL 通常采用 **Open-Drain（开漏）** 输出方式。

设备只能主动将总线**拉低**，不能主动输出高电平。当设备释放总线时，需要通过**上拉电阻**将 SDA 和 SCL 拉到高电平。

这种结构可以实现 **线与（Wired-AND）** 逻辑：

$$
Y = X_1 \& X_2 \& X_3 \& \cdots \& X_n
=
\begin{cases}
0, & \text{只要 } X_1 \sim X_n \text{ 里任意一个等于 } 0, \\[6pt]
1, & \text{当 } X_1 \sim X_n \text{ 全部都等于 } 1.
\end{cases}
$$

因此：

* **有一个设备输出低电平 → 总线为低电平**
* **所有设备都释放总线 → 上拉电阻使总线为高电平**

这也是 I2C 能够实现**多设备共享总线、ACK 应答以及总线仲裁**的基础。

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



