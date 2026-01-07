import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Trafo / Uk / Ik YOK.
 * Senaryolar: cosφ, η, Kd, Margin ve eğri önerisi.
 * minInHint: Bu senaryo genelde kaç amper üstü içindir (uyarı için).
 */
const SCENARIO_GROUPS = [
  {
    label: "Konut / Ticari",
    items: [
      {
        id: "bina-ana",
        name: "Bina Giriş Panosu (Ana Dağıtım)",
        cosPhi: 0.9,
        eta: 0.98,
        kd: 0.9,
        margin: 1.25,
        curve: "C",
        preferredDevice: "MCCB",
        minInHint: 125,
      },
      {
        id: "magaza-ofis",
        name: "Mağaza / Ofis Panosu",
        cosPhi: 0.95,
        eta: 1.0,
        kd: 0.85,
        margin: 1.15,
        curve: "C",
        preferredDevice: "MCB",
        minInHint: 10,
      },
      {
        id: "daire",
        name: "Daire Panosu (Priz + Aydınlatma)",
        cosPhi: 0.95,
        eta: 1.0,
        kd: 0.7,
        margin: 1.1,
        curve: "C",
        preferredDevice: "MCB",
        minInHint: 6,
      },
      {
        id: "kafe-restoran",
        name: "Kafe / Restoran Panosu",
        cosPhi: 0.8,
        eta: 1.0,
        kd: 0.8,
        margin: 1.2,
        curve: "C",
        preferredDevice: "MCCB",
        minInHint: 63,
      },
    ],
  },
  {
    label: "Endüstriyel",
    items: [
      {
        id: "fabrika-ana",
        name: "Fabrika Giriş (Ana Dağıtım)",
        cosPhi: 0.85,
        eta: 0.97,
        kd: 0.95,
        margin: 1.25,
        curve: "C",
        preferredDevice: "ACB",
        minInHint: 630,
      },
      {
        id: "kompresor",
        name: "Kompresör / Ağır Motor Grubu",
        cosPhi: 0.85,
        eta: 0.95,
        kd: 0.9,
        margin: 1.6,
        curve: "D",
        preferredDevice: "MCCB",
        minInHint: 63,
      },
      {
        id: "pompa",
        name: "Pompa / HVAC Motor Panosu",
        cosPhi: 0.9,
        eta: 0.95,
        kd: 0.9,
        margin: 1.2,
        curve: "C",
        preferredDevice: "MCCB",
        minInHint: 63,
      },
    ],
  },
  {
    label: "Aydınlatma",
    items: [
      {
        id: "dis-aydinlatma",
        name: "Dış Aydınlatma / Park",
        cosPhi: 0.95,
        eta: 1.0,
        kd: 0.9,
        margin: 1.15,
        curve: "C",
        preferredDevice: "MCB",
        minInHint: 10,
      },
      {
        id: "ic-aydinlatma",
        name: "İç Aydınlatma",
        cosPhi: 0.98,
        eta: 1.0,
        kd: 0.8,
        margin: 1.1,
        curve: "B",
        preferredDevice: "MCB",
        minInHint: 6,
      },
    ],
  },
];

const STANDARD_IN = [
  6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400,
  500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200,
];

