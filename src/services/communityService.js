// services/communityService.js
import { supabase } from "../lib/supabase";

/** Count followers (who follows userId) and following (who userId follows) */
async function getFollowCounts(userId) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}

/** Is A following B? */
async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .limit(1);
  if (error) return { following: false, error };
  return { following: !!(data && data.length) };
}

/** Follow / Unfollow (with optimistic client updates recommended) */
async function followUser(followerId, followingId) {
  return await supabase
    .from("follows")
    .insert([{ follower_id: followerId, following_id: followingId }]);
}

async function unfollowUser(followerId, followingId) {
  return await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
}

/**
 * Subscribe to ANY follow changes that affect `targetUserId`
 * (either they gain/lose followers or they follow/unfollow someone).
 * Calls `onChange({eventType, newRow, oldRow})`
 */
function subscribeToFollowChanges(targetUserId, onChange) {
  const channel = supabase
    .channel(`follows_user_${targetUserId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "follows",
        filter: `following_id=eq.${targetUserId}`,
      },
      (payload) => onChange({ scope: "followers", ...payload })
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "follows",
        filter: `follower_id=eq.${targetUserId}`,
      },
      (payload) => onChange({ scope: "following", ...payload })
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe specifically to a single relationship (A follows B)
 * to keep the Follow button in perfect sync in both directions.
 */
function subscribeToRelationship(followerId, followingId, onChange) {
  const channel = supabase
    .channel(`follows_rel_${followerId}_${followingId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "follows",
        filter: `follower_id=eq.${followerId},following_id=eq.${followingId}`,
      },
      (payload) => onChange({ exists: true, payload })
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "follows",
        filter: `follower_id=eq.${followerId},following_id=eq.${followingId}`,
      },
      (payload) => onChange({ exists: false, payload })
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export const communityService = {
  getFollowCounts,
  isFollowing,
  followUser,
  unfollowUser,
  subscribeToFollowChanges,
  subscribeToRelationship,
};
