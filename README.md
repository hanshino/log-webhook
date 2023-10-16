# Log Webhook

Simple logfile watcher that sends a webhook when a new line is added to a file according to a configurable regex.

## Usage

```bash
FILENAME=/path/to/file.log && node index.js
```

### Docker

1. Build the image

   ```bash
   docker build -t log-webhook .
   ```

2. Run the image

   ```bash
   docker run -d \
     -v /path/to/file.log:/usr/app/src/file.log \
     -v /path/to/config.json:/usr/app/src/dist/config.json \
     -e FILENAME=file.log \
     --name log-webhook \
     log-webhook
   ```

## Configuration

Configuration should be set in a config.json file located in the root directory.

Below are the available options:

```json
{
  "webhook": {
    "type": "discord",
    "url": "https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz"
  },
  "triggers": [
    {
      "regex": "PlayerJoinGame .* playerIndex\\((\\d+)\\)",
      "message": "**Player {$1}** joined the game :rocket:",
      "type": "info"
    }
  ]
}
```

`triggers[].regex` is a regular expression that is matched against each line of the log file.

If a line in the log matches the regex, the webhook is triggered.
You can also define a custom message to be sent with the webhook.

You can use capture groups in the regex and reference them in the message with `{$1}`.

example:

**log file:**

```txt
...
44816.613 Info GameActionHandler.cpp:5078: UpdateTick (80881429) processed PlayerJoinGame peerID(3) playerIndex(2) mode(connect)
...
```

The JavaScript regex match for the above log line will produce the following array:

```js
[
  "PlayerJoinGame peerID(3) playerIndex(2) mode(connect)", // $0
  "2", // $1
];
```

The message will then be transformed to:

```txt
**Player 2** joined the game :rocket:
```
