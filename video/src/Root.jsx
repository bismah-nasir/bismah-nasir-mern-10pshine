import { Composition, Still } from "remotion";
import { Demo, DEMO_DURATION, FPS } from "./demo/Demo.jsx";
import { Poster } from "./poster/Poster.jsx";

export const Root = () => (
    <>
        <Still id="Poster" component={Poster} width={1920} height={1080} />
        <Composition
            id="Demo"
            component={Demo}
            durationInFrames={DEMO_DURATION}
            fps={FPS}
            width={1920}
            height={1080}
        />
    </>
);
