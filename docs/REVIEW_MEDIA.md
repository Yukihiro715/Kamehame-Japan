# Review photos and videos

Guests can add up to five photos or videos (photos ≤ 12 MB, videos ≤ 100 MB) to the review form at `/{lang}/review/`, and tick a separate, optional permission for KAMEHAME JAPAN to use them on the website and social media. The review itself still needs the publishing consent (first name only).

## Where the files go

- Each file is uploaded from the browser to `POST /api/review/upload?id=<upload id>&n=<index>&name=<file>` (lib/review-media.ts) and stored in the **MEDIA** R2 bucket as `reviews/<yyyy-mm>/<upload id>/<index>-<name>.<ext>`. The bucket has no public URL.
- When the review is sent, `POST /api/review` writes `reviews/<yyyy-mm>/<upload id>/meta.json` beside the files: text, rating, guest details, `consent` (publish the review) and `mediaConsent` (site / SNS use of the files), and the list of files that really exist under that id.
- Photos are still attached (shrunk) to the staff email as before; the email also lists the stored files and says whether site / SNS use was permitted.

## Staff

- `/ops/reviews/` lists the submissions newest first with thumbnails, inline video, download links (`/api/portal/ops/media?key=…`, ops sign-in required) and a badge for the media permission. Only material marked **許諾あり** may be used on the site or social media.
- Publishing the review text is still manual: match the booking, then add it to lib/reviews.ts (`source: "direct"`, `verified: true`). Photos for the site go to public/images/reviews/ by hand.
- A guest can withdraw the permission or ask for deletion by email (lib/privacy.ts says so); delete the objects in the bucket and stop using the material.

## Bucket and deploy

- The deploy workflows run `scripts/ensure-r2.sh` (`kamehame-media` on production, `kamehame-media-staging` on staging) and pass the name as `KAMEHAME_R2_BUCKET` to the build, which binds it as `MEDIA` (vite.config.ts). The API token needs **Workers R2 Storage: Edit**; if the step fails, the Worker is deployed without the binding, the upload endpoint answers 503, and the form sends photos by email only (videos are skipped with a note to the guest).
- Locally, `wrangler dev --local` keeps a bucket named `kamehame-media` on disk.
