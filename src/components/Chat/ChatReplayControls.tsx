import { FC } from 'react';

import { useTranslation } from 'next-i18next';

import { ConversationsSelectors } from '@/src/store/conversations/conversations.reducers';
import { useAppSelector } from '@/src/store/hooks';

import Play from '../../../public/images/icons/play.svg';
import RefreshCW from '../../../public/images/icons/refresh-cw.svg';

interface ChatReplayControlsProps {
  onClickReplayReStart: () => void;
  onClickReplayStart: () => void;
  showReplayStart: boolean;
}
const ChatReplayControls: FC<ChatReplayControlsProps> = ({
  onClickReplayReStart,
  onClickReplayStart,
  showReplayStart,
}) => {
  const { t } = useTranslation('chat');
  const isError = useAppSelector(
    ConversationsSelectors.selectIsErrorReplayConversations,
  );
  return (
    <div
      className={`absolute bottom-3 flex w-full 
      justify-center border-transparent bg-gradient-to-b from-transparent via-gray-300 to-gray-300 dark:via-gray-900 dark:to-gray-900 md:bottom-5`}
    >
      {showReplayStart ? (
        <button
          className={`mx-3 flex w-fit shrink-0 items-center gap-3 rounded border border-gray-400 bg-gray-200 p-3 hover:bg-gray-400 dark:border-gray-600 dark:bg-gray-800 hover:dark:bg-gray-600`}
          onClick={onClickReplayStart}
          data-qa="start-replay"
        >
          <Play height={18} width={18} className="shrink-0 text-gray-500" />
          <span>{t('Start replay')}</span>
        </button>
      ) : (
        <button
          className={`mx-3 flex w-fit shrink-0 items-center gap-3 rounded border border-gray-400 bg-gray-200 p-3 hover:bg-gray-400 dark:border-gray-600 dark:bg-gray-800 hover:dark:bg-gray-600`}
          onClick={onClickReplayReStart}
          data-qa="proceed-reply"
        >
          <RefreshCW
            height={18}
            width={18}
            className="shrink-0 text-gray-500"
          />

          {isError ? (
            <span>
              {t(
                'Looks like something went wrong. Do you want to continue replay?',
              )}
            </span>
          ) : (
            <span>{t('Continue replay')}</span>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatReplayControls;
