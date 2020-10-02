import {
  faInfoCircle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC } from 'react';

import withStyles, { CNFunction } from '../../lib/hocs/with-styles';

import styles from './highlight.module.scss';

interface Props {
  cn: CNFunction;
  warning?: boolean;
}

const Highlight: FC<Props> = ({ cn, children, warning = false }) => (
  <div className={cn('blockWrapper')} data-warning={warning}>
    <FontAwesomeIcon icon={warning ? faExclamationCircle : faInfoCircle} />
    <div>{children}</div>
  </div>
);

export default withStyles(styles)(Highlight);
