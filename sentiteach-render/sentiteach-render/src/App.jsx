import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are SentiTeach, an expert Educational AI Agent specializing in Sentiment Analytics. You serve as a patient, rigorous, and encouraging lab instructor and academic tutor for students studying Sentiment Analysis, NLP, and Data Science.

CURRICULUM: You cover these 8 lab programs:
1. Introduction to Sentiment Analysis with NLTK
2. Text Pre-processing and Feature Extraction
3. Advanced Sentiment Analysis with Deep Learning
4. Sentiment Analysis with Pre-trained Models (BERT, RoBERTa)
5. Sentiment Analysis on Social Media Data
6. Sentiment Analysis Pipeline with Flask
7. Text Preprocessing (deep dive)
8. Visualization and Reporting

PEDAGOGICAL APPROACH:
- Use Socratic method: ask guiding questions before giving answers
- Follow I Do → We Do → You Do scaffolding
- Calibrate depth: Beginner (analogies + full commented code), Intermediate (explain why + trade-offs), Advanced (architecture internals + research)
- Always start with the big picture before implementation
- Connect every concept to a real-world sentiment use case

INTERACTION MODES (auto-detect from message):
[EXPLAIN MODE] — "what is", "explain", "how does" → concept + analogy + mini code + one self-check question
[LAB MODE] — "help me with program", "write code", "debug" → ask what they tried → identify gap → guide step by step
[QUIZ MODE] — "test me", "quiz", "viva prep" → ask 3-5 targeted questions, score and explain answers
[REVIEW MODE] — "check my code", "review" → correctness + improvements + quality rating 1-5
[CONCEPT MAP MODE] — "how does X relate to Y", "big picture" → ASCII concept map

RULES:
- NEVER give complete lab solutions without the student attempting first
- ALWAYS verify understanding after explanations
- ALWAYS end with a question, challenge, or next-step suggestion
- Use code blocks with python tags for all code
- Keep responses focused: 150-400 words for explanations
- Cite libraries by name: NLTK, spaCy, Transformers, Scikit-learn, Matplotlib, Flask, VADER, TextBlob
- Do NOT skip error analysis — always explain WHY something fails

