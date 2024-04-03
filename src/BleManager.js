import React, {useState, useEffect} from 'react';
import {View, Text, Button, FlatList, TextInput, Switch} from 'react-native';
import BleManager from 'react-native-ble-manager';
import {NativeEventEmitter} from 'react-native';

export const BleManagerComponent = (props) => {

  const [peripherals, setPeripherals] = useState([]);
  const [connectedPeripheral, setConnectedPeripheral] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [serviceUUID, setServiceUUID] = useState('');
  const [characteristicUUID, setCharacteristicUUID] = useState('');
  const [readValue, setReadValue] = useState('');
  const [value, setValue] = useState('');
  const [writeConfirmation, setWriteConfirmation] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionConfirmation, setSubscriptionConfirmation] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

// useEffect hooks
useEffect(() => {
    // Initialize BLE manager when component mounts
    BleManager.start({showAlert: false});

    // Create an event emitter instance
    const bleManagerEmitter = new NativeEventEmitter(BleManager);

    // Add event listeners for BLE events
    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral) => {
      // Update peripherals array with scanned device
      setPeripherals((prevPeripherals) => [...prevPeripherals, peripheral]);
    });

    bleManagerEmitter.addListener('BleManagerStopScan', () => {
      // Update scanning state
      setScanning(false);
    });

    bleManagerEmitter.addListener('BleManagerConnectPeripheral', (peripheral) => {
      // Update connected peripheral object
      setConnectedPeripheral(peripheral);
    });

    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', (peripheral) => {
      // Update connected peripheral object
      setConnectedPeripheral(null);
    });

    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', ({value, peripheral, characteristic, service}) => {
      // Display notification message
      console.log(`Received notification from ${peripheral} - ${service} - ${characteristic}: ${value}`);
    });

    return () => {
      // Remove event listeners when component unmounts
      bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerStopScan');
      bleManagerEmitter.removeAllListeners('BleManagerConnectPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerDisconnectPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerDidUpdateValueForCharacteristic');
    };
  }, []);


  const scan = () => {
    // Check if scanning is already in progress
    if (scanning) {
      return;
    }

    // Clear peripherals array
    setPeripherals([]);

    // Start scanning for devices that match a given service UUID filter
    BleManager.scan(['180D'], 5, true)
      .then(() => {
        // Update scanning state
        setScanning(true);
      })
      .catch((err) => {
        // Update error message
        setError(err.message);
      });
  };

  const stopScan = () => {
    // Stop scanning for devices
    BleManager.stopScan()
      .then(() => {
        // Update scanning state
        setScanning(false);
      })
      .catch((err) => {
        // Update error message
        setError(err.message);
      });
  };

  const connect = (id) => {
    // Connect to a device by its ID
    BleManager.connect(id)
      .then(() => {
        // Retrieve device information
        BleManager.retrieveServices(id)
          .then((peripheralInfo) => {
            // Update connected peripheral object with device information
            setConnectedPeripheral(peripheralInfo);
          })
          .catch((err) => {
            // Update error message
            setError(err.message);
          });
      })
      .catch((err) => {
        // Update error message
        setError(err.message);
      });
  };

  const disconnect = () => {
    // Check if there is a connected device
    if (connectedPeripheral) {
      // Disconnect from the device by its ID
      BleManager.disconnect(connectedPeripheral.id)
        .then(() => {
          // Update connected peripheral object
          setConnectedPeripheral(null);
        })
        .catch((err) => {
          // Update error message
          setError(err.message);
        });
    }
  };


  const read = (serviceUUID, characteristicUUID) => {
    // Check if there is a connected device
    if (connectedPeripheral) {
      // Read a characteristic value from the device by its service UUID and characteristic UUID
      BleManager.read(connectedPeripheral.id, serviceUUID, characteristicUUID)
        .then((value) => {
          // Display read value
          console.log(`Read value from ${connectedPeripheral.id} - ${serviceUUID} - ${characteristicUUID}: ${value}`);
        })
        .catch((err) => {
          // Update error message
          setError(err.message);
        });
    }
  };

  const write = (serviceUUID, characteristicUUID, value) => {
    // Check if there is a connected device
    if (connectedPeripheral) {
      // Write a characteristic value to the device by its service UUID and characteristic UUID
      BleManager.write(connectedPeripheral.id, serviceUUID, characteristicUUID, value)
        .then(() => {
          // Display confirmation message
          console.log(`Wrote value to ${connectedPeripheral.id} - ${serviceUUID} - ${characteristicUUID}: ${value}`);
        })
        .catch((err) => {
          // Update error message
          setError(err.message);
        });
    }
  };

  const subscribe = (serviceUUID, characteristicUUID) => {
    // Check if there is a connected device
    if (connectedPeripheral) {
      // Subscribe to notifications or indications from a characteristic of the device by its service UUID and characteristic UUID
      BleManager.startNotification(connectedPeripheral.id, serviceUUID, characteristicUUID)
        .then(() => {
          // Display confirmation message
          console.log(`Subscribed to ${connectedPeripheral.id} - ${serviceUUID} - ${characteristicUUID}`);
        })
        .catch((err) => {
          // Update error message
          setError(err.message);
        });
    }
  };


  const unsubscribe = (serviceUUID, characteristicUUID) => {
    // Check if there is a connected device
    if (connectedPeripheral) {
      // Unsubscribe from notifications or indications from a characteristic of the device by its service UUID and characteristic UUID
      BleManager.stopNotification(connectedPeripheral.id, serviceUUID, characteristicUUID)
        .then(() => {
          // Display confirmation message
          console.log(`Unsubscribed from ${connectedPeripheral.id} - ${serviceUUID} - ${characteristicUUID}`);
        })
        .catch((err) => {
          // Update error message
          setError(err.message);
        });
    }
  };


   return (
    <View style={{ flex: 1, padding: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>React Native BLE Manager</Text>
        <Button title={scanning ? 'Stop Scanning' : 'Start Scanning'} onPress={scanning ? stopScan : scan} />

        <FlatList
            data={peripherals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View style={{ borderWidth: 1, margin: 5, padding: 5 }}>
                    <Text>ID: {item.id}</Text>
                    <Text>Name: {item.name}</Text>
                    <Text>RSSI: {item.rssi}</Text>
                    <Text>Services: {item.advertising.serviceUUIDs}</Text>
                    <Button title="Connect" onPress={() => connect(item.id)} />
                </View>
            )}
        />

        {connectedPeripheral && (
            <View style={{ borderWidth: 1, margin: 5, padding: 5 }}>
                <Text>ID: {connectedPeripheral.id}</Text>
                <Text>Name: {connectedPeripheral.name}</Text>
                <Text>RSSI: {connectedPeripheral.rssi}</Text>
                <Text>Services: {JSON.stringify(connectedPeripheral.services)}</Text>
                <Text>Characteristics: {JSON.stringify(connectedPeripheral.characteristics)}</Text>
                <Button title="Disconnect" onPress={disconnect} />

                <TextInput placeholder="Enter service UUID" onChangeText={(text) => setServiceUUID(text)} />
                <TextInput placeholder="Enter characteristic UUID" onChangeText={(text) => setCharacteristicUUID(text)} />
                <Button title="Read" onPress={() => read(serviceUUID, characteristicUUID)} />
                
                <Text>Read value: {readValue}</Text> <TextInput placeholder="Enter value to write" onChangeText={(text) => setValue(text)} />
                <Button title="Write" onPress={() => write(serviceUUID, characteristicUUID, value)} />
                
                <Text>Write confirmation: {writeConfirmation}</Text>
                <Switch value={subscribed} onValueChange={(value) => (value ? subscribe(serviceUUID, characteristicUUID) : unsubscribe(serviceUUID, characteristicUUID))} />
                <Text>Subscription confirmation: {subscriptionConfirmation}</Text>
                <Text>Notification message: {notificationMessage}</Text>
            </View>
        )}
        {error && <Text style={{ color: 'red' }}>{error}</Text> } 
    </View>
  );

}

// export default BleManagerComponent;