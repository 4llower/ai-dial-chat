import {
  EMPTY,
  distinctUntilChanged,
  filter,
  first,
  fromEvent,
  ignoreElements,
  map,
  merge,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { combineEpics } from 'redux-observable';

import { validateFeature } from '@/src/utils/app/features';
import {
  isPostMessageOverlayRequest,
  sendPMEvent,
  sendPMResponse,
} from '@/src/utils/app/overlay';
import { validateTheme } from '@/src/utils/app/settings';

import { Message } from '@/src/types/chat';
import { Feature } from '@/src/types/features';
import { OpenAIEntityModel } from '@/src/types/openai';
import { Theme } from '@/src/types/settings';
import { AppEpic } from '@/src/types/store';

import { DEFAULT_ASSISTANT_SUBMODEL } from '@/src/constants/default-settings';
import { overlayAppName } from '@/src/constants/overlay';

import {
  ConversationsActions,
  ConversationsSelectors,
} from '../conversations/conversations.reducers';
import { ModelsActions, ModelsSelectors } from '../models/models.reducers';
import {
  SettingsActions,
  SettingsSelectors,
} from '../settings/settings.reducers';
import { UIActions } from '../ui/ui.reducers';
import {
  OverlayActions,
  OverlayOptions,
  OverlaySelectors,
  SendMessageOptions,
  SetSystemPromptOptions,
} from './overlay.reducers';

// TODO: Move OverlayRequest, OverlayEvents to npm package with overlay logic and import it there
export enum OverlayRequests {
  getMessages = 'GET_MESSAGES',
  setOverlayOptions = 'SET_OVERLAY_OPTIONS',
  setSystemPrompt = 'SET_SYSTEM_PROMPT',
  sendMessage = 'SEND_MESSAGE',
}

export enum OverlayEvents {
  ready = 'READY',
  gptStartGenerating = 'GPT_START_GENERATING',
  gptEndGenerating = 'GPT_END_GENERATING',
}

export interface OverlayRequest {
  type: string;
  requestId: string;
  payload?: unknown;
}

export const postMessageMapperEpic: AppEpic = () =>
  typeof window === 'object'
    ? fromEvent<MessageEvent>(window, 'message').pipe(
        filter(isPostMessageOverlayRequest),
        map((event) => {
          const data = event.data as OverlayRequest;

          return {
            requestName: data.type.replace(`${overlayAppName}/`, ''),
            ...data,
          };
        }),
        switchMap(({ requestName, requestId, payload }) => {
          switch (requestName) {
            case OverlayRequests.getMessages: {
              return of(OverlayActions.getMessages({ requestId }));
            }
            case OverlayRequests.setOverlayOptions: {
              const options = payload as OverlayOptions;

              return of(
                OverlayActions.setOverlayOptions({
                  ...options,
                  requestId,
                }),
              );
            }
            case OverlayRequests.sendMessage: {
              const { content } = payload as SendMessageOptions;

              return of(OverlayActions.sendMessage({ content, requestId }));
            }
            case OverlayRequests.setSystemPrompt: {
              const { systemPrompt } = payload as SetSystemPromptOptions;

              return of(
                OverlayActions.setSystemPrompt({ systemPrompt, requestId }),
              );
            }
            default: {
              // it's not supported overlay request
              return EMPTY;
            }
          }
        }),
      )
    : EMPTY;

const getMessagesEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(OverlayActions.getMessages.match),
    map(({ payload: { requestId } }) => {
      const currentConversation =
        ConversationsSelectors.selectFirstSelectedConversation(state$.value);

      const hostDomain = OverlaySelectors.selectHostDomain(state$.value);

      return { requestId, currentConversation, hostDomain };
    }),
    tap(({ requestId, currentConversation, hostDomain }) => {
      const messages = currentConversation?.messages || [];

      sendPMResponse(OverlayRequests.getMessages, {
        requestId,
        hostDomain,
        payload: { messages },
      });
    }),
    ignoreElements(),
  );

const sendMessageEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(OverlayActions.sendMessage.match),
    switchMap(({ payload: { content, requestId } }) => {
      const selectedConversations =
        ConversationsSelectors.selectSelectedConversations(state$.value);
      const hostDomain = OverlaySelectors.selectHostDomain(state$.value);

      const currentConversation = selectedConversations[0];

      sendPMResponse(OverlayRequests.sendMessage, { requestId, hostDomain });

      return of(
        ConversationsActions.sendMessage({
          conversation: currentConversation,
          deleteCount: 0,
          message: {
            role: 'user',
            content,
          },
          activeReplayIndex: 0,
        }),
      );
    }),
  );

const setOverlayOptionsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(OverlayActions.setOverlayOptions.match),
    map(({ payload: { ...options } }) => {
      const currentConversation =
        ConversationsSelectors.selectFirstSelectedConversation(state$.value);

      return { ...options, currentConversation };
    }),
    switchMap(
      ({
        theme,
        hostDomain,
        currentConversation,
        modelId,
        requestId,
        enabledFeatures,
      }) => {
        const actions = [];

        sendPMResponse(OverlayRequests.setOverlayOptions, {
          requestId,
          hostDomain,
        });

        if (enabledFeatures) {
          actions.push(
            of(
              SettingsActions.setEnabledFeatures(
                enabledFeatures.split(',') as Feature[],
              ),
            ),
          );
        }

        if (theme) {
          if (validateTheme(theme)) {
            actions.push(of(UIActions.setTheme(theme as Theme)));
          } else {
            console.warn(
              `[Overlay](Theme) No such theme: ${theme}.\nTheme isn't set.`,
            );
          }
        }

        if (enabledFeatures) {
          const features = enabledFeatures.split(',');

          if (features.every(validateFeature)) {
            actions.push(
              of(SettingsActions.setEnabledFeatures(features as Feature[])),
            );
          } else {
            const incorrectFeatures = features
              .filter((feature) => !validateFeature(feature))
              .join(',');

            console.warn(
              `[Overlay](Enabled Features) No such features: ${incorrectFeatures}. \nFeatures aren't set.`,
            );
          }
        }

        if (modelId) {
          actions.push(of(ModelsActions.updateRecentModels({ modelId })));

          actions.push(
            of(ModelsActions.setDefaultModelId({ defaultModelId: modelId })),
          );

          // if there is active conversation -> should update model for this conversation
          if (currentConversation) {
            const models = ModelsSelectors.selectModels(state$.value);

            const newAiEntity = models.find(
              ({ id }) => id === modelId,
            ) as OpenAIEntityModel;

            if (newAiEntity) {
              actions.push(
                of(
                  ConversationsActions.updateConversation({
                    id: currentConversation.id,
                    values: {
                      model: newAiEntity,
                      assistantModelId:
                        newAiEntity.type === 'assistant'
                          ? DEFAULT_ASSISTANT_SUBMODEL.id
                          : undefined,
                    },
                  }),
                ),
              );
            }
          }
        }

        // after all actions will send notify that settings are set
        actions.push(
          of(
            OverlayActions.setOverlayOptionsSuccess({ hostDomain, requestId }),
          ),
        );

        return merge(...actions);
      },
    ),
  );

const setOverlayOptionsSuccessEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(OverlayActions.setOverlayOptionsSuccess.match),
    tap(({ payload: { hostDomain, requestId } }) => {
      sendPMResponse(OverlayRequests.setOverlayOptions, {
        requestId,
        hostDomain,
      });
    }),
    ignoreElements(),
  );

const setSystemPromptEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(OverlayActions.setSystemPrompt.match),
    map(({ payload: { requestId, systemPrompt } }) => {
      const currentConversation =
        ConversationsSelectors.selectFirstSelectedConversation(state$.value);

      const hostDomain = OverlaySelectors.selectHostDomain(state$.value);

      return { requestId, systemPrompt, currentConversation, hostDomain };
    }),
    switchMap(
      ({ requestId, systemPrompt, currentConversation, hostDomain }) => {
        if (!currentConversation) return EMPTY;

        sendPMResponse(OverlayRequests.setSystemPrompt, {
          requestId,
          hostDomain,
        });

        const { messages } = currentConversation;

        const systemMessage: Message = {
          role: 'system',
          content: systemPrompt,
        };

        // add system prompt
        const newMessages = [
          systemMessage,
          ...messages.filter(({ role }) => role !== 'system'),
        ];

        return of(
          ConversationsActions.updateConversation({
            id: currentConversation.id,
            values: {
              messages: newMessages,
            },
          }),
        );
      },
    ),
  );

const notifyHostGPTMessageStatus: AppEpic = (_, state$) =>
  state$.pipe(
    // we shouldn't proceed if we are not iframe
    filter((state) => SettingsSelectors.selectIsIframe(state)),
    map((state) =>
      ConversationsSelectors.selectIsConversationsStreaming(state),
    ),
    distinctUntilChanged(),
    map((isMessageStreaming) => {
      const hostDomain = OverlaySelectors.selectHostDomain(state$.value);

      return { isMessageStreaming, hostDomain };
    }),
    tap(({ isMessageStreaming, hostDomain }) => {
      if (isMessageStreaming) {
        // That's mean gpt end generating message (maybe that's because it's answered)
        sendPMEvent(OverlayEvents.gptStartGenerating, { hostDomain });
        return;
      }

      sendPMEvent(OverlayEvents.gptEndGenerating, { hostDomain });
    }),
    ignoreElements(),
  );

// models are loading after conversations, if models loaded that means that we can work with application. Maybe there is better condition.
const notifyHostAboutReadyEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ModelsActions.getModelsSuccess.match),
    first(),
    tap(() => {
      // broadcast about ready, after ready emitted, overlay should send initial settings (incl. hostDomain, theme, etc.)
      sendPMEvent(OverlayEvents.ready, { hostDomain: '*' });
    }),
    ignoreElements(),
  );

export const OverlayEpics = combineEpics(
  postMessageMapperEpic,
  getMessagesEpic,
  notifyHostAboutReadyEpic,
  setOverlayOptionsEpic,
  sendMessageEpic,
  setSystemPromptEpic,
  notifyHostGPTMessageStatus,
  setOverlayOptionsSuccessEpic,
);
