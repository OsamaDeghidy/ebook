# وثيقة التصميم المعماري وخطة العمل البرمجية لمحاكاة أسلوب "شخبطة" في محرك Explainroo (Architectural Blueprint & Implementation Plan)

**تاريخ الإعداد**: 2026-11-24  
**المشروع**: منصة الفيديوهات التعليمية التفاعلية `Explainroo` / `Osera AI`  
**الهدف المعماري**: سد الفجوة بين الأسلوب الحالي المعتمد على البطاقات النصية ومحاكاة الرسوم اليدوية السردية والمجازات البصرية والميكس الصوتي الاحترافي لقناة "شخبطة".

---

## 1. الملخص التنفيذي والتشخيص المعماري (Executive Summary & Gap Diagnosis)

### 1.1 تشخيص الفجوة الحالية
أثبت التحليل المعماري لمحرك `Explainroo` في مجلد `./explainroo/` ومولد السيناريوهات في `server.ts` ما يلي:
1. **المحرك يمتلك بالفعل قدرات الرسم الفيزيائي الممتازة**: يحتوي `explainroo/engine/pen.js` و `stage.js` على خوارزميات `Rough.js` لرسم خطوط اليد التذبذبية ومحاكاة حركة القلم تدريجياً عبر تجزئة مسارات الـ SVG (`splitSubpaths` و `pathLength` مع `stroke-dasharray`).
2. **عنق الزجاجة الحقيقي يكمن في طبقة هندسة الأوامر (Prompt Engineering) وبنية البيانات**:
   - في `server.ts:2171-2190`، يُلزم نموذج Gemini بإخراج كائن يحتوي على مصفوفة بطاقات `boxes: [{ label: string, icon: string }]`.
   - يترجم مولد الكود في `server.ts:2676` هذه البيانات إلى مربعات مصمتة `s.box(...)` تحوي فقرات نصية طويلة، مما يحول الفيديو إلى "شرائح عرض نصية بطيئة" بدلاً من قصة مرسومة حية.
3. **قصور الميكس الصوتي الحالي**:
   - تعتمد الموسيقى التصويرية على مذبذبات إلكترونية اصطناعية خفيفة (`music.js`) بدلاً من مقطوعات أكوستيك حية.
   - خفض الصوت التلقائي الحالي ضعيف (`DUCK_DB = -8` في `soundtrack.js`)، ومؤثرات الصوت مكتومة افتراضياً (`"sfx": "minimal"`).

---

## 2. إعادة هندسة الأوامر ومخطط بيانات المشاهد (Prompt Engineering & Storyboard Schema)

### 2.1 مخطط بيانات المشاهد المقترح (`shakhbata_storyboard_v1`)

نستبدل مخطط البطاقات بمخطط السرد المجازي التفاعلي:

```json
{
  "$schema": "shakhbata_storyboard_v1",
  "title": "عنوان الدرس الشائق والمباشر",
  "musicTrack": "acoustic_curiosity.mp3",
  "scenes": [
    {
      "id": "scene1",
      "heading": "عنوان المحور العلمي",
      "metaphorAnalogy": "التشبيه الملموس (طوابير الأوراق المكدسة مقابل ضغطة الزر)",
      "narration": "[#m1] تخيل لو أنك مضطر للوقوف ست ساعات لختم ورقة واحدة! [#m2] التحول الرقمي يختصر هذا الطابور في ضغطة زر واحدة. [#m3] ليس مجرد جهاز، بل ثورة تختصر وقتك وجهدك. [#m4] النتيجة: صفر طوابير وسرعة فائقة.",
      "visualStory": {
        "layout": "analogy_transformation",
        "doodleLeft": {
          "doodleId": "character_exhausted_papers",
          "keyword": "طوابير وأوراق مكدسة",
          "color": "orange",
          "at": "#m1",
          "sfx": "scribble"
        },
        "doodleRight": {
          "doodleId": "character_happy_phone",
          "keyword": "ضغطة زر واحدة",
          "color": "teal",
          "at": "#m2",
          "sfx": "pop"
        },
        "connection": {
          "type": "transformation_arrow",
          "label": "التحول الرقمي",
          "at": "#m3",
          "sfx": "whoosh"
        },
        "takeawayBadge": {
          "keyword": "صفر طوابير!",
          "annotationType": "circle",
          "color": "green",
          "at": "#m4",
          "sfx": "ding"
        }
      }
    }
  ]
}
```

