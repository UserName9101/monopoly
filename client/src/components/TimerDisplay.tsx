import { useState, useEffect } from "react";
import { styles } from "../styles";

const TURN_TIME_MS = 90000;

export default function TimerDisplay({ startTime, isPaused }: { startTime: number; isPaused?: boolean }) {
  const [tl, setTl] = useState(Math.max(0, Math.ceil((TURN_TIME_MS - (Date.now() - startTime)) / 1000)));
  useEffect(() => {
    if (isPaused) return;
    const i = setInterval(() => setTl(Math.max(0, Math.ceil((TURN_TIME_MS - (Date.now() - startTime)) / 1000))), 1000);
    return () => clearInterval(i);
  }, [startTime, isPaused]);
  return <span style={{ color: isPaused ? '#888' : (tl <= 5 ? '#dc3545' : '#eee'), fontWeight: 'bold', backgroundColor: tl <= 5 ? 'rgba(220,53,69,0.1)' : 'transparent', padding: '2px 8px', borderRadius: 4 }}>{isPaused ? 'PAUSED' : `${tl}s`}</span>;
}