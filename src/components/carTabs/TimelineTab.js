// src/components/carTabs/TimelineTab.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RED="#b10f2e", BG="#0b0b0c", CARD="rgba(255,255,255,0.04)", BORDER="rgba(255,255,255,0.08)", TEXT="#f6f6f7", MUTED="#a9a9b3";
const TABLE="build_timeline";

export default function TimelineTab({ car, user, supabase, onReload }) {
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [show, setShow] = useState(false); const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ title:"", description:"", date:"" });

  const load = useCallback(async() => {
    const { data, error } = await supabase.from(TABLE).select("*").eq("car_id", car.id).order("date", { ascending:false });
    if (error) Alert.alert("Error", error.message); else setRows(data || []);
  }, [car?.id, supabase]);

  useEffect(()=>{ load(); },[load]);

  useEffect(() => {
    if (!car?.id) return;
    const ch = supabase
      .channel(`rt_${TABLE}_${car.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:TABLE, filter:`car_id=eq.${car.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [car?.id, supabase, load]);

  const onRefresh = async()=>{ setRefreshing(true); await load(); setRefreshing(false); };

  const openAdd = ()=>{ setEditing(null); setF({ title:"", description:"", date:new Date().toISOString().slice(0,10) }); setShow(true); };
  const openEdit = (r)=>{ setEditing(r); setF({ title:r.title||"", description:r.description||"", date: r.date ? String(r.date).slice(0,10) : "" }); setShow(true); };

  const save = async()=> {
    if (!f.title.trim()) return Alert.alert("Missing","Title required.");
    if (!f.date) return Alert.alert("Missing","Date required.");
    const payload = { user_id:user?.id??null, car_id:car.id, title:f.title.trim(), description:f.description?.trim()||null, date:new Date(f.date).toISOString(), is_public:false };
    if (editing) {
      setRows(prev => prev.map(x => x.id===editing.id ? { ...x, ...payload } : x));
      const { error } = await supabase.from(TABLE).update(payload).eq("id", editing.id);
      if (error) Alert.alert("Error", error.message);
    } else {
      const temp = { id:`temp_${Date.now()}`, created_at:new Date().toISOString(), ...payload };
      setRows(prev => [temp, ...prev]);
      const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
      if (error) Alert.alert("Error", error.message);
      else setRows(prev => [data, ...prev.filter(r => r.id !== temp.id)]);
    }
    setShow(false); onReload?.();
  };

  const del = (id) => Alert.alert("Delete timeline entry?", "This cannot be undone.", [
    { text:"Cancel", style:"cancel" },
    { text:"Delete", style:"destructive", onPress: async ()=>{
      const prev = rows; setRows(prev.filter(r => r.id !== id));
      const { error } = await supabase.from(TABLE).delete().eq("id", id);
      if (error) { Alert.alert("Error", error.message); setRows(prev); } else onReload?.();
    } }
  ]);

  const Item = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        <View style={{ flexDirection:"row", gap:8 }}>
          <TouchableOpacity onPress={()=>openEdit(item)} style={styles.iconBtn}><Ionicons name="create-outline" size={18} color={TEXT}/></TouchableOpacity>
          <TouchableOpacity onPress={()=>del(item.id)} style={styles.iconBtnDanger}><Ionicons name="trash-outline" size={18} color="#fff"/></TouchableOpacity>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(x)=>String(x.id)}
        renderItem={Item}
        contentContainerStyle={{ padding:16, paddingBottom:32 }}
        refreshControl={<RefreshControl tintColor={RED} refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <View style={{ paddingHorizontal:16, paddingBottom:16 }}>
        <TouchableOpacity onPress={openAdd} style={styles.primary}><Ionicons name="add" size={18} color="#fff"/><Text style={styles.primaryTxt}>Add Milestone</Text></TouchableOpacity>
      </View>

      <Modal visible={show} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setShow(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={()=>setShow(false)}><Text style={styles.muted}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{editing?"Edit Milestone":"New Milestone"}</Text>
            <TouchableOpacity onPress={save}><Text style={styles.save}>Save</Text></TouchableOpacity>
          </View>
          <View style={{ padding:16 }}>
            <Field label="Title" value={f.title} onChangeText={(t)=>setF({...f,title:t})}/>
            <Field label="Date (YYYY-MM-DD)" value={f.date} onChangeText={(t)=>setF({...f,date:t})} keyboardType={Platform.OS==="web"?"default":"numbers-and-punctuation"}/>
            <Field label="Description" value={f.description} onChangeText={(t)=>setF({...f,description:t})} multiline/>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: MUTED, marginBottom: 6 }}>{label}</Text>
      <TextInput {...props} placeholderTextColor={MUTED} style={{ backgroundColor: CARD, borderWidth:1, borderColor:BORDER, borderRadius:12, padding:12, color: TEXT }}/>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap:{ flex:1, backgroundColor: BG },
  card:{ backgroundColor: CARD, borderWidth:1, borderColor:BORDER, borderRadius:16, padding:14, marginBottom:12 },
  header:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  date:{ color: MUTED, fontWeight:"800" },
  title:{ color: TEXT, fontWeight:"800", fontSize:16, marginTop:6 },
  desc:{ color: TEXT, marginTop:6, lineHeight:20 },
  iconBtn:{ borderWidth:1, borderColor:"rgba(255,255,255,0.18)", padding:8, borderRadius:999, backgroundColor:"rgba(255,255,255,0.06)" },
  iconBtnDanger:{ borderWidth:1, borderColor:"rgba(239,68,68,0.6)", padding:8, borderRadius:999, backgroundColor:"rgba(239,68,68,0.24)" },
  primary:{ backgroundColor: RED, paddingVertical:12, borderRadius:12, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8 },
  primaryTxt:{ color:"#fff", fontWeight:"800" },
  modal:{ flex:1, backgroundColor: BG },
  modalHeader:{ padding:16, borderBottomWidth:1, borderBottomColor:BORDER, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  modalTitle:{ color: TEXT, fontWeight:"800" },
  muted:{ color: MUTED }, save:{ color: RED, fontWeight:"800" },
});
