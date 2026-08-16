---
title: STM32 串口 DMA 模式与不定长数据接收
description: 使用 DMA 提高 UART 数据收发效率，并结合 IDLE 空闲中断实现不定长串口数据接收
pubDate: 2026-08-12
image: /image/stm32-dma-uart.png
categories:
  - STM32
tags:
  - STM32
  - DMA
  - UART
  - Debug
---


# STM32 UART + DMA

DMA（Direct Memory Access）可以在 **UART 与内存之间自动搬运数据**，不需要 CPU 逐字节处理。

```text
普通方式：

UART → CPU → RAM


DMA 方式：

UART → DMA → RAM
          ↑
      CPU只处理结果
```

对于 STM32F103 的 `USART1`：

```text
USART1_TX → DMA1_Channel4
USART1_RX → DMA1_Channel5
```

---

## 1. UART DMA 发送

UART 发送数据时，我们已经知道：

* 数据在哪里
* 一共有多少字节

因此 TX DMA 使用 **Normal 模式**。

```text
TxBuf[]
   ↓
DMA1_Channel4
   ↓
USART1->DR
   ↓
TX
```

### DMA TX 配置

```c
DMA_InitStructure.DMA_PeripheralBaseAddr =
    (uint32_t)&USART1->DR;            // UART 数据寄存器

DMA_InitStructure.DMA_DIR =
    DMA_DIR_PeripheralDST;            // 内存 → 外设

DMA_InitStructure.DMA_PeripheralInc =
    DMA_PeripheralInc_Disable;        // DR 地址固定

DMA_InitStructure.DMA_MemoryInc =
    DMA_MemoryInc_Enable;             // 内存地址递增

DMA_InitStructure.DMA_Mode =
    DMA_Mode_Normal;                  // 单次发送
```

### 发送函数

```c
void USART1_DMA_Send(uint8_t *Data, uint16_t Len)
{
    DMA_Cmd(DMA1_Channel4, DISABLE);

    /* 设置数据地址和长度 */
    DMA1_Channel4->CMAR = (uint32_t)Data;
    DMA_SetCurrDataCounter(DMA1_Channel4, Len);

    DMA_ClearFlag(DMA1_FLAG_TC4);

    /* 启动 DMA */
    DMA_Cmd(DMA1_Channel4, ENABLE);
}
```

使用：

```c
uint8_t TxBuf[] = "Hello DMA!\r\n";

USART1_DMA_Send(TxBuf, sizeof(TxBuf) - 1);
```

> DMA 的 `TC` 表示数据已经全部搬运到 UART，并不一定表示最后一个字节已经从 TX 引脚发送完成。如果需要确认物理发送结束，还要等待 UART 的 `TC` 标志。

---

# 2. 为什么 RX 不能只用固定长度 DMA？

假设：

```c
uint8_t RxBuf[64];
```

DMA 被配置为接收 64 字节。

但实际收到：

```text
OK\r\n
```

只有 4 字节。

此时 DMA 会继续等待：

```text
已经收到：4 Byte
还需等待：60 Byte
```

因此对于 **长度未知的数据**，不能简单等待 DMA 完成。

---

# 3. Circular DMA + IDLE

更可靠的方式是：

```text
Circular DMA
    +
DMA HT / TC
    +
UART IDLE
```

### Circular DMA

RX DMA 使用循环模式：

```text
0 ───────────────────────→ 63
↑                           │
└───────────────────────────┘
```

DMA 写到缓冲区末尾后，会自动回到开头继续接收。

```c
DMA_InitStructure.DMA_Mode = DMA_Mode_Circular;
```

因此 DMA 可以一直工作，不需要每收到一帧就停止再启动。

---

## 4. HT、TC 和 IDLE

假设 DMA 缓冲区为 64 Byte。

### HT：Half Transfer

DMA 写入一半：

```text
0 ─────────────→ 31
```

触发：

```text
HT
```

---

### TC：Transfer Complete

DMA 写满整个缓冲区：

```text
0 ─────────────────────────────→ 63
```

触发：

```text
TC
```

Circular 模式下随后重新从 `0` 开始写。

---

### IDLE：串口空闲

UART 接收到最后一个字节后，如果 RX 保持空闲约 **1 个 UART 帧时间**，会产生：

```text
IDLE
```

例如：

```text
RX：

[Data][Data][Data]────────────
                   ↑
                  IDLE
```

