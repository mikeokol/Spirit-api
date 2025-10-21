// 🌟 Spirit Reflection Module (v2) — scalable, secure, modular
// Handles user reflections, feedback, and adaptive learning signals.

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Ensure client exists only once (prevent memory leaks at scale)
let supabase = null;
if (!supabase) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

/**
 * Log reflection safely — supports scale from 10 → 1000+ users.
 * @param {Object} event - Reflection payload.
 * @param {string} event.user - User identifier or token.
 * @param {string} event.summary - Short summary of conversation.
 * @param {string} [event.category] - Optional category (e.g. "insight", "issue").
 * @param {number} [event.sentiment] - Optional sentiment score (-1 to 1).
 */
export async function logReflection(event = {}) {
  try {
    const { user = "anonymous", summary, category = "general", sentiment = 0 } = event;

    if (!summary || typeof summary !== "string" || summary.trim() === "") {
      return { error: "Missing summary text" };
    }

    // Unique ID for tracing entries
    const reflectionId = crypto.randomUUID();

    // Insert into Supabase
    const { data, error } = await supabase.from("reflections").insert([
      {
        id: reflectionId,
        user,
        summary,
        category,
        sentiment,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    return { success: true, id: reflectionId, inserted: data };
  } catch (err) {
    console.error("❌ Reflection log error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieve recent reflections — supports pagination for large datasets.
 * @param {number} [limit=50] - How many reflections to fetch.
 * @param {number} [offset=0] - Starting point for pagination.
 */
export async function getReflections(limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase
      .from("reflections")
      .select("*")
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { success: true, reflections: data };
  } catch (err) {
    console.error("❌ Reflection fetch error:", err);
    return { success: false, error: err.message };
  }
}
