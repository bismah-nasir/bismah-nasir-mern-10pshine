// Records the live app as high-quality frames for the demo video.
// Uses a temporary demo account, which is deleted again at the end.
// Run with: npm run capture
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const VIDEO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND = path.resolve(VIDEO_ROOT, "../backend");
const backendRequire = createRequire(path.join(BACKEND, "server.js"));
backendRequire("dotenv").config({ path: path.join(BACKEND, ".env"), quiet: true });
const mongoose = backendRequire("mongoose");

const SITE = "https://notesmanager-alpha.vercel.app";
const OUT = path.join(VIDEO_ROOT, "public", "capture");
const DEMO = { name: "Demo User", email: "demo@example.com", password: "DemoPass#2026" };

const SEED_NOTES = [
    { title: "Project roadmap", content: "<p>Finish the API, polish the dashboard and prepare the release notes for the team.</p>", tags: ["Work", "Planning"] },
    { title: "Interview prep", content: "<p>Review JWT, indexing and React hooks. Practise explaining the architecture out loud.</p>", tags: ["Career"] },
    { title: "Meeting notes: UX review", content: "<p>Make the mobile layout simpler and keep the search bar visible on every screen.</p>", tags: ["Design", "UI"] },
    { title: "Reading list", content: "<p>Designing Data-Intensive Applications, Refactoring, and The Pragmatic Programmer.</p>", tags: ["Personal"] },
    { title: "Grocery list", content: "<p>Milk, coffee beans, bread and apples for the weekend.</p>", tags: ["Home"] },
];

const hold = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Headless Chrome draws no mouse pointer, so add one to the page
const installCursor = (touch) => {
    const start = () => {
        if (document.getElementById("__demo_cursor")) return;
        const el = document.createElement("div");
        el.id = "__demo_cursor";
        el.style.cssText =
            "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform;";
        el.innerHTML = touch
            ? '<div style="width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(15,90,187,.35);border:2px solid rgba(15,90,187,.8)"></div>'
            : '<svg width="28" height="28" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><path d="M5 2l14 12.5-6.6.6 3.9 7.2-2.9 1.5-3.8-7.3L5 21z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
        document.documentElement.appendChild(el);
        const move = (x, y) => {
            el.style.transform = `translate(${x}px, ${y}px)`;
        };
        const saved = JSON.parse(sessionStorage.getItem("__demo_cursor") || "null");
        if (saved) move(saved.x, saved.y);
        window.addEventListener("mousemove", (e) => {
            move(e.clientX, e.clientY);
            sessionStorage.setItem("__demo_cursor", JSON.stringify({ x: e.clientX, y: e.clientY }));
        }, true);
        window.addEventListener("mousedown", (e) => {
            const ring = document.createElement("div");
            ring.style.cssText = `position:fixed;left:${e.clientX - 20}px;top:${e.clientY - 20}px;width:40px;height:40px;border-radius:50%;border:3px solid rgba(15,90,187,.75);z-index:2147483646;pointer-events:none;transition:all .35s ease-out;`;
            document.documentElement.appendChild(ring);
            requestAnimationFrame(() => {
                ring.style.transform = "scale(1.5)";
                ring.style.opacity = "0";
            });
            setTimeout(() => ring.remove(), 400);
        }, true);
    };
    if (document.documentElement) start();
    else document.addEventListener("DOMContentLoaded", start);
};

// One browser view plus its recording
const openView = async (browser, name, options, touch) => {
    const context = await browser.newContext(options);
    context.setDefaultTimeout(30000);
    await context.addInitScript(installCursor, touch);
    const page = await context.newPage();
    fs.mkdirSync(path.join(OUT, name), { recursive: true });

    const frames = [];
    const cdp = await context.newCDPSession(page);
    cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
        const file = `${String(frames.length).padStart(6, "0")}.jpg`;
        fs.writeFileSync(path.join(OUT, name, file), Buffer.from(data, "base64"));
        frames.push({ file, t: Math.round(metadata.timestamp * 1000) });
        cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    });
    const startRecording = () => cdp.send("Page.startScreencast", {
        format: "jpeg",
        quality: 90,
        maxWidth: options.viewport.width * options.deviceScaleFactor,
        maxHeight: options.viewport.height * options.deviceScaleFactor,
        everyNthFrame: 1,
    });
    const stopRecording = () => cdp.send("Page.stopScreencast");

    // Smooth, human-looking pointer movement
    let pointer = { x: options.viewport.width / 2, y: options.viewport.height / 2 };
    const moveTo = async (locator) => {
        await locator.waitFor({ state: "visible" });
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();
        const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const steps = 22;
        for (let i = 1; i <= steps; i++) {
            const p = i / steps;
            const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
            await page.mouse.move(
                pointer.x + (target.x - pointer.x) * eased,
                pointer.y + (target.y - pointer.y) * eased,
            );
            await hold(12);
        }
        pointer = target;
    };
    const click = async (locator) => {
        await moveTo(locator);
        await hold(120);
        await page.mouse.down();
        await page.mouse.up();
        await hold(200);
    };
    const type = async (locator, text, delay = 42) => {
        await click(locator);
        await page.keyboard.type(text, { delay });
    };
    return { context, page, frames, startRecording, stopRecording, moveTo, click, type };
};

