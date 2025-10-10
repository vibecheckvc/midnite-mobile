import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system/legacy";

export const storageService = {
  async uploadEventImage(imageUri, eventId) {
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `event_${eventId}_${timestamp}.jpg`;

      // Read the file as binary data using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });

      // Convert base64 to binary data
      const binaryData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // Upload to Supabase Storage using binary data
      const { data, error } = await supabase.storage
        .from("event-images")
        .upload(filename, binaryData, {
          contentType: "image/jpeg",
          upsert: false,
          cacheControl: "3600",
        });

      if (error) {
        console.error("Error uploading image:", error);
        return { data: null, error };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("event-images")
        .getPublicUrl(filename);

      return { data: urlData.publicUrl, error: null };
    } catch (error) {
      console.error("Error in uploadEventImage:", error);
      return { data: null, error };
    }
  },

  async deleteEventImage(imageUrl) {
    try {
      // Extract filename from URL
      const filename = imageUrl.split("/").pop();

      const { error } = await supabase.storage
        .from("event-images")
        .remove([filename]);

      if (error) {
        console.error("Error deleting image:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Error in deleteEventImage:", error);
      return { error };
    }
  },
};