// ===== utils =====
function toNumber(x) {
  const n = Number(String(x ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function clamp(x, a, b) {
  return Math.min(b, Math.max(a, x));
}
function pickStandardIn(amps) {
  const a = Math.max(0, amps);
  for (const s of STANDARD_IN) if (s >= a) return s;
  return STANDARD_IN[STANDARD_IN.length - 1];
}
function normalizeMode(mode) {
  return String(mode || "").trim().toLowerCase();
}
function toWatts(value, mode, cosPhi, eta) {
  const v = toNumber(value);
  const m = normalizeMode(mode);
  if (!Number.isFinite(v) || v <= 0) return 0;

  if (m === "w") return v;
  if (m === "kw") return v * 1000;
  if (m === "kva") return v * 1000 * cosPhi * eta; // kVA -> kW approx
  return 0;
}
function calcIb({ phase, volts, watts, cosPhi, eta }) {
  const cp = clamp(toNumber(cosPhi) || 1, 0.1, 1);
  const et = clamp(toNumber(eta) || 1, 0.1, 1);
  if (phase === 1) return watts / (volts * cp * et);
  return watts / (Math.sqrt(3) * volts * cp * et);
}

/**
 * Cihaz ailesi seçimi:
 * - 125A altı MCB (senaryo MCCB dese bile)
 * - 125..630 MCCB
 * - 630 üstü ACB
 * preferred yalnız YUKARI itebilir, aşağı itemez.
 */
function pickDeviceFamily(In, preferred) {
  const base = In <= 125 ? "MCB" : In <= 630 ? "MCCB" : "ACB";
  const order = ["MCB", "MCCB", "ACB"];
  const bi = order.indexOf(base);
  const pi = order.indexOf(preferred || "MCB");
  return order[Math.max(bi, pi)];
}

// ===== Custom searchable dropdown (senaryo) =====
function ScenarioSelect({ value, onChange, groups, placeholder = "Seç..." }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const flat = useMemo(() => {
    const out = [];
    for (const g of groups) {
      for (const it of g.items) out.push({ ...it, group: g.label });
    }
    return out;
  }, [groups]);

  const selected = flat.find((x) => x.id === value);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return flat;
    return flat.filter((x) =>
      (x.name + " " + x.group).toLowerCase().includes(s)
    );
  }, [q, flat]);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="scWrap" ref={wrapRef}>
      <button
        type="button"
        className="scButton"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected ? selected.name : placeholder}</span>
        <span className="scCaret">▾</span>
      </button>

      {open && (
        <div className="scPanel">
          <input
            className="scSearch"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: mağaza, bina, fabrika..."
            autoFocus
          />
          <div className="scList">
            {grouped.map(([groupName, items]) => (
              <div key={groupName}>
                <div className="scGroupTitle">{groupName}</div>
                {items.map((it) => (
                  <button
                    type="button"
                    key={it.id}
                    className={"scItem" + (it.id === value ? " isActive" : "")}
                    onClick={() => {
                      onChange(it.id);
                      setOpen(false);
                    }}
                  >
                    <div className="scItemName">{it.name}</div>
                    <div className="scItemMeta">
                      cosφ={it.cosPhi} · η={it.eta} · Kd={it.kd} · Margin=
                      {it.margin} · Eğri {it.curve} · Öneri {it.preferredDevice}
                      {it.minInHint ? ` · genelde ≥ ${it.minInHint}A` : ""}
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && <div className="scEmpty">Sonuç yok.</div>}
          </div>

          <button
            type="button"
            className="scClose"
            onClick={() => setOpen(false)}
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Native <select> yerine custom dropdown:
 * Böylece Windows/Chrome "beyaz dev dropdown" bug'ı biter.
 */
function SimpleSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="field" ref={wrapRef}>
      <div className="label">{label}</div>

      <button
        type="button"
        className="scButton"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected ? selected.label : "Seç..."}</span>
        <span className="scCaret">▾</span>
      </button>

      {open && (
        <div className="scPanel">
          <div className="scList" style={{ maxHeight: 220 }}>
            {options.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                className={"scItem" + (o.value === value ? " isActive" : "")}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <div className="scItemName">{o.label}</div>
                {o.meta ? <div className="scItemMeta">{o.meta}</div> : null}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="scClose"
            onClick={() => setOpen(false)}
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState(1); // 1 veya 3
  const [inputMode, setInputMode] = useState("kW"); // kW, W, A, kVA
  const [val, setVal] = useState("5");

  const [scenarioId, setScenarioId] = useState("bina-ana");

  const [kdOverride, setKdOverride] = useState("");
  const [marginOverride, setMarginOverride] = useState("");

  const [Ib, setIb] = useState(null);
  const [In, setIn] = useState(null);
  const [device, setDevice] = useState("");
  const [curve, setCurve] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [warning, setWarning] = useState("");

  const scenario = useMemo(() => {
    for (const g of SCENARIO_GROUPS) {
      const found = g.items.find((x) => x.id === scenarioId);
      if (found) return found;
    }
    return SCENARIO_GROUPS[0].items[0];
  }, [scenarioId]);

  const volts = phase === 1 ? 230 : 400;

  function calculate() {
    const kd = kdOverride !== "" ? toNumber(kdOverride) : scenario.kd;
    const margin =
      marginOverride !== "" ? toNumber(marginOverride) : scenario.margin;

    const cosPhi = scenario.cosPhi;
    const eta = scenario.eta;

    const mode = normalizeMode(inputMode);

    let I = 0;

    if (mode === "a") {
      I = toNumber(val);
    } else {
      const P_w = toWatts(val, mode, cosPhi, eta); // W
      const P_eff = P_w * kd * margin;

      I = calcIb({
        phase,
        volts,
        watts: P_eff,
        cosPhi,
        eta,
      });
    }

    const inStd = pickStandardIn(I);
    const dev = pickDeviceFamily(inStd, scenario.preferredDevice);

    setIb(I);
    setIn(inStd);
    setDevice(dev);
    setCurve(scenario.curve);

    setAssumptions(
      `V=${volts}V · cosφ=${cosPhi} · η=${eta} · Kd=${kd} · Margin=${margin} · Mode=${inputMode}`
    );

    if (scenario.minInHint && inStd < scenario.minInHint) {
      setWarning(
        `Bu senaryo genelde ${scenario.minInHint}A ve üstü ana dağıtım için. Küçük yükte (In=${inStd}A) "Mağaza/Ofis" veya "Daire" gibi senaryolar daha mantıklı.`
      );
    } else {
      setWarning("");
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="title">0.4 kV Sigorta / Şalter Seçici </div>
        <div className="subtitle">
          Mekan/Senaryo seç → akım + standart In + MCB/MCCB/ACB önerisi
        </div>

        <div className="grid3">
          <SimpleSelect
            label="Faz"
            value={phase}
            onChange={setPhase}
            options={[
              { value: 1, label: "1 Faz (230 V)" },
              { value: 3, label: "3 Faz (400 V)" },
            ]}
          />

          <SimpleSelect
            label="Giriş Modu"
            value={inputMode}
            onChange={setInputMode}
            options={[
              { value: "kW", label: "kW" },
              { value: "W", label: "W" },
              { value: "A", label: "A" },
              { value: "kVA", label: "kVA" },
            ]}
          />

          <div className="field">
            <div className="label">Değer</div>
            <input
              className="input"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Örn: 5"
            />
            <div className="hint">{inputMode}</div>
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <div className="label">Mekan / Senaryo</div>
          <ScenarioSelect
            value={scenarioId}
            onChange={setScenarioId}
            groups={SCENARIO_GROUPS}
            placeholder="Senaryo seç..."
          />
          <div className="pillRow">
            <span className="pill">cosφ={scenario.cosPhi}</span>
            <span className="pill">η={scenario.eta}</span>
            <span className="pill">Kd={scenario.kd}</span>
            <span className="pill">Margin={scenario.margin}</span>
            <span className="pill">Eğri {scenario.curve}</span>
            <span className="pill">Öneri {scenario.preferredDevice}</span>
            {scenario.minInHint ? (
              <span className="pill">Genelde ≥ {scenario.minInHint}A</span>
            ) : null}
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="field">
            <div className="label">
              Kd (override) — boş bırak: senaryo default
            </div>
            <input
              className="input"
              value={kdOverride}
              onChange={(e) => setKdOverride(e.target.value)}
              placeholder={String(scenario.kd)}
            />
          </div>

          <div className="field">
            <div className="label">
              Margin (override) — boş bırak: senaryo default
            </div>
            <input
              className="input"
              value={marginOverride}
              onChange={(e) => setMarginOverride(e.target.value)}
              placeholder={String(scenario.margin)}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={calculate}>
            Hesapla
          </button>
          <div className="hint2">Standart In: {STANDARD_IN.join(", ")}...</div>
        </div>

        {warning ? (
          <div className="warnBox">
            <div className="warnTitle">Uyarı</div>
            <div className="warnText">{warning}</div>
          </div>
        ) : null}

        <div className="grid2" style={{ marginTop: 14 }}>
          <div className="result">
            <div className="rLabel">Hesaplanan Akım (Ib)</div>
            <div className="rValue">
              {Ib == null ? "—" : `${Ib.toFixed(2)} A`}
            </div>
          </div>

          <div className="result">
            <div className="rLabel">Önerilen In (standart)</div>
            <div className="rValue">{In == null ? "—" : `${In} A`}</div>
          </div>

          <div className="result">
            <div className="rLabel">Önerilen Cihaz Ailesi</div>
            <div className="rValue">{device || "—"}</div>
          </div>

          <div className="result">
            <div className="rLabel">MCB Eğrisi (fikir)</div>
            <div className="rValue">{curve || "—"}</div>
          </div>
        </div>

        <div className="result" style={{ marginTop: 12 }}>
          <div className="rLabel">Varsayımlar</div>
          <div className="rSmall">{assumptions || "—"}</div>
        </div>

        <div className="footerNote">
          Not: Bu araç “ön seçim” üçündür. Kablo kesiti, selektivite, kısa devre,
          ortam sıcaklığı, döşeme koşulları gibi kontroller sahada ayrıca
          yapılmalıdır. Yapımcı: Rustam Khuduaverdiyev
        </div>
      </div>
    </div>
  );
}
