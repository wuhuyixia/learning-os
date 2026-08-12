const posts = [
  {
    date: "2026.08.12",
    category: "系统搭建",
    title: "把知识变成可以持续运行的系统",
    excerpt:
      "从一页空白 README 开始，搭建自己的学习操作系统：记录、复盘、发布，再把每一次迭代沉淀下来。",
    readTime: "6 分钟阅读",
    accent: "coral",
  },
  {
    date: "2026.08.08",
    category: "学习方法",
    title: "深度学习之前，先建立一个低摩擦入口",
    excerpt:
      "真正让人坚持下来的，往往不是更宏大的目标，而是一个随时都能开始、开始后有反馈的日常入口。",
    readTime: "4 分钟阅读",
    accent: "violet",
  },
  {
    date: "2026.08.02",
    category: "构建记录",
    title: "我为什么给每个项目都留一份复盘",
    excerpt:
      "项目结束不是知识结束。把决策、失误和下一步写下来，下一次遇到相似问题时，经验才会真正出现。",
    readTime: "5 分钟阅读",
    accent: "mint",
  },
];

const topics = ["学习系统", "编程实践", "产品思考", "阅读笔记"];

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m16 2 2.3 11.7L30 16l-11.7 2.3L16 30l-2.3-11.7L2 16l11.7-2.3L16 2Z" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="Learning OS 首页">
          <span className="brand-mark"><Spark /></span>
          <span>learning<span className="brand-dot">.</span>os</span>
        </a>
        <div className="nav-links">
          <a href="#notes">文章</a>
          <a href="#about">关于我</a>
          <a className="nav-github" href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">GitHub <Arrow /></a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> PERSONAL KNOWLEDGE LOG</p>
          <h1>把好奇心，<br /><em>变成长期主义。</em></h1>
          <p className="hero-intro">你好，我是 Wuhuyixia。这里记录我如何学习、构建和复盘，把零散的灵感整理成可以复用的系统。</p>
          <a className="primary-link" href="#notes">从最新文章开始 <Arrow /></a>
        </div>
        <div className="hero-art" aria-label="抽象的学习系统插图">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="hero-card card-one"><span>01</span><strong>Observe</strong><small>观察问题</small></div>
          <div className="hero-card card-two"><span>02</span><strong>Build</strong><small>动手构建</small></div>
          <div className="hero-card card-three"><span>03</span><strong>Reflect</strong><small>持续复盘</small></div>
          <div className="hero-center"><Spark /><span>keep<br />going</span></div>
        </div>
      </section>

      <section className="signal-bar">
        <div className="shell signal-inner">
          <span>现在正在思考</span>
          <p>如何让一个人的学习，也拥有产品迭代般的节奏感</p>
          <span className="signal-arrow">↗</span>
        </div>
      </section>

      <section className="notes shell" id="notes">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> SELECTED NOTES</p>
            <h2>最近的记录</h2>
          </div>
          <a className="text-link" href="#notes">查看全部 <Arrow /></a>
        </div>
        <div className="post-grid">
          {posts.map((post) => (
            <article className={`post-card ${post.accent}`} key={post.title}>
              <div className="post-topline"><span>{post.category}</span><span>{post.date}</span></div>
              <div className="post-body">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </div>
              <div className="post-footer"><span>{post.readTime}</span><a href="#about" aria-label={`阅读：${post.title}`}><Arrow /></a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="about shell" id="about">
        <div className="about-note"><span className="quote-mark">“</span><p>把每一次输入，<br />变成下一次行动的起点。</p></div>
        <div className="about-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A LITTLE ABOUT ME</p>
          <h2>保持好奇，<br /><em>也保持清醒。</em></h2>
          <p>我相信好的学习不是信息囤积，而是持续把问题变小、把实践做深。这个博客是我的公开实验室。</p>
          <div className="topic-list">{topics.map((topic) => <span key={topic}># {topic}</span>)}</div>
        </div>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top"><span className="brand-mark"><Spark /></span><span>learning<span className="brand-dot">.</span>os</span></a>
        <span>© 2026 · Built with curiosity.</span>
        <a href="https://github.com/wuhuyixia/learning-os" target="_blank" rel="noreferrer">在 GitHub 上查看 <Arrow /></a>
      </footer>
    </main>
  );
}
