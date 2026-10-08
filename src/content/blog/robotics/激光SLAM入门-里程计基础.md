---
title: "激光 SLAM 入门（一）：里程计、差速运动学与 IMU 航迹推算"
description: "从轮速、IMU 与激光里程计的关系出发，推导差速底盘速度模型、二维航迹更新和 IMU 姿态与位置积分。"
pubDate: 2026-10-08
categories: [Robotics]
tags: [SLAM, LiDAR, Odometry, IMU, Differential Drive, Robotics]
---

机器人要完成激光 SLAM（同步定位与建图），首先必须知道：**自己在两次激光扫描之间大致移动了多少？** 里程计（Odometry）就是用于估计这段相对运动的技术。本文先讲清基本运动模型，不展开激光扫描匹配或后端优化。

## 一、SLAM 中的里程计有哪些？

![SLAM 常见里程计及组合](/learning-os/images/slam-odometry/odometry-types.svg)

| 类型 | 主要输入 | 估计依据 | 典型问题 |
| --- | --- | --- | --- |
| **轮速里程计** | 左右编码器 | 车轮转动推算底盘运动 | 打滑、轮径误差 |
| **IMU 惯性里程计** | 陀螺仪、加速度计 | 角速度和加速度积分 | 零偏导致积分漂移 |
| **视觉里程计** | 连续相机图像 | 特征/光度变化 | 弱纹理、光照变化 |
| **激光里程计** | 连续激光扫描 | 点云/扫描匹配 | 几何退化、动态物体 |
| **融合里程计** | 激光+IMU / 激光+轮速 / 激光+视觉 | 互补的运动与环境约束 | 需要同步和标定 |

这里的“传统里程计”通常指轮速或惯性推算；“传感器里程计”主要通过相邻观测估计相对位姿。**里程计不等于完整 SLAM**：单纯累加相对运动往往会漂移；完整 SLAM 还会利用地图约束等方式修正误差。

## 二、差速轮速里程计：两个轮子怎样决定运动？

先考虑常见的两轮差速底盘：左右轮由电机分别驱动，轮间距为 $l$。设右轮线速度为 $v_r$，左轮为 $v_l$；以机器人前进方向为 $x$ 轴，逆时针转动为正。

![差速底盘几何关系与转弯圆心](/learning-os/images/slam-odometry/differential-drive.svg)

### 1. 前进速度

底盘中心的线速度等于左右轮速度的平均值：

$$
\boxed{v=\frac{v_r+v_l}{2}}
$$

两轮一样快时，$v_r=v_l$，机器人直线行驶。

### 2. 角速度

机器人在时间 $\Delta t$ 内转过角度 $\Delta\theta$。假设**纯滚动、无侧滑**，左右轮走过的弧长之差为 $l\Delta\theta$：

$$
(v_r-v_l)\Delta t=l\Delta\theta.
$$

因此绕垂直轴的角速度为

$$
\boxed{\omega=\frac{\Delta\theta}{\Delta t}=\frac{v_r-v_l}{l}}\qquad(\mathrm{rad/s}).
$$

- $v_r>v_l$：向左转（逆时针）。
- $v_r<v_l$：向右转（顺时针）。
- $v_r=-v_l$：中心线速度为零，原地旋转。

### 3. 转弯半径

若 $\omega\neq 0$，底盘中心的**带符号转弯半径**为

$$
\boxed{r=\frac{v}{\omega}=\frac{l(v_r+v_l)}{2(v_r-v_l)}}.
$$

$r$ 的正负反映转弯方向；真实的几何半径大小为 $|r|$。当 $v_r=v_l$ 时，$\omega=0$，此时是直线运动，半径可视为趋向无穷大，不应直接进行除零运算。

> 如果读到的是编码器角速度 $\dot\varphi_r,\dot\varphi_l$，需先用车轮半径 $R$ 换算：$v_r=R\dot\varphi_r$、$v_l=R\dot\varphi_l$（左右轮半径相同时）。