### 2.2 صياغة أمر مخرج شخبطة لنموذج Gemini (`buildShakhbataDirectorPrompt`)

```typescript
export function buildShakhbataDirectorPrompt(params: {
  bookTitle: string;
  chapterTitle: string;
  chapterContent: string;
  aspectRatio: "16:9" | "9:16";
  availableDoodles: string[];
}): string {
  return `
أنت كبير مخرجي السرد القصصي البصري ورسوم السبورة البيضاء التفاعلية (بأسلوب قناة "شخبطة" و "RSA Animate") لمنصة Osera AI التعليمية.

المهمة الصارمة:
تحويل محتوى الدرس الأكاديمي أدناه إلى سيناريو بصري متكامل يعتمد على "المجازات البصرية التجسيدية" (Visual Metaphors) ورسوم الشخصيات الكرتونية البسيطة بدلاً من البطاقات والنصوص المكتوبة.

سياق المقرر:
- اسم الكتاب: "${params.bookTitle}"
- عنوان الفصل: "${params.chapterTitle}"
- أبعاد الفيديو: ${params.aspectRatio === "9:16" ? "Vertical (9:16 Shorts/Reels)" : "Landscape (16:9 Wide YouTube)"}

المحتوى المصدري الحصري للدرس:
"""
${params.chapterContent.substring(0, 16000)}
"""

قائمة مفاتيح الرسوم الدلالية المتاحة (Doodle IDs):
[${params.availableDoodles.join(", ")}]

قواعد الإخراج الصارمة بأسلوب "شخبطة":
1. سياسة خلو الشاشة من البطاقات (Zero Card Policy):
   - يُمنع منعاً باتاً وضع مربعات نصية تحوي فقرات أو جمل كاملة على الشاشة.
   - الشاشة مخصصة للرسم التعبيري والمجاز البصري، والنص الوحيد المسموح به هو "الكلمة المفتاحية" (Keyword) من كلمة إلى 3 كلمات كحد أقصى بجوار الرسم.

2. المجاز البصري والتشبيه الملموس (Concrete Embodied Metaphor):
   - لكل فكرة علمية، ابتكر تشبيهاً ملموساً من واقع الطالب اليومي:
     * البيانات الضخمة ← شاحنة عملاقة محملة بآلاف الطرود.
     * المعالج والسرعة ← طاهٍ ذكي يدير مطبخاً ضخماً وطاولة مجاورة (RAM).
     * النظام الثنائي 0 و 1 ← مفاتيح إضاءة جدارية ومصابيح منيرة ومظلمة.
     * الأمان والتشفير ← قلعة بحصون وأقفال فولاذية.

