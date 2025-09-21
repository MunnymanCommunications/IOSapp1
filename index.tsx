import { AppRegistry } from 'react-native';
import App from './App';

// The app name is hardcoded to avoid JSON import issues in this environment.
// In a standard React Native project, you would use:
// import { name as appName } from './app.json';
const appName = 'GeminiOrbAssistant';

AppRegistry.registerComponent(appName, () => App);
