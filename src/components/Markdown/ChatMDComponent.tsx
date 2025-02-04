import { Components } from 'react-markdown';

import {
  modelCursorSign,
  modelCursorSignWithBackquote,
} from '../../constants/chat';

import BlinkingCursor from '../Chat/BlinkingCursor';
import { CodeBlock } from './CodeBlock';
import { MemoizedReactMarkdown } from './MemoizedReactMarkdown';

import remarkGfm from 'remark-gfm';

export const replaceCursor = (cursorSign: string) =>
  cursorSign.replace(modelCursorSignWithBackquote, modelCursorSign);

interface ChatMDComponentProps {
  isShowResponseLoader: boolean;
  content: string;
  isInner?: boolean;
}

export const getMDComponents = (
  isShowResponseLoader: boolean,
  isInner: boolean,
): Components => {
  return {
    code({ inline, className, children, ...props }) {
      if (children.length) {
        if (children[0] == modelCursorSign) {
          return <BlinkingCursor isShowing={isShowResponseLoader} />;
        }

        children[0] = (children[0] as string).replace(
          modelCursorSignWithBackquote,
          modelCursorSign,
        );
      }

      const match = /language-(\w+)/.exec(className || '');

      return !inline ? (
        <CodeBlock
          key={Math.random()}
          language={(match && match[1]) || ''}
          value={String(children).replace(/\n$/, '')}
          isInner={isInner}
          {...props}
        />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    table({ children }) {
      return (
        <div className="max-w-full overflow-auto">
          <table className="border-collapse border border-black px-3 py-1 text-sm dark:border-gray-100">
            {children}
          </table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th className="break-words border border-black bg-gray-500 px-3 py-1 text-sm text-gray-200 dark:border-gray-100">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="break-words border border-black px-3 py-1 text-sm dark:border-gray-100">
          {children}
        </td>
      );
    },
    p({ children, className }) {
      if (children.length) {
        if (children[0] == modelCursorSign) {
          return <BlinkingCursor isShowing={isShowResponseLoader} />;
        }
      }
      if (children[0] == modelCursorSignWithBackquote) {
        children[0] = replaceCursor(children[0] as string);
      }
      return (
        <p className={`${className} ${isInner ? 'text-sm' : ''}`}>{children}</p>
      );
    },
  };
};

const ChatMDComponent = ({
  isShowResponseLoader,
  content,
  isInner = false,
}: ChatMDComponentProps) => {
  return (
    <>
      <MemoizedReactMarkdown
        className={`prose dark:prose-invert prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline`}
        remarkPlugins={[remarkGfm]}
        linkTarget="_blank"
        components={getMDComponents(isShowResponseLoader, isInner)}
      >
        {`${content}${
          isShowResponseLoader ? modelCursorSignWithBackquote : ''
        }`}
      </MemoizedReactMarkdown>
    </>
  );
};

export default ChatMDComponent;
