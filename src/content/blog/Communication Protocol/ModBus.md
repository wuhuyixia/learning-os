---
title: Modbus
description: 系统讲解 Modbus 协议基础、RTU/ASCII/TCP 通信方式、数据帧格式、常用功能码及 CRC 校验原理。
pubDate: 2025-11-13
image: /image/STM32/Modbus1.png
categories:
  - 通信协议
tags:
  - 通信协议
---





# Modbus 
## Modbus RTU 简介 
Modbus 协议由 Modicon 公司于 1979 年开发，最初用于其 PLC 产品，目前已广泛应用于工业控制领域。通常由一个主设备控制多个从设备。RTU （Remote Terminal Unit）使用 RS‑485 或 RS‑232 作为物理层，一般通过芯片的串口进行数据帧的发送与接收，通信数据帧采用二进制数据格式。  

##  帧格式

Modbus RTU 通信帧主要由 **地址、功能码、数据和 CRC 校验码** 组成，其基本帧结构如下。

<div class="protocol-card not-prose">
<div class="protocol-title">Modbus RTU 数据帧结构：</div>
<div class="protocol-flow">
<span class="sig blue">设备地址</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">功能码</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">数据区</span>
<span class="sig gray">N Byte</span>
<span class="sig blue">CRC16</span>
<span class="sig gray">2 Byte</span>
</div>
</div>

数据帧可以表示为：

`Address + Function Code + Data + CRC16`

###  位地址

地址字段占 **1 Byte**，用于标识 Modbus 网络中的通信设备。

* 地址范围 `1 ~ 247`：有效的 Slave 从机地址。
* 地址范围 `248 ~ 255`：保留地址。
* 地址 `0`：广播地址，用于 Master 主机向所有 Slave 从机发送广播报文。
* 非 `0` 地址：用于 Master 请求指定 Slave，或者 Slave 对 Master 进行应答。

例如，当设备地址为 `0x01` 时，表示当前报文发送给地址为 `1` 的 Slave 设备。

---

###  位功能码

功能码占 **1 Byte**，用于表示 Master 请求 Slave 执行的具体操作。

常用功能码如下：

| 常用功能码（HEX） | 说明       | 寄存器（REG）地址范围    |
| ---------- | -------- | --------------- |
| `0x03`     | 读多个保持寄存器 | `40001 ~ 49999` |
| `0x06`     | 写单个保持寄存器 | `40001 ~ 49999` |

---

###  功能码 `0x03`：读多个寄存器

功能码 `0x03` 用于读取一个或多个连续的保持寄存器。

#### Master 请求帧

<div class="protocol-card not-prose">
<div class="protocol-title">0x03 读多个寄存器 — Master 请求帧：</div>
<div class="protocol-flow">
<span class="sig blue">Addr</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">0x03</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">REG_Addr_H</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">REG_Addr_L</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">Num_H</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">Num_L</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">CRC16</span>
<span class="sig gray">2 Byte</span>
</div>
</div>

对应报文格式：

`Addr + 0x03 + REG_Addr_H + REG_Addr_L + Num_H + Num_L + CRC16`

各字段含义如下：

| 字段           |     长度 | 说明          |
| ------------ | -----: | ----------- |
| `Addr`       | 1 Byte | Slave 设备地址  |
| `0x03`       | 1 Byte | 读多个保持寄存器功能码 |
| `REG_Addr_H` | 1 Byte | 起始寄存器地址高字节  |
| `REG_Addr_L` | 1 Byte | 起始寄存器地址低字节  |
| `Num_H`      | 1 Byte | 读取寄存器数量高字节  |
| `Num_L`      | 1 Byte | 读取寄存器数量低字节  |
| `CRC16`      | 2 Byte | CRC16 校验码   |

#### Slave 应答帧

