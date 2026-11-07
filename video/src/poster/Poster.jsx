import { loadFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill, Img, random, staticFile } from "remotion";

const { fontFamily } = loadFont("normal", {
    weights: ["500", "600", "800"],
    subsets: ["latin"],
});

// Placeholder: replace with the real address after deployment.
export const LIVE_URL = "notesmanager-alpha.vercel.app";

const FEATURES = [
    { label: "Pin, tag & sort", color: "#7b8bde" },
    { label: "Instant search", color: "#5fa8b5" },
    { label: "JWT auth & reset", color: "#60a5fa" },
    { label: "Vitest & Mocha tests", color: "#34d399" },
];

// Keeps the background decoration from landing on the text column.
const isOverText = (x, y) => x < 800 && y > 170 && y < 940;

const scatter = (prefix, count) =>
    Array.from({ length: count }, (_, i) => ({
        id: `${prefix}-${i}`,
        x: random(`${prefix}-x-${i}`) * 1880,
        y: random(`${prefix}-y-${i}`) * 1040,
        size: random(`${prefix}-s-${i}`),
        opacity: random(`${prefix}-o-${i}`),
        rotate: random(`${prefix}-r-${i}`) * 45,
    })).filter(({ x, y }) => !isOverText(x, y));

const Sparkle = ({ x, y, size, opacity, rotate }) => (
    <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{
            position: "absolute",
            left: x,
            top: y,
            opacity,
            transform: `rotate(${rotate}deg)`,
        }}
    >
        <path
            d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z"
            fill="#a9c6ff"
        />
    </svg>
);

export const Backdrop = () => (
    <AbsoluteFill
        style={{
            background:
                "linear-gradient(135deg, #1e293b 0%, #14213d 48%, #0b1a3a 100%)",
        }}
    >
        <AbsoluteFill
            style={{
                background:
                    "radial-gradient(900px 620px at 76% 52%, rgba(15,90,187,0.55), transparent 70%), radial-gradient(620px 460px at 100% 100%, rgba(123,139,222,0.34), transparent 70%), radial-gradient(560px 420px at 8% 8%, rgba(95,168,181,0.16), transparent 70%)",
            }}
        />
        {scatter("dot", 70).map(({ id, x, y, size, opacity }) => (
            <div
                key={id}
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: 2 + size * 2.5,
                    height: 2 + size * 2.5,
                    borderRadius: "50%",
                    background: "#cfe0ff",
                    opacity: 0.15 + opacity * 0.5,
                }}
            />
        ))}
        {scatter("sp", 16).map(({ id, x, y, size, opacity, rotate }) => (
            <Sparkle
                key={id}
                x={x}
                y={y}
                size={12 + size * 20}
                opacity={0.18 + opacity * 0.4}
                rotate={rotate}
            />
        ))}
    </AbsoluteFill>
);

const BrowserWindow = ({ src, width, style }) => (
    <div
        style={{
            position: "absolute",
            width,
            borderRadius: 18,
            overflow: "hidden",
            background: "#fff",
            boxShadow:
                "0 40px 90px rgba(3,10,30,0.65), 0 0 0 1px rgba(255,255,255,0.14)",
            ...style,
        }}
    >
        <div
            style={{
                height: 50,
                background: "#eef3fb",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 18px",
            }}
        >
            {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
                <div
                    key={color}
                    style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: color,
                    }}
                />
            ))}
            <div
                style={{
                    marginLeft: 16,
                    padding: "6px 22px",
                    minWidth: 340,
                    borderRadius: 16,
                    background: "#fff",
                    color: "#475569",
                    fontSize: 16,
                    fontWeight: 500,
                }}
            >
                {LIVE_URL}
            </div>
        </div>
        <Img src={staticFile(src)} style={{ display: "block", width: "100%" }} />
    </div>
);

export const Poster = () => (
    <AbsoluteFill style={{ fontFamily, color: "#fff" }}>
        <Backdrop />

        <BrowserWindow
            src="notes-manager/edit-note.png"
            width={1000}
            style={{
                left: 850,
                top: 150,
                transform: "perspective(2200px) rotateY(-9deg) rotateZ(-1.5deg)",
            }}
        />
        <BrowserWindow
            src="notes-manager/home.png"
            width={1010}
            style={{
                left: 760,
                top: 480,
                transform: "perspective(2200px) rotateY(-6deg) rotateZ(1deg)",
            }}
        />

        <div style={{ position: "absolute", left: 100, top: 205, width: 660 }}>
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "12px 28px",
                    borderRadius: 40,
                    border: "2px solid rgba(147,187,255,0.75)",
                    background: "rgba(15,90,187,0.22)",
                    color: "#bcd4ff",
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: 7,
                }}
            >
                <Img
                    src={staticFile("notes-manager/logo.png")}
                    style={{ width: 34, height: 34, borderRadius: 8 }}
                />
                MERN STACK
            </div>

            <div
                style={{
                    marginTop: 36,
                    paddingBottom: 18,
                    fontSize: 112,
                    lineHeight: 1.02,
                    fontWeight: 800,
                    letterSpacing: -3,
                    background:
                        "linear-gradient(180deg, #ffffff 15%, #8fbaff 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    filter: "drop-shadow(0 0 28px rgba(64,132,255,0.55))",
                }}
            >
                Notes
                <br />
                Manager
            </div>

            <div
                style={{
                    marginTop: 12,
                    fontSize: 42,
                    lineHeight: 1.25,
                    fontWeight: 600,
                }}
            >
                A secure, tested
                <br />
                <span style={{ color: "#8fbaff" }}>full-stack notes app</span>
            </div>

            <div
                style={{
                    marginTop: 36,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 14,
                    width: 600,
                }}
            >
                {FEATURES.map(({ label, color }) => (
                    <div
                        key={label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "13px 22px",
                            borderRadius: 30,
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(255,255,255,0.07)",
                            fontSize: 24,
                            fontWeight: 500,
                        }}
                    >
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: color,
                            }}
                        />
                        {label}
                    </div>
                ))}
            </div>

            <div
                style={{
                    marginTop: 34,
                    fontSize: 27,
                    fontWeight: 500,
                    color: "#8fbaff",
                }}
            >
                {LIVE_URL}
            </div>
        </div>
    </AbsoluteFill>
);
