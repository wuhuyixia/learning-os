"use client";

import { useMemo, useState } from "react";

type IconName =
  | "chip"
  | "terminal"
  | "wave"
  | "search"
  | "sun"
  | "moon"
  | "arrow"
  | "copy"
  | "github"
  | "calendar"
  | "clock"
  | "tag"
  | "rss"
  | "menu";

type Post = {
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
};

const tags = ["STM32", "ESP32", "Embedded Linux", "FreeRTOS", "PCB", "FPGA", "UART", "SPI", "I2C", "CAN"];

const posts: Post[] = [
  {
    title: "STM32 DMA + UART 使用记录",
    description: "记录 STM32 DMA 接收串口数据时遇到的问题和解决方法。",
    date: "2026-08-12",
    readTime: "6 min",
    category: "Embedded / STM32",
    tags: ["STM32", "DMA", "UART"],
    featured: true,
  },
  {
    title: "FreeRTOS 任务调度的几个关键点",
    description: "从优先级、时间片到临界区，梳理 RTOS 应用中最容易忽略的调度细节。",
    date: "2026-08-08",
    readTime: "8 min",
    category: "Embedded / RTOS",
    tags: ["FreeRTOS", "RTOS"],
  },
  {
    title: "Linux 下的串口调试工具箱",
    description: "整理 stty、minicom、screen 和 hexdump，在开发板上快速定位通信问题。",
    date: "2026-08-02",
    readTime: "5 min",
    category: "Linux / Tools",
    tags: ["Linux", "UART", "Debug"],
  },
  {
    title: "从原理图到 PCB：一次电源模块复盘",
    description: "关于布局、回流路径、去耦和调试测量的一些工程化记录。",
    date: "2026-07-26",
    readTime: "10 min",
    category: "Hardware / PCB",
    tags: ["PCB", "Power", "Hardware"],
  },
];

const projects = [
  { name: "STM32 环境监测系统", description: "低功耗采集温湿度与光照数据，支持 OLED 本地显示和串口配置。", stack: "STM32F4 · FreeRTOS · SHT30 · OLED", status: "Completed", tone: "green", icon: "chip" as IconName },
  { name: "ESP32 局域网控制台", description: "面向实验室设备的轻量 Web 控制台，提供 GPIO、继电器和传感器状态管理。", stack: "ESP32 · C++ · Wi-Fi · WebSocket", status: "In progress", tone: "yellow", icon: "terminal" as IconName },
  { name: "FPGA UART Logic Analyzer", description: "用 FPGA 实现的串口协议采集与触发模块，用于验证嵌入式通信时序。", stack: "Verilog · FPGA · UART · GTKWave", status: "Research", tone: "blue", icon: "wave" as IconName },
];

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "chip") return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></svg>;
  if (name === "terminal") return <svg {...common}><path d="m4 5 6 7-6 7M13 19h7" /></svg>;
  if (name === "wave") return <svg {...common}><path d="M2 12h3l2-6 4 12 3-8 2 5h6" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 5 5" /></svg>;
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
  if (name === "moon") return <svg {...common}><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.6 8.6 0 1 0 20.5 15.2Z" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
  if (name === "copy") return <svg {...common}><rect x="8" y="8" width="11" height="12" rx="1" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3" /></svg>;
  if (name === "github") return <svg {...common}><path d="M15 22v-3.5c.1-1-.3-1.8-1-2.5 3.2-.4 6.5-1.6 6.5-7A5.4 5.4 0 0 0 19 5.2 5 5 0 0 0 18.9 1S17.7.6 15 2.4a13.4 13.4 0 0 0-6 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 5.2 5.4 5.4 0 0 0 3.5 9c0 5.4 3.3 6.6 6.5 7-.7.7-1 1.3-1 2.5V22" /><path d="M8 19c-3 .8-3-1.5-4-2" /></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "tag") return <svg {...common}><path d="M20 13 13 20 4 11V4h7l9 9Z" /><path d="M8 8h.01" /></svg>;
  if (name === "rss") return <svg {...common}><path d="M5 19h.01M5 12a7 7 0 0 1 7 7M5 5a14 14 0 0 1 14 14" /></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

function Logo() {
  return <a href="#top" className="brand"><span className="brand-mark"><Icon name="chip" size={20} /></span><span>embedded<span className="brand-dot">.</span>log</span></a>;
}

function Meta({ post }: { post: Post }) {
  return <div className="post-meta"><span><Icon name="calendar" size={13} /> {post.date}</span><span><Icon name="clock" size={13} /> {post.readTime}</span></div>;
}

