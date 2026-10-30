import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Person 1: dev-only on-device speech check; a no-op unless selftest files were adb-pushed.
if (__DEV__) {
  import('./src/services/speech/selftest').then((m) => m.runSpeechSelfTest()).catch(() => {});
}
