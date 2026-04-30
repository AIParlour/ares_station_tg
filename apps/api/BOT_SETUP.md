# Ares Station — Telegram Bot Setup

## 1. Create the bot via BotFather

Open Telegram and message [@BotFather](https://t.me/BotFather):

```
/newbot
```

BotFather will ask:
- **Name**: `Ares Station` (display name, can have spaces)
- **Username**: `AresStationBot` (unique, must end in `Bot`)

BotFather returns your **BOT_TOKEN** — copy it. It looks like:
```
7123456789:AAH1bGciOiJIUzI1NiIsInR5cCI6Ikp...
```

## 2. Configure the bot profile

Still in BotFather:

```
/setdescription
```
> You have been assigned to investigate the disappearance of the Ares Station crew. Paradox is online. Begin your investigation.

```
/setabouttext
```
> Mars mystery investigation game. Solve puzzles. Decrypt logs. Uncover the truth.

```
/setuserpic
```
> Upload a 640x640 avatar (the red Ares Station logo).

## 3. Enable the Mini App

```
/newapp
```

BotFather will ask:
- **Select bot**: choose `@AresStationBot`
- **Title**: `Ares Station`
- **Description**: `Incident Investigation Terminal`
- **Photo**: upload a 640x360 banner
- **GIF** (optional): skip
- **URL**: your deployed frontend URL (e.g. `https://ares.yourdomain.com`)
- **Short name**: `app`

This creates the Mini App at `https://t.me/AresStationBot/app`.

## 4. Set the menu button

```
/setmenubutton
```

- **Select bot**: `@AresStationBot`
- **Type**: Web App
- **Text**: `▶ INVESTIGATE`
- **URL**: your frontend URL

Now the bot's chat will show an "▶ INVESTIGATE" button that opens the Mini App directly.

## 5. Set bot commands

```
/setcommands
```

- **Select bot**: `@AresStationBot`
- Send:
```
start - Begin investigation
help - How to play
```

## 6. Add the token to your .env

In `poc/apps/api/.env`:

```env
BOT_TOKEN=7123456789:AAH1bGciOiJIUzI1NiIsInR5cCI6Ikp...
MINI_APP_URL=https://t.me/AresStationBot/app
```

For local dev without the bot, just leave `BOT_TOKEN` unset — the API runs fine without it.

## 7. Install dependency and start

```bash
cd poc/apps/api
npm install grammy
npm run dev
```

You should see:
```
[ares-api] listening on http://localhost:3000
[ares-bot] Bot is running
[ares-api] Daily notification sweep active (every 5 min)
```

## 8. Test it

1. Open your bot in Telegram: `https://t.me/AresStationBot`
2. Send `/start` — you should get the welcome message with a launch button
3. Tap "▶ OPEN ARES STATION" — the Mini App opens

## Notes

- **Polling vs Webhook**: The bot uses long polling (simpler for dev). For production, switch to webhooks — see [grammY webhook docs](https://grammy.dev/guide/deployment-types).
- **Daily notifications**: The server checks every 5 min for players whose next day just unlocked and sends them a push. Players who blocked the bot are silently skipped.
- **Dev mode**: Without `BOT_TOKEN` set, the bot simply doesn't start. The API works normally.
