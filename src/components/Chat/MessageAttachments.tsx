import { useMemo, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Attachment } from '@/src/types/chat';

import ChevronDown from '../../../public/images/icons/chevron-down.svg';
import { MessageAttachment } from './MessageAttachment';

interface Props {
  attachments: Attachment[];
  isInner?: boolean;
}

export const MessageAttachments = ({ attachments, isInner }: Props) => {
  const { t } = useTranslation('chat');
  const isUnderSection = useMemo(() => {
    return attachments.length > 3;
  }, [attachments]);

  const [isSectionOpened, setIsSectionOpened] = useState(false);

  return isUnderSection && !isInner ? (
    <div className="rounded border border-gray-400 bg-gray-300  dark:border-gray-700 dark:bg-gray-900">
      <button
        className="flex w-full items-center gap-2 p-2 text-sm"
        onClick={() => setIsSectionOpened((val) => !val)}
      >
        {t('Attachments')}
        <ChevronDown
          height={18}
          width={18}
          className={`shrink-0 text-gray-500 transition ${
            isSectionOpened ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isSectionOpened && (
        <div className="grid max-w-full grid-cols-1 gap-1 border-t border-gray-400 p-2 dark:border-gray-700 sm:grid-cols-2 md:grid-cols-3">
          {attachments?.map((attachment) => (
            <MessageAttachment
              key={attachment.index}
              attachment={attachment}
              isInner={true}
            />
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="grid max-w-full grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3">
      {attachments?.map((attachment) => (
        <MessageAttachment
          key={attachment.index}
          attachment={attachment}
          isInner={isInner}
        />
      ))}
    </div>
  );
};
