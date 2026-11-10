# Turning on live score sharing

Fifteen minutes, free, no credit card. Everyone who enters the same league
code then sees the same fixtures, scores and table, and can watch any match
clock tick live from their own phone.

## 1. Create the project

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. **Create a project** -> name it `saturday-league` -> Google Analytics can be
   **off** -> Create.

## 2. Create the database

1. Left sidebar: **Build -> Realtime Database** -> **Create Database**.
   (Realtime Database, *not* Firestore - the app uses the former.)
2. Pick the location closest to you.
3. Choose **Start in test mode** -> Enable.

Test mode leaves it open to anyone for 30 days. Step 4 fixes that.

## 3. Get the config

1. Project Overview -> the web icon `</>` -> register an app, nickname
   `saturday-league`, no hosting needed -> Register app.
2. Copy the `firebaseConfig` object it shows.
3. Paste the values into `docs/firebase-config.js` over the `YOUR_...`
   placeholders. `databaseURL` must be filled in - if the snippet omits it,
   copy it from the Realtime Database page. It looks like
   `https://saturday-league-default-rtdb.firebaseio.com`.

These values are not secrets. They identify the project; the rules below are
what control access.

## 4. Lock it down

Realtime Database -> **Rules** tab -> replace with:

    {
      "rules": {
        "leagues": {
          "$code": {
            ".read": true,
            ".write": true,
            ".validate": "$code.length >= 4"
          }
        }
      }
    }

Publish. Anyone who knows your league code can read and write that league -
which is the point - but nothing else, and a code must be at least four
characters. Pick something unguessable like `SAT-7K2M`, not `TEST`.

For something properly private later: turn on Anonymous Authentication and
change `.read`/`.write` to `"auth != null"`.

## 5. Publish and share

    ./deploy.sh update "live scores"

Each player opens the site, goes to **Setup -> Live sharing**, types the same
league code, taps **Join**.

## How it behaves

- Whoever taps Start on a match becomes the **referee**: their phone owns the
  clock and the goal buttons.
- Everyone else gets a **Live now** banner on the fixtures tab with the score
  and a ticking countdown of the referee's clock. Tapping it opens the full
  read-only match view.
- If the referee's phone dies, anyone can open the match and tap **Take over
  as referee**.
- Results, team names, colours and match length sync to every phone.
- No connection? Each phone keeps working on its own copy and catches up when
  it reconnects.

## Cost

The free Spark plan covers 100 simultaneous connections and 1 GB of transfer
a month. A league like this uses a few kilobytes a Saturday.
