---
title: I2C
description: I2C是一种广泛使用的同步串行通信协议，常用于嵌入式系统中连接低速外设
pubDate: 2025-08-02
image: /image/STM32/I2C-Bus-Topology.png
categories:
  - 通信协议
tags:
  - 通信协议
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

## 起始信号、结束信号与 ACK

### 1. 起始信号 START

当 **SCL 保持高电平**时，SDA 从高电平变为低电平，表示一次 I2C 通信开始：

$$
\text{START:}\qquad SCL=1,\quad SDA:1\rightarrow0
$$

START 信号由主机产生，之后主机开始发送地址和数据。

---

### 2. 结束信号 STOP

当 **SCL 保持高电平**时，SDA 从低电平变为高电平，表示本次通信结束：

$$
\text{STOP:}\qquad SCL=1,\quad SDA:0\rightarrow1
$$

STOP 之后，SDA 和 SCL 被释放，并由上拉电阻恢复为高电平，此时总线处于空闲状态。

---

### 3. ACK 应答

I2C 每发送 **8 bit 数据**后，第 **9 个时钟周期**用于 ACK 应答。

发送方发送完 8 bit 后会释放 SDA，由接收方控制 SDA：

$$
ACK=
\begin{cases}
0, & \text{接收方拉低 SDA，表示接收成功},\\[4pt]
1, & \text{接收方不拉低 SDA，表示 NACK}.
\end{cases}
$$

因此，ACK 的判断方式可以简单理解为：

> 在第 9 个 SCL 高电平期间，检测 SDA 是否为低电平。

## I2C GPIO 初始化

STM32F1 的 `I2C1` 默认引脚为：

| 功能 | 默认引脚 | 重映射后 |
|---|---|---|
| SCL | PB6 | PB8 |
| SDA | PB7 | PB9 |

如果使用 `PB8` 和 `PB9`，需要开启 **AFIO 时钟**，并对 I2C1 进行重映射。

```c
void My_I2C_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;

    /* 1. 开启 GPIOB 和 AFIO 时钟 */
    RCC_APB2PeriphClockCmd(
        RCC_APB2Periph_GPIOB | RCC_APB2Periph_AFIO,
        ENABLE
    );

    /* 2. I2C1 重映射到 PB8、PB9 */
    GPIO_PinRemapConfig(GPIO_Remap_I2C1, ENABLE);

    /* 3. 配置 PB8(SCL)、PB9(SDA) */
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_8 | GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_OD;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;

    GPIO_Init(GPIOB, &GPIO_InitStructure);
}
```

### 为什么使用 `GPIO_Mode_AF_OD`

I2C 的 SDA 和 SCL 都采用 **开漏输出（Open-Drain）**：

```text
PB8 → SCL → 复用开漏输出
PB9 → SDA → 复用开漏输出
```

单片机只能主动把总线拉低：

```text
输出 0 → MOS 管导通 → 总线被拉低
输出 1 → MOS 管关闭 → 释放总线 → 上拉电阻拉高
```

因此，I2C 的 SDA 和 SCL 通常都需要连接上拉电阻。

---

## I2C1 外设时钟

GPIO 和重映射配置完成后，还需要开启 `I2C1` 外设时钟：

```c
RCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C1, ENABLE);
```

这里要注意：

```text
GPIOB、AFIO → APB2
I2C1        → APB1
```

## I2C 速度模式

I2C 根据 SCL 时钟频率可以分为多种速度模式：

| 模式 | SCL 最大频率 | 说明 |
|---|---:|---|
| Standard-mode | 100 kHz | 标准模式，兼容性最好 |
| Fast-mode | 400 kHz | 快速模式，最常用 |
| Fast-mode Plus | 1 MHz | 高速设备使用 |
| High-speed mode | 3.4 MHz | 高速 I2C 通信 |
| Ultra Fast-mode | 5 MHz | 单向传输，使用较少 |


## I2C 时钟信号占空比

I2C 的时钟信号由 **SCL 高电平时间**和**低电平时间**组成：

波形大致为：

```text
       HIGH        HIGH
      ┌───┐       ┌───┐
──────┘   └───────┘   └──────
          LOW
       <------->
```


| I2C 模式 | 配置 | $T_{LOW}:T_{HIGH}$ |
|---|---|---:|
| Standard Mode | 100 kHz | 1 : 1 |
| Fast Mode | `I2C_DutyCycle_2` | 2 : 1 |
| Fast Mode | `I2C_DutyCycle_16_9` | 16 : 9 |

