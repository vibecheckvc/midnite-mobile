// services/profileService.js
import { supabase } from "../lib/supabase";
import * as ImageManipulator from "expo-image-manipulator";

export const profileService = {
  /**
   * Fetch the current user's profile
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching profile:", error.message);
      return { data: null, error };
    }
  },

  /**
   * Update profile fields (name, bio, socials, etc.)
   */
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating profile:", error.message);
      return { data: null, error };
    }
  },

  /**
   * Compress + crop + upload avatar to Supabase Storage (avatars bucket)
   * and update the user's profile with the public URL
   */
  async uploadAvatar(imageUri, userId) {
    try {
      // 1️⃣ Auto-crop and compress image for speed and uniform size
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 512, height: 512 } },
          { crop: { originX: 0, originY: 0, width: 512, height: 512 } },
        ],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2️⃣ Convert processed image to Blob
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();

      // 3️⃣ Generate unique filename
      const filename = `avatar_${userId}_${Date.now()}.jpg`;

      // 4️⃣ Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filename, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 5️⃣ Retrieve public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filename);
      const publicUrl = urlData.publicUrl;

      // 6️⃣ Update user's profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      console.log("✅ Avatar compressed, cropped, and uploaded:", publicUrl);
      return { data: publicUrl, error: null };
    } catch (error) {
      console.error("Error uploading avatar:", error.message);
      return { data: null, error };
    }
  },
};