<div class="protocol-card not-prose">
<div class="protocol-title">0x03 读多个寄存器 — Slave 应答帧：</div>
<div class="protocol-flow">
<span class="sig blue">Addr</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">0x03</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">Byte_Num</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">Data1</span>
<span class="sig gray">2 Byte</span>
<span class="sig blue">Data2</span>
<span class="sig gray">2 Byte</span>
<span class="sig blue">...</span>
<span class="sig blue">DataN</span>
<span class="sig gray">2 Byte</span>
<span class="sig blue">CRC16</span>
<span class="sig gray">2 Byte</span>
</div>
</div>

对应报文格式：

`Addr + 0x03 + Byte_Num + Data1 + Data2 + ... + DataN + CRC16`

其中：

* `Byte_Num`：后续寄存器数据所占的总字节数。
* 每个 Modbus 寄存器宽度为 **16 bit，即 2 Byte**。
* 如果读取 `N` 个寄存器，则：

$$
Byte_Num = 2N
$$

---

###  功能码 `0x06`：写单个寄存器

功能码 `0x06` 用于向指定保持寄存器写入一个 **16 位数据**。

#### Master 请求帧

<div class="protocol-card not-prose">
<div class="protocol-title">0x06 写单个寄存器 — Master 请求帧：</div>
<div class="protocol-flow">
<span class="sig blue">Addr</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">0x06</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">REG_Addr_H</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">REG_Addr_L</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">DATA_H</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">DATA_L</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">CRC16</span>
<span class="sig gray">2 Byte</span>
</div>
</div>

对应报文格式：

`Addr + 0x06 + REG_Addr_H + REG_Addr_L + DATA_H + DATA_L + CRC16`

各字段含义如下：

| 字段           |     长度 | 说明          |
| ------------ | -----: | ----------- |
| `Addr`       | 1 Byte | Slave 设备地址  |
| `0x06`       | 1 Byte | 写单个保持寄存器功能码 |
| `REG_Addr_H` | 1 Byte | 寄存器地址高字节    |
| `REG_Addr_L` | 1 Byte | 寄存器地址低字节    |
| `DATA_H`     | 1 Byte | 写入数据高字节     |
| `DATA_L`     | 1 Byte | 写入数据低字节     |
| `CRC16`      | 2 Byte | CRC16 校验码   |

#### Slave 应答帧

`0x06` 功能码执行成功后，Slave 通常将 Master 的请求报文原样返回，以确认寄存器写入成功。

<div class="protocol-card not-prose">
<div class="protocol-title">0x06 写单个寄存器 — Slave 应答帧：</div>
<div class="protocol-flow">
<span class="sig blue">Addr</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">0x06</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">REG_Addr_H</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">REG_Addr_L</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">DATA_H</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">DATA_L</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">CRC16</span>
<span class="sig gray">2 Byte</span>
</div>
</div>

对应报文格式：

`Addr + 0x06 + REG_Addr_H + REG_Addr_L + DATA_H + DATA_L + CRC16`

---

###  CRC16 校验

[CRC](https://www.bilibili.com/video/BV1V4411Z7VA/?spm_id_from=333.337.search-card.all.click)

Modbus RTU 数据帧末尾使用 **CRC16** 进行数据完整性校验，CRC 字段共占 **2 Byte**。

需要注意的是，Modbus RTU 在线路上传输 CRC 时采用：

`CRC_L + CRC_H`

即：

1. 先发送 CRC 低字节；
2. 再发送 CRC 高字节。

因此，一个完整的 Modbus RTU 报文可以概括为：

<div class="protocol-card not-prose">
<div class="protocol-title">完整 Modbus RTU 帧：</div>
<div class="protocol-flow">
<span class="sig blue">Address</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">Function</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">Data</span>
<span class="sig gray">N Byte</span>
<span class="sig blue">CRC Low</span>
<span class="sig gray">1 Byte</span>
<span class="sig blue">CRC High</span>
<span class="sig gray">1 Byte</span>
</div>
</div>