const api = async (route, method, body, token) => {
    const res = await fetch(`${SITE}/api${route}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${route} failed with ${res.status}`);
    return res.json();
};

const main = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const users = mongoose.connection.collection("users");
    const notes = mongoose.connection.collection("notes");

    // Never touch an account this script did not create
    if (await users.findOne({ email: DEMO.email })) {
        await mongoose.disconnect();
        throw new Error(`${DEMO.email} already exists, so nothing was recorded or deleted.`);
    }

    if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
    fs.mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const segments = [];
    const scene = async (view, id, title, subtitle, urlPath, run) => {
        const start = Date.now();
        await run();
        segments.push({ id, title, subtitle, urlPath, view, start, end: Date.now() });
        console.log(`recorded ${id}: ${((Date.now() - start) / 1000).toFixed(1)}s`);
    };

    let created = false;
    try {
        const desktop = await openView(browser, "desktop", { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 }, false);
        const { page, click, type, moveTo } = desktop;
        // Wake the serverless function so the first scene doesn't start with a cold-start wait
        await fetch(`${SITE}/api/notes`);
        await page.goto(`${SITE}/signup`);
        await page.getByPlaceholder("Full Name").waitFor();
        await desktop.startRecording();
        await hold(600);

        await scene("desktop", "signup", "Create an account", "Validated forms, with passwords hashed using bcrypt", "/signup", async () => {
            await type(page.getByPlaceholder("Full Name"), DEMO.name);
            await type(page.getByPlaceholder("Email Address"), DEMO.email);
            await type(page.getByPlaceholder("Password", { exact: true }), DEMO.password, 30);
            await type(page.getByPlaceholder("Re-enter password"), DEMO.password, 30);
            await hold(300);
            created = true;
            await click(page.locator("button[type=submit]"));
            await page.waitForURL("**/login");
            await hold(1300);
        });

        const { token } = await api("/users/login", "POST", { email: DEMO.email, password: DEMO.password });
        for (const note of [...SEED_NOTES].reverse()) await api("/notes", "POST", note, token);

        await scene("desktop", "login", "Log in securely", "Protected routes and JSON Web Token sessions", "/login", async () => {
            await type(page.getByPlaceholder("Email Address"), DEMO.email);
            await type(page.getByPlaceholder("Password"), DEMO.password, 30);
            await click(page.locator("button[type=submit]"));
            await page.locator("h3", { hasText: "Project roadmap" }).waitFor();
            await hold(2200);
        });

        await scene("desktop", "create", "Write rich notes", "Headings, formatting, lists and custom tags", "/", async () => {
            await click(page.getByText("New Note"));
            await page.locator(".ProseMirror").waitFor();
            await hold(700);
            await type(page.getByPlaceholder("Note Title"), "Launch checklist");
            await type(page.getByPlaceholder("Add tag + Enter"), "Release");
            await page.keyboard.press("Enter");
            await hold(300);
            await click(page.locator(".ProseMirror"));
            await hold(200);
            await click(page.getByTitle("Heading 2"));
            await hold(150);
            await page.keyboard.type("Before we ship", { delay: 42 });
            await page.keyboard.press("Enter");
            await click(page.getByTitle("Bullet List"));
            await hold(150);
            await page.keyboard.type("Deploy to Vercel", { delay: 42 });
            await page.keyboard.press("Enter");
            await click(page.getByTitle("Bold"));
            await hold(150);
            await page.keyboard.type("Run the final tests", { delay: 42 });
            await click(page.getByTitle("Bold"));
            await hold(150);
            await page.keyboard.press("Enter");
            await page.keyboard.type("Share the demo", { delay: 42 });
            await hold(1200);
            await click(page.getByRole("button", { name: "Save Note" }));
            await page.locator("h3", { hasText: "Launch checklist" }).waitFor();
            await page.locator(".ProseMirror").waitFor({ state: "detached" });
            await hold(1800);
        });

        await scene("desktop", "organize", "Stay organized", "Pin what matters, search instantly and sort your way", "/", async () => {
            const card = page.locator("h3", { hasText: "Interview prep" }).locator("xpath=..");
            await click(card.getByTitle("Pin Note"));
            await page.getByText("Note Pinned").first().waitFor();
            await hold(1500);
            const search = page.getByPlaceholder("Search notes...");
            await type(search, "meeting", 90);
            await hold(1500);
            await page.keyboard.press("Control+A");
            await page.keyboard.press("Backspace");
            await hold(800);
            await moveTo(page.locator("select"));
            await page.locator("select").selectOption("created");
            await hold(1400);
        });

        const cardMenu = async (title) => {
            const heading = page.locator("h3", { hasText: title }).first();
            await moveTo(heading);
            await hold(300);
            await click(heading.locator("xpath=..").locator("button").nth(1));
            await hold(350);
        };
        await scene("desktop", "edit", "Edit and delete", "Changes save instantly, and deleting asks you to confirm first", "/", async () => {
            await cardMenu("Reading list");
            await click(page.getByText("Edit Note", { exact: true }));
            await page.locator(".ProseMirror").waitFor();
            await hold(800);
            await click(page.getByPlaceholder("Note Title"));
            await page.keyboard.press("End");
            await page.keyboard.type(" for 2027", { delay: 60 });
            await hold(600);
            await click(page.getByRole("button", { name: "Save Note" }));
            await page.locator("h3", { hasText: "Reading list for 2027" }).waitFor();
            await page.locator(".ProseMirror").waitFor({ state: "detached" });
            await hold(1200);
            await cardMenu("Grocery list");
            await click(page.getByText("Delete Note", { exact: true }));
            await hold(1300);
            await click(page.getByRole("button", { name: /^delete/i }).last());
            await page.locator("h3", { hasText: "Grocery list" }).waitFor({ state: "detached" });
            await hold(1600);
        });

        await scene("desktop", "reset", "Recover your account", "Emailed reset links that work once and expire in 10 minutes", "/forgot-password", async () => {
            await click(page.locator("nav button").last());
            await hold(500);
            await click(page.getByText("Logout"));
            await page.waitForURL("**/login");
            await hold(900);
            await click(page.getByText("Forgot password?"));
            // An unregistered address, so no real email gets sent
            await type(page.getByPlaceholder("Enter your registered email"), "someone@example.com");
            await hold(300);
            await click(page.locator("button[type=submit]"));
            await page.getByText("If that email is registered").first().waitFor();
            await hold(2000);
        });
        await desktop.stopRecording();
        await desktop.context.close();

        const phone = await openView(browser, "phone", { viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 }, true);
        const session = await api("/users/login", "POST", { email: DEMO.email, password: DEMO.password });
        await phone.page.goto(SITE);
        await phone.page.evaluate((value) => localStorage.setItem("userInfo", value), JSON.stringify(session));
        await phone.page.goto(SITE);
        await phone.page.locator("h3", { hasText: "Project roadmap" }).waitFor();
        await hold(1500);
        await phone.startRecording();
        await hold(400);
        await scene("phone", "phone", "Works on your phone", "The same notes, in a layout built for small screens", "/", async () => {
            await hold(900);
            await phone.page.mouse.move(195, 500);
            for (let i = 0; i < 26; i++) {
                await phone.page.mouse.wheel(0, 18);
                await hold(30);
            }
            await hold(700);
            for (let i = 0; i < 26; i++) {
                await phone.page.mouse.wheel(0, -18);
                await hold(30);
            }
            await hold(400);
            await phone.type(phone.page.getByPlaceholder("Search notes..."), "road", 110);
            await hold(1200);
            await phone.page.keyboard.press("Control+A");
            await phone.page.keyboard.press("Backspace");
            await hold(600);
            await phone.click(phone.page.getByText("New Note"));
            await phone.page.locator(".ProseMirror").waitFor();
            await hold(1500);
        });
        await phone.stopRecording();
        await phone.context.close();

        // Keep only the frames each scene needs, in the data file the video reads
        const keep = (view) => view.frames;
        const data = { segments, frames: { desktop: keep(desktop), phone: keep(phone) } };
        fs.writeFileSync(path.join(VIDEO_ROOT, "src", "demo", "capture-data.json"), JSON.stringify(data));
        console.log(`frames: desktop ${desktop.frames.length}, phone ${phone.frames.length}`);
    } finally {
        await browser.close().catch(() => {});
        if (created) {
            const found = await users.findOne({ email: DEMO.email });
            if (found) {
                const removedNotes = await notes.deleteMany({ user: found._id });
                const removedUsers = await users.deleteOne({ _id: found._id });
                console.log(`cleanup: removed ${removedUsers.deletedCount} demo user, ${removedNotes.deletedCount} notes`);
            }
        }
        await mongoose.disconnect();
    }
};

main().catch((error) => {
    console.error("CAPTURE FAILED:", error.message);
    process.exit(1);
});
