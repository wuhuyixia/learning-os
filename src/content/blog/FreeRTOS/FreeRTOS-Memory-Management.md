---
title: FreeRTOS 内存管理知识点整理
description: 系统梳理 FreeRTOS heap_1 到 heap_5、动态与静态内存、任务栈以及内存监控方法。
pubDate: 2026-08-13
image: /image/freertos-scheduling.png
categories:
  - FreeRTOS
tags:
  - FreeRTOS
  - Memory
  - Heap
  - RTOS
---

# FreeRTOS 内存管理知识点整理

FreeRTOS 的内存管理是嵌入式开发中非常重要的一部分。任务创建、队列、信号量、互斥量、软件定时器等内核对象，都可能涉及动态内存分配。

FreeRTOS 没有强制使用标准 C 库中的 `malloc()` 和 `free()`，而是提供了一套统一的动态内存接口：

```c
void *pvPortMalloc(size_t xSize);
void vPortFree(void *pv);
```

FreeRTOS 官方提供了 `heap_1.c`、`heap_2.c`、`heap_3.c`、`heap_4.c` 和 `heap_5.c` 五种典型的内存管理实现。

---

## 1. FreeRTOS 内存从哪里来？

FreeRTOS 的动态内存通常来自一块专门的 Heap 区域。

在 `FreeRTOSConfig.h` 中可以通过下面的宏设置 Heap 大小：

```c
#define configTOTAL_HEAP_SIZE    (20 * 1024)
```

例如：

```c
#define configTOTAL_HEAP_SIZE    (10 * 1024)
```

表示为 FreeRTOS 动态分配预留约 10 KB 内存。

很多 FreeRTOS 内核对象都会从这里申请空间，例如：

```text
FreeRTOS Heap
│
├── Task Control Block
├── Task Stack
├── Queue
├── Semaphore
├── Mutex
├── Software Timer
└── Event Group
```

需要特别注意：

> `configTOTAL_HEAP_SIZE` 并不等于 MCU 的全部 SRAM。

MCU 的 RAM 通常还要存放：

```text
.data
.bss
C Runtime Heap
Main Stack
FreeRTOS Heap
Task Stack
其他全局变量
```

因此设置过大的 FreeRTOS Heap 可能导致链接失败或系统 RAM 不足。

---

# 2. 动态内存与静态内存

FreeRTOS 支持两种对象创建方式：

- 动态创建
- 静态创建

对应的配置宏为：

```c
#define configSUPPORT_DYNAMIC_ALLOCATION    1
#define configSUPPORT_STATIC_ALLOCATION     1
```

---

## 2.1 动态创建任务

最常见的方式是：

```c
xTaskCreate(
    TaskFunction,
    "Task",
    256,
    NULL,
    2,
    NULL
);
```

创建任务时，FreeRTOS 通常需要动态申请：

```text
TCB
+
Task Stack
```

其内部最终会调用：

```c
pvPortMalloc()
```

优点：

- 使用方便
- 代码简单
- 运行时可以灵活创建任务

缺点：

- 可能产生内存碎片
- 内存占用不容易完全预测
- 内存不足时创建对象可能失败

---

## 2.2 静态创建任务

也可以提前分配好任务需要的内存：

```c
StaticTask_t xTaskBuffer;
StackType_t xStack[256];

TaskHandle_t xTaskHandle;

xTaskHandle = xTaskCreateStatic(
    TaskFunction,
    "Task",
    256,
    NULL,
    2,
    xStack,
    &xTaskBuffer
);
```

这时：

```text
Stack
TCB
```

都由用户自己提供。

优点：

- 内存完全可控
- 不存在运行时内存申请失败问题
- 更适合高可靠、实时性要求较高的系统

缺点：

- 编程稍复杂
- 内存需要提前规划

对于工业控制、汽车电子、机器人等系统，静态内存通常更加容易做资源分析。

---

# 3. pvPortMalloc() 与 vPortFree()

FreeRTOS 动态内存的核心接口是：

```c
void *pvPortMalloc(size_t xSize);
```

功能与标准 C 库的：

```c
malloc()
```

类似。

使用示例：

```c
uint8_t *buffer;

buffer = pvPortMalloc(100);

if (buffer != NULL)
{
    /* 内存申请成功 */
}
```

释放内存：

```c
vPortFree(buffer);
```

使用完成后建议：

```c
buffer = NULL;
```

