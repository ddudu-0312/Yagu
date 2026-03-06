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
// 테마 색상
// ────────────────────────────────────────────
const DARK = {
  bg:        "#0a0a0f",
  card:      "#0e0e16",
  cardAlt:   "#080810",
  border:    "#1e1e2e",
  borderSub: "#1a1a28",
  accent:    "#00ff78",
  accentDim: "#00ff7833",
  text:      "#ffffff",
  textSub:   "#aaa",
  textMute:  "#777",
  textFaint: "#555",
  inputBg:   "#0a0a12",
  inputBorder:"#2a2a3e",
  digitBg:   "#0d0d18",
  scanline:  "rgba(0,0,0,0.03)",
  timerColor:"#00ff78",
  shadow:    "rgba(0,255,120,0.05)",
};

const LIGHT = {
  bg:        "#f0f4f0",
  card:      "#ffffff",
  cardAlt:   "#f5f9f5",
  border:    "#c8dcc8",
  borderSub: "#d8e8d8",
  accent:    "#1a8a50",
  accentDim: "#1a8a5033",
  text:      "#111111",
  textSub:   "#444",
  textMute:  "#666",
  textFaint: "#999",
  inputBg:   "#f8fff8",
  inputBorder:"#a8cca8",
  digitBg:   "#eef6ee",
  scanline:  "transparent",
  timerColor:"#1a8a50",
  shadow:    "rgba(0,100,50,0.08)",
};

// ────────────────────────────────────────────
// 메인 앱
// ────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [modeIdx, setModeIdx] = useState(0);
  const [hardMode, setHardMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const [duoSecret, setDuoSecret] = useState("");
  const [duoSetInput, setDuoSetInput] = useState("");
  const [duoSetShake, setDuoSetShake] = useState(false);
  const [duoSetError, setDuoSetError] = useState("");
  const [duoSetShow, setDuoSetShow] = useState(false);

  const T = darkMode ? DARK : LIGHT;
  const mode = MODES[modeIdx];

  const goHome = () => {
    setScreen("home");
    setDuoSetInput("");
    setDuoSecret("");
    setDuoSetError("");
    setDuoSetShow(false);
  };

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

  if (screen === "home") return (
    <HomeScreen T={T} darkMode={darkMode} setDarkMode={setDarkMode}
      onSolo={() => setScreen("solo")} onDuo={() => setScreen("duo-set")}
      modeIdx={modeIdx} setModeIdx={setModeIdx} hardMode={hardMode} setHardMode={setHardMode} />
  );

  if (screen === "duo-set") return (
    <SetSecretScreen T={T} mode={mode}
      input={duoSetInput} setInput={setDuoSetInput}
      shake={duoSetShake} show={duoSetShow} setShow={setDuoSetShow}
      error={duoSetError} onConfirm={confirmDuoSecret} onBack={goHome} />
  );

  return (
    <GameScreen
      key={screen + modeIdx + hardMode + duoSecret}
      T={T} mode={mode} modeIdx={modeIdx} hardMode={hardMode} darkMode={darkMode}
      isSolo={screen === "solo"} duoSecret={duoSecret}
      onHome={goHome} onRematch={() => setScreen(screen === "solo" ? "solo" : "duo-set")}
    />
  );
}