因此 IDLE 非常适合发现：

> **当前这一批数据暂时没有继续到来。**

---

# 5. 为什么不能只依赖 IDLE？

假设：

```text
DMA Buffer = 64 Byte
```

一次连续收到：

```text
100 Byte
```

如果整个过程中没有产生空闲：

```text
前 64 Byte
    ↓
DMA 回到数组开头
    ↓
继续写后面的数据
    ↓
早期数据可能被覆盖
```

因此更可靠的方案是：

```text
HT   → 及时处理前半部分
TC   → 及时处理后半部分
IDLE → 处理没有刚好落在 HT / TC 上的尾部数据
```

三者最终调用同一个数据检查函数：

```text
DMA HT ──┐
DMA TC ──┼──→ USART_RX_Check()
IDLE   ──┘
```

---

# 6. DMA RX 初始化

```c
#define RX_BUF_SIZE 64

uint8_t USART_RxBuf[RX_BUF_SIZE];

void USART1_DMA_RX_Init(void)
{
    DMA_InitTypeDef DMA_InitStructure;

    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);

    DMA_DeInit(DMA1_Channel5);

    DMA_InitStructure.DMA_PeripheralBaseAddr =
        (uint32_t)&USART1->DR;

    DMA_InitStructure.DMA_MemoryBaseAddr =
        (uint32_t)USART_RxBuf;

    DMA_InitStructure.DMA_DIR =
        DMA_DIR_PeripheralSRC;          // UART → RAM

    DMA_InitStructure.DMA_BufferSize =
        RX_BUF_SIZE;

    DMA_InitStructure.DMA_PeripheralInc =
        DMA_PeripheralInc_Disable;

    DMA_InitStructure.DMA_MemoryInc =
        DMA_MemoryInc_Enable;

    DMA_InitStructure.DMA_PeripheralDataSize =
        DMA_PeripheralDataSize_Byte;

    DMA_InitStructure.DMA_MemoryDataSize =
        DMA_MemoryDataSize_Byte;

    DMA_InitStructure.DMA_Mode =
        DMA_Mode_Circular;              // 循环模式

    DMA_InitStructure.DMA_Priority =
        DMA_Priority_High;

    DMA_InitStructure.DMA_M2M =
        DMA_M2M_Disable;

    DMA_Init(DMA1_Channel5, &DMA_InitStructure);

    /* DMA 半传输 + 完成中断 */
    DMA_ITConfig(
        DMA1_Channel5,
        DMA_IT_HT | DMA_IT_TC,
        ENABLE
    );

    /* USART RX DMA */
    USART_DMACmd(
        USART1,
        USART_DMAReq_Rx,
        ENABLE
    );

    /* UART IDLE 中断 */
    USART_ITConfig(
        USART1,
        USART_IT_IDLE,
        ENABLE
    );

    DMA_Cmd(DMA1_Channel5, ENABLE);
}
```

---

# 7. 如何知道 DMA 写到了哪里？

DMA 的计数器表示：

```text
还有多少 Byte 没有传输
```

因此当前写入位置：

```c
pos = RX_BUF_SIZE -
      DMA_GetCurrDataCounter(DMA1_Channel5);
```

即：

$$
Pos=BufferSize-DMA_{Remaining}
$$

例如：

```text
BufferSize = 64
DMA剩余    = 54

pos = 64 - 54 = 10
```

说明 DMA 已经写入了 10 Byte。

---

# 8. 核心：处理新增数据

记录上一次处理到的位置：

```text
old_pos
```

获取 DMA 当前的位置：

```text
pos
```

然后只处理：

```text
old_pos → pos
```

代码：

```c
void USART1_RX_Check(void)
{
    static uint16_t old_pos = 0;
    uint16_t pos;

    /* DMA 当前写入位置 */
    pos = RX_BUF_SIZE -
          DMA_GetCurrDataCounter(DMA1_Channel5);

    if (pos != old_pos)
    {
        /* 情况 1：没有跨越数组末尾 */
        if (pos > old_pos)
        {
            USART_DataProcess(
                &USART_RxBuf[old_pos],
                pos - old_pos
            );
        }

        /* 情况 2：DMA 已经绕回数组开头 */
        else
        {
            /* 先处理数组尾部 */
            USART_DataProcess(
                &USART_RxBuf[old_pos],
                RX_BUF_SIZE - old_pos
            );

            /* 再处理数组开头 */
            if (pos > 0)
            {
                USART_DataProcess(
                    &USART_RxBuf[0],
                    pos
                );
            }
        }

        old_pos = pos;
    }
}
```