完整示例：

```c
uint8_t *buffer = pvPortMalloc(128);

if (buffer != NULL)
{
    memset(buffer, 0, 128);

    /* 使用 buffer */

    vPortFree(buffer);
    buffer = NULL;
}
```

但需要注意：

并不是所有 FreeRTOS Heap 实现都支持 `vPortFree()`。

---

# 4. FreeRTOS 五种 Heap 管理方案

FreeRTOS 官方提供：

```text
heap_1.c
heap_2.c
heap_3.c
heap_4.c
heap_5.c
```

它们最大的区别在于：

```text
是否支持释放
是否合并空闲块
是否容易产生碎片
是否支持多个不连续 RAM 区域
```

---

# 5. heap_1：最简单的内存管理

`heap_1.c` 是最简单的一种实现。

核心思想：

> 只分配，不释放。

内存结构可以理解为：

```text
Heap

+------------------------------+
| 已使用 | 已使用 | 已使用 | 空闲 |
+------------------------------+
                         ^
                         |
                    下次从这里分配
```

每次调用：

```c
pvPortMalloc()
```

就将指针继续向后移动。

---

## 5.1 heap_1 的特点

支持：

```c
pvPortMalloc()
```

但不真正支持：

```c
vPortFree()
```

因此非常适合：

> 系统启动阶段创建所有任务，运行过程中不再删除任务。

典型场景：

```c
int main(void)
{
    xTaskCreate(...);
    xTaskCreate(...);
    xQueueCreate(...);

    vTaskStartScheduler();

    while (1);
}
```

如果运行过程中不删除对象，`heap_1` 的优势非常明显：

- 实现简单
- 执行时间容易预测
- 无内存碎片
- 非常适合实时系统

缺点：

- 内存无法释放
- 不适合频繁创建、删除对象

---

# 6. heap_2：支持释放，但不合并碎片

`heap_2.c` 相比 `heap_1.c` 增加了：

```c
vPortFree()
```

因此动态内存可以释放。

但是存在一个关键问题：

> 相邻的空闲内存块不会自动合并。

例如：

```text
初始状态：

+----------------------------------------+
|                Free                    |
+----------------------------------------+
```

分配三块：

```text
+--------+--------+--------+-------------+
|   A    |   B    |   C    |    Free     |
+--------+--------+--------+-------------+
```

释放 A 和 B：

```text
+--------+--------+--------+-------------+
| Free   | Free   |   C    |    Free     |
+--------+--------+--------+-------------+
```

虽然前面两个 `Free` 是连续的，但 `heap_2` 不会把它们合并成一个更大的空闲块。

因此可能出现：

```text
总空闲内存足够
```

但是：

```text
没有足够大的连续内存块
```

最终导致申请失败。

这就是：

# 内存碎片

---

# 7. heap_3：直接封装 malloc/free

`heap_3.c` 本质上使用标准 C 库：

```c
malloc()
free()
```

其内部逻辑可以理解为：

```c
pvPortMalloc()
        ↓
malloc()

vPortFree()
        ↓
free()
```

因此：

```text
FreeRTOS Heap
```

实际上使用的是 C Runtime Heap。

优点：

- 实现简单
- 可以直接利用编译器的内存管理机制

缺点：

- 行为与标准库实现有关
- 实时性难以严格保证
- 可能产生内存碎片

因此在资源受限的嵌入式实时系统中，通常不会优先选择 `heap_3`。

---

# 8. heap_4：最常用的方案

对于大部分 FreeRTOS 工程：

> `heap_4.c` 是最常用的一种 Heap 实现。

它支持：

```text
动态申请
动态释放
相邻空闲块合并
```

因此相比 `heap_2`，它可以显著降低内存碎片问题。

---

## 8.1 heap_4 内存合并

假设最初：

```text
+------------------------------------------+
|                  Free                    |
+------------------------------------------+
```

分配：

```text
+--------+--------+--------+---------------+
|   A    |   B    |   C    |     Free      |
+--------+--------+--------+---------------+
```

释放 B：

```text
+--------+--------+--------+---------------+
|   A    |  Free  |   C    |     Free      |
+--------+--------+--------+---------------+
```

然后释放 C：

```text
+--------+-------------------------------+
|   A    |              Free             |
+--------+-------------------------------+
```

因为：

```text
B
C
后面的 Free
```

在物理地址上连续，所以 `heap_4` 会进行合并。

