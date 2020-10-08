import styled, { css } from 'styled-components';

export const SectionItemsList = styled.ul`
  margin: 0;
  padding: 0;
  border: 0;
  list-style: none;
`;

export const UnorderedList = styled.ul`
  margin: 0;
  margin-bottom: 15px;
  padding: 0;
  list-style: none;
  margin-left: 1rem;
`;

export const Anchor = styled.a<{ active: boolean }>`
  display: inline-block;
  text-decoration: none;
  margin-left: 16px;
  height: 24px;
  color: #5c5c70;
  transition: color 0.1s;

  &:hover {
    color: #0a0d36;
  }

  ${({ active }) =>
    active &&
    css`
      font-weight: bold;
      color: #0d66e5;
    `}

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SubInstrumentedAnchor = styled(Anchor)<{ active: boolean }>`
  margin-left: 16px;
  padding-left: 16px;

  ${({ active }) =>
    active &&
    css`
      font-weight: bold;
      color: #0d66e5;
    `}
`;

export const ListItem = styled.li`
  padding: 0;
  margin: 0;
  font-size: 14px;
  line-height: 24px;
`;

export const Row = styled.div`
  display: flex;
`;