## 三、航迹推算：由速度一步步得到坐标

已知上一时刻机器人的二维位姿为 $\mathbf q_t=(x_t,y_t,\theta_t)$。其中 $\theta$ 表示车头方向与世界坐标系 $x$ 轴的夹角。采样周期为 $\Delta t$。

![机器人航迹推算与世界、机体坐标系](/learning-os/images/slam-odometry/dead-reckoning.svg)

最简单的做法是：**先更新方向，再沿新方向移动**。这是一种离散积分方法（后向欧拉形式）：

$$
\begin{aligned}
\theta_{t+1}&=\theta_t+\omega_t\Delta t,\\
x_{t+1}&=x_t+v_t\Delta t\cos\theta_{t+1},\\
y_{t+1}&=y_t+v_t\Delta t\sin\theta_{t+1}.
\end{aligned}
$$

注意这里使用更新后的 $\theta_{t+1}$ 计算位移，与截图中的航迹推算公式一致；**它是近似算法，而不是匀速圆弧运动的精确积分**。当转角较大时，可以采用更准确的更新形式。

假设一个采样周期内 $v$、$\omega$ 保持常值：

$$
\begin{aligned}
\theta_{t+1}&=\theta_t+\omega\Delta t,\\
x_{t+1}&=x_t+\frac{v}{\omega}\big[\sin(\theta_t+\omega\Delta t)-\sin\theta_t\big],\\
y_{t+1}&=y_t-\frac{v}{\omega}\big[\cos(\theta_t+\omega\Delta t)-\cos\theta_t\big].
\end{aligned}
$$

当 $\omega\to 0$ 时，使用直线运动极限：$x_{t+1}=x_t+v\Delta t\cos\theta_t$，$y_{t+1}=y_t+v\Delta t\sin\theta_t$。

**计算例子**：左右轮速度分别为 $v_r=0.6\,\mathrm{m/s}$、$v_l=0.4\,\mathrm{m/s}$，轮距 $l=0.5\,\mathrm m$，则

$$
v=0.5\,\mathrm{m/s},\qquad \omega=0.4\,\mathrm{rad/s},\qquad r=1.25\,\mathrm m.
$$

取 $\Delta t=0.1\,\mathrm s$，机器人约转过 $0.04\,\mathrm{rad}$（$2.29^\circ$）。只要重复更新 $x,y,\theta$，就得到轮速里程计的累计轨迹。

## 四、IMU 里程计：测角速度和加速度，再积分

IMU（Inertial Measurement Unit，惯性测量单元）通常包含**三轴陀螺仪**与**三轴加速度计**；某些 9 轴模块还集成三轴磁力计。陀螺仪测角速度，加速度计测的是**比力**，不能简单把读数当作世界系加速度直接积分。

![IMU 从测量到姿态、速度、位置的传播流程](/learning-os/images/slam-odometry/imu-integration.svg)

### 1. 陀螺仪：从角速度推算姿态

陀螺仪读数通常包含零偏（bias）和随机噪声：

$$
\tilde{\boldsymbol\omega}_k=\boldsymbol\omega_k+\mathbf b_{g,k}+\mathbf n_{g,k}.
$$

扣除估计零偏后，得到 $\hat{\boldsymbol\omega}_k=\tilde{\boldsymbol\omega}_k-\hat{\mathbf b}_{g,k}$。对于**平面运动**，只关注偏航角即可：

$$
\boxed{\theta_{k+1}=\theta_k+\hat\omega_{z,k}\Delta t}.
$$

对于三维姿态，需要使用旋转矩阵或四元数；若 $\mathbf R_k$ 表示机体系到世界系的旋转，则一种常见的离散更新是

$$
\mathbf R_{k+1}=\mathbf R_k\operatorname{Exp}\big([\hat{\boldsymbol\omega}_k]_{\times}\Delta t\big),
$$

