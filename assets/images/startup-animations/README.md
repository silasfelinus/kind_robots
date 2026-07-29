# Startup refresh animations

Place short looping animated WebP files in this directory.

## Naming

Files must match:

```text
launch-*.webp
```

Recommended names:

```text
launch-01.webp
launch-02.webp
launch-03.webp
```

The refresh splash discovers every matching file at build time and chooses one randomly. No manifest or code update is required when adding or removing files.

If this directory contains no matching WebP files, or a selected file fails to load, the splash falls back to:

```text
/public/images/kindlogo_new.webp
```

Keep each loop lightweight because the refresh splash is displayed for approximately two seconds. A square source around 512×512 or 768×768 is recommended.
