// eslint-disable-next-line import/no-unresolved
import cxBind from 'classnames/bind';
import React, {
  FC,
  forwardRef,
  Ref,
  ComponentType,
  RefAttributes,
} from 'react';

type CNObject = { [key: string]: boolean | undefined };

export type CNInput =
  | undefined
  | null
  | string
  | CNObject
  | [string | CNObject];
export type CNFunction = (className: CNInput, ...rest: CNInput[]) => string;

const withStyles = (styles: Record<string, string>) => <
  ComposedComponentProps extends Record<string, any>
>(
  ComposedComponent: ComponentType<ComposedComponentProps>,
): ComponentType<Omit<ComposedComponentProps, 'cn'>> &
  RefAttributes<unknown> => {
  // eslint-disable-next-line
  const cn: CNFunction = cxBind.bind(styles);

  type ComposedComponentPropsWithOutCn = Omit<ComposedComponentProps, 'cn'>;

  type WrapperComponentPropsWithForwardedRef = ComposedComponentPropsWithOutCn & {
    forwardedRef: Ref<unknown>;
  };

  const WrapperComponent: FC<WrapperComponentPropsWithForwardedRef> = ({
    forwardedRef,
    ...composedComponentProps
  }) => (
    <ComposedComponent
      ref={forwardedRef}
      cn={cn}
      styles={styles}
      // We need a cast as any, however doesn't effect hoc types for arguments and return, because:
      // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/32355
      // https://github.com/Microsoft/TypeScript/issues/28938#issuecomment-450636046
      {...(composedComponentProps as any)}
    />
  );

  const name = ComposedComponent.displayName || ComposedComponent.name;
  WrapperComponent.displayName = `withStyles(${name})`;

  return (forwardRef<unknown, ComposedComponentPropsWithOutCn>((props, ref) => (
    <WrapperComponent forwardedRef={ref} {...props} />
  )) as unknown) as ComponentType<Omit<ComposedComponentProps, 'cn'>> &
    RefAttributes<unknown>;
};

export default withStyles;
