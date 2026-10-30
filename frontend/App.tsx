import React, { useEffect } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Andika_400Regular, Andika_700Bold } from '@expo-google-fonts/andika';

import { colors, role } from './src/theme';
import { AppProvider, useApp } from './src/state/AppState';
import { BottomNav, Toast } from './src/components/BottomNav';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { AddChildScreen, WhoScreen } from './src/screens/WhoScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { StoriesScreen } from './src/screens/StoriesScreen';
import { ReadingScreen } from './src/screens/ReadingScreen';
import { FamilyScreen } from './src/screens/FamilyScreen';

/** Scrolling page with the bottom tab bar (Home / Stories / Family). */
const TabPage = ({ children }: { children: React.ReactNode }) => {
  const { tab, setTab } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        key={tab}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <BottomNav value={tab} onChange={setTab} />
    </SafeAreaView>
  );
};

const Router = () => {
  const { ready, screen, go, tab, setTab, closeStory, addChildReturn, storyId } = useApp();

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'read') { closeStory(); return true; }
      if (screen === 'addChild') { go(addChildReturn); return true; }
      if (screen === 'setup') { go('welcome'); return true; }
      if (screen === 'tabs' && tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [screen, tab, addChildReturn, closeStory, go, setTab]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={role.action.fill} />
      </View>
    );
  }

  switch (screen) {
    case 'welcome': return <WelcomeScreen />;
    case 'setup': return <SetupScreen />;
    case 'who': return <WhoScreen />;
    case 'addChild': return <AddChildScreen />;
    case 'read': return <ReadingScreen key={storyId} />;
    case 'tabs':
    default:
      return (
        <TabPage>
          {tab === 'home' && <HomeScreen />}
          {tab === 'stories' && <StoriesScreen />}
          {tab === 'family' && <FamilyScreen />}
        </TabPage>
      );
  }
};

const Overlay = () => {
  const { toast } = useApp();
  return <Toast message={toast} />;
};

export default function App() {
  const [loaded] = useFonts({
    // Andika (SIL OFL) supports early readers and is bundled locally for the offline demo.
    Andika_400Regular,
    Andika_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={role.action.fill} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <Router />
          <Overlay />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}
