import { router } from 'expo-router';
import { PUZZLE_TYPES } from '@hva/domain';

import { appConfig } from '@/src/platform/config';
import { Classification } from '@/src/ui/Classification';
import { Divider } from '@/src/ui/Divider';
import { Screen } from '@/src/ui/Screen';
import { StatusBadge } from '@/src/ui/StatusBadge';
import { TerminalButton } from '@/src/ui/TerminalButton';
import { TerminalPanel } from '@/src/ui/TerminalPanel';
import { TerminalText } from '@/src/ui/TerminalText';
import { TopBar } from '@/src/ui/TopBar';

export default function HomeScreen() {
  return (
    <Screen>
      <TopBar title="Ares Station" subtitle="Native migration shell" />
      <Classification label="MIGRATION PHASE 2" level="PLATFORM SHELL" />

      <TerminalPanel>
        <TerminalText variant="title">SYSTEM STATUS</TerminalText>
        <TerminalText>
          The native app now has Ares-specific navigation, theme tokens,
          terminal primitives, and platform-service boundaries.
        </TerminalText>

        <Divider />

        <StatusBadge
          label={appConfig.apiBaseUrl ? 'API CONFIGURED' : 'API NOT CONFIGURED'}
          tone={appConfig.apiBaseUrl ? 'success' : 'warning'}
        />
        <TerminalText tone="muted">
          {appConfig.apiBaseUrl
            ? appConfig.apiBaseUrl
            : 'Set EXPO_PUBLIC_API_BASE_URL when we connect the backend.'}
        </TerminalText>
      </TerminalPanel>

      <TerminalPanel>
        <TerminalText variant="subtitle">Shared domain smoke test</TerminalText>
        <TerminalText tone="muted">{PUZZLE_TYPES.join(' / ')}</TerminalText>
        <TerminalButton
          label="Open shared-domain debug"
          variant="secondary"
          onPress={() => router.push('/debug/shared-domain')}
        />
      </TerminalPanel>
    </Screen>
  );
}