这使其非常适合：

```text
任务动态创建和删除
队列动态创建和删除
网络数据缓冲
GUI
通信协议栈
```

因此：

> 一般应用如果没有特殊要求，可以优先考虑 `heap_4.c`。

---

# 9. heap_5：支持多个内存区域

`heap_5.c` 与 `heap_4.c` 的算法类似。

但它最大的优势是：

> 支持多个不连续的 RAM 区域。

例如 MCU 可能有：

```text
SRAM1
SRAM2
SRAM3
SDRAM
PSRAM
```

这些内存地址并不连续。

`heap_5` 可以把多个区域统一作为 FreeRTOS Heap 使用。

例如：

```text
SRAM1
0x20000000
+-----------+
| Heap Area |
+-----------+

SRAM2
0x20020000
+-----------+
| Heap Area |
+-----------+

External RAM
0x60000000
+-----------+
| Heap Area |
+-----------+
```

---

## 9.1 heap_5 配置

使用：

```c
HeapRegion_t
```

配置内存区域。

示例：

```c
static const HeapRegion_t xHeapRegions[] =
{
    { (uint8_t *)0x20010000, 20 * 1024 },
    { (uint8_t *)0x20020000, 32 * 1024 },
    { NULL, 0 }
};
```

然后：

```c
vPortDefineHeapRegions(xHeapRegions);
```

需要注意：

> `vPortDefineHeapRegions()` 必须在第一次调用 `pvPortMalloc()` 之前完成。

---

# 10. 五种 Heap 对比

| Heap | 支持申请 | 支持释放 | 合并空闲块 | 多 RAM 区域 | 推荐场景 |
|---|---|---|---|---|---|
| heap_1 | √ | × | 不需要 | × | 对象只创建不删除 |
| heap_2 | √ | √ | × | × | 固定大小对象较多 |
| heap_3 | √ | √ | 取决于 libc | 取决于平台 | 依赖标准库 |
| heap_4 | √ | √ | √ | × | 大多数 FreeRTOS 项目 |
| heap_5 | √ | √ | √ | √ | 多 SRAM / 外部 RAM |

实际工程中，可以简单记忆：

```text
简单且不释放 → heap_1

一般项目       → heap_4

多个 RAM 区域  → heap_5
```

---

# 11. 如何查看剩余 Heap？

FreeRTOS 提供：

```c
xPortGetFreeHeapSize()
```

用于获取当前剩余 Heap：

```c
size_t freeHeap;

freeHeap = xPortGetFreeHeapSize();

printf("Free Heap: %u bytes\r\n",
       (unsigned int)freeHeap);
```

但是这个值只能告诉我们：

```text
当前还有多少空闲内存
```

无法反映历史上的最低内存余量。

---

# 12. 最低剩余 Heap

另一个更有用的接口是：

```c
xPortGetMinimumEverFreeHeapSize()
```

它表示：

> 系统运行以来出现过的最低剩余 Heap。

例如：

```c
printf("Free Heap      : %u\r\n",
       (unsigned int)xPortGetFreeHeapSize());

printf("Min Free Heap  : %u\r\n",
       (unsigned int)xPortGetMinimumEverFreeHeapSize());
```

假设打印结果：

```text
Free Heap     : 8200
Min Free Heap : 3250
```

表示：

```text
当前剩余 8200 Byte

系统历史上最低只剩 3250 Byte
```

因此：

```c
xPortGetMinimumEverFreeHeapSize()
```

非常适合评估系统的 Heap 安全余量。

---

# 13. 内存申请失败 Hook

如果动态内存申请失败，可以启用：

```c
#define configUSE_MALLOC_FAILED_HOOK    1
```

然后实现：

```c
void vApplicationMallocFailedHook(void)
{
    taskDISABLE_INTERRUPTS();

    while (1)
    {
    }
}
```

当：

```c
pvPortMalloc()
```

无法申请到足够内存时，就可以进入该 Hook。

实际工程中可以在这里：

```text
打印错误日志
点亮错误 LED
保存故障信息
系统复位
```

例如：

```c
void vApplicationMallocFailedHook(void)
{
    printf("FreeRTOS malloc failed!\r\n");

    printf("Free Heap = %u\r\n",
           (unsigned int)xPortGetFreeHeapSize());

    taskDISABLE_INTERRUPTS();

    while (1);
}
```

---

