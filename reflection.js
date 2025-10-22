// 🌟 Spirit Reflection Module v3.2 — hardened inputs

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  auth: { persistSession: false }
});

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const truncate = (s, max) => (s && s.length > max ? s.slice(0, max) : s);

/**
 * Insert a reflection
 * @param {Object} event { user, summary, category, sentiment }
 */
export async function logReflection(event = {}) {
  try {
    let {
      user = "anonymous",
      summary,
      category = "general",
      sentiment = 0
    } = event;

    if (typeof summary !== "string" || summary.trim() === "") {
      return { success: false, error: "Missing or invalid 'summary'." };
    }
    summary = truncate(summary.trim(), 2000);
    sentiment = clamp(Number(sentiment) || 0, -1, 1);
    user = truncate(String(user), 128);
    category = truncate(String(category), 64);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = {
      id,
      user,
      summary,
      category,
      sentiment,
      created_at: now,
      timestamp: now
    };

    const { data, error } = await supabase.from("reflections").insert([payload]).select();
    if (error) throw error;

    return { success: true, id, inserted: data };
  } catch (err) {
    console.error("❌ Reflection log error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch reflections with pagination
 */
export async function getReflections(limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase
      .from("reflections")
      .select("*")
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { success: true, reflections: data || [] };
  } catch (err) {
    console.error("❌ Reflection fetch error:", err);
    return { success: false, error: err.message };
  }
}
