import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';

const truncate = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SectionWrapper = styled.ul`
  user-select: none;
  list-style: none;
  margin: 0;
  overflow: hidden;
  width: 15rem;
`;

export const NavigationSection = styled.li`
  margin-bottom: 1.75rem;
`;

export const SectionTitle = styled.div`
  text-transform: uppercase;
  color: #0a0d36;
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.5rem;
  margin: 0;
  padding-left: 0.5rem;
  padding-bottom: 0.5rem;

  ${truncate}
`;

export const SectionItems = styled.ul`
  margin: 0;
  padding: 0;
`;

interface NavItemProps {
  isSelected: boolean;
  hasChildren?: boolean;
  isChild?: boolean;
}

export const NavItem = styled(motion.li)<NavItemProps>`
  list-style: none;
  margin-bottom: 0;
  font-size: 0.875rem;
  line-height: 1.5rem;
  padding: 0.25rem 0.5rem;
  width: fit-content;
  border-radius: 4px;
  max-width: ${({ isChild }) => (isChild ? '14rem' : '15rem')};

  ${({ hasChildren }) =>
    hasChildren &&
    css`
      padding-left: 0;
    `}

  ${({ hasChildren, isSelected }) =>
    !hasChildren &&
    isSelected &&
    css`
      background-color: #f6f6f6;
    `}

  ${({ hasChildren, isSelected }) =>
    hasChildren &&
    isSelected &&
    css`
      padding-right: 0;
      padding-bottom: 0;
    `}
`;

export const NavItemLink = styled.a<{ $isSelected: boolean; title: string }>`
  font-weight: 600;
  text-decoration: none;
  color: #5c5c70;
  display: block;
  cursor: pointer;

  ${truncate}

  &:hover {
    color: #0a0d36;
  }

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      color: #0a0d36;
      margin-bottom: 0.25rem;
    `}
`;

export const NavItemChildren = styled(motion.ul)`
  margin: 0 0 0 1rem;
  padding: 0;
`;

export const NavItemHeaderWrapper = styled.div`
  display: flex;

  &:hover {
    color: #0a0d36;
  }
`;

export const IconWrapper = styled(motion.div)`
  flex: 0 1 auto;
  padding: 0 0.5rem;
`;

export const NavItemIcon = styled(FontAwesomeIcon)<{ $isSelected: boolean }>`
  color: #878796;
  width: 0.5rem;

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      color: #0a0d36;
    `}
`;
