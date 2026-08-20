---
title: PID 控制基础
description: 整理 PID 控制器的基本公式，作为后续电机控制学习记录。
pubDate: 2026-08-20
categories:
  - Motor Control
tags:
  - PID
  - Control Loop
draft: false
---

# PID 控制基础

PID 控制器由比例（Proportional, P）、积分（Integral, I）和微分（Derivative, D）三部分组成，常用于速度环（Speed Loop）、位置环（Position Loop）和电流环（Current Loop）控制。

## 1. 连续形式

误差定义为：

$$
e(t)=r(t)-y(t)
$$

PID 输出为：

$$
u(t)=K_p e(t)+K_i\int_0^t e(\tau)\,d\tau+K_d\frac{de(t)}{dt}
$$

其中：

- $K_p$：比例系数
- $K_i$：积分系数
- $K_d$：微分系数

## 2. 离散形式

采样周期为 $T_s$ 时：

$$
u[k]=K_p e[k]+K_iT_s\sum_{i=0}^{k}e[i]+K_d\frac{e[k]-e[k-1]}{T_s}
$$

## 3. 增量式 PID

$$
\Delta u[k]=K_p(e[k]-e[k-1])+K_iT_s e[k]+K_d\frac{e[k]-2e[k-1]+e[k-2]}{T_s}
$$

控制输出更新为：

$$
u[k]=u[k-1]+\Delta u[k]
$$

## 4. 电机控制中的三环

在电机控制中，三个环路通常采用嵌套结构：

```text
位置环 → 速度环 → 电流环 → 电压/PWM → 电机
```

- **位置环**：控制电机转到哪里，输出目标速度 $\omega^*$。
- **速度环**：控制电机转多快，输出目标转矩电流 $i_q^*$。
- **电流环**：控制电机产生多大转矩，输出电压指令 $v_d/v_q$。

在 FOC 中通常设置：

$$
i_d^*=0
$$

$i_q^*$ 用于控制转矩。响应速度一般为：

```text
电流环最快，速度环其次，位置环最慢
```