---

# 9. 两种位置关系

### 情况一：没有回绕

```text
0      old_pos              pos        63
|---------|==================|----------|
          ↑                  ↑
        已处理             DMA位置

          <---- 新数据 ---->
```

长度：

```c
pos - old_pos
```

---

### 情况二：DMA 已经回绕

```text
0       pos       old_pos                 63
|========|----------|======================|
   新数据                新数据
```

需要分两段处理：

```text
old_pos → Buffer末尾
0       → pos
```

这就是 Circular DMA 最关键的地方。

---

# 10. DMA 中断

HT 和 TC 都调用同一个检查函数：

```c
void DMA1_Channel5_IRQHandler(void)
{
    /* Half Transfer */
    if (DMA_GetITStatus(DMA1_IT_HT5) != RESET)
    {
        DMA_ClearITPendingBit(DMA1_IT_HT5);

        USART1_RX_Check();
    }

    /* Transfer Complete */
    if (DMA_GetITStatus(DMA1_IT_TC5) != RESET)
    {
        DMA_ClearITPendingBit(DMA1_IT_TC5);

        USART1_RX_Check();
    }
}
```

---

# 11. UART IDLE 中断

```c
void USART1_IRQHandler(void)
{
    if (USART_GetITStatus(USART1, USART_IT_IDLE) != RESET)
    {
        volatile uint32_t temp;

        /* STM32F1：读取 SR、DR 清除 IDLE */
        temp = USART1->SR;
        temp = USART1->DR;
        (void)temp;

        USART1_RX_Check();
    }
}
```

所以整个 RX 工作过程是：

```text
USART RX
   ↓
DMA 自动写入 Circular Buffer
   ↓
 ┌─────────┬─────────┬─────────┐
 │   HT    │   TC    │  IDLE   │
 └────┬────┴────┬────┴────┬────┘
      └─────────┼──────────┘
                ↓
       USART1_RX_Check()
                ↓
          处理新增数据
```

---

# 12. 数据处理

```c
void USART_DataProcess(uint8_t *Data, uint16_t Len)
{
    /* 在这里处理收到的数据 */
}
```

实际工程中不建议在中断里执行复杂操作。

更常见的是：

```text
DMA Buffer
    ↓
中断发现新数据
    ↓
复制到 Ring Buffer / Queue
    ↓
退出中断
    ↓
main() / RTOS Task
    ↓
解析协议
```

---

# 13. DMA TX 与 RX 模式选择

| 功能           | DMA 模式                        | 原因       |
| ------------ | ----------------------------- | -------- |
| UART TX      | `Normal`                      | 发送长度通常已知 |
| UART RX 固定长度 | `Normal`                      | 接收长度已知   |
| UART RX 不定长  | **Circular**                  | DMA 持续接收 |
| 不定长高速 RX     | **Circular + HT + TC + IDLE** | 防止数据被覆盖  |

---

# 14. 核心流程

### TX

```text
准备 TxBuf
   ↓
设置 DMA 地址和长度
   ↓
启动 DMA
   ↓
RAM → DMA → USART
   ↓
DMA TC
```

### RX

```text
启动 Circular DMA
        ↓
UART 不断收到数据
        ↓
DMA 自动写入 RxBuf
        ↓
   HT / TC / IDLE
        ↓
读取 DMA 当前位置
        ↓
pos 与 old_pos 比较
        ↓
只处理新增数据
```

---

# 15. 核心记忆

```text
DMA
=
替 CPU 搬数据
```

```text
UART TX
=
Normal DMA
```

```text
UART 不定长 RX
=
Circular DMA
+
HT
+
TC
+
IDLE
```

核心公式：

```c
pos = BufferSize - DMA_Remaining;
```

核心思想：

> **DMA 一直负责接收，CPU 不去停止和重新启动 DMA，而是通过 `old_pos` 和 `pos` 找出“新收到的数据”。**

这样即使数据长度未知、连续到达或者跨越 DMA 缓冲区末尾，也能够持续处理。

>https://github.com/MaJerle/stm32-usart-uart-dma-rx-tx