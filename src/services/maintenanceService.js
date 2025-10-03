import { supabase } from "../lib/supabase";

export const maintenanceService = {
  async getLogs(carId) {
    return await supabase
      .from("maintenance_logs")
      .select("*")
      .eq("car_id", carId)
      .order("created_at", { ascending: false });
  },

  async addLog(logData) {
    return await supabase.from("maintenance_logs").insert([logData]).select().single();
  },

  async updateLog(id, updates) {
    return await supabase.from("maintenance_logs").update(updates).eq("id", id).select().single();
  },

  async deleteLog(id) {
    return await supabase.from("maintenance_logs").delete().eq("id", id);
  },
};
