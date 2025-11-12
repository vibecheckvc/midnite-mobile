// services/feedService.js
import { supabase } from "../lib/supabase";

/**
 * Fetch unified feed: builds + events (For You or Following)
 * Includes persistent likes/saves from DB and fixed profile mapping.
 */
export async function fetchUnifiedFeed(userId, filter = "For You", contentFilter = "all") {
  try {
    // 1️⃣ Get following list
    const { data: followingRows, error: followErr } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (followErr) throw followErr;
    const followingIds = followingRows?.map((r) => r.following_id) || [];

    // 2️⃣/3️⃣ Fetch datasets based on contentFilter for faster loads
    let carsRaw = [];
    let eventsRaw = [];

    // Build list of dataset queries to run in parallel for faster response
    const datasetPromises = [];
    if (contentFilter === "all" || contentFilter === "builds") {
      datasetPromises.push(
        supabase
          .from("cars")
          .select(
            "id, user_id, make, model, year, trim, cover_url, created_at, is_public"
          )
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(40) // cap initial builds to reduce payload
      );
    }
    if (contentFilter === "all" || contentFilter === "events") {
      datasetPromises.push(
        supabase
          .from("events")
          .select(
            "id, user_id, title, description, location, date, image_url, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(40)
      );
    }

    if (datasetPromises.length) {
      const results = await Promise.all(datasetPromises);
      // Assign based on order we pushed promises
      let buildIndex = 0;
      if (contentFilter === "all" || contentFilter === "builds") {
        const { data, error } = results[buildIndex++];
        if (error) throw error;
        carsRaw = data || [];
      }
      if (contentFilter === "all" || contentFilter === "events") {
        const { data, error } = results[buildIndex];
        if (error) throw error;
        eventsRaw = data || [];
      }
    }

    // 4️⃣ Collect all user IDs for profile lookup
    const allUserIds = [
      ...new Set([
        ...carsRaw.map((c) => c.user_id),
        ...eventsRaw.map((e) => e.user_id),
      ]),
    ].filter(Boolean);

    let profilesMap = {};
    if (allUserIds.length) {
      const { data: profilesData, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", allUserIds);

      if (profilesErr) throw profilesErr;
      profilesMap = Object.fromEntries(
        (profilesData || []).map((p) => [p.id, p])
      );
    }

    // 5️⃣ Fetch likes & saves for this user
    const [likesRes, savesRes] = await Promise.all([
      supabase
        .from("likes")
        .select("content_id, content_type")
        .eq("user_id", userId),
      supabase
        .from("saves")
        .select("content_id, content_type")
        .eq("user_id", userId),
    ]);

    const userLikes = likesRes?.data || [];
    const userSaves = savesRes?.data || [];

    // 6️⃣ Map and unify builds + events
    const cars = (carsRaw || []).map((c) => ({
      type: "build",
      id: c.id,
      created_at: c.created_at,
      user_id: c.user_id,
      user: profilesMap[c.user_id] || null,
      cover: c.cover_url,
      title: `${c.make} ${c.model}`,
      subtitle: `${c.year} ${c.trim || ""}`.trim(),
    }));

    const events = (eventsRaw || []).map((e) => ({
      type: "event",
      id: e.id,
      created_at: e.created_at,
      user_id: e.user_id,
      user: profilesMap[e.user_id] || null,
      cover: e.image_url,
      title: e.title,
      subtitle: e.location || "Location TBA",
      date: e.date,
    }));

    // 7️⃣ Combine both datasets
    const combined = [...cars, ...events];

    // 8️⃣ Apply filter (Following)
    let filtered = combined;
    if (filter === "Following") {
      filtered = combined.filter((item) => followingIds.includes(item.user_id));
    }

    // 9️⃣ Sort (followed first, then newest)
    const prioritized = filtered.sort((a, b) => {
      const aFollow = followingIds.includes(a.user_id);
      const bFollow = followingIds.includes(b.user_id);
      if (aFollow && !bFollow) return -1;
      if (!aFollow && bFollow) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // 🔟 Merge liked/saved states
    const withStates = prioritized.map((item) => ({
      ...item,
      isLiked: userLikes.some(
        (l) => l.content_id === item.id && l.content_type === item.type
      ),
      isSaved: userSaves.some(
        (s) => s.content_id === item.id && s.content_type === item.type
      ),
    }));

    return { data: withStates, error: null };
  } catch (error) {
    console.error("[feedService.fetchUnifiedFeed]", error);
    return { data: [], error };
  }
}

/* ------------------ Toggle Like ------------------ */
export async function toggleLike(userId, contentId, contentType, isLiked) {
  try {
    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("content_id", contentId)
        .eq("content_type", contentType);
    } else {
      await supabase.from("likes").insert([
        { user_id: userId, content_id: contentId, content_type: contentType },
      ]);
    }
  } catch (err) {
    console.error("[toggleLike]", err);
  }
}

/* ------------------ Toggle Save ------------------ */
export async function toggleSave(userId, contentId, contentType, isSaved) {
  try {
    if (isSaved) {
      await supabase
        .from("saves")
        .delete()
        .eq("user_id", userId)
        .eq("content_id", contentId)
        .eq("content_type", contentType);
    } else {
      await supabase.from("saves").insert([
        { user_id: userId, content_id: contentId, content_type: contentType },
      ]);
    }
  } catch (err) {
    console.error("[toggleSave]", err);
  }
}

/* ------------------ Toggle Event Join ------------------ */
export async function toggleJoinEvent(userId, eventId, isJoined) {
  try {
    if (isJoined) {
      await supabase
        .from("event_attendees")
        .delete()
        .eq("user_id", userId)
        .eq("event_id", eventId);
    } else {
      await supabase
        .from("event_attendees")
        .insert([{ user_id: userId, event_id: eventId }]);
    }
  } catch (err) {
    console.error("[toggleJoinEvent]", err);
  }
}
