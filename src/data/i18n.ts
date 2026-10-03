// =============================================================
// i18n — ノベルパート用 多言語辞書（日本語/英語）
// プロトタイプテスト用モックデータ
// =============================================================

export type Language = "ja" | "en";

const dictionaries: Record<Language, Record<string, string>> = {
  ja: {
    // スピーカー名
    "speaker.nanami": "七海",
    "speaker.togawa": "徹",
    "speaker.narrator": "",

    // intro — ホワイトニングシーン
    "text.intro_01": "ホワイトニング今日で３回目なんだけど、どう？",
    "text.intro_02": "……って、聞いてる？",
    "text.intro_03": "ああ、綺麗になってるよ。前からそうじゃなかったっけ？",
    "text.intro_04": "…………（じっと見つめてくる）",
    "text.intro_05": "……別に。なんでもない。",
    "text.intro_06": "そう？ならいいけどさ！",
    "text.intro_07": "（何か言おうとして、やめた。）",

    // 選択肢
    "choice.reply_yes": "（綺麗になってるね、と微笑む）",
    "choice.reply_no": "（じっと口元を見つめる）",

    // route_a（綺麗ルート）
    "text.route_a_01": "やった！やっぱり通った甲斐があったなー！",
    "text.route_a_02": "七海は嬉しそうに笑った。その笑顔を見て、俺もなぜかほっとする。",
    "text.route_a_03": "「次の予約、再来週なんだけどさ、付き合ってくんない？」",
    "text.route_a_04": "「……ああ、いいよ」",

    // route_b（沈黙ルート）
    "text.route_b_01": "な、何よ……そんなに見つめられると緊張するじゃん。",
    "text.route_b_02": "七海は顔を赤らめて、そっぽを向いた。",
    "text.route_b_03": "「別に……ただ、その……」\n「もういい！ 行くよ！」",

    // NPC 会話 — 通行人
    "speaker.passerby": "通行人",
    "npc.passerby_01": "あ……すみません、ちょっと通りますね。",
    "npc.passerby_02": "（彼女はこちらを一瞥し、足早に去って行った。）",

    // NPC 会話 — コンビニ店員
    "speaker.shopkeeper": "店員",
    "npc.shopkeeper_01": "いらっしゃいませ。ポイントカードはお持ちですか？",
    "npc.shopkeeper_02": "（彼はいつもと変わらない笑顔で、レジに戻った。）",

    // アパート — 歯ブラシシーン
    "apt.toothbrush_01": "アパートに帰る。七海の歯ブラシがない。\nいつからなかったのか、思い出せない。",
    "apt.toothbrush_02": "……おかしい。\n俺は、昨日まで覚えていたはずだ。\n測るたびに、何かが削れている気がする。\n世界じゃない。俺の方が。",

    // ── プロローグ ────────────────────────────────────────────────

    // シーン1：ベランダ・2019年夏・台風の夜
    "prologue.s1_01": "空は暗いほどに濃い藍が混ざり渡っていた。\n強風が吹き荒れ、ベランダの物干し竿がハンガーごとポールにぶつかり、金属音を立てて揺れる。",
    "prologue.s1_02": "ねえ～、会場選び、一緒に行くって言ったじゃん！ 会場は費用対効果とアクセス利便性を比較検討して、上位3件に絞り込んだけど……仕事ならなんだって──",
    "prologue.s1_03": "室内のデスクから、PCを叩く徹の無機質なタイミング音だけが返ってくる。",
    "prologue.s1_04": "……効率が悪いよこれ、だったらもっと頭使ってよ！！ 少し頭冷まします！",
    "prologue.s1_05": "言い捨ててシャットした七海の、もう一度強い突風がベランダのハンガーと洗濯物を奪おうとする。そこへ室内から無言で歩み出てきた徹の手が伸びた。",
    "prologue.s1_06": "今日は強風警報が出てたけど、正直に干したかったんだろ。",
    "prologue.s1_07": "わかってる！ でも今日こんなに空が綺麗なんだ！",
    "prologue.s1_08": "……",
    "prologue.s1_09": "残ってて、徹！",
    "prologue.s1_10": "スマートフォンを取り出した七海が、徹の長い肩越しにカメラのレンズをふたりに向ける。\n画面の中の七海は、風で髪がめちゃめちゃに乱れながら、満面の笑みを浮かべていた。\n徹はいつも笑うのが難しい顔のままだったが、その口元は、ほんのわずか緩んでいた。",
    "prologue.s1_11": "見てみて～",
    "prologue.s1_12": "……っ",
    "prologue.s1_13": "なんで笑えてないんだよ",
    "prologue.s1_14": "ズームすると笑った七海の口元が、ほんの少しだけ外側に傾いた、小さな笑歯の白い先端が見えていた。",

    // 場面転換テキスト
    "prologue.break_3months": "──　3ヶ月後　──",
    "prologue.break_timeline": "──　タイムライン直後　──",

    // シーン2：徹の部屋・事件から3ヶ月後
    "prologue.s2_01": "何もない午後が続く部屋。\nダイニングテーブルに、七海がいつも座っていた椅子の前に、骨壷を置いてある。\n徹は一度もその椅子に座っていない。",
    "prologue.s2_02": "徹は、無意識にスマートフォンの写真アプリを開いていた。\nその夏の終わりに残った、最後のセルフィー写真。",
    "prologue.s2_03": "「写真ライブラリの自動最適化を実行します。iCloudストレージの容量を節約するため、古い写真を高解像度版に置き換えます。」",
    "prologue.s2_04": "アイコンが止まる。\n「写真ライブラリの自動最適化完了。」\n\n徹の指が止まる。タップアウトして、七海の顔を拡大した。\n画面のピクセルがざらざらと補正され、AIによって、滑らかな高画質へと上書きされていく。",
    "prologue.s2_05": "……なんだ、これ",
    "prologue.s2_06": "七海の顔だけは間違いないのに、その口元が──\nまるで修正されて矯正されたかのように、完璧に揃った白い歯が並んでいた。\n\n……俺の記憶は、疲労で消し替わっていたのか？",
    "prologue.s2_07": "頭の中で、何かが逆転する感覚。スマホを握ったまま、意識が溶ける。",

    // シーン4：2019年夏・タイムライン直後
    "prologue.s4_01": "最初に気づいたのは、匂いだった。\n洗濯物の柔軟剤の香り。七海が選んだ色のタオル。\n\n徹は立っていた。同じ部屋、同じ空間。\nただ、3ヶ月後から明らかに、つやと生気が戻っていた。",
    "prologue.s4_02": "おはよう！ 冷蔵庫なにもないよ、今日スーパー行こっか",
    "prologue.s4_03": "スマホの画面を確認する。\n日付　──　2019年8月。\n\n……3ヶ月、巻き戻っていた。",
    "prologue.s4_04": "ちょっとどうしたのその日に座って場合がないんだけど……お腹すいたね",
    "prologue.s4_05": "七海はよく見えていた。生きていた。",
    "prologue.s4_06": "……っ、どうしたの！？",
    "prologue.s4_07": "……何もない。",
    "prologue.s4_08": "なんかあったの？",
    "prologue.s4_09": "今日は歯医者の予約あるけど、キャンセルする？",
    "prologue.s4_10": "……頼む。",
    "prologue.s4_11": "え？ なんでよ、ホワイトニング今日で3回目なんだけど。",
    "prologue.s4_12": "……キャンセルしろ。",
    "prologue.s4_13": "了解した七海の声だけが、部屋に残った。",
    "prologue.s4_14": "でも、キャンセルすればいい、と思っていたわけじゃなかった。\nそのことは、まだ俺にもよくわからなかった。",
  },
  en: {
    // speaker names
    "speaker.nanami": "Nanami",
    "speaker.togawa": "Toru",
    "speaker.narrator": "",

    // intro — Whitening scene
    "text.intro_01": "This is my third whitening treatment. How does it look?",
    "text.intro_02": "……Hey, are you listening?",
    "text.intro_03": "Yeah, it looks great. Hasn't it always been that way?",
    "text.intro_04": "…………（She stares at me intently）",
    "text.intro_05": "……It's nothing. Never mind.",
    "text.intro_06": "Really? Well, good then!",
    "text.intro_07": "（I tried to say something, but stopped.）",

    // choices
    "choice.reply_yes": "（Smile and tell her she looks beautiful）",
    "choice.reply_no": "（Stare at her lips intently）",

    // route_a
    "text.route_a_01": "Yes! I'm glad I went through with it!",
    "text.route_a_02": "Nanami smiled happily. Seeing that smile, I somehow felt relieved.",
    "text.route_a_03": "My next appointment is the week after next. Will you come with me?",
    "text.route_a_04": "……Yeah, sure.",

    // route_b
    "text.route_b_01": "W-What? You're staring at me like that, it makes me nervous.",
    "text.route_b_02": "Nanami's face turned red as she looked away.",
    "text.route_b_03": "\"It's nothing... just...\"\n\"Forget it! Let's go!\"",

    // NPC conversations — passerby
    "speaker.passerby": "Passerby",
    "npc.passerby_01": "Oh… sorry, coming through.",
    "npc.passerby_02": "(She glanced over and hurried on her way.)",

    // NPC conversations — convenience store clerk
    "speaker.shopkeeper": "Clerk",
    "npc.shopkeeper_01": "Welcome. Do you have a points card?",
    "npc.shopkeeper_02": "(He smiled the same smile as always and returned to the register.)",

    // Apartment — toothbrush scene
    "apt.toothbrush_01": "I return to the apartment. Nanami's toothbrush is gone.\nI can't remember when it disappeared.",
    "apt.toothbrush_02": "……Something's wrong.\nI know I remembered it until yesterday.\nEvery time I measure something, I feel something being erased.\nNot the world. Me.",

    // ── Prologue ──────────────────────────────────────────────────

    // Scene 1: Balcony, summer 2019, typhoon night
    "prologue.s1_01": "The sky had turned a dark, dense indigo.\nA fierce wind tore through the balcony, sending the laundry poles and hangers clattering together with a metallic ring.",
    "prologue.s1_02": "Hey~ You said you'd come look at venues together! I narrowed it down to three, comparing cost-effectiveness and access — but if it's work, you'd just say——",
    "prologue.s1_03": "From the desk inside, only the hollow rhythm of Toru's keyboard returned.",
    "prologue.s1_04": "This is so inefficient, use your brain a little!! I'm getting some air!",
    "prologue.s1_05": "Nanami snapped the door shut, and the next gust tried to rip the laundry clean off the pole. Toru stepped out wordlessly and grabbed both ends of the rack, clipping the clothes back in place.",
    "prologue.s1_06": "The strong-wind warning was out today. But you hung them anyway.",
    "prologue.s1_07": "I know! But the sky is so beautiful tonight!",
    "prologue.s1_08": "……",
    "prologue.s1_09": "Stay, Toru!",
    "prologue.s1_10": "Nanami pulled out her phone and turned the camera toward them both.\nIn the preview, her hair was a wild mess in the wind, but her smile was wide and full.\nToru's face was still its usual hard-to-read self — but the corner of his mouth had given just a little.",
    "prologue.s1_11": "Look, look~",
    "prologue.s1_12": "……",
    "prologue.s1_13": "Why aren't you smiling?",
    "prologue.s1_14": "Zoomed in, you could see Nanami's smile from the corner: a tiny flash of white at the edge, her tooth peeking just slightly outward.",

    // Scene break cards
    "prologue.break_3months": "── Three Months Later ──",
    "prologue.break_timeline": "── After the Timeline ──",

    // Scene 2: Toru's room, three months after the incident
    "prologue.s2_01": "A heavy afternoon that never ends.\nOn the dining table, in front of the chair where Nanami always sat, there is an urn.\nToru has not sat in that chair once.",
    "prologue.s2_02": "Toru found himself opening the photo app without thinking.\nThe last selfie from the end of that summer.",
    "prologue.s2_03": "\"Optimizing your photo library. To save iCloud storage space, older photos will be replaced with high-resolution versions.\"",
    "prologue.s2_04": "The icon paused.\n\"Photo library optimization complete.\"\n\nToru's finger stopped. He tapped out and zoomed in on Nanami's face.\nThe pixels began to correct and sharpen, overwritten by the AI into smooth, high-resolution clarity.",
    "prologue.s2_05": "……What is this.",
    "prologue.s2_06": "The face was undeniably hers — but her mouth.\nA row of perfectly straight, perfectly white teeth. As if corrected. As if never misaligned.\n\n……Was my memory just overwritten by exhaustion?",
    "prologue.s2_07": "Something inverted inside his head. Phone still in hand, his consciousness began to dissolve.",

    // Scene 4: Summer 2019, just after the timeline
    "prologue.s4_01": "The first thing he noticed was the smell.\nFabric softener. The color of towel Nanami had picked out.\n\nToru was standing. Same room, same space.\nBut the light and life that had drained away over three months — it was all back.",
    "prologue.s4_02": "Morning! There's nothing in the fridge, let's go to the supermarket today.",
    "prologue.s4_03": "He checked his phone.\nDate: August 2019.\n\n……Three months. He'd gone back three months.",
    "prologue.s4_04": "What are you just standing there for, I'm starving.",
    "prologue.s4_05": "Nanami was right there. Alive.",
    "prologue.s4_06": "……H-hey, what's going on?!",
    "prologue.s4_07": "……Nothing.",
    "prologue.s4_08": "Did something happen?",
    "prologue.s4_09": "You have a dentist appointment today, by the way. Should I cancel it?",
    "prologue.s4_10": "……Please.",
    "prologue.s4_11": "What? It's my third whitening session.",
    "prologue.s4_12": "……Cancel it.",
    "prologue.s4_13": "Only Nanami's voice remained in the room after that.",
    "prologue.s4_14": "But it wasn't as simple as \"cancel it and everything's fine.\"\nEven I didn't yet understand what it was I was actually trying to do.",
  },
};

/**
 * キーと言語を指定して翻訳テキストを取得
 * 見つからない場合はキー名をそのまま返す
 */
export function t(key: string, lang: Language): string {
  const dict = dictionaries[lang];
  if (!dict) return key;
  return dict[key] ?? key;
}