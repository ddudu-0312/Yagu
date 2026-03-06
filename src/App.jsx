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
  { label: "5자리", digits: 5, tries: 15 },
];

const initDigitState = () => {
  const s = {};
  for (let i = 0; i <= 9; i++) s[i] = null;
  return s;
};

const initStats = () => ({ wins: 0, losses: 0, totalTries: 0, best: {} });

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ────────────────────────────────────────────
// 메인 앱
// ────────────────────────────────────────────
export default function App() {
  // "home" | "solo" | "duo-set" | "duo-play"
  const [screen, setScreen] = useState("home");
  const [modeIdx, setModeIdx] = useState(0);
  const [hardMode, setHardMode] = useState(false);

  // 2인용: 출제자가 입력한 숫자
  const [duoSecret, setDuoSecret] = useState("");
  const [duoSetInput, setDuoSetInput] = useState("");
  const [duoSetShake, setDuoSetShake] = useState(false);
  const [duoSetError, setDuoSetError] = useState("");
  const [duoSetShow, setDuoSetShow] = useState(false);

  const mode = MODES[modeIdx];

  const goHome = () => {
    setScreen("home");
    setDuoSetInput("");
    setDuoSecret("");
    setDuoSetError("");
    setDuoSetShow(false);
  };

  // 2인용 숫자 설정 확인
  const confirmDuoSecret = () => {
    const val = duoSetInput;
    const digits = val.split("");
    if (val.length !== mode.digits) { setDuoSetShake(true); setTimeout(()=>setDuoSetShake(false),400); setDuoSetError(`${mode.digits}자리를 입력하세요`); return; }
    if (new Set(digits).size !== mode.digits) { setDuoSetShake(true); setTimeout(()=>setDuoSetShake(false),400); setDuoSetError("중복된 숫자가 있어요"); return; }
    if (digits[0] === "0") { setDuoSetShake(true); setTimeout(()=>setDuoSetShake(false),400); setDuoSetError("첫째 자리는 0이 될 수 없어요"); return; }
    setDuoSecret(val);
    setDuoSetError("");
    setScreen("duo-play");
  };

  if (screen === "home") {
    return <HomeScreen onSolo={() => setScreen("solo")} onDuo={() => setScreen("duo-set")}
      modeIdx={modeIdx} setModeIdx={setModeIdx} hardMode={hardMode} setHardMode={setHardMode} />;
  }

  if (screen === "duo-set") {
    return (
      <SetSecretScreen
        mode={mode}
        input={duoSetInput}
        setInput={setDuoSetInput}
        shake={duoSetShake}
        show={duoSetShow}
        setShow={setDuoSetShow}
        error={duoSetError}
        onConfirm={confirmDuoSecret}
        onBack={goHome}
      />
    );
  }

  return (
    <GameScreen
      key={screen + modeIdx + hardMode + duoSecret}
      mode={mode}
      modeIdx={modeIdx}
      setModeIdx={setModeIdx}
      hardMode={hardMode}
      setHardMode={setHardMode}
      isSolo={screen === "solo"}
      duoSecret={duoSecret}
      onHome={goHome}
      onRematch={() => setScreen(screen === "solo" ? "solo" : "duo-set")}
    />
  );
}

