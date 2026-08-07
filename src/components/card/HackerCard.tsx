import { useEffect, useState, forwardRef } from "react";
import QRCode from "qrcode";
import type { CardData } from "@/lib/card-data";
import beachVillage from "@/assets/beach-village.jpg";
import palmShadow from "@/assets/palm-shadow.png";

export const CARD_W = 1000;
export const CARD_H = 1760;

function useQr(value: string, color: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value || "https://lovable.dev", {
      margin: 0,
      width: 320,
      errorCorrectionLevel: "H",
      color: { dark: color, light: "#00000000" },
    })
      .then((d) => alive && setUrl(d))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [value, color]);
  return url;
}

function Stamp({ top, bottom, gold, pink }: { top: string; bottom: string; gold: string; pink: string }) {
  return (
    <div
      style={{
        width: 168,
        height: 168,
        borderRadius: "50%",
        border: `2px solid ${pink}55`,
        position: "relative",
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.25)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: "50%",
          border: `1px dashed ${pink}66`,
        }}
      />
      <svg viewBox="0 0 168 168" width={168} height={168} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <path id="stamp-top" d="M 84,84 m -60,0 a 60,60 0 1,1 120,0" fill="none" />
          <path id="stamp-bottom" d="M 84,84 m -54,0 a 54,54 0 1,0 108,0" fill="none" />
        </defs>
        <text
          fill={pink}
          style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, letterSpacing: 3 }}
        >
          <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">
            {top}
          </textPath>
        </text>
        <text
          fill={pink}
          style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, letterSpacing: 4 }}
        >
          <textPath href="#stamp-bottom" startOffset="50%" textAnchor="middle">
            {bottom}
          </textPath>
        </text>
      </svg>
      <svg viewBox="0 0 64 64" width={74} height={74} style={{ marginTop: -4 }}>
        <g stroke={pink} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M32 46 V26" />
          <path d="M32 26 C22 18, 14 20, 10 26 C18 22, 26 24, 32 28" />
          <path d="M32 26 C42 18, 50 20, 54 26 C46 22, 38 24, 32 28" />
          <path d="M32 26 C28 16, 20 12, 14 12 C24 14, 29 20, 31 27" />
          <path d="M32 26 C36 16, 44 12, 50 12 C40 14, 35 20, 33 27" />
          <path d="M14 50 q9 -5 18 0 q9 5 18 0" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}

function Barcode({ color }: { color: string }) {
  const bars = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 4, 1, 2];
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 26 }}>
      {bars.map((w, i) => (
        <span key={i} style={{ width: w, height: 26, background: color }} />
      ))}
    </div>
  );
}

type Props = { data: CardData; shareUrl: string };