# 14. 任务栈也是重要内存消耗

学习 FreeRTOS 内存管理时，一个常见误区是：

> 只关注 Heap，而忽略任务 Stack。

例如：

```c
xTaskCreate(
    Task1,
    "Task1",
    512,
    NULL,
    2,
    NULL
);
```

这里的：

```c
512
```

通常表示：

```text
512 个 StackType_t
```

并不一定是：

```text
512 Byte
```

假设 MCU 为 32 位平台：

```c
sizeof(StackType_t) = 4 Byte
```

那么：

```text
512 × 4 = 2048 Byte
```

即该任务仅栈空间就可能需要约：

```text
2 KB
```

如果创建：

```text
10 个任务
```

每个任务：

```text
2 KB
```

则仅任务栈就可能占用：

```text
20 KB RAM
```

所以任务栈大小必须谨慎设置。

---

# 15. 如何检查任务栈使用情况？

FreeRTOS 提供：

```c
uxTaskGetStackHighWaterMark()
```

用于检查某个任务历史上的最小剩余栈空间。

例如：

```c
UBaseType_t freeStack;

freeStack = uxTaskGetStackHighWaterMark(NULL);

printf("Task free stack = %u\r\n",
       (unsigned int)freeStack);
```

这里：

```text
NULL
```

表示查询当前任务。

如果返回值非常小，例如：

```text
3
5
8
```

说明任务栈已经接近耗尽。

如果返回：

```text
300
```

而任务一直运行稳定，则可能说明栈分配过多，可以适当减小。

---

# 16. Stack Overflow 检测

建议在调试阶段开启：

```c
#define configCHECK_FOR_STACK_OVERFLOW    2
```

然后实现：

```c
void vApplicationStackOverflowHook(
    TaskHandle_t xTask,
    char *pcTaskName)
{
    printf("Stack overflow: %s\r\n", pcTaskName);

    taskDISABLE_INTERRUPTS();

    while (1);
}
```

如果任务发生栈溢出，可以快速定位。

这是 FreeRTOS 项目中非常推荐开启的一项调试功能。

---

# 17. 哪些对象会消耗 Heap？

很多 FreeRTOS API 都可能进行内存申请。

例如：

## 创建任务

```c
xTaskCreate()
```

会分配：

```text
TCB
Task Stack
```

---

## 创建队列

```c
xQueueCreate()
```

例如：

```c
QueueHandle_t queue;

queue = xQueueCreate(
    10,
    sizeof(uint32_t)
);
```

其内部需要保存：

```text
Queue Control Block
+
10 × sizeof(uint32_t)
```

---

## 创建信号量

```c
xSemaphoreCreateBinary();
xSemaphoreCreateCounting();
```

---

## 创建互斥量

```c
xSemaphoreCreateMutex();
```

---

## 创建软件定时器

```c
xTimerCreate();
```

---

## 创建事件组

```c
xEventGroupCreate();
```

这些对象如果使用动态版本，通常都会占用 FreeRTOS Heap。

---

# 18. 删除对象是否会释放内存？

对于支持释放的 Heap 实现，例如：

```text
heap_4
heap_5
```

删除对象后，其动态内存通常可以释放。

例如：

```c
vTaskDelete(taskHandle);
```

删除队列：

```c
vQueueDelete(queueHandle);
```

删除事件组：

```c
vEventGroupDelete(eventGroup);
```

删除软件定时器时需要使用对应 Timer API。

但是如果使用：

```text
heap_1
```

即使对象删除，Heap 空间也不会重新用于后续分配。

---

# 19. 一个典型的 RAM 分布

对于 MCU，可以把 RAM 粗略理解为：

```text
SRAM
│
├── .data
│   └── 已初始化全局变量
│
├── .bss
│   └── 未初始化全局变量
│
├── FreeRTOS Heap
│   ├── Task TCB
│   ├── Task Stack
│   ├── Queue
│   ├── Semaphore
│   └── Timer
│
├── C Heap
│   └── malloc()
│
└── Main Stack
```

如果使用：

```text
heap_1
heap_2
heap_4
```

FreeRTOS 一般维护自己的 Heap 空间。

如果使用：

```text
heap_3
```

则通常直接使用 C 库的 Heap。

---

# 20. FreeRTOS 内存碎片是什么？

假设有：

```text
100 KB Heap
```

先申请：

```text
20 KB
20 KB
20 KB
20 KB
```

