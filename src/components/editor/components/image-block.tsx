import type { Editor } from '@tiptap/react';

import { usePopover } from 'minimal-shared/hooks';
import { useRef, useState, useCallback } from 'react';

import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { uploadFileToCloudinaryFolder } from 'src/utils/cloudinary-content-upload';

import { toast } from 'src/components/snackbar';

import { editorClasses } from '../classes';
import { ToolbarItem } from './toolbar-item';

import type { EditorToolbarItemProps } from '../types';

// ----------------------------------------------------------------------

const DEFAULT_IMAGE_FOLDER = 'editor';

// ----------------------------------------------------------------------

type ImageBlockProps = Pick<EditorToolbarItemProps, 'icon'> & {
  editor: Editor;
  /** Cloudinary folder (e.g. 'announcements/uuid'). Defaults to 'editor'. */
  uploadFolder?: string;
  /** When true, store image as data URL in content (no Cloudinary upload until later). */
  deferUpload?: boolean;
};

type ImageFormState = {
  imageUrl: string;
  altText: string;
};

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ImageBlock({ editor, icon, uploadFolder, deferUpload }: ImageBlockProps) {
  const folder = uploadFolder ?? DEFAULT_IMAGE_FOLDER;
  const { anchorEl, open, onOpen, onClose } = usePopover();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<ImageFormState>({
    imageUrl: '',
    altText: '',
  });

  const handleApplyUrl = useCallback(() => {
    if (!state.imageUrl.trim()) return;
    onClose();
    editor.chain().focus().setImage({ src: state.imageUrl.trim(), alt: state.altText }).run();
    setState({ imageUrl: '', altText: '' });
  }, [editor, onClose, state.altText, state.imageUrl]);

  const resetState = useCallback(() => {
    setState({ imageUrl: '', altText: '' });
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Please choose a JPEG, PNG, GIF, or WebP image.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      if (deferUpload) {
        try {
          setUploading(true);
          const dataUrl = await readFileAsDataUrl(file);
          editor.chain().focus().setImage({ src: dataUrl, alt: state.altText }).run();
          onClose();
          resetState();
          toast.success('Image added. It will be uploaded when you create the announcement.');
        } catch {
          toast.error('Failed to add image.');
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
        return;
      }
      setUploading(true);
      try {
        const url = await uploadFileToCloudinaryFolder(file, folder);
        editor.chain().focus().setImage({ src: url, alt: state.altText }).run();
        onClose();
        resetState();
        toast.success('Image added.');
      } catch (err) {
        console.error('Upload error:', err);
        toast.error('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [editor, folder, deferUpload, onClose, resetState, state.altText]
  );

  const popoverId = open ? 'image-popover' : undefined;

  return (
    <>
      <ToolbarItem
        aria-describedby={popoverId}
        aria-label="Insert image"
        className={editorClasses.toolbar.image}
        onClick={onOpen}
        icon={icon}
      />

      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 2.5,
              gap: 1.5,
              width: 1,
              maxWidth: 320,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Typography variant="subtitle2">Add image</Typography>

        <Button
          component="label"
          variant="contained"
          size="small"
          disabled={uploading}
          sx={{ alignSelf: 'flex-start' }}
        >
          {uploading
            ? deferUpload
              ? 'Uploading…'
              : 'Uploading…'
            : deferUpload
              ? 'Upload image'
              : 'Upload image'}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handleFileChange}
          />
        </Button>

        <Typography variant="caption" color="text.secondary">
          or paste URL below
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Image URL"
          value={state.imageUrl}
          onChange={(event) => setState((prev) => ({ ...prev, imageUrl: event.target.value }))}
        />

        <TextField
          fullWidth
          size="small"
          placeholder="Alt text (optional)"
          value={state.altText}
          onChange={(event) => setState((prev) => ({ ...prev, altText: event.target.value }))}
        />

        <Button
          variant="contained"
          disabled={!state.imageUrl.trim()}
          onClick={handleApplyUrl}
          sx={{ alignSelf: 'flex-end' }}
        >
          Apply URL
        </Button>
      </Popover>
    </>
  );
}
