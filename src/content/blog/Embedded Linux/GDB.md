---
title: Linux 下的 GDB 调试工具箱
description: GDB是Linux下非常好用且强大的调试工具
pubDate: 2025-11-25
updated: 2026-08-14
image: /image/Linux/linux-gdb-toolbox.png
categories:
  - Tools
tags:
  - Tools
---

# [GDB](https://sourceware.org/gdb/)

## 什么是GDB

GDB 是由 GUN 软件系统社区提供的调试工具，同 GCC 配套组成了一套完整的开发环境，GDB 是 Linux 和许多 类Unix系统的标准开发环境。

一般来说，GDB 主要能够提供以下四个方面的帮助：

- 程序启动时，可以按照自定义的要求运行程序，例如设置参数和环境变量；
- 可以让被调试的程序在所指定的代码处暂停运行，并查看当前运行状态 （例如当前变量的值，函数的执行结果），即支持断点调试
- 当程序被停住时，可以检查当前程序的中的变量的状态；
- 在程序执行过程中，可以改变某个变量的值，还可以改变代码的执行顺序，从而尝试修改程序中出现的逻辑错误


##  指令集汇总 

| 命令（简写） | 完整命令示例 | 说明 |
| :--- | :--- | :--- |
| **启动与退出** | | |
| `gdb` | `gdb ./program` | 启动 GDB 并加载程序 |
| `q` | `quit` | 退出 GDB |
| `file` | `file ./program` | 已启动 GDB 后，加载或切换调试程序 |
| **运行控制** | | |
| `r` | `run` | 从头开始运行程序 |
| `c` | `continue` | 继续执行，直到下一个断点或结束 |
| `n` | `next` | 单步执行（**不进入**函数内部） |
| `s` | `step` | 单步执行（**会进入**函数内部） |
| `finish` | `finish` | 执行完当前函数并返回（跳出函数） |
| `until` | `until 行号` | 运行到指定行（用于跳出循环） |
| `kill` | `kill` | 终止当前调试的程序 |
| **断点管理** | | |
| `b` | `break main` | 在函数 `main` 入口设置断点 |
| `b` | `break 12` | 在当前文件第 12 行设置断点 |
| `b` | `break file.c:15` | 在指定文件第 15 行设断点 |
| `b` | `break *0x4005a0` | 在内存地址 `0x4005a0` 设断点 |
| `watch` | `watch var` | 设置**数据断点**，变量被修改时暂停 |
| `info b` | `info breakpoints` | 查看所有已设断点/观察点列表 |
| `d` | `delete 2` | 删除编号为 2 的断点（无编号则全删） |
| `disable` | `disable 2` | 禁用编号 2 的断点（不删除） |
| `enable` | `enable 2` | 重新启用编号 2 的断点 |
| **查看代码** | | |
| `l` | `list` | 显示当前源码上下文（默认 10 行） |
| `l` | `list 20` | 显示第 20 行附近的代码 |
| `l` | `list main` | 显示 `main` 函数附近的代码 |
| **查看数据** | | |
| `p` | `print var` | 打印变量 `var` 的当前值 |
| `p` | `print *ptr@10` | 打印从指针 `ptr` 开始的 10 个元素 |
| `display` | `display var` | 每次暂停时自动打印变量 `var` |
| `undisplay` | `undisplay 1` | 取消编号 1 的自动显示 |
| `x` | `x/10xw 0x地址` | 以十六进制查看内存（格式：数量+格式+大小） |
| `info locals` | `info locals` | 显示当前函数所有局部变量 |
| `info args` | `info args` | 显示当前函数的传参 |
| **堆栈操作** | | |
| `bt` | `backtrace` | 查看当前调用堆栈（函数调用链） |
| `f` | `frame 2` | 切换到堆栈编号为 2 的帧 |
| `up` | `up` | 向上移动一帧（调用者方向） |
| `down` | `down` | 向下移动一帧（被调用者方向） |
| **线程与进程** | | |
| `info threads` | `info threads` | 显示所有线程列表 |
| `thread` | `thread 3` | 切换到编号 3 的线程 |
| `attach` | `attach PID` | 附加到正在运行的进程（PID） |
| `detach` | `detach` | 脱离当前附加的进程 |
| **辅助信息** | | |
| `help` | `help breakpoints` | 查看某类命令的详细帮助 |
| `set` | `set var=100` | 运行时修改变量 `var` 的值为 100 |
| `show` | `show args` | 显示程序启动参数等配置 |
| `man gdb` | `man gdb` | 在终端中查看 GDB 官方手册页（完整参考文档） |
| **日志** | | |
| `set logging on` | `set logging on` | 开启日志记录，所有输出保存到文件 |
| `set logging off` | `set logging off` | 关闭日志记录，停止保存 |
| `set logging file` | `set logging file debug.log` | 指定日志文件名（默认 `gdb.txt`） |

