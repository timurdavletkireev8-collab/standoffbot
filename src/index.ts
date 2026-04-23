export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const update = await request.json();

    if (update.message) {
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
