// screens/ChatScreen.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/colors";
import { chatService } from "../services/chatService";
import { useAuth } from "../contexts/AuthContext";

export default function ChatScreen({ route, navigation }) {
  const { chatId, chatName } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  const load = useCallback(async () => {
    const { data } = await chatService.getMessages(chatId, { limit: 100 });
    setMessages(data);
    // Scroll to bottom after initial load
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: false })
    );
  }, [chatId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: chatName || "Chat",
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    });
  }, [chatName, navigation]);

  useEffect(() => {
    load();
    const unsubscribe = chatService.subscribeToMessages(chatId, (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    });
    return unsubscribe;
  }, [chatId, load]);

  const onSend = async () => {
    if (!user?.id) return;
    const text = input.trim();
    if (!text) return;

    // optimistic add
    const temp = {
      id: `temp_${Date.now()}`,
      chat_id: chatId,
      sender_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, temp]);
    setInput("");

    const { error } = await chatService.sendMessage({
      chatId,
      senderId: user.id,
      content: text,
    });

    if (error) {
      // rollback optimistic (or mark failed)
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      // optionally show toast
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
        <LinearGradient
          colors={isMine ? colors.purpleGradient : colors.blueGradient}
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
          ]}
        >
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.msgTime}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputBar}>
        <View style={styles.inputWrap}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            autoCorrect
            autoCapitalize="sentences"
            returnKeyType="send"
            onSubmitEditing={onSend}
          />
        </View>
        <TouchableOpacity
          onPress={onSend}
          style={styles.sendBtn}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.purpleGradient}
            style={styles.sendGrad}
          >
            <Ionicons name="send" size={18} color={colors.textPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 12, paddingBottom: 80 },
  row: { marginVertical: 6, maxWidth: "80%" },
  rowMine: { alignSelf: "flex-end" },
  rowOther: { alignSelf: "flex-start" },
  bubble: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  msgText: { color: colors.textPrimary, fontSize: 14, lineHeight: 19 },
  msgTime: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
    textAlign: "right",
  },
  inputBar: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28,28,30,0.95)",
    borderTopColor: "rgba(255,55,95,0.2)",
    borderTopWidth: 0.5,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 0,
    gap: 8,
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  sendBtn: { marginLeft: 10 },
  sendGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
