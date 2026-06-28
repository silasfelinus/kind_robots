# ArtCollection image parity

Each Dream-created ArtCollection points at a matching public image folder:

```text
public/images/artcollections/<dream-slug>/
```

The batch Dream creator seeds three ArtImage records first:

```text
/images/artcollections/<dream-slug>/<dream-slug>-card.webp
/images/artcollections/<dream-slug>/<dream-slug>-icon.webp
/images/artcollections/<dream-slug>/<dream-slug>-hero.webp
```

Drop screenshots, mockups, and inspiration images into the same folder, then attach matching ArtImage rows to the Dream collection. The public URL should omit `public`, for example:

```text
/images/artcollections/<dream-slug>/<extra-image>.webp
```
