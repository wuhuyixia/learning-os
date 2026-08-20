---
title: CAN通信协议
description: SPI是一种广泛使用的同步串行通信协议，常用于嵌入式系统中连接高速外设
pubDate: 2024-08-18
image: /image/STM32/SPI1.png
draft: true
categories:
  - 通信协议
tags:
  - 通信协议
---
# CANopen 协议整理


## 1. CANopen 是什么

CANopen 是建立在 CAN 总线之上的高层通信协议和设备配置标准。它把不同厂商设备之间的数据交换、设备参数、网络管理和设备状态抽象成统一模型，常见于工业自动化、运动控制、工程机械、医疗设备和轨道交通等场景。

CANopen 的核心价值是标准化：同一套协议可以描述 I/O 模块、传感器、伺服驱动、控制器等不同节点，让主站能够用一致的方式配置设备、读取状态并传输实时过程数据。

## 2. 发展与应用

CANopen 由 CiA（CAN in Automation）组织推动，核心通信标准是 CiA DS-301。后续又通过大量设备行规扩展到不同设备类型，例如伺服驱动、I/O、传感器等。

典型应用包括：

- 工业自动化：PLC、传感器、执行器、HMI 之间通信。
- 运动控制：伺服驱动器、多轴同步控制。
- 特种车辆：工程机械、农业机械的内部控制网络。
- 医疗设备：设备内部各子系统通信。
- 轨道交通：列车辅助控制与监测系统。

## 3. CAN 数据帧基础

CANopen 通常使用 CAN 标准帧，重点关注以下部分：

- 仲裁段：包含 11 bit 标识符，用于决定总线仲裁优先级。
- DLC：数据长度码，指示数据段字节数。
- Data：数据段，标准 CAN 帧最大 8 字节。

CAN 帧其它部分，如 SOF、控制段、CRC、ACK、EOF 等，仍遵循普通 CAN 总线规则。

