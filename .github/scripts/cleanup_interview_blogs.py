from pathlib import Path
import re

root = Path("src/content/blog")
promo_terms = (
    "嵌入式校招菌",
    "嵌入式校招excel",
    "欢迎关注获取更多嵌入式校招信息",
    "一次付费永久有效",
    "嵌入式微信/飞书交流群",
    "对话框回复：**加群**",
    "对话框回复：加群",
)

files = list(root.rglob("*.md")) + list(root.rglob("*.mdx"))
changed = []

for path in files:
    original = path.read_text(encoding="utf-8")
    lines = original.splitlines()
    lines = [line for line in lines if not any(term in line for term in promo_terms)]
    text = "\n".join(lines) + ("\n" if original.endswith("\n") else "")
    text = re.sub(r"(?m)^>\s*$\n?", "", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    if path.as_posix().endswith("C-C++/C语言基础问答-嵌入式.md"):
        duplicate_table = """| 存储类别 | 关键字 | 生命周期 | 作用域 | 存储位置 |
|----------|--------|----------|--------|----------|
| 自动 | `auto`(默认) | 函数内 | 局部 | 栈 |
| 静态 | `static` | 程序全程 | 局部/本文件 | .data/.bss |
| 外部 | `extern` | 程序全程 | 全局 | .data/.bss |
| 寄存器 | `register` | 函数内 | 局部 | 寄存器(建议) |


"""
        text = text.replace(duplicate_table, "", 1)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(path.as_posix())

c_path = root / "C-C++" / "C语言基础问答-嵌入式.md"
c_text = c_path.read_text(encoding="utf-8")
header = "| 存储类别 | 关键字 | 生命周期 | 作用域 | 存储位置 |"
if c_text.count(header) != 1:
    raise SystemExit(f"Q12 duplicate check failed: {c_text.count(header)} tables remain")

leftovers = []
for path in files:
    text = path.read_text(encoding="utf-8")
    if any(term in text for term in promo_terms):
        leftovers.append(path.as_posix())
if leftovers:
    raise SystemExit("Promotional text remains in: " + ", ".join(leftovers))

print(f"Updated {len(changed)} blog files")
for path in changed:
    print(path)