// ────────────────────────────────────────────
// 홈 화면
// ────────────────────────────────────────────
function HomeScreen({ onSolo, onDuo, modeIdx, setModeIdx, hardMode, setHardMode }) {
  const mode = MODES[modeIdx];
  return (
    <div style={{
      position:"fixed", inset:0, background:"#0a0a0f",
      overflowY:"auto",
      fontFamily:"'Courier New',Courier,monospace",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        button:active{transform:scale(0.96)}
        input:focus{outline:none}
      `}</style>
      <div style={{width:"100%",maxWidth:"380px",padding:"24px 20px 40px",margin:"0 auto"}}>
        {/* 로고 */}
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginBottom:"6px"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#00ff78",boxShadow:"0 0 10px #00ff78",animation:"pulse 2s infinite"}}/>
            <span style={{color:"#00ff78",fontSize:"11px",letterSpacing:"5px"}}>BASEBALL.EXE</span>
          </div>
          <div style={{color:"#fff",fontSize:"32px",fontWeight:"bold",letterSpacing:"4px"}}>숫자 야구</div>
          <div style={{color:"#888",fontSize:"11px",marginTop:"6px",letterSpacing:"2px"}}>NUMBER BASEBALL GAME</div>
        </div>

        {/* 모드 설정 */}
        <div style={{marginBottom:"24px",background:"#0e0e16",border:"1px solid #1e1e2e",borderRadius:"6px",padding:"16px"}}>
          <div style={{color:"#999",fontSize:"9px",letterSpacing:"3px",marginBottom:"10px"}}>SETTINGS</div>
          <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
            {MODES.map((m,i) => (
              <button key={m.label} onClick={() => setModeIdx(i)} style={{
                flex:1, background:modeIdx===i?"#00ff78":"transparent",
                border:`1px solid ${modeIdx===i?"#00ff78":"#2a2a3e"}`,
                borderRadius:"3px", color:modeIdx===i?"#000":"#888",
                fontFamily:"'Courier New',monospace", fontWeight:"bold",
                fontSize:"10px", padding:"6px 0", cursor:"pointer", letterSpacing:"1px",
              }}>{m.label}</button>
            ))}
          </div>
          <button onClick={() => setHardMode(h => !h)} style={{
            width:"100%", background:hardMode?"#2a0a0a":"transparent",
            border:`1px solid ${hardMode?"#ff4455":"#2a2a3e"}`,
            borderRadius:"3px", color:hardMode?"#ff4455":"#888",
            fontFamily:"'Courier New',monospace", fontSize:"10px",
            padding:"6px 0", cursor:"pointer", letterSpacing:"2px",
          }}>⚡ HARD MODE {hardMode?"ON":"OFF"}</button>
        </div>

        {/* 플레이 선택 */}
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <button onClick={onSolo} style={{
            background:"#00ff78", border:"none", borderRadius:"4px",
            color:"#000", fontFamily:"'Courier New',monospace", fontWeight:"bold",
            fontSize:"14px", letterSpacing:"3px", padding:"16px",
            cursor:"pointer", transition:"opacity 0.15s",
          }}
            onMouseEnter={e=>e.target.style.opacity="0.85"}
            onMouseLeave={e=>e.target.style.opacity="1"}
          >👤 1인용 플레이</button>

          <button onClick={onDuo} style={{
            background:"transparent", border:"1px solid #00ff7866",
            borderRadius:"4px", color:"#00ff78",
            fontFamily:"'Courier New',monospace", fontWeight:"bold",
            fontSize:"14px", letterSpacing:"3px", padding:"16px",
            cursor:"pointer", transition:"all 0.15s",
          }}
            onMouseEnter={e=>{e.target.style.background="#00ff7811"}}
            onMouseLeave={e=>{e.target.style.background="transparent"}}
          >👥 2인용 플레이</button>
        </div>

        {/* 게임 방법 */}
        <div style={{marginTop:"16px",background:"#0e0e16",border:"1px solid #1e1e2e",borderRadius:"6px",padding:"14px"}}>
          <div style={{color:"#999",fontSize:"9px",letterSpacing:"3px",marginBottom:"10px"}}>HOW TO PLAY</div>

          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {[
              { icon:"1️⃣", title:"숫자 생성", desc:"컴퓨터(또는 출제자)가 서로 다른 숫자로 된 N자리 수를 만들어요. 첫째 자리는 0이 될 수 없어요." },
              { icon:"2️⃣", title:"숫자 추리", desc:"N자리 숫자를 입력하고 PITCH! 결과를 보고 정답을 추리하세요." },
              { icon:"⚾", title:"스트라이크", desc:"숫자와 자리가 모두 맞으면 스트라이크! 모두 스트라이크면 홈런(정답)!" },
              { icon:"🟡", title:"볼", desc:"숫자는 맞지만 자리가 다르면 볼." },
              { icon:"❌", title:"아웃", desc:"숫자가 하나도 없으면 아웃." },
            ].map(r => (
              <div key={r.title} style={{display:"flex",gap:"10px",alignItems:"flex-start"}}>
                <span style={{fontSize:"14px",flexShrink:0,marginTop:"1px"}}>{r.icon}</span>
                <div>
                  <div style={{color:"#ddd",fontSize:"10px",fontWeight:"bold",marginBottom:"2px"}}>{r.title}</div>
                  <div style={{color:"#888",fontSize:"9px",lineHeight:"1.5"}}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:"12px",padding:"8px",background:"#080810",border:"1px solid #1a1a28",borderRadius:"4px"}}>
            <div style={{color:"#999",fontSize:"9px",letterSpacing:"1px",marginBottom:"4px"}}>예시 — 정답이 <span style={{color:"#00ff78"}}>472</span> 일 때</div>
            {[
              { guess:"123", result:"0S 1B", desc:"2가 있지만 자리가 다름" },
              { guess:"416", result:"1S 0B", desc:"4가 첫째 자리 정확" },
              { guess:"472", result:"3S 0B", desc:"홈런! 정답!" },
            ].map(e => (
              <div key={e.guess} style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"4px"}}>
                <span style={{color:"#aaa",fontSize:"11px",letterSpacing:"3px",fontWeight:"bold",width:"36px"}}>{e.guess}</span>
                <span style={{color:"#555",fontSize:"9px"}}>→</span>
                <span style={{color:"#00ff78",fontSize:"10px",width:"54px"}}>{e.result}</span>
                <span style={{color:"#666",fontSize:"9px"}}>{e.desc}</span>
              </div>
            ))}
          </div>

          <div style={{marginTop:"10px",padding:"7px",background:"#0a0a00",border:"1px solid #ffcc0022",borderRadius:"4px"}}>
            <div style={{color:"#ffcc00",fontSize:"9px",letterSpacing:"1px",marginBottom:"3px"}}>👥 2인용 방법</div>
            <div style={{color:"#888",fontSize:"9px",lineHeight:"1.6"}}>
              출제자가 숫자를 입력(가려진 상태) → 폰을 넘겨서 상대방이 추리 시작!<br/>
              맞히면 출제자 승리, 못 맞히면 추리자 패배.
            </div>
          </div>
        </div>

        <div style={{color:"#555",fontSize:"9px",textAlign:"center",marginTop:"12px",letterSpacing:"2px"}}>
          {MODES[modeIdx].digits}자리 · 첫째자리 0 불가 · {MODES[modeIdx].tries}번 이내
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// 2인용: 숫자 설정 화면
// ────────────────────────────────────────────
function SetSecretScreen({ mode, input, setInput, shake, show, setShow, error, onConfirm, onBack }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= mode.digits) setInput(val);
  };
  const handleKey = (e) => { if (e.key === "Enter") onConfirm(); };

  return (
    <div style={{
      position:"fixed", inset:0, background:"#0a0a0f",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Courier New',Courier,monospace",
    }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }
        .shake-it{animation:shake 0.4s ease}
        input:focus{outline:none}
        button:active{transform:scale(0.96)}
      `}</style>
      <div style={{width:"100%",maxWidth:"380px",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{color:"#ffcc00",fontSize:"11px",letterSpacing:"4px",marginBottom:"8px"}}>👥 2인용 모드</div>
          <div style={{color:"#fff",fontSize:"22px",fontWeight:"bold",letterSpacing:"2px"}}>출제자가 숫자 설정</div>
          <div style={{color:"#888",fontSize:"11px",marginTop:"6px"}}>상대방이 보지 못하게 입력하세요</div>
        </div>

        <div style={{
          background:"#0e0e16", border:"1px solid #1e1e2e",
          borderRadius:"6px", padding:"20px", marginBottom:"16px",
        }}>
          <div style={{color:"#999",fontSize:"9px",letterSpacing:"3px",marginBottom:"12px"}}>
            {mode.digits}자리 숫자 입력 (서로 다른 숫자, 첫째 자리 0 불가)
          </div>
          <div style={{position:"relative"}}>
            <input
              ref={inputRef}
              value={show ? input : input.replace(/./g, "●")}
              onChange={handleInput}
              onKeyDown={handleKey}
              maxLength={mode.digits}
              placeholder={Array(mode.digits).fill("_").join(" ")}
              className={shake?"shake-it":""}
              style={{
                width:"100%", boxSizing:"border-box",
                background:"#0a0a12", border:`1px solid ${error?"#ff4455":"#2a2a3e"}`,
                borderRadius:"3px", color:"#ffcc00",
                fontSize:"28px", fontWeight:"bold",
                letterSpacing:"12px", textAlign:"center",
                padding:"12px 40px 12px 12px",
                fontFamily:"'Courier New',monospace",
                caretColor:"#ffcc00",
              }}
            />
            <button onClick={() => setShow(s => !s)} style={{
              position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)",
              background:"transparent", border:"none", color:"#666",
              fontSize:"16px", cursor:"pointer", padding:"0",
            }}>{show ? "🙈" : "👁️"}</button>
          </div>
          {error && <div style={{color:"#ff4455",fontSize:"10px",marginTop:"6px",letterSpacing:"1px"}}>⚠ {error}</div>}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <button onClick={onConfirm} style={{
            background:"#ffcc00", border:"none", borderRadius:"4px",
            color:"#000", fontFamily:"'Courier New',monospace", fontWeight:"bold",
            fontSize:"13px", letterSpacing:"3px", padding:"14px",
            cursor:"pointer",
          }}>확인 → 게임 시작</button>
          <button onClick={onBack} style={{
            background:"transparent", border:"1px solid #2a2a3e",
            borderRadius:"4px", color:"#888",
            fontFamily:"'Courier New',monospace", fontSize:"11px",
            letterSpacing:"2px", padding:"10px",
            cursor:"pointer",
          }}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// 게임 화면 (1인 / 2인 공용)
// ────────────────────────────────────────────
function GameScreen({ mode, modeIdx, hardMode, isSolo, duoSecret, onHome, onRematch }) {
  const secret = isSolo ? useRef(generateSecret(mode.digits)).current : duoSecret;

  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [shake, setShake] = useState(false);
  const [flashRow, setFlashRow] = useState(null);
  const [digitState, setDigitState] = useState(initDigitState);
  const [elapsed, setElapsed] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintText, setHintText] = useState("");
  const [tab, setTab] = useState("game");
  const [stats] = useState(initStats);

  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const timerRef = useRef(null);
  const secretRef = useRef(secret);

  useEffect(() => {
    if (timerOn && !gameOver) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerOn, gameOver]);

  useEffect(() => { inputRef.current?.focus(); }, [gameOver, tab]);
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= mode.digits) {
      setInput(val);
      if (!timerOn && val.length > 0) setTimerOn(true);
    }
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const handleSubmit = () => {
    if (gameOver) return;
    if (input.length !== mode.digits) { triggerShake(); return; }
    const digits = input.split("");
    if (new Set(digits).size !== mode.digits) { triggerShake(); return; }
    if (digits[0] === "0") { triggerShake(); return; }

    const { strikes, balls } = calcResult(secretRef.current, input);
    const tryNum = history.length + 1;
    const out = strikes === 0 && balls === 0;
    const won = strikes === mode.digits;

    setHistory(prev => [...prev, { guess: input, strikes, balls, out, won, try: tryNum }]);
    setFlashRow(tryNum);
    setTimeout(() => setFlashRow(null), 600);
    setInput("");
    if (won || tryNum >= mode.tries) { setGameOver(true); setTimerOn(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const useHint = () => {
    if (hintUsed || gameOver) return;
    setHintUsed(true);
    const first = parseInt(secretRef.current[0]);
    setHintText(first <= 4 ? "첫째 자리는 1~4 사이" : "첫째 자리는 5~9 사이");
  };

  const cycleDigit = (d) => {
    setDigitState(prev => {
      const cur = prev[d];
      return { ...prev, [d]: cur === null ? "in" : cur === "in" ? "out" : null };
    });
  };

  const won = history.some(h => h.won);
  const remaining = mode.tries - history.length;
  const placeholder = Array(mode.digits).fill("_").join(" ");
  const letterSpacing = mode.digits >= 4 ? "6px" : "12px";
  const fontSize = mode.digits >= 4 ? "18px" : "22px";

  return (
    <div style={{
      position:"fixed", inset:0, background:"#0a0a0f",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Courier New',Courier,monospace", overflow:"hidden",
    }}>
      <style>{`
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        @keyframes flashGreen{0%{background:rgba(0,255,120,0.2)}100%{background:transparent}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 8px #00ff78aa}50%{box-shadow:0 0 24px #00ff78ff,0 0 40px #00ff7844}}
        .row-flash{animation:flashGreen 0.6s ease-out}
        .shake-input{animation:shake 0.4s ease}
        .win-glow{animation:pulseGlow 1.2s ease-in-out infinite}
        input:focus{outline:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#111}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        button:active{transform:scale(0.96)}
      `}</style>

      <div style={{
        width:"100%", maxWidth:"440px", height:"100vh",
        background:"#0e0e16", border:"1px solid #1e1e2e",
        overflow:"hidden", position:"relative",
        display:"flex", flexDirection:"column",
        boxShadow:"0 0 60px rgba(0,255,120,0.05)",
      }}>
        {/* Scanline */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:10,
          background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)"}}/>

        {/* Header */}
        <div style={{
          padding:"10px 14px 8px", borderBottom:"1px solid #1a1a28",
          background:"linear-gradient(180deg,#111120 0%,#0e0e16 100%)", flexShrink:0,
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              <button onClick={onHome} style={{
                background:"transparent", border:"1px solid #2a2a3e",
                borderRadius:"3px", color:"#999", fontFamily:"'Courier New',monospace",
                fontSize:"9px", padding:"2px 8px", cursor:"pointer", letterSpacing:"1px",
              }}>← HOME</button>
              <div style={{
                background: isSolo ? "#001a0a" : "#1a1000",
                border:`1px solid ${isSolo?"#00ff7833":"#ffcc0033"}`,
                borderRadius:"3px", padding:"2px 8px",
                color: isSolo ? "#00ff78" : "#ffcc00",
                fontSize:"9px", letterSpacing:"2px",
              }}>{isSolo ? "👤 1인용" : "👥 2인용"}</div>
              {hardMode && <div style={{background:"#2a0a0a",border:"1px solid #ff445533",borderRadius:"3px",padding:"2px 8px",color:"#ff4455",fontSize:"9px"}}>⚡HARD</div>}
            </div>
            <div style={{
              background:"#111", border:"1px solid #1e1e2e", borderRadius:"3px",
              padding:"3px 10px", color:elapsed>0&&!gameOver?"#00ff78":"#777",
              fontSize:"12px", fontWeight:"bold", letterSpacing:"2px",
            }}>⏱ {fmtTime(elapsed)}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}}>
            <div style={{color:"#fff",fontSize:"18px",fontWeight:"bold",letterSpacing:"2px"}}>숫자 야구</div>
            <div style={{textAlign:"right"}}>
              <div style={{color:"#999",fontSize:"9px",letterSpacing:"1px"}}>TRIES LEFT</div>
              <div style={{color:remaining<=3?"#ff4455":"#00ff78",fontSize:"20px",fontWeight:"bold",lineHeight:1}}>
                {gameOver?(won?"✓":"✗"):remaining}
              </div>
            </div>
          </div>
        </div>

        {/* 숫자 메모판 */}
        <div style={{padding:"8px 14px",background:"#080810",borderBottom:"1px solid #1a1a28",flexShrink:0}}>
          <div style={{color:"#aaa",fontSize:"9px",letterSpacing:"2px",marginBottom:"5px"}}>NUMBER MEMO</div>
          <div style={{display:"flex",gap:"4px"}}>
            {[0,1,2,3,4,5,6,7,8,9].map(d => {
              const st = digitState[d];
              return (
                <button key={d} onClick={() => cycleDigit(d)} style={{
                  flex:1,
                  background:st==="in"?"#00ff78":st==="out"?"#111":"#0d0d18",
                  border:`1px solid ${st==="in"?"#00ff78":st==="out"?"#222":"#2a2a3e"}`,
                  borderRadius:"3px", color:st==="in"?"#000":st==="out"?"#555":"#bbb",
                  fontFamily:"'Courier New',monospace", fontWeight:"bold",
                  fontSize:"13px", padding:"4px 0", cursor:"pointer",
                  textDecoration:st==="out"?"line-through":"none",
                  boxShadow:st==="in"?"0 0 7px #00ff7855":"none",
                  transition:"all 0.12s",
                }}>{d}</button>
              );
            })}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px",alignItems:"center"}}>
            <span style={{color:"#999",fontSize:"8px"}}>1탭 <span style={{color:"#00ff78"}}>●포함</span></span>
            <span style={{color:"#999",fontSize:"8px"}}>2탭 <span style={{color:"#666",textDecoration:"line-through"}}>●제외</span></span>
            <span style={{color:"#999",fontSize:"8px"}}>3탭 <span style={{color:"#888"}}>●초기화</span></span>
            {isSolo && (
              <button onClick={useHint} style={{
                marginLeft:"auto",
                background:hintUsed?"#111":"#1a1a00",
                border:`1px solid ${hintUsed?"#2a2a2a":"#ffcc0044"}`,
                borderRadius:"3px", color:hintUsed?"#555":"#ffcc00",
                fontFamily:"'Courier New',monospace", fontSize:"8px",
                padding:"2px 8px", cursor:hintUsed||gameOver?"default":"pointer",
              }}>💡 힌트{hintUsed?" 사용됨":""}</button>
            )}
          </div>
          {hintText && (
            <div style={{marginTop:"5px",padding:"4px 8px",background:"#1a1a00",border:"1px solid #ffcc0033",borderRadius:"3px",color:"#ffcc00",fontSize:"9px"}}>
              💡 {hintText}
            </div>
          )}
        </div>

        {/* Rules */}
        <div style={{padding:"6px 14px",background:"#080810",borderBottom:"1px solid #1a1a28",display:"flex",gap:"12px",flexShrink:0}}>
          {[{icon:"⚾",label:"스트라이크",desc:"자리·숫자 일치"},{icon:"🟡",label:"볼",desc:"숫자만 일치"},{icon:"❌",label:"아웃",desc:"모두 불일치"}].map(r=>(
            <div key={r.label} style={{flex:1}}>
              <div style={{color:"#bbb",fontSize:"9px"}}>{r.icon} {r.label}</div>
              <div style={{color:"#888",fontSize:"9px"}}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* History */}
        <div ref={historyRef} style={{flex:1,overflowY:"auto",padding:"8px 14px",display:"flex",flexDirection:"column",gap:"3px",minHeight:0}}>
          {history.length === 0 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#333",fontSize:"12px",letterSpacing:"3px"}}>
              {placeholder} · · ·
            </div>
          )}
          {history.map((h,i) => (
            <div key={i} className={flashRow===h.try?"row-flash":""} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"5px 9px",borderRadius:"3px",border:"1px solid",
              borderColor:h.won?"#00ff7840":h.out?"#ff445520":"#1e1e2e",
              background:h.won?"#00ff7808":"transparent",
              animation:"fadeSlideIn 0.3s ease",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{color:"#777",fontSize:"9px",width:"16px"}}>#{h.try}</span>
                <span style={{color:"#ddd",fontSize:mode.digits>=4?"14px":"16px",letterSpacing:"4px",fontWeight:"bold"}}>{h.guess}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                {h.won ? (
                  <span style={{color:"#00ff78",fontSize:"10px",letterSpacing:"2px"}}>HOME RUN!</span>
                ) : h.out ? (
                  <span style={{color:"#ff4455",fontSize:"10px",letterSpacing:"2px"}}>OUT</span>
                ) : hardMode ? (
                  <span style={{fontSize:"11px"}}>
                    <span style={{color:"#00ff78"}}>{h.strikes}S</span>{" "}
                    <span style={{color:"#ffcc00"}}>{h.balls}B</span>
                  </span>
                ) : (
                  <>
                    {h.strikes>0&&(
                      <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                        {Array(h.strikes).fill(0).map((_,j)=>(
                          <div key={j} style={{width:"7px",height:"7px",borderRadius:"50%",background:"#00ff78",boxShadow:"0 0 5px #00ff78"}}/>
                        ))}
                        <span style={{color:"#00ff78",fontSize:"9px",marginLeft:"2px"}}>S</span>
                      </div>
                    )}
                    {h.balls>0&&(
                      <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                        {Array(h.balls).fill(0).map((_,j)=>(
                          <div key={j} style={{width:"7px",height:"7px",borderRadius:"50%",background:"#ffcc00",boxShadow:"0 0 5px #ffcc0066"}}/>
                        ))}
                        <span style={{color:"#ffcc00",fontSize:"9px",marginLeft:"2px"}}>B</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input / Result */}
        <div style={{padding:"10px 14px 14px",borderTop:"1px solid #1a1a28",background:"#080810",flexShrink:0}}>
          {!gameOver ? (
            <div style={{display:"flex",gap:"8px"}}>
              <input
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                maxLength={mode.digits}
                placeholder={placeholder}
                className={shake?"shake-input":""}
                style={{
                  flex:1, background:"#0a0a12", border:"1px solid #2a2a3e",
                  borderRadius:"3px", color:"#00ff78", fontSize, fontWeight:"bold",
                  letterSpacing, textAlign:"center", padding:"8px 0",
                  fontFamily:"'Courier New',monospace", caretColor:"#00ff78",
                }}
              />
              <button onClick={handleSubmit} style={{
                background:"#00ff78", border:"none", borderRadius:"3px",
                color:"#000", fontFamily:"'Courier New',monospace", fontWeight:"bold",
                fontSize:"12px", letterSpacing:"2px", padding:"0 16px", cursor:"pointer",
              }}>PITCH</button>
            </div>
          ) : (
            <div style={{textAlign:"center"}}>
              {won ? (
                <div style={{marginBottom:"10px"}}>
                  <div className="win-glow" style={{color:"#00ff78",fontSize:"14px",fontWeight:"bold",letterSpacing:"4px",padding:"7px",border:"1px solid #00ff7840",borderRadius:"3px",marginBottom:"5px"}}>
                    ⚾ HOME RUN!
                  </div>
                  <div style={{color:"#bbb",fontSize:"10px",letterSpacing:"1px"}}>
                    {history.length}번 · {fmtTime(elapsed)} &nbsp;
                    <span style={{color:"#00ff78",letterSpacing:"4px"}}>{secret}</span>
                  </div>
                </div>
              ) : (
                <div style={{marginBottom:"10px"}}>
                  <div style={{color:"#ff4455",fontSize:"13px",fontWeight:"bold",letterSpacing:"3px",marginBottom:"5px"}}>GAME OVER</div>
                  <div style={{color:"#bbb",fontSize:"10px"}}>
                    정답은 <span style={{color:"#fff",letterSpacing:"5px",fontSize:"15px"}}>{secret}</span>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
                <button onClick={onRematch} style={{
                  background:"#00ff78", border:"none", borderRadius:"3px",
                  color:"#000", fontFamily:"'Courier New',monospace", fontWeight:"bold",
                  fontSize:"10px", letterSpacing:"2px", padding:"7px 16px", cursor:"pointer",
                }}>{isSolo ? "NEW GAME" : "다시 대결"}</button>
                <button onClick={onHome} style={{
                  background:"transparent", border:"1px solid #2a2a3e", borderRadius:"3px",
                  color:"#999", fontFamily:"'Courier New',monospace", fontSize:"10px",
                  letterSpacing:"2px", padding:"7px 16px", cursor:"pointer",
                }}>← HOME</button>
              </div>
            </div>
          )}
          <div style={{color:"#777",fontSize:"8px",textAlign:"center",marginTop:"7px",letterSpacing:"1px"}}>
            {mode.digits}자리 · 첫째자리 0 불가 · {mode.tries}번 이내{hardMode&&" · ⚡ HARD"}
          </div>
        </div>
      </div>
    </div>
  );
}
