/* Full-time notifications.
 *
 * The referee's phone writes an absolute `endAt` to the league's /live node the
 * moment a match kicks off. That write is all we need: a Cloud Task is booked
 * for that instant, and it fires the push whether the referee's phone is awake,
 * asleep, locked or in a bag. Pause, reset, take-over and the final whistle all
 * rewrite /live, so each of those re-books or cancels the task in turn.
 */

const { onValueWritten } = require("firebase-functions/v2/database");
const { onTaskDispatched } = require("firebase-functions/v2/tasks");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getFunctions } = require("firebase-admin/functions");
const { getMessaging } = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

initializeApp();

const REGION = "asia-southeast1";          // where the database lives
const INSTANCE = "saturday-league-20e39-default-rtdb";

/* Cloud Tasks names allow letters, digits, hyphens and underscores only, and
 * the name is what lets us cancel a booking we no longer want. Same match and
 * same end time means the same name, so a harmless rewrite of /live (a goal,
 * say) leaves the existing task alone. */
function taskName(code, live) {
  return [code.replace(/[^A-Za-z0-9_-]/g, ""), live.matchId, live.endAt].join("-");
}

exports.bookFullTime = onValueWritten(
  { ref: "/leagues/{code}/live", instance: INSTANCE, region: REGION },
  async (event) => {
    const code = event.params.code;
    const live = event.data.after.val();
    const db = getDatabase();
    const bookRef = db.ref(`leagues/${code}/_task`);

    // a running clock with an end time still in the future is the only thing worth booking
    const wanted = live && live.running && live.endAt && live.endAt > Date.now()
      ? taskName(code, live)
      : null;

    const booked = (await bookRef.get()).val();
    if (booked === wanted) return;

    const queue = getFunctions().taskQueue("fullTime", undefined, REGION);

    if (booked) {
      await queue.delete(booked).catch((e) => logger.warn("cancel failed", booked, e.message));
    }
    if (wanted) {
      await queue.enqueue(
        { code: code, matchId: live.matchId, endAt: live.endAt },
        { id: wanted, scheduleTime: new Date(live.endAt) }
      ).catch((e) => logger.error("booking failed", wanted, e.message));
    }
    await bookRef.set(wanted);
  }
);

exports.fullTime = onTaskDispatched(
  { region: REGION, retryConfig: { maxAttempts: 3 }, rateLimits: { maxConcurrentDispatches: 10 } },
  async (request) => {
    const { code, matchId, endAt } = request.data;
    const db = getDatabase();
    const live = (await db.ref(`leagues/${code}/live`).get()).val();

    /* The clock may have moved on between booking and firing — paused, reset,
     * taken over, or the match closed. Only the booking that still matches the
     * live node gets to blow the whistle. */
    if (!live || !live.running || live.matchId !== matchId || live.endAt !== endAt) {
      logger.info("stale booking, no push", code, matchId);
      return;
    }

    const tokens = (await db.ref(`leagues/${code}/push`).get()).val() || {};
    const entries = Object.entries(tokens)
      .map(([device, row]) => [device, row && row.token])
      .filter(([, token]) => typeof token === "string" && token.length > 0);
    if (!entries.length) return;

    const doc = (await db.ref(`leagues/${code}/doc`).get()).val() || {};
    const body = describe(doc, live);

    const result = await getMessaging().sendEachForMulticast({
      tokens: entries.map(([, token]) => token),
      data: { title: "Full time", body: body, code: code, matchId: String(matchId) },
      webpush: { headers: { Urgency: "high", TTL: "600" } }
    });

    // a token the device has thrown away only wastes a send; drop it
    const dead = {};
    result.responses.forEach((response, i) => {
      const reason = response.error && response.error.code;
      if (reason === "messaging/registration-token-not-registered" ||
          reason === "messaging/invalid-registration-token") {
        dead[entries[i][0]] = null;
      }
    });
    if (Object.keys(dead).length) await db.ref(`leagues/${code}/push`).update(dead);

    logger.info("full time pushed", code, matchId, result.successCount + "/" + entries.length);
  }
);

/* "Reds 2 – 1 Blues", falling back to the match number when the fixtures
 * have not reached the database yet. */
function describe(doc, live) {
  const matches = Array.isArray(doc.matches) ? doc.matches : [];
  const match = matches.find((m) => m && m.id === live.matchId);
  const teams = Array.isArray(doc.teams) ? doc.teams : [];
  const nameOf = (id) => {
    const team = teams.find((t) => t && t.id === id);
    const name = team && team.name;
    return typeof name === "string" && name.trim() ? name.trim() : "Team " + id;
  };
  if (!match) return "Match " + live.matchId + " has finished.";
  return nameOf(match.home) + " " + (live.hg || 0) + " – " + (live.ag || 0) + " " + nameOf(match.away);
}
