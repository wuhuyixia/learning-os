---
title: GCC编译器
description: 在 Linux C/C++ 开发中，GCC（GNU Compiler Collection）是无可替代的编译器工具。无论是简单的 Hello World 程序，还是复杂的大型项目，GCC 都能完成从源代码到可执行文件的转换。但很多开发者只停留在gcc hello.c -o hello的基础用法，对其编译流程、链接原理和进阶选项了解甚少。本文结合核心知识点，从 GCC 的编译四阶段、核心选项、静态 / 动态链接，到优化与调试配置，全方位拆解 GCC 的使用技巧，帮你从 “会用” 升级到 “精通”。
pubDate: 2025-11-25
updated: 2026-08-14
image: /image/Linux/gcc.png
categories:
  - Embedded Linux
  - Tools
tags:
  - Linux
  - GCC
---

# GCC

## GCC Compile Process

- **预处理（Pre-Processing）**：包括宏定义、文件包含、条件编译三部分。预处理过程读入源代码，检查包含预处理指令的语句和宏定义，并对其进行响应和替换。预处理过程还会删除程序中的注释和多余空白字符。最后会生成.i 文件。

- **编译器（Compiling）**：编译器会将预处理完成的 .i 文件进行一些列的语法分析，并优化后生成对应的汇编代码。会生成 .s 文件。
  
- **汇编器（Assembling）**：汇编器会将编译器生成的 .s 汇编程序汇编为机器语言或指令，也就是可以机器可以执行的二进制程序。会生成 .o 文件。

- **链接器（Linking）**：链接器会来链接程序运行的所需要的目标文件，以及依赖的库文件，最后生成可执行文件，以二进制形式存储在磁盘中。
  
![GCC编译的四个阶段](/learning-os/image/Linux/gcc1.png)

### 实操
```
#include <stdio.h>

#define HELLOWORLD ("Hello, World!")
int main() {
    printf("%s\n", HELLOWORLD);
    return 0;
}
```
---

```
n507@Nuist-507:~/Desktop/code $ ls
hello.c
n507@Nuist-507:~/Desktop/code $ gcc -E hello.c -o hello.i
n507@Nuist-507:~/Desktop/code $ ls
hello.c  hello.i
```
---
```
n507@Nuist-507:~/Desktop/code $ gcc -S hello.c -o hello.s
n507@Nuist-507:~/Desktop/code $ ls
hello.c  hello.i  hello.s
```
---
```
n507@Nuist-507:~/Desktop/code $ gcc -c hello.s -o hello.o
n507@Nuist-507:~/Desktop/code $ ls
hello.c  hello.i  hello.o  hello.s
```
---
```
n507@Nuist-507:~/Desktop/code $  gcc hello.o -o hello.exe
n507@Nuist-507:~/Desktop/code $ ls
hello.c  hello.exe  hello.i  hello.o  hello.s
```
---

```
n507@Nuist-507:~/Desktop/code $  gcc -o hello.exe1 hello.c
n507@Nuist-507:~/Desktop/code $ ls
hello.c  hello.exe1
```
---

### 编译器基本构成

为了将不同编程语言和不同处理器架构解耦：前端负责词法、语法和语义分析，并将 C、C++ 等源代码转换为统一的中间表示；优化器在中间表示上执行常量传播、死代码消除和循环优化等操作；后端则根据 x86、ARM、RISC-V 等具体硬件生成对应的汇编或机器代码。

![编译器基本构成](/learning-os/image/Linux/gcc2.png)

## GCC核心功能选项

| 选项 | 功能描述 | 使用示例 |
| :--- | :--- | :--- |
| `-E` | 只进行预处理，不编译、汇编和链接 | `gcc -E main.c -o main.i` |
| `-S` | 编译到汇编语言，不进行汇编和链接 | `gcc -S main.c -o main.s` |
| `-c` | 编译到目标代码，生成 `.o` 文件 | `gcc -c main.c -o main.o` |
| `-o` | 指定输出文件名 | `gcc main.c -o myapp` |
| `-static` | 使用静态链接生成可执行文件 | `gcc main.c -static -o app_static` |
| `-g` | 生成调试信息，供 GDB 使用 | `gcc -g main.c -o debug_app` |
| `-shared` | 尽量使用动态库，生成较小的文件 | `gcc -shared lib.c -o lib.so` |
| `-O0` | 不进行优化（编译速度最快） | `gcc -O0 main.c -o app` |
| `-O1` | 基本优化（默认级别） | `gcc -O1 main.c -o app` |
| `-O2` | 较多优化，平衡性能与编译时间 | `gcc -O2 main.c -o app` |
| `-O3` | 最高级别优化（可能增加代码大小） | `gcc -O3 main.c -o app` |
| `-W` | 禁止所有警告信息 | `gcc -W main.c -o app` |
| `-Wall` | 开启所有常见警告信息 | `gcc -Wall main.c -o app` |


