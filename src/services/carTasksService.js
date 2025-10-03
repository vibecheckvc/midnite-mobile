import { supabase } from "../lib/supabase";

export const carTasksService = {
  async getTasks(carId) {
    return await supabase
      .from("car_tasks")
      .select("*")
      .eq("car_id", carId)
      .order("created_at", { ascending: false });
  },

  async addTask(taskData) {
    return await supabase.from("car_tasks").insert([taskData]).select().single();
  },

  async updateTask(id, updates) {
    return await supabase.from("car_tasks").update(updates).eq("id", id).select().single();
  },

  async deleteTask(id) {
    return await supabase.from("car_tasks").delete().eq("id", id);
  },
};
