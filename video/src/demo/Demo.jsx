import { loadFont } from "@remotion/google-fonts/Inter";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
    AbsoluteFill,
    Audio,
    Easing,
    Img,
    interpolate,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import { Backdrop, LIVE_URL } from "../poster/Poster.jsx";
import capture from "./capture-data.json";
import { zoomThrough } from "./zoomThrough.jsx";

const { fontFamily } = loadFont("normal", {
    weights: ["500", "600", "800"],
    subsets: ["latin"],
});

export const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const INTRO_FRAMES = 3 * FPS;
const OUTRO_FRAMES = Math.round(6.5 * FPS);
const TRANSITION_FRAMES = 20;

// How fast each scene's footage plays. Form filling can go quicker than the features.
const SCENE_SPEED = {
    signup: 1.3,
    login: 1.2,
    create: 1.1,
    organize: 1,
    edit: 1.15,
    reset: 1.15,
    phone: 1,
};

const speedOf = ({ id }) => SCENE_SPEED[id] ?? 1;
const sceneFrames = (segment) =>
    Math.ceil((((segment.end - segment.start) / 1000) * FPS) / speedOf(segment));

// One animation for each change of scene, in order
const TRANSITIONS = [
    zoomThrough(),
    slide({ direction: "from-right" }),
    flip({ direction: "from-right" }),
    wipe({ direction: "from-left" }),
    slide({ direction: "from-bottom" }),
    zoomThrough(),
    flip({ direction: "from-left" }),
    clockWipe({ width: WIDTH, height: HEIGHT }),
];

const TIMING = linearTiming({
    durationInFrames: TRANSITION_FRAMES,
    easing: Easing.inOut(Easing.cubic),
});

export const DEMO_DURATION =
    INTRO_FRAMES +
    capture.segments.reduce((total, segment) => total + sceneFrames(segment), 0) +
    OUTRO_FRAMES -
    TRANSITIONS.length * TRANSITION_FRAMES;

const titleGradient = {
    background: "linear-gradient(180deg, #ffffff 15%, #8fbaff 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    filter: "drop-shadow(0 0 28px rgba(64,132,255,0.55))",
};

// Shows the recorded frame that was on screen at this moment of the scene
const Footage = ({ view, start, speed, style }) => {
    const frame = useCurrentFrame();
    const frames = capture.frames[view];
    const time = start + (frame / FPS) * 1000 * speed;
    let low = 0;
    let high = frames.length - 1;
    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (frames[middle].t <= time) low = middle;
        else high = middle - 1;
    }
    return (
        <Img
            src={staticFile(`capture/${view}/${frames[low].file}`)}
            style={{ display: "block", width: "100%", ...style }}
        />
    );
};

const Caption = ({ title, subtitle }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const enter = spring({ frame: frame - 14, fps, config: { damping: 200 } });
    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 22,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                gap: 22,
                opacity: enter,
                transform: `translateY(${(1 - enter) * 16}px)`,
            }}
        >
            <span style={{ fontSize: 38, fontWeight: 800, color: "#fff" }}>
                {title}
            </span>
            <span style={{ fontSize: 28, fontWeight: 500, color: "#a9c6ff" }}>
                {subtitle}
            </span>
        </div>
    );
};

const DesktopScene = ({ segment }) => (
    <AbsoluteFill>
        <div
            style={{
                position: "absolute",
                left: 176,
                top: 22,
                width: 1568,
                borderRadius: 14,
                overflow: "hidden",
                background: "#fff",
                boxShadow:
                    "0 30px 70px rgba(3,10,30,0.6), 0 0 0 1px rgba(255,255,255,0.14)",
            }}
        >
            <div
                style={{
                    height: 44,
                    background: "#eef3fb",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 16px",
                }}
            >
                {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
                    <div
                        key={color}
                        style={{
                            width: 13,
                            height: 13,
                            borderRadius: "50%",
                            background: color,
                        }}
                    />
                ))}
                <div
                    style={{
                        marginLeft: 14,
                        padding: "4px 20px",
                        minWidth: 420,
                        borderRadius: 14,
                        background: "#fff",
                        color: "#475569",
                        fontSize: 16,
                        fontWeight: 500,
                    }}
                >
                    {LIVE_URL}
                    {segment.urlPath === "/" ? "" : segment.urlPath}
                </div>
            </div>
            <Footage view="desktop" start={segment.start} speed={speedOf(segment)} />
        </div>
        <Caption title={segment.title} subtitle={segment.subtitle} />
    </AbsoluteFill>
);

const PhoneScene = ({ segment }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const enter = spring({ frame: frame - 12, fps, config: { damping: 200 } });
    return (
        <AbsoluteFill>
            <div
                style={{
                    position: "absolute",
                    left: 190,
                    top: 370,
                    width: 780,
                    opacity: enter,
                    transform: `translateX(${(enter - 1) * 30}px)`,
                }}
            >
                <div
                    style={{
                        fontSize: 88,
                        fontWeight: 800,
                        lineHeight: 1.08,
                        letterSpacing: -2,
                        paddingBottom: 10,
                        ...titleGradient,
                    }}
                >
                    {segment.title}
                </div>
                <div
                    style={{
                        marginTop: 20,
                        fontSize: 36,
                        lineHeight: 1.3,
                        fontWeight: 500,
                        color: "#a9c6ff",
                    }}
                >
                    {segment.subtitle}
                </div>
            </div>
            <div
                style={{
                    position: "absolute",
                    left: 1120,
                    top: 40,
                    width: 500,
                    height: 1000,
                    padding: 10,
                    borderRadius: 54,
                    background: "#0b1220",
                    boxShadow:
                        "0 40px 90px rgba(3,10,30,0.7), 0 0 0 2px rgba(255,255,255,0.18)",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 44,
                        overflow: "hidden",
                        background: "#fff",
                    }}
                >
                    <Footage view="phone" start={segment.start} speed={speedOf(segment)} />
                </div>
            </div>
        </AbsoluteFill>
    );
};

