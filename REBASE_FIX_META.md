# Fix git rebase conflict in public/meta.json

When you run `git rebase dev` and get:

```
CONFLICT (content): Merge conflict in public/meta.json
```

## Steps

1. **Open** `public/meta.json`. You’ll see conflict markers like:
   ```
   <<<<<<< HEAD
   { "version": "1.17.5", "buildTime": "..." }
   =======
   { "version": "1.17.5", "buildTime": "..." }
   >>>>>>> d375eeb... update
   ```

2. **Replace the whole file** with this (single valid JSON, no markers):
   ```json
   {
     "version": "1.17.5",
     "buildTime": "2026-01-29T00:44:23.949Z"
   }
   ```
   (Use the **higher** version number if one side is different, and keep one `buildTime`.)

3. **Stage and continue:**
   ```bash
   git add public/meta.json
   git rebase --continue
   ```

4. If more conflicts appear, resolve them the same way, then `git add` and `git rebase --continue` again.

5. To **abort** the rebase instead:
   ```bash
   git rebase --abort
   ```
