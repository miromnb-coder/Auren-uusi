import Markdown from 'react-native-markdown-display';
import { StyleSheet } from 'react-native';
import { colors } from '../theme';

type AurenMarkdownTextProps = {
  children: string;
};

export function AurenMarkdownText({ children }: AurenMarkdownTextProps) {
  return <Markdown style={markdownStyles}>{normalizeMarkdownForMobile(children)}</Markdown>;
}

function normalizeMarkdownForMobile(markdown: string) {
  const lines = markdown.split('\n');
  const normalizedLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1];

    if (isMarkdownTableRow(line) && isMarkdownTableSeparator(nextLine)) {
      const headers = parseTableCells(line);
      index += 1;

      while (index + 1 < lines.length && isMarkdownTableRow(lines[index + 1])) {
        index += 1;
        const cells = parseTableCells(lines[index]);
        const convertedLine = convertTableRowToBullet(headers, cells);

        if (convertedLine) {
          normalizedLines.push(convertedLine);
        }
      }

      normalizedLines.push('');
      continue;
    }

    if (isMarkdownTableSeparator(line)) {
      continue;
    }

    if (isMarkdownTableRow(line)) {
      const cells = parseTableCells(line);
      normalizedLines.push(`- ${cells.join(' — ')}`);
      continue;
    }

    normalizedLines.push(line);
  }

  return normalizedLines.join('\n').trim();
}

function isMarkdownTableRow(line?: string) {
  if (!line) return false;

  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 4;
}

function isMarkdownTableSeparator(line?: string) {
  if (!line) return false;

  const cells = parseTableCells(line);
  if (cells.length === 0) return false;

  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseTableCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function convertTableRowToBullet(headers: string[], cells: string[]) {
  if (cells.length === 0) return null;

  const [firstCell, ...restCells] = cells;
  const restParts = restCells
    .map((cell, index) => {
      const header = headers[index + 1];
      return header ? `${header}: ${cell}` : cell;
    })
    .filter(Boolean);

  if (restParts.length === 0) {
    return `- ${firstCell}`;
  }

  return `- **${firstCell}** — ${restParts.join(' — ')}`;
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
