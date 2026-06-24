import { router } from 'expo-router';
import { PUZZLE_TYPES, type Day } from '@hva/domain';

import { Screen } from '@/src/ui/Screen';
import { TerminalButton } from '@/src/ui/TerminalButton';
import { TerminalPanel } from '@/src/ui/TerminalPanel';
import { TerminalText } from '@/src/ui/TerminalText';
import { TopBar } from '@/src/ui/TopBar';

const referenceDay: Pick<Day, 'dayId' | 'number' | 'title'> = {
  dayId: 'native-placeholder',
  number: 1,
  title: 'Crash Landing',
};

export default function SharedDomainDebugScreen() {
  return (
    <Screen>
      <TopBar title="Shared Domain" subtitle="Package import verification" />

      <TerminalPanel>
        <TerminalText variant="subtitle">Reference day</TerminalText>
        <TerminalText>
          {referenceDay.dayId} / Day {referenceDay.number} / {referenceDay.title}
        </TerminalText>
      </TerminalPanel>

      <TerminalPanel>
        <TerminalText variant="subtitle">Puzzle type union</TerminalText>
        <TerminalText tone="muted">{PUZZLE_TYPES.join('\n')}</TerminalText>
      </TerminalPanel>

      <TerminalButton label="Back to shell" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
