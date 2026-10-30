import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { garments, INITIAL_POSITIONS } from "./data/garments";
import { moveOnRail } from "./interaction/railSolver";

const RackScene = lazy(() => import("./scene/RackScene"));

function Arrow({
  direction = "right",
}: {
  direction?: "left" | "right" | "up";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transform:
          direction === "left"
            ? "rotate(180deg)"
            : direction === "up"
              ? "rotate(-45deg)"
              : undefined,
      }}
    >
      <path
        d="M4 12h15m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TurnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18.6 7.1A8 8 0 0 0 4 11m1.4 5.9A8 8 0 0 0 20 13M18.6 3v4.5h-4.5M5.4 21v-4.5h4.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function App() {
  const [positions, setPositions] = useState<number[]>(INITIAL_POSITIONS);
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [back, setBack] = useState([false, false, false, false]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(true);
  const [about, setAbout] = useState(false);
  const reducedMotion = useReducedMotion();
  const railRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const aboutTrigger = useRef<HTMLButtonElement>(null);
  const active = hovered ?? selected;
  const piece = garments[active];
  const showingBack = back[active] || hovered === active;

  const move = useCallback(
    (index: number, x: number) =>
      setPositions((current) => moveOnRail(current, index, x)),
    [],
  );
  const hover = useCallback((index: number | null) => {
    setHovered(index);
    if (index !== null) setSelected(index);
  }, []);
  const toggle = useCallback(
    (index: number) =>
      setBack((current) =>
        current.map((value, i) => (i === index ? !value : value)),
      ),
    [],
  );
  const onReady = useCallback(() => setReady(true), []);
  const reset = useCallback(() => {
    setPositions([...INITIAL_POSITIONS]);
    setBack([false, false, false, false]);
    setHovered(null);
    setSelected(0);
  }, []);

  useEffect(() => {
    if (about && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!about && dialogRef.current?.open) dialogRef.current?.close();
  }, [about]);

  const focusCollection = () => {
    railRef.current?.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "center",
    });
    railRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <a className="skip-link" href="#collection">
        Skip to the collection
      </a>
      <header className="site-header">
        <button
          className="wordmark"
          onClick={reset}
          aria-label="STILL — reset the collection"
        >
          STILL<span className="wordmark-star">✳</span>
        </button>
        <nav aria-label="Main navigation">
          <button className="nav-link current" onClick={focusCollection}>
            The collection <span>01—04</span>
          </button>
          <button
            className="nav-link"
            ref={aboutTrigger}
            onClick={() => setAbout(true)}
          >
            About the study <Arrow direction="up" />
          </button>
        </nav>
        <div className="season">
          <span className="status-dot" /> AUTUMN / WINTER 2026
        </div>
      </header>

      <main>
        <section className="introduction" aria-labelledby="page-title">
          <div className="intro-title">
            <p className="eyebrow">THE EVERYDAY COLLECTION / VOL. 01</p>
            <h1 id="page-title">
              Good things.
              <br />
              On repeat.
            </h1>
          </div>
          <div className="intro-note">
            <span className="editorial-symbol" aria-hidden="true">
              ↘
            </span>
            <p>
              A few considered pieces.
              <br />A little room to make them yours.
            </p>
            <button onClick={focusCollection}>
              Explore the rail <Arrow />
            </button>
          </div>
        </section>

        <section
          id="collection"
          className={`collection ${dragging !== null ? "is-dragging" : ""}`}
          ref={railRef}
          tabIndex={0}
          aria-label="Interactive clothing rack"
          aria-describedby="rack-instructions"
          data-positions={positions.map((x) => x.toFixed(3)).join(",")}
          data-selected={selected}
          data-dragging={dragging ?? ""}
          onKeyDown={(event) => {
            if (event.target !== railRef.current) return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              move(
                selected,
                positions[selected] + (event.key === "ArrowLeft" ? -0.3 : 0.3),
              );
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle(selected);
            }
            if (event.key === "Escape") reset();
          }}
        >
          <div className="scene-meta">
            <span>
              <span className="tiny-cross">+</span> THE STUDIO RAIL
            </span>
            <span>FOUR FORMS. ENDLESS EVERYDAYS.</span>
          </div>
          <div
            className="rack-stage"
            aria-label="Four garments hanging on a metal clothing rail"
          >
            <Suspense
              fallback={
                <div className="scene-loading">
                  <span className="loading-line" />
                  <span>OPENING THE STUDIO</span>
                </div>
              }
            >
              <RackScene
                positions={positions}
                selected={selected}
                hovered={hovered}
                back={back}
                reducedMotion={reducedMotion}
                onHover={hover}
                onSelect={setSelected}
                onMove={move}
                onToggle={toggle}
                onDrag={setDragging}
                onReady={onReady}
              />
            </Suspense>
            {!ready && (
              <div className="scene-loading loading-overlay" aria-hidden="true">
                <span className="loading-line" />
                <span>SETTING THE SCENE</span>
              </div>
            )}
            <div className="stage-side-note" aria-hidden="true">
              TAKE YOUR TIME. LOOK A LITTLE CLOSER.
            </div>
            {hint && (
              <div className="interaction-hint" id="rack-instructions">
                <span className="hint-mouse" aria-hidden="true">
                  <i />
                </span>
                <span className="desktop-hint">
                  Hover to turn <b>·</b> Drag to make room
                </span>
                <span className="touch-hint">
                  Tap to turn <b>·</b> Drag to make room
                </span>
                <button
                  aria-label="Dismiss interaction hint"
                  onClick={() => setHint(false)}
                >
                  ×
                </button>
              </div>
            )}
            {!hint && (
              <p id="rack-instructions" className="sr-only">
                Hover or tap a garment to see its back. Drag along the rail. Use
                the controls below to select, turn, or move a piece.
              </p>
            )}
          </div>

          <div
            className="piece-selector"
            role="group"
            aria-label="Select a garment"
          >
            {garments.map((g, index) => (
              <button
                key={g.id}
                className={`piece-tab ${active === index ? "active" : ""}`}
                aria-pressed={selected === index}
                onClick={() => {
                  setSelected(index);
                  setHovered(null);
                }}
              >
                <span className="piece-tab-meta">
                  <span>{g.id} /</span>
                  <span
                    className="color-dot"
                    style={{ background: g.swatch }}
                  />
                  <span>{g.shade}</span>
                </span>
                <span className="piece-tab-name">
                  {g.name}
                  <span className="tab-arrow">
                    <Arrow direction="up" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="inspection-bar"
          aria-label="Selected garment controls"
        >
          <div className="piece-description" key={piece.id}>
            <span className="eyebrow">{piece.category}</span>
            <p>{piece.material}</p>
          </div>
          <div className="inspection-controls">
            <span className="view-label">
              {piece.id} / {showingBack ? "BACK VIEW" : "FRONT VIEW"}
            </span>
            <button
              className="turn-button"
              onClick={() => toggle(active)}
              aria-pressed={back[active]}
              disabled={dragging !== null}
            >
              <TurnIcon />
              <span>{back[active] ? "View front" : "View back"}</span>
            </button>
            <div
              className="slide-controls"
              role="group"
              aria-label={`Move ${piece.name} along the rail`}
            >
              <button
                aria-label={`Move ${piece.name} left`}
                onClick={() => move(active, positions[active] - 0.35)}
                disabled={dragging !== null}
              >
                <Arrow direction="left" />
              </button>
              <button
                aria-label={`Move ${piece.name} right`}
                onClick={() => move(active, positions[active] + 0.35)}
                disabled={dragging !== null}
              >
                <Arrow />
              </button>
            </div>
            <button
              className="reset-button"
              onClick={reset}
              disabled={dragging !== null}
            >
              Reset rail <span aria-hidden="true">↺</span>
            </button>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {piece.name}, {piece.shade}, {showingBack ? "back" : "front"} view.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          STILL<span className="footer-cross">✳</span> AN EXPLORATION OF
          EVERYDAY FORMS.
        </span>
        <span>
          A DIGITAL WARDROBE STUDY <span className="footer-year">© 2026</span>
        </span>
      </footer>

      <dialog
        ref={dialogRef}
        className="about-dialog"
        aria-labelledby="about-title"
        onCancel={() => setAbout(false)}
        onClose={() => {
          setAbout(false);
          aboutTrigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setAbout(false);
        }}
      >
        <div className="about-content">
          <div className="about-top">
            <span className="eyebrow">STILL / THE STUDY</span>
            <button
              aria-label="Close about the study"
              onClick={() => setAbout(false)}
            >
              ×
            </button>
          </div>
          <span className="about-star" aria-hidden="true">
            ✳
          </span>
          <h2 id="about-title">
            Less rush.
            <br />
            More room.
          </h2>
          <p>
            A small digital wardrobe. Four everyday pieces, brought together to
            explore the familiar ritual of finding something to wear.
          </p>
          <p>
            Turn a piece over. Slide it along. Make a little space. There is no
            checkout here — just a collection to spend a moment with.
          </p>
          <div className="about-instructions">
            <span>01</span>
            <p>
              <strong>Look a little closer</strong>Hover on desktop, or tap on a
              touch screen, to turn a piece around.
            </p>
            <span>02</span>
            <p>
              <strong>Make room</strong>Drag any piece along the rail. Its
              neighbors will move with it.
            </p>
            <span>03</span>
            <p>
              <strong>Find your rhythm</strong>Use the controls below the rail
              to select, turn, move, or start again. Focus the rack to use arrow
              keys and Enter.
            </p>
          </div>
          <details className="asset-credits">
            <summary>Garment &amp; material credits</summary>
            <p>
              Cloth-simulated{" "}
              <a
                href="https://sketchfab.com/3d-models/hangers-and-tee-shirt-44e260855c7f4c1ca611af8d2370195a"
                target="_blank"
                rel="noreferrer"
              >
                tee
              </a>
              ,{" "}
              <a
                href="https://sketchfab.com/3d-models/hangers-and-long-sleeve-shirt-14cc81980a06473a820f811596418fae"
                target="_blank"
                rel="noreferrer"
              >
                long sleeve
              </a>
              , and{" "}
              <a
                href="https://sketchfab.com/3d-models/hangers-and-pants-37b92fbde5ca45448c50fc2cb6a376d8"
                target="_blank"
                rel="noreferrer"
              >
                trousers
              </a>{" "}
              by Paul Spooner (dudecon), adapted for this scene. Released under
              the creator's{" "}
              <a href="https://ip.tryop.com/" target="_blank" rel="noreferrer">
                public-domain policy
              </a>
              ; also credited under the listings'{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>{" "}
              terms.
            </p>
            <p>
              Fabric material maps by Microsoft, donated to the{" "}
              <a
                href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenCloth"
                target="_blank"
                rel="noreferrer"
              >
                Khronos glTF sample collection
              </a>{" "}
              under CC0.
            </p>
          </details>
          <button className="about-return" onClick={() => setAbout(false)}>
            Back to the collection <Arrow />
          </button>
        </div>
      </dialog>
    </>
  );
}
