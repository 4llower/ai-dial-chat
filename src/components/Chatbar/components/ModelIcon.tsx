import { memo } from 'react';

import Image from 'next/image';

import { OpenAIEntity } from '@/src/types/openai';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/src/components/Common/Tooltip';

interface Props {
  entityId: string;
  entity: OpenAIEntity | undefined;
  size: number;
  inverted?: boolean;
  animate?: boolean;
  isCustomTooltip?: boolean;
}

const ModelIconTemplate = memo(
  ({
    entity,
    entityId,
    size,
    animate,
    inverted,
  }: Omit<Props, 'isCustomTooltip'>) => {
    return (
      <>
        {entity?.iconUrl != null ? (
          <span
            className={`relative inline-block shrink-0 leading-none ${
              animate ? 'animate-bounce' : ''
            }`}
            style={{ height: `${size}px`, width: `${size}px` }}
          >
            <Image
              className={`${
                inverted && entity.type !== 'addon' ? 'invert' : ''
              } `}
              src={entity.iconUrl as string}
              fill
              style={{ objectFit: 'contain' }}
              alt={`${entity.id} icon`}
              data-qa="entity-icon"
            ></Image>
          </span>
        ) : (
          <span
            style={{
              width: size,
              height: size,
              backgroundImage:
                entity?.type === 'model' ? defaultModelIcon : defaultAddonIcon,
            }}
            className={`inline-block shrink-0 bg-contain bg-no-repeat ${
              inverted ? 'invert' : ''
            } ${animate ? 'animate-bounce' : ''}`}
            role="img"
            aria-label={`${entityId} icon`}
          ></span>
        )}
      </>
    );
  },
);
ModelIconTemplate.displayName = 'ModelIconTemplate';

const defaultModelIcon = `var(--default-model, url(images/icons/message-square-lines-alt.svg))`;
const defaultAddonIcon = `var(--default-addon, url(images/icons/message-square-lines-alt.svg))`;

export const ModelIcon = ({
  entity,
  entityId,
  size,
  animate,
  inverted,
  isCustomTooltip,
}: Props) => {
  return (
    <>
      {isCustomTooltip ? (
        <ModelIconTemplate
          entity={entity}
          entityId={entityId}
          size={size}
          animate={animate}
          inverted={inverted}
        />
      ) : (
        <Tooltip>
          <TooltipTrigger className="flex shrink-0">
            <ModelIconTemplate
              entity={entity}
              entityId={entityId}
              size={size}
              animate={animate}
              inverted={inverted}
            />
          </TooltipTrigger>
          <TooltipContent>{entity?.name || entityId}</TooltipContent>
        </Tooltip>
      )}
    </>
  );
};
