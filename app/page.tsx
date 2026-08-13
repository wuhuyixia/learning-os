"use client";

import { useMemo, useState } from "react";

type IconName = "search" | "sun" | "moon" | "github" | "rss" | "menu" | "calendar" | "clock" | "tag" | "chip" | "wave" | "terminal" | "arrow";
type CoverName = "uart" | "rtos" | "linux" | "pcb";

type Post = {
  title: string;
  description: string;
  date: string;
  dateLabel: string;
  readTime: string;
  category: string;
  tags: string[];
  cover: CoverName;
};

const posts: Post[] = [
  { title: "STM32 DMA + UART 使用记录", description: "记录 STM32 DMA 接收串口数据时遇到的问题和解决方法。", date: "2026-08-12", dateLabel: "Wed Aug 12 2026", readTime: "6 min", category: "Embedded / STM32", tags: ["STM32", "DMA", "UART"], cover: "uart" },
  { title: "FreeRTOS 任务调度的几个关键点", description: "从优先级、时间片到临界区，梳理 RTOS 应用中最容易忽略的调度细节。", date: "2026-08-08", dateLabel: "Sat Aug 08 2026", readTime: "8 min", category: "Embedded / RTOS", tags: ["FreeRTOS", "RTOS"], cover: "rtos" },
  { title: "Linux 下的串口调试工具箱", description: "整理 stty、minicom、screen 和 hexdump，在开发板上快速定位通信问题。", date: "2026-08-02", dateLabel: "Sun Aug 02 2026", readTime: "5 min", category: "Linux / Tools", tags: ["Linux", "UART", "Debug"], cover: "linux" },
  { title: "从原理图到 PCB：一次电源模块复盘", description: "关于布局、回流路径、去耦和调试测量的一些工程化记录。", date: "2026-07-26", dateLabel: "Sun Jul 26 2026", readTime: "10 min", category: "Hardware / PCB", tags: ["PCB", "Power", "Hardware"], cover: "pcb" },
];

const allTags = ["STM32", "ESP32", "Embedded Linux", "FreeRTOS", "PCB", "FPGA", "UART", "SPI", "I2C", "CAN"];

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 5 5" /></svg>;
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
  if (name === "moon") return <svg {...common}><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.6 8.6 0 1 0 20.5 15.2Z" /></svg>;
  if (name === "github") return <svg {...common}><path d="M15 22v-3.5c.1-1-.3-1.8-1-2.5 3.2-.4 6.5-1.6 6.5-7A5.4 5.4 0 0 0 19 5.2 5 5 0 0 0 18.9 1S17.7.6 15 2.4a13.4 13.4 0 0 0-6 0C6.3.6 5.1 1 5.1 1A5 5 0 0 0 5 5.2 5.4 5.4 0 0 0 3.5 9c0 5.4 3.3 6.6 6.5 7-.7-.7-1-1.5-1-2.5V22" /><path d="M8 19c-3 .8-3-1.5-4-2" /></svg>;
  if (name === "rss") return <svg {...common}><path d="M5 19h.01M5 12a7 7 0 0 1 7 7M5 5a14 14 0 0 1 14 14" /></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "tag") return <svg {...common}><path d="M20 13 13 20 4 11V4h7l9 9Z" /><path d="M8 8h.01" /></svg>;
  if (name === "chip") return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="1" /><path d="M9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></svg>;
  if (name === "wave") return <svg {...common}><path d="M2 12h3l2-6 4 12 3-8 2 5h6" /></svg>;
  if (name === "terminal") return <svg {...common}><path d="m4 5 6 7-6 7M13 19h7" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

function TagList({ items }: { items: string[] }) {
  return <div className="tag-list">{items.map((tag) => <span key={tag}>{tag}</span>)}</div>;
}

function PostCard({ post }: { post: Post }) {
  return <article className="post-card"><div className="post-copy"><span className="post-category">{post.category}</span><h2><a href="#article-detail">{post.title}</a></h2><p>{post.description}</p><div className="post-date"><Icon name="calendar" size={12} /> {post.dateLabel}</div><div className="post-tags"><span>Tag:</span><TagList items={post.tags} /></div></div><a className={`post-cover ${post.cover}`} href="#article-detail" aria-label={`阅读：${post.title}`}><span className="cover-label">{post.category}</span><span className="cover-icon"><Icon name={post.cover === "uart" ? "wave" : post.cover === "linux" ? "terminal" : post.cover === "pcb" ? "chip" : "wave"} size={34} /></span><span className="cover-line" /></a></article>;
}

