import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

// Initialize NFC Manager once
NfcManager.start();

export default function ReadNfc() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return () => {
      // ✅ Proper cleanup when component unmounts
      (async () => {
        try {
          await NfcManager.cancelTechnologyRequest();
          await NfcManager.setEventListener(NfcTech.Ndef, "discovered", null);
        } catch (e) {
          console.log("Cleanup error:", e);
        }
      })();
    };
  }, []);

  const readCard = async () => {
    setMessage("");
    setLoading(true);

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Get tag details
      const tag = await NfcManager.getTag();

      // Extract 8-character code
      const cardId = tag?.id || "";
      const RN = cardId.slice(-8).toLowerCase();

      // Hit your API
      const response = await fetch(`https://taptrack.skoegle.com/card/register?RN=${RN}`);
      const data = await response.json();

      setMessage(data.message || "Unknown response");
      Alert.alert("Response", data.message);
    } catch (err) {
      console.log("NFC Error:", err);
      setMessage("Failed to read NFC card");
    } finally {
      setLoading(false);
      // ✅ Proper NFC cleanup after each read
      try {
        await NfcManager.cancelTechnologyRequest();
        await NfcManager.setEventListener(NfcTech.Ndef, "discovered", null);
      } catch (e) {
        console.log("Cancel error:", e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TapTrack NFC Register</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button title="Read NFC Card" onPress={readCard} />
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  message: { marginTop: 20, fontSize: 16, color: "#333" },
});
