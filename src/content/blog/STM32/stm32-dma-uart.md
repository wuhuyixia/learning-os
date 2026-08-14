---
title: STM32 DMA + UART 使用记录
description: 记录 STM32 DMA 接收串口数据时遇到的问题和解决方法。
pubDate: 2026-08-12
image: /image/stm32-dma-uart.png
categories:
  - Embedded Systems
  - STM32
tags:
  - STM32
  - DMA
  - UART
  - Debug
---

在嵌入式项目中，串口通常是最先接入、也最容易暴露问题的接口。本文记录一次从普通接收中断切换到 **DMA + IDLE** 的过程。

## 为什么选择 DMA + IDLE

普通字节中断适合低速、短报文场景，但当数据持续到达时，中断频率会显著增加。DMA 负责搬运数据，IDLE 线检测负责告诉我们一帧数据已经结束，两者结合可以减少 CPU 介入。

> **WARNING**：使用 DMA 和 Cache 时需要注意数据一致性。开启 D-Cache 的 Cortex-M7 需要在 DMA 前后进行 Cache 维护。

## 基本实现

```c
static uint8_t rx_buf[RX_BUF_SIZE];

HAL_UARTEx_ReceiveToIdle_DMA(&huart2, rx_buf, RX_BUF_SIZE);

void HAL_UARTEx_RxEventCallback(UART_HandleTypeDef *huart,
                                uint16_t size)
{
    if (huart->Instance == USART2) {
        ring_buffer_write(rx_buf, size);
        HAL_UARTEx_ReceiveToIdle_DMA(&huart2, rx_buf, RX_BUF_SIZE);
    }
}
```

## 调试检查清单

| 检查项 | 需要确认的内容 |
| --- | --- |
| DMA 配置 | Stream、Channel、方向和优先级与芯片手册一致 |
| Size 参数 | 代表本次接收的有效长度，而不是 buffer 总长度 |
| Cache | DMA 前后是否完成 Clean / Invalidate |
| 重启接收 | 回调结束前是否重新启动下一帧接收 |

## 结论

先用逻辑分析仪确认波形和帧边界，再查看回调参数。把“没有收到数据”拆成硬件链路、外设配置、DMA 状态和上层解析四层，定位速度会快很多。
