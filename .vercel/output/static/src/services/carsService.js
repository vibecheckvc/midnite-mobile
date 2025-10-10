import { supabase } from "../lib/supabase";

export const carsService = {
  async getCarsByUser(userId) {
    return await supabase
      .from("cars")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  },

  async addCar(carData) {
    return await supabase.from("cars").insert([carData]).select().single();
  },

  async updateCar(id, updates) {
    return await supabase.from("cars").update(updates).eq("id", id).select().single();
  },

  async deleteCar(id) {
    return await supabase.from("cars").delete().eq("id", id);
  },
};
