---
title: FreeRTOS 任务调度的几个关键点
description: 从优先级、时间片到临界区，梳理 RTOS 应用中最容易忽略的调度细节。
pubDate: 2026-08-08
image: /image/image2.webp
categories:
  - Embedded Systems
  - FreeRTOS
tags:
  - FreeRTOS
  - RTOS
  - Scheduling
---

FreeRTOS 的 API 很容易上手，但任务一多，优先级、阻塞状态和临界区就会共同决定系统的实时性。

## 优先级不是越高越好

优先级应该反映任务的截止时间和阻塞代价。采样、通信、日志和 UI 不应该全部放在最高优先级，否则低优先级任务可能长期得不到运行机会。

## 用阻塞代替轮询

```c
for (;;) {
    if (xQueueReceive(sensor_queue, &sample, portMAX_DELAY) == pdPASS) {
        process_sample(&sample);
    }
}
```

让任务在队列、信号量或通知上阻塞，可以降低 CPU 占用，也能让调度器更准确地安排实时任务。

## 三个容易忽略的点

1. 不要在高优先级任务中使用无限循环轮询。
2. 临界区只保护共享资源，避免把耗时操作放进去。
3. 任务栈大小要通过高水位线和实际数据路径验证。

> **NOTE**：调度问题最好通过运行时统计、GPIO 打点和 trace 工具共同确认，不要只凭感觉调整优先级。
