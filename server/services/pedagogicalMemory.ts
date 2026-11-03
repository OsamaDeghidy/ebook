import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export interface PedagogicalRule {
  id: string;
  subject: string;
  grade_level?: string;
  mistake_pattern: string;
  correction_rule: string;
  failure_rate?: number;
  context_type?: "quiz" | "explanation" | "math" | "kg" | "general";
  active: boolean;
  created_at: string;
}

const LOCAL_MEMORY_FILE = path.join(process.cwd(), "data", "pedagogical-memory.json");

/**
 * Load local fallback pedagogical rules cache
 */
function loadLocalMemory(): PedagogicalRule[] {
  try {
    const dataDir = path.dirname(LOCAL_MEMORY_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_MEMORY_FILE)) {
      // Seed with initial high-value sovereign rules for mathematics, KG, and science
      const initialSeed: PedagogicalRule[] = [
        {
          id: "rule-seed-math-01",
          subject: "رياضيات",
          mistake_pattern: "Using raw 'eq 0' instead of KaTeX '\\neq 0' or writing math in reversed RTL direction",
          correction_rule: "Write non-equality strictly as KaTeX '\\neq 0' inside isolated $...$ delimiters. Never mix Arabic conjunctions inside math strings.",
          failure_rate: 0.45,
          context_type: "math",
          active: true,
          created_at: new Date().toISOString()
        },
        {
          id: "rule-seed-math-02",
          subject: "رياضيات",
          mistake_pattern: "Generating multiple-choice options with placeholder text like 'الصياغة التفصيلية للاختيار'",
          correction_rule: "Every quiz option must contain authentic, solved mathematical expressions or distinct conceptual choices. Never output placeholder option titles.",
          failure_rate: 0.60,
          context_type: "quiz",
          active: true,
          created_at: new Date().toISOString()
        },
        {
          id: "rule-seed-kg-01",
          subject: "رياض أطفال",
          grade_level: "kg2",
          mistake_pattern: "Condensing early childhood books into abstract adult text without phonics or letter activities",
          correction_rule: "Structure every KG lesson around letter recognition, phonics (fat-ha, damma, kasra, sukoon), listening stories, and interactive visual games.",
          failure_rate: 0.50,
          context_type: "kg",
          active: true,
          created_at: new Date().toISOString()
        }
      ];
      fs.writeFileSync(LOCAL_MEMORY_FILE, JSON.stringify(initialSeed, null, 2), "utf-8");
      return initialSeed;
    }
    const raw = fs.readFileSync(LOCAL_MEMORY_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.warn("[Pedagogical Memory] Failed to read local cache:", e);
    return [];
  }
}

/**
 * Persist pedagogical rules to local cache
 */
function saveLocalMemory(rules: PedagogicalRule[]): void {
  try {
    const dataDir = path.dirname(LOCAL_MEMORY_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_MEMORY_FILE, JSON.stringify(rules, null, 2), "utf-8");
  } catch (e) {
    console.warn("[Pedagogical Memory] Failed to save local cache:", e);
  }
}

/**
 * Record a newly learned pedagogical insight into both Supabase and Local Cache
 */
export async function recordPedagogicalInsight(params: {
  subject: string;
  grade_level?: string;
  mistake_pattern: string;
  correction_rule: string;
  failure_rate?: number;
  context_type?: "quiz" | "explanation" | "math" | "kg" | "general";
}): Promise<PedagogicalRule> {
  const newRule: PedagogicalRule = {
    id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    subject: params.subject || "عام",
    grade_level: params.grade_level,
    mistake_pattern: params.mistake_pattern.trim(),
    correction_rule: params.correction_rule.trim(),
    failure_rate: params.failure_rate ?? 0,
    context_type: params.context_type || "general",
    active: true,
    created_at: new Date().toISOString()
  };

  // 1. Update local cache
  const localRules = loadLocalMemory();
  const existingIdx = localRules.findIndex(
    r => r.subject === newRule.subject && r.mistake_pattern.toLowerCase() === newRule.mistake_pattern.toLowerCase()
  );
  if (existingIdx !== -1) {
    localRules[existingIdx] = { ...localRules[existingIdx], ...newRule, id: localRules[existingIdx].id };
  } else {
    localRules.unshift(newRule);
  }
  saveLocalMemory(localRules);

  // 2. Persist to Supabase if available
  if (supabase) {
    try {
      await supabase.from("ai_pedagogical_memory").insert({
        subject: newRule.subject,
        grade_level: newRule.grade_level,
        mistake_pattern: newRule.mistake_pattern,
        correction_rule: newRule.correction_rule,
        failure_rate: newRule.failure_rate,
        context_type: newRule.context_type,
        active: true
      });
      console.log(`[Pedagogical Memory] Synced new rule for "${newRule.subject}" to Supabase.`);
    } catch (dbErr) {
      console.warn("[Pedagogical Memory] Supabase sync fallback to local cache:", dbErr);
    }
  }

  return newRule;
}