然后释放其中一些：

```text
+-------+-------+-------+-------+-------+
| Free  | Used  | Free  | Used  | Free  |
+-------+-------+-------+-------+-------+
```

可能此时：

```text
总空闲内存 = 50 KB
```

但是最大的连续空闲区域只有：

```text
20 KB
```

此时申请：

```text
30 KB
```

仍然可能失败。

所以：

> 总空闲 Heap 足够，不代表一定可以成功申请一块大内存。

这就是动态内存碎片问题。

---

# 21. 为什么实时系统不喜欢频繁 malloc？

在普通 PC 程序中：

```c
malloc();
free();
```

非常常见。

但在实时嵌入式系统里，频繁动态分配会带来几个问题：

```text
执行时间不确定
内存碎片
申请失败
调试困难
长期运行可靠性下降
```

因此一个比较典型的实时系统设计原则是：

> 初始化阶段完成大多数内存申请，系统运行后尽量减少动态内存申请和释放。

例如：

```c
int main(void)
{
    CreateTasks();
    CreateQueues();
    CreateSemaphores();

    vTaskStartScheduler();

    while (1);
}
```

而不是在任务循环中不断：

```c
while (1)
{
    ptr = pvPortMalloc(...);

    ...

    vPortFree(ptr);
}
```

---

# 22. 常见错误：在循环中反复申请内存

不推荐：

```c
void Task(void *argument)
{
    while (1)
    {
        uint8_t *buffer;

        buffer = pvPortMalloc(1024);

        if (buffer != NULL)
        {
            ProcessData(buffer);

            vPortFree(buffer);
        }

        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
```

虽然 `heap_4` 可以处理这种情况，但对于实时系统，更推荐：

```c
void Task(void *argument)
{
    static uint8_t buffer[1024];

    while (1)
    {
        ProcessData(buffer);

        vTaskDelay(pdMS_TO_TICKS(100));
    }
}
```

这样：

```text
没有运行时 malloc
没有动态释放
执行时间更容易预测
```

---

# 23. 常见错误：大数组放在任务栈里

例如：

```c
void Task(void *argument)
{
    uint8_t imageBuffer[10000];

    while (1)
    {
    }
}
```

这个局部数组需要：

```text
约 10 KB Task Stack
```

很容易造成栈溢出。

更好的方法包括：

```c
static uint8_t imageBuffer[10000];
```

或者：

```c
uint8_t *imageBuffer;

imageBuffer = pvPortMalloc(10000);
```

具体选择取决于：

```text
生命周期
RAM 分布
实时性要求
是否允许动态内存
```

---

# 24. 常见错误：忽略 printf 的栈开销

某些标准库的：

```c
printf()
sprintf()
snprintf()
```

特别是带浮点格式：

```c
printf("%.2f", value);
```

可能需要较大的任务栈。

因此一个任务：

```text
不使用 printf
```

可能：

```text
256 words
```

就够。

加入：

```c
printf()
```

后，却可能发生：

```text
Stack Overflow
```

所以在调试任务栈时，需要特别关注标准库函数。

---

# 25. FreeRTOS 内存调试建议

建议在开发阶段至少开启：

```c
#define configUSE_MALLOC_FAILED_HOOK       1
#define configCHECK_FOR_STACK_OVERFLOW     2
```

并定期输出：

```c
xPortGetFreeHeapSize();
xPortGetMinimumEverFreeHeapSize();
uxTaskGetStackHighWaterMark();
```

例如：

```c
void MemoryMonitorTask(void *argument)
{
    while (1)
    {
        printf(
            "Heap: %u, Min Heap: %u\r\n",
            (unsigned int)xPortGetFreeHeapSize(),
            (unsigned int)xPortGetMinimumEverFreeHeapSize()
        );

        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}
```

---

# 26. 实际项目中的推荐配置

一般 MCU 项目可以从下面的配置开始：

```c
#define configSUPPORT_DYNAMIC_ALLOCATION    1
#define configSUPPORT_STATIC_ALLOCATION     1

#define configUSE_MALLOC_FAILED_HOOK        1
#define configCHECK_FOR_STACK_OVERFLOW      2
```

Heap 可以优先选择：

```text
heap_4.c
```

然后根据实际运行情况观察：

```c
xPortGetMinimumEverFreeHeapSize()
```

再调整：

```c
configTOTAL_HEAP_SIZE
```

