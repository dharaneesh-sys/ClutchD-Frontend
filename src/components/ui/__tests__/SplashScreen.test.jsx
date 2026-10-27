import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import SplashScreen from "../SplashScreen.js";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

describe("Task 9: blue splash", () => {
  it("always renders when mounted (callers gate on auth hydration)", () => {
    render(<SplashScreen />);
    expect(screen.getByRole("status", { name: "Loading ClutchD" })).toBeInTheDocument();
    expect(screen.getByText("ClutchD")).toBeInTheDocument();
    expect(screen.getByText("Doorstep Two-Wheeler Service & Spare Parts")).toBeInTheDocument();
  });

  it("uses splash tokens, no raw hex, and respects reduced motion", () => {
    const code = read("src/components/ui/SplashScreen.js");
    expect(code).toContain("var(--splash-bg)");
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(code).toContain("motion-reduce:animate-none");
    expect(code).not.toContain("_isRestoring");
  });

  it("native launch colour matches the in-app splash token", () => {
    const css = read("src/app/globals.css");
    const native = read("android/app/src/main/res/values/colors.xml");
    const nativeNight = read("android/app/src/main/res/values-night/colors.xml");
    const light = css.match(/:root\s*{[^}]*--splash-bg:\s*(#[0-9A-Fa-f]{6})/)[1];
    const dark = css.match(/\[data-theme="dark"\]\s*{[^}]*--splash-bg:\s*(#[0-9A-Fa-f]{6})/)[1];
    expect(native).toContain(`<color name="clutchd_splash_bg">${light}</color>`);
    expect(nativeNight).toContain(`<color name="clutchd_splash_bg">${dark}</color>`);
  });

  it("Android launch theme uses core-splashscreen attributes and installs it first", () => {
    const styles = read("android/app/src/main/res/values/styles.xml");
    for (const attr of [
      "windowSplashScreenBackground",
      "windowSplashScreenAnimatedIcon",
      "windowSplashScreenIconBackgroundColor",
      "postSplashScreenTheme",
    ]) {
      expect(styles).toContain(attr);
    }
    expect(styles).not.toContain("@drawable/splash");
    const main = read("android/app/src/main/java/com/clutchd/app/MainActivity.java");
    expect(main.indexOf("SplashScreen.installSplashScreen(this)")).toBeGreaterThan(-1);
    expect(main.indexOf("SplashScreen.installSplashScreen(this)")).toBeLessThan(
      main.indexOf("super.onCreate(savedInstanceState)")
    );
  });
});