const Intro = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const logo = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
    const title = spring({ frame: frame - 12, fps, config: { damping: 200 } });
    const line = spring({ frame: frame - 26, fps, config: { damping: 200 } });
    return (
        <AbsoluteFill
            style={{
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
            }}
        >
            <Img
                src={staticFile("notes-manager/logo.png")}
                style={{
                    width: 150,
                    height: 150,
                    borderRadius: 32,
                    transform: `scale(${logo})`,
                }}
            />
            <div
                style={{
                    marginTop: 34,
                    paddingBottom: 16,
                    fontSize: 136,
                    lineHeight: 1.05,
                    fontWeight: 800,
                    letterSpacing: -4,
                    opacity: title,
                    transform: `translateY(${(1 - title) * 24}px)`,
                    ...titleGradient,
                }}
            >
                Notes Manager
            </div>
            <div
                style={{
                    marginTop: 14,
                    fontSize: 46,
                    fontWeight: 600,
                    opacity: line,
                    transform: `translateY(${(1 - line) * 18}px)`,
                }}
            >
                A secure, tested{" "}
                <span style={{ color: "#8fbaff" }}>full-stack notes app</span>
            </div>
        </AbsoluteFill>
    );
};

const STACK = ["MongoDB", "Express", "React", "Node.js", "Tailwind CSS", "Vercel"];
const STATS = [
    { value: "41", label: "backend tests" },
    { value: "68", label: "frontend tests" },
    { value: "JWT", label: "secured routes" },
];

const Outro = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const rise = (delay) => {
        const value = spring({ frame: frame - delay, fps, config: { damping: 200 } });
        return { opacity: value, transform: `translateY(${(1 - value) * 22}px)` };
    };
    return (
        <AbsoluteFill
            style={{
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    fontSize: 92,
                    fontWeight: 800,
                    letterSpacing: -3,
                    paddingBottom: 10,
                    ...titleGradient,
                    ...rise(0),
                }}
            >
                Try it live
            </div>
            <div
                style={{
                    marginTop: 8,
                    fontSize: 50,
                    fontWeight: 600,
                    color: "#8fbaff",
                    ...rise(10),
                }}
            >
                {LIVE_URL}
            </div>
            <div style={{ marginTop: 54, display: "flex", gap: 26, ...rise(22) }}>
                {STATS.map(({ value, label }) => (
                    <div
                        key={label}
                        style={{
                            width: 300,
                            padding: "24px 0",
                            borderRadius: 22,
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(255,255,255,0.07)",
                        }}
                    >
                        <div style={{ fontSize: 62, fontWeight: 800 }}>{value}</div>
                        <div style={{ fontSize: 26, fontWeight: 500, color: "#bcd4ff" }}>
                            {label}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 40, display: "flex", gap: 14, ...rise(34) }}>
                {STACK.map((name) => (
                    <div
                        key={name}
                        style={{
                            padding: "12px 24px",
                            borderRadius: 30,
                            border: "1px solid rgba(255,255,255,0.2)",
                            background: "rgba(255,255,255,0.07)",
                            fontSize: 26,
                            fontWeight: 500,
                        }}
                    >
                        {name}
                    </div>
                ))}
            </div>
            <div
                style={{
                    marginTop: 46,
                    fontSize: 30,
                    fontWeight: 500,
                    color: "#cbd5e1",
                    ...rise(46),
                }}
            >
                Built by <span style={{ color: "#fff", fontWeight: 600 }}>Bismah Nasir</span>
                {"  ·  "}github.com/bismah-nasir
            </div>
        </AbsoluteFill>
    );
};

const MUSIC_VOLUME = 0.45;

export const Demo = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
    // Fade the picture in and out at the very start and end
    const opacity = interpolate(
        frame,
        [0, 12, durationInFrames - 18, durationInFrames - 1],
        [0, 1, 1, 0],
        clamp,
    );
    return (
        <AbsoluteFill style={{ fontFamily, color: "#fff", background: "#000" }}>
            <Audio
                src={staticFile("music/background.wav")}
                volume={(f) =>
                    MUSIC_VOLUME *
                    interpolate(
                        f,
                        [0, fps, durationInFrames - 2.5 * fps, durationInFrames - 1],
                        [0, 1, 1, 0],
                        clamp,
                    )
                }
            />
            <AbsoluteFill style={{ opacity }}>
                <Backdrop />
                <TransitionSeries>
                    <TransitionSeries.Sequence durationInFrames={INTRO_FRAMES}>
                        <Intro />
                    </TransitionSeries.Sequence>
                    {capture.segments.flatMap((segment, index) => [
                        <TransitionSeries.Transition
                            key={`${segment.id}-transition`}
                            presentation={TRANSITIONS[index]}
                            timing={TIMING}
                        />,
                        <TransitionSeries.Sequence
                            key={segment.id}
                            durationInFrames={sceneFrames(segment)}
                        >
                            {segment.view === "phone" ? (
                                <PhoneScene segment={segment} />
                            ) : (
                                <DesktopScene segment={segment} />
                            )}
                        </TransitionSeries.Sequence>,
                    ])}
                    <TransitionSeries.Transition
                        presentation={TRANSITIONS[TRANSITIONS.length - 1]}
                        timing={TIMING}
                    />
                    <TransitionSeries.Sequence durationInFrames={OUTRO_FRAMES}>
                        <Outro />
                    </TransitionSeries.Sequence>
                </TransitionSeries>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