---
### 编译

```
	在编译阶段，一定要加上可选项-g（表示开启调试），否则无法使用GDB调试代码,这个地方一定要-g在前。
	gcc test.c -g -o test
	-o选项有如下含义：当有优化时，断点调试中下一步可能会跳行
		-O0：无优化（默认）
		-O1：1级优化。使用该选项能减少目标文件大小及执行时间并且不会让编译时间明显增加。在编译较大型的程序时常用。
		-O2：2级优化。包含1级优化功能并进一步优化生成的目标代码（例如使用更优化的指令调度等），不过会让编译时间增加。
		//2级优化是在编译时间与优化长度上取得了一个平衡点。
		-O3：3级优化。包含2级优化功能并进一步优化生成的目标代码（例如使用特殊的处理器等），不过会让编译时间大幅度增加
```

###  启动 GDB
```
gdb ./test
```

### 显示源代码
| 命令格式 | 示例 | 说明 |
| :--- | :--- | :--- |
| `l` | `l` | 显示当前位置前后的代码（默认 10 行） |
| `l 行号` | `l 20` | 显示第 20 行附近的代码 |
| `l 函数名` | `l main` | 显示 `main` 函数附近的代码 |
| `l 文件名:行号` | `l test.c:15` | 显示指定文件第 15 行附近的代码 |
| `l 文件名:函数名` | `l utils.c:init` | 显示指定文件中的函数附近的代码 |
| `l 起始行,结束行` | `l 10,20` | 显示第 10 行到第 20 行的代码 |
| `l 起始行,+偏移量` | `l 30,+15` | 从第 30 行开始显示 15 行代码 |
| `l 起始行,-偏移量` | `l 50,-20` | 从第 50 行向前显示 20 行代码 |
| `l *地址` | `l *0x4005a0` | 显示对应内存地址处的代码 |
| `l -` | `l -` | 显示当前代码之前的代码（上一屏） |
| `l +` | `l +` | 显示当前代码之后的代码（下一屏） |
| `l ,` | `l ,` | 从上次结束位置继续显示 |
| `l /正则表达式/` | `l /printf/` | 搜索并显示包含 `printf` 的行附近代码 |



# 效果展示

