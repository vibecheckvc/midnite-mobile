// services/profileService.js
import { supabase } from "../lib/supabase";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

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

      // 2️⃣ Convert processed image to uploadable binary (FileSystem first for reliability)
      let uploadData = null;

      try {
        const b64 = await FileSystem.readAsStringAsync(manipulated.uri, {
          encoding: "base64",
        });
        
        // Convert base64 to Uint8Array
        if (typeof globalThis.atob === "function") {
          const binaryString = globalThis.atob(b64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
          uploadData = bytes;
        } else if (typeof Buffer !== "undefined") {
          uploadData = new Uint8Array(Buffer.from(b64, "base64"));
        }
      } catch (fileErr) {
        console.warn("FileSystem read failed, trying fetch:", fileErr);
        uploadData = null;
      }

      // Fallback: fetch + blob/arrayBuffer if FileSystem failed
      if (!uploadData) {
        try {
          const response = await fetch(manipulated.uri);
          
          try {
            if (typeof response.blob === "function") {
              uploadData = await response.blob();
            }
          } catch (blobErr) {
            uploadData = null;
          }

          if (!uploadData) {
            try {
              if (typeof response.arrayBuffer === "function") {
                const ab = await response.arrayBuffer();
                uploadData = ab instanceof ArrayBuffer ? new Uint8Array(ab) : new Uint8Array(ab.buffer || ab);
              }
            } catch (abErr) {
              uploadData = null;
            }
          }
        } catch (fetchErr) {
          console.warn("Fetch fallback failed:", fetchErr);
          uploadData = null;
        }
      }

      if (!uploadData) {
        throw new Error("Failed to read image for upload.");
      }

      // 3️⃣ Generate unique filename
      const filename = `avatar_${userId}_${Date.now()}.jpg`;

      // 4️⃣ Upload to Supabase Storage
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filename, uploadData, {
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
