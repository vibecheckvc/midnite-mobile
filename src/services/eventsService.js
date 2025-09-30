import { supabase } from "../lib/supabase";

export const eventsService = {
  // Get all events
  async getEvents() {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching events:", error);
      return { data: null, error };
    }
  },

  // Get event by ID
  async getEventById(id) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching event:", error);
      return { data: null, error };
    }
  },

  // Create new event
  async createEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from("events")
        .insert([eventData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error creating event:", error);
      return { data: null, error };
    }
  },

  // Update event
  async updateEvent(id, eventData) {
    try {
      const { data, error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error updating event:", error);
      return { data: null, error };
    }
  },

  // Delete event
  async deleteEvent(id) {
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error("Error deleting event:", error);
      return { error };
    }
  },

  // Get events by user
  async getEventsByUser(userId) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching user events:", error);
      return { data: null, error };
    }
  },

  // Get upcoming events
  async getUpcomingEvents() {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      return { data: null, error };
    }
  },

  // Get events for today
  async getTodayEvents() {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", startOfDay.toISOString())
        .lt("date", endOfDay.toISOString())
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching today events:", error);
      return { data: null, error };
    }
  },

  // Get events for this week
  async getThisWeekEvents() {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", startOfWeek.toISOString())
        .lt("date", endOfWeek.toISOString())
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error fetching this week events:", error);
      return { data: null, error };
    }
  },
};
