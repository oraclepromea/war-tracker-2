/// <reference path="../_shared/deno.d.ts" />
/// <reference path="../../../types/deno.d.ts" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  'https://prmjtsiyeovmkujtbjwi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybWp0c2l5ZW92bWt1anRiandpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU2MzIzNSwiZXhwIjoyMDY2MTM5MjM1fQ.Lqv_1rW2P_2O0PH8cn15wMXoueZT8o_HQ5bm1bfk6cM'
);
serve(async (req) => {
  console.log("DEBUG: Function started");
  
  try {
    // Test 1: Check if war_events table exists and is accessible
    console.log("DEBUG: Testing war_events table access...");
    const { data: tableTest, error: tableError } = await supabase
      .from('war_events')
      .select('count(*)')
      .limit(1);
    
    if (tableError) {
      console.error("DEBUG: Table access failed:", tableError);
      return new Response(JSON.stringify({
        error: "Table access failed",
        details: tableError
      }), { status: 500 });
    }
    
    console.log("DEBUG: Table accessible, count:", tableTest);
    
    // Test 2: Try minimal insert
    console.log("DEBUG: Attempting minimal insert...");
    const minimalEvent = {
      event_type: "test",
      country: "Test",
      confidence: 95,
      threat_level: "high"
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('war_events')
      .insert(minimalEvent)
      .select();
    
    if (insertError) {
      console.error("DEBUG: Insert failed:", insertError);
      return new Response(JSON.stringify({
        error: "Insert failed",
        details: insertError,
        attempted_data: minimalEvent
      }), { status: 500 });
    }
    
    console.log("DEBUG: Insert successful:", insertData);
    
    return new Response(JSON.stringify({
      success: true,
      message: "war_events table is working",
      inserted_data: insertData
    }));
    
  } catch (err) {
    console.error("DEBUG: Unexpected error:", err);
    return new Response(JSON.stringify({
      error: "Unexpected error",
      message: err.message,
      stack: err.stack
    }), { status: 500 });
  }
});