import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/src/constants/default-settings';
import { defaultReplay } from '@/src/constants/replay';
import { getAssitantModelId } from '@/src/utils/app/conversation';
import {
  cleanData,
  isExportFormatV1,
  isExportFormatV2,
  isExportFormatV3,
  isExportFormatV4,
  isLatestExportFormat,
  isPromtsFormat
} from '@/src/utils/app/import-export';

import {
  ExportFormatV1,
  ExportFormatV2,
  ExportFormatV4,
  PromptsHistory
} from '@/src/types/export';
import { OpenAIEntityModelID, OpenAIEntityModels } from '@/src/types/openai';

import { describe, expect, it } from 'vitest';

describe('Export Format Functions', () => {
  describe('isExportFormatV1', () => {
    it('should return true for v1 format', () => {
      const obj = [{ id: 1 }];
      expect(isExportFormatV1(obj)).toBe(true);
    });

    it('should return false for non-v1 formats', () => {
      const obj = { version: 3, history: [], folders: [] };
      expect(isExportFormatV1(obj)).toBe(false);
    });
  });

  describe('isExportFormatV2', () => {
    it('should return true for v2 format', () => {
      const obj = { history: [], folders: [] };
      expect(isExportFormatV2(obj)).toBe(true);
    });

    it('should return false for non-v2 formats', () => {
      const obj = { version: 3, history: [], folders: [] };
      expect(isExportFormatV2(obj)).toBe(false);
    });
  });

  describe('isExportFormatV3', () => {
    it('should return true for v3 format', () => {
      const obj = { version: 3, history: [], folders: [] };
      expect(isExportFormatV3(obj)).toBe(true);
    });

    it('should return false for non-v3 formats', () => {
      const obj = { version: 4, history: [], folders: [] };
      expect(isExportFormatV3(obj)).toBe(false);
    });
  });

  describe('isExportFormatV4', () => {
    it('should return true for v4 format', () => {
      const obj = { version: 4, history: [], folders: [], prompts: [] };
      expect(isExportFormatV4(obj)).toBe(true);
    });

    it('should return false for non-v4 formats', () => {
      const obj = { version: 5, history: [], folders: [], prompts: [] };
      expect(isExportFormatV4(obj)).toBe(false);
    });
  });
});