[![CAN 数据帧格式](https://i-blog.csdnimg.cn/direct/db23de19430c4d3baf7fc0aa5fa96d2f.png)](https://i-blog.csdnimg.cn/direct/db23de19430c4d3baf7fc0aa5fa96d2f.png)

## 4. CANopen 设备结构

CANopen 设备通常可以理解为三层：

- 用户应用层：实际业务逻辑，例如电机控制、传感器采样、I/O 控制。
- 对象字典（Object Dictionary, OD）：协议中最核心的数据结构，统一描述设备参数、通信对象和应用对象。
- 通信层：负责把对象字典中的数据映射到 CANopen 报文。

对象字典是 CANopen 的中心。主站配置设备、读取状态、修改参数，本质上都是在访问某个索引和子索引对应的对象。

[![CANopen 设备结构](https://i-blog.csdnimg.cn/direct/cdd4183c0d9d417f82bd9a43ba7c2a49.png)](https://i-blog.csdnimg.cn/direct/cdd4183c0d9d417f82bd9a43ba7c2a49.png)

## 5. COB-ID 与 Node-ID

在 CANopen 中，CAN 报文的 11 bit ID 通常称为 COB-ID（Communication Object Identifier）。需要区分两个概念：

- COB-ID：CANopen 通信对象编号，也就是 CAN 标准帧的 11 bit 标识符。
- Node-ID：节点地址，通常占 7 bit，CANopen 网络中常用范围为 `1~127`。

很多 CANopen 报文会把功能码和 Node-ID 组合成 COB-ID，例如：

- TPDO1：`0x180 + Node-ID`
- SDO 响应：`0x580 + Node-ID`
- SDO 请求：`0x600 + Node-ID`
- 心跳：`0x700 + Node-ID`

[![CANopen 帧 ID 组成](https://i-blog.csdnimg.cn/direct/c3366c65644b47b5a1a183a79408ed7f.png)](https://i-blog.csdnimg.cn/direct/c3366c65644b47b5a1a183a79408ed7f.png)

## 6. PDO 与 SDO

PDO（Process Data Object）和 SDO（Service Data Object）是 CANopen 中最常见、也最容易混淆的两类对象。

| 对比项 | PDO | SDO |
| --- | --- | --- |
| 主要用途 | 传输实时过程数据，如速度、位置、开关量 | 访问对象字典，用于配置、查询、参数读写 |
| 通信模型 | 生产者/消费者，类似广播 | 客户端/服务器，请求-响应 |
| 实时性 | 高，适合周期或事件触发 | 较低，适合按需访问 |
| 数据长度 | 单帧通常不超过 8 字节 | 可通过分段机制传输较大数据 |
| 应答机制 | 通常不要求逐帧确认 | 有明确响应 |
| 常见 COB-ID | `0x180 + Node-ID` 等，可配置 | 请求 `0x600 + Node-ID`，响应 `0x580 + Node-ID` |

简单理解：PDO 偏实时运行数据，SDO 偏配置与诊断。实际系统通常在启动阶段用 SDO 配置参数和 PDO 映射，进入运行后主要依赖 PDO 交换实时数据。

## 7. CANopen 报文分类

CANopen 常见报文包括：

- NMT：网络管理，用于控制节点状态切换。
- SYNC：同步报文，用于触发同步 PDO。
- TIME：时间戳相关报文。
- EMCY：紧急报文，用于上报故障。
- PDO：过程数据对象，传输实时数据。
- SDO：服务数据对象，访问对象字典。
- Heartbeat：心跳报文，用于节点在线与状态监测。

[![CANopen 报文分类与 COB-ID](https://i-blog.csdnimg.cn/direct/2e0ae7dfb4ec4ae8aff7885174777100.png)](https://i-blog.csdnimg.cn/direct/2e0ae7dfb4ec4ae8aff7885174777100.png)

## 8. 心跳报文

心跳用于监控节点是否在线以及当前 NMT 状态。从站通常周期性发送心跳，主站根据超时判断节点掉线或异常。

| 字段 | 内容 |
| --- | --- |
| COB-ID | `0x700 + Node-ID` |
| 数据长度 | 1 字节 |
| 数据 | 节点状态值，如预操作、操作、停止等 |

常见状态值：

- `0x00`：Boot-up
- `0x04`：Stopped
- `0x05`：Operational
- `0x7F`：Pre-operational

## 9. NMT 节点状态切换

NMT（Network Management）用于控制 CANopen 节点状态。NMT 报文 COB-ID 为 `0x000`，优先级最高，数据区通常为 2 字节：

| 字节 | 含义 |
| --- | --- |
| Byte0 | NMT 命令 |
| Byte1 | 目标 Node-ID，`0` 通常表示广播到所有节点 |

常见 NMT 命令：

- `0x01`：进入 Operational。
- `0x02`：进入 Stopped。
- `0x80`：进入 Pre-operational。
- `0x81`：复位节点。
- `0x82`：复位通信。

## 10. 对象字典 OD

对象字典是一个有序的对象集合，用索引（Index）和子索引（Sub-index）定位数据。它描述设备所有可访问的通信参数、应用参数和状态信息。

常见对象字典区域：

- `0x1000~0x1FFF`：通信相关对象，例如设备类型、错误寄存器、心跳时间、PDO 参数。
- `0x2000~0x5FFF`：厂商自定义对象。
- `0x6000~0x9FFF`：设备行规对象，例如 I/O、驱动器、传感器等。

[![CANopen 对象字典示例](https://i-blog.csdnimg.cn/direct/eaafcaf1fbbf4b89a94eca46d2b78a84.png)](https://i-blog.csdnimg.cn/direct/eaafcaf1fbbf4b89a94eca46d2b78a84.png)

## 11. CANopen 节点状态

CANopen 节点从上电开始通常经历以下状态：

| 状态 | 说明 |
| --- | --- |
| Initializing | 节点上电后初始化硬件、CAN 控制器和协议栈 |
| Application Reset | 应用层复位，恢复应用相关初始状态 |
| Communication Reset | 通信层复位，重新初始化 CANopen 通信对象 |
| Pre-operational | 可进行 SDO 配置和 NMT 管理，通常不能进行 PDO 通信 |
| Operational | 正常运行状态，PDO 开始工作，SDO 仍可按设备规则访问 |
| Stopped | 节点通信能力受限，通常停止 PDO 和 SDO，仅保留必要管理功能 |

典型流程：

1. 节点上电初始化。
2. 发送 Boot-up 心跳。
3. 进入 Pre-operational。
4. 主站通过 SDO 配置对象字典和 PDO 映射。
5. 主站发送 NMT Start，节点进入 Operational。
6. 系统运行期间通过 PDO 传输实时数据，通过心跳监控在线状态。

## 12. STM32 项目实战要点

- 先确认 CAN 物理层：终端电阻、波特率、采样点、收发器供电和共地。
- 为每个节点规划唯一 Node-ID，避免 COB-ID 冲突。
- 调试时先看心跳，再看 NMT，最后看 PDO/SDO。
- SDO 更适合启动配置和诊断，不适合高频实时数据。
- PDO 映射要控制在 8 字节内，并明确事件触发、定时触发或 SYNC 触发策略。
- STM32 端实现时建议先跑通标准 CAN 收发，再逐步加入 NMT、Heartbeat、SDO、PDO。
- 报文优先级由 COB-ID 决定，数值越小优先级越高；紧急、安全相关报文应避免被低优先级策略拖慢。

## 13. 快速记忆

- CANopen = CAN 总线 + 对象字典 + 网络管理 + 标准通信对象。
- Node-ID 是节点地址，COB-ID 是报文 ID。
- OD 是核心，SDO 访问 OD，PDO 映射 OD。
- SDO 负责配置和查询，PDO 负责实时数据。
- NMT 控制节点状态，Heartbeat 监控节点在线。
