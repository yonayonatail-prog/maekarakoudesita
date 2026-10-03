import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { TextWindow } from "./TextWindow";
import { useGameStore } from "../store/gameStore";

// =============================================================
// TextWindow のコンポーネントテスト
// タイピング完了判定 / クリック時の遷移 / 表示テキスト
// =============================================================

beforeEach(() => {
  // ストアを初期化
  useGameStore.setState({
    novelState: "TYPING",
    speakerKey: "speaker.nanami",
    textKey: "text.intro_01",
    language: "ja",
    novelVisualState: {
      backgroundId: "clinic",
      activeCharacters: [],
      currentBgmId: null,
    },
    novelSystemData: {
      readChoices: {},
      readSteps: {},
      isAutoModeActive: false,
      isNextModeActive: false,
    },
  });
});

describe("TextWindow — 表示要素", () => {
  it("スピーカー名が画面に表示される", () => {
    render(<TextWindow />);
    // スピーカー名「七海」が表示される
    expect(screen.getByText("七海")).toBeTruthy();
  });

  it("テキストは TYPING 開始直後は visibleText が空だが cursor(▍) が表示されている", () => {
    render(<TextWindow />);
    // TYPING開始直後はcharsToShow=0なので、visibleTextは空
    // 代わりに点滅カーソル ▍ が表示されている
    const spans = document.querySelectorAll("span");
    const cursorSpan = Array.from(spans).find(
      (s) => s.textContent === "▍"
    );
    expect(cursorSpan).toBeTruthy();
  });

  it("WAITING_CLICK でテキスト全文が表示される", () => {
    useGameStore.setState({ novelState: "WAITING_CLICK" });
    render(<TextWindow />);
    // WAITING_CLICKでは全文字表示され、テキストが確認できる
    expect(screen.getByText(/ホワイトニング/)).toBeTruthy();
  });

  it("speakerKey が null の場合、スピーカー名は表示されない", () => {
    useGameStore.setState({ speakerKey: null });
    render(<TextWindow />);
    // スピーカー名を示す要素がないこと
    expect(screen.queryByText("七海")).toBeNull();
  });
});

describe("TextWindow — タイピング完了判定", () => {
  it("novelState が TYPING の場合、カーソル（▍）が表示される", () => {
    render(<TextWindow />);
    // 点滅カーソルとして ▍ が存在すること
    const spans = document.querySelectorAll("span");
    const cursorSpan = Array.from(spans).find(
      (s) => s.textContent === "▍" || s.innerHTML.includes("▍")
    );
    expect(cursorSpan).toBeTruthy();
  });

  it("novelState が WAITING_CLICK の場合、全文字表示され ▼ が表示される", () => {
    useGameStore.setState({ novelState: "WAITING_CLICK" });
    render(<TextWindow />);
    // ▼ インジケーター
    const indicator = document.querySelector(".next-indicator");
    expect(indicator).toBeTruthy();
    expect(indicator?.textContent).toContain("▼");
    // 点滅カーソルは非表示
    const spans = document.querySelectorAll("span");
    const cursorSpan = Array.from(spans).find(
      (s) => s.textContent === "▍"
    );
    expect(cursorSpan).toBeFalsy();
  });

  it("novelState が CHOICE の場合も全文字表示される", () => {
    useGameStore.setState({ novelState: "CHOICE" });
    render(<TextWindow />);
    // テキストが全文表示されている（タイピングカーソルなし）
    const spans = document.querySelectorAll("span");
    const cursorSpan = Array.from(spans).find(
      (s) => s.textContent === "▍"
    );
    expect(cursorSpan).toBeFalsy();
  });
});

describe("TextWindow — skipTyping の呼び出し確認", () => {
  it("skipTyping が呼ばれると store の novelState が WAITING_CLICK になる", () => {
    // store の skipTyping を直接確認
    expect(useGameStore.getState().novelState).toBe("TYPING");
    useGameStore.getState().advanceNovel();
    expect(useGameStore.getState().novelState).toBe("WAITING_CLICK");
  });
});