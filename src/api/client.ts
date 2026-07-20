import { createClient } from "@supabase/supabase-js";
import { mockApi } from "./mockAdapter";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const apiClient = mockApi;
export const apiMode = supabase ? "supabase-ready" : "mock";
