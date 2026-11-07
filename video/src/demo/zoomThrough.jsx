import { AbsoluteFill } from "remotion";

// The old scene grows past the camera while the new one rises up from behind it
const ZoomThrough = ({ children, presentationDirection, presentationProgress }) => {
    const entering = presentationDirection === "entering";
    const scale = entering
        ? 0.86 + 0.14 * presentationProgress
        : 1 + 0.16 * presentationProgress;
    const opacity = entering
        ? Math.min(1, presentationProgress * 2)
        : Math.min(1, (1 - presentationProgress) * 2);
    return (
        <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
            {children}
        </AbsoluteFill>
    );
};

export const zoomThrough = () => ({ component: ZoomThrough, props: {} });