export const HackerCard = forwardRef<HTMLDivElement, Props>(function HackerCard(
  { data, shareUrl },
  ref,
) {
  const t = data.theme;
  const qr = useQr(shareUrl, t.emerald);
  const stackRows: string[][] = [];
  for (let i = 0; i < data.stack.length; i += 3) stackRows.push(data.stack.slice(i, i + 3));

  const label: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    letterSpacing: 2,
    fontSize: 19,
  };

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        height: CARD_H,
        position: "relative",
        color: t.ink,
        background: "transparent",
      }}
    >
      {/* lanyard */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 152,
          height: 200,
          background: `repeating-linear-gradient(90deg, ${t.emerald}, ${t.emerald} 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 8px)`,
          borderRadius: "6px 6px 0 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 22,
          boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            fontSize: 44,
            color: t.pink,
            lineHeight: 1,
          }}
        >
          HH
        </div>
        <div style={{ ...label, color: t.gold, fontSize: 17, marginTop: 6 }}>{data.stampBottom}</div>
        <svg viewBox="0 0 24 24" width={20} height={20} style={{ marginTop: 8 }}>
          <path d="M12 20V10M12 10c-4-4-8-2-10 0 3-1 6 0 8 2M12 10c4-4 8-2 10 0-3-1-6 0-8 2" stroke={t.pink} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      {/* clip */}
      <div
        style={{
          position: "absolute",
          top: 132,
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 84,
          borderRadius: 42,
          background: `linear-gradient(180deg, #f6e2a0, ${t.gold} 45%, #8c6a17)`,
          boxShadow: "0 10px 22px rgba(0,0,0,0.35)",
          display: "grid",
          placeItems: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            width: 210,
            height: 34,
            borderRadius: 20,
            background: "#1b1b1b",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
          }}
        />
      </div>

      {/* badge body */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          width: CARD_W,
          height: CARD_H - 150,
          borderRadius: 58,
          padding: 9,
          background: `linear-gradient(150deg, #f8e7b0, ${t.gold} 30%, #7d5f13 55%, ${t.gold} 78%, #f6e4ae)`,
          boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 50,
            overflow: "hidden",
            position: "relative",
            background: t.paper,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* paper grain + lamination */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.6), transparent 55%), radial-gradient(circle at 85% 70%, rgba(0,0,0,0.05), transparent 60%)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
          <img
            src={palmShadow}
            alt=""
            style={{
              position: "absolute",
              top: -40,
              left: -60,
              width: 480,
              opacity: 0.5,
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }}
          />
          <img
            src={palmShadow}
            alt=""
            style={{
              position: "absolute",
              top: 430,
              right: -120,
              width: 520,
              opacity: 0.45,
              transform: "scaleX(-1) rotate(12deg)",
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }}
          />

          {/* top meta */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "36px 44px 0",
              position: "relative",
              zIndex: 4,
            }}
          >
            <div>
              <div style={{ ...label, color: t.pink, fontSize: 26, fontWeight: 700 }}>{data.time}</div>
              <div style={{ ...label, marginTop: 2 }}>{data.room}</div>
              <div style={{ ...label, marginTop: 18 }}>{data.location}</div>
              <div style={{ ...label, color: t.pink, marginTop: 2 }}>{data.dates}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 4 }}>
              <div>
                <div style={{ ...label, fontSize: 15 }}>{data.hypeLabel}</div>
                <div style={{ marginTop: 6 }}>
                  <Barcode color={t.ink} />
                </div>
              </div>
              <div
                style={{
                  ...label,
                  fontWeight: 700,
                  fontSize: 22,
                  color: t.ink,
                  background: `${t.pink}33`,
                  border: `1.5px solid ${t.pink}`,
                  padding: "8px 20px",
                }}
              >
                {data.applyLabel}
              </div>
              <svg viewBox="0 0 24 24" width={22} height={22}>
                <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={t.pink} />
              </svg>
            </div>
          </div>

          {/* stamp */}
          <div style={{ position: "absolute", top: 210, right: 48, zIndex: 4 }}>
            <Stamp top={data.stampTop} bottom={data.stampBottom} gold={t.gold} pink={t.pink} />
          </div>

          {/* title */}
          <div style={{ position: "relative", zIndex: 4, textAlign: "center", marginTop: 6 }}>
            <div style={{ color: t.pink, fontSize: 26, lineHeight: 0.4 }}>✳</div>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900,
                  fontSize: 132,
                  lineHeight: 0.92,
                  letterSpacing: -1,
                  color: t.emerald,
                }}
              >
                {data.titleLine1}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900,
                  fontSize: 132,
                  lineHeight: 0.94,
                  letterSpacing: -1,
                  color: t.emerald,
                }}
              >
                {data.titleLine2}
              </div>
              {data.stickerText ? (
                <div
                  style={{
                    position: "absolute",
                    top: 92,
                    left: "50%",
                    transform: "translateX(-50%) rotate(-3deg)",
                    background: "#f7c5d4",
                    border: "4px solid #fff",
                    borderRadius: 22,
                    padding: "2px 22px 8px",
                    color: t.pink,
                    fontFamily: "'Noto Sans Devanagari', sans-serif",
                    fontWeight: 700,
                    fontSize: 40,
                    boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {data.stickerText}
                </div>
              ) : null}
            </div>
            <div
              style={{
                ...label,
                fontSize: 22,
                letterSpacing: 7,
                marginTop: 14,
                color: t.ink,
              }}
            >
              {data.tagline}
            </div>
          </div>

          {/* portrait + details */}
          <div
            style={{
              display: "flex",
              gap: 34,
              padding: "26px 44px 0",
              position: "relative",
              zIndex: 4,
            }}
          >
            <div
              style={{
                width: 372,
                height: 452,
                borderRadius: "186px 186px 26px 26px",
                border: `3px solid ${t.gold}`,
                overflow: "hidden",
                background: `linear-gradient(180deg, #f0c9c0, ${t.emerald})`,
                flex: "0 0 auto",
                boxShadow: "0 12px 26px rgba(0,0,0,0.18)",
              }}
            >
              {data.portrait ? (
                <img
                  src={data.portrait}
                  alt={data.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    ...label,
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: t.paper,
                    fontSize: 16,
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  ADD YOUR PORTRAIT
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: 10 }}>
              <div
                style={{
                  fontFamily: "'Parisienne', cursive",
                  fontSize: 78,
                  lineHeight: 0.95,
                  color: t.gold,
                  textShadow: "0 2px 0 rgba(0,0,0,0.06)",
                  wordBreak: "break-word",
                }}
              >
                {data.name}
              </div>
              <div
                style={{
                  height: 3,
                  width: 190,
                  background: t.pink,
                  marginTop: 8,
                  marginLeft: "auto",
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  marginTop: 22,
                  background: t.emerald,
                  border: `2px solid ${t.gold}`,
                  padding: "12px 0",
                  textAlign: "center",
                  ...label,
                  fontSize: 26,
                  letterSpacing: 8,
                  color: t.gold,
                  fontWeight: 700,
                }}
              >
                ✦ {data.role} ✦
              </div>
              <div style={{ ...label, color: t.pink, fontWeight: 700, fontSize: 24, marginTop: 26 }}>
                STACK
              </div>
              <div style={{ marginTop: 10 }}>
                {stackRows.map((row, i) => (
                  <div
                    key={i}
                    style={{
                      ...label,
                      fontSize: 21,
                      letterSpacing: 1.5,
                      lineHeight: 1.75,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.map((s, j) => (
                      <span key={j}>
                        {j > 0 ? <span style={{ color: t.pink }}> • </span> : null}
                        {s}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* info strip */}
          <div
            style={{
              marginTop: "auto",
              background: t.emerald,
              color: t.paper,
              display: "flex",
              alignItems: "center",
              gap: 26,
              padding: "22px 44px",
              position: "relative",
              zIndex: 4,
              borderTop: `2px solid ${t.gold}`,
            }}
          >
            <svg viewBox="0 0 24 24" width={44} height={44} style={{ flex: "0 0 auto" }}>
              <rect x="2" y="4" width="20" height="16" rx="3" stroke={t.gold} strokeWidth="1.5" fill="none" />
              <circle cx="8.5" cy="11" r="2.4" stroke={t.gold} strokeWidth="1.3" fill="none" />
              <path d="M4.6 17c.8-2 6-2 7.8 0M14 9.5h6M14 13h6" stroke={t.gold} strokeWidth="1.3" fill="none" strokeLinecap="round" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ ...label, fontSize: 16, color: `${t.paper}cc` }}>ID NUMBER</div>
              <div style={{ ...label, fontSize: 25, color: t.pink, fontWeight: 700, marginTop: 4 }}>
                {data.idNumber}
              </div>
            </div>
            <div style={{ width: 1, height: 84, background: `${t.gold}66` }} />
            <div
              style={{
                width: 118,
                height: 118,
                background: t.paper,
                display: "grid",
                placeItems: "center",
                border: `2px solid ${t.gold}`,
                position: "relative",
                flex: "0 0 auto",
              }}
            >
              {qr ? <img src={qr} alt="QR code" style={{ width: 100, height: 100 }} /> : null}
              <div
                style={{
                  position: "absolute",
                  width: 30,
                  height: 30,
                  background: t.paper,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 900,
                  fontSize: 17,
                  color: t.pink,
                }}
              >
                HH
              </div>
            </div>
            <div style={{ width: 1, height: 84, background: `${t.gold}66` }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...label, fontSize: 16, color: `${t.paper}cc` }}>VALID DATES</div>
              <div style={{ ...label, fontSize: 22, color: t.pink, fontWeight: 700, marginTop: 2 }}>
                {data.dates}
              </div>
              <div style={{ ...label, fontSize: 16, color: `${t.paper}cc`, marginTop: 10 }}>LOCATION</div>
              <div style={{ ...label, fontSize: 22, color: t.pink, fontWeight: 700, marginTop: 2 }}>
                {data.location}
              </div>
            </div>
          </div>

          {/* artwork */}
          <img
            src={beachVillage}
            alt="Illustrated Goa beach village at sunset"
            style={{ width: "100%", height: 240, objectFit: "cover", display: "block", position: "relative", zIndex: 4 }}
          />

          {/* footer */}
          <div
            style={{
              background: t.emerald,
              color: t.paper,
              padding: "20px 44px 24px",
              position: "relative",
              zIndex: 4,
              borderTop: `2px solid ${t.gold}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <svg viewBox="0 0 24 24" width={40} height={40}>
                <path d="M12 21V10M12 10C8 5 4 7 2 10c3-1 6 0 8 3M12 10c4-5 8-3 10 0-3-1-6 0-8 3" stroke={t.gold} strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </svg>
              <div style={{ textAlign: "center" }}>
                <div style={{ ...label, fontSize: 21, letterSpacing: 4 }}>{data.footerLine1}</div>
                <div style={{ ...label, fontSize: 21, letterSpacing: 4, marginTop: 6 }}>
                  {data.footerLine2}
                </div>
              </div>
              <svg viewBox="0 0 24 24" width={40} height={40}>
                <circle cx="12" cy="12" r="9" stroke={t.gold} strokeWidth="1.3" fill="none" />
                <ellipse cx="12" cy="12" rx="4" ry="9" stroke={t.gold} strokeWidth="1.3" fill="none" />
                <path d="M3 12h18M4.5 7.5h15M4.5 16.5h15" stroke={t.gold} strokeWidth="1.1" />
              </svg>
            </div>
            <div style={{ height: 1, background: `${t.gold}66`, margin: "16px 60px 12px" }} />
            <div style={{ ...label, textAlign: "center", color: t.gold, fontSize: 24, letterSpacing: 6 }}>
              {data.hashtag}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