function TagList({ items }: { items: string[] }) {
  return <div className="tag-list">{items.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}

function CodeBlock() {
  const [copied, setCopied] = useState(false);
  const code = `HAL_UART_Receive_DMA(&huart2, rx_buf, RX_BUF_SIZE);\n\nvoid HAL_UARTEx_RxEventCallback(\n    UART_HandleTypeDef *huart,\n    uint16_t Size\n) {\n    if (huart->Instance == USART2) {\n        ring_buffer_write(rx_buf, Size);\n        HAL_UARTEx_ReceiveToIdle_DMA(\n            &huart2, rx_buf, RX_BUF_SIZE\n        );\n    }\n}`;
  return <div className="code-block"><div className="code-head"><span><i className="dot red" /><i className="dot yellow" /><i className="dot green" /></span><span>uart_dma.c</span><button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }}><Icon name="copy" size={14} /> {copied ? "Copied" : "Copy"}</button></div><pre><code>{code.split("\n").map((line, index) => <span key={`${line}-${index}`} className="code-line"><b>{String(index + 1).padStart(2, "0")}</b><span>{line || " "}</span></span>)}</code></pre></div>;
}

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return <article className={featured ? "post-card featured" : "post-card"}>
    <div className="post-card-top"><span className="category-label"><Icon name="tag" size={13} /> {post.category}</span>{featured && <span className="pin-label">PINNED</span>}</div>
    <h3><a href="#article">{post.title}</a></h3>
    <p>{post.description}</p>
    <Meta post={post} />
    <div className="post-card-footer"><TagList items={post.tags} /><a className="text-link" href="#article">阅读全文 <Icon name="arrow" size={14} /></a></div>
  </article>;
}

