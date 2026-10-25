# MASTER PROJECT SUMMARY — Multi Channel Content Agent (v3.41)

**Purpose of this file:** a temporary continuity summary to attach alongside `Multi_Channel_Content_Agent.md` (v3.41) and `Channel_Insights.md` in a new chat. It is NOT part of the agent file and must never be merged into it. Regenerate it fresh (full history, not appended notes) whenever a new one is needed. Waqar's three files are: the agent file, Channel_Insights.md, and this summary.

**How to use it (for Claude in the new chat):** read this fully before acting; adopt the attached agent file as the current baseline (nothing is unreleased — v3.41 contains every edit applied so far; the memory block's fields in section 12 are a draft still to be refined by testing). Reply to Waqar in Roman Urdu.

---

## 1. Who and what

- **User:** Waqar Majeed (Lahore). Runs the Pakistani YouTube Shorts tech channel **IT Cafeteria** (also TikTok, handle @itcafeteria). All conversation in **Roman Urdu**. He dictates many messages (Urdu script) — answer in Roman Urdu.
- **Core artifact:** `Multi_Channel_Content_Agent.md` — master-prompt file governing AI video production in Google Flow (Gemini Omni Flash, scenes of 10 seconds).
- **Channels set up:** (1) IT Cafeteria — presenter Waqar Majeed, character tags @WM25-1 … @WM25-5, niche IT & Technology. (2) Beauty Hub with Mehr Zadi — tag @MZ22-1, niche Beauty & Grooming (9 categories). Only IT Cafeteria has fully documented identity (Sections 2–8); other channels share the same mechanical framework.
- **Current version:** v3.41 (v3.40 added the self-contained scenes and the YT Automation category; v3.41 added the duplicate check and the memory block). A file labelled "v3.41" from another chat that Waqar uploaded earlier is unrelated to our versions — ignore it. There is NO "Claude_Editing_Rules_Acknowledgement.md" file and no checkpoint rule (Waqar confirmed; dropped).

## 2. IT Cafeteria category list (v3.40 — 9 categories + Custom Search = 10 items)

1. AI & Smart Technology
2. AI Chatbots, Workflows & AI Tools
3. AI Prompt Hacks & Shortcuts
4. **PC & Windows Hacks** (merged in v3.39 from "Computer Tips & Tricks" and "Windows Tips & Tricks"; never-ending part-by-part series; Section 9.1 extended-length test format applies to the whole merged category — Waqar did not answer the option question, Claude applied its recommended option 1)
5. New Technology & Product Tutorials
6. Future Tech & Positive Breakthroughs
7. Secrets (WhatsApp, Google, Chrome, Maps, Gmail, Drive, Play Store, YouTube, Instagram, Facebook, TikTok, Telegram, Windows, ChatGPT, Gemini, CapCut) — hidden settings/features; when displayed, show the real tool list
8. Income & Skills: Tools That Earn — ideas-only money-angle category, still in testing (see 3b)
9. **YT Automation** (new in v3.40) — lecture-style course about YouTube automation, chapter by chapter, 16:9, Section 9.2; roadmap/progress in Channel_Insights.md section 9; NOT in the Routine rotation (picked manually); chapters 1–10 are covered, next is Chapter 11
10. Custom Search — outside the rotation

**Rotation covers categories 1–8 only.** Old chats used older numbering (before v3.39: Windows was 7, Secrets 8, Income 9, Custom 10). In a fresh chat the "last used category" should be given by NAME, not number.

**YouTube playlists:** playlist name = exact category title (category 7 = "Secrets", category 9 = "YT Automation"). In Waqar's YouTube Studio an empty playlist cannot be created, so a playlist appears at the first upload of its category. Custom Search has no playlist of its own: the agent names the most closely related category playlist, or the general **Digital Growth** playlist for YouTube-related or general digital-information topics. Waqar is combining "YT Step By Step" (24 videos) and "Digital Growth, YouTube & Content Strategy" (1 video) into Digital Growth himself; those are NOT categories (handled through Custom). Older course playlists (MS Excel 2013, MS Word 2013, Corel Draw v19 2017) stay untouched. New categories only if needed later.

**Playlists seen (Oct 20, 2026):** PC & Windows Hacks 12 · AI Chatbots, Workflows & AI Tools 10 · AI Prompt Hacks & Shortcuts 4 · AI & Smart Technology 10 · Power Automate 9 (series) · Whatsapp Business 7 (series) · whatsapp Tips & Tricks 10 (series; casing differs from "Whatsapp Business") · YT Step By Step 24 · Digital Growth, YouTube & Content Strategy 1 · Corel Draw 3 · MS Excel 5 · MS Word 15. Not yet created (no videos): New Technology & Product Tutorials, Future Tech & Positive Breakthroughs, Secrets, Income & Skills, YT Automation. Playlist analytics (Studio Analytics / Advanced mode, comparing playlists) is the intended way to measure category performance; one category playlist per video avoids double counting; series playlists are kept out of category comparisons.

## 3. Architecture rules

- **Global/mechanical edits** (workflow, scene system, pronunciation, research standard, Flow settings, duration, video types/CTA, scene format, thumbnail, upload package, quality checklist) apply to ALL channels. **Channel-specific edits** (identity, tags, studio/visual world, categories, free-first rule) stay in one channel. Claude flags Global vs channel-specific and anything that crosses from refinement into structural.
- **Startup (Section 0):** Q1 Channel → Q2 Niche → Q3 Character+Tag → Q4 Routine or Custom. IT Cafeteria and Beauty Hub fast-track. Selection points are **numbered lists** (question text unnumbered, options start at 1). Invalid input restarts from Q1.
- **CRITICAL block at the top of the agent file:** (1) every reply in Roman Urdu, no English headers/labels; (2) no scene-by-scene pagination — all scenes of a production part in one response, followed immediately by the thumbnail prompt and YouTube package.
- **Opening status block** lists Aspect Ratio (default Short 9:16, lecture series 16:9 — stated, not asked), Character-Variant Tag (rotation) and Category with number, title and playlist.
- **Reference line:** `Category: [number] — [title] | Playlist: [playlist name]` (Custom Search: `Category: Custom Search | Playlist: [closest playlist or Digital Growth] (sab se qareeb hone ki wajah se)`). Shown once above Scene 1 with the Story Title and again above the Title in the YouTube package. A label only — never pasted into Flow or YouTube — and not one of the 5 package items.
- **No Pre-Scene Story Intro (removed in v3.40):** Waqar generates scenes across several Flow profiles (about 3 scenes per profile because of credits, sometimes a single scene), so every scene must be self-contained and pasteable alone into any profile.
- **Rotation:** no memory between chats; last-used category/tag from the same chat's history, otherwise ask once. **Known leftover conflict (not changed):** Section 11.1's note says Custom mode asks 1a/1b/1c manually, while Section 11 Step 1 says aspect ratio and tag are automatic. In Waqar's v3.40 run the agent picked @WM25-1 in a fresh chat without asking the last-used tag. Proposed fix (section 12): in fresh chats ask once for the last-used tag in both modes.
- **Demonstration mode (universal):** character on screen only for Hook and CTA; middle scenes are full-screen practical screen-recording with the character's voice as narration; whatever the dialogue references must be shown exactly then.

## 3a. Length and scene count (Sections 9.1, 12, 13, 14)

- **Shorts:** scenes are 10 s each. Default **10 scenes (100 s)**, up to **15 scenes (150 s)**; never fewer than 10 unless the story genuinely doesn't need them, and then never fewer than **7**; a story that completes shorter is not padded. The same 10–15 scenes per production part apply to long-form/series parts.
- **Why:** TikTok Creator Rewards needs original videos of 60+ s; YouTube counts videos under 3 minutes as Shorts; Waqar trims only about 10–15 s in editing.
- **Long-form (5+ min):** total scenes = seconds ÷ 10, delivered in production parts of 10–15 scenes.
- Credits roughly 12–15 per scene (10–11 scenes ≈ 120–165; 15 scenes ≈ 180–225, approximate).
- **Check pending:** the reason that Pakistan may not be eligible for TikTok Creator Rewards (earlier research only) is not re-verified. Real lengths of published Shorts are mostly 0:30–2:02 (see Channel_Insights section 8).
- Dialogue pacing: the fill-the-window rule (22–25 words, no limit on number of phrases) already exists in Section 6.3; the "2 short phrases per scene" limit seen in another chat is not in the file.

## 3b. Category 8 — "Income & Skills: Tools That Earn" (still in testing)

- Ideas-only, money-angle category for a mixed audience (students after matric, job seekers, job holders, small traders, small and large businesses); AI tools play a supporting role.
- **Mandatory wording rules (in the file):** only ideas and possibilities ("aap bhi kar sakte hain", "ye mumkin hai", "mehnat karein to…"); never promise a result, income or salary; no figure presented as what the viewer will earn; others' success only as rounded, clearly approximate figures attributed to a researched source (otherwise no number), never "how fast" framing, never a guarantee; every episode states in the dialogue that results depend on the viewer's own effort (mehnat); no get-rich-quick/MLM/betting/crypto-doubling; verify platform, payment and price facts for Pakistan/viewer region; information and ideas, not financial advice.
- **Cross-reference rule:** point viewers generally to the channel's other tool videos; name a specific video only if listed in Channel_Insights.md section 8 or provided by Waqar.
- Never copy claims from infographics — verify pricing/free tier at the time of making.
- The same wording rules apply to YT Automation chapters about earning/affiliate/sponsorship/courses (chapters 16–18).

## 3c. Lecture series — category 9 "YT Automation" (Section 9.2)

- 16:9 by default (all other categories stay 9:16 Shorts); Flow video 16:9 x1 with the same 9:16 reference image.
- Structure per chapter: Hook → what the chapter covers → theory → practical demonstration (screen-recording rule) → recap → next-chapter CTA.
- **Roadmap first, no cap on chapters, Parts when a chapter doesn't fit** (each production part 10–15 scenes). Tag rotation is normal (@WM25-4 was only for Chapter 9). Facts verified per Section 10; voice-cloning chapters use only own/consented voices.
- **Progress lives in Channel_Insights.md section 9:** Chapters 1–10 covered (Chapters 9 and 10 done), **next is Chapter 11 (B-Roll Mastery & Generative AI Visuals)**; the 22-chapter, 6-module roadmap is there with details. If the file is not attached, the agent asks which chapter was last covered.

## 4. Scene format (v3.40)

Per scene, one block: (1) header line `Scene N — 10s [purpose]` (+ ` — CTA` after the bracket on a part's final scene); (2) fixed label line `Flow — Copy-Paste Script` (label only, never repeats scene number/purpose/bracket info — one header line + one label line, never two scene tags); (3) ONE flowing paragraph: action, expression, prop, hologram/demonstration placement, then the **fixed instruction lines** (plain sentences, no brackets, same in every scene) and the dialogue lead-in:
   - voice line: *"He speaks in his natural, warm, conversational Pakistani Urdu voice at a calm pace."* (she/her for a female presenter) — **on trial**
   - anti-repetition line: *"No word or syllable is repeated."* — **on trial**
   - only for 16:9 with a 9:16 reference: *"Keep the studio exactly as in the reference image; only extend it sideways for the wider frame."* — **on trial**
   - dialogue: `He says, [one mild delivery phrase per Section 6.3]: "…"` with a matching gesture.

**Naming rule:** scene direction refers to the character ONLY by tag (e.g. @WM25-2); never re-describe studio/identity/personality (Flow's "identity conflict / prominent people" rejection). Real names ARE allowed inside quoted dialogue. The fixed lines are instructions, not descriptions.

**Observations (Section 19.3):** starting at Scene 1 without any intro keeps character look, studio and voice right within one profile; after switching profile, studio and character stay right but the voice changes even with identical tag settings (cause unknown, the intro was not the cause). Suggested test: same scene in a second profile with and without the voice line.

**Tools, websites and channels protocol (Section 6.4):** names spoken in dialogue; scene direction describes what is shown (no person's name or personal channel name); crowded → "details description mein"; description lists exact name, link and steps. On-screen name labels and how Flow draws real interfaces are still being tested.

**Curiosity gap and retention loops (Section 18, all categories):** hook question; one middle-scene line promising the useful part, always delivered later in the same video (no clickbait); ending loops back to the hook / series continuation.

## 5. Research and the silent decision engine

- **Topic research (Section 10):** worldwide, authentic, trend-aware. **Outlier check:** prefer recent public videos/posts that beat their own channel's usual performance, never invent numbers. Custom mode: topics only *ordered* by momentum; Routine mode: agent picks, Decision Note states topic and why. For YT Automation the topic is the next roadmap chapter.
- **Step 4b:** silent working title + Scene 1 hook decision (3 candidates; formulas Mistake, Contrarian Flip, Reveal, Clock, Warning, Before/After, Comparison, sourced Statistic) using live research, `Channel_Insights.md` if provided, and built-in rules; only a one-line **Decision Note** (title, hook, reason, confidence Low/Medium/High) is shown; "change" overrides. Thin/missing insights = confidence Low.
- **Free-first tools (Section 8, all IT Cafeteria categories):** prefer 100% free/freemium/open-source/easily available tools; if paid, mention the free trial/tier/alternative; verify free-tier claims at the time of making.
- **Duplicate check (v3.41, Section 11 Step 2 + Decision Note):** with Channel_Insights section 8, pasted memory blocks or earlier stories of the same chat, a topic already covered (same tool + same feature) is not proposed (Custom marks it "pehle cover ho chuka", Routine skips it, series use only new points); the Decision Note shows "Naya" or "Pehle cover hua: [video/part]", or "library nahi mili, duplicate check nahi hua". Old library rows are approximate.

## 6. Dialogue rules (Sections 7, 6.3, 19.3, 20)

- Roman Urdu only, natural punctuation, **sentence case**. Hyphen splits a word into sound-parts only where mispronounced; acronyms hyphenated (A-I, Chat-G-P-T); ordinary English words (Gemini, Claude) stay plain. **Spelling fallback:** after two failed spellings replace the word with a synonym and log it.
- **Living list (confirmed in live tests; choose by meaning):** waq-t; Fikr; ak-sr; "turant" never written → usi waqt / isi waqt / for-rn; aesi (before a feminine noun) vs aesy ("in this way"); zaya (wasted) vs ze-ya (noun); avoid "sahi" → theek or durust; avoid standalone "Chat" → Chat-G-P-T; **v3.40 additions:** bara → barra (masc.) / barri (fem.); qaid → limit; ghaanton → ghanton; hal → tareeqa; pare → parre.
- **Repeat-prone words:** Gemini, dhoondna; alternates under test "Jemini", "talaash karna"; regenerate rather than patch when the repeat is inside one frame.
- **Length (6.3):** ~2.7 words/second → 22–25 words fill a 10-second scene; if the line ends early use "stays silent after the final word" and a non-speech sound, never new spoken words.
- **Quotes (19.3):** never nest double quotes; by default no inner quotes.
- **Emotion/delivery (trial):** short English phrase in the lead-in, no bracketed tags, no Roman Urdu in the direction, no extra description after the dialogue; one mild emotion per scene by purpose.
- Flow itself reportedly said to mention tags/"code words" for the voice; the file keeps an English delivery phrase and no bracketed tags (brackets may be spoken). Third-party Veo/Flow guides (not official) also say to describe voice/tone and use a "says:" format. Treat as trial.
- English dialogue (if ever added) would need its own Flow test.

## 7. Other settled decisions

- **Upload package (19.2), exactly 5 items after the final scene:** (1) Title + 3 hashtags (for 16:9 no #Shorts; a second topic hashtag instead), (2) Description (no hashtags, with a "PRACTICAL STEPS / COMMANDS" section when relevant; every tool/website/channel listed with exact name, link and steps), (3) YouTube Tags (near 500 characters), (4) TikTok title + hashtags block, (5) Thumbnail prompt (text only) last. The Reference line sits above item 1 as a label, and after item 5 comes the Memory block (also a label only, see section 12). Other Studio fields at YouTube defaults.
- **Thumbnail:** wow factor from background/hologram treatment, headline stays simple blue-gradient with plain brush-stroke sub-banner and simple cursive name tag; zone numbers 1–13 never leak into the prompt. Waqar sometimes generates the thumbnail just to see what a story's topic really is.
- Public-direct is default visibility; AI disclosure always mandatory; YouTube Studio Phase 3 is automated — stop and alert Waqar on any flagged issue.

## 8. Analytics (details live in Channel_Insights.md)

**YouTube, 28 days (Sep 21–Oct 18, 2026), confirmed by Waqar:** views 1,803; watch time 7.9 h (+195%); subscribers +8 (total 1,348); Shorts: 1.5K views, 662 engaged views, 40 likes. Top Shorts: Power Automate (137), Gemini Notebook (117), ChatGPT Voice Mode (107), GPT-6 Astra (87), Browser Auto Mode (81), WhatsApp 3 Features (65). Traffic (Shorts): YouTube search 79.0%, Shorts feed 9.4%. Stayed to watch 66.2%, swiped away 33.8%. Audience: new 97.2%, casual 2.6%, regular 0.2%; monthly audience 575; bell "All" 23.1% (311); mobile 68.9%. Geography (same 28 days; the table only showed two rows, Waqar couldn't find more and said it's not needed now): India 684 views (37.9%, avg 0:32, 2.8 h), Pakistan 127 views (7.0%, avg 0:49, 1.1 h); the other ~992 views (≈55%) come from countries not visible. Subtitles: 96.3% none, Hindi 3.4%. Age/gender, viewer times, formats: "Not enough data".
**TikTok (Oct 10–16, 2026):** views 1.1K (+40.3%), viewers 608 (−34.2%), For You 97%, male 62%, ages 25–34 48.7%; search queries about Power Automate, "laptop keeps freezing", YouTube Shorts algorithm. Data strength **Thin** → confidence Low, weak signals only.

**Pattern list (8 lenses to run weekly):** discovery source · hook and retention · topic/title/keyword · format and length · returning audience · geography and language · consistency and timing · conversion. **Weaknesses seen (hypotheses, not rules):** almost no returning audience; weak subscriber conversion (≈0.44%); Shorts-feed distribution weak (search-dependent); newest two videos have lower avg % (early readings); India views come in bursts (near 0 about Oct 2–15), so the Oct 5–13 dip is probably India-driven, not only an upload gap; audience mix vs Urdu-style content; Pakistan watches longer per view (0:49 vs 0:32). Power Automate is the strongest topic across YouTube and TikTok.

**Published-videos library (Channel_Insights section 8):** 57 Shorts read from Waqar's Oct 22 screenshots (newest first): titles, lengths, tool/topic, points visible in the descriptions, series/part. Older rows are approximate; Waqar decided NOT to re-check full descriptions and to refine going forward. Overlaps/issues seen: GPT-6 Astra twice, Claude Artifacts twice, Windows clipboard history twice, two PC-speed tricks, WhatsApp pin chats (Part 1) vs pin messages (Part 4), two "Episode 4" in Power Automate, "Web Scraping … Episode 4" has a Windows Storage Sense description, two videos called the final WhatsApp Business episode, typos ("FirstCloud", "Wesite"). **Added after the screenshots (from a memory block):** N1 — Chrome vs Chromium (category 7 Secrets, custom topic; points: Chrome vs Chromium difference, Google's purpose for Chromium, Chromium-based browsers Edge/Brave/Opera); title, length and publish date not sent.

## 9. Growth plan decisions

- **Upload plan (Waqar):** at least 1 video per day, more allowed, 7–10 per week; schedules via YouTube's schedule option at 5pm, 6pm, 7pm daily. Open: if 3 a day, that is 21 a week — he should confirm which. Best time cannot be confirmed (YouTube's viewer-time report has no data; TikTok's 0–1am is a weak signal) → treat 5/6/7pm as a test, rotate which category takes which slot for 2 weeks, keep watching.
- **Reaching other countries (verified facts, YouTube Help):** automatic dubbing: Urdu → English only; English → Hindi, Arabic, Spanish, French, etc.; dubs can't be edited, only published/unpublished/deleted; proper nouns/jargon can be mistranslated; own multi-language audio is limited to channels with Advanced features. Translated titles/descriptions (Studio → Subtitles → Add language) are read by YouTube search; subtitles can be uploaded or typed. Whether YouTube makes auto-captions for Urdu speech and whether auto-dubbing works for Shorts is unverified.
- **Waqar's three ideas:** (1) subtitles — cheap, do first; (2) viewer-language dubbing — exists (Urdu→English only); (3) two videos a day, Urdu + English — Claude advised not yet, instead pilot English versions of 2–3 best topics later. **Language question in the agent** (Routine: default Roman Urdu, override "English"; Custom: asked) is Global/structural and needs an English-dialogue Flow test first — not in the agent file.
- **Studio settings state:** "Allow automatic dubbing" on; "Manually review dubs" set to **"Review dubs in all languages"** (saved). "Disable interest-based ads" stays off.

## 10. MASTER LIST (✅ done · ⏳ pending · ❓ needs Waqar's input)

**A. YouTube settings**
1. ✅ Auto dubbing review setting saved → ⏳ check one video's **Languages** page (Studio → Content → video → Languages): English dub exists? "experimental"?
2. ⏳ **Feature eligibility** (Settings → Channel → Feature eligibility): explained (section 11); Waqar sends a screenshot.
3. ⏳ Default video language **Urdu** (Settings → Upload defaults → Advanced settings).
4. ✅/⏳ Category playlists: created where videos exist; the rest (New Technology & Product Tutorials, Future Tech & Positive Breakthroughs, Secrets, Income & Skills, YT Automation) appear at first upload; ⏳ Waqar merges YT Step By Step + Digital Growth; ⏳ unify "Whatsapp Business"/"whatsapp Tips & Tricks" casing.
5. ⏳ English translated titles/descriptions and subtitles (Urdu auto-captions availability unverified).
6. ⏳ Upload schedule test (5/6/7pm, rotate slots 2 weeks); ❓ confirm 3 a day (21/week) vs 7–10 a week.

**B. Data and Channel_Insights**
7. ✅ Geography numbers saved. 8. ⏸ Full country list (dropped for now).
9. ⏳ Category per video (library "Category" column still "not stated") — fill gradually from new memory blocks.
10. ⏳ More screenshots: Keywords (YouTube search terms), per-Short retention/swiped-away %, 2–3 retention graphs, TikTok Content tab, locations, Creator Rewards status.

**C. Growth plan (order)**
11. ⏳ Consistency (set up) → hook and retention → title/keywords → subscribe moment → returning audience (series) → geography/language → length.

**D. Agent file (wording first, then confirmation; version only when Waqar asks)**
12. ⏳ Category order by performance (later, with playlist analytics).
13. ✅ Reference line. 14. ⏳ Language question in the agent (after an English dialogue test in Flow). 15. ⏳ English pilot of 2–3 best videos.
16. ✅ v3.40 applied: no intro, fixed lines (voice / anti-repetition / 16:9 studio), free-first, curiosity-gap rule, tools protocol, spellings, YT Automation category + Section 9.2. ✅ v3.41 applied: duplicate check (Decision Note line, topic choice, memory block draft, same-day paste, evening routine).

**E. Older pending items**
17. ⏳ YouTube/TikTok policy check on earnings/financial claims (category 8 and YT Automation chapters 16–18).
18. ⏳ Re-verify TikTok Creator Rewards eligibility for Pakistan.
19. ⏳ Routine-mode stall during topic research (platform unknown).
20. ⏳ Red hoodie in a thumbnail test (blue expected).
21. ⏳ Weekly retention reading and an on-demand post-publish "comment pack" (outside the 5-item package).
22. ⏳ Thumbnail sub-banner "must not repeat the title" rule undecided.
23. ⏳ Untested in Flow: "stays silent after the final word", hologram/click-sound filling, the delivery phrases, "Jemini", "talaash karna", "baat-cheet", a custom-voice option in Flow's interface.

**F. Tests**
24. ⏳ Test v3.40 stories: the three fixed lines, no intro, 16:9 studio line, YT Automation, tools protocol. Partly seen: startup, 10-item list and the Category 7 reference line/status block looked right.
25. ⏳ Voice A/B test across profiles (same scene in a second profile with/without the voice line; compare the tag's voice settings in both profiles).
26. ⏳ Test on-screen name labels for tools/channels and person-name/fake-UI risks.
27. ✅ Chapter 10 covered and recorded in Channel_Insights section 9; ⏳ Chapter 11 (B-Roll Mastery & Generative AI Visuals) is next — update section 9 when done.

**G. Next session topic (see section 12)**
28. ✅ Duplicate check + memory block applied in v3.41 (fields are a draft); ⏳ refine the memory block after about a week of testing; ⏳ still open: the fresh-chat last-used-tag question (both modes) and the Section 11.1 Custom-mode note conflict.
29. ⏳ Channel clean-up (optional): the Episode 4 duplicate, Web Scraping description mismatch, two "final episode" videos, typos.
30. ⏳ Refresh this summary at each session end.

## 11. Feature eligibility — what it is (explained to Waqar)

Studio → Settings → Channel → **Feature eligibility** shows which YouTube feature tiers the channel has: standard (everyone), intermediate (phone verification; e.g. custom thumbnails) and advanced (extra verification or enough channel history; e.g. pinned comments, higher daily upload limits). Enabled features show as available; others show what is needed. It matters for: own multi-language audio tracks (Advanced access), the daily upload limit with 3 videos a day, and pinned comments for CTAs. Waqar only needs to open the tab and send a screenshot; no ID is forced.

## 12. Avoid repeating topics — duplicate check and memory block (applied in v3.41; memory-block fields still a draft)

**Trigger:** in his v3.40 run (Custom → category 7), the agent chose a WhatsApp "pin chats" story; the Decision Note and the title did not show whether it was already covered, so Waqar generated the thumbnail to check and concluded it was (Part 1 already covers pinning chats; Part 4 pinning important messages). The agent had no list of published videos.

**Waqar's decisions:** points 1–5 below were approved and are applied in v3.41; the memory block's content must be tested and refined later; do not re-check old descriptions; refine going forward. He also tried an older agent that produced a block with "Series / Broad Topic" and a numbered "Specific Topics Covered" list (Chrome vs Chromium story): the simple topics-covered idea works, but that block lacked the title, thumbnail headline and duplicate key.

1. **Decision Note duplicate-check line:** "Pehle cover hua? Naya / Haan: [video]". If Channel_Insights is not attached: "library nahi mili, duplicate check nahi hua".
2. **Topic choice:** topics already in the library (same tool + same feature) are not proposed (Routine skips them; Custom lists mark them "pehle cover"); for series (Secrets, Windows) the next part uses only points not covered before.
3. **Memory block after the 5 package items** (label only, not pasted anywhere; Waqar saves it manually in notepad/Word). **Draft fields to refine:** date · title · category/playlist · tool/topic · **thumbnail headline and sub-banner text** (it reveals the exact feature even when the title doesn't) · **points covered** (3–6, feature-level, with the exact names/steps shown) · **duplicate key** (tool + feature pairs, e.g. "WhatsApp + pin chats") · series/part and what the next part must avoid · what was left out for later · length (scenes) · status (bani; publish date/link later). Idea: one story = one compact block that maps to a row of Channel_Insights section 8.
4. **Same-day chats:** Waqar may paste the day's blocks at the start of a new chat so the agent treats them as covered before the file is updated.
5. **Evening update:** Waqar collects the day's blocks (e.g. 3–4 stories) and sends them once in the evening, saying which were published; Claude updates Channel_Insights section 8 and returns the file.
6. **Still open (not applied):** ask the last-used tag in fresh chats in both modes (fix the Section 11.1 Custom-mode note). The Section 0, Section 19.2 and Channel_Insights header wording for the memory block is done in v3.41.
7. **Test plan:** run the memory block for about a week (5–10 stories) and see whether the agent catches duplicates and which fields are too few/too many.

## 13. How Claude must work on this file (standing rules)

- Claude finds the best section itself; **proposes exact wording and waits for confirmation BEFORE editing** the agent file; makes only targeted edits; rechecks the full file for contradictions afterward. Genuinely ambiguous points → numbered options; clear decisions Claude makes itself and says so. Proactively flag mistakes, outdated or redundant items, and easier ways.
- **Versioning:** do NOT bump the version, write a changelog or present the new agent file until Waqar asks (e.g. "version bana do"). Then bump, give a consolidated changelog, present the file.
- Never merge this summary into the agent file. Summaries are regenerated fresh and comprehensive when the session ends.
- Flag Global/mechanical vs channel-specific. Flag anything structural.
- **Standing rule (Waqar):** whenever a point of the master list is cleared and the discussion ends, or when he stops (a break, the session ending, or after he asks for a file download), end the reply with the remaining master list so he knows where to restart.
- Channel_Insights.md routine: Claude lists every number read from screenshots and waits for Waqar's "ok" before saving (approximate chart numbers are marked); data-file edits he explicitly asks for can be done directly.
- Never invent numbers, analytics, prices, free tiers or earnings; verify tool and platform facts by research or say they are unverified.
- Honest limits to keep stating: scores are judgements, not predictions; the agent cannot see private analytics unless provided; Flow behavior must be confirmed by Waqar's live tests; with Thin data, everything is a weak signal.

## 14. Suggested first message in the new chat

Attach `Multi_Channel_Content_Agent.md` (v3.41), `Channel_Insights.md` and this summary, then say what to work on — most likely refining the memory block after testing (section 12), or: the v3.40 test results (items 24–25), the Feature eligibility screenshot (item 2), the Languages page of a video (item 1), the Urdu default language setting (item 3), the Chapter 10 production (item 27), or the next weekly screenshots for Channel_Insights.
