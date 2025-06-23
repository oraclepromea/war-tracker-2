/// <reference path="../_shared/deno.d.ts" />
/// <reference path="../../../types/deno.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("⏰ Scheduler triggered at", new Date().toISOString());

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if there are unprocessed articles
    const { count, error: countError } = await supabase
      .from("rss_articles")
      .select("*", { count: "exact", head: true })
      .eq("is_processed", false);

    if (countError) throw new Error(`Count error: ${countError.message}`);

    console.log(`📊 Found ${count} unprocessed articles`);

    if (!count || count === 0) {
      console.log("✅ No articles to process - scheduler idle");
      return new Response(
        JSON.stringify({
          status: "idle",
          message: "No unprocessed articles found",
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trigger batch processing
    const batchUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/batch-analyze-articles`;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("🚀 Triggering batch processing...");

    const batchResponse = await fetch(batchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        batch_size: 10,
        max_concurrent: 3,
      }),
    });

    if (!batchResponse.ok) {
      throw new Error(`Batch processing failed: ${batchResponse.status}`);
    }

    const batchResult = await batchResponse.json();

    console.log("📈 Batch processing completed:", batchResult.stats);

    // Log scheduler run
    await supabase.from("scheduler_logs").insert({
      run_type: "automated_batch",
      articles_found: count,
      processing_stats: batchResult.stats,
      status: batchResult.status,
      executed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        status: "completed",
        articles_found: count,
        batch_result: batchResult,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("SCHEDULER ERROR:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});