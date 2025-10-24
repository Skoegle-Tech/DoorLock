import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

// Initialize NFC Manager once
NfcManager.start();

export default function ReadNfc() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cardNumber, setCardNumber] = useState(""); // new state to store card number

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
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
    setCardNumber("");
    setLoading(true);

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();
      const cardId = tag?.id || "";
      const RN = cardId.slice(-8).toLowerCase();

      setCardNumber(RN); // save the scanned card number

      // Hit API
      const response = await fetch(`https://taptrack.skoegle.com/card/register?RN=${RN}`);
      const data = await response.json();

      const apiMessage = data.message || "Unknown response";
      setMessage(apiMessage);

      Alert.alert("Response", `Card: ${RN}\nMessage: ${apiMessage}`);
    } catch (err) {
      console.log("NFC Error:", err);
      setMessage("Failed to read NFC card");
    } finally {
      setLoading(false);
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
      {cardNumber ? <Text style={styles.message}>Card Number: {cardNumber}</Text> : null}
      {message ? <Text style={styles.message}>Message: {message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  message: { marginTop: 10, fontSize: 16, color: "#333" },
});
