export default {
  async fetch(request: Request, env: any): Promise<Response> {

    const text = await request.text();

    console.log("RAW UPDATE:", text);

    try {
      const update = JSON.parse(text);

      if (!update.message) {
        return new Response("no message");
      }

      const chatId = update.message.chat.id;
      const msg = update.message.text;

      let reply = "бот жив";

      if (msg === "/start") reply = "🛒 старт";
      if (msg === "/catalog") reply = "📦 каталог";

      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      });

      return new Response("ok");

    } catch (e) {
      return new Response("bad json");
    }
  }
};
