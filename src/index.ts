export default {
  async fetch(request: Request, env: any): Promise<Response> {

    if (request.method !== "POST") {
      return new Response("ok");
    }

    let update;
    try {
      update = await request.json();
    } catch (e) {
      return new Response("bad request");
    }

    if (update?.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;

      let reply = "не понял команду";

      if (text === "/start") reply = "🛒 бот магазина работает";
      if (text === "/catalog") reply = "1. Товар A\n2. Товар B";

      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      });
    }

    return new Response("ok");
  }
};
