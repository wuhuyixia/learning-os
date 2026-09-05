---
title: Linux 基础入门
description: 从终端提示符、用户权限、文件权限到常用文件操作，快速掌握 Linux 基础命令与使用方法
pubDate: 2025-10-18
draft: false
categories:
  - Embedded Linux
tags:
  - Linux
  - Shell
  - 权限管理
  - 文件系统
---

# Linux 基础入门

## 一、终端会话提示符

打开终端后，首先看到的就是**命令提示符**（Prompt），它包含了当前会话的重要信息。

![终端会话提示符](/learning-os/image/Linux/终端会话提示符.svg)

### 提示符各部分含义

```text
pi@raspberrypi:~ $
```

| 部分 | 值 | 含义 |
|------|-----|------|
| `pi` | 当前用户名 | 登录系统的用户账号 |
| `@` | 分隔符 | 连接用户名和主机名 |
| `raspberrypi` | 计算机名称（主机名） | 当前设备的网络名称 |
| `:` | 分隔符 | 连接主机名和工作目录 |
| `~` | 当前工作目录 | `~` 代表主目录 `/home/pi` |
| `$` | 命令输入起始位置 | 表示当前是**普通用户**身份 |

### 工作目录符号对照

| 符号 | 含义 | 示例路径 |
|------|------|---------|
| `~` | 当前用户的主目录 | `/home/pi` |
| `.` | 当前目录 | `/home/pi/projects` |
| `..` | 上一级目录 | `/home/pi` |
| `/` | 根目录 | `/` |

### 示例

```bash
# 提示符示例
pi@raspberrypi:~ $ pwd
/home/pi

pi@raspberrypi:~ $ cd /etc
pi@raspberrypi:/etc $     # 目录变化后提示符也会更新
```

---

## 二、用户与权限管理

Linux 是一个**多用户操作系统**，不同用户拥有不同的权限。

![超级用户切换](/learning-os/image/Linux/超级用户.svg)

### 用户类型

| 用户类型 | 提示符标识 | 权限级别 | 说明 |
|---------|-----------|---------|------|
| **普通用户** | `$` | 受限 | 日常操作，只能修改自己的文件 |
| **超级用户（root）** | `#` | 完全控制 | 系统管理，可执行任何操作 |

### 切换用户

```bash
# 从普通用户切换到超级用户
sudo su

# 从超级用户切换回普通用户
su pi
```

### 操作演示

```bash
# 当前是普通用户
pi@raspberrypi:~ $ whoami
pi

# 切换为超级用户
pi@raspberrypi:~ $ sudo su
root@raspberrypi:/home/pi# whoami
root

# 切换回普通用户
root@raspberrypi:/home/pi# su pi
pi@raspberrypi:~ $ whoami
pi
```

### sudo 与 su 的区别

| 命令 | 全称 | 用法 | 特点 |
|------|------|------|------|
| `sudo` | Super User Do | `sudo 命令` | 仅临时提升权限执行单条命令，更安全 |
| `su` | Substitute User | `su 用户名` | 切换到另一个用户的完整会话 |

### 权限管理常用命令

```bash
# 修改文件权限
chmod 755 file        # rwxr-xr-x
chmod 644 file        # rw-r--r--

# 修改文件所有者
chown pi:pi file

# 以管理员权限执行命令
sudo apt update
sudo reboot
```

---

## 三、文件权限详解

Linux 中每个文件/目录都有三组权限，分别对应**所有者**、**所属组**、**其他用户**。

```text
-rwxr-xr-- 1 pi pi 4096 Jan 1 00:00 file.txt
│└┬┘└┬┘└┬┘       └┬─┘ └┬─┘
│ │   │   │        │    └─ 所有者  组  其他用户
│ │   │   │        └─ 文件大小
│ │   │   └─ 所属组
│ │   └─ 其他用户权限
│ └─ 所有者权限
└─ 文件类型（- 普通文件，d 目录）
```

### 权限数字对照

| 数字 | 权限 | 含义 |
|------|------|------|
| `7` | rwx | 读 + 写 + 执行 |
| `6` | rw- | 读 + 写 |
| `5` | r-x | 读 + 执行 |
| `4` | r-- | 只读 |
| `0` | --- | 无权限 |

### 常用权限设置

```bash
chmod 755 script.sh    # 所有者完全控制，其他人可读可执行
chmod 644 config.txt   # 所有者可读写，其他人只读
chmod 700 private/     # 仅所有者可访问
chmod +x run.sh        # 添加执行权限
```

---

## 四、文件创建与查看

### 创建

| 命令 | 说明 | 示例 |
|------|------|------|
| `touch file` | 创建空文件（或更新已有文件的时间戳） | `touch hello.txt` |
| `mkdir dir` | 创建目录 | `mkdir projects` |
| `mkdir -p a/b/c` | 递归创建多级目录 | `mkdir -p src/utils` |

### 删除

| 命令 | 说明 | 示例 |
|------|------|------|
| `rm file` | 删除文件 | `rm note.txt` |
| `rm -r dir` | 递归删除目录及其内容 | `rm -r myproject` |
| `rm -ri dir` | 删除前逐一确认（更安全） | `rm -ri myproject` |
| `rm -rf dir` | 强制删除，无需确认（慎用） | `rm -rf /tmp/cache` |

### 重命名或移动

| 命令 | 说明 | 示例 |
|------|------|------|
| `mv file1 file2` | 重命名：file2 不存在时，将 file1 改名为 file2 | `mv old.txt new.txt` |
| `mv file1 file2` | 覆盖：file2 已存在时，file1 覆盖原 file2 并更名为 file2 | `mv a.txt b.txt` |
| `mv file dir` | 将文件移动到 dir 目录中 | `mv note.txt /tmp/` |

### 查看文件内容

| 命令 | 说明 | 示例 |
|------|------|------|
| `cat file` | 一次性显示全部内容 | `cat /etc/hostname` |
| `more file` | 分页查看，空格翻页，q 退出 | `more large_log.txt` |
| `head file` | 查看前 10 行（默认） | `head -n 20 file.txt` |
| `tail file` | 查看后 10 行（默认） | `tail -n 20 file.txt` |
| `tail -f file` | 实时追踪文件末尾新增内容 | `tail -f /var/log/syslog` |

### 示例

```bash
# 创建文件和目录
touch note.txt
mkdir myproject

# 写入内容（重定向）
echo "Hello Linux" > note.txt

# 查看内容
cat note.txt           # 输出: Hello Linux
head note.txt          # 输出前 10 行
tail note.txt          # 输出后 10 行

# 分页查看大文件
more /var/log/syslog
```

---

## 五、实践练习

### 练习 1：查看提示符信息

```bash
# 查看当前用户名
whoami

# 查看主机名
hostname

# 查看当前目录
pwd
```

### 练习 2：用户切换

```bash
# 切换到 root
sudo su

# 验证身份
whoami    # 输出: root

# 切换回 pi
su pi

# 验证身份
whoami    # 输出: pi
```

### 练习 3：文件权限操作

```bash
# 创建测试文件
touch test.txt

# 查看权限
ls -l test.txt

# 修改权限
chmod 700 test.txt
ls -l test.txt    # -rwx------

# 恢复默认权限
chmod 644 test.txt
ls -l test.txt    # -rw-r--r--
```