---

# 27. ESP32 使用 FreeRTOS 时要注意什么？

ESP32 也是 FreeRTOS 非常常见的使用平台，但 ESP-IDF 对 FreeRTOS 内存管理进行了较多扩展。

例如 ESP32 可能同时具有：

```text
Internal SRAM
IRAM
DRAM
PSRAM
```

ESP-IDF 还提供：

```c
heap_caps_malloc()
```

可以指定内存能力。

例如：

```c
heap_caps_malloc(
    1024,
    MALLOC_CAP_8BIT
);
```

或者从 PSRAM 申请：

```c
heap_caps_malloc(
    size,
    MALLOC_CAP_SPIRAM
);
```

因此，在 ESP32 项目中：

> 不应简单把官方原生 FreeRTOS 的 `heap_1~heap_5` 使用方式与 ESP-IDF 的 Heap 实现完全等同。

理解 FreeRTOS 原生 Heap 机制仍然非常重要，但实际 ESP-IDF 工程中还需要进一步学习 ESP32 的多区域 Heap 管理机制。

---

# 28. FreeRTOS Heap 选择建议

可以使用下面的选择逻辑。

```text
开始
 │
 ▼
运行时是否需要释放内存？
 │
 ├── 否
 │    │
 │    └── heap_1
 │
 └── 是
      │
      ▼
是否存在多个不连续 RAM 区域？
      │
      ├── 是
      │    │
      │    └── heap_5
      │
      └── 否
           │
           └── heap_4
```

如果没有特殊需求：

```text
优先 heap_4
```

通常是一个合理选择。

---

# 29. FreeRTOS 内存管理核心知识总结

学习 FreeRTOS 内存管理，重点掌握下面这些内容即可：

## FreeRTOS 动态内存接口

```c
pvPortMalloc()
vPortFree()
```

## Heap 总大小

```c
configTOTAL_HEAP_SIZE
```

## 动态/静态内存配置

```c
configSUPPORT_DYNAMIC_ALLOCATION
configSUPPORT_STATIC_ALLOCATION
```

## Heap 状态检测

```c
xPortGetFreeHeapSize()
xPortGetMinimumEverFreeHeapSize()
```

## 栈空间检测

```c
uxTaskGetStackHighWaterMark()
```

## 内存申请失败检测

```c
configUSE_MALLOC_FAILED_HOOK
vApplicationMallocFailedHook()
```

## 栈溢出检测

```c
configCHECK_FOR_STACK_OVERFLOW
vApplicationStackOverflowHook()
```

## Heap 实现

```text
heap_1：只申请，不释放

heap_2：可释放，不合并

heap_3：封装 malloc/free

heap_4：可释放，可合并，最常用

heap_5：heap_4 + 多内存区域
```

---

# 30. 一张图记住 FreeRTOS 内存管理

```text
                    FreeRTOS 内存管理
                           │
          ┌────────────────┴────────────────┐
          │                                 │
       对象内存                           任务栈
          │                                 │
   ┌──────┼────────┐                 uxTaskGetStack
   │      │        │                 HighWaterMark()
 Task   Queue   Semaphore
   │
   ▼
pvPortMalloc()
   │
   ▼
+-----------------------------+
|          FreeRTOS Heap       |
+-----------------------------+
   │
   ├── heap_1
   ├── heap_2
   ├── heap_3
   ├── heap_4
   └── heap_5
   │
   ▼
xPortGetFreeHeapSize()
xPortGetMinimumEverFreeHeapSize()
```

---

# 31. 博客结语

FreeRTOS 的内存管理并不复杂，真正需要理解的是三个层次：

第一层是：

```text
FreeRTOS 的任务、队列、信号量等对象需要占用 RAM。
```

第二层是：

```text
FreeRTOS 可以通过动态方式或静态方式管理这些内存。
```

第三层是：

```text
如果采用动态内存，则需要根据项目特点选择合适的 Heap 实现。
```

对于普通嵌入式项目，通常可以采用：

```text
heap_4
+
Malloc Failed Hook
+
Stack Overflow Hook
+
Heap Watermark
+
Stack High Water Mark
```

形成一套比较完整的内存监控机制。

在此基础上，再结合 MCU 的 `.map` 文件、链接脚本以及实际运行时的 RAM 监控，就可以比较系统地分析一个 FreeRTOS 项目的内存占用情况。
