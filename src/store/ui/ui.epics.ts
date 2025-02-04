import { toast } from 'react-hot-toast';

import { filter, forkJoin, ignoreElements, of, switchMap, tap } from 'rxjs';

import { combineEpics } from 'redux-observable';

import { AppEpic } from '@/src/types/store';

import { errorsMessages } from '@/src/constants/errors';

import { UIActions, UISelectors } from './ui.reducers';

const saveThemeEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.setTheme.match),
    tap(({ payload }) => {
      localStorage.setItem('settings', JSON.stringify({ theme: payload }));

      // Needed for fast work with theme initial load
      document.documentElement.className = payload || '';
    }),
    ignoreElements(),
  );

const saveShowChatbarEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.setShowChatbar.match),
    tap(({ payload }) => {
      localStorage.setItem('showChatbar', JSON.stringify(payload));
    }),
    ignoreElements(),
  );

const saveShowPromptbarEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.setShowPromptbar.match),
    tap(({ payload }) => {
      localStorage.setItem('showPromptbar', JSON.stringify(payload));
    }),
    ignoreElements(),
  );

const showToastErrorEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.showToast.match),
    switchMap(({ payload }) => {
      return forkJoin({
        responseMessage:
          typeof payload.response !== 'undefined'
            ? (payload.response as Response).text()
            : of(undefined),
        payload: of(payload),
      });
    }),
    tap(({ payload, responseMessage }) => {
      let message = payload.message ?? errorsMessages.generalServer;
      if (
        payload.response &&
        responseMessage &&
        payload.response.status !== 504
      ) {
        message = responseMessage;
      }

      switch (payload.type) {
        case 'error':
          toast.error(message, { id: 'toast' });
          break;
        case 'loading':
          toast.loading(message, { id: 'toast' });
          break;
        case 'success':
          toast.success(message, { id: 'toast' });
          break;
        default:
          toast(message, { id: 'toast' });
          break;
      }
    }),
    ignoreElements(),
  );

const saveOpenedFoldersIdsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(
      (action) =>
        UIActions.setOpenedFoldersIds.match(action) ||
        UIActions.toggleFolder.match(action) ||
        UIActions.openFolder.match(action) ||
        UIActions.closeFolder.match(action),
    ),
    tap(() => {
      const updatedOpenedFolders = UISelectors.selectOpenedFoldersIds(
        state$.value,
      );
      localStorage.setItem(
        'openedFoldersIds',
        JSON.stringify(updatedOpenedFolders),
      );
    }),
    ignoreElements(),
  );

const UIEpics = combineEpics(
  saveThemeEpic,
  saveShowChatbarEpic,
  saveShowPromptbarEpic,
  showToastErrorEpic,
  saveOpenedFoldersIdsEpic,
);

export default UIEpics;
