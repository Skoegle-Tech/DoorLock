import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';

// Wrap your App with SafeAreaProvider
const Root = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
registerRootComponent(Root);
