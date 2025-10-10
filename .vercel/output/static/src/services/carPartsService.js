import { supabase } from "../lib/supabase";

export const carPartsService = {
  async getParts(carId) {
    return await supabase
      .from("car_parts")
      .select("*")
      .eq("car_id", carId)
      .order("created_at", { ascending: false });
  },

  async addPart(partData) {
    return await supabase.from("car_parts").insert([partData]).select().single();
  },

  async updatePart(id, updates) {
    return await supabase.from("car_parts").update(updates).eq("id", id).select().single();
  },

  async deletePart(id) {
    return await supabase.from("car_parts").delete().eq("id", id);
  },
};
