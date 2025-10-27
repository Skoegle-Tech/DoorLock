import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import axios from "axios";
import {
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Text,
  Divider,
  Chip,
  Portal,
  Modal,
  Provider,
  Surface,
  List,
  Appbar,
  Avatar,
  Badge,
  IconButton,
  Searchbar,
  DataTable,
  Menu,
  Switch,
  SegmentedButtons,
  useTheme,
  TextInput,
} from "react-native-paper";

const BASE_URL = "https://taptrack.skoegle.com";

export default function Map() {
  const route = useRoute();
  const { employee } = route.params;
  const theme = useTheme();

  const [mappedCard, setMappedCard] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [emergencyPass, setEmergencyPass] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownText, setDropdownText] = useState("Select a card");

  // --- Activity Logs State ---
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [totalLogPages, setTotalLogPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const LOGS_LIMIT = 5;

  // --- Employee-dependent effects ---
  useEffect(() => {
    if (employee?.employeeNumber) {
      checkMapping(employee.employeeNumber);
      fetchActivityLogs(logPage); // load first page
    }
  }, [employee]);

  useEffect(() => {
    if (!employee?.employeeNumber) return;
    fetchRealtimeStatus(); // initial load
    const interval = setInterval(() => fetchRealtimeStatus(), 5000);
    return () => clearInterval(interval);
  }, [employee]);

  useEffect(() => {
    if (employee?.employeeNumber) fetchActivityLogs(logPage);
  }, [logPage]);

  // --- API Functions ---
  async function checkMapping(employeeNumber) {
    try {
      const res = await fetch(
        `${BASE_URL}/user/mapped-users?UserId=${employeeNumber}`
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setMappedCard(data[0]);
        fetchCardStatus(data[0].RfidNumber);
      } else if (data && data.UserId) {
        setMappedCard(data);
        fetchCardStatus(data.RfidNumber);
      } else {
        setMappedCard(null);
        fetchAvailableCards();
      }
    } catch (err) {
      console.error("Error fetching mapping:", err);
    }
  }

  async function ManageUser() {
    setLoading(true);
    console.log("mappedCard", mappedCard?.UserType);
    try {
      if (mappedCard?.UserType === "master") {
        await axios.get(
          `${BASE_URL}/user/removeMaster?UserId=${employee.employeeNumber}`
        );
        alert("✅ master removed successfully!");
        return;
      }
        await axios.get(
          `${BASE_URL}/user/makemaster?UserId=${employee.employeeNumber}`
        );
        alert("✅ master set successfully!");
      
    } catch (error) {
      alert("An error occurred while managing user.");
    } finally {
      setLoading(false);
      checkMapping(employee.employeeNumber);
      
    }
  }

  async function fetchAvailableCards() {
    try {
      const res = await fetch(`${BASE_URL}/card/cards`);
      const data = await res.json();
      const unmapped = data.filter((card) => !card.RFIDMapping);
      setAvailableCards(unmapped);
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  }

  async function fetchCardStatus(RfidNumber) {
    try {
      const res = await fetch(
        `${BASE_URL}/card/status?RfidNumber=${RfidNumber}`
      );
      const data = await res.json();
      setIsActive(data.isActive);
    } catch (err) {
      console.error("Error fetching card status:", err);
    }
  }

  async function fetchRealtimeStatus() {
    if (!employee) return;
    try {
      const res = await fetch(
        `${BASE_URL}/activity/realtime-status?UserId=${employee.employeeNumber}`
      );
      const data = await res.json();
      setRealtimeStatus(data);
    } catch (err) {
      console.error("Error fetching realtime status:", err);
    }
  }

  async function fetchActivityLogs(page = 1) {
    if (!employee) return;
    setLogsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/activity/activity-log?UserId=${employee.employeeNumber}&page=${page}&limit=${LOGS_LIMIT}`
      );
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalLogPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }

  // --- Handlers ---
  async function handleMap() {
    if (!selectedCard) {
      alert("Please select a card");
      return;
    }
    setLoading(true);

    try {
      const body = {
        RfidNumber: selectedCard,
        UserId: employee.employeeNumber,
        UserName: employee.name,
      };
      const res = await fetch(`${BASE_URL}/user/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Mapping failed");
      alert("✅ Card mapped successfully!");
      checkMapping(employee.employeeNumber);
    } catch (err) {
      console.error("Error mapping card:", err);
      alert("Failed to map card");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnmap() {
    if (!mappedCard) return;
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/user/unmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RfidNumber: mappedCard.RfidNumber }),
      });
      if (!res.ok) throw new Error("Unmapping failed");
      alert("✅ Card unmapped successfully!");
      setMappedCard(null);
      setIsActive(true);
      fetchAvailableCards();
    } catch (err) {
      console.error("Error unmapping card:", err);
      alert("Failed to unmap card");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActivation() {
    if (!mappedCard) return;
    setLoading(true);

    try {
      const apiUrl = isActive
        ? `${BASE_URL}/card/deactivate`
        : `${BASE_URL}/card/activate`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RfidNumber: mappedCard.RfidNumber }),
      });

      if (!res.ok) throw new Error("Failed to toggle activation");

      alert(isActive ? "⚠️ Card deactivated!" : "✅ Card activated!");
      setIsActive(!isActive);
    } catch (err) {
      console.error("Error toggling card activation:", err);
      alert("Failed to toggle card activation");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmergencyPass() {
    if (!employee) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${BASE_URL}/user/emergency-status?UserId=${employee.employeeNumber}`
      );
      const data = await res.json();
      setEmergencyPass(data);
      alert("✅ Emergency pass generated!");
    } catch (err) {
      console.error("Error generating emergency pass:", err);
      alert("Failed to generate emergency pass");
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    if (employee?.employeeNumber) {
      await Promise.all([
        checkMapping(employee.employeeNumber),
        fetchRealtimeStatus(),
        fetchActivityLogs(1),
      ]);
      setLogPage(1);
    }
    setRefreshing(false);
  };

  const selectCard = (card) => {
    setSelectedCard(card.RfidNumber);
    setDropdownText(card.RfidNumber);
    setShowDropdown(false);
  };

  if (!employee)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No employee selected.</Text>
      </View>
    );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Employee Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.employeeHeader}>
            <Avatar.Text
              size={60}
              label={employee.name.substring(0, 2).toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.employeeDetails}>
              <Title>{employee.name}</Title>
              <Paragraph style={styles.designation}>
                {employee.designation} • {employee.department}
              </Paragraph>
              <View style={styles.employeeChips}>
                <Chip
                  icon="id-card"
                  mode="outlined"
                  style={styles.chip}
                  textStyle={styles.smallText}
                >
                  {employee.employeeNumber}
                </Chip>
                <Chip
                  icon="email"
                  mode="outlined"
                  style={styles.chip}
                  textStyle={styles.smallText}
                >
                  {employee.email.split("@")[0]}
                </Chip>
              </View>
            </View>
          </View>
          <Divider style={styles.divider} />
          <Button
            mode="contained"
            icon={
              mappedCard?.UserType === "master"
                ? "card-remove"
                : "card-account-details"
            }
            onPress={ManageUser}
            disabled={loading}
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  mappedCard?.UserType === "master"
                    ? "#ffc107"
                    : theme.colors.primary,
              },
            ]}
            loading={loading}
          >
            {mappedCard?.UserType === "master" ? "master" : "employee"}
          </Button>
        </Card.Content>
      </Card>

      {mappedCard ? (
        <View>
          {/* Mapped Card Section */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View>
                  <Title style={styles.cardTitle}>Card Information</Title>
                  <Badge
                    style={{
                      backgroundColor: isActive
                        ? theme.colors.primary
                        : theme.colors.error,
                      alignSelf: "flex-start",
                    }}
                  >
                    {isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </View>
                <IconButton
                  icon="refresh"
                  mode="contained"
                  size={20}
                  onPress={() => checkMapping(employee.employeeNumber)}
                />
              </View>

              <List.Item
                title="RFID Number"
                description={mappedCard.RfidNumber}
                left={(props) => <List.Icon {...props} icon="nfc" />}
              />
              <List.Item
                title="User ID"
                description={mappedCard.UserId}
                left={(props) => <List.Icon {...props} icon="identifier" />}
              />
              <List.Item
                title="User Type"
                description={mappedCard.UserType || "N/A"}
                left={(props) => (
                  <List.Icon {...props} icon="account-details" />
                )}
              />
              <Divider style={styles.divider} />

              <View style={styles.actionButtonsRow}>
                <Button
                  mode="contained"
                  icon="credit-card-remove"
                  onPress={handleUnmap}
                  disabled={loading}
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.error },
                  ]}
                  loading={loading}
                >
                  Unmap
                </Button>

                <Button
                  mode="contained"
                  icon={isActive ? "card-remove" : "card-account-details"}
                  onPress={handleToggleActivation}
                  disabled={loading}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: isActive
                        ? "#ffc107"
                        : theme.colors.primary,
                    },
                  ]}
                  loading={loading}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </Button>

                <Button
                  mode="contained"
                  icon="shield-key"
                  onPress={handleEmergencyPass}
                  disabled={loading}
                  style={[styles.actionButton, { backgroundColor: "#17a2b8" }]}
                  loading={loading}
                >
                  Emergency
                </Button>
              </View>

              {emergencyPass && (
                <Surface style={styles.emergencyPassContainer} elevation={1}>
                  <Text style={styles.emergencyHeader}>Emergency Pass</Text>
                  <Text style={styles.emergencyCode}>
                    {emergencyPass.passId ||
                      emergencyPass.code ||
                      JSON.stringify(emergencyPass)}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>

          {/* Realtime Status Section */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.cardTitle}>Realtime Status</Title>
                <IconButton
                  icon="refresh"
                  mode="contained"
                  size={20}
                  onPress={fetchRealtimeStatus}
                />
              </View>

              {realtimeStatus ? (
                <View>
                  <View style={styles.statusRow}>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>User</Text>
                      <Text style={styles.statusValue}>
                        {realtimeStatus.UserName}
                      </Text>
                    </View>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Status</Text>
                      <Chip
                        mode="flat"
                        style={{
                          backgroundColor:
                            realtimeStatus.type === "check-in"
                              ? "#4caf50"
                              : realtimeStatus.type === "check-out"
                              ? "#f44336"
                              : "#ff9800",
                        }}
                        textStyle={{ color: "white", fontWeight: "bold" }}
                      >
                        {realtimeStatus.type?.toUpperCase() || "UNKNOWN"}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.timeRow}>
                    <View style={styles.timeItem}>
                      <Text style={styles.timeLabel}>Check In</Text>
                      <Text style={styles.timeValue}>
                        {realtimeStatus.CardCheckInTime || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.timeItem}>
                      <Text style={styles.timeLabel}>Check Out</Text>
                      <Text style={styles.timeValue}>
                        {realtimeStatus.CardCheckOutTime || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    No realtime data available
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Activity Logs Section */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title style={styles.cardTitle}>Activity Logs</Title>
                <Text>{`Page ${logPage} of ${totalLogPages}`}</Text>
              </View>

              {logsLoading ? (
                <ActivityIndicator animating={true} style={styles.loader} />
              ) : logs.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No activity logs found</Text>
                </View>
              ) : (
                <>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Type</DataTable.Title>
                      <DataTable.Title>Time</DataTable.Title>
                    </DataTable.Header>

                    {logs.map((log, index) => (
                      <DataTable.Row key={index}>
                        <DataTable.Cell>
                          <Chip
                            mode="flat"
                            style={{
                              backgroundColor:
                                log.type === "check-in" ? "#4caf50" : "#f44336",
                              height: 26,
                            }}
                            textStyle={{ color: "white", fontSize: 10 }}
                          >
                            {log.type.toUpperCase()}
                          </Chip>
                        </DataTable.Cell>
                        <DataTable.Cell>
                          {log.CardCheckInTime || log.CardCheckOutTime || "N/A"}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>

                  <View style={styles.paginationContainer}>
                    <Button
                      mode="outlined"
                      icon="chevron-left"
                      onPress={() => setLogPage(Math.max(logPage - 1, 1))}
                      disabled={logPage === 1}
                      style={styles.paginationButton}
                    >
                      Prev
                    </Button>
                    <Button
                      mode="outlined"
                      icon="chevron-right"
                      contentStyle={{ flexDirection: "row-reverse" }}
                      onPress={() =>
                        setLogPage(Math.min(logPage + 1, totalLogPages))
                      }
                      disabled={logPage === totalLogPages}
                      style={styles.paginationButton}
                    >
                      Next
                    </Button>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </View>
      ) : (
        /* New Mapping Section */
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Map New Card</Title>
            <Text style={styles.cardSubtitle}>
              Assign an RFID card to this employee
            </Text>

            {/* Custom dropdown replacement for Picker */}
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text>{dropdownText}</Text>
                <IconButton icon="chevron-down" size={20} />
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownItems}>
                  {availableCards.length > 0 ? (
                    availableCards.map((card) => (
                      <TouchableOpacity
                        key={card.id}
                        style={styles.dropdownItem}
                        onPress={() => selectCard(card)}
                      >
                        <Text>{card.RfidNumber}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noCardsText}>
                      No available cards found
                    </Text>
                  )}
                </View>
              )}
            </View>

            <Button
              mode="contained"
              icon="credit-card-plus"
              onPress={handleMap}
              disabled={loading || !selectedCard}
              style={styles.mapButton}
              loading={loading}
            >
              Map User to Card
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  employeeDetails: {
    marginLeft: 15,
    flex: 1,
  },
  designation: {
    fontSize: 14,
    marginBottom: 8,
  },
  employeeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
    height: 26,
  },
  smallText: {
    fontSize: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardSubtitle: {
    marginBottom: 16,
    color: "#757575",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  emergencyPassContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: "#e3f2fd",
  },
  emergencyHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0d47a1",
    marginBottom: 4,
  },
  emergencyCode: {
    fontSize: 16,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    color: "#757575",
  },
  loader: {
    margin: 20,
  },
  pickerContainer: {
    marginVertical: 16,
    position: "relative",
    zIndex: 1,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 10,
    paddingLeft: 16,
  },
  dropdownItems: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    maxHeight: 200,
    overflow: "scroll",
    zIndex: 2,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  noCardsText: {
    textAlign: "center",
    padding: 15,
    color: "#757575",
  },
  mapButton: {
    marginTop: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  paginationButton: {
    marginHorizontal: 8,
  },
});