export default function Home() {
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const filteredPosts = useMemo(() => posts.filter((post) => `${post.title} ${post.description} ${post.category} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className={dark ? "screenshot-site dark" : "screenshot-site light"} id="top">
    <header className="mobile-header"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="打开导航"><Icon name="menu" /></button><a href="#top" className="mobile-logo">embedded<span>.log</span></a><button className="theme-button" onClick={() => setDark(!dark)} aria-label="切换主题"><Icon name={dark ? "sun" : "moon"} size={16} /></button>{mobileNav && <nav className="mobile-nav"><a href="#top" onClick={() => setMobileNav(false)}>Home</a><a href="#articles" onClick={() => setMobileNav(false)}>Blogs</a><a href="#projects" onClick={() => setMobileNav(false)}>Projects</a><a href="#about" onClick={() => setMobileNav(false)}>About</a></nav>}</header>
    <div className="layout-shell"><aside className="sidebar"><img className="avatar" src="avatar.jpg" alt="Wuhuyixia 的头像" /><nav className="sidebar-nav"><a className="active" href="#top">Home</a><a href="#about">About</a><a href="#articles">Blogs</a><a href="#projects">Projects</a><a href="#friends">Friends</a><a href="#contact">Contact</a></nav><div className="sidebar-social"><a href="#contact" aria-label="Calendar"><Icon name="calendar" size={17} /></a><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github" size={17} /></a><a href="#projects" aria-label="Projects"><Icon name="terminal" size={17} /></a><a href="#about" aria-label="About">知</a><a href="#contact" aria-label="RSS"><Icon name="rss" size={17} /></a></div><button className="sidebar-theme" onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} size={15} /> {dark ? "Light mode" : "Dark mode"}</button></aside>
      <main className="content"><section className="search-card"><label><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索" aria-label="搜索文章" /></label><button className="theme-button" onClick={() => setDark(!dark)} aria-label="切换主题"><Icon name={dark ? "sun" : "moon"} size={16} /></button></section><section className="post-feed" id="articles">{filteredPosts.map((post) => <PostCard key={post.title} post={post} />)}{filteredPosts.length === 0 && <div className="no-results">没有找到匹配的文章，试试 STM32、UART 或 Linux。</div>}</section><section className="below-card" id="projects"><div className="below-heading"><span>PROJECTS</span><h2>嵌入式项目</h2><a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">GitHub <Icon name="github" size={15} /></a></div><div className="project-row"><div><strong>STM32 环境监测系统</strong><p>STM32F4 + FreeRTOS + SHT30 + OLED</p></div><span>Completed</span></div><div className="project-row"><div><strong>ESP32 局域网控制台</strong><p>ESP32 + C++ + Wi-Fi + WebSocket</p></div><span>In progress</span></div></section><section className="below-card article-detail" id="article-detail"><div className="below-heading"><span>FEATURED ARTICLE</span><h2>STM32 DMA + UART 使用记录</h2><a href="#articles">返回文章列表 <Icon name="arrow" size={15} /></a></div><p>DMA 负责搬运数据，IDLE 线检测负责告诉我们一帧数据已经结束，两者结合可以减少 CPU 介入。</p><div className="warning-box"><strong>WARNING</strong><span>使用 DMA 和 Cache 时需要注意数据一致性。</span></div><pre><code>{`HAL_UARTEx_ReceiveToIdle_DMA(\n    &huart2, rx_buf, RX_BUF_SIZE\n);`}</code></pre></section><section className="below-card about-card" id="about"><img src="avatar.jpg" alt="Wuhuyixia 的头像" /><div><span>ABOUT</span><h2>在硬件与代码之间工作。</h2><p>专注 STM32、ESP32、Embedded Linux、FreeRTOS、PCB 与通信协议，记录从示波器、编译器和数据手册里得到的答案。</p></div></section><section id="friends" className="anchor-section" /><section id="contact" className="anchor-section" /><footer className="site-footer"><span>© 2026 embedded.log</span><span>Built with hardware &amp; curiosity.</span></footer></main></div>
  </div>;
}
