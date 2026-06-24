import { router } from 'expo-router';

import { Classification } from '@/src/ui/Classification';
import { Screen } from '@/src/ui/Screen';
import { TerminalButton } from '@/src/ui/TerminalButton';
import { TerminalPanel } from '@/src/ui/TerminalPanel';
import { TerminalText } from '@/src/ui/TerminalText';

export default function LoadingScreen() {
  return (
    <Screen centered>
      <Classification label="ARES STATION" level="MISSION SHELL" />
      <TerminalPanel>
        <TerminalText variant="title">BOOT SEQUENCE</TerminalText>
        <TerminalText tone="muted">
          Native shell initialized. Shared game domain is available. Backend and
          authentication are intentionally not connected yet.
        </TerminalText>
        <TerminalButton label="Continue to shell" onPress={() => router.replace('/home')} />
      </TerminalPanel>
    </Screen>
  );
}
