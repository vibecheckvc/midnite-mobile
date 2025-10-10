import { supabase } from "../lib/supabase";

export const carPhotosService = {
  async getPhotos(carId) {
    return await supabase
      .from("car_photos")
      .select("*")
      .eq("car_id", carId)
      .order("created_at", { ascending: false });
  },

  async addPhoto(photoData) {
    return await supabase.from("car_photos").insert([photoData]).select().single();
  },

  async deletePhoto(id) {
    return await supabase.from("car_photos").delete().eq("id", id);
  },
};
