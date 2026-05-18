import Markdown from 'react-native-markdown-display';
import { StyleSheet } from 'react-native';
import { colors } from '../theme';

type AurenMarkdownTextProps = {
  children: string;
};

export function AurenMarkdownText({ children }: AurenMarkdownTextProps) {
  return <Markdown style={markdownStyles}>{children}</Markdown>;
}

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 16.5,
    lineHeight: 23,
    letterSpacing: -0.18,
    fontWeight: '400',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  heading1: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.45,
    marginTop: 6,
    marginBottom: 12,
  },
  heading2: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.32,
    marginTop: 6,
    marginBottom: 10,
  },
  heading3: {
    color: colors.text,
    fontSize: 17.5,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.24,
    marginTop: 4,
    marginBottom: 8,
  },
  strong: {
    color: colors.text,
    fontWeight: '700',
  },
  bullet_list: {
    marginTop: 0,
    marginBottom: 12,
  },
  ordered_list: {
    marginTop: 0,
    marginBottom: 12,
  },
  list_item: {
    marginBottom: 7,
  },
  bullet_list_icon: {
    color: colors.muted,
    fontSize: 16.5,
    lineHeight: 23,
  },
  ordered_list_icon: {
    color: colors.muted,
    fontSize: 16.5,
    lineHeight: 23,
    fontWeight: '600',
  },
  fence: {
    backgroundColor: 'rgba(17,24,39,0.045)',
    color: colors.text,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  code_inline: {
    backgroundColor: 'rgba(17,24,39,0.05)',
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
