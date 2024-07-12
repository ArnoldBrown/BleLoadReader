import React, { useState, useEffect } from 'react';
import {
  Text,
  Alert,
  View,
  FlatList,
  Platform,
  StatusBar,
  SafeAreaView,
  NativeModules,
  useColorScheme,
  TouchableOpacity,
  NativeEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import { styles } from './src/styles/styles';
import { DeviceList } from './src/DeviceList';
import BleManager from 'react-native-ble-manager';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';
import LoadingAnim from './src/components/LoadingAnim';
import ConnexAnim from './src/components/ConnexAnim';

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const peripherals = new Map();
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [device, setDevice] = useState(null);
  const [weight, setWeight] = useState(null);
  const WEIGHT_CHARACTERISTIC_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  const WEIGHT_SERVICE_UUID = '4fafc200-1fb5-459e-8fcc-c5c9c331914b';
  const BLE_DESCRIPTOR = '00002902-0000-1000-8000-00805f9b34fb';
  const BLE_PORT = '0100';


  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const showToast = (type, title, msg) => {
    Toast.show({
      type: type,
      text1: title,
      text2: msg,
    });
  };

  const renderEmptyList = () => {
    return (<View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <Text style={{ color: 'grey' }}>No Bluetooth devices found</Text>
    </View>
    )
  }

  useEffect(() => {
    const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
    const handleUpdate = (data) => {
      if (data.characteristic === WEIGHT_CHARACTERISTIC_UUID) {
        const decodedData = data.value.map(code => String.fromCharCode(code)).join('');
        setWeight(decodedData);
        console.log('Received notification: ', decodedData);
      }
    };

    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdate);

    return () => {
      bleManagerEmitter.removeListener('BleManagerDidUpdateValueForCharacteristic', handleUpdate);
    };
  }, []);

//   useEffect(() => {
//  AsyncStorage.getItem("@peripheral").then((data) => {
//           var periInfo = JSON.parse(data);
//           console.log("periInfoooo",periInfo);
         
//         });
//   },[]);

// const storeData = async (key, value) => {
//   try {
//       await AsyncStorage.setItem(key, value);
//       console.log('Data stored successfully!');
//   } catch (e) {
//       console.error('Error storing data:', e);
//   }
// };

