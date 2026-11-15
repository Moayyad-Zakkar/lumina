import { useTranslation } from 'react-i18next';
import { archStatus, formatDate } from './patientTracking';

// Returns a function (info, total, today) => { text, short, due }
//   text  - full line, e.g. "Aligner 5 of 20 · Switch on 3 Nov"
//   short - only the "what happens next" part (used where "Aligner 5 of 20" is shown separately)
//   due   - true when the patient should act now (highlight it)
export default function useArchStatusText() {
  const { t, i18n } = useTranslation();
  const p = 'patientTracking.status';

  return (info, total, today) => {
    const s = archStatus(info, total, today);
    switch (s.kind) {
      case 'notStarted': {
        const text = t(`${p}.notStarted`);
        return { text, short: text, due: false };
      }
      case 'finished': {
        const text = t(`${p}.finished`);
        return { text, short: text, due: false };
      }
      case 'switchToday': {
        const text = t(`${p}.switchToday`, { next: s.next });
        return { text, short: text, due: true };
      }
      case 'switchOverdue': {
        const text = t(`${p}.switchOverdue`, { next: s.next });
        return { text, short: text, due: true };
      }
      default: {
        const date = formatDate(s.switchOn, i18n.language);
        const short = s.final
          ? t(`${p}.finishOn`, { date })
          : t(`${p}.switchOn`, { date });
        return {
          text: `${t(`${p}.current`, { current: s.current, total: s.total })} · ${short}`,
          short,
          due: false,
        };
      }
    }
  };
}