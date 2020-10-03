import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { HTMLAttributes } from 'react';

import { preToCodeBlock } from './mdx-parse';

import Code from 'components/Code';
import DynamicBlock from 'components/DynamicBlock';
import Highlight from 'components/Highlight';
import MdxAnchor from 'components/MdxAnchor';
import OptimisedImage from 'components/OptimisedImage';

const genericComponents = {
  pre: (preProps: HTMLAttributes<HTMLPreElement>) => {
    const props = preToCodeBlock(preProps);
    // if there's a codeString and some props, we passed the test
    if (props) {
      return <Code {...props} />;
    }
    // it's possible to have a pre without a code in it
    return <pre {...preProps} />;
  },
  img: OptimisedImage,
  a: MdxAnchor,
};

const MdxComponents = {
  DynamicBlock,
  Highlight,
  FontAwesomeIcon,
  ...genericComponents,
};

export default MdxComponents;