> `I2C_DutyCycle_2` 和 `I2C_DutyCycle_16_9` 主要用于 **Fast Mode**。


## I2C_InitTypeDef 结构体

```c
typedef struct
{
    uint32_t I2C_ClockSpeed;
    uint16_t I2C_Mode;
    uint16_t I2C_DutyCycle;
    uint16_t I2C_OwnAddress1;
    uint16_t I2C_Ack;
    uint16_t I2C_AcknowledgedAddress;
} I2C_InitTypeDef;
```


## I2C外设收发流程


![I2C外设收发与时钟控制框图](/learning-os/image/STM32/I2C-Peripheral-Transfer-Flow.png)



通过 `Len` 指定数据长度，同一套函数可以完成 **1 字节或多字节**收发。

## 1. 多字节发送

```c
void My_I2C_Send(uint8_t SlaveAddr, uint8_t *Data, uint16_t Len)
{
    uint16_t i;

    /* START */
    I2C_GenerateSTART(I2C1, ENABLE);
    while (!I2C_CheckEvent(I2C1, I2C_EVENT_MASTER_MODE_SELECT));

    /* 地址 + 写 */
    I2C_Send7bitAddress(I2C1,
                        SlaveAddr << 1,
                        I2C_Direction_Transmitter);

    while (!I2C_CheckEvent(
        I2C1,
        I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED));

    /* 连续发送 Len 个字节 */
    for (i = 0; i < Len; i++)
    {
        I2C_SendData(I2C1, Data[i]);

        while (!I2C_CheckEvent(
            I2C1,
            I2C_EVENT_MASTER_BYTE_TRANSMITTED));
    }

    /* STOP */
    I2C_GenerateSTOP(I2C1, ENABLE);
}
```
---
STM32F1 硬件 I2C 在最后几个字节的 ACK 处理比较特殊，因此根据 `Len` 自动区分。

```c
void My_I2C_Receive(uint8_t SlaveAddr,
                    uint8_t *Data,
                    uint16_t Len)
{
    uint16_t i = 0;

    if (Len == 0)
        return;

    /* 默认使能 ACK */
    I2C_AcknowledgeConfig(I2C1, ENABLE);
    I2C_NACKPositionConfig(I2C1, I2C_NACKPosition_Current);

    /* START */
    I2C_GenerateSTART(I2C1, ENABLE);

    while (!(I2C1->SR1 & I2C_SR1_SB));

    /* 地址 + 读 */
    I2C_Send7bitAddress(I2C1,
                        SlaveAddr << 1,
                        I2C_Direction_Receiver);

    while (!(I2C1->SR1 & I2C_SR1_ADDR));

    /* ---------- 接收 1 字节 ---------- */
    if (Len == 1)
    {
        /* 最后一个字节不应答 */
        I2C_AcknowledgeConfig(I2C1, DISABLE);

        /* 清除 ADDR */
        (void)I2C1->SR1;
        (void)I2C1->SR2;

        /* STOP */
        I2C_GenerateSTOP(I2C1, ENABLE);

        while (!(I2C1->SR1 & I2C_SR1_RXNE));

        Data[0] = I2C_ReceiveData(I2C1);
    }

    /* ---------- 接收 2 字节 ---------- */
    else if (Len == 2)
    {
        I2C_NACKPositionConfig(I2C1,
                               I2C_NACKPosition_Next);

        I2C_AcknowledgeConfig(I2C1, DISABLE);

        /* 清除 ADDR */
        (void)I2C1->SR1;
        (void)I2C1->SR2;

        while (!(I2C1->SR1 & I2C_SR1_BTF));

        I2C_GenerateSTOP(I2C1, ENABLE);

        Data[0] = I2C_ReceiveData(I2C1);
        Data[1] = I2C_ReceiveData(I2C1);
    }

    /* ---------- 接收 3 字节及以上 ---------- */
    else
    {
        /* 清除 ADDR，保持 ACK */
        (void)I2C1->SR1;
        (void)I2C1->SR2;

        while (Len - i > 3)
        {
            while (!(I2C1->SR1 & I2C_SR1_RXNE));

            Data[i++] = I2C_ReceiveData(I2C1);
        }

        /* 剩余 3 字节 */
        while (!(I2C1->SR1 & I2C_SR1_BTF));

        I2C_AcknowledgeConfig(I2C1, DISABLE);

        /* 读取倒数第 3 个字节 */
        Data[i++] = I2C_ReceiveData(I2C1);

        while (!(I2C1->SR1 & I2C_SR1_BTF));

        /* 最后两个字节前产生 STOP */
        I2C_GenerateSTOP(I2C1, ENABLE);

        Data[i++] = I2C_ReceiveData(I2C1);
        Data[i++] = I2C_ReceiveData(I2C1);
    }

    /* 恢复默认配置 */
    I2C_AcknowledgeConfig(I2C1, ENABLE);
    I2C_NACKPositionConfig(I2C1,
                           I2C_NACKPosition_Current);
}
```

