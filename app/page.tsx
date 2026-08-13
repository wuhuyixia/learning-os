"use client";

import { useMemo, useState } from "react";

type IconName = "chip" | "terminal" | "wave" | "search" | "sun" | "moon" | "arrow" | "copy" | "github" | "calendar" | "clock" | "tag" | "rss" | "menu" | "book" | "settings" | "bolt" | "code";

type Post = {
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
};

const posts: Post[] = [
  { title: "STM32 DMA + UART 使用记录", description: "记录 STM32 DMA 接收串口数据时遇到的问题和解决方法。", date: "2026-08-12", readTime: "6 min", category: "Embedded / STM32", tags: ["STM32", "DMA", "UART"] },
  { title: "FreeRTOS 任务调度的几个关键点", description: "从优先级、时间片到临界区，梳理 RTOS 应用中最容易忽略的调度细节。", date: "2026-08-08", readTime: "8 min", category: "Embedded / RTOS", tags: ["FreeRTOS", "RTOS"] },
  { title: "Linux 下的串口调试工具箱", description: "整理 stty、minicom、screen 和 hexdump，在开发板上快速定位通信问题。", date: "2026-08-02", readTime: "5 min", category: "Linux / Tools", tags: ["Linux", "UART", "Debug"] },
  { title: "从原理图到 PCB：一次电源模块复盘", description: "关于布局、回流路径、去耦和调试测量的一些工程化记录。", date: "2026-07-26", readTime: "10 min", category: "Hardware / PCB", tags: ["PCB", "Power", "Hardware"] },
];

const features = [
  { title: "响应式阅读", description: "桌面端侧栏布局，手机端自动切换为单栏阅读。", icon: "chip" as IconName, tone: "mint" },
  { title: "深色 / 浅色", description: "适合长时间阅读代码和技术文档的主题切换。", icon: "moon" as IconName, tone: "violet" },
  { title: "嵌入式内容", description: "围绕 STM32、ESP32、Linux、FreeRTOS 和 PCB。", icon: "code" as IconName, tone: "blue" },
  { title: "文章搜索", description: "按标题、摘要和技术标签快速筛选实践记录。", icon: "search" as IconName, tone: "cyan" },
  { title: "工程效率", description: "保留代码复制、终端片段和可复现调试步骤。", icon: "bolt" as IconName, tone: "yellow" },
  { title: "持续更新", description: "将项目复盘、实验数据和技术笔记持续整理。", icon: "settings" as IconName, tone: "orange" },
];

const projects = [
  { name: "STM32 环境监测系统", description: "低功耗采集温湿度与光照数据，支持 OLED 本地显示和串口配置。", stack: "STM32F4 · FreeRTOS · SHT30 · OLED", status: "Completed", icon: "chip" as IconName },
  { name: "ESP32 局域网控制台", description: "面向实验室设备的轻量 Web 控制台，提供 GPIO、继电器和传感器状态管理。", stack: "ESP32 · C++ · Wi-Fi · WebSocket", status: "In progress", icon: "terminal" as IconName },
  { name: "FPGA UART Logic Analyzer", description: "用 FPGA 实现串口协议采集与触发模块，用于验证嵌入式通信时序。", stack: "Verilog · FPGA · UART · GTKWave", status: "Research", icon: "wave" as IconName },
];

