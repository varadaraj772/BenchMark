import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Initialize MMKV storage
const storage = new MMKV();

// Benchmark functions for AsyncStorage
const asyncStorageWrite = async (key, value) => {
  const startTime = performance.now();
  await AsyncStorage.setItem(key, JSON.stringify(value));
  const endTime = performance.now();
  return endTime - startTime;
};

const asyncStorageRead = async (key) => {
  const startTime = performance.now();
  const value = await AsyncStorage.getItem(key);
  const endTime = performance.now();
  return { time: endTime - startTime, value: JSON.parse(value) };
};

// Benchmark functions for MMKV
const mmkvWrite = (key, value) => {
  const startTime = performance.now();
  storage.set(key, JSON.stringify(value));
  const endTime = performance.now();
  return endTime - startTime;
};

const mmkvRead = (key) => {
  const startTime = performance.now();
  const value = storage.getString(key);
  const endTime = performance.now();
  return { time: endTime - startTime, value: JSON.parse(value) };
};

// Run benchmark tests for given data size
const runBenchmark = async (size) => {
  const data = Array.from({ length: size }, (_, i) => ({ id: i, value: `Data ${i}` }));

  const asyncWriteTime = await asyncStorageWrite('asyncKey', data);
  const asyncReadResult = await asyncStorageRead('asyncKey');
  
  const mmkvWriteTime = mmkvWrite('mmkvKey', data);
  const mmkvReadResult = mmkvRead('mmkvKey');

  const asyncAvg = (asyncWriteTime + asyncReadResult.time) / 2;
  const mmkvAvg = (mmkvWriteTime + mmkvReadResult.time) / 2;

  // Calculate differences between AsyncStorage and MMKV for read and write
  const writeDifference = Math.abs(asyncWriteTime - mmkvWriteTime);
  const readDifference = Math.abs(asyncReadResult.time - mmkvReadResult.time);

  console.log("AsyncStorage Read: ", asyncReadResult.time, "MMKV Read: ", mmkvReadResult.time);
  console.log("AsyncStorage Write: ", asyncWriteTime, "MMKV Write: ", mmkvWriteTime);
  return {
    size,
    asyncWriteTime,
    asyncReadTime: asyncReadResult.time,
    asyncAvg,
    mmkvWriteTime,
    mmkvReadTime: mmkvReadResult.time,
    mmkvAvg,
    writeDifference,
    readDifference,
  };
};

const App = () => {
  const [results, setResults] = useState([]);

  const handleRunTests = async (size) => {
    const result = await runBenchmark(size);
    setResults(prevResults => [...prevResults, result]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Storage Benchmark</Text>

      <View style={styles.buttonContainer}>
        <Button title="Small Test" onPress={() => handleRunTests(10)} />
        <Button title="Medium Test" onPress={() => handleRunTests(1000)} />
        <Button title="Large Test" onPress={() => handleRunTests(100000)} />
      </View>

      {results.length > 0 && results.map((result, index) => (
        <View key={index} style={styles.resultCard}>
          <Text style={styles.cardTitle}>Data Size: {result.size}</Text>
          <BarChart
            data={{
              labels: ['Async Write', 'Async Read', 'MMKV Write', 'MMKV Read'],
              datasets: [{ data: [result.asyncWriteTime, result.asyncReadTime, result.mmkvWriteTime, result.mmkvReadTime] }]
            }}
            width={screenWidth - 40}
            height={200}
            yAxisSuffix=" ms"
            chartConfig={chartConfig}
            style={styles.chartStyle}
          />
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Async Avg:</Text>
              <Text style={styles.summaryValue}>{result.asyncAvg.toFixed(2)} ms</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>MMKV Avg:</Text>
              <Text style={styles.summaryValue}>{result.mmkvAvg.toFixed(2)} ms</Text>
            </View>
          </View>
          <View style={styles.differenceContainer}>
            <View style={styles.differenceItem}>
              <Text style={styles.differenceLabel}>Write Diff (Async vs MMKV):</Text>
              <Text style={styles.differenceValue}>{result.writeDifference.toFixed(2)} ms</Text>
            </View>
            <View style={styles.differenceItem}>
              <Text style={styles.differenceLabel}>Read Diff (Async vs MMKV):</Text>
              <Text style={styles.differenceValue}>{result.readDifference.toFixed(2)} ms</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  chartStyle: {
    borderRadius: 10,
    marginVertical: 10,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  differenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  differenceItem: {
    flex: 1,
    alignItems: 'center',
  },
  differenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  differenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
});

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#f5f5f5',
  backgroundGradientTo: '#f5f5f5',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.5,
  style: {
    borderRadius: 10,
  },
};

export default App;

