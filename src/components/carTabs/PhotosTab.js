// src/components/carTabs/PhotosTab.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Modal, TextInput, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const RED="#b10f2e", BG="#0b0b0c", CARD="rgba(255,255,255,0.04)", BORDER="rgba(255,255,255,0.08)", TEXT="#f6f6f7", MUTED="#a9a9b3";
const TABLE="car_photos", BUCKET="car-photos";

export default function PhotosTab({ car, user, supabase, onReload }) {
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [caption, setCaption] = useState(""); const [showCaption, setShowCaption] = useState(false);
  const [pendingUri, setPendingUri] = useState(null);

  const load = useCallback(async() => {
    const { data, error } = await supabase.from(TABLE).select("*").eq("car_id", car.id).order("created_at", { ascending:false });
    if (error) Alert.alert("Error", error.message); else setRows(data || []);
  }, [car?.id, supabase]);

  useEffect(()=>{ load(); },[load]);

  // Realtime for DB rows (uploads are manual refresh after insert)
  useEffect(() => {
    if (!car?.id) return;
    const ch = supabase
      .channel(`rt_${TABLE}_${car.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:TABLE, filter:`car_id=eq.${car.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [car?.id, supabase, load]);

  const onRefresh = async()=>{ setRefreshing(true); await load(); setRefreshing(false); };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission", "Allow photo library access.");
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.85 });
    if (!r.canceled) { setPendingUri(r.assets[0].uri); setCaption(""); setShowCaption(true); }
  };

  const confirmUpload = async () => {
    if (!pendingUri) return setShowCaption(false);
    try {
      const filename = `car_${car.id}/${Date.now()}.jpg`;
      const res = await fetch(pendingUri);
      const blob = await res.blob();
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) { Alert.alert("Upload error", upErr.message); return; }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      const publicUrl = pub?.publicUrl;
      // optimistic insert
      const temp = { id:`temp_${Date.now()}`, car_id:car.id, user_id:user?.id, url:publicUrl, caption: caption?.trim() || null, created_at:new Date().toISOString() };
      setRows(prev => [temp, ...prev]);
      const { data, error: insErr } = await supabase.from(TABLE).insert({ car_id: car.id, user_id: user?.id, url: publicUrl, caption: caption?.trim() || null }).select().single();
      if (insErr) Alert.alert("Save error", insErr.message);
      else setRows(prev => [data, ...prev.filter(r => r.id !== temp.id)]);
      setShowCaption(false); setPendingUri(null); setCaption("");
      onReload?.();
    } catch (e) { Alert.alert("Error", "Failed to upload image."); }
  };

  const remove = (row) =>
    Alert.alert("Delete photo", "Remove from storage and list?", [
      { text:"Cancel", style:"cancel" },
      { text:"Delete", style:"destructive", onPress: async () => {
          try {
            const marker = `/object/public/${BUCKET}/`;
            const idx = row.url.indexOf(marker);
            if (idx >= 0) {
              const path = row.url.substring(idx + marker.length);
              await supabase.storage.from(BUCKET).remove([path]);
            }
          } catch {}
          const prev = rows; setRows(prev.filter(r => r.id !== row.id));
          const { error } = await supabase.from(TABLE).delete().eq("id", row.id);
          if (error) { Alert.alert("Error", error.message); setRows(prev); } else onReload?.();
      }}
    ]);

  const Item = ({ item }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.url }} style={styles.photo} resizeMode="cover" />
      {!!item.caption && <Text numberOfLines={1} style={styles.caption}>{item.caption}</Text>}
      <TouchableOpacity onPress={()=>remove(item)} style={styles.del}><Ionicons name="trash-outline" size={18} color="#fff"/></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(x)=>String(x.id)}
        numColumns={3}
        columnWrapperStyle={{ gap:8, paddingHorizontal:16 }}
        renderItem={Item}
        contentContainerStyle={{ gap:8, paddingTop:12, paddingBottom:24 }}
        refreshControl={<RefreshControl tintColor={RED} refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={{ paddingHorizontal:16 }}>
            <TouchableOpacity onPress={pickImage} style={styles.primary}><Ionicons name="cloud-upload-outline" size={18} color="#fff"/><Text style={styles.primaryTxt}>Upload Photo</Text></TouchableOpacity>
          </View>
        }
      />

      <Modal visible={showCaption} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setShowCaption(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={()=>setShowCaption(false)}><Text style={styles.muted}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add caption</Text>
            <TouchableOpacity onPress={confirmUpload}><Text style={styles.save}>Upload</Text></TouchableOpacity>
          </View>
          <View style={{ padding:16 }}>
            <Text style={{ color: MUTED, marginBottom: 6 }}>Caption (optional)</Text>
            <TextInput value={caption} onChangeText={setCaption} placeholderTextColor={MUTED}
              style={{ backgroundColor: CARD, borderWidth:1, borderColor:BORDER, borderRadius:12, padding:12, color: TEXT }}/>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, backgroundColor: BG },
  primary:{ backgroundColor: RED, paddingVertical:12, borderRadius:12, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8, marginBottom:12 },
  primaryTxt:{ color:"#fff", fontWeight:"800" },
  photoCard:{ position:"relative", backgroundColor: CARD, borderWidth:1, borderColor:BORDER, borderRadius:12, overflow:"hidden", width:"32%" },
  photo:{ width:"100%", aspectRatio:1 },
  caption:{ position:"absolute", bottom:0, left:0, right:0, color:"#fff", fontSize:12, padding:6, backgroundColor:"rgba(0,0,0,0.35)" },
  del:{ position:"absolute", top:6, right:6, backgroundColor:"rgba(0,0,0,0.45)", padding:6, borderRadius:999, borderWidth:1, borderColor:"rgba(255,255,255,0.2)" },
  modal:{ flex:1, backgroundColor: BG },
  modalHeader:{ padding:16, borderBottomWidth:1, borderBottomColor:BORDER, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  modalTitle:{ color:"#f6f6f7", fontWeight:"800" },
  muted:{ color:"#a9a9b3" }, save:{ color: RED, fontWeight:"800" },
});
