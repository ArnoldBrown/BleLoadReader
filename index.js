/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import Toast from 'react-native-toast-message';

// AppRegistry.registerComponent(appName, () => App);

const AppWithToast = () => (
    <>
      <App />
      <Toast/>
    </>
  );
  
  AppRegistry.registerComponent(appName, () => AppWithToast);
