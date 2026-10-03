import type { NovelScenario, SceneControlEvent } from "../types";

// =============================================================
// ノベルシナリオデータ — プロトタイプテスト用
// 七海のホワイトニングシーン（多言語キー・3D演出・時間トリガー完備）
// =============================================================

/** 共通で使う演出イベントヘルパー */
function motionEvent(
  target: string,
  startAt: number,
  motionState: string
): SceneControlEvent {
  return {
    type: "MOTION_SWITCH",
    target,
    timing: { startAt },
    payload: { motionState },
  };
}

const scenarios: Record<string, NovelScenario> = {
  /**
   * ── intro：歯科クリニック 待合室 ──
   * 七海がホワイトニング3回目の感想を求める
   * テキスト後半で選択肢が出現
   */
  whitening_intro: {
    id: "whitening_intro",
    steps: [
      // Step 0: 地の文（クリニックの待合室）
      {
        speakerKey: null,
        textKey: "text.intro_01",
        voiceUrl: "v_nanami_01.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.3, neutral: 0.7 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_daily",
        },
        events: [
          motionEvent("nanami", 1.2, "speaking_hand_wave"),
          // SE: 待合室の環境音（0秒後）
          {
            type: "PLAY_SE",
            target: "env",
            timing: { startAt: 0.0 },
            payload: { seId: "se_clinic_ambient" },
          },
        ],
      },
      // Step 1: 七海のセリフ（聞いてる？）
      {
        speakerKey: "speaker.nanami",
        textKey: "text.intro_02",
        voiceUrl: "v_nanami_02.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.6, smile: 0.2 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "surprised", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_daily",
        },
        events: [
          motionEvent("nanami", 0.5, "speaking_hand_wave"),
          {
            type: "TRANSITION",
            target: "Camera",
            timing: { startAt: 0.8, duration: 0.3 },
            payload: { fov: 75 },
          },
        ],
      },
      // Step 2: 徹の返答
      {
        speakerKey: "speaker.togawa",
        textKey: "text.intro_03",
        voiceUrl: "v_togawa_01.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.1, surprise: 0.0 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_daily",
        },
        events: [],
      },
      // Step 3: 七海、じっと見つめる
      {
        speakerKey: "speaker.nanami",
        textKey: "text.intro_04",
        voiceUrl: "v_nanami_03.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.3, neutral: 0.5, smile: 0.0 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_daily",
        },
        events: [
          {
            type: "LIP_SYNC_START",
            target: "nanami",
            timing: { startAt: 0.3 },
            payload: { audioId: "v_nanami_03.mp3", start_time: 0.3 },
          },
        ],
      },
      // Step 4: 七海、視線をそらす
      {
        speakerKey: "speaker.nanami",
        textKey: "text.intro_05",
        voiceUrl: "v_nanami_04.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_lookaway",
              facialBlendShape: { angry: 0.3, neutral: 0.5 },
              position: [-0.05, 0, 0],
              motionState: "idle",
              portrait: { expression: "angry", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_daily",
        },
        events: [
          motionEvent("nanami", 0.4, "turn_away"),
        ],
      },
      // Step 5: 七海、ごまかす
      {
        speakerKey: "speaker.nanami",
        textKey: "text.intro_06",
        voiceUrl: "v_nanami_05.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.7, angry: 0.0 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_daily",
        },
        events: [
          motionEvent("nanami", 0.6, "speaking_hand_wave"),
        ],
      },
      // Step 6: 地の文（選択肢直前）
      {
        speakerKey: null,
        textKey: "text.intro_07",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.1, neutral: 0.8 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_daily",
        },
        events: [],
        // 💡 選択肢！
        choices: [
          {
            choiceId: "ch_whitening_a",
            textKey: "choice.reply_yes",
            nextScenarioId: "whitening_route_a",
          },
          {
            choiceId: "ch_whitening_b",
            textKey: "choice.reply_no",
            nextScenarioId: "whitening_route_b",
          },
        ],
      },
    ],
  },

  /**
   * ── route_a：綺麗になったねルート ──
   */
  whitening_route_a: {
    id: "whitening_route_a",
    steps: [
      {
        speakerKey: "speaker.nanami",
        textKey: "text.route_a_01",
        voiceUrl: "v_nanami_06.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.9, surprise: 0.0 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: {
                expression: "smile",
                lighting: "normal",
                effects: [],
                video: { src: "video/smile.webm", mode: "oneshot" },
              },
            },
          ],
          currentBgmId: "bgm_happy",
        },
        events: [
          motionEvent("nanami", 0.5, "speaking_hand_wave"),
          {
            type: "TRANSITION",
            target: "bgm",
            timing: { startAt: 0.0, duration: 1.0 },
            payload: { bgmId: "bgm_happy" },
          },
        ],
      },
      {
        speakerKey: null,
        textKey: "text.route_a_02",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.7, neutral: 0.3 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_happy",
        },
        events: [
          {
            type: "CAMERA_CUT",
            target: "Camera",
            timing: { startAt: 1.0, duration: 0.5 },
            payload: { fov: 60, angle: "closeup_nanami" },
          },
        ],
      },
      {
        speakerKey: "speaker.nanami",
        textKey: "text.route_a_03",
        voiceUrl: "v_nanami_07.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.5, neutral: 0.4 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_happy",
        },
        events: [],
      },
      {
        speakerKey: "speaker.togawa",
        textKey: "text.route_a_04",
        voiceUrl: "v_togawa_02.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.6, neutral: 0.3 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_happy",
        },
        events: [],
      },
    ],
  },

  /**
   * ── route_b：じっと見つめるルート ──
   */
  whitening_route_b: {
    id: "whitening_route_b",
    steps: [
      {
        speakerKey: "speaker.nanami",
        textKey: "text.route_b_01",
        voiceUrl: "v_nanami_08.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.8, angry: 0.2, smile: 0.0 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "surprised", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_tension",
        },
        events: [
          motionEvent("nanami", 0.3, "step_back"),
          {
            type: "TRANSITION",
            target: "bgm",
            timing: { startAt: 0.0, duration: 0.8 },
            payload: { bgmId: "bgm_tension" },
          },
          // SE: 緊張演出のスティンガー
          {
            type: "PLAY_SE",
            target: "sfx",
            timing: { startAt: 0.2 },
            payload: { seId: "se_horror_sting" },
          },
        ],
      },
      {
        speakerKey: null,
        textKey: "text.route_b_02",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_lookaway",
              facialBlendShape: { angry: 0.6, surprise: 0.3 },
              position: [-0.1, 0, 0],
              motionState: "idle",
              portrait: { expression: "angry", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_tension",
        },
        events: [
          {
            type: "CAMERA_CUT",
            target: "Camera",
            timing: { startAt: 0.5, duration: 0.4 },
            payload: { fov: 70, angle: "side_nanami" },
          },
        ],
      },
      {
        speakerKey: "speaker.nanami",
        textKey: "text.route_b_03",
        voiceUrl: "v_nanami_09.mp3",
        visualState: {
          backgroundId: "bg_dentist",
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_walk",
              facialBlendShape: { angry: 0.4, neutral: 0.4 },
              position: [-0.3, 0, 0],
              motionState: "walking",
              portrait: { expression: "angry", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: "bgm_tension",
        },
        events: [
          motionEvent("nanami", 0.2, "walking"),
        ],
      },
    ],
  },

  // ── NPC 会話：通行人 ──
  npc_talk_passerby: {
    id: "npc_talk_passerby",
    steps: [
      {
        speakerKey: "speaker.passerby",
        textKey: "npc.passerby_01",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            { characterId: "passerby", poseId: "stand_idle", facialBlendShape: {}, position: [0, 0, 0], motionState: "idle" },
          ],
          currentBgmId: null,
        },
      },
      {
        speakerKey: null,
        textKey: "npc.passerby_02",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            { characterId: "passerby", poseId: "stand_idle", facialBlendShape: {}, position: [0, 0, 0], motionState: "idle" },
          ],
          currentBgmId: null,
        },
      },
    ],
  },

  // ── アパート：歯ブラシシーン ──
  apartment_toothbrush: {
    id: "apartment_toothbrush",
    steps: [
      // Step 0: 地の文（洗面台を見る）
      {
        speakerKey: null,
        textKey: "apt.toothbrush_01",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            { characterId: "togawa", poseId: "stand_idle", facialBlendShape: {}, position: [0, 0, 0], motionState: "idle" },
          ],
          currentBgmId: null,
        },
      },
      // Step 1: 徹の内心（認知侵食の気づき）
      {
        speakerKey: "speaker.togawa",
        textKey: "apt.toothbrush_02",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            { characterId: "togawa", poseId: "stand_idle", facialBlendShape: {}, position: [0, 0, 0], motionState: "idle" },
          ],
          currentBgmId: null,
        },
      },
    ],
  },

  // ── NPC 会話：コンビニ店員 ──
  npc_talk_shopkeeper: {
    id: "npc_talk_shopkeeper",
    steps: [
      {
        speakerKey: "speaker.shopkeeper",
        textKey: "npc.shopkeeper_01",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            { characterId: "shopkeeper", poseId: "stand_idle", facialBlendShape: {}, position: [0, 0, 0], motionState: "idle" },
          ],
          currentBgmId: null,
        },
      },
      {
        speakerKey: null,
        textKey: "npc.shopkeeper_02",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            { characterId: "shopkeeper", poseId: "stand_idle", facialBlendShape: {}, position: [0, 0, 0], motionState: "idle" },
          ],
          currentBgmId: null,
        },
      },
    ],
  },

  // =================================================================
  // prologue — ゲーム開始時の回想プロローグ
  // シーン1: ベランダ・2019年夏・台風の夜
  // シーン2: 事件3ヶ月後・写真の真実
  // シーン4: タイムライン直後・七海との再会
  // =================================================================
  prologue: {
    id: "prologue",
    steps: [
      // ── シーン1: ベランダ・夏・台風の夜 ──

      // Step 0: 冒頭ナレーション（空、嵐）— シーン1 スチル開始
      {
        speakerKey: null,
        textKey: "prologue.s1_01",
        still: { id: "s1_balcony_night", color: "#0d1420", label: "ベランダ・台風の夜" },
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 1: 七海の声（室内から）
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s1_02",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { angry: 0.3, smile: 0.0 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "angry", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 2: ト書き（タイピング音だけ）
      {
        speakerKey: null,
        textKey: "prologue.s1_03",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 3: 七海、捨て台詞
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s1_04",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { angry: 0.6 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "angry", lighting: "normal", effects: ["anger"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 4: ト書き（徹、手伝い）
      {
        speakerKey: null,
        textKey: "prologue.s1_05",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.3 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "surprised", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 5: 徹のセリフ
      {
        speakerKey: "speaker.togawa",
        textKey: "prologue.s1_06",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.1, neutral: 0.7 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 6: 七海、空を指す
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s1_07",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.7 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 7: 徹、見上げる（無言）
      {
        speakerKey: "speaker.togawa",
        textKey: "prologue.s1_08",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.5 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 8: 七海「残ってて」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s1_09",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.9 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: ["blush"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 9: セルフィーナレーション
      {
        speakerKey: null,
        textKey: "prologue.s1_10",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 1.0 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: ["blush"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 10: 七海「見てみて」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s1_11",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.9 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: ["blush"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 11: 徹「……っ」
      {
        speakerKey: "speaker.togawa",
        textKey: "prologue.s1_12",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.7 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 12: 七海「なんで笑えてないんだよ」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s1_13",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.5 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "troubled", lighting: "normal", effects: ["blush"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 13: ズームナレーション（歯の真実・前半）
      {
        speakerKey: null,
        textKey: "prologue.s1_14",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.8 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },

      // ── 場面転換：3ヶ月後 ── 暗転
      {
        speakerKey: null,
        textKey: "prologue.break_3months",
        still: { id: "blackout", color: "#000000", label: "暗転" },
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },

      // ── シーン2: 徹の部屋・事件から3ヶ月後 ──

      // Step 15: 骨壷のある部屋 — シーン2 スチル（重い午後）
      {
        speakerKey: null,
        textKey: "prologue.s2_01",
        still: { id: "s2_room_grief", color: "#080b14", label: "事件後の部屋" },
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 16: 写真アプリを開く
      {
        speakerKey: null,
        textKey: "prologue.s2_02",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 17: iCloudメッセージ（システム風）
      {
        speakerKey: "speaker.narrator",
        textKey: "prologue.s2_03",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 18: 最適化完了・ズーム
      {
        speakerKey: null,
        textKey: "prologue.s2_04",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 19: 徹「……なんだ、これ」
      {
        speakerKey: "speaker.togawa",
        textKey: "prologue.s2_05",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 20: 完璧な歯・記憶の疑念
      {
        speakerKey: null,
        textKey: "prologue.s2_06",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
      // Step 21: 意識が溶ける
      {
        speakerKey: null,
        textKey: "prologue.s2_07",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },

      // ── 場面転換：タイムライン直後 ── 暗転
      {
        speakerKey: null,
        textKey: "prologue.break_timeline",
        still: { id: "blackout", color: "#000000", label: "暗転" },
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },

      // ── シーン4: 2019年夏・タイムライン直後 ──

      // Step 23: 匂いに気づく — タイムリープ直後（暗転から暖色へ）
      {
        speakerKey: null,
        textKey: "prologue.s4_01",
        still: { id: "s4_return_warm", color: "#1a1008", label: "タイムリープ直後・朝の光" },
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.5 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 24: 七海「おはよう！」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s4_02",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.7 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 25: 日付確認ナレーション
      {
        speakerKey: null,
        textKey: "prologue.s4_03",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.5 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 26: 七海「何やってんの」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s4_04",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.3 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "troubled", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 27: ナレーション「生きていた」— スチル消去→3Dシーンが現れる
      {
        speakerKey: null,
        textKey: "prologue.s4_05",
        still: null,
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.6 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 28: 七海「……っ、どうしたの！？」（抱擁）
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s4_06",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.7 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "surprised", lighting: "normal", effects: ["blush", "surprise"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 29: 徹「……何もない」
      {
        speakerKey: "speaker.togawa",
        textKey: "prologue.s4_07",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.3 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "troubled", lighting: "normal", effects: ["blush"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 30: 七海「なんかあったの？」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s4_08",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.2 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "troubled", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 31: 七海「歯医者キャンセルする？」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s4_09",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { neutral: 0.7 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 32: 徹「……頼む」
      {
        speakerKey: "speaker.togawa",
        textKey: "prologue.s4_10",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { neutral: 0.6 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 33: 七海「え？ホワイトニング3回目」
      {
        speakerKey: "speaker.nanami",
        textKey: "prologue.s4_11",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.4 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "surprised", lighting: "normal", effects: ["question"] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 34: 徹「……キャンセルしろ」
      {
        speakerKey: "speaker.togawa",
        textKey: "prologue.s4_12",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { surprise: 0.3 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "neutral", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 35: ナレーション「了解した七海の声だけが残った」
      {
        speakerKey: null,
        textKey: "prologue.s4_13",
        visualState: {
          backgroundId: null,
          activeCharacters: [
            {
              characterId: "nanami",
              poseId: "stand_idle",
              facialBlendShape: { smile: 0.3 },
              position: [0, 0, 0],
              motionState: "idle",
              portrait: { expression: "smile", lighting: "normal", effects: [] },
            },
          ],
          currentBgmId: null,
        },
      },
      // Step 36（最終）: ナレーション・プロローグ締め
      {
        speakerKey: null,
        textKey: "prologue.s4_14",
        visualState: {
          backgroundId: null,
          activeCharacters: [],
          currentBgmId: null,
        },
      },
    ],
  },
};

export function getScenarioById(id: string): NovelScenario | undefined {
  return scenarios[id];
}

export function getAllScenarioIds(): string[] {
  return Object.keys(scenarios);
}