describe('cleanData Functions', () => {
  describe('cleaning v1 data', () => {
    it('should return the latest format', () => {
      const data = [
        {
          id: 1,
          name: 'conversation 1',
          messages: [
            {
              role: 'user',
              content: "what's up ?",
            },
            {
              role: 'assistant',
              content: 'Hi',
            },
          ],
        },
      ] as ExportFormatV1;
      const obj = cleanData(data);
      expect(isLatestExportFormat(obj)).toBe(true);
      expect(obj).toEqual({
        version: 4,
        history: [
          {
            id: 1,
            name: 'conversation 1',
            messages: [
              {
                role: 'user',
                content: "what's up ?",
              },
              {
                role: 'assistant',
                content: 'Hi',
              },
            ],
            model: OpenAIEntityModels[OpenAIEntityModelID.GPT_3_5_AZ],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            replay: defaultReplay,
            selectedAddons: [],
            assistantModelId: undefined,
            isMessageStreaming: false,
          },
        ],
        folders: [],
        prompts: [],
        isError: false,
      });
    });
  });

  describe('cleaning v2 data', () => {
    it('should return the latest format', () => {
      const data = {
        history: [
          {
            id: '1',
            name: 'conversation 1',
            messages: [
              {
                role: 'user',
                content: "what's up ?",
              },
              {
                role: 'assistant',
                content: 'Hi',
              },
            ],
          },
        ],
        folders: [
          {
            id: 1,
            name: 'folder 1',
          },
        ],
      } as ExportFormatV2;
      const obj = cleanData(data);
      expect(isLatestExportFormat(obj)).toBe(true);
      expect(obj).toEqual({
        version: 4,
        history: [
          {
            id: '1',
            name: 'conversation 1',
            messages: [
              {
                role: 'user',
                content: "what's up ?",
              },
              {
                role: 'assistant',
                content: 'Hi',
              },
            ],
            model: OpenAIEntityModels[OpenAIEntityModelID.GPT_3_5_AZ],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            replay: defaultReplay,
            selectedAddons: [],
            assistantModelId: undefined,
            isMessageStreaming: false,
          },
        ],
        folders: [
          {
            id: '1',
            name: 'folder 1',
            type: 'chat',
          },
        ],
        prompts: [],
        isError: false,
      });
    });
  });

  describe('cleaning v4 data', () => {
    it('old v4 data should return the latest format', () => {
      const data = {
        version: 4,
        history: [
          {
            id: '1',
            name: 'conversation 1',
            messages: [
              {
                role: 'user',
                content: "what's up ?",
              },
              {
                role: 'assistant',
                content: 'Hi',
              },
            ],
            model: OpenAIEntityModels[OpenAIEntityModelID.GPT_3_5_AZ],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
          },
        ],
        folders: [
          {
            id: '1',
            name: 'folder 1',
            type: 'chat',
          },
        ],
        prompts: [
          {
            id: '1',
            name: 'prompt 1',
            description: '',
            content: '',
            model: OpenAIEntityModels[OpenAIEntityModelID.GPT_3_5_AZ],
          },
        ],
      } as ExportFormatV4;

      const obj = cleanData(data);
      expect(isLatestExportFormat(obj)).toBe(true);
      expect(obj).toEqual({
        version: 4,
        history: [
          {
            id: '1',
            name: 'conversation 1',
            messages: [
              {
                role: 'user',
                content: "what's up ?",
              },
              {
                role: 'assistant',
                content: 'Hi',
              },
            ],
            model: OpenAIEntityModels[OpenAIEntityModelID.GPT_3_5_AZ],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            replay: defaultReplay,
            selectedAddons: [],
            assistantModelId: undefined,
            isMessageStreaming: false,
          },
        ],
        folders: [
          {
            id: '1',
            name: 'folder 1',
            type: 'chat',
          },
        ],
        prompts: [
          {
            id: '1',
            name: 'prompt 1',
            description: '',
            content: '',
            model: OpenAIEntityModels[OpenAIEntityModelID.GPT_3_5_AZ],
          },
        ],
        isError: false,
      });
    });
  });
});

describe('Export helpers functions', () => {
  it('Should return false for non-prompts data', () => {
    const testData = [{ id: 1 }];
    expect(isPromtsFormat(testData)).toBeFalsy();
  });

  it('Should return true for prompts data', () => {
    const testData: PromptsHistory = {
      prompts: [
        {
          id: '1',
          name: 'prompt 1',
          description: '',
          content: '',
          model: OpenAIEntityModels[OpenAIEntityModelID.GPT_3_5_AZ],
        },
      ],
      folders: [
        {
          id: 'pf-1',
          name: 'Test folder',
          type: 'prompt',
        },
      ],
    };
    expect(isPromtsFormat(testData)).toBeTruthy();
  });
  describe('getAssitantModelId', () => {
    it('should return default assistant model id', () => {
      expect(
        getAssitantModelId('assistant', OpenAIEntityModelID.GPT_4),
      ).toEqual(OpenAIEntityModelID.GPT_4);
    });
  });
  it('should return assistant model id', () => {
    expect(
      getAssitantModelId(
        'assistant',
        OpenAIEntityModelID.GPT_4,
        OpenAIEntityModelID.GPT_3_5_AZ,
      ),
    ).toEqual(OpenAIEntityModelID.GPT_3_5_AZ);
  });
  it('should return undefined', () => {
    expect(
      getAssitantModelId(
        'model',
        OpenAIEntityModelID.GPT_4,
        OpenAIEntityModelID.GPT_3_5_AZ,
      ),
    ).toBeUndefined();
    expect(
      getAssitantModelId(
        'application',
        OpenAIEntityModelID.GPT_4,
        OpenAIEntityModelID.GPT_3_5_AZ,
      ),
    ).toBeUndefined();
  });
});
