// src/components/carTabs/TasksTab.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RED="#b10f2e", BG="#0b0b0c", CARD="rgba(255,255,255,0.04)", BORDER="rgba(255,255,255,0.08)", TEXT="#f6f6f7", MUTED="#a9a9b3";
const TABLE="car_tasks";

export default function TasksTab({ car, supabase, onReload }) {
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [show, setShow] = useState(false); const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");

  const load = useCallback(async() => {
    const { data, error } = await supabase.from(TABLE).select("*").eq("car_id", car.id).order("created_at", { ascending:false });
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

  const openAdd = ()=>{ setEditing(null); setTitle(""); setShow(true); };
  const openEdit = (r)=>{ setEditing(r); setTitle(r.title||""); setShow(true); };

  const save = async()=> {
    if (!title.trim()) return Alert.alert("Missing","Task title required.");
    const payload = { car_id: car.id, title: title.trim() };
    if (editing) {
      setRows(prev => prev.map(x => x.id===editing.id ? { ...x, ...payload } : x));
      const { error } = await supabase.from(TABLE).update(payload).eq("id", editing.id);
      if (error) Alert.alert("Error", error.message);
    } else {
      const temp = { id:`temp_${Date.now()}`, completed:false, created_at:new Date().toISOString(), ...payload };
      setRows(prev => [temp, ...prev]);
      const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
      if (error) Alert.alert("Error", error.message);
      else setRows(prev => [data, ...prev.filter(r => r.id !== temp.id)]);
    }
    setShow(false); onReload?.();
  };

  const toggle = async(r) => {
    setRows(prev => prev.map(x => x.id===r.id ? { ...x, completed: !x.completed } : x));
    const { error } = await supabase.from(TABLE).update({ completed: !r.completed }).eq("id", r.id);
    if (error) Alert.alert("Error", error.message); else onReload?.();
  };

  const del = (id) => Alert.alert("Delete task?", "This cannot be undone.", [
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
        <TouchableOpacity onPress={()=>toggle(item)} style={[styles.checkbox, item.completed && styles.checkboxOn]}>
          {item.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>
        <Text style={[styles.title, item.completed && { textDecorationLine:"line-through", opacity:0.6 }]} numberOfLines={2}>{item.title}</Text>
        <TouchableOpacity onPress={()=>openEdit(item)} style={styles.iconBtn}><Ionicons name="create-outline" size={18} color={TEXT}/></TouchableOpacity>
        <TouchableOpacity onPress={()=>del(item.id)} style={styles.iconBtnDanger}><Ionicons name="trash-outline" size={18} color="#fff"/></TouchableOpacity>
      </View>
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
        <TouchableOpacity onPress={openAdd} style={styles.primary}><Ionicons name="add" size={18} color="#fff"/><Text style={styles.primaryTxt}>Add Task</Text></TouchableOpacity>
      </View>

      <Modal visible={show} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setShow(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={()=>setShow(false)}><Text style={styles.muted}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{editing?"Edit Task":"New Task"}</Text>
            <TouchableOpacity onPress={save}><Text style={styles.save}>Save</Text></TouchableOpacity>
          </View>
          <View style={{ padding:16 }}>
            <Text style={{ color: MUTED, marginBottom: 6 }}>Title</Text>
            <TextInput value={title} onChangeText={setTitle} placeholderTextColor={MUTED}
              style={{ backgroundColor: CARD, borderWidth:1, borderColor:BORDER, borderRadius:12, padding:12, color: TEXT }}/>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, backgroundColor: BG },
  card:{ backgroundColor: CARD, borderWidth:1, borderColor:BORDER, borderRadius:16, padding:14, marginBottom:12 },
  header:{ flexDirection:"row", alignItems:"center", gap:10 },
  title:{ color: TEXT, fontWeight:"800", fontSize:16, flex:1 },
  checkbox:{ width:22, height:22, borderRadius:6, borderWidth:1, borderColor:"rgba(255,255,255,0.2)", alignItems:"center", justifyContent:"center", backgroundColor:"rgba(255,255,255,0.04)" },
  checkboxOn:{ backgroundColor: RED, borderColor:"rgba(177,15,46,0.8)" },
  iconBtn:{ borderWidth:1, borderColor:"rgba(255,255,255,0.18)", padding:8, borderRadius:999, backgroundColor:"rgba(255,255,255,0.06)" },
  iconBtnDanger:{ borderWidth:1, borderColor:"rgba(239,68,68,0.6)", padding:8, borderRadius:999, backgroundColor:"rgba(239,68,68,0.24)" },
  primary:{ backgroundColor: RED, paddingVertical:12, borderRadius:12, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8 },
  primaryTxt:{ color:"#fff", fontWeight:"800" },
  modal:{ flex:1, backgroundColor: BG },
  modalHeader:{ padding:16, borderBottomWidth:1, borderBottomColor:BORDER, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  modalTitle:{ color: TEXT, fontWeight:"800" },
  muted:{ color: MUTED }, save:{ color: RED, fontWeight:"800" },
});
