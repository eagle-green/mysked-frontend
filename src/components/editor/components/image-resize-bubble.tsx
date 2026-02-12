import type { Editor } from '@tiptap/react';

import { useState, useEffect } from 'react';
import { NodeSelection } from '@tiptap/pm/state';
import { BubbleMenu } from '@tiptap/react/menus';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { editorClasses } from '../classes';

// ----------------------------------------------------------------------

type ImageResizeBubbleProps = {
  editor: Editor;
};

function getImageAttrs(editor: Editor): { width: number | null; height: number | null } {
  const { state } = editor;
  const { selection } = state;
  if (!(selection instanceof NodeSelection) || selection.node?.type?.name !== 'image') {
    return { width: null, height: null };
  }
  const attrs = selection.node.attrs as { width?: number; height?: number };
  return {
    width: attrs.width != null && Number(attrs.width) > 0 ? Number(attrs.width) : null,
    height: attrs.height != null && Number(attrs.height) > 0 ? Number(attrs.height) : null,
  };
}

export function ImageResizeBubble({ editor }: ImageResizeBubbleProps) {
  const attrs = getImageAttrs(editor);
  const [width, setWidth] = useState<string>(attrs.width != null ? String(attrs.width) : '');
  const [height, setHeight] = useState<string>(attrs.height != null ? String(attrs.height) : '');

  useEffect(() => {
    setWidth(attrs.width != null ? String(attrs.width) : '');
    setHeight(attrs.height != null ? String(attrs.height) : '');
  }, [attrs.width, attrs.height]);

  const handleWidthChange = (value: string) => {
    setWidth(value);
    const n = value.trim() ? Number(value) : null;
    if (n !== null && Number.isFinite(n) && n > 0) {
      editor.chain().focus().updateAttributes('image', { width: n }).run();
    } else if (value.trim() === '') {
      editor.chain().focus().updateAttributes('image', { width: null }).run();
    }
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    const n = value.trim() ? Number(value) : null;
    if (n !== null && Number.isFinite(n) && n > 0) {
      editor.chain().focus().updateAttributes('image', { height: n }).run();
    } else if (value.trim() === '') {
      editor.chain().focus().updateAttributes('image', { height: null }).run();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageResizeBubble"
      shouldShow={({ state }) => {
        const { selection } = state;
        return selection instanceof NodeSelection && selection.node?.type?.name === 'image';
      }}
      >
      <BubbleRoot className={editorClasses.toolbar.root}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Image size
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="W"
            type="number"
            inputProps={{ min: 1, max: 2000 }}
            value={width}
            onChange={(e) => handleWidthChange(e.target.value)}
            sx={{ width: 72 }}
            slotProps={{ input: { sx: { py: 0.5, fontSize: '0.8125rem' } } }}
          />
          <Box sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>×</Box>
          <TextField
            size="small"
            placeholder="H"
            type="number"
            inputProps={{ min: 1, max: 2000 }}
            value={height}
            onChange={(e) => handleHeightChange(e.target.value)}
            sx={{ width: 72 }}
            slotProps={{ input: { sx: { py: 0.5, fontSize: '0.8125rem' } } }}
          />
          <Typography variant="caption" color="text.secondary">
            px
          </Typography>
        </Stack>
      </BubbleRoot>
    </BubbleMenu>
  );
}

const BubbleRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
  padding: theme.spacing(1, 1.25),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[8],
  backgroundColor: theme.vars.palette.background.paper,
  border: `1px solid ${theme.vars.palette.divider}`,
}));
