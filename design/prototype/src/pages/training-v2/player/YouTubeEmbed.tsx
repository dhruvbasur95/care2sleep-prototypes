/**
 * A real YouTube video inside a `<Video block>`, for the slots where an asset
 * now exists. Chapter 1's Know What video is the first of them; every other
 * video block still renders `VideoPlaceholder`, which remains the default.
 *
 * ## Privacy: `youtube-nocookie.com`, not `youtube.com`
 * Deliberate, and worth keeping. This is a research platform whose users are
 * aged-care workers enrolled in a study, and the standard `youtube.com/embed`
 * host sets tracking cookies on page load whether or not anyone presses play.
 * The `-nocookie` host defers that until playback actually starts. Same player,
 * same video id, no behavioural difference for the coach.
 *
 * `referrerPolicy="strict-origin-when-cross-origin"` is the second half of the
 * same thought — it stops the full slide URL (which carries the module and
 * chapter a given coach is sitting on) being handed to Google as a referrer.
 */

/**
 * Pull the 11-character video id out of whatever YouTube's Share button
 * produced.
 *
 * Three forms are in circulation and the data field accepts all of them
 * (`youtu.be/ID`, `watch?v=ID`, `/embed/ID`), because whoever fills a link in
 * will paste what they were given rather than normalise it first. Share links
 * also carry a `si=` tracking parameter, which is dropped here: it identifies
 * the share, not the video, and forwarding it would attach the sharer's token
 * to every coach's playback.
 *
 * Returns `null` on anything unrecognised rather than guessing — the caller
 * then falls back to the placeholder, which is a better failure than an iframe
 * pointed at a malformed id.
 */
function youTubeVideoId(url: string): string | null {
  const id = (() => {
    try {
      const u = new URL(url)
      if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1)
      if (u.pathname.startsWith('/embed/')) return u.pathname.slice('/embed/'.length)
      return u.searchParams.get('v')
    } catch {
      // Not a URL at all — accept a bare id, since that is the other thing
      // someone might reasonably paste.
      return url
    }
  })()

  return id && /^[\w-]{11}$/.test(id) ? id : null
}

export function YouTubeEmbed({ source, title }: { source: string; title: string }) {
  const id = youTubeVideoId(source)
  if (!id) return null

  return (
    // 16:9 is YouTube's own frame. The wrapper carries the radius and clips the
    // iframe's square corners, which an iframe will not round on its own.
    <div className="aspect-video w-full overflow-hidden rounded-md bg-ink">
      <iframe
        className="size-full"
        // `title` is the iframe's accessible name. Without it a screen reader
        // announces only "iframe", and this is the whole lesson on the slide.
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        // The player needs these to offer fullscreen and picture-in-picture;
        // the list is YouTube's own recommended set, minus `autoplay`, which is
        // deliberately absent — a video that starts itself is hostile on a
        // slide the coach may have reached while reading.
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        // The player is ~1MB of script; a slide the coach never reaches should
        // not pay for it. Every video block sits below the fold of its own
        // slide, so this reliably defers rather than merely reordering.
        loading="lazy"
      />
    </div>
  )
}
