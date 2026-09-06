import { useEffect, useState } from "preact/hooks";

export function Btop() {
  const [cpu, setCpu] = useState(12);
  const [mem, setMem] = useState(38);
  const cores = navigator.hardwareConcurrency || 8;
  const deviceMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  useEffect(() => {
    const t = setInterval(() => {
      setCpu((n) => Math.max(4, Math.min(96, n + (Math.random() - 0.45) * 14)));
      setMem((n) => Math.max(18, Math.min(82, n + (Math.random() - 0.5) * 4)));
    }, 700);
    return () => clearInterval(t);
  }, []);

  return (
    <div class="btop">
      <h2>CPU · {cores} threads</h2>
      <div class="meter cpu"><i style={{ width: cpu.toFixed(0) + "%" }} /></div>
      <pre>{cpu.toFixed(1)}%</pre>
      <h2>MEM {deviceMem ? `· ${deviceMem} GB reported` : ""}</h2>
      <div class="meter mem"><i style={{ width: mem.toFixed(0) + "%" }} /></div>
      <pre>{mem.toFixed(1)}%</pre>
      <h2>proc</h2>
      <pre>{`  PID USER     %CPU %MEM  COMMAND
    1 pi        0.0  0.1  /sbin/init
  142 pi        1.2  2.4  Hyprland
  188 pi        0.8  1.1  quickshell
  220 pi        0.3  0.4  alacritty
  404 pi        ${(cpu / 8).toFixed(1)}  0.6  omarchy.nixfred.com
`}</pre>
    </div>
  );
}