---

> 核心思想：**发送端使用循环即可；接收端根据 `Len = 1`、`Len = 2`、`Len ≥ 3` 自动处理最后几个字节的 ACK/NACK 和 STOP。**


# STM32 软件 I2C

软件 I2C 使用普通 GPIO 模拟 SDA 和 SCL 时序。

## 1. GPIO 控制

```c
#define SCL_H() GPIO_SetBits(GPIOB, GPIO_Pin_6)
#define SCL_L() GPIO_ResetBits(GPIOB, GPIO_Pin_6)

#define SDA_H() GPIO_SetBits(GPIOB, GPIO_Pin_7)
#define SDA_L() GPIO_ResetBits(GPIOB, GPIO_Pin_7)

#define SDA_READ() GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_7)
```

GPIO 推荐使用：

```c
GPIO_Mode_Out_OD
```

即开漏输出：

```text
输出 0 → 拉低总线
输出 1 → 释放总线
```

---

## 2. START / STOP

```c
void I2C_Start(void)
{
    SDA_H();
    SCL_H();
    Delay();

    SDA_L();
    Delay();

    SCL_L();
}
```

```c
void I2C_Stop(void)
{
    SDA_L();
    SCL_H();
    Delay();

    SDA_H();
    Delay();
}
```

---

## 3. 发送 1 字节

```c
void I2C_SendByte(uint8_t data)
{
    uint8_t i;

    for (i = 0; i < 8; i++)
    {
        if (data & 0x80)
            SDA_H();
        else
            SDA_L();

        data <<= 1;

        SCL_H();
        Delay();

        SCL_L();
        Delay();
    }
}
```

> I2C 数据按 **MSB 高位先发送**。

---

## 4. 等待 ACK

```c
uint8_t I2C_WaitAck(void)
{
    uint8_t ack;

    SDA_H();              // 释放 SDA

    SCL_H();
    Delay();

    ack = SDA_READ();

    SCL_L();

    return ack;
}
```

```text
0 → ACK
1 → NACK
```

---

## 5. 接收 1 字节

```c
uint8_t I2C_ReadByte(void)
{
    uint8_t i;
    uint8_t data = 0;

    SDA_H();

    for (i = 0; i < 8; i++)
    {
        data <<= 1;

        SCL_H();
        Delay();

        if (SDA_READ())
            data |= 0x01;

        SCL_L();
        Delay();
    }

    return data;
}
```

---

## 6. 发送 ACK / NACK

```c
void I2C_SendAck(uint8_t ack)
{
    if (ack)
        SDA_H();      // NACK
    else
        SDA_L();      // ACK

    SCL_H();
    Delay();

    SCL_L();
    SDA_H();
}
```

---

## 7. 多字节接收

```c
for (i = 0; i < Len; i++)
{
    Data[i] = I2C_ReadByte();

    if (i == Len - 1)
        I2C_SendAck(1);   // 最后一个字节 NACK
    else
        I2C_SendAck(0);   // 继续接收 ACK
}
```

## 核心时序

```text
START → 地址 → ACK → 数据 → ACK → ... → NACK → STOP
```

| 操作    | 时序               |
| ----- | ---------------- |
| START | SCL 高时 SDA：1 → 0 |
| STOP  | SCL 高时 SDA：0 → 1 |
| ACK   | 第 9 个时钟 SDA = 0  |
| NACK  | 第 9 个时钟 SDA = 1  |
| 发送数据  | SCL 低时改变 SDA     |
| 读取数据  | SCL 高时读取 SDA     |
