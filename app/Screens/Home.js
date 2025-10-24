import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, DataTable, Text, Divider, Searchbar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const API_URL = "https://payslip.skoegle.com/api";

function Home() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setLoading(false);
    }
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        emp => 
          emp.name.toLowerCase().includes(query.toLowerCase()) ||
          emp.department.toLowerCase().includes(query.toLowerCase()) ||
          emp.employeeNumber.toString().includes(query)
      );
      setFilteredEmployees(filtered);
    }
  };

  const handleMapPress = (employee) => {
    navigation.navigate('MapCard', { employee });
  };

  const renderEmployeeCard = ({ item }) => (
    <Card style={styles.card} elevation={2}>
      <Card.Content>
        <Title style={styles.name}>{item.name}</Title>
        <View style={styles.detailRow}>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>Designation</Text>
            <Paragraph>{item.designation}</Paragraph>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>Department</Text>
            <Paragraph>{item.department}</Paragraph>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>Employee Number</Text>
            <Paragraph>{item.employeeNumber}</Paragraph>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>Email</Text>
            <Paragraph style={styles.email}>{item.email}</Paragraph>
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="contained" 
          onPress={() => handleMapPress(item)}
          style={styles.mapButton}
          icon="map-marker"
        >
          Map
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Employee Directory</Title>
        <Searchbar
          placeholder="Search employees..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading employees...</Text>
        </View>
      ) : (
        <>
          {filteredEmployees.length > 0 ? (
            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderEmployeeCard}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No employees found</Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 0,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  detailColumn: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingTop: 0,
  },
  mapButton: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
  }
});

export default Home;