FORMAT: Use **bold** for key terms on first use. Use numbered lists for procedures. Use bullet points for concepts. Always end with one question or challenge.`;

const PROGRAMS = [
  { id: 1, title: "NLTK Intro", short: "Introduction to Sentiment Analysis with NLTK" },
  { id: 2, title: "Feature Extraction", short: "Text Pre-processing and Feature Extraction" },
  { id: 3, title: "Deep Learning", short: "Advanced Sentiment Analysis with Deep Learning" },
  { id: 4, title: "Pre-trained Models", short: "Sentiment Analysis with Pre-trained Models (BERT/RoBERTa)" },
  { id: 5, title: "Social Media", short: "Sentiment Analysis on Social Media Data" },
  { id: 6, title: "Flask Pipeline", short: "Sentiment Analysis Pipeline with Flask" },
  { id: 7, title: "Text Preprocessing", short: "Text Preprocessing Deep Dive" },
  { id: 8, title: "Visualization", short: "Visualization and Reporting" },
];

const MODES = {
  explain: { label: "Explain Mode", color: "#185FA5", bg: "#E6F1FB" },
  lab:     { label: "Lab Mode",     color: "#0F6E56", bg: "#E1F5EE" },
  quiz:    { label: "Quiz Mode",    color: "#854F0B", bg: "#FAEEDA" },
  review:  { label: "Review Mode",  color: "#993556", bg: "#FBEAF0" },
  concept: { label: "Concept Map",  color: "#533AB7", bg: "#EEEDFE" },
  idle:    { label: "Ready",        color: "#5F5E5A", bg: "#F1EFE8" },
};

const QUICK_STARTS = [
  "What is sentiment analysis?",
  "Help me with Program 1 — NLTK",
  "Quiz me on text preprocessing",
  "Debug: VADER score is always 0",
  "Explain BERT for sentiment analysis",
  "How does TF-IDF relate to VADER?",
];

function detectMode(text) {
  const t = text.toLowerCase();
  if (/quiz|test me|viva/.test(t)) return "quiz";
  if (/debug|error|not work|fix|wrong/.test(t)) return "lab";
  if (/help me|program \d|write code|implement/.test(t)) return "lab";
  if (/check my|review my|rate my/.test(t)) return "review";
  if (/relate|big picture|concept map|connect/.test(t)) return "concept";
  if (/what is|explain|how does|how do|why/.test(t)) return "explain";
  return "lab";
}

function formatMessage(text) {
  const parts = [];
  const codeRegex = /```(?:python)?([\s\S]*?)```/g;
  let last = 0, match;
  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", content: text.slice(last, match.index) });
    parts.push({ type: "code", content: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", content: text.slice(last) });
  return parts;
}

function renderTextPart(text) {
  return text.split("\n").map((line, i, arr) => {
    const html = line.replace(/\*\*(.+?)\*\*/g, (_, b) => `<strong>${b}</strong>`);
    return <span key={i} dangerouslySetInnerHTML={{ __html: html + (i < arr.length - 1 ? "<br/>" : "") }} />;
  });
}

function MsgBubble({ role, parts }) {
  const isBot = role === "assistant";
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", flexDirection: isBot ? "row" : "row-reverse", animation:"fadeUp 0.22s ease" }}>
      <div style={{
        width:32, height:32, borderRadius:"50%", flexShrink:0,
        background: isBot ? "#E1F5EE" : "#E6F1FB",
        color: isBot ? "#085041" : "#0C447C",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, fontWeight:700, marginTop:2, fontFamily:"system-ui,sans-serif",
      }}>{isBot ? "ST" : "You"}</div>
      <div style={{ maxWidth:"80%", display:"flex", flexDirection:"column", gap:5 }}>
        {parts.map((p, i) =>
          p.type === "code" ? (
            <pre key={i} style={{
              background:"#0d1117", color:"#e6edf3", borderRadius:10,
              padding:"12px 16px", fontSize:12.5, fontFamily:"'Courier New', monospace",
              overflowX:"auto", whiteSpace:"pre-wrap", margin:"4px 0",
              border:"0.5px solid #30363d", lineHeight:1.65,
            }}>{p.content}</pre>
          ) : (
            <div key={i} style={{
              background: isBot ? "#ffffff" : "#E6F1FB",
              border: `0.5px solid ${isBot ? "#e8e8e3" : "#B5D4F4"}`,
              borderRadius: isBot ? "3px 14px 14px 14px" : "14px 3px 14px 14px",
              padding:"10px 14px", fontSize:14, lineHeight:1.75,
              color: isBot ? "#1a1a18" : "#042C53",
              boxShadow: isBot ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
            }}>
              {renderTextPart(p.content)}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", background:"#E1F5EE", color:"#085041", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:"system-ui,sans-serif", flexShrink:0 }}>ST</div>
      <div style={{ background:"#fff", border:"0.5px solid #e8e8e3", borderRadius:"3px 14px 14px 14px", padding:"13px 18px", display:"flex", gap:6, alignItems:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#aaa", animation:`blink 1.2s ${i*0.2}s infinite` }} />)}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory]   = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState("idle");
  const [activeProgram, setActiveProgram] = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const greeting = "Hi! I'm **SentiTeach**, your Sentiment Analytics lab tutor.\n\nWhich program are you working on today — NLTK basics, text preprocessing, deep learning models, BERT, or something else?\n\nTell me where you're stuck and we'll work through it together.";
    setMessages([{ role:"assistant", parts: formatMessage(greeting) }]);
    setHistory([{ role:"assistant", content: "Hi! I'm SentiTeach, your Sentiment Analytics lab tutor. Which program are you working on today? Tell me where you're stuck and we'll work through it together." }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  async function send(text) {
    if (!text.trim() || loading) return;
    setMode(detectMode(text));
    const newHistory = [...history, { role:"user", content: text }];
    setMessages(prev => [...prev, { role:"user", parts: formatMessage(text) }]);
    setHistory(newHistory);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages: newHistory, system: SYSTEM_PROMPT }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't get a response.";
      setHistory(h => [...h, { role:"assistant", content: reply }]);
      setMessages(prev => [...prev, { role:"assistant", parts: formatMessage(reply) }]);
    } catch {
      setMessages(prev => [...prev, { role:"assistant", parts:[{ type:"text", content:"Connection error. Please try again." }] }]);
    }
    setLoading(false);
  }

  const modeInfo = MODES[mode] || MODES.idle;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#fafaf8", fontFamily:"Georgia, serif" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes blink { 0%,80%,100% { opacity:0.2 } 40% { opacity:1 } }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px }
        .prog-btn:hover { background:#f0f0ec !important }
        .chip:hover { background:#E6F1FB !important; color:#0C447C !important; border-color:#B5D4F4 !important }
        .send:hover:not(:disabled) { background:#0C447C !important }
        .tog:hover { background:#f0f0ec !important }
        textarea:focus { outline:none; border-color:#378ADD !important; }
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside style={{ width:230, background:"#fff", borderRight:"0.5px solid #e8e8e3", display:"flex", flexDirection:"column", flexShrink:0 }}>
          {/* Brand */}
          <div style={{ padding:"18px 16px 14px", borderBottom:"0.5px solid #e8e8e3" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:"#E1F5EE", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeWidth="3"/>
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeWidth="3"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a1a18", letterSpacing:"-0.4px" }}>SentiTeach</div>
                <div style={{ fontSize:11, color:"#999", marginTop:1, fontFamily:"system-ui,sans-serif" }}>Sentiment Analytics Tutor</div>
              </div>
            </div>
          </div>

          {/* Programs list */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 10px" }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em", color:"#bbb", textTransform:"uppercase", padding:"0 6px", marginBottom:8, fontFamily:"system-ui,sans-serif" }}>Lab Programs</div>
            {PROGRAMS.map(p => (
              <button key={p.id} className="prog-btn" onClick={() => { setActiveProgram(p.id); send(`Help me with Program ${p.id} — ${p.short}`); }} style={{
                display:"flex", alignItems:"center", gap:9, padding:"8px 8px",
                borderRadius:9, cursor:"pointer", marginBottom:3, width:"100%",
                background: activeProgram === p.id ? "#E1F5EE" : "transparent",
                border:"none", textAlign:"left", transition:"background 0.15s",
              }}>
                <div style={{
                  width:24, height:24, borderRadius:7, flexShrink:0,
                  background: activeProgram === p.id ? "#9FE1CB" : "#f0f0ec",
                  color: activeProgram === p.id ? "#085041" : "#999",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700, fontFamily:"system-ui,sans-serif",
                }}>{p.id}</div>
                <span style={{ fontSize:12.5, color: activeProgram === p.id ? "#085041" : "#555", fontFamily:"system-ui,sans-serif", lineHeight:1.3 }}>{p.title}</span>
              </button>
            ))}
          </div>

          {/* Mode badge */}
          <div style={{ padding:"12px 14px", borderTop:"0.5px solid #e8e8e3" }}>
            <div style={{ fontSize:10, color:"#bbb", marginBottom:6, fontFamily:"system-ui,sans-serif", textTransform:"uppercase", letterSpacing:"0.07em" }}>Active Mode</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 11px", borderRadius:20, background: modeInfo.bg, color: modeInfo.color, fontSize:12, fontWeight:600, fontFamily:"system-ui,sans-serif", transition:"all 0.3s" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background: modeInfo.color, flexShrink:0 }} />
              {modeInfo.label}
            </div>
          </div>
        </aside>
      )}

      {/* Chat area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Topbar */}
        <header style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 18px", borderBottom:"0.5px solid #e8e8e3", background:"#fff", flexShrink:0 }}>
          <button className="tog" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width:32, height:32, borderRadius:8, border:"0.5px solid #e8e8e3", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{ fontSize:13.5, color:"#666", fontFamily:"system-ui,sans-serif" }}>Sentiment Analytics · Interactive Lab Tutor</span>
          <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
            {["CO1","CO2","CO3","CO4","CO5"].map(co => (
              <span key={co} style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#f0f0ec", color:"#888", fontFamily:"system-ui,sans-serif", fontWeight:600 }}>{co}</span>
            ))}
          </div>
        </header>

        {/* Messages */}
        <main style={{ flex:1, overflowY:"auto", padding:"22px 28px", display:"flex", flexDirection:"column", gap:16 }}>
          {messages.map((m, i) => <MsgBubble key={i} role={m.role} parts={m.parts} />)}
          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </main>

        {/* Quick starts */}
        {messages.length <= 1 && !loading && (
          <div style={{ padding:"0 28px 10px", display:"flex", flexWrap:"wrap", gap:7 }}>
            {QUICK_STARTS.map((q, i) => (
              <button key={i} className="chip" onClick={() => send(q)} style={{
                fontSize:12.5, padding:"6px 13px", borderRadius:20, border:"0.5px solid #ddd",
                background:"#fff", cursor:"pointer", color:"#666", fontFamily:"system-ui,sans-serif", transition:"all 0.15s",
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <footer style={{ padding:"12px 18px", borderTop:"0.5px solid #e8e8e3", background:"#fff", display:"flex", gap:9, flexShrink:0 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask SentiTeach anything... (Enter to send)"
            rows={1}
            style={{
              flex:1, resize:"none", fontSize:14, padding:"9px 14px",
              borderRadius:11, border:"0.5px solid #ddd", fontFamily:"system-ui,sans-serif",
              lineHeight:1.5, background:"#fafaf8", color:"#1a1a18", maxHeight:100, overflowY:"auto",
            }}
          />
          <button className="send" onClick={() => send(input)} disabled={loading || !input.trim()} style={{
            width:40, height:40, borderRadius:11, border:"none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            background: loading || !input.trim() ? "#eee" : "#185FA5",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, alignSelf:"flex-end", transition:"background 0.15s",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={loading || !input.trim() ? "#bbb" : "#fff"} strokeWidth="2.2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </footer>
      </div>
    </div>
  );
}
