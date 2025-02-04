import { IconRefreshDot } from '@tabler/icons-react';

import { useTranslation } from 'next-i18next';

import { IconNonModelWithTooltip } from './IconNonModelWithTooltip';

interface Props {
  isCustomTooltip?: boolean;
  size?: number;
}

export const ReplayAsIsIcon = ({ isCustomTooltip, size }: Props) => {
  const { t } = useTranslation('chat');

  return (
    <IconNonModelWithTooltip
      icon={<IconRefreshDot size={size} />}
      tooltipContent={t('Replay as is')}
      isCustomTooltip={isCustomTooltip}
    />
  );
};