const allTags = ["STM32", "ESP32", "Embedded Linux", "FreeRTOS", "PCB", "FPGA", "UART", "SPI", "I2C", "CAN"];

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
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
  if (name === "book") return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h6" /></svg>;
  if (name === "settings") return <svg {...common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1M15 19.4a2 2 0 0 1-2 2 2 2 0 0 1-2-2M8.6 17.8l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1M4.6 12a2 2 0 0 1 0-4M8.6 6.2l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1M15.4 6.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1M19.4 9a2 2 0 0 1 0 4" /></svg>;
  if (name === "bolt") return <svg {...common}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></svg>;
  if (name === "code") return <svg {...common}><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

function TagList({ items }: { items: string[] }) {
  return <div className="tag-list">{items.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}

function Meta({ post }: { post: Post }) {
  return <div className="post-meta"><span><Icon name="calendar" size={13} /> {post.date}</span><span><Icon name="clock" size={13} /> {post.readTime}</span></div>;
}

function CodeBlock({ code, label = "terminal" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="code-block"><div className="code-toolbar"><span>{label}</span><button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }}><Icon name="copy" size={13} /> {copied ? "Copied" : "Copy"}</button></div><pre><code>{code}</code></pre></div>;
}

function PostCard({ post }: { post: Post }) {
  return <article className="post-item"><div className="post-item-main"><span className="post-category"><Icon name="tag" size={13} /> {post.category}</span><h3><a href="#article">{post.title}</a></h3><p>{post.description}</p><Meta post={post} /><TagList items={post.tags} /></div><a className="post-arrow" href="#article"><Icon name="arrow" size={18} /></a></article>;
}

export default function Home() {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const filteredPosts = useMemo(() => posts.filter((post) => `${post.title} ${post.description} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className={dark ? "site dark" : "site light"} id="top">
    <header className="mobile-navbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="打开菜单"><Icon name="menu" /></button><a className="mobile-brand" href="#top">embedded<span>.log</span></a><button className="round-button" onClick={() => setDark(!dark)} aria-label="切换主题"><Icon name={dark ? "sun" : "moon"} size={16} /></button>{mobileNav && <nav className="mobile-menu-panel"><a href="#top" onClick={() => setMobileNav(false)}>首页</a><a href="#articles" onClick={() => setMobileNav(false)}>文章</a><a href="#projects" onClick={() => setMobileNav(false)}>项目</a><a href="#about" onClick={() => setMobileNav(false)}>关于</a><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">GitHub</a></nav>}</header>
    <div className="frosti-layout">
      <aside className="frosti-sidebar">
        <div className="profile-card frosti-card"><img src="avatar.jpg" alt="Wuhuyixia 的头像" className="profile-avatar" /><h1>Wuhuyixia</h1><p>Embedded Systems<br />&amp; Electronics</p><div className="profile-status"><i /> building reliable firmware</div><div className="social-row"><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github" size={18} /></a><a href="mailto:2470794599@qq.com" aria-label="Email"><Icon name="rss" size={18} /></a></div></div>
        <nav className="side-nav frosti-card"><a className="active" href="#top"><Icon name="chip" size={16} /> 首页</a><a href="#articles"><Icon name="book" size={16} /> 文章</a><a href="#projects"><Icon name="terminal" size={16} /> 项目</a><a href="#about"><Icon name="settings" size={16} /> 关于</a><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer"><Icon name="github" size={16} /> GitHub</a></nav>
        <div className="tool-card frosti-card"><label className="sidebar-search"><Icon name="search" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章..." aria-label="搜索文章" /></label><div className="tool-actions"><button onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} size={15} /> {dark ? "浅色模式" : "深色模式"}</button><a href="#article"><Icon name="tag" size={15} /> 最新笔记</a></div></div>
        <div className="side-tags frosti-card"><h2>技术方向</h2><TagList items={allTags} /></div>
      </aside>

      <main className="frosti-main">
        <section className="main-card frosti-card" id="home-card"><div className="main-card-heading"><div><span className="card-kicker">HOME / EMBEDDED SYSTEMS</span><h2>Embedded Systems Blog</h2><p>记录嵌入式开发、电子设计与技术实践。</p></div><button className="info-button" aria-label="关于博客"><Icon name="wave" size={18} /></button></div>
          <div className="hero-block"><span className="hero-badge"><i /> SYSTEM ONLINE</span><h3>把硬件做成<br /><em>可靠的系统。</em></h3><p>专注 STM32、ESP32、Embedded Linux、FreeRTOS、PCB 与通信协议。这里记录代码、实验、问题和每一次可复现的解决方案。</p><div className="hero-buttons"><a className="button primary" href="#articles"><Icon name="book" size={16} /> 浏览文章</a><a className="button" href="#projects"><Icon name="terminal" size={16} /> 查看项目</a><a className="button icon-only" href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github" size={17} /></a></div></div>

          <section className="inner-section"><div className="section-title"><h3><Icon name="bolt" size={20} /> 技术特性</h3><span>what I write about</span></div><div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><div className={`feature-icon ${feature.tone}`}><Icon name={feature.icon} size={19} /></div><h4>{feature.title}</h4><p>{feature.description}</p></article>)}</div></section>

          <section className="inner-section quick-start"><div className="section-title"><h3><Icon name="terminal" size={20} /> 快速开始</h3><span>debugging workflow</span></div><div className="quick-card"><h4>三步定位一次串口问题</h4><ol><li><span>1</span><div><strong>确认硬件链路</strong><p>检查供电、GND、TX/RX 和电平是否正确。</p></div></li><li><span>2</span><div><strong>确认串口配置</strong><p>核对波特率、数据位、停止位和 DMA 通道。</p></div></li><li><span>3</span><div><strong>抓取并复现</strong><p>用逻辑分析仪确认时序，再回到代码定位边界。</p></div></li></ol><CodeBlock label="debug.sh" code={'$ stty -F /dev/ttyUSB0 115200 raw -echo\n$ hexdump -C capture.bin\n$ make flash && monitor'} /></div></section>

          <section className="inner-section" id="articles"><div className="section-title"><h3><Icon name="book" size={20} /> 最新文章</h3><a href="#articles">全部文章 <Icon name="arrow" size={14} /></a></div><div className="post-list">{filteredPosts.map((post) => <PostCard key={post.title} post={post} />)}{filteredPosts.length === 0 && <div className="empty-state">没有找到匹配文章，试试 STM32、UART 或 Linux。</div>}</div></section>

          <section className="inner-section" id="projects"><div className="section-title"><h3><Icon name="settings" size={20} /> 项目实验室</h3><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">GitHub 仓库 <Icon name="github" size={14} /></a></div><div className="project-grid">{projects.map((project) => <article className="project-card" key={project.name}><div className="project-head"><span className="project-icon"><Icon name={project.icon} size={20} /></span><span className="project-state"><i /> {project.status}</span></div><h4>{project.name}</h4><p>{project.description}</p><small>{project.stack}</small></article>)}</div></section>

          <section className="inner-section" id="article"><div className="section-title"><h3><Icon name="code" size={20} /> 文章摘录</h3><span>STM32 / DMA / UART</span></div><article className="article-preview"><div className="article-preview-head"><div><span className="card-kicker">FEATURED NOTE</span><h3>STM32 DMA + UART 使用记录</h3></div><Meta post={posts[0]} /></div><div className="callout warning"><strong>WARNING</strong><p>使用 DMA 和 Cache 时需要注意数据一致性。开启 D-Cache 的 Cortex-M7 需要在 DMA 前后进行 Cache 维护。</p></div><p>DMA 负责搬运数据，IDLE 线检测负责告诉我们一帧数据已经结束，两者结合可以减少 CPU 介入。本文记录从中断接收切换到 DMA + IDLE 的过程。</p><CodeBlock label="uart_dma.c" code={'HAL_UARTEx_ReceiveToIdle_DMA(\n    &huart2, rx_buf, RX_BUF_SIZE\n);'} /><div className="note-row"><span>NOTE</span><p>在 STM32 HAL 中，ReceiveToIdle_DMA 是处理不定长串口数据的实用入口。</p></div></article></section>

          <section className="inner-section" id="about"><div className="section-title"><h3><Icon name="chip" size={20} /> 关于这个博客</h3><span>about the author</span></div><div className="about-box"><img src="avatar.jpg" alt="Wuhuyixia 的头像" className="about-avatar" /><div><h4>在硬件与代码之间工作。</h4><p>我是 Wuhuyixia，专注于嵌入式系统和电子设计。这个博客记录从示波器、编译器和数据手册里得到的答案，内容尽量简单、可复现，并留下下一次调试时真正有用的线索。</p><div className="about-links"><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer"><Icon name="github" size={15} /> GitHub</a><a href="mailto:2470794599@qq.com"><Icon name="rss" size={15} /> Contact</a></div></div></div></section>

          <section className="stats-section"><div className="section-title"><h3><Icon name="github" size={20} /> Repository Stats</h3><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">View on GitHub <Icon name="arrow" size={14} /></a></div><div className="stats-grid"><div><strong>04</strong><span>Articles</span></div><div><strong>03</strong><span>Projects</span></div><div><strong>10</strong><span>Tech tags</span></div><div><strong>∞</strong><span>Debug sessions</span></div></div></section>
        </section>
        <footer className="footer-card frosti-card"><div><span className="footer-mark"><Icon name="chip" size={21} /></span><p>Powered by embedded.log<br />© 2026 Wuhuyixia · All rights reserved</p></div><div><span>Social</span><div className="footer-social"><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer"><Icon name="github" size={19} /></a><a href="mailto:2470794599@qq.com"><Icon name="rss" size={19} /></a></div></div></footer>
      </main>
    </div>
  </div>;
}