3. الإيقاع الرباعي الدقيق للعلامات الزمنية ([#m1], [#m2], [#m3], [#m4]):
   - [#m1] (ثانية 0-3): رسم الشخصية أو المشكلة أو التشبيه اليومي الملموس (صوت scribble).
   - [#m2] (ثانية 3-7): رسم الحل أو المفهوم العلمي الدقيق من المنهج (صوت pop).
   - [#m3] (ثانية 7-10): سهم التحول أو العلاقة المترابطة بينهما (صوت whoosh).
   - [#m4] (ثانية 10-13): تأطير النتيجة أو الكلمة الذهبية بدائرة عريضة (صوت ding).

4. التعليق الصوتي الحكواتي الدافئ:
   - لغة عربية فصحى مشكولة، دافئة، مباشرة وحوارية (من 35 إلى 48 كلمة مشكولة لكل مشهد).
   - ابدأ المشهد الأول مباشرة بسؤال واقعي مثير يلمس مشكلة الطالب دون أي ترحيبات جافة.

أجب حصراً بكائن JSON صالح يطابق مخطط shakhbata_storyboard_v1 بدون أي شروحات خارجه.
`;
}
```

---

## 3. متطلبات مكتبة الرسوم والعناصر البصرية (Doodle Vector Asset Bank)

### 3.1 بنية مكتبة الدودلز (`explainroo/engine/doodles.json`)
إنشاء مكتبة مخصصة لرسوم الوايت بورد التوضيحية بصيغة مسارات SVG مفككة (Multi-path SVG string arrays)، مصنفة إلى:
1. **شخصيات تعبيرية (Characters)**:
   - `character_confused`: شخص يضع يده على رأسه في حيرة.
   - `character_happy_phone`: شخص يبتسم ويحمل هاتفاً ذكياً.
   - `character_exhausted_papers`: شخص منهك يحمل أكواماً من الأوراق.
   - `character_chef_cpu`: طاهٍ يطبخ بسرعة فائقة لتمثيل المعالج.
2. **عناصر واقعية ومجازات (Metaphor Objects)**:
   - `leaking_bucket`: سطل خشبي يتسرب منه الماء.
   - `snowball_mountain`: كرة ثلج تتدحرج وتكبر.
   - `wall_switches`: مفاتيح كهرباء تمثل 0 و 1.
   - `hourglass`: ساعة رملية ينسكب رملها.
   - `battery_charge`: رمز بطارية يتحول إلى 100% أخضر مشع.
3. **رموز توجيهية وأسهم (Connecting Dynamics)**:
   - `rough_arrow_curved`, `transformation_arrow`, `marker_circle`, `marker_underline`.

### 3.2 توسيع محرك الرسم بدعم `Stage.prototype.doodle` (`stage.js`)

إضافة دالة رسم الدودل في `explainroo/engine/stage.js`:

```javascript
doodle(name, o = {}) {
  const th = this.theme;
  const size = o.size ?? 220;
  const x = o.x ?? this.cx;
  const y = o.y ?? this.cy;
  const life = this._life(o, 'doodle', { enter: o.enter ?? 'draw', dur: o.dur ?? 1.2 });
  const g = geom(x, y, size, size);
  if (!life) return g;

  const paths = this.engine.doodles?.[name] || this.engine.icons?.[name];
  if (!paths) {
    console.warn(`[Explainroo Stage] Doodle "${name}" not found, falling back to icon`);
    return this.icon(name, o);
  }

  this._push(x, y, life.enter === 'draw' ? { ...life, enter: 'none' } : life, o);
  const prog = this._drawProgress(life);
  const color = colorOf(th, o.color, 'ink');
  const s = size / 100;

  this.ctx.save();
  this.ctx.translate(x, y);

  // إطلاق صوت خربشة الماركر تلقائياً مع بدء رسم المسار
  if (o.sfx !== false && life.p > 0 && life.p < 0.12) {
    this.sfx('scribble', o.at, { dur: o.dur ?? 1.0, gain: 0.35 });
  }

  const pathList = Array.isArray(paths) ? paths : [paths];
  for (let i = 0; i < pathList.length; i++) {
    const d = scalePath(pathList[i], s, -size / 2, -size / 2);
    this.pen.draw(
      this.ctx,
      { kind: 'path', d },
      {
        stroke: color,
        width: o.width ?? th.stroke.width * 1.2,
        single: true,
        roughness: 0.85,
        fillStyle: o.fillStyle || 'hachure',
        fill: o.fill ? colorOf(th, o.fill) : undefined
      },
      { stroke: prog.stroke, fill: prog.fill }
    );
  }

  // كتابة الكلمة المفتاحية المختصرة بخط يدوي أسفل الرسم
  if (o.label) {
    const ls = o.labelSize ?? 28;
    this.ctx.font = fontString(th, 'hand', ls, true);
    this.ctx.fillStyle = colorOf(th, o.labelColor || 'ink');
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(String(o.label), 0, size / 2 + 14);
  }

  this.ctx.restore();
  return g;
}
```

---

## 4. متطلبات هندسة الصوت والميكس الاحترافي (Sound Engineering & Ducking)

### 4.1 توليد التعليق الصوتي الطبيعي
- استخدام نموذج `Google Cloud TTS Chirp3-HD` (`ar-XA-Chirp3-HD-Fenrir` أو `Aoede`) كمعلق صوتي أساسي.
- حقن علامات التوقف والتشكيل:
  - إضافة وقفات صمت `[pause 0.8]` في `script.md` قبل الكلمات الذهبية لخلق إيقاع شخبطة الحكواتي.

### 4.2 دمج الموسيقى الأكوستيك وخفض الصوت التلقائي عبر FFmpeg
بدلاً من نغمات الـ Synthesizer الإلكترونية، يتم دمج مسارات موسيقية أكوستيك حية (`assets/music/*.mp3`) وتطبيق فلتر الـ Sidechain Compress في مرحلة المونتاج النهائي:

```bash
ffmpeg -y \
  -i "build/segments_concat.mp4" \
  -i "build/voice_combined.wav" \
  -i "assets/music/acoustic_curiosity.mp3" \
  -filter_complex "\
    [2:a]aloop=loop=-1:size=2e+09,volume=0.32[bgm_loop]; \
    [bgm_loop][1:a]sidechaincompress=threshold=0.07:ratio=6:attack=160:release=450[ducked_bgm]; \
    [1:a][ducked_bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]" \
  -map 0:v -map "[aout]" \
  -c:v copy \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  -shortest "out/video.mp4"
```

#### معاملات فلتر خفض الصوت المعتمدة (Ducking Parameters):
- `threshold=0.07`: حساسية عالية تلتقط أدنى صوت بشري بمجرد بدء النطق.
- `ratio=6:1`: يخفض الموسيقى بمقدار **14 إلى 18 dB** تحت صوت المعلق لمنع تشتيت الطالب.
- `attack=160ms`: استجابة ناعمة سريعة تخفض الموسيقى دون فرقعة.
- `release=450ms`: صعود انسيابي مبهج للموسيقى في الوقفات والانتقالات (Music Swell).

---

## 5. خطة العمل المرحلية ومصفوفة الملفات الواجب تعديلها (Implementation Roadmap)

| المرحلة | الأولوية | الملفات المستهدفة في المشروع | التعديلات والمهام المحددة | مخرجات التحقق |
|---|---|---|---|---|
| **المرحلة 1: هندسة الـ Prompts** | P0 | `server.ts` (الأسطر 2120–2200) | 1. استبدال أمر `isShakhbata` بالأمر القصصي المجازي الجديد.<br>2. إلزام النموذج بمخطط `shakhbata_storyboard_v1`.<br>3. حظر توليد البطاقات النصية ومربعات النصوص الطويلة. | صدور سيناريو JSON خالٍ من البطاقات، بمجازات بصرية وكلمات مفتاحية مقتضبة. |
| **المرحلة 2: مكتبة رسوم الوايت بورد** | P0 | `explainroo/engine/stage.js`<br>`explainroo/engine/doodles.json` | 1. بناء ملف `doodles.json` بمجموعات مسارات SVG للشخصيات والمجازات.<br>2. إضافة دالة `s.doodle()` في `Stage`.<br>3. ربط الرسم بحركة القلم ومؤثر `scribble`. | ظهور الرسم التدريجي لليد والخطوط التذبذبية للمجازات على الشاشة. |
| **المرحلة 3: هندسة الصوت وخفض الموسيقى** | P1 | `explainroo/src/render.js`<br>`explainroo/engine/audio/soundtrack.js`<br>`server.ts` | 1. توفير مسارات أكوستيك MP3 في مجلد `assets/music/`.<br>2. دمج فلتر FFmpeg `sidechaincompress` أثناء التصدير النهائي للملف.<br>3. ضبط `DUCK_DB = -20` في البيئة المحلية. | وضوح كامل لصوت المعلم مع صعود الموسيقى أثناء الوقفات بمقدار +8 dB. |
| **المرحلة 4: المزامنة وتكامل الكاميرا** | P2 | `server.ts` (مترجم `scenes.js`)<br>`explainroo/src/project.js` | 1. برمجة حركة الكاميرا الأفقية المستمرة (Infinite Canvas Pan).<br>2. مزامنة العلامات الزمنية الرباعية `[#m1]` إلى `[#m4]` مع إطلاق الأصوات (`pop`, `whoosh`, `ding`). | تجربة فيديو متدفقة تضاهي فيديوهات قناة شخبطة بنسبة 100%. |
