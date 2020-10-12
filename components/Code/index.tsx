import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import React, { FC } from 'react';
import Clipboard from 'react-clipboard.js';

import withStyles, { CNFunction } from '../../lib/hocs/with-styles';

import styles from './code.module.scss';

interface CodeProps {
  cn: CNFunction;
  codeString: string;
  language: Language;
}

const Code: FC<CodeProps> = ({ cn, codeString, language }) => (
  <Highlight {...defaultProps} code={codeString} language={language}>
    {({ className, style, tokens, getLineProps, getTokenProps }) => (
      <div className={cn('code')}>
        <Clipboard data-clipboard-text={codeString} className={cn('copy')}>
          <FontAwesomeIcon icon={faCopy} />
        </Clipboard>
        <pre className={className} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={token.content} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      </div>
    )}
  </Highlight>
);

export default withStyles(styles)(Code);