// ────────────────────────────────────────────
// 홈 화면
// ────────────────────────────────────────────
function HomeScreen({ T, darkMode, setDarkMode, onSolo, onDuo, modeIdx, setModeIdx, hardMode, setHardMode }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:T.bg,
      overflowY:"auto", overflowX:"hidden",
      fontFamily:"'Courier New',Courier,monospace",
      transition:"background 0.3s",
      paddingTop:"env(safe-area-inset-top)",
      paddingBottom:"env(safe-area-inset-bottom)",
      paddingLeft:"env(safe-area-inset-left)",
      paddingRight:"env(safe-area-inset-right)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      boxSizing:"border-box",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        button:active{transform:scale(0.96)}
        input:focus{outline:none}
      `}</style>
      <div style={{width:"100%",maxWidth:"380px",padding:"16px 20px 32px",margin:"auto"}}>

        {/* 헤더 */}
        <div style={{textAlign:"center",marginBottom:"14px",position:"relative"}}>
          {/* 다크/라이트 토글 */}
          <button onClick={() => setDarkMode(d => !d)} style={{
            position:"absolute", right:0, top:0,
            background:darkMode?"#1a1a2a":"#e0ede0",
            border:`1px solid ${T.border}`,
            borderRadius:"20px", padding:"4px 10px",
            cursor:"pointer", fontSize:"14px",
            transition:"all 0.3s",
          }}>{darkMode ? "☀️" : "🌙"}</button>

          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginBottom:"4px"}}>
            <div style={{width:"7px",height:"7px",borderRadius:"50%",background:T.accent,boxShadow:`0 0 10px ${T.accent}`,animation:"pulse 2s infinite"}}/>
            <span style={{color:T.accent,fontSize:"10px",letterSpacing:"4px"}}>BASEBALL.EXE</span>
          </div>
          <div style={{color:T.text,fontSize:"24px",fontWeight:"bold",letterSpacing:"4px"}}>숫자 야구</div>
          <div style={{color:T.textMute,fontSize:"10px",marginTop:"4px",letterSpacing:"2px"}}>NUMBER BASEBALL GAME</div>
        </div>

        {/* 설정 */}
        <div style={{marginBottom:"12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:"6px",padding:"12px",transition:"background 0.3s"}}>
          <div style={{color:T.textMute,fontSize:"9px",letterSpacing:"3px",marginBottom:"8px"}}>SETTINGS</div>
          <div style={{display:"flex",gap:"6px",marginBottom:"8px"}}>
            {MODES.map((m,i) => (
              <button key={m.label} onClick={() => setModeIdx(i)} style={{
                flex:1,
                background: modeIdx===i ? T.accent : "transparent",
                border:`1px solid ${modeIdx===i ? T.accent : T.inputBorder}`,
                borderRadius:"3px",
                color: modeIdx===i ? (darkMode?"#000":"#fff") : T.textSub,
                fontFamily:"'Courier New',monospace", fontWeight:"bold",
                fontSize:"10px", padding:"6px 0", cursor:"pointer", letterSpacing:"1px",
                transition:"all 0.2s",
              }}>{m.label}</button>
            ))}
          </div>
          <button onClick={() => setHardMode(h => !h)} style={{
            width:"100%",
            background: hardMode ? (darkMode?"#2a0a0a":"#ffe0e0") : "transparent",
            border:`1px solid ${hardMode?"#ff4455":T.inputBorder}`,
            borderRadius:"3px", color:hardMode?"#ff4455":T.textSub,
            fontFamily:"'Courier New',monospace", fontSize:"10px",
            padding:"6px 0", cursor:"pointer", letterSpacing:"2px",
            transition:"all 0.2s",
          }}>⚡ HARD MODE {hardMode?"ON":"OFF"}</button>
        </div>

        {/* 플레이 버튼 */}
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <button onClick={onSolo} style={{
            background:T.accent, border:"none", borderRadius:"4px",
            color: darkMode?"#000":"#fff",
            fontFamily:"'Courier New',monospace", fontWeight:"bold",
            fontSize:"13px", letterSpacing:"3px", padding:"13px",
            cursor:"pointer",
          }}>👤 1인용 플레이</button>
          <button onClick={onDuo} style={{
            background:"transparent", border:`1px solid ${T.accentDim}`,
            borderRadius:"4px", color:T.accent,
            fontFamily:"'Courier New',monospace", fontWeight:"bold",
            fontSize:"13px", letterSpacing:"3px", padding:"13px", cursor:"pointer",
          }}>👥 2인용 플레이</button>
        </div>

        {/* 게임 방법 */}
        <div style={{marginTop:"12px",background:T.card,border:`1px solid ${T.border}`,borderRadius:"6px",padding:"12px",transition:"background 0.3s"}}>
          <div style={{color:T.textMute,fontSize:"9px",letterSpacing:"3px",marginBottom:"8px"}}>HOW TO PLAY</div>
          <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
            {[
              {icon:"1️⃣",title:"숫자 생성",desc:"컴퓨터(또는 출제자)가 서로 다른 숫자로 된 N자리 수를 만들어요. 첫째 자리는 0 불가."},
              {icon:"2️⃣",title:"숫자 추리",desc:"N자리 숫자를 입력하고 PITCH! 결과를 보고 정답을 추리하세요."},
              {icon:"⚾",title:"스트라이크",desc:"숫자와 자리가 모두 맞으면 스트라이크! 전부 맞으면 홈런(정답)!"},
              {icon:"🟡",title:"볼",desc:"숫자는 맞지만 자리가 다르면 볼."},
              {icon:"❌",title:"아웃",desc:"숫자가 하나도 없으면 아웃."},
            ].map(r => (
              <div key={r.title} style={{display:"flex",gap:"8px",alignItems:"flex-start"}}>
                <span style={{fontSize:"13px",flexShrink:0}}>{r.icon}</span>
                <div>
                  <div style={{color:T.text,fontSize:"10px",fontWeight:"bold",marginBottom:"1px"}}>{r.title}</div>
                  <div style={{color:T.textMute,fontSize:"9px",lineHeight:"1.5"}}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:"10px",padding:"8px",background:T.cardAlt,border:`1px solid ${T.borderSub}`,borderRadius:"4px"}}>
            <div style={{color:T.textSub,fontSize:"9px",marginBottom:"4px"}}>예시 — 정답이 <span style={{color:T.accent}}>472</span> 일 때</div>
            {[
              {guess:"123",result:"0S 1B",desc:"2가 있지만 자리 다름"},
              {guess:"416",result:"1S 0B",desc:"4가 첫째 자리 정확"},
              {guess:"472",result:"3S 0B",desc:"홈런! 정답!"},
            ].map(e => (
              <div key={e.guess} style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"3px"}}>
                <span style={{color:T.text,fontSize:"11px",letterSpacing:"3px",fontWeight:"bold",width:"34px"}}>{e.guess}</span>
                <span style={{color:T.textFaint,fontSize:"9px"}}>→</span>
                <span style={{color:T.accent,fontSize:"10px",width:"52px"}}>{e.result}</span>
                <span style={{color:T.textMute,fontSize:"9px"}}>{e.desc}</span>
              </div>
            ))}
          </div>

          <div style={{marginTop:"8px",padding:"7px",background:darkMode?"#0a0a00":"#fffbe0",border:`1px solid ${darkMode?"#ffcc0022":"#e8d080"}`,borderRadius:"4px"}}>
            <div style={{color:"#b8960a",fontSize:"9px",marginBottom:"2px"}}>👥 2인용 방법</div>
            <div style={{color:T.textMute,fontSize:"9px",lineHeight:"1.6"}}>
              출제자가 숫자를 입력(가려진 상태) → 폰을 넘겨서 상대방이 추리 시작!
            </div>
          </div>
        </div>

        <div style={{color:T.textFaint,fontSize:"9px",textAlign:"center",marginTop:"10px",letterSpacing:"2px"}}>
          {MODES[modeIdx].digits}자리 · 첫째자리 0 불가 · {MODES[modeIdx].tries}번 이내
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// 2인용: 숫자 설정 화면
// ────────────────────────────────────────────
function SetSecretScreen({ T, mode, input, setInput, shake, show, setShow, error, onConfirm, onBack }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, mode.digits);
    setInput(val);
  };
  const handleKey = (e) => { if (e.key === "Enter") onConfirm(); };

  return (
    <div style={{
      position:"fixed", inset:0, background:T.bg,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Courier New',Courier,monospace", transition:"background 0.3s",
      paddingTop:"env(safe-area-inset-top)",
      paddingBottom:"env(safe-area-inset-bottom)",
      paddingLeft:"env(safe-area-inset-left)",
      paddingRight:"env(safe-area-inset-right)",
    }}>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        .shake-it{animation:shake 0.4s ease}
        input:focus{outline:none}
        button:active{transform:scale(0.96)}
      `}</style>
      <div style={{width:"100%",maxWidth:"380px",padding:"0 24px"}}>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{color:"#c8960a",fontSize:"11px",letterSpacing:"4px",marginBottom:"6px"}}>👥 2인용 모드</div>
          <div style={{color:T.text,fontSize:"20px",fontWeight:"bold",letterSpacing:"2px"}}>출제자가 숫자 설정</div>
          <div style={{color:T.textMute,fontSize:"11px",marginTop:"4px"}}>상대방이 보지 못하게 입력하세요</div>
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:"6px",padding:"16px",marginBottom:"12px"}}>
          <div style={{color:T.textMute,fontSize:"9px",letterSpacing:"2px",marginBottom:"10px"}}>
            {mode.digits}자리 숫자 입력 (서로 다른 숫자, 첫째 자리 0 불가)
          </div>
          <div style={{position:"relative"}}>
            {/* 실제 입력 input (항상 존재, show 아닐 때는 투명하게 위에 덮음) */}
            <input
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              maxLength={mode.digits}
              placeholder={show ? Array(mode.digits).fill("_").join(" ") : ""}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              className={shake?"shake-it":""}
              style={{
                width:"100%", boxSizing:"border-box",
                background: show ? T.inputBg : "transparent",
                border:`1px solid ${error?"#ff4455":T.inputBorder}`,
                borderRadius:"3px",
                color: show ? "#c8960a" : "transparent",
                caretColor: show ? "#c8960a" : "transparent",
                fontSize:"26px", fontWeight:"bold",
                letterSpacing:"12px", textAlign:"center",
                padding:"10px 40px 10px 12px",
                fontFamily:"'Courier New',monospace",
                position: show ? "relative" : "absolute",
                inset: show ? "auto" : 0,
                zIndex: show ? 1 : 2,
              }}
            />
            {/* 숨김 표시용 */}
            {!show && (
              <div style={{
                background:T.inputBg, border:`1px solid ${error?"#ff4455":T.inputBorder}`,
                borderRadius:"3px", color:"#c8960a",
                fontSize:"26px", fontWeight:"bold",
                letterSpacing:"12px", textAlign:"center",
                padding:"10px 40px 10px 12px",
                fontFamily:"'Courier New',monospace",
                minHeight:"54px", display:"flex", alignItems:"center", justifyContent:"center",
                userSelect:"none",
              }}>
                {input.length > 0 ? "●".repeat(input.length) : <span style={{color:T.textFaint,fontSize:"16px"}}>{Array(mode.digits).fill("_").join(" ")}</span>}
              </div>
            )}
            <button onClick={() => setShow(s=>!s)} style={{
              position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)",
              background:"transparent", border:"none", color:T.textMute,
              fontSize:"16px", cursor:"pointer", padding:0,
            }}>{show?"🙈":"👁️"}</button>
          </div>
          {error && <div style={{color:"#ff4455",fontSize:"10px",marginTop:"5px"}}>⚠ {error}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <button onClick={onConfirm} style={{
            background:"#c8960a", border:"none", borderRadius:"4px",
            color:"#fff", fontFamily:"'Courier New',monospace", fontWeight:"bold",
            fontSize:"12px", letterSpacing:"3px", padding:"13px", cursor:"pointer",
          }}>확인 → 게임 시작</button>
          <button onClick={onBack} style={{
            background:"transparent", border:`1px solid ${T.inputBorder}`,
            borderRadius:"4px", color:T.textSub,
            fontFamily:"'Courier New',monospace", fontSize:"11px",
            letterSpacing:"2px", padding:"10px", cursor:"pointer",
          }}>← 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// 게임 화면
// ────────────────────────────────────────────
function GameScreen({ T, mode, hardMode, darkMode, isSolo, duoSecret, onHome, onRematch }) {
  const secretRef = useRef(isSolo ? generateSecret(mode.digits) : duoSecret);
  const secret = secretRef.current;

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

  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerOn && !gameOver) {
      timerRef.current = setInterval(() => setElapsed(e => e+1), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerOn, gameOver]);

  useEffect(() => { inputRef.current?.focus(); }, [gameOver]);
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g,"").slice(0, mode.digits);
    setInput(val);
    if (!timerOn && val.length > 0) setTimerOn(true);
  };

  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2000);
  };

  const triggerShake = () => { setShake(true); setTimeout(()=>setShake(false),400); };

  const handleSubmit = () => {
    if (gameOver) return;
    if (input.length !== mode.digits) { triggerShake(); showToast(`${mode.digits}자리를 입력하세요`); return; }
    const digits = input.split("");
    if (new Set(digits).size !== mode.digits) { triggerShake(); showToast("중복된 숫자가 있어요!"); return; }
    if (digits[0]==="0") { triggerShake(); showToast("첫째 자리는 0이 될 수 없어요"); return; }
    const {strikes,balls} = calcResult(secret,input);
    const tryNum = history.length+1;
    const out = strikes===0&&balls===0;
    const won = strikes===mode.digits;
    setHistory(prev=>[...prev,{guess:input,strikes,balls,out,won,try:tryNum}]);
    setFlashRow(tryNum);
    setTimeout(()=>setFlashRow(null),600);
    setInput("");
    if (won||tryNum>=mode.tries) { setGameOver(true); setTimerOn(false); }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const useHint = () => {
    if (hintUsed||gameOver) return;
    setHintUsed(true);
    const first = parseInt(secret[0]);
    setHintText(first<=4?"첫째 자리는 1~4 사이":"첫째 자리는 5~9 사이");
  };

  const cycleDigit = (d) => {
    setDigitState(prev=>{
      const cur=prev[d];
      return {...prev,[d]:cur===null?"in":cur==="in"?"out":null};
    });
  };

  const won = history.some(h=>h.won);
  const remaining = mode.tries-history.length;
  const placeholder = Array(mode.digits).fill("_").join(" ");
  const ls = mode.digits>=4?"6px":"12px";
  const fs = mode.digits>=4?"18px":"22px";

  return (
    <div style={{
      position:"fixed", inset:0, background:T.bg,
      overflowY:"auto", overflowX:"hidden",
      fontFamily:"'Courier New',Courier,monospace",
      transition:"background 0.3s",
      display:"flex", justifyContent:"center",
      boxSizing:"border-box",
      paddingTop:"env(safe-area-inset-top)",
      paddingBottom:"env(safe-area-inset-bottom)",
    }}>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        @keyframes flashGreen{0%{background:rgba(0,200,100,0.18)}100%{background:transparent}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 8px #00aa5588}50%{box-shadow:0 0 20px #00cc66cc}}
        .row-flash{animation:flashGreen 0.6s ease-out}
        .shake-input{animation:shake 0.4s ease}
        .win-glow{animation:pulseGlow 1.2s ease-in-out infinite}
        input:focus{outline:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#88888855;border-radius:2px}
        button:active{transform:scale(0.96)}
      `}</style>

      <div style={{
        width:"100%", maxWidth:"440px",
        background:T.card,
        boxShadow:`0 0 60px ${T.shadow}`,
        transition:"background 0.3s",
        paddingLeft:"env(safe-area-inset-left)",
        paddingRight:"env(safe-area-inset-right)",
        boxSizing:"border-box",
      }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position:"fixed", bottom:"90px", left:"50%",
            transform:"translateX(-50%)",
            background:"#ff4455", color:"#fff",
            fontFamily:"'Courier New',monospace",
            fontSize:"12px", fontWeight:"bold",
            letterSpacing:"1px",
            padding:"10px 20px", borderRadius:"20px",
            boxShadow:"0 4px 20px rgba(255,68,85,0.4)",
            zIndex:100,
            animation:"toastIn 0.25s ease",
            whiteSpace:"nowrap",
          }}>⚠ {toast}</div>
        )}

        {/* Header */}
        <div style={{
          padding:"10px 14px 8px", borderBottom:`1px solid ${T.borderSub}`,
          background:T.card, flexShrink:0, transition:"background 0.3s",
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              <button onClick={onHome} style={{
                background:"transparent", border:`1px solid ${T.inputBorder}`,
                borderRadius:"3px", color:T.textSub,
                fontFamily:"'Courier New',monospace", fontSize:"9px",
                padding:"2px 8px", cursor:"pointer",
              }}>← HOME</button>
              <div style={{
                background: isSolo?(darkMode?"#001a0a":"#e0f5e0"):(darkMode?"#1a1000":"#fff8e0"),
                border:`1px solid ${isSolo?T.accentDim:"#c8960a44"}`,
                borderRadius:"3px", padding:"2px 8px",
                color: isSolo?T.accent:"#b8860a",
                fontSize:"9px",
              }}>{isSolo?"👤 1인용":"👥 2인용"}</div>
              {hardMode&&<div style={{background:darkMode?"#2a0a0a":"#ffe0e0",border:"1px solid #ff445533",borderRadius:"3px",padding:"2px 8px",color:"#ff4455",fontSize:"9px"}}>⚡HARD</div>}
            </div>
            <div style={{
              background:T.cardAlt, border:`1px solid ${T.border}`,
              borderRadius:"3px", padding:"3px 10px",
              color:elapsed>0&&!gameOver?T.accent:T.textFaint,
              fontSize:"12px", fontWeight:"bold", letterSpacing:"2px",
              transition:"color 0.3s",
            }}>⏱ {fmtTime(elapsed)}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}}>
            <div style={{color:T.text,fontSize:"18px",fontWeight:"bold",letterSpacing:"2px"}}>숫자 야구</div>
            <div style={{textAlign:"right"}}>
              <div style={{color:T.textMute,fontSize:"9px"}}>TRIES LEFT</div>
              <div style={{color:remaining<=3?"#ff4455":T.accent,fontSize:"20px",fontWeight:"bold",lineHeight:1}}>
                {gameOver?(won?"✓":"✗"):remaining}
              </div>
            </div>
          </div>
        </div>

        {/* 숫자 메모판 */}
        <div style={{padding:"8px 14px",background:T.cardAlt,borderBottom:`1px solid ${T.borderSub}`,flexShrink:0}}>
          <div style={{color:T.textMute,fontSize:"9px",letterSpacing:"2px",marginBottom:"5px"}}>NUMBER MEMO</div>
          <div style={{display:"flex",gap:"4px"}}>
            {[0,1,2,3,4,5,6,7,8,9].map(d=>{
              const st=digitState[d];
              return (
                <button key={d} onClick={()=>cycleDigit(d)} style={{
                  flex:1,
                  background:st==="in"?T.accent:st==="out"?T.borderSub:T.digitBg,
                  border:`1px solid ${st==="in"?T.accent:st==="out"?T.border:T.inputBorder}`,
                  borderRadius:"3px",
                  color:st==="in"?(darkMode?"#000":"#fff"):st==="out"?T.textFaint:T.textSub,
                  fontFamily:"'Courier New',monospace", fontWeight:"bold",
                  fontSize:"13px", padding:"4px 0", cursor:"pointer",
                  textDecoration:st==="out"?"line-through":"none",
                  transition:"all 0.12s",
                }}>{d}</button>
              );
            })}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px",alignItems:"center"}}>
            <span style={{color:T.textFaint,fontSize:"8px"}}>1탭 <span style={{color:T.accent}}>●포함</span></span>
            <span style={{color:T.textFaint,fontSize:"8px"}}>2탭 <span style={{color:T.textFaint,textDecoration:"line-through"}}>●제외</span></span>
            <span style={{color:T.textFaint,fontSize:"8px"}}>3탭 <span style={{color:T.textMute}}>●초기화</span></span>
            {isSolo&&(
              <button onClick={useHint} style={{
                marginLeft:"auto",
                background:hintUsed?T.cardAlt:(darkMode?"#1a1a00":"#fffbe0"),
                border:`1px solid ${hintUsed?T.border:"#c8960a44"}`,
                borderRadius:"3px", color:hintUsed?T.textFaint:"#b8860a",
                fontFamily:"'Courier New',monospace", fontSize:"8px",
                padding:"2px 8px", cursor:hintUsed||gameOver?"default":"pointer",
              }}>💡 힌트{hintUsed?" 사용됨":""}</button>
            )}
          </div>
          {hintText&&(
            <div style={{marginTop:"4px",padding:"4px 8px",background:darkMode?"#1a1a00":"#fffbe0",border:"1px solid #c8960a33",borderRadius:"3px",color:"#b8860a",fontSize:"9px"}}>
              💡 {hintText}
            </div>
          )}
        </div>

        {/* Rules */}
        <div style={{padding:"6px 14px",background:T.cardAlt,borderBottom:`1px solid ${T.borderSub}`,display:"flex",gap:"12px",flexShrink:0}}>
          {[{icon:"⚾",label:"스트라이크",desc:"자리·숫자 일치"},{icon:"🟡",label:"볼",desc:"숫자만 일치"},{icon:"❌",label:"아웃",desc:"모두 불일치"}].map(r=>(
            <div key={r.label} style={{flex:1}}>
              <div style={{color:T.textSub,fontSize:"9px"}}>{r.icon} {r.label}</div>
              <div style={{color:T.textMute,fontSize:"9px"}}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* History */}
        <div ref={historyRef} style={{padding:"8px 14px",display:"flex",flexDirection:"column",gap:"3px",minHeight:"80px"}}>
          {history.length===0&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 0",color:T.textFaint,fontSize:"12px",letterSpacing:"3px"}}>
              {placeholder} · · ·
            </div>
          )}
          {history.map((h,i)=>(
            <div key={i} className={flashRow===h.try?"row-flash":""} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"5px 9px",borderRadius:"3px",border:"1px solid",
              borderColor:h.won?T.accentDim:h.out?"#ff445520":T.border,
              background:h.won?(darkMode?"#00ff7808":"#e0f5e8"):"transparent",
              animation:"fadeSlideIn 0.3s ease",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{color:T.textMute,fontSize:"9px",width:"16px"}}>#{h.try}</span>
                <span style={{color:T.text,fontSize:mode.digits>=4?"14px":"16px",letterSpacing:"4px",fontWeight:"bold"}}>{h.guess}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                {h.won?(
                  <span style={{color:T.accent,fontSize:"10px",letterSpacing:"2px"}}>HOME RUN!</span>
                ):h.out?(
                  <span style={{color:"#ff4455",fontSize:"10px",letterSpacing:"2px"}}>OUT</span>
                ):hardMode?(
                  <span style={{fontSize:"11px"}}>
                    <span style={{color:T.accent}}>{h.strikes}S</span>{" "}
                    <span style={{color:"#c8960a"}}>{h.balls}B</span>
                  </span>
                ):(
                  <>
                    {h.strikes>0&&(
                      <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                        {Array(h.strikes).fill(0).map((_,j)=>(
                          <div key={j} style={{width:"7px",height:"7px",borderRadius:"50%",background:T.accent}}/>
                        ))}
                        <span style={{color:T.accent,fontSize:"9px",marginLeft:"2px"}}>S</span>
                      </div>
                    )}
                    {h.balls>0&&(
                      <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                        {Array(h.balls).fill(0).map((_,j)=>(
                          <div key={j} style={{width:"7px",height:"7px",borderRadius:"50%",background:"#c8960a"}}/>
                        ))}
                        <span style={{color:"#c8960a",fontSize:"9px",marginLeft:"2px"}}>B</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input / Result */}
        <div style={{padding:"10px 14px 14px",borderTop:`1px solid ${T.borderSub}`,background:T.cardAlt,flexShrink:0}}>
          {!gameOver?(
            <div style={{display:"flex",gap:"8px"}}>
              <input
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                maxLength={mode.digits}
                placeholder={placeholder}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className={shake?"shake-input":""}
                style={{
                  flex:1, background:T.inputBg, border:`1px solid ${T.inputBorder}`,
                  borderRadius:"3px", color:T.accent, fontSize:fs, fontWeight:"bold",
                  letterSpacing:ls, textAlign:"center", padding:"8px 0",
                  fontFamily:"'Courier New',monospace", caretColor:T.accent,
                  transition:"background 0.3s, border-color 0.3s",
                }}
              />
              <button onClick={handleSubmit} style={{
                background:T.accent, border:"none", borderRadius:"3px",
                color:darkMode?"#000":"#fff",
                fontFamily:"'Courier New',monospace", fontWeight:"bold",
                fontSize:"12px", letterSpacing:"2px", padding:"0 16px", cursor:"pointer",
              }}>PITCH</button>
            </div>
          ):(
            <div style={{textAlign:"center"}}>
              {won?(
                <div style={{marginBottom:"10px"}}>
                  <div className="win-glow" style={{
                    color:T.accent,fontSize:"14px",fontWeight:"bold",letterSpacing:"4px",
                    padding:"7px",border:`1px solid ${T.accentDim}`,borderRadius:"3px",marginBottom:"5px",
                  }}>⚾ HOME RUN!</div>
                  <div style={{color:T.textSub,fontSize:"10px"}}>
                    {history.length}번 · {fmtTime(elapsed)} &nbsp;
                    <span style={{color:T.accent,letterSpacing:"4px"}}>{secret}</span>
                  </div>
                </div>
              ):(
                <div style={{marginBottom:"10px"}}>
                  <div style={{color:"#ff4455",fontSize:"13px",fontWeight:"bold",letterSpacing:"3px",marginBottom:"5px"}}>GAME OVER</div>
                  <div style={{color:T.textSub,fontSize:"10px"}}>
                    정답은 <span style={{color:T.text,letterSpacing:"5px",fontSize:"15px"}}>{secret}</span>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
                <button onClick={onRematch} style={{
                  background:T.accent, border:"none", borderRadius:"3px",
                  color:darkMode?"#000":"#fff",
                  fontFamily:"'Courier New',monospace", fontWeight:"bold",
                  fontSize:"10px", letterSpacing:"2px", padding:"7px 16px", cursor:"pointer",
                }}>{isSolo?"NEW GAME":"다시 대결"}</button>
                <button onClick={onHome} style={{
                  background:"transparent", border:`1px solid ${T.inputBorder}`,
                  borderRadius:"3px", color:T.textSub,
                  fontFamily:"'Courier New',monospace", fontSize:"10px",
                  letterSpacing:"2px", padding:"7px 16px", cursor:"pointer",
                }}>← HOME</button>
              </div>
            </div>
          )}
          <div style={{color:T.textFaint,fontSize:"8px",textAlign:"center",marginTop:"7px",letterSpacing:"1px"}}>
            {mode.digits}자리 · 첫째자리 0 불가 · {mode.tries}번 이내{hardMode&&" · ⚡ HARD"}
          </div>
        </div>
      </div>
    </div>
  );
}

// darkMode 참조용 전역 (GameScreen에서 접근)
App.darkMode = true;
