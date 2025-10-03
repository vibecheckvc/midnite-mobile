import { supabase } from "../lib/supabase";

export const buildTimelineService = {
  async getEvents(carId) {
    return await supabase
      .from("build_timeline")
      .select("*")
      .eq("car_id", carId)
      .order("date", { ascending: false });
  },

  async addEvent(eventData) {
    return await supabase.from("build_timeline").insert([eventData]).select().single();
  },

  async updateEvent(id, updates) {
    return await supabase.from("build_timeline").update(updates).eq("id", id).select().single();
  },

  async deleteEvent(id) {
    return await supabase.from("build_timeline").delete().eq("id", id);
  },
};
