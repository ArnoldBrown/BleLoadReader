import React, {useState, useEffect} from 'react';
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
import {styles} from './src/styles/styles';
import { DeviceList } from './src/DeviceList';
import BleManager from 'react-native-ble-manager';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const peripherals = new Map();
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);

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
        } else {
          console.log('User refused');        }
      });
  }
    // if (Platform.OS === 'android' && Platform.Version >= 23) {
    //   try {
    //     const granted = await PermissionsAndroid.request(
    //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    //     );

    //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //       console.log('Location permission granted');
    //     } else {
    //       console.log('Location permission denied');
    //     }
    //   } catch (error) {
    //     console.log('Error requesting location permission:', error);
    //   }
    // }
  };

  const handleGetConnectedDevices = () => {
    BleManager.getBondedPeripherals([]).then(results => {
      for (let i = 0; i < results.length; i++) {
        let peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setConnectedDevices(Array.from(peripherals.values()));
      }
    });
  };

  useEffect(() => {
    handleLocationPermission();

    BleManager.enableBluetooth().then(() => {
      console.log('Bluetooth is turned on!');
    });

    BleManager.start({showAlert: false}).then(() => {
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

  const startNotify = peripheral => {
    BleManager.startNotification(peripheral.id, 'characteristic_uuid', 'service_uuid')
    .then(() => {
      console.log('Notifications started successfully');
    })
    .catch(error => {
      console.error('Failed to start notifications:', error);
    });
  };
  
  const startRead = () => {
    
  }

  // const connect = peripheral => {
  //   console.log("peripheral",peripheral);
  //   BleManager.createBond(peripheral.id)
  //     .then(() => {
  //       peripheral.connected = true;
  //       peripherals.set(peripheral.id, peripheral);
        
  //       let devices = Array.from(peripherals.values());
  //       setConnectedDevices(Array.from(devices));
  //       setDiscoveredDevices(Array.from(devices));
  //       console.log('BLE device paired successfully');
  //     })
  //     .catch(() => {
  //       const services = peripheral.discoverAllServicesAndCharacteristics();
  //       console.log("servicess",services)
  //       throw Error('failed to bond');
  //     });
  // };

  const connect = peripheral => {
    console.log("periId",peripheral);
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
        console.log('BLE device connected successfully');
        BleManager.startNotification();
        // Retrieve data from known services and characteristics using their UUIDs
        // return BleManager.read(peripheral.id, 'beb5483e-36e1-4688-b7f5-ea07361b26a8', '4fafc201-1fb5-459e-8fcc-c5c9c331914b');
        return BleManager.read(peripheral.id, '4fafc200-1fb5-459e-8fcc-c5c9c331914b', '4fafc201-1fb5-459e-8fcc-c5c9c331914b',);

      })
      .then(data => {
        console.log('Read data:', data); // Data read from the characteristic
        // Process the read data as needed
      })
      .catch(error => {
        console.error('Failed to connect or read data:', error);
      });
  };

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

  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={[backgroundStyle, styles.container]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={{pdadingHorizontal: 20}}>
        <Text
          style={[
            styles.title,
            {color: isDarkMode ? Colors.white : Colors.black},
          ]}>
          BLE
        </Text>
        <TouchableOpacity
          onPress={scan}
          activeOpacity={0.5}
          style={styles.scanButton}>
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan Bluetooth Devices'}
          </Text>
        </TouchableOpacity>

        <View style={{flexDirection:'row'}}> 
          <TouchableOpacity onPress={()=>startNotify()} style={{backgroundColor:'green', padding:5, borderRadius:5}}>
          <Text style={{color:'white'}}>Notify</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>startRead()} style={{backgroundColor:'blue', padding:5, marginLeft:10, borderRadius:5}}>
            <Text style={{color:'white'}}>Read</Text>
          </TouchableOpacity>

          <Text style={{marginLeft:10, padding:5}}>Weight : </Text>
        </View>

        <Text
          style={[
            styles.subtitle,
            {color: isDarkMode ? Colors.white : Colors.black},
          ]}>
          Discovered Devices:
        </Text>
        {discoveredDevices.length > 0 ? (
          <FlatList
         style={{height:180}}
            data={discoveredDevices}
            renderItem={({item}) => (
              <DeviceList
                peripheral={item}
                connect={connect}
                disconnect={disconnect}
              />
            )}
            keyExtractor={item => item.id}
          />
        ) : (
          <Text style={styles.noDevicesText}>No Bluetooth devices found</Text>
        )}

        <Text
          style={[
            styles.subtitle,
            {color: isDarkMode ? Colors.white : Colors.black},
          ]}>
          Connected Devices:
        </Text>
        {connectedDevices.length > 0 ? (
          <FlatList
          style={{height:180}}
            data={connectedDevices}
            renderItem={({item}) => (
              <DeviceList
                peripheral={item}
                connect={connect}
                disconnect={disconnect}
              />
            )}
            keyExtractor={item => item.id}
          />
        ) : (
          <Text style={styles.noDevicesText}>No connected devices</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default App;