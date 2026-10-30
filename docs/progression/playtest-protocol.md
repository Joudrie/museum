# Step 17: playtest protocol

Three parts, in this order: **first-time think-aloud sessions**, a **two-week diary study** on a
closed beta, and the **questionnaire** both use. None of the testers may be the developers or
anyone who has seen the game.

## Who

- **5 to 8** people for the think-aloud round. Nielsen's rule of thumb is that five users turn up
  most usability problems; the extra three let you split them between the `on` and `off` builds.
- **20 to 40** for the diary beta. Enough to see patterns in why people stop; far too few to
  measure retention differences (experiments.md has the numbers that needs).
- **Adults (18+)** only, on their own iPhone.
- **Recruit by motivation.** Ask each candidate to take Quantic Foundry's free Gamer Motivation
  Profile and send a screenshot of the result. Prefer people high on Completion, Design, Discovery
  or Fantasy (diagnosis.md, step 7), and include two or three who are not, as a check on the
  target.

## A. First-time think-aloud (30 minutes each)

**Before.** Consent (below). Fresh install on their phone: the game link with `?beta=1` for the
`on` group or `?beta=1&progression=off` for the `off` group (alternate who gets which). Start iOS
screen recording with the microphone on.

**The 15-minute play.** Follow the strip-test script in diagnosis.md for both groups. The observer
says only: "Play however you like, and say what you're thinking." If silent for 20 seconds: "What
are you thinking about?" Never point.

**Observer sheet, one row per moment:**

| Time | What they did | What they said (verbatim) | Confused? | Delight? | Quit-ish? |
|---|---|---|---|---|---|

**What to watch for in the `on` group** (the progression layer): whether they open the Journal to
see their rank or notice the XP tick at all (#217 took the numbers off the screen), whether a rank ceremony makes them stop or carry on, and whether they mention
rank or a task when asked what's next. In both groups: how they play the reel (do they get better at
it in 15 minutes?) and what they say when a fish escapes and its silhouette shows.

**End-of-session questions, in this order:**
1. "What would you do next?" (write it word for word)
2. "What was the best moment? The worst?"
3. "Would you open this again tomorrow? Why, or why not?"
4. The questionnaire below.
5. With the `?evlog` panel: tap **Share file** and send the log (it pairs the words with the events).

## B. Two-week diary beta

**Setup.** Send each tester the beta link (`?beta=1`, half with `&progression=off`). The consent
card appears once; telemetry flows only if they say yes and only once the PostHog key is set
(telemetry.md). Each Sunday they open `?evlog` and share the file as a backup.

**Every evening, a two-minute check-in** (a form or a reply to a text; same questions daily):

1. Did you play today? (yes / no)
2. If no: why not? (free text)
3. If yes: what did you do? What were you hoping to find or finish?
4. How long did you mean to play? How long did you play? (this is the "intended vs actual" measure)
5. Did anything make you stop? (free text)
6. Tomorrow, is there something you want to do in the game? What?
7. (`on` group only, once a week) Did a task, the login calendar or your streak decide whether you
   opened the game today? (yes / no / partly)

**Day 7 and day 14**: the questionnaire again, plus "If this cost a few dollars a month, would you
keep it? What would make it worth that?"

**Exit interview** (15 minutes, for anyone who stops for 3 days or more): "When did it stop being
something you wanted to open? What was the last thing you did?" Match their answer to the last
events in their log.

## C. The questionnaire

**PENS** (Player Experience of Need Satisfaction) is the standard self-determination-theory measure
for games: 21 items on a 7-point scale, with competence, autonomy, relatedness, presence and
intuitive controls subscales. It is owned by Immersyve and is not free to use, so license it
first. If that isn't practical, the **Ubisoft Perceived Experience Questionnaire (UPEQ;
Azadvar & Canossa, FDG 2018)** is a published SDT-based alternative covering the same three needs.
Use one instrument for the whole study; don't mix them.

Add two of our own, 1 to 7:
- "I wanted to keep playing even when nothing was asking me to." (intrinsic pull)
- "I knew what I wanted to do next." (goal clarity)

## Consent and recording checklist

- [ ] Plain-language consent read and agreed before anything starts: what's recorded (screen,
      voice, the game's event log), who sees it (the developers only), how long it's kept
      (deleted 90 days after the study), and that they can stop at any time without giving a reason.
- [ ] Confirmed the tester is 18 or older.
- [ ] Screen recording on, microphone on, notifications silenced (Do Not Disturb).
- [ ] Fresh install with the right build link written in the observer sheet.
- [ ] No personal details in the recording (they can turn the camera off; no account sign-in exists).
- [ ] After: recording, log and observer sheet saved under the tester's number, never their name.
- [ ] Telemetry consent asked on the card, separately from the study consent.
- [ ] Gift or thank-you sent; ask whether they'd like to hear about the next round.