export default function Home() {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const filteredPosts = useMemo(() => posts.filter((post) => `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const featuredPost = posts[0];
  const listPosts = filteredPosts.filter((post) => post !== featuredPost);

  const showFeatured = !query || filteredPosts.includes(featuredPost);

  return <div className={dark ? "site dark" : "site light"} id="top">
    <header className="site-header"><div className="container header-inner"><Logo /><button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="打开导航"><Icon name="menu" /></button><nav className={mobileNav ? "main-nav open" : "main-nav"}><a className="active" href="#top" onClick={() => setMobileNav(false)}>首页</a><a href="#articles" onClick={() => setMobileNav(false)}>文章</a><a href="#projects" onClick={() => setMobileNav(false)}>项目</a><a href="#about" onClick={() => setMobileNav(false)}>关于</a></nav><div className="header-actions"><label className="search-field"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章..." aria-label="搜索文章" /></label><button className="round-button" onClick={() => setDark(!dark)} aria-label="切换主题"><Icon name={dark ? "sun" : "moon"} size={16} /></button><a className="round-button github-button" href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github" size={16} /></a></div></div></header>

    <main>
      <section className="hero-section container"><div className="hero-copy"><span className="eyebrow"><i className="status-dot" /> Embedded Systems &amp; Electronics</span><h1>记录硬件、固件<br /><em>与真实问题。</em></h1><p>专注 STM32、ESP32、Embedded Linux、FreeRTOS、PCB 与通信协议，分享从示波器到代码仓库的工程实践。</p><div className="hero-actions"><a className="button primary" href="#articles">浏览文章 <Icon name="arrow" size={15} /></a><a className="button" href="#projects">查看项目</a></div></div><div className="hero-art"><div className="art-grid" /><div className="art-card profile-art"><div className="art-card-top"><span>LAB / 04</span><span className="signal-live"><i /> LIVE</span></div><div className="art-chip"><Icon name="chip" size={31} /><strong>MCU</strong><small>STM32F4 · 168MHz</small></div><div className="art-traces"><i /><i /><i /><i /></div><div className="art-card-bottom"><span>UART2 / RX</span><span>3V3</span></div></div><div className="art-card terminal-art"><div className="terminal-top"><span><i className="dot red" /><i className="dot yellow" /><i className="dot green" /></span><span>serial-monitor</span></div><code><span>$ make flash</span><span className="accent-text">✓ firmware built</span><span>device online</span><span className="cursor">_</span></code></div><div className="art-wave"><span>signal / 115200</span><svg viewBox="0 0 250 46" preserveAspectRatio="none"><path d="M0 31h24V12h18v19h22V12h18v19h31V31h16V12h17v19h21V12h18v19h35" /></svg></div></div></section>

      <section className="quick-links"><div className="container quick-inner"><span><Icon name="wave" size={16} /> Current focus</span><strong>从 DMA + UART 开始，记录每一个可复现的问题。</strong><a href="#article">阅读最新文章 <Icon name="arrow" size={14} /></a></div></section>

      <section className="container home-grid" id="articles"><div className="content-column"><div className="section-heading"><div><span className="eyebrow-number">01 / ARTICLES</span><h2>最新文章</h2></div><span className="result-count">{filteredPosts.length} posts</span></div>{query && <p className="search-result">正在筛选：<strong>{query}</strong></p>}<div className="post-feed">{showFeatured && <PostCard post={featuredPost} featured />}{listPosts.map((post) => <PostCard key={post.title} post={post} />)}{filteredPosts.length === 0 && <div className="empty-state">没有找到匹配的文章，试试 STM32、UART 或 Linux。</div>}</div></div><aside className="sidebar"><div className="sidebar-card author-card"><img className="avatar-image" src="avatar.jpg" alt="Wuhuyixia 的头像" /><span className="eyebrow-number">ABOUT THE AUTHOR</span><h3>Wuhuyixia</h3><p>电子信息工程 / 嵌入式开发<br />把复杂系统拆成可验证的模块。</p><a className="sidebar-link" href="#about">了解更多 <Icon name="arrow" size={13} /></a></div><div className="sidebar-card"><div className="sidebar-title"><span>分类</span><Icon name="tag" size={14} /></div><a className="category-row" href="#articles"><span>Embedded Systems</span><b>06</b></a><a className="category-row" href="#articles"><span>Hardware / PCB</span><b>04</b></a><a className="category-row" href="#articles"><span>Linux &amp; Tools</span><b>03</b></a></div><div className="sidebar-card"><div className="sidebar-title"><span>技术标签</span><Icon name="wave" size={14} /></div><TagList items={tags} /></div></aside></section>

      <section className="projects-section" id="projects"><div className="container"><div className="section-heading"><div><span className="eyebrow-number">02 / PROJECTS</span><h2>项目实验室</h2></div><a className="text-link" href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">GitHub 仓库 <Icon name="github" size={14} /></a></div><div className="project-grid">{projects.map((project) => <article className="project-card" key={project.name}><div className="project-card-head"><span className="project-icon"><Icon name={project.icon} size={20} /></span><span className={`status-tag ${project.tone}`}><i /> {project.status}</span></div><h3>{project.name}</h3><p>{project.description}</p><div className="project-stack">{project.stack}</div><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer" aria-label={`${project.name} GitHub`}><Icon name="github" size={15} /></a></article>)}</div></div></section>

      <section className="article-section container" id="article"><div className="article-layout"><article className="article-paper"><div className="article-header"><div className="article-breadcrumb">文章 <span>/</span> Embedded / STM32</div><span className="pin-label">LATEST NOTE</span><h2>{featuredPost.title}</h2><p>{featuredPost.description}</p><Meta post={featuredPost} /><TagList items={featuredPost.tags} /></div><div className="article-body"><div className="callout warning"><strong>WARNING</strong><p>使用 DMA 和 Cache 时需要注意数据一致性。开启 D-Cache 的 Cortex-M7 需要在 DMA 前后进行 Cache 维护。</p></div><h3>为什么选择 DMA + IDLE</h3><p>普通的字节中断适合低速、短报文场景，但当串口数据持续到达时，中断频率会显著增加。DMA 负责搬运数据，IDLE 线检测负责告诉我们一帧数据已经结束，两者结合可以减少 CPU 介入。</p><CodeBlock /><div className="callout note"><strong>NOTE</strong><p>在 STM32 HAL 中，<code>HAL_UARTEx_ReceiveToIdle_DMA</code> 是处理不定长串口数据的实用入口。</p></div><h3>调试时优先确认三件事</h3><ol className="debug-list"><li>DMA Stream / Channel 是否与芯片手册和 CubeMX 配置一致。</li><li>回调中的 Size 是否代表本次接收的有效长度。</li><li>重新启动 DMA 前，是否已经处理完当前 buffer 中的数据。</li></ol><div className="callout debug"><strong>DEBUG</strong><p>如果回调只触发一次，先检查是否在回调末尾重新调用接收函数，DMA 不会自动为下一帧数据重新启动。</p></div></div></article><aside className="article-toc"><span>ON THIS PAGE</span><a className="selected" href="#article">概览</a><a href="#article">为什么选择 DMA + IDLE</a><a href="#article">代码实现</a><a href="#article">调试检查清单</a><div className="toc-divider" /><span>RELATED TAGS</span><TagList items={featuredPost.tags} /></aside></div></section>

      <section className="about-section" id="about"><div className="container about-grid"><div className="about-terminal"><div className="terminal-top"><span><i className="dot red" /><i className="dot yellow" /><i className="dot green" /></span><span>about_me.sh</span></div><pre><code><span className="accent-text">$ whoami</span>{"\n"}<span>embedded-engineer</span>{"\n\n"}<span className="accent-text">$ cat focus.txt</span>{"\n"}<span>make hardware useful,</span>{"\n"}<span>make firmware reliable.</span>{"\n\n"}<span className="accent-text">$ uptime</span>{"\n"}<span>learning since 2020</span></code></pre></div><div className="about-copy"><span className="eyebrow-number">03 / ABOUT</span><h2>在硬件与<br /><em>代码之间工作。</em></h2><p>这是 Wuhuyixia 的个人技术博客，记录那些从示波器、编译器和数据手册里得到的答案。内容会保持简单、可复现，并尽量留下下一次调试时真正有用的线索。</p><div className="about-links"><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer"><Icon name="github" size={16} /> GitHub</a><a href="mailto:2470794599@qq.com"><Icon name="rss" size={16} /> Contact</a></div></div></div></section>
    </main>

    <footer className="site-footer"><div className="container footer-inner"><Logo /><span>© 2026 embedded.log · Built with curiosity &amp; datasheets.</span><div className="footer-links"><a href="#articles">文章</a><a href="#projects">项目</a><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">GitHub</a></div></div></footer>
  </div>;
}
