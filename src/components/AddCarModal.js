// src/components/AddCarModal.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

const RED = "#b10f2e";
              const BG = "#0b0b0c";
              const CARD = "rgba(255,255,255,0.04)";
              const BORDER = "rgba(255,255,255,0.08)";
              const TEXT = "#f6f6f7";
              const MUTED = "#a9a9b3";
              const BUCKET = "car-photos";

              export default function AddCarModal({ visible, onClose, supabase, user, onAdded }) {
                const insets = useSafeAreaInsets();
                const [make, setMake] = useState("");
                const [model, setModel] = useState("");
                const [year, setYear] = useState("");
                const [trim, setTrim] = useState("");
                const [mileage, setMileage] = useState("");
                const [coverUri, setCoverUri] = useState(null);
                const [uploading, setUploading] = useState(false);

                const pickImage = async () => {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== "granted") {
                    Alert.alert("Permission required", "Please allow photo library access.");
                    return;
                  }

                  const r = await ImagePicker.launchImageLibraryAsync({
                    allowsEditing: true,
                    quality: 0.8,
                  });

                  // Support both new (assets) and legacy (uri) result shapes
                  if (!r.canceled && r.assets && r.assets.length) {
                    setCoverUri(r.assets[0].uri);
                  } else if (r.uri) {
                    setCoverUri(r.uri);
                  }
                };

                const uploadCover = async (uri, carId) => {
                  try {
                    const filename = `car_${carId}/cover_${Date.now()}.jpg`;
                    let uploadData = null;

                    // Primary: FileSystem.readAsStringAsync (most reliable on Expo/RN)
                    try {
                      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });

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
                      // fallback to fetch
                      uploadData = null;
                    }

                    // Fallback: fetch + arrayBuffer
                    if (!uploadData) {
                      try {
                        const res = await fetch(uri);
                        if (typeof res.arrayBuffer === "function") {
                          const ab = await res.arrayBuffer();
                          uploadData = ab instanceof ArrayBuffer ? new Uint8Array(ab) : new Uint8Array(ab.buffer || ab);
                        }
                      } catch (fetchErr) {
                        uploadData = null;
                      }
                    }

                    if (!uploadData) {
                      throw new Error("Failed to read cover image for upload.");
                    }

                    const { error: upErr } = await supabase.storage.from(BUCKET).upload(filename, uploadData, {
                      contentType: "image/jpeg",
                    });
                    if (upErr) throw upErr;
                    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
                    return pub?.publicUrl || null;
                  } catch (e) {
                    console.log("AddCarModal uploadCover error:", e);
                    return null;
                  }
                };

                const handleAdd = async () => {
                  if (!make.trim() || !model.trim() || !year.trim()) {
                    Alert.alert("Missing fields", "Please fill in make, model, and year.");
                    return;
                  }
                  try {
                    setUploading(true);

                    const { data: insertData, error: insertError } = await supabase
                      .from("cars")
                      .insert({
                        user_id: user?.id ?? null,
                        make: make.trim(),
                        model: model.trim(),
                        year: parseInt(year),
                        trim: trim?.trim() || null,
                        mileage: mileage ? parseInt(mileage) : 0,
                        is_public: false,
                      })
                      .select()
                      .single();

                    if (insertError) throw insertError;
                    let coverUrl = null;

                    if (coverUri) {
                      coverUrl = await uploadCover(coverUri, insertData.id);
                      if (coverUrl) {
                        await supabase.from("cars").update({ cover_url: coverUrl }).eq("id", insertData.id);
                      }
                    }

                    onAdded?.(insertData);
                    Alert.alert("Success", "Car added successfully!");
                    resetForm();
                    onClose?.();
                  } catch (e) {
                    console.error(e);
                    Alert.alert("Error", e.message || "Failed to add car.");
                  } finally {
                    setUploading(false);
                  }
                };

                const resetForm = () => {
                  setMake("");
                  setModel("");
                  setYear("");
                  setTrim("");
                  setMileage("");
                  setCoverUri(null);
                };

                return (
                  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
                    <SafeAreaView style={[styles.modal, { paddingTop: insets.top }]}> 
                      <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                      >
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.form, { paddingBottom: 180 + insets.bottom }]}>
                          <View style={styles.headerRow}>
                            <View style={styles.dragHandle} />
                            <Text style={styles.title}>Add a Car</Text>
                          </View>

                          <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Basic Info</Text>
                            <Field label="Make" value={make} onChangeText={setMake} />
                            <Field label="Model" value={model} onChangeText={setModel} />

                            <View style={styles.row}>
                              <View style={{ flex: 1, paddingRight: 8 }}>
                                <Field label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Field label="Mileage" value={mileage} onChangeText={setMileage} keyboardType="numeric" />
                              </View>
                            </View>

                            <Field label="Trim" value={trim} onChangeText={setTrim} />
                          </View>

                          <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Cover Photo</Text>
                            <View style={styles.coverRow}>
                              <View style={styles.coverPreviewCard}>
                                {coverUri ? (
                                  <Image source={{ uri: coverUri }} style={styles.coverImage} />
                                ) : (
                                  <View style={styles.coverPlaceholder}>
                                    <Ionicons name="images-outline" size={36} color={MUTED} />
                                    <Text style={{ color: MUTED, marginTop: 8 }}>No cover selected</Text>
                                  </View>
                                )}
                              </View>

                              <View style={styles.coverActions}>
                                <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                  <Text style={styles.actionTxt}>Pick</Text>
                                </TouchableOpacity>
                                {coverUri && (
                                  <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: CARD, marginTop: 10 }]}
                                    onPress={() => setCoverUri(null)}
                                  >
                                    <Ionicons name="trash-outline" size={18} color={MUTED} />
                                    <Text style={[styles.actionTxt, { color: MUTED }]}>Remove</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </View>

                          <View style={{ height: 8 }} />
                        </ScrollView>

                        {/* Fixed footer buttons */}
                        <View style={[styles.modalFooter, { bottom: 0, paddingBottom: insets.bottom + 12 }]}>
                          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={styles.muted}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handleAdd} disabled={uploading} style={styles.saveBtn}>
                            <Text style={[styles.save, uploading && { opacity: 0.6 }]}>
                              {uploading ? "Saving..." : "Save"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </KeyboardAvoidingView>
                    </SafeAreaView>
                  </Modal>
                );
              }

              function Field({ label, ...props }) {
                return (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: MUTED, marginBottom: 6 }}>{label}</Text>
                    <TextInput
                      {...props}
                      placeholderTextColor={MUTED}
                      style={{
                        backgroundColor: CARD,
                        borderWidth: 1,
                        borderColor: BORDER,
                        borderRadius: 12,
                        padding: 12,
                        color: TEXT,
                      }}
                    />
                  </View>
                );
              }

              const styles = StyleSheet.create({
                modal: { flex: 1, backgroundColor: BG },
                headerRow: { alignItems: "center", marginBottom: 8 },
                dragHandle: { width: 48, height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 999, alignSelf: "center", marginVertical: 8 },
                title: { color: TEXT, fontSize: 20, fontWeight: "800", textAlign: "center", marginTop: 4 },
                card: { backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
                sectionTitle: { color: TEXT, fontWeight: "700", marginBottom: 8 },
                row: { flexDirection: "row" },
                coverRow: { flexDirection: "row", alignItems: "center" },
                coverPreviewCard: { width: 120, height: 80, borderRadius: 10, overflow: "hidden", backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },
                coverImage: { width: "100%", height: "100%", resizeMode: "cover" },
                coverPlaceholder: { alignItems: "center", justifyContent: "center" },
                coverActions: { flex: 1, paddingLeft: 12, justifyContent: "center" },
                actionBtn: { backgroundColor: RED, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center" },
                actionTxt: { color: "#fff", marginLeft: 8, fontWeight: "700" },
                modalFooter: {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderTopWidth: 1,
                  borderTopColor: BORDER,
                  backgroundColor: BG,
                  justifyContent: "space-between",
                  zIndex: 50,
                  elevation: 50,
                },
                cancelBtn: {
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: BORDER,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                },
                saveBtn: {
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: RED,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                },
                save: { color: "#fff", fontWeight: "700" },
                muted: { color: MUTED },
                form: { padding: 16, paddingBottom: 40 },
                uploadBox: {
                  backgroundColor: CARD,
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 12,
                  height: 180,
                  alignItems: "center",
                  justifyContent: "center",
                },
              });
