---
title: UART
description: UART是一种常用的异步串行通信协议，通过TX和RX两根数据线实现设备间的全双工串行数据传输，广泛应用于嵌入式系统中的调试、模块通信和设备互联
pubDate: 2025-08-02
image: /image/STM32/UART1.png
categories:
  - 通信协议
tags:
  - 通信协议
---

# UART

## UART 数据收发时序

UART 是异步串行通信，不需要时钟线。通信双方需要提前约定相同的 **波特率、数据位、校验位和停止位**。

UART 总线空闲时为高电平，发送数据时先产生 `START` 起始位，随后发送数据位，最后以 `STOP` 停止位结束一帧。

<div class="uart-card not-prose">

  <div class="uart-title">TRANSMIT a byte:</div>

  <div class="uart-flow">
    <span class="sig gray">IDLE</span>
    <span class="sig green">START</span>
    <span class="sig blue">D0</span>
    <span class="sig blue">D1</span>
    <span class="sig blue">D2</span>
    <span class="sig blue">D3</span>
    <span class="sig blue">D4</span>
    <span class="sig blue">D5</span>
    <span class="sig blue">D6</span>
    <span class="sig blue">D7</span>
    <span class="sig yellow">PARITY</span>
    <span class="sig green">STOP</span>
  </div>

  <div class="uart-title">RECEIVE a byte:</div>

  <div class="uart-flow">
    <span class="sig gray">IDLE</span>
    <span class="sig green">START</span>
    <span class="sig blue">D0</span>
    <span class="sig blue">D1</span>
    <span class="sig blue">D2</span>
    <span class="sig blue">D3</span>
    <span class="sig blue">D4</span>
    <span class="sig blue">D5</span>
    <span class="sig blue">D6</span>
    <span class="sig blue">D7</span>
    <span class="sig yellow">PARITY</span>
    <span class="sig green">STOP</span>
  </div>

</div>

## 初始化串口

![UART模块结构框图](/learning-os/image/STM32/UART2.png)


### GPIO 初始化

```c
void USART1_GPIO_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStructure;

    /* 1. 开启 GPIOA 和 USART1 时钟 */
    RCC_APB2PeriphClockCmd(
        RCC_APB2Periph_GPIOA |
        RCC_APB2Periph_USART1,
        ENABLE
    );

    /* 2. 配置 PA9：TX */
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    // 复用推挽输出

    GPIO_Init(GPIOA, &GPIO_InitStructure);

    /* 3. 配置 PA10：RX */
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    // 浮空输入

    GPIO_Init(GPIOA, &GPIO_InitStructure);
}
```
### 串口初始化

```c
typedef struct
{
    uint32_t USART_BaudRate;     // 波特率
    uint16_t USART_WordLength;   // 数据位长度
    uint16_t USART_StopBits;     // 停止位
    uint16_t USART_Parity;       // 校验方式
    uint16_t USART_Mode;         // 收发模式
} USART_InitTypeDef;
```

### 常用参数

| 参数                 | 作用    | 常用值                          |
| ------------------ | ----- | ---------------------------- |
| `USART_BaudRate`   | 设置波特率 | `9600` / `115200`            |
| `USART_WordLength` | 数据帧长度 | `USART_WordLength_8b` / `9b` |
| `USART_StopBits`   | 停止位长度 | `USART_StopBits_1`           |
| `USART_Parity`     | 奇偶校验  | `No` / `Even` / `Odd`        |
| `USART_Mode`       | 收发方向  | `Tx` / `Rx` / `Tx \| Rx`     |



## USART 数据收发

### 1. 发送 1 字节

```c
void USART_SendByte(USART_TypeDef *USARTx, uint8_t Data)
{
    /* 等待发送寄存器为空 */
    while (USART_GetFlagStatus(USARTx, USART_FLAG_TXE) == RESET);

    /* 发送数据 */
    USART_SendData(USARTx, Data);
}
````

---

### 2. 接收 1 字节

```c
uint8_t USART_ReceiveByte(USART_TypeDef *USARTx)
{
    /* 等待接收到数据 */
    while (USART_GetFlagStatus(USARTx, USART_FLAG_RXNE) == RESET);

    /* 读取数据 */
    return (uint8_t)USART_ReceiveData(USARTx);
}
```

---

### 3. 发送字符串

```c
void USART_SendString(USART_TypeDef *USARTx, const char *Str)
{
    while (*Str)
    {
        USART_SendByte(USARTx, *Str++);
    }

    /* 等待最后一个字节发送完成 */
    while (USART_GetFlagStatus(USARTx, USART_FLAG_TC) == RESET);
}
```

使用：

```c
USART_SendString(USART1, "Hello UART!\r\n");
```

---

### 4. 多字节发送

```c
void USART_SendBuffer(USART_TypeDef *USARTx,
                      const uint8_t *Data,
                      uint16_t Len)
{
    uint16_t i;

    for (i = 0; i < Len; i++)
    {
        USART_SendByte(USARTx, Data[i]);
    }

    while (USART_GetFlagStatus(USARTx, USART_FLAG_TC) == RESET);
}
```

---

### 5. 多字节接收

```c
void USART_ReceiveBuffer(USART_TypeDef *USARTx,
                         uint8_t *Data,
                         uint16_t Len)
{
    uint16_t i;

    for (i = 0; i < Len; i++)
    {
        Data[i] = USART_ReceiveByte(USARTx);
    }
}
```

---

## 常用标志位

| 标志位    | 含义                |
| ------ | ----------------- |
| `TXE`  | 发送数据寄存器为空，可继续写入数据 |
| `TC`   | 数据发送完成            |
| `RXNE` | 接收数据寄存器非空，可读取数据   |

## 收发流程

```text
发送：
等待 TXE → 写入 DR → TX 发送 → 等待 TC

接收：
RX 接收 → RXNE = 1 → 读取 DR
```

> `TXE` 表示可以发送下一个字节，`TC` 表示最后一个字节已经完全发送结束。





