---
title: SPI
description: SPI是一种广泛使用的同步串行通信协议，常用于嵌入式系统中连接高速外设
pubDate: 2024-08-18
image: /image/STM32/SPI1.png
categories:
  - 通信协议
tags:
  - 通信协议
---


# SPI

## SPI总线结构

![SPI总线结构的电路结构](/learning-os/image/STM32/SPI1.png)


SPI 通信通常由主机发起：

```text
NSS 拉低
   ↓
选择从机
   ↓
主机产生 SCK
   ↓
MOSI：主机 → 从机
MISO：从机 → 主机
   ↓
每个时钟传输 1 bit
   ↓
完成 8 bit / 16 bit 数据传输
   ↓
NSS 拉高
   ↓
通信结束
```

SPI 是 **全双工通信**：

```text
MOSI：Master Output Slave Input   → 主发从收
MISO：Master Input Slave Output   → 主收从发
SCK ：Serial Clock               → 时钟
NSS ：Slave Select               → 从机选择，低电平有效
```

---

## 数据传输过程

以传输 1 字节 `10110010` 为例：

```text
      D7 D6 D5 D4 D3 D2 D1 D0
       1  0  1  1  0  0  1  0
       ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓
SCK： 1  2  3  4  5  6  7  8
```

每产生一个 SCK 时钟周期，就完成 **1 bit 数据交换**。

因此：

$$
8\text{ 个时钟周期}=1\text{ Byte}
$$

---

##  SPI 波形

以常用的 **SPI Mode 0** 为例：

```text
NSS  ─────┐                         ┌─────
          └─────────────────────────┘

SCK  _____┌─┐_┌─┐_┌─┐_┌─┐_┌─┐_____
          ↑   ↑   ↑   ↑   ↑
         采样 采样 采样 采样 采样

MOSI ----D7--D6--D5--D4--D3--D2--D1--D0----

MISO ----D7--D6--D5--D4--D3--D2--D1--D0----
```

Mode 0：

```text
CPOL = 0 → SCK 空闲时为低电平
CPHA = 0 → 第一个边沿采样数据
```

即：

```text
上升沿 → 采样数据
下降沿 → 改变数据
```

---

##  SPI 四种模式

SPI 时序由 `CPOL` 和 `CPHA` 决定：

| Mode   | CPOL | CPHA | SCK 空闲 | 数据采样 |
| ------ | ---: | ---: | ------ | ---- |
| Mode 0 |    0 |    0 | 低电平    | 上升沿  |
| Mode 1 |    0 |    1 | 低电平    | 下降沿  |
| Mode 2 |    1 |    0 | 高电平    | 下降沿  |
| Mode 3 |    1 |    1 | 高电平    | 上升沿  |

### CPOL

`CPOL` 决定 **SCK 空闲时的电平**：

```text
CPOL = 0 → 空闲低电平
CPOL = 1 → 空闲高电平
```

### CPHA

`CPHA` 决定 **在哪一个时钟边沿采样数据**：

```text
CPHA = 0 → 第一个边沿采样
CPHA = 1 → 第二个边沿采样
```

---

## 核心记忆

```text
NSS 拉低 → 开始通信
SCK      → 提供同步时钟
MOSI     → 主机发送
MISO     → 主机接收
NSS 拉高 → 通信结束
```

> SPI 没有像 I2C 那样的 START、STOP 和 ACK 信号，主要依靠 **NSS + SCK** 控制一次通信过程。


## SPI 传输顺序

SPI 可以配置数据的发送顺序：

```text
MSB First → 高位先发送
LSB First → 低位先发送
```

例如发送：

```text
0xB2 = 1011 0010
```

MSB First：

```text
1 → 0 → 1 → 1 → 0 → 0 → 1 → 0
D7                              D0
```

LSB First：

```text
0 → 1 → 0 → 0 → 1 → 1 → 0 → 1
D0                              D7
```
---

## SPI 数据宽度

SPI 每次可以按固定的数据宽度进行传输。

```c
SPI_DataSize_8b      // 8 bit
SPI_DataSize_16b     // 16 bit
```

## SPI模块初始化

![SPI内部结构框图](/learning-os/image/STM32/SPI2.png)



```c
typedef struct
{
    uint16_t SPI_Direction;          // SPI 通信方向
    uint16_t SPI_Mode;               // 主机 / 从机模式
    uint16_t SPI_DataSize;           // 数据宽度：8 bit / 16 bit
    uint16_t SPI_CPOL;               // 时钟极性
    uint16_t SPI_CPHA;               // 时钟相位
    uint16_t SPI_NSS;                // 软件 / 硬件 NSS
    uint16_t SPI_BaudRatePrescaler;  // 波特率分频系数
    uint16_t SPI_FirstBit;           // MSB / LSB 先发送
} SPI_InitTypeDef;
```

## SPI 主机全双工收发

```c
void App_SPI_MasterTransmitReceive(SPI_TypeDef *SPIx,
                                   const uint8_t *pDataTx,
                                   uint8_t *pDataRx,
                                   uint16_t Size)
{
    uint16_t i;

    if (Size == 0)
        return;

    /* 1. 使能 SPI */
    SPI_Cmd(SPIx, ENABLE);

    /* 2. 先发送第 1 个字节 */
    SPI_I2S_SendData(SPIx, pDataTx[0]);

    /* 3. 流水收发 */
    for (i = 0; i < Size - 1; i++)
    {
        /* 等待发送寄存器为空 */
        while (SPI_I2S_GetFlagStatus(SPIx, SPI_I2S_FLAG_TXE) == RESET);

        /* 发送下一个字节 */
        SPI_I2S_SendData(SPIx, pDataTx[i + 1]);

        /* 等待接收完成 */
        while (SPI_I2S_GetFlagStatus(SPIx, SPI_I2S_FLAG_RXNE) == RESET);

        /* 读取当前接收数据 */
        pDataRx[i] = (uint8_t)SPI_I2S_ReceiveData(SPIx);
    }

    /* 4. 读取最后一个字节 */
    while (SPI_I2S_GetFlagStatus(SPIx, SPI_I2S_FLAG_RXNE) == RESET);

    pDataRx[Size - 1] = (uint8_t)SPI_I2S_ReceiveData(SPIx);

    /* 5. 等待 SPI 总线空闲 */
    while (SPI_I2S_GetFlagStatus(SPIx, SPI_I2S_FLAG_BSY) == SET);
}
```