```
n507@Nuist-507:~ $ gcc -g -o test test.c
n507@Nuist-507:~ $ ls -lh test
-rwxrwxr-x 1 n507 n507 71K Aug 17 14:08 test
n507@Nuist-507:~ $ gdb ./test

GNU gdb (Debian 16.3-1) 16.3
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Type "show copying" and "show warranty" for details.
This GDB was configured as "aarch64-linux-gnu".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<https://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
    <http://www.gnu.org/software/gdb/documentation/>.

For help, type "help".
Type "apropos word" to search for commands related to "word"...
Reading symbols from ./test...

(gdb) r
Starting program: /home/n507/test 
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/aarch64-linux-gnu/libthread_db.so.1".
sum = 30
i = 0
i = 1
i = 2
[Inferior 1 (process 4141) exited normally]

(gdb) l
1       #include <stdio.h>
2
3       int main() {
4           int a = 10;
5           int b = 20;
6           int sum = a + b;
7           
8           printf("sum = %d\n", sum);
9           
10          for (int i = 0; i < 3; i++) {

(gdb) b main
Breakpoint 1 at 0x55555507b0: file test.c, line 4.
(gdb) r
Starting program: /home/n507/test 
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/aarch64-linux-gnu/libthread_db.so.1".

Breakpoint 1, main () at test.c:4
4           int a = 10;

(gdb) l
1       #include <stdio.h>
2
3       int main() {
4           int a = 10;
5           int b = 20;
6           int sum = a + b;
7           
8           printf("sum = %d\n", sum);
9           
10          for (int i = 0; i < 3; i++) {

(gdb) n
5           int b = 20;

(gdb) p a
$1 = 10

(gdb) p b
$2 = 127

(gdb) p sum 
$3 = -4392

(gdb) c
Continuing.

(gdb) quit
n507@Nuist-507:~ $ 
```
---
```
Breakpoint 1, main () at test.c:11
11              printf("i = %d\n", i);
(gdb) p &i
$1 = (int *) 0x7fffffed5c
(gdb) watch 0x7fffffed5c
Cannot watch constant value `0x7fffffed5c'.
(gdb) watch *0x7fffffed5c
Hardware watchpoint 2: *0x7fffffed5c
(gdb) info watchpoint
Num     Type           Disp Enb Address            What
2       hw watchpoint  keep y                      *0x7fffffed5c
(gdb) n
i = 0
10          for (int i = 0; i < 3; i++) {
(gdb) n

Hardware watchpoint 2: *0x7fffffed5c

Old value = 0
New value = 1
0x0000005555550804 in main () at test.c:10
10          for (int i = 0; i < 3; i++) {
```
---

## core 文件
core 文件（核心转储文件）是当程序异常崩溃时，操作系统将程序崩溃瞬间的内存映像保存下来的一个文件，用于事后调试分析。

```
n507@Nuist-507:~ $ ulimit -a
real-time non-blocking time  (microseconds, -R) unlimited
core file size              (blocks, -c) 0
data seg size               (kbytes, -d) unlimited
scheduling priority                 (-e) 0
file size                   (blocks, -f) unlimited
pending signals                     (-i) 29156
max locked memory           (kbytes, -l) 8192
max memory size             (kbytes, -m) unlimited
open files                          (-n) 524288
pipe size                (512 bytes, -p) 8
POSIX message queues         (bytes, -q) 819200
real-time priority                  (-r) 0
stack size                  (kbytes, -s) 8192
cpu time                   (seconds, -t) unlimited
max user processes                  (-u) 29156
virtual memory              (kbytes, -v) unlimited
file locks                          (-x) unlimited
```
---
```
# 不限制大小（推荐）
ulimit -c unlimited

# 或指定大小（单位：块，通常 512 字节）
ulimit -c 100000
```
---
```
# 基本格式
gdb ./可执行程序 core文件

# 示例
gdb ./test core.12345

# 进入 GDB 后查看崩溃位置
(gdb) bt          # 查看堆栈（最重要！）
(gdb) info registers  # 查看寄存器
(gdb) p 变量名    # 查看变量值
(gdb) list        # 查看崩溃位置源码
```



---

## 常用进程查看命令

| 命令 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| `ps -ef` | 显示所有进程（标准格式） | 通用，信息全面 |
| `ps -aux` | 显示所有进程（BSD 格式） | 查看 CPU/内存占用 |
| `ps -ef \| grep 名称` | 按进程名过滤 | 查找特定进程 |
| `pgrep -l 名称` | 按名称匹配并显示 PID 和名称 | 快速查找 |
| `pidof 名称` | 显示指定进程的 PID | 获取精确 PID |
| `top` 或 `htop` | 动态显示进程列表 | 实时监控 |
| `ps -T -p PID` | 显示特定进程的线程 | 多线程调试 |