/**
 * Retrieve active pedagogical guardrails formatted for direct dynamic prompt injection
 */
export async function fetchPedagogicalGuardrails(options?: {
  subject?: string;
  grade_level?: string;
  context_type?: "quiz" | "explanation" | "math" | "kg" | "general";
  limit?: number;
}): Promise<string> {
  const limit = options?.limit || 5;
  let rules: PedagogicalRule[] = [];

  // Try fetching from Supabase first
  if (supabase) {
    try {
      let query = supabase.from("ai_pedagogical_memory").select("*").eq("active", true);
      if (options?.subject) {
        query = query.ilike("subject", `%${options.subject}%`);
      }
      if (options?.context_type && options.context_type !== "general") {
        query = query.eq("context_type", options.context_type);
      }
      const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
      if (!error && Array.isArray(data) && data.length > 0) {
        rules = data as PedagogicalRule[];
      }
    } catch (e) {
      console.warn("[Pedagogical Memory] Failed reading from Supabase, falling back to local file:", e);
    }
  }

  // Fallback to local cache if Supabase yielded nothing or wasn't reachable
  if (rules.length === 0) {
    const local = loadLocalMemory();
    rules = local.filter(r => {
      if (!r.active) return false;
      if (options?.subject && !r.subject.includes(options.subject) && r.subject !== "عام") return false;
      if (options?.context_type && options.context_type !== "general" && r.context_type && r.context_type !== options.context_type && r.context_type !== "general") return false;
      return true;
    }).slice(0, limit);
  }

  if (rules.length === 0) {
    return "";
  }

  const formattedRules = rules.map((r, idx) => {
    return `${idx + 1}. [تجنب الخطأ السابق / Mistake]: ${r.mistake_pattern}\n   -> [القاعدة البيداغوجية الملزمة / Mandatory Rule]: ${r.correction_rule}`;
  }).join("\n\n");

  return `
🚨 الذاكرة البيداغوجية التراكمية والقواعد التعليمية المستفادة ذاتياً (SELF-LEARNED PEDAGOGICAL GUARDRAILS):
لقد استوعب نموذج الذكاء الاصطناعي الأخطاء السابقة وتعديلات المعلمين ونقاط تعثر الطلاب السابقة في هذه المادة. يُحظر تماماً تكرار الأخطاء التالية، ويجب تطبيق القواعد الإلزامية بدقة:
${formattedRules}
`;
}

/**
 * Analyze teacher modifications and auto-synthesize pedagogical rules (Self-Learning Loop)
 */
export async function processTeacherEditSelfLearning(params: {
  subject: string;
  grade_level?: string;
  originalText?: string;
  modifiedText: string;
  contextType?: "quiz" | "explanation" | "math" | "kg" | "general";
}): Promise<void> {
  const { subject, grade_level, originalText, modifiedText, contextType } = params;
  if (!modifiedText) return;

  // Pattern 1: Teacher fixed LaTeX syntax (e.g. replaced broken $...$ or fraction)
  if (modifiedText.includes("\\neq 0") && originalText && originalText.includes("eq 0")) {
    await recordPedagogicalInsight({
      subject,
      grade_level,
      mistake_pattern: "Emitting 'eq 0' instead of KaTeX '\\neq 0'",
      correction_rule: "Always write non-zero constraints as KaTeX '\\neq 0' inside strict math delimiters.",
      context_type: "math"
    });
  }

  // Pattern 2: Teacher expanded short explanation into step-by-step
  if (originalText && modifiedText.length > originalText.length * 1.5 && modifiedText.includes("الخطوة")) {
    await recordPedagogicalInsight({
      subject,
      grade_level,
      mistake_pattern: "Brief or superficial explanation lacking step-by-step pedagogical breakdown",
      correction_rule: "Break down complex concepts into explicit numbered sequential steps with worked examples.",
      context_type: "explanation"
    });
  }

  // Pattern 3: Kindergarten phonics or letter drill was added
  if ((subject.includes("أطفال") || grade_level === "kg2" || grade_level === "kg1") && modifiedText.includes("أصوات الحروف")) {
    await recordPedagogicalInsight({
      subject,
      grade_level,
      mistake_pattern: "Omitting vowel sounds (Harakat) and phonemic awareness in KG curriculum",
      correction_rule: "Every KG lesson must explicitly incorporate phonemic drill (Fatha, Damma, Kasra, Sukoon) with interactive visual word associations.",
      context_type: "kg"
    });
  }
}
