---
title: ADC 基础与采样时间
description: 简单记录 ADC 的基本概念，以及采样时间和转换时间的计算方法。
pubDate: 2026-08-20
categories:
  - STM32
tags:
  - ADC
  - STM32
  - Sampling
draft: true
---

# ADC 基础与采样时间

ADC（Analog-to-Digital Converter）用于将模拟电压转换为数字量。对于 $N$ 位 ADC，输入范围为 $0\sim V_{ref}$ 时，数字结果可以近似表示为：

$$
D=\frac{V_{in}}{V_{ref}}(2^N-1)
$$

反推出输入电压：

$$
V_{in}=\frac{D}{2^N-1}V_{ref}
$$

## 1. 采样时间

ADC 采样时，内部采样电容需要一定时间充电。设 ADC 时钟频率为 $f_{ADC}$，采样周期数为 $N_s$，则采样时间为：

$$
t_{sample}=\frac{N_s}{f_{ADC}}
$$

输入信号源阻抗较大时，通常需要选择更长的采样时间，使采样电容充分充电。

## 2. 转换时间

ADC 完成一次模数转换还需要一定的转换周期。设转换周期数为 $N_c$，则转换时间为：

$$
t_{convert}=\frac{N_c}{f_{ADC}}
$$

一次完整转换的总时间为：

$$
t_{total}=t_{sample}+t_{convert}
$$

即：

$$
t_{total}=\frac{N_s+N_c}{f_{ADC}}
$$

对应的理论最高采样频率为：

$$
f_{sample}=\frac{1}{t_{total}}=\frac{f_{ADC}}{N_s+N_c}
$$

不同 STM32 型号的转换周期数可能不同，实际使用时应以对应芯片的数据手册为准。
