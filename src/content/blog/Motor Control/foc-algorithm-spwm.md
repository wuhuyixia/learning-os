---
title: FOC 算法原理与实现记录
description: 记录磁场定向控制（FOC）的基本原理、坐标变换、SVPWM 与电流环调试过程。
pubDate: 2025-06-13
categories:
  - Motor Control
  - FOC
image: /image/foc-inverter-current-path.png
tags:
  - FOC
  - PMSM
  - Clarke Transform
  - Park Transform
draft: false
---

# FOC 算法原理

## 1. FOC是什么

FOC 是 Field Oriented Control 的缩写，中文一般称为：
磁场定向控制

## 2. 电机模型与基本概念

![三相逆变器与永磁同步电机电流路径示意图](/learning-os/image/foc-inverter-current-path.png)

*图 1：三相逆变器、永磁同步电机及电流路径示意图。*

无刷电机跟有刷电机的区别, 顾名思义就是无刷电机没有了有刷电机里的电刷。因此它不能够如同有刷电机那样采用机械结构就可以进行电流的换向， 而是必须通过采用如MOS这样的器件实现电子换向，MOS本质上就是可以理解为一种开关，可以像水龙头控制水流通断一样控制电流通断。

对电机的控制实际上就是对MOS管开关规律的控制。而MOS管的开关规律是需要用到单片机程序进行控制的，因此这就引出了我们的FOC控制算法，FOC控制就是一种对电机运动模型进行抽象化和简化，进而有规律控制各个MOS管开关和通断的过程。

## 3. Clarke 变换

```text
ia, ib, ic  →  iα, iβ
```
所谓克拉克变换，实际上就是降维解耦的过程，把难以辨明和控制的三相相位差120°电机波形降维为两维矢量。

  它的思路其实特别的简单，第一就是把三相随时间变换的，相位差为120°的电流波形抽象化为三个间隔120°的矢量。

  第二就是利用三角函数对矢量进行降维，降维到两个坐标轴，从此复杂的三相变化问题就降解为了α-β坐标轴的坐标上的数值变化问题。


Clarke 变换用于将三相电流

$$
i_a,\quad i_b,\quad i_c
$$

转换到二维静止坐标系：

$$
i_\alpha,\quad i_\beta
$$


将三相电流投影到 $\alpha$ 轴：

$$
i_\alpha
=
\frac{2}{3}
\left(
i_a\cos0^\circ
+i_b\cos120^\circ
+i_c\cos240^\circ
\right)
$$

因此：

$$
\boxed{
i_\alpha
=
\frac{2}{3}
\left(
i_a-\frac{1}{2}i_b-\frac{1}{2}i_c
\right)
}
$$


同理，将三相电流投影到 $\beta$ 轴：

$$
i_\beta
=
\frac{2}{3}
\left(
i_a\sin0^\circ
+i_b\sin120^\circ
+i_c\sin240^\circ
\right)
$$


因此：

$$
i_\beta
=
\frac{2}{3}
\left(
\frac{\sqrt{3}}{2}i_b
-
\frac{\sqrt{3}}{2}i_c
\right)
$$

整理得到：

$$
\boxed{
i_\beta
=
\frac{1}{\sqrt{3}}
(i_b-i_c)
}
$$

对于对称三相电机：

$$
\boxed{
i_a+i_b+i_c=0
}
$$

因此：

$$
i_c=-i_a-i_b
$$

代入 $i_\alpha$：

$$
i_\alpha
=
\frac{2}{3}
\left[
i_a-\frac{1}{2}i_b
-\frac{1}{2}(-i_a-i_b)
\right]
$$


因此：

$$
\boxed{i_\alpha=i_a}
$$

---

再代入 $i_\beta$：

$$
i_\beta
=
\frac{1}{\sqrt{3}}
\left[
i_b-(-i_a-i_b)
\right]
$$

得到：

$$
\boxed{
i_\beta
=
\frac{i_a+2i_b}{\sqrt{3}}
}
$$


FOC 中常用的 Clarke 变换最终可以写成：

$$
\begin{bmatrix}
i_{\alpha} \\
i_{\beta}
\end{bmatrix}
=
\frac{2}{3}
\begin{bmatrix}
1 & -\frac{1}{2} & -\frac{1}{2} \\
0 & \frac{\sqrt{3}}{2} & -\frac{\sqrt{3}}{2}
\end{bmatrix}
\begin{bmatrix}
i_a \\
i_b \\
i_c
\end{bmatrix}
$$

Clarke 的逆变换
$$
\begin{bmatrix}
i_a \\
i_b \\
i_c
\end{bmatrix}
=
\begin{bmatrix}
1 & 0 \\
-\frac{1}{2} & \frac{\sqrt{3}}{2} \\
-\frac{1}{2} & -\frac{\sqrt{3}}{2}
\end{bmatrix}
\begin{bmatrix}
i_{\alpha} \\
i_{\beta}
\end{bmatrix}
$$








## 4. Park 变换

```text
iα, iβ  →  id, iq
```

经过 Clarke 变换，我们已经把三相电流：

$$
i_a,\quad i_b,\quad i_c
$$

转换到了二维静止坐标系：

$$
i_\alpha,\quad i_\beta
$$

但是 $\alpha-\beta$ 坐标系本身是固定不动的，而电机转子磁场会随着转子不断旋转，因此：

$$
i_\alpha,\quad i_\beta
$$

仍然是随时间变化的量。

Park 变换的作用，就是把静止的 $\alpha-\beta$ 坐标系旋转到和转子磁场同步的 $d-q$ 坐标系中。

$$
\begin{bmatrix} i_d \\ i_q \end{bmatrix}
=
\begin{bmatrix}
\cos\theta & \sin\theta \\
-\sin\theta & \cos\theta
\end{bmatrix}
\begin{bmatrix}
i_\alpha \\
i_\beta
\end{bmatrix}
$$


其中，d轴方向与转子磁链方向重合，又叫直轴;q轴方向与转子磁链方向垂直，又叫交轴;

Clarke 变换和 Park 变换连起来就是：

$$
\boxed{
abc
\overset{\text{Clarke}}{\longrightarrow}
\alpha\beta
\overset{\text{Park}}{\longrightarrow}
dq
}
$$

简单理解：

> Clarke 变换负责把三相问题变成二维问题，Park 变换再把静止二维坐标系变成跟随转子旋转的坐标系，从而把交流量变成更容易控制的直流量。