其中 $[\cdot]_{\times}$ 是叉乘矩阵，$\operatorname{Exp}$ 将旋转向量映射到旋转矩阵。若采用四元数，也需使用一致的旋转约定。

### 2. 加速度计：去零偏、转坐标系、补偿重力

设 IMU 原始比力读数为 $\tilde{\mathbf f}_k$，加速度计零偏为 $\mathbf b_{a,k}$，世界坐标系重力向量为 $\mathbf g^w$（例如以 $z$ 轴向上时 $\mathbf g^w=[0,0,-9.81]^T\,\mathrm{m/s^2}$）。那么机器人在世界系中的运动加速度为

$$
\boxed{\mathbf a_k^w=\mathbf R_k(\tilde{\mathbf f}_k-\hat{\mathbf b}_{a,k})+\mathbf g^w}.
$$

**为何是加上 $\mathbf g^w$？** 加速度计测量的是 $\mathbf R_k^T(\mathbf a_k^w-\mathbf g^w)$（忽略噪声），所以恢复真正的运动加速度时需要加回世界系的重力向量。也有教材写成“减去 $\mathbf g$”，这是因为其 $\mathbf g$ 被定义成与此处相反的向量；关键是**符号约定必须统一**。

为了稍微减小离散积分误差，可以对相邻两时刻的世界系加速度取平均：

$$
\bar{\mathbf a}_k^w=\frac{\mathbf a_k^w+\mathbf a_{k+1}^w}{2}.
$$

### 3. 从加速度积分到位置

在每个采样周期内使用平均加速度，可以更新速度与位置：

$$
\boxed{\begin{aligned}
\mathbf v_{k+1}&=\mathbf v_k+\bar{\mathbf a}_k^w\Delta t,\\
\mathbf p_{k+1}&=\mathbf p_k+\mathbf v_k\Delta t+\frac12\bar{\mathbf a}_k^w\Delta t^2.
\end{aligned}}
$$

初始位置、速度和姿态必须有合理的初始化。此处假设采样周期内加速度近似恒定；实际系统还要考虑时间戳、坐标轴安装方向与噪声。

### 4. 为什么 IMU 容易漂移？

即使机器人完全不动，IMU 的零偏也可能让它“算出正在移动”。忽略其他误差，如果有一个固定的加速度偏差 $\delta a$，那么积分 $t$ 秒产生的位置误差近似为

$$
\delta p(t)\approx\frac12\delta a\,t^2.
$$

角速度零偏先使姿态估计偏移，继而导致重力补偿不准，位置偏差还可能增长得更快。因此 IMU 擅长**短时间、高频率的运动传播**，但通常不能靠单独积分长期定位。

## 五、轮速里程计与 IMU，分别能做什么？

| 对比 | 轮速里程计 | IMU 里程计 |
| --- | --- | --- |
| 直接测量 | 车轮转动 | 角速度、比力 |
| 推算方法 | 差速模型 + 位姿积分 | 姿态、速度、位置积分 |
| 擅长 | 平整地面上的短时平面运动 | 高频姿态变化和短时运动传播 |
| 主要误差 | 打滑、空转、轮距/轮径不准 | 零偏、噪声、重力补偿误差 |
| 工程定位 | 提供平面运动初值 | 提供高频运动预测 |

**和激光 SLAM 有什么关系？** 轮速计与 IMU 可以预测下一帧激光到来时机器人可能的位置与朝向；激光里程计再利用环境几何信息估计相对运动并修正预测。图中的“激光+轮速”“激光+IMU”“激光+视觉”便是这个互补思路。具体如何融合以及如何完成激光扫描匹配，留到后续章节。

> **本篇记住四个核心公式**：$v=(v_r+v_l)/2$；$\omega=(v_r-v_l)/l$；$\theta_{t+1}=\theta_t+\omega\Delta t$；$\mathbf v_{k+1}=\mathbf v_k+\bar{\mathbf a}_k^w\Delta t$。前两条连接车轮与运动，后两条连接测量与状态传播。