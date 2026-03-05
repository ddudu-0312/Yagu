import { useState, useEffect, useRef } from "react";

function generateSecret(len) {
  const digits = [];
  while (digits.length < len) {
    const d = Math.floor(Math.random() * 10).toString();
    if (!digits.includes(d) && !(digits.length === 0 && d === "0")) digits.push(d);
  }
  return digits.join("");
}

function calcResult(secret, guess) {
  let strikes = 0, balls = 0;
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) strikes++;
    else if (secret.includes(guess[i])) balls++;
  }
  return { strikes, balls };
}

const MODES = [
  { label: "3자리", digits: 3, tries: 9 },
  { label: "4자리", digits: 4, tries: 12 },
];

export default function BaseballGame() {
  const [modeIdx, setModeIdx] = useState(0);
  const mode = MODES[modeIdx];

  const [secret, setSecret] = useState(() => generateSecret(3));
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [shake, setShake] = useState(false);
  const [flashRow, setFlashRow] = useState(null);
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [gameOver]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const startNewGame = (idx) => {
    const m = MODES[idx];
    setModeIdx(idx);
    setSecret(generateSecret(m.digits));
    setHistory([]);
    setInput("");
    setGameOver(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= mode.digits) setInput(val);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = () => {
    if (gameOver) return;
    if (input.length !== mode.digits) { triggerShake(); return; }
    const digits = input.split("");
    if (new Set(digits).size !== mode.digits) { triggerShake(); return; }
    if (digits[0] === "0") { triggerShake(); return; }

    const { strikes, balls } = calcResult(secret, input);
    const tryNum = history.length + 1;
    const out = strikes === 0 && balls === 0;
    const won = strikes === mode.digits;

    const newEntry = { guess: input, strikes, balls, out, won, try: tryNum };
    setHistory(prev => [...prev, newEntry]);
    setFlashRow(tryNum);
    setTimeout(() => setFlashRow(null), 600);
    setInput("");

    if (won || tryNum >= mode.tries) setGameOver(true);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleReset = () => {
    setSecret(generateSecret(mode.digits));
    setHistory([]);
    setInput("");
    setGameOver(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const won = history.some(h => h.won);
  const remaining = mode.tries - history.length;
  const placeholder = Array(mode.digits).fill("_").join(" ");
  const letterSpacing = mode.digits === 4 ? "8px" : "12px";
  const fontSize = mode.digits === 4 ? "20px" : "24px";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Courier New', Courier, monospace",
      padding: "20px",
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes flashGreen {
          0%{background:rgba(0,255,120,0.18)}
          100%{background:transparent}
        }
        @keyframes pulseGlow {
          0%,100%{box-shadow:0 0 8px #00ff78aa}
          50%{box-shadow:0 0 22px #00ff78ff, 0 0 40px #00ff7844}
        }
        .row-flash { animation: flashGreen 0.6s ease-out; }
        .shake-input { animation: shake 0.4s ease; }
        .win-glow { animation: pulseGlow 1.2s ease-in-out infinite; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>

      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "#0e0e16",
        border: "1px solid #1e1e2e",
        borderRadius: "4px",
        overflow: "hidden",
        boxShadow: "0 0 60px rgba(0,255,120,0.05), 0 20px 60px rgba(0,0,0,0.8)",
        position: "relative",
      }}>
        {/* Scanline */}
        <div style={{
          position:"absolute",inset:0,pointerEvents:"none",zIndex:10,
          background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)",
          borderRadius:"4px",
        }}/>

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #1a1a28",
          background: "linear-gradient(180deg, #111120 0%, #0e0e16 100%)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
            <div style={{ width:"8px",height:"8px",borderRadius:"50%",background:"#00ff78",boxShadow:"0 0 8px #00ff78" }}/>
            <span style={{ color:"#00ff78", fontSize:"11px", letterSpacing:"4px", textTransform:"uppercase" }}>
              BASEBALL.EXE
            </span>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"12px" }}>
            <div>
              <div style={{ color:"#ffffff", fontSize:"22px", fontWeight:"bold", letterSpacing:"2px" }}>
                숫자 야구
              </div>
              {/* Mode selector */}
              <div style={{ display:"flex", gap:"6px", marginTop:"8px", alignItems:"center" }}>
                {MODES.map((m, i) => (
                  <button
                    key={m.label}
                    onClick={() => startNewGame(i)}
                    style={{
                      background: modeIdx === i ? "#00ff78" : "transparent",
                      border: `1px solid ${modeIdx === i ? "#00ff78" : "#2a2a3e"}`,
                      borderRadius: "3px",
                      color: modeIdx === i ? "#000" : "#666",
                      fontFamily: "'Courier New', monospace",
                      fontWeight: "bold",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      padding: "4px 12px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
                <span style={{ color:"#555", fontSize:"10px", marginLeft:"4px" }}>
                  기회 {mode.tries}번
                </span>
              </div>
            </div>

            <div style={{
              background:"#111",
              border:"1px solid #1e1e2e",
              borderRadius:"3px",
              padding:"6px 14px",
              textAlign:"center",
              minWidth:"60px",
            }}>
              <div style={{ color:"#999", fontSize:"9px", letterSpacing:"2px" }}>TRIES LEFT</div>
              <div style={{
                color: remaining <= 3 ? "#ff4455" : "#00ff78",
                fontSize:"22px",
                fontWeight:"bold",
                lineHeight:1,
                marginTop:"2px",
              }}>{gameOver ? (won ? "✓" : "✗") : remaining}</div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div style={{
          padding:"10px 24px",
          background:"#080810",
          borderBottom:"1px solid #1a1a28",
          display:"flex",
          gap:"20px",
        }}>
          {[
            { icon:"⚾", label:"스트라이크", desc:"자리·숫자 일치" },
            { icon:"🟡", label:"볼", desc:"숫자만 일치" },
            { icon:"❌", label:"아웃", desc:"모두 불일치" },
          ].map(r => (
            <div key={r.label} style={{ flex:1 }}>
              <div style={{ color:"#aaa", fontSize:"9px", letterSpacing:"1px" }}>{r.icon} {r.label}</div>
              <div style={{ color:"#777", fontSize:"9px", marginTop:"1px" }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* History */}
        <div
          ref={historyRef}
          style={{
            height:"260px",
            overflowY:"auto",
            padding:"12px 24px",
            display:"flex",
            flexDirection:"column",
            gap:"4px",
          }}
        >
          {history.length === 0 && (
            <div style={{
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              height:"100%",
              color:"#2a2a3a",
              fontSize:"12px",
              letterSpacing:"3px",
            }}>
              {placeholder} · · ·
            </div>
          )}
          {history.map((h, i) => (
            <div
              key={i}
              className={flashRow === h.try ? "row-flash" : ""}
              style={{
                display:"flex",
                alignItems:"center",
                justifyContent:"space-between",
                padding:"7px 10px",
                borderRadius:"3px",
                border:"1px solid",
                borderColor: h.won ? "#00ff7840" : h.out ? "#ff445520" : "#1e1e2e",
                background: h.won ? "#00ff7808" : "transparent",
                animation: "fadeSlideIn 0.3s ease",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ color:"#777", fontSize:"10px", width:"18px" }}>#{h.try}</span>
                <span style={{
                  color:"#ccc",
                  fontSize: mode.digits === 4 ? "16px" : "18px",
                  letterSpacing:"5px",
                  fontWeight:"bold"
                }}>
                  {h.guess}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                {h.won ? (
                  <span style={{ color:"#00ff78", fontSize:"11px", letterSpacing:"2px" }}>HOME RUN!</span>
                ) : h.out ? (
                  <span style={{ color:"#ff4455", fontSize:"11px", letterSpacing:"2px" }}>OUT</span>
                ) : (
                  <>
                    {h.strikes > 0 && (
                      <div style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                        {Array(h.strikes).fill(0).map((_,j)=>(
                          <div key={j} style={{
                            width:"9px",height:"9px",borderRadius:"50%",
                            background:"#00ff78",boxShadow:"0 0 6px #00ff78"
                          }}/>
                        ))}
                        <span style={{color:"#00ff78",fontSize:"10px",marginLeft:"2px"}}>S</span>
                      </div>
                    )}
                    {h.balls > 0 && (
                      <div style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                        {Array(h.balls).fill(0).map((_,j)=>(
                          <div key={j} style={{
                            width:"9px",height:"9px",borderRadius:"50%",
                            background:"#ffcc00",boxShadow:"0 0 6px #ffcc0066"
                          }}/>
                        ))}
                        <span style={{color:"#ffcc00",fontSize:"10px",marginLeft:"2px"}}>B</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div style={{
          padding:"16px 24px 20px",
          borderTop:"1px solid #1a1a28",
          background:"#080810",
        }}>
          {!gameOver ? (
            <div style={{ display:"flex", gap:"8px" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                maxLength={mode.digits}
                placeholder={placeholder}
                className={shake ? "shake-input" : ""}
                style={{
                  flex:1,
                  background:"#0a0a12",
                  border:"1px solid #2a2a3e",
                  borderRadius:"3px",
                  color:"#00ff78",
                  fontSize,
                  fontWeight:"bold",
                  letterSpacing,
                  textAlign:"center",
                  padding:"10px 0",
                  fontFamily:"'Courier New', monospace",
                  caretColor:"#00ff78",
                  transition:"border-color 0.2s",
                }}
              />
              <button
                onClick={handleSubmit}
                style={{
                  background:"#00ff78",
                  border:"none",
                  borderRadius:"3px",
                  color:"#000",
                  fontFamily:"'Courier New', monospace",
                  fontWeight:"bold",
                  fontSize:"12px",
                  letterSpacing:"2px",
                  padding:"0 20px",
                  cursor:"pointer",
                  transition:"opacity 0.15s, transform 0.1s",
                }}
                onMouseEnter={e=>e.target.style.opacity="0.85"}
                onMouseLeave={e=>e.target.style.opacity="1"}
                onMouseDown={e=>e.target.style.transform="scale(0.97)"}
                onMouseUp={e=>e.target.style.transform="scale(1)"}
              >
                PITCH
              </button>
            </div>
          ) : (
            <div style={{ textAlign:"center" }}>
              {won ? (
                <div style={{ marginBottom:"14px" }}>
                  <div className="win-glow" style={{
                    color:"#00ff78",
                    fontSize:"15px",
                    fontWeight:"bold",
                    letterSpacing:"4px",
                    padding:"10px",
                    border:"1px solid #00ff7840",
                    borderRadius:"3px",
                    marginBottom:"6px",
                  }}>
                    ⚾ HOME RUN!
                  </div>
                  <div style={{ color:"#aaa", fontSize:"11px", letterSpacing:"2px" }}>
                    {history.length}번 만에{" "}
                    <span style={{color:"#00ff78",letterSpacing:"5px"}}>{secret}</span> 정답!
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom:"14px" }}>
                  <div style={{
                    color:"#ff4455",
                    fontSize:"14px",
                    fontWeight:"bold",
                    letterSpacing:"3px",
                    marginBottom:"8px",
                  }}>GAME OVER</div>
                  <div style={{ color:"#aaa", fontSize:"11px", letterSpacing:"1px" }}>
                    정답은{" "}
                    <span style={{color:"#fff",letterSpacing:"5px",fontSize:"18px"}}>{secret}</span>
                    {" "}이었습니다
                  </div>
                </div>
              )}
              <button
                onClick={handleReset}
                style={{
                  background:"transparent",
                  border:"1px solid #2a2a3e",
                  borderRadius:"3px",
                  color:"#888",
                  fontFamily:"'Courier New', monospace",
                  fontSize:"11px",
                  letterSpacing:"3px",
                  padding:"8px 24px",
                  cursor:"pointer",
                  transition:"all 0.2s",
                }}
                onMouseEnter={e=>{e.target.style.borderColor="#555";e.target.style.color="#ccc"}}
                onMouseLeave={e=>{e.target.style.borderColor="#2a2a3e";e.target.style.color="#888"}}
              >
                NEW GAME
              </button>
            </div>
          )}
          <div style={{ color:"#555", fontSize:"9px", textAlign:"center", marginTop:"10px", letterSpacing:"2px" }}>
            서로 다른 숫자 {mode.digits}자리 · 첫째 자리 0 불가 · {mode.tries}번 이내
          </div>
        </div>
      </div>
    </div>
  );
}