// const getData = async (key) => {
//   try {
//       const value = await AsyncStorage.getItem(key);
//       if (value !== null) {
//           // Data found
//           console.log('Retrieved data:', value);
//           return value;
//       } else {
//           // Data not found
//           console.log('No data found with key:', key);
//           return null;
//       }
//   } catch (e) {
//       console.error('Error retrieving data:', e);
//       return null;
//   }
// };

  const handleLocationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {

      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]).then(result => {
        if (
          (result['android.permission.BLUETOOTH_SCAN'] &&
            result['android.permission.BLUETOOTH_CONNECT'] &&
            result['android.permission.ACCESS_FINE_LOCATION'] === 'granted')
          ||
          (result['android.permission.BLUETOOTH_SCAN'] &&
            result['android.permission.BLUETOOTH_CONNECT'] &&
            result['android.permission.ACCESS_FINE_LOCATION'] === 'never_ask_again')
        ) {
          console.log('User accepted');
          showToast("success", "Ble Weighing", "User accepted");  
          // console.log("dvdsvd",getData('@isStored'));
          // AsyncStorage.getItem("@peripheral").then((data) => {
          //   var periInfo = JSON.parse(data);
          //   console.log("periInfoooo",periInfo);
          // });
        } else {
          console.log('User refused');
        }
      });
    }
  };

  const handleGetConnectedDevices = () => {
    BleManager.getBondedPeripherals([]).then(results => {
      for (let i = 0; i < results.length; i++) {
        let peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setConnectedDevices(Array.from(peripherals.values()));
      }
      // console.log('peripherals',peripherals);
      // console.log('connectedDevices',connectedDevices);
    });
  };

  useEffect(() => {
    handleLocationPermission();

    BleManager.enableBluetooth().then(() => {
      console.log('Bluetooth is turned on!');
    });
    BleManager.start({ showAlert: false }).then(() => {
      console.log('BleManager initialized');
      handleGetConnectedDevices();
    });

    let stopDiscoverListener = BleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      peripheral => {
        if (peripheral?.name?.includes("Load")) {
          peripherals.set(peripheral.id, peripheral);
          setDiscoveredDevices(Array.from(peripherals.values()));
        }
      },
    );

    let stopConnectListener = BleManagerEmitter.addListener(
      'BleManagerConnectPeripheral',
      peripheral => {
        console.log('BleManagerConnectPeripheral:', peripheral);
      },
    );

    let stopScanListener = BleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        setIsScanning(false);
        console.log('scan stopped');
      },
    );

    return () => {
      stopDiscoverListener.remove();
      stopConnectListener.remove();
      stopScanListener.remove();
    };
  }, []);

  const scan = () => {
    if (!isScanning) {
      BleManager.scan([], 5, true)
        .then(() => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(error => {
          console.error(error);
        });
    }
  };

  //CONNECT-DEVICE//
  const connect = peripheral => {
    BleManager.createBond(peripheral.id)
      .then(() => {
        return BleManager.connect(peripheral.id); // Connect to the peripheral
      })
      .then(() => {
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        let devices = Array.from(peripherals.values());
        setConnectedDevices(Array.from(devices));
        setDiscoveredDevices(Array.from(devices));
        setDevice(devices);
        console.log('BLE device connected successfully');
        showToast("success", "Ble Weighing", "BLE device connected successfully");
        // if(AsyncStorage.getItem("@isStored") === undefined || AsyncStorage.getItem("@isStored") === "false"){
        //   storeData('@isStored', 'John Doe');
        //   console.log("zxzxzxzx", '@isStored')
        //   // AsyncStorage.setItem("@isStored", "true");
        //   // AsyncStorage.setItem("@peripheral", JSON.stringify(peripheral));
        // }
       
        // AsyncStorage.getItem("@peripheral").then((data) => {
        //   var userInfo = JSON.parse(data);
        //   // console.tron.log("deeee",userInfo);
        //   setUserName(userInfo?.payLoad?.userName);
        // });
      })
      .then(data => {
        console.log('Read data:', data); // Data read from the characteristic
        // Process the read data as needed
      })
      .catch(error => {
        console.error('Failed to connect or read data:', error);
      });
  };

  //DISCONNECT-DEVICE//
  const disconnect = peripheral => {
    BleManager.removeBond(peripheral.id)
      .then(() => {
        peripheral.connected = false;
        peripherals.set(peripheral.id, peripheral);

        let devices = Array.from(peripherals.values());
        setConnectedDevices(Array.from(devices));
        setDiscoveredDevices(Array.from(devices));
        Alert.alert(`Disconnected from ${peripheral.name}`);
      })
      .catch(() => {
        throw Error('fail to remove the bond');
      });
  };

  //START-NOTIFICATION//
  const startNotify = () => {
    if (device !== null) {
      BleManager.startNotification(device[0].id, WEIGHT_SERVICE_UUID, WEIGHT_CHARACTERISTIC_UUID)
        .then(() => {
          console.log('Notification started');
          showToast("success", "Ble Weighing", "Notification started");
          // resolve();
        })
        .catch((error) => {
          console.log('Notification error:', error);
          reject(error);
        });
    }
  }

  //START-READ//
  const startRead = () => {
    if (device !== null) {
      BleManager.read(device[0].id, WEIGHT_SERVICE_UUID, WEIGHT_CHARACTERISTIC_UUID)
        .then((data) => {
          const decodedData = data.map(code => String.fromCharCode(code)).join('');
          setWeight(decodedData);
          console.log('Read: ', weight);
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    }
  }

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={{ flex: 1, margin: 5, flexDirection: 'column' }}>
        <View style={{ flex: 0.3 }}>
          <Text style={{ textAlign: 'center', marginTop: 10, fontSize: 25 }}>BlueTooth DataBooth</Text>
          <TouchableOpacity
            onPress={() => scan()}
            activeOpacity={0.5}
            style={styles.scanButton}>
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan Bluetooth Devices'}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => startNotify()} style={{ backgroundColor: 'green', height: 50, width: 50, borderRadius: 25, justifyContent: 'center' }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>Notify</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => startRead()} style={{ backgroundColor: 'blue', height: 50, width: 50, borderRadius: 25, marginLeft: 10, justifyContent: 'center' }}>
              <Text style={{ color: 'white', textAlign: 'center' }}>Read</Text>
            </TouchableOpacity>
            {weight !== null ? <Text style={{ marginLeft: 10, padding: 5, }}>Weight <Text style={{ fontWeight: 900, fontSize: 40 }}>{weight}</Text></Text>
              : null}
          </View>
        </View>

        <View style={{ flex: 0.4 }}>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? Colors.white : Colors.black },
            ]}>
            Discovered Devices:
          </Text>
          {isScanning ? <LoadingAnim /> : null}

          {!isScanning ? (
            <FlatList
              style={{ flex:1}}
              data={discoveredDevices}
              ListEmptyComponent={renderEmptyList}
              renderItem={({ item }) => (
                <DeviceList
                  peripheral={item}
                  connect={connect}
                  disconnect={disconnect}
                />
              )}
              keyExtractor={item => item.id}
            />
          ) : null}

        </View>

        <View style={{ flex: 0.3 }}>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? Colors.white : Colors.black },
            ]}>
            Connected Devices:
          </Text>

          {connectedDevices.length > 0 ? (
          <FlatList
            style={{ height: 180 }}
            data={connectedDevices}
            ListEmptyComponent={renderEmptyList}
            renderItem={({ item }) => (
              <DeviceList
                peripheral={item}
                connect={connect}
                disconnect={disconnect}
              />
            )}
            keyExtractor={item => item.id}
          />
        ) : 
        
          <Text style={styles.noDevicesText}>No connected devices</Text>
        }
        </View>

      </View>
    </SafeAreaView>
  );
};

export default App;