import { useState, useEffect, useRef, useCallback } from "react";
import { scriptData, characterEmoji } from "./scriptData";
import "./App.css";

// ── helpers ──────────────────────────────────────────────────────────────────
function getCharacterColor(character) {
  const colors = {
    "SHREK": "#4a7c59",
    "DONKEY": "#8b6914",
    "FIONA": "#c4547a",
    "YOUNG FIONA": "#e8a0b8",
    "LORD FARQUAAD": "#7b3f9e",
    "PINOCCHIO": "#c4873a",
    "GINGY": "#d4864a",
    "BIG BAD WOLF": "#5a6a7a",
    "MAMA BEAR": "#8b5a2b",
    "BABY BEAR": "#a07040",
    "WICKED WITCH": "#3d6b3d",
    "STORYTELLER 1": "#4a6a8a",
    "STORYTELLER 2": "#4a6a8a",
    "STORYTELLER 3": "#4a6a8a",
    "CAPTAIN OF THE GUARDS": "#6a3a3a",
    "DRAGON": "#9b2020",
    "DEFAULT": "#5a5a7a",
  };
  return colors[character] || colors.DEFAULT;
}

function speakLine(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92;
  utt.pitch = 1;
  utt.volume = 1;
  utt.onend = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
}

// ── components ────────────────────────────────────────────────────────────────
function RolePicker({ onSelect }) {
  const [search, setSearch] = useState("");
  const filtered = scriptData.characters.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // Count lines per character
  const lineCounts = {};
  scriptData.scenes.forEach(scene => {
    scene.lines.forEach(line => {
      if (line.character) {
        lineCounts[line.character] = (lineCounts[line.character] || 0) + 1;
      }
    });
  });

  return (
    <div className="role-picker">
      <div className="role-picker__header">
        <div className="title-badge">🎭</div>
        <h1 className="app-title">Shrek Rehearsal Studio</h1>
        <p className="app-subtitle">Shrek the Musical KIDS</p>
        <p className="app-instruction">Choose your role to begin rehearsing!</p>
      </div>

      <div className="search-wrap">
        <input
          className="search-input"
          placeholder="Search characters..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="character-grid">
        {filtered.map(char => (
          <button
            key={char}
            className="character-card"
            style={{ "--char-color": getCharacterColor(char) }}
            onClick={() => onSelect(char)}
          >
            <span className="char-emoji">{characterEmoji[char] || "🎭"}</span>
            <span className="char-name">{char}</span>
            <span className="char-lines">{lineCounts[char] || 0} lines</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScenePicker({ myRole, onSelectScene, onBack }) {
  const scenesWithRole = scriptData.scenes.map(scene => {
    const myLines = scene.lines.filter(l => l.character === myRole).length;
    return { ...scene, myLines };
  });

  return (
    <div className="scene-picker">
      <button className="back-btn" onClick={onBack}>← Change Role</button>

      <div className="role-header">
        <span className="role-emoji">{characterEmoji[myRole] || "🎭"}</span>
        <div>
          <h2 className="role-name">{myRole}</h2>
          <p className="role-sub">Select a scene to rehearse</p>
        </div>
      </div>

      <div className="scene-list">
        {scenesWithRole.map(scene => (
          <button
            key={scene.number}
            className={`scene-card ${scene.myLines > 0 ? "scene-card--active" : "scene-card--nolines"}`}
            onClick={() => onSelectScene(scene.number)}
          >
            <div className="scene-card__left">
              <span className="scene-num">Scene {scene.number}</span>
              <span className="scene-title">{scene.title}</span>
              <span className="scene-desc">{scene.description}</span>
            </div>
            <div className="scene-card__right">
              {scene.myLines > 0 ? (
                <span className="my-lines-badge">{scene.myLines} of your lines</span>
              ) : (
                <span className="no-lines-badge">You don't appear</span>
              )}
            </div>
          </button>
        ))}

        <button
          className="scene-card scene-card--full"
          onClick={() => onSelectScene("all")}
        >
          <div className="scene-card__left">
            <span className="scene-num">🎬</span>
            <span className="scene-title">Full Show – All Scenes</span>
            <span className="scene-desc">Run the complete script from start to finish</span>
          </div>
          <div className="scene-card__right">
            <span className="my-lines-badge">
              {scenesWithRole.reduce((a, s) => a + s.myLines, 0)} total lines
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

function RehearsalPlayer({ myRole, sceneNumber, onBack }) {
  // Build the flat line list for selected scene(s)
  const allLines = (() => {
    const scenes = sceneNumber === "all"
      ? scriptData.scenes
      : scriptData.scenes.filter(s => s.number === sceneNumber);
    return scenes.flatMap(scene =>
      scene.lines.map(line => ({ ...line, sceneName: scene.title }))
    );
  })();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | speaking | waiting | myTurn | done
  const [isRunning, setIsRunning] = useState(false);
  const [pauseSeconds, setPauseSeconds] = useState(5);
  const [countdown, setCountdown] = useState(null);
  const [showAllLines, setShowAllLines] = useState(false);
  const [hideMyLines, setHideMyLines] = useState(false);
  const [lineRevealed, setLineRevealed] = useState(false);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const runningRef = useRef(false);
  const lineRefs = useRef([]);

  const currentLine = allLines[currentIdx];

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  // Auto-scroll to current line
  useEffect(() => {
    if (lineRefs.current[currentIdx]) {
      lineRefs.current[currentIdx].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    setLineRevealed(false);
  }, [currentIdx]);

  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel();
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
    runningRef.current = false;
    setIsRunning(false);
    setStatus("idle");
    setCountdown(null);
  }, []);

  const advanceLine = useCallback((idx) => {
    if (idx >= allLines.length) {
      setStatus("done");
      setIsRunning(false);
      runningRef.current = false;
      setCountdown(null);
      return;
    }
    if (!runningRef.current) return;

    setCurrentIdx(idx);
    const line = allLines[idx];

    if (!line) return;

    // Stage direction → brief pause then advance
    if (line.type === "stage") {
      setStatus("stage");
      timerRef.current = setTimeout(() => {
        if (runningRef.current) advanceLine(idx + 1);
      }, 1500);
      return;
    }

    // My line → pause for the configured time
    if (line.character === myRole) {
      setStatus("myTurn");
      let secs = pauseSeconds;
      setCountdown(secs);
      countdownRef.current = setInterval(() => {
        secs--;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(countdownRef.current);
          if (runningRef.current) advanceLine(idx + 1);
        }
      }, 1000);
      return;
    }

    // Someone else's line → speak it
    setStatus("speaking");
    speakLine(line.text, () => {
      if (runningRef.current) advanceLine(idx + 1);
    });
  }, [allLines, myRole, pauseSeconds]);

  const handlePlay = () => {
    if (status === "done") {
      setCurrentIdx(0);
    }
    runningRef.current = true;
    setIsRunning(true);
    advanceLine(currentIdx);
  };

  const handlePause = () => {
    window.speechSynthesis?.cancel();
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
    runningRef.current = false;
    setIsRunning(false);
    setStatus("idle");
    setCountdown(null);
  };

  const handleNext = () => {
    stopAll();
    const next = Math.min(currentIdx + 1, allLines.length - 1);
    setCurrentIdx(next);
  };

  const handlePrev = () => {
    stopAll();
    const prev = Math.max(currentIdx - 1, 0);
    setCurrentIdx(prev);
  };

  const handleJumpTo = (idx) => {
    stopAll();
    setCurrentIdx(idx);
  };

  const progress = allLines.length > 0 ? ((currentIdx + 1) / allLines.length) * 100 : 0;

  // Build scenes list for sidebar
  const sceneGroups = (() => {
    if (sceneNumber === "all") {
      let offset = 0;
      return scriptData.scenes.map(scene => {
        const start = offset;
        offset += scene.lines.length;
        return { ...scene, startIdx: start };
      });
    }
    return [];
  })();

  const sceneName = sceneNumber === "all"
    ? "Full Show"
    : scriptData.scenes.find(s => s.number === sceneNumber)?.title || "";

  return (
    <div className="rehearsal">
      {/* Header */}
      <div className="rehearsal__header">
        <button className="back-btn" onClick={() => { stopAll(); onBack(); }}>← Scenes</button>
        <div className="rehearsal__info">
          <span className="role-emoji">{characterEmoji[myRole] || "🎭"}</span>
          <span className="playing-as">Playing as <strong>{myRole}</strong> · {sceneName}</span>
        </div>
        <div className="pause-control">
          <label>My pause: </label>
          <input
            type="range"
            min={3}
            max={20}
            value={pauseSeconds}
            onChange={e => setPauseSeconds(Number(e.target.value))}
          />
          <span>{pauseSeconds}s</span>
        </div>
        <button
          className={`hide-toggle-btn ${hideMyLines ? "hide-toggle-btn--on" : ""}`}
          onClick={() => setHideMyLines(v => !v)}
          title="Hide my lines during rehearsal"
        >
          {hideMyLines ? "🙈 Lines Hidden" : "👁 Lines Visible"}
        </button>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
        <span className="progress-label">{currentIdx + 1} / {allLines.length}</span>
      </div>

      <div className="rehearsal__body">
        {/* Scene jump sidebar (full show only) */}
        {sceneNumber === "all" && (
          <div className="scene-sidebar">
            <p className="sidebar-title">Jump to Scene</p>
            {sceneGroups.map(scene => (
              <button
                key={scene.number}
                className={`sidebar-scene-btn ${currentIdx >= scene.startIdx && currentIdx < scene.startIdx + scene.lines.length ? "active" : ""}`}
                onClick={() => handleJumpTo(scene.startIdx)}
              >
                <span className="ss-num">{scene.number}</span>
                <span className="ss-title">{scene.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main content */}
        <div className="rehearsal__main">
          {/* Current line spotlight */}
          {status === "done" ? (
            <div className="done-card">
              <div className="done-emoji">🎉</div>
              <h2>Scene Complete!</h2>
              <p>Great work, {myRole}!</p>
              <button className="play-btn" onClick={() => { setCurrentIdx(0); setStatus("idle"); }}>
                Run Again
              </button>
            </div>
          ) : currentLine ? (
            <div className={`spotlight-card spotlight--${currentLine.type === "stage" ? "stage" : currentLine.character === myRole ? "me" : "other"}`}
              style={currentLine.character ? { "--char-color": getCharacterColor(currentLine.character) } : {}}>

              {currentLine.type === "stage" ? (
                <>
                  <div className="spotlight__who">Stage Direction</div>
                  <div className="spotlight__text spotlight__text--stage">{currentLine.text}</div>
                </>
              ) : currentLine.character === myRole ? (
                <>
                  <div className="spotlight__who my-turn-label">
                    ⭐ YOUR LINE — {myRole} {characterEmoji[myRole] || ""}
                  </div>
                  {hideMyLines && !lineRevealed ? (
                    <div className="hidden-line-wrap">
                      <div className="hidden-line-blur">Say your line!</div>
                      <button className="reveal-btn" onClick={() => setLineRevealed(true)}>
                        👁 Peek at line
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="spotlight__text spotlight__text--me">{currentLine.text}</div>
                      {hideMyLines && lineRevealed && (
                        <div className="peeked-label">👁 Peeked!</div>
                      )}
                    </>
                  )}
                  {countdown !== null && (
                    <div className="countdown-ring">
                      <span className="countdown-num">{countdown}</span>
                      <span className="countdown-label">seconds</span>
                    </div>
                  )}
                  {!isRunning && (
                    <div className="my-line-hint">Your line! Hit ▶ when ready to continue.</div>
                  )}
                </>
              ) : (
                <>
                  <div className="spotlight__who" style={{ color: getCharacterColor(currentLine.character) }}>
                    {characterEmoji[currentLine.character] || "🎭"} {currentLine.character}
                    {status === "speaking" && <span className="speaking-dot" />}
                  </div>
                  <div className="spotlight__text">{currentLine.text}</div>
                </>
              )}
            </div>
          ) : null}

          {/* Transport controls */}
          <div className="transport">
            <button className="transport-btn" onClick={handlePrev} disabled={currentIdx === 0}>⏮</button>
            {isRunning ? (
              <button className="play-btn transport-play" onClick={handlePause}>⏸ Pause</button>
            ) : (
              <button className="play-btn transport-play" onClick={handlePlay}>
                {status === "done" ? "↩ Restart" : currentIdx === 0 ? "▶ Start Rehearsal" : "▶ Continue"}
              </button>
            )}
            <button className="transport-btn" onClick={handleNext} disabled={currentIdx >= allLines.length - 1}>⏭</button>
          </div>

          {/* Toggle full script */}
          <button className="toggle-script-btn" onClick={() => setShowAllLines(v => !v)}>
            {showAllLines ? "Hide Full Script ▲" : "Show Full Script ▼"}
          </button>

          {/* Full scrollable script */}
          {showAllLines && (
            <div className="full-script">
              {allLines.map((line, idx) => (
                <div
                  key={idx}
                  ref={el => lineRefs.current[idx] = el}
                  className={`script-line
                    ${idx === currentIdx ? "script-line--current" : ""}
                    ${line.type === "stage" ? "script-line--stage" : ""}
                    ${line.character === myRole ? "script-line--me" : ""}
                  `}
                  onClick={() => handleJumpTo(idx)}
                >
                  {line.type === "stage" ? (
                    <span className="sl-stage">{line.text}</span>
                  ) : (
                    <>
                      <span className="sl-char" style={{ color: getCharacterColor(line.character) }}>
                        {line.character === myRole ? "⭐ " : ""}{line.character}:
                      </span>
                      <span className="sl-text">{line.text}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("role"); // role | scene | rehearsal
  const [myRole, setMyRole] = useState(null);
  const [sceneNumber, setSceneNumber] = useState(null);

  const handleRoleSelect = (role) => {
    setMyRole(role);
    setView("scene");
  };

  const handleSceneSelect = (num) => {
    setSceneNumber(num);
    setView("rehearsal");
  };

  return (
    <div className="app">
      {view === "role" && <RolePicker onSelect={handleRoleSelect} />}
      {view === "scene" && (
        <ScenePicker
          myRole={myRole}
          onSelectScene={handleSceneSelect}
          onBack={() => setView("role")}
        />
      )}
      {view === "rehearsal" && (
        <RehearsalPlayer
          myRole={myRole}
          sceneNumber={sceneNumber}
          onBack={() => setView("scene")}
        />
      )}
    </div>
  );
}
