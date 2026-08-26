-- Keep the optional attribution entered on a strategy separate from the
-- owning Bluesky account identity. The public feed needs both values so a
-- profile-owned strategy can continue to display labels such as Nat • Missouri.

ALTER TABLE strategies ADD COLUMN contributor_name TEXT;
ALTER TABLE strategies ADD COLUMN contributor_location TEXT;

-- Preserve the attribution on the 40 Nat strategies migrated from the static
-- catalog. Future edits and profile syncs maintain these columns through the API.
UPDATE strategies
SET contributor_name = 'Nat', contributor_location = 'Missouri'
WHERE author_did = 'did:plc:w23qsgdsux3neuguxfy7kvt5'
  AND client_key IN (
    'legacy-nat-call-a-friend',
    'inv-mt1h15e3-jpxysy',
    'legacy-nat-cuddle-your-favorite-stuffed-animal',
    'legacy-nat-self-holding',
    'legacy-nat-play-an-instrument',
    'legacy-nat-smell-something',
    'legacy-nat-call-a-parent',
    'legacy-nat-tend-to-a-plant',
    'legacy-nat-share-your-strategies',
    'legacy-nat-try-meetup',
    'legacy-nat-crunch-the-numbers',
    'legacy-nat-stare-off',
    'legacy-nat-listen',
    'legacy-nat-write',
    'legacy-nat-view-previous-things-you-ve-written-or-made',
    'legacy-nat-make-art',
    'legacy-nat-clean-something',
    'legacy-nat-go-on-walk',
    'legacy-nat-listen-to-music',
    'legacy-nat-make-a-request-in-conversation',
    'legacy-nat-view-art-that-you-connect-to',
    'inv-mlix95in-1zuxhr',
    'legacy-nat-road-trip',
    'legacy-nat-no-man-s-sky',
    'legacy-nat-schedule-your-day',
    'legacy-nat-reduce-mental-tasks',
    'legacy-nat-play-a-social-video-game',
    'legacy-nat-read-a-character-driven-novel',
    'legacy-nat-mindfulness-trust',
    'legacy-nat-write-a-letter',
    'legacy-nat-compassionate-meditation',
    'legacy-nat-make-a-list-and-check-things-off',
    'legacy-nat-watch-a-comfort-show',
    'legacy-nat-honor-reflection-meditation',
    'legacy-nat-request-a-clear-request',
    'legacy-nat-charity-work',
    'legacy-nat-sing',
    'legacy-nat-read-a-poem-you-like-aloud',
    'legacy-nat-stand-largely',
    'legacy-nat-volunteering-acts-of-kindness'
